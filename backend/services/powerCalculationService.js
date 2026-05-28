const Device = require('../models/Device');
const Analytics = require('../models/Analytics');

const POWER_INTERVAL = 15000; // run every 15 seconds

const startPowerCalculator = (io) => {
  console.log('Estimated Power Consumption Calculator service started.');

  setInterval(async () => {
    try {
      // Get all active/connected devices
      const activeDevices = await Device.find({ 
        status: { $in: ['CONNECTED', 'ACTIVE', 'IDLE'] } 
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let device of activeDevices) {
        // Calculate energy in kWh: (Watts * (seconds / 3600)) / 1000
        const intervalHours = POWER_INTERVAL / 3600000;
        const energyKwh = (device.powerRating * intervalHours);
        
        // Find or create daily analytics record for this device
        await Analytics.findOneAndUpdate(
          { 
            deviceId: device._id, 
            timestamp: { $gte: today } 
          },
          {
            $inc: { 
              energyConsumed: energyKwh, 
              activeTime: POWER_INTERVAL / 1000 
            },
            $setOnInsert: { 
              deviceName: device.name, 
              deviceType: device.type,
              timestamp: new Date()
            }
          },
          { upsert: true, new: true }
        );
      }

      // Calculate total current draw for the live feed
      let totalLiveUsage = 0;
      activeDevices.forEach(d => {
        totalLiveUsage += d.powerRating;
      });

      // Emit live total draw to Socket.io
      io.emit('live_power_update', {
        totalLiveUsageKw: (totalLiveUsage / 1000).toFixed(3),
        activeCount: activeDevices.length
      });

    } catch (err) {
      console.error('Power calculation service error:', err);
    }
  }, POWER_INTERVAL);
};

module.exports = { startPowerCalculator };
