const Device = require('../models/Device');
const DeviceLog = require('../models/DeviceLog');
const { discoverLocalDevices } = require('../services/discoveryService');
const { transitionDeviceState } = require('../fsm/fsmEngine');
const notify = require('../utils/notifier');

exports.getDevices = async (req, res) => {
  try {
    const devices = await Device.find({ userId: req.user.id });
    res.json(devices);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

exports.discoverDevices = async (req, res) => {
  try {
    const discovered = await discoverLocalDevices(req.user.id);
    res.json(discovered);
  } catch (err) {
    console.error('Discovery Error:', err);
    res.status(500).send('Failed to scan network');
  }
};

exports.addDevice = async (req, res) => {
  try {
    const { name, type, ip, mac, hostname, vendor, powerRating } = req.body;
    
    // Check if device is already registered by MAC
    let device = await Device.findOne({ userId: req.user.id, mac });
    
    if (device) {
      // Re-connect
      const prevStatus = device.status;
      device.status = 'CONNECTED';
      device.ip = ip;
      await device.save();
      await transitionDeviceState(device, prevStatus, 'CONNECTED', req.app.get('io'), 'Device re-connected and online');
    } else {
      // Create new device
      device = new Device({
        userId: req.user.id,
        name,
        type,
        ip,
        mac,
        hostname,
        vendor,
        powerRating,
        status: 'PAIRING' // Starts FSM lifecycle
      });
      await device.save();
      
      // Log pairing state
      const io = req.app.get('io');
      await transitionDeviceState(device, 'DISCOVERED', 'PAIRING', io, 'Device pairing initiated');
      
      // Complete registration: transition to CONNECTED
      device.status = 'CONNECTED';
      await device.save();
      await transitionDeviceState(device, 'PAIRING', 'CONNECTED', io, 'Smart device paired & registered successfully');
    }

    req.app.get('io').emit('devices_updated', await Device.find({ userId: req.user.id }));
    res.json(device);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

exports.disconnectDevice = async (req, res) => {
  try {
    const device = await Device.findOne({ _id: req.params.id, userId: req.user.id });
    if (!device) return res.status(404).json({ msg: 'Device not found' });

    const prevStatus = device.status;
    const io = req.app.get('io');

    // Create final log before deletion
    const log = new DeviceLog({
      deviceId: device._id,
      deviceName: device.name,
      event: 'Device Removed',
      action: `Unpaired and disconnected ${device.name} from IntelliHome`,
      stateAtTime: 'HOME'
    });
    await log.save();
    io.emit('fsm_action', log);

    // Notify user of disconnection via popup
    await notify('Device Disconnected', `${device.name} has been disconnected and unpaired.`, 'info', io);

    await Device.deleteOne({ _id: req.params.id });
    
    io.emit('devices_updated', await Device.find({ userId: req.user.id }));
    res.json({ msg: 'Device disconnected and unregistered' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

exports.updateDeviceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const device = await Device.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!device) return res.status(404).json({ msg: 'Device not found' });
    
    const prevStatus = device.status;
    device.status = status;
    await device.save();
    
    const io = req.app.get('io');
    await transitionDeviceState(device, prevStatus, status, io, `User manual override: status updated to ${status}`);
    
    io.emit('devices_updated', await Device.find({ userId: req.user.id }));
    res.json(device);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

exports.simulateSensor = async (req, res) => {
  try {
    const { deviceId, status, latency, powerUsage } = req.body;
    
    const device = await Device.findById(deviceId);
    if (!device) return res.status(404).json({ msg: 'Device not found' });
    
    const prevStatus = device.status;
    if (status) device.status = status;
    if (latency !== undefined) device.latency = Number(latency);
    if (powerUsage !== undefined) device.powerRating = Number(powerUsage);
    
    await device.save();
    
    const io = req.app.get('io');
    await transitionDeviceState(device, prevStatus, device.status, io, `Simulation Lab: triggered status event`);
    
    io.emit('devices_updated', await Device.find({ userId: device.userId }));
    res.json({ msg: 'Simulation event processed', device });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};
