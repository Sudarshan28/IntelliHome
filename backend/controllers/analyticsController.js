const Device = require('../models/Device');
const AutomationLog = require('../models/AutomationLog');

exports.getEnergyStats = async (req, res) => {
  try {
    // Calculate real dynamic energy based on device type and status
    const devices = await Device.find();
    
    // Base mock wattage per type
    const wattageMap = {
      'ac': 1200,
      'heater': 1500,
      'fridge': 400,
      'ev_charger': 7200,
      'tv': 150,
      'pc': 450,
      'light': 15,
      'alarm': 5,
      'sensor': 2,
      'camera': 10
    };

    let totalUsage = 0;
    let distribution = {};
    const colors = ['#8b5cf6', '#2dd4bf', '#f43f5e', '#3b82f6', '#f59e0b', '#10b981', '#6366f1'];

    devices.forEach(d => {
      if (d.status === 'on' || d.status === 'triggered') {
        const power = wattageMap[d.type] || 10;
        totalUsage += power;
        
        if (!distribution[d.name]) distribution[d.name] = 0;
        distribution[d.name] += power;
      }
    });

    // Formatting for pie chart
    const pieData = Object.keys(distribution).map((k, index) => ({
      name: k,
      value: distribution[k],
      color: colors[index % colors.length]
    }));

    // Authentic Weekly tracking starting from zero
    const barData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      barData.push({
        date: dateStr,
        fullDate: d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        energy: i === 0 ? Number((totalUsage / 1000).toFixed(2)) : 0
      });
    }

    res.json({ totalUsage: (totalUsage/1000).toFixed(2), pieData, barData });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.getActivityStats = async (req, res) => {
  try {
    const totalAutomations = await AutomationLog.countDocuments();
    const recentLogs = await AutomationLog.find().sort({ timestamp: -1 }).limit(10);
    
    // Calculate smart score based on security breaches
    const breaches = await AutomationLog.countDocuments({ stateAtTime: 'ALERT' });
    const score = Math.max(0, 100 - (breaches * 5));

    res.json({
      totalAutomations,
      smartScore: score,
      recentLogs
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};
