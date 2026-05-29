const Device = require('./models/Device');
const { transitionDeviceState } = require('./fsm/fsmEngine');

const socketDeviceMap = new Map(); // socket.id -> deviceId
const deviceSocketMap = new Map(); // deviceId -> socket.id

const initDeviceManager = (io) => {
  io.on('connection', (socket) => {
    console.log('Virtual device channel connected:', socket.id);

    // Register a virtual device (phone/laptop client)
    socket.on('register_virtual_device', async (data) => {
      try {
        const { deviceId, name, type, userId } = data;
        if (!deviceId) return;

        console.log(`Registering virtual device: ${name} [${type}] (${deviceId})`);

        // Find or create device in MongoDB
        let device = await Device.findOne({ mac: deviceId });
        
        const wattageMap = {
          'light': 15,
          'ac': 1500,
          'alarm': 10,
          'sensor': 5,
          'fridge': 350,
          'ev_charger': 7200,
          'tv': 120,
          'pc': 500,
          'camera': 15,
          'heater': 1500,
          'printer': 400,
          'laptop': 65,
          'phone': 18,
          'other': 75
        };
        const powerRating = wattageMap[type] || 50;

        const prevStatus = device ? device.status : 'DISCOVERED';

        if (device) {
          device.status = 'CONNECTED';
          device.name = name;
          device.type = type;
          device.powerRating = powerRating;
          await device.save();
        } else {
          device = new Device({
            userId,
            name,
            type,
            status: 'CONNECTED',
            mac: deviceId,
            ip: socket.handshake.address || '127.0.0.1',
            hostname: `${deviceId}.virtual.local`,
            vendor: 'Virtual Emulator',
            powerRating
          });
          await device.save();
        }

        // Keep socket association
        socketDeviceMap.set(socket.id, device._id.toString());
        deviceSocketMap.set(device._id.toString(), socket.id);

        // Join room and transition state
        socket.join('virtual_devices');
        await transitionDeviceState(device, prevStatus, 'CONNECTED', io, 'Virtual emulator connected');

        // Confirm registration to client
        socket.emit('registration_success', { deviceId: device._id });
        io.emit('devices_updated', await Device.find());

      } catch (err) {
        console.error('Failed to register virtual device:', err);
      }
    });

    // Handle telemetry updates from virtual client
    socket.on('virtual_telemetry', async (data) => {
      try {
        const { deviceId, status, uptime, energyConsumed } = data;
        const device = await Device.findById(deviceId);
        if (!device) return;

        // Sync state
        const prevStatus = device.status;
        device.status = status;
        device.uptime = uptime;
        device.onlineTime = uptime * 1000;
        device.lastSeen = new Date();
        await device.save();

        if (prevStatus !== status) {
          await transitionDeviceState(device, prevStatus, status, io, `Virtual telemetry reported status change`);
          io.emit('devices_updated', await Device.find());
        }
      } catch (err) {
        console.error('Failed to process virtual telemetry:', err);
      }
    });

    // Disconnection logic
    socket.on('disconnect', async () => {
      try {
        const deviceId = socketDeviceMap.get(socket.id);
        if (deviceId) {
          socketDeviceMap.delete(socket.id);
          deviceSocketMap.delete(deviceId);

          const device = await Device.findById(deviceId);
          if (device && device.status !== 'OFFLINE') {
            const prevStatus = device.status;
            device.status = 'OFFLINE';
            device.latency = 0;
            await device.save();

            await transitionDeviceState(device, prevStatus, 'OFFLINE', io, 'Virtual emulator disconnected');
            io.emit('devices_updated', await Device.find());
          }
        }
      } catch (err) {
        console.error('Error on virtual client disconnect:', err);
      }
    });
  });
};

// Control virtual device state (sent from dashboard)
const controlVirtualDevice = async (deviceId, actionPayload, io) => {
  const socketId = deviceSocketMap.get(deviceId.toString());
  if (socketId) {
    console.log(`Sending control action to virtual device ${deviceId}:`, actionPayload);
    io.to(socketId).emit('control_device', actionPayload);
    return true;
  }
  return false;
};

module.exports = { initDeviceManager, controlVirtualDevice };
