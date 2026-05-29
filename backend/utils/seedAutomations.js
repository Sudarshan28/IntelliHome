const Automation = require('../models/Automation');

const realDefaultRules = [
  {
    name: 'Printer Offline Alert',
    conditions: [
      { type: 'device', deviceType: 'printer', property: 'status', operator: '==', value: 'OFFLINE' }
    ],
    actions: [
      { actionType: 'notify', payload: { title: 'Printer Offline', message: '{device} is offline. Please check its connection.', type: 'warning' } }
    ]
  },
  {
    name: 'Laptop Screen Time warning',
    conditions: [
      { type: 'device', deviceType: 'laptop', property: 'onlineTime', operator: '>', value: 18000 } // 5h (18000 seconds)
    ],
    actions: [
      { actionType: 'notify', payload: { title: 'Usage Report', message: '{device} has been online for over 5 hours. Generating usage report.', type: 'info' } }
    ]
  },
  {
    name: 'ESP32 Overload Warning',
    conditions: [
      { type: 'device', deviceType: 'sensor', property: 'powerUsage', operator: '>', value: 30 } // > 30 Watts
    ],
    actions: [
      { actionType: 'notify', payload: { title: 'Power Threshold Exceeded', message: '{device} power usage is higher than threshold.', type: 'alert' } }
    ]
  },
  {
    name: 'Phone Auto OFF Rule',
    conditions: [
      { type: 'device', deviceType: 'phone', property: 'status', operator: '==', value: 'ACTIVE' },
      { type: 'device', deviceType: 'phone', property: 'onlineTime', operator: '>', value: 1800 } // 30 minutes (1800s)
    ],
    actions: [
      { actionType: 'device_update', deviceType: 'phone', payload: { status: 'CONNECTED' } },
      { actionType: 'notify', payload: { title: 'Auto OFF Fired', message: '{device} has been turned OFF automatically after 30 minutes.', type: 'info' } }
    ]
  }
];

const seedAutomations = async () => {
  try {
    // Clear existing mock/fake rules
    await Automation.deleteMany({});
    console.log('Cleared old automation rules.');
    
    // Seed real default rules
    await Automation.insertMany(realDefaultRules);
    console.log('Seeded real device-based automation rules successfully.');
  } catch (err) {
    console.error('Failed to seed automations:', err);
  }
};

module.exports = seedAutomations;
