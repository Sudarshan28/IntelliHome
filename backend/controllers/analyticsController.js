const Device = require('../models/Device');
const Analytics = require('../models/Analytics');
const DeviceLog = require('../models/DeviceLog');

exports.getEnergyStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeDevices = await Device.find({ 
      userId: req.user.id, 
      status: { $in: ['CONNECTED', 'ACTIVE', 'IDLE'] } 
    });

    // Calculate current live load draw in kW
    let totalLiveLoad = 0;
    activeDevices.forEach(d => {
      totalLiveLoad += d.powerRating;
    });
    const currentLoadKw = (totalLiveLoad / 1000).toFixed(3);

    // 1. Weekly Consumption Query
    const barData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const endOfD = new Date(d);
      endOfD.setHours(23, 59, 59, 999);
      
      const dayLogs = await Analytics.find({ 
        timestamp: { $gte: d, $lte: endOfD }
      });
      
      let dailySum = 0;
      dayLogs.forEach(log => {
        dailySum += log.energyConsumed;
      });
      
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      barData.push({
        date: dateStr,
        fullDate: d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        energy: Number(dailySum.toFixed(3))
      });
    }

    // 2. Pie Chart distribution (Cumulative energy consumed today)
    const todayLogs = await Analytics.find({ timestamp: { $gte: today } });
    const distribution = {};
    const colors = ['#8b5cf6', '#2dd4bf', '#f43f5e', '#3b82f6', '#f59e0b', '#10b981', '#6366f1'];
    
    todayLogs.forEach(log => {
      if (!distribution[log.deviceName]) {
        distribution[log.deviceName] = 0;
      }
      distribution[log.deviceName] += log.energyConsumed;
    });
    
    let pieData = Object.keys(distribution).map((k, index) => ({
      name: k,
      value: Number(distribution[k].toFixed(3)),
      color: colors[index % colors.length]
    }));

    // Fallback: If no cumulative consumption recorded yet, use live active power distribution
    if (pieData.length === 0 && activeDevices.length > 0) {
      const activeDist = {};
      activeDevices.forEach(d => {
        if (!activeDist[d.name]) {
          activeDist[d.name] = 0;
        }
        activeDist[d.name] += d.powerRating;
      });

      pieData = Object.keys(activeDist).map((k, index) => ({
        name: k,
        value: activeDist[k],
        color: colors[index % colors.length]
      }));
    }

    res.json({ totalUsage: currentLoadKw, pieData, barData });
  } catch (err) {
    console.error('Analytics Fetch Error:', err);
    res.status(500).send('Server Error');
  }
};

exports.getActivityStats = async (req, res) => {
  try {
    const totalAutomations = await DeviceLog.countDocuments({ event: 'Automation Triggered' });
    const recentLogs = await DeviceLog.find().sort({ timestamp: -1 }).limit(10);
    
    // Calculate smart score based on security breaches
    const breaches = await DeviceLog.countDocuments({ stateAtTime: 'ALERT' });
    const score = Math.max(0, 100 - (breaches * 5));

    res.json({
      totalAutomations,
      smartScore: score,
      recentLogs
    });
  } catch (err) {
    console.error('Activity Fetch Error:', err);
    res.status(500).send('Server Error');
  }
};
