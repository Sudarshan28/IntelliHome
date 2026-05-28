const ping = require('ping');
const Device = require('../models/Device');
const { transitionDeviceState } = require('../fsm/fsmEngine');

const failCounter = new Map(); // deviceId -> failed pings count
const MONITORING_INTERVAL = 15000; // ping every 15 seconds

const startMonitoring = (io) => {
  console.log('Real-time Smart Device Monitoring service started.');
  
  setInterval(async () => {
    try {
      const devices = await Device.find({ 
        status: { $ne: 'DISCOVERED' } 
      });

      for (let device of devices) {
        if (!device.ip) continue;

        ping.sys.probe(device.ip, async (isAlive) => {
          try {
            const devId = device._id.toString();
            const currentStatus = device.status;
            
            if (isAlive) {
              // Reset fail count
              failCounter.set(devId, 0);

              // Ping statistics
              // Native ping execution to calculate round-trip latency
              ping.promise.probe(device.ip, { timeout: 2 }).then(async (res) => {
                const latency = res.time !== 'unknown' ? parseFloat(res.time) : 10;
                
                // Accumulate online stats
                const intervalSeconds = MONITORING_INTERVAL / 1000;
                device.latency = latency;
                device.uptime += intervalSeconds;
                device.onlineTime += MONITORING_INTERVAL;
                device.lastSeen = new Date();

                // State determination
                let nextStatus = currentStatus;
                if (currentStatus === 'OFFLINE' || currentStatus === 'PAIRING') {
                  nextStatus = 'CONNECTED';
                } else if (currentStatus === 'CONNECTED') {
                  // Transition from connected to active/idle to show activity
                  nextStatus = 'ACTIVE';
                }

                device.status = nextStatus;
                await device.save();

                if (currentStatus !== nextStatus) {
                  await transitionDeviceState(device, currentStatus, nextStatus, io, `Device responded to ping (latency: ${latency}ms)`);
                }
              });

            } else {
              // Increment fail count
              const fails = (failCounter.get(devId) || 0) + 1;
              failCounter.set(devId, fails);

              // If failed twice consecutively, mark OFFLINE
              if (fails >= 2 && currentStatus !== 'OFFLINE') {
                device.status = 'OFFLINE';
                device.latency = 0;
                await device.save();

                await transitionDeviceState(device, currentStatus, 'OFFLINE', io, `Device did not respond to pings (${fails} consecutive failures)`);
              }
            }
          } catch (innerErr) {
            console.error(`Error processing ping results for ${device.name}:`, innerErr);
          }
        });
      }

      // Emit global devices updated event to keep client dashboards fully synced
      const allDevices = await Device.find();
      io.emit('devices_updated', allDevices);

    } catch (err) {
      console.error('Monitoring service error:', err);
    }
  }, MONITORING_INTERVAL);
};

module.exports = { startMonitoring };
