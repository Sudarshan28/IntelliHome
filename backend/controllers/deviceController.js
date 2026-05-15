const Device = require('../models/Device');
const { processFSMEvent } = require('../fsm/fsmEngine');

exports.getDevices = async (req, res) => {
  try {
    const devices = await Device.find();
    res.json(devices);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.addDevice = async (req, res) => {
  try {
    const newDevice = new Device(req.body);
    const device = await newDevice.save();
    req.app.get('io').emit('devices_updated', await Device.find());
    res.json(device);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.updateDeviceStatus = async (req, res) => {
  try {
    const device = await Device.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    req.app.get('io').emit('devices_updated', await Device.find());
    res.json(device);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.simulateSensor = async (req, res) => {
  try {
    const { eventType, value } = req.body;
    await processFSMEvent({ eventType, value }, req.app.get('io'));
    res.json({ msg: 'Event processed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};
