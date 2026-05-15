const Automation = require('../models/Automation');

const defaultRules = [
  {
    name: 'Motion triggers Lights ON',
    conditions: [
      { type: 'event', property: 'motion', operator: '==', value: true }
    ],
    actions: [
      { actionType: 'device_update', deviceType: 'light', payload: { status: 'on' } }
    ],
    scheduler: {
      delayMs: 5000, // 5 seconds for simulation (would be 300000 / 5 mins in prod)
      cancelOnEvent: 'motion'
    }
  },
  {
    name: 'High Temp triggers AC ON',
    conditions: [
      { type: 'event', property: 'temperature', operator: '>', value: 26 }
    ],
    actions: [
      { actionType: 'device_update', deviceType: 'ac', payload: { status: 'on', 'metrics.temperature': 22 } }
    ]
  },
  {
    name: 'Smoke triggers Alarm & Notify',
    conditions: [
      { type: 'event', property: 'smoke', operator: '==', value: true }
    ],
    actions: [
      { actionType: 'device_update', deviceType: 'alarm', payload: { status: 'triggered' } },
      { actionType: 'notify', payload: { title: 'Fire Alert', message: 'Smoke detected! Evacuate immediately.', type: 'alert' } }
    ]
  },
  {
    name: 'Door opens while AWAY triggers Alarm',
    conditions: [
      { type: 'event', property: 'door', operator: '==', value: true },
      { type: 'state', property: 'homeMode', operator: '==', value: 'AWAY' }
    ],
    actions: [
      { actionType: 'device_update', deviceType: 'alarm', payload: { status: 'triggered' } },
      { actionType: 'notify', payload: { title: 'Security Breach', message: 'Front door opened while system is armed.', type: 'alert' } }
    ]
  }
];

const seedAutomations = async () => {
  try {
    const count = await Automation.countDocuments();
    if (count === 0) {
      console.log('Seeding default IFTTT rules...');
      await Automation.insertMany(defaultRules);
      console.log('Default rules seeded successfully.');
    }
  } catch (err) {
    console.error('Failed to seed automations:', err);
  }
};

module.exports = seedAutomations;
