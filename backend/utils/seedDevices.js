const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Device = require('../models/Device');

dotenv.config();

const diverseDevices = [
  { name: 'Living Room AC', type: 'ac', room: 'Living Room', status: 'on', metrics: { temperature: 22, mode: 'cool' } },
  { name: 'Kitchen Refrigerator', type: 'fridge', room: 'Kitchen', status: 'on', metrics: { temperature: 4 } },
  { name: 'Tesla Model S', type: 'ev_charger', room: 'Garage', status: 'on', metrics: { charge: 85 } },
  { name: 'Home Theater', type: 'tv', room: 'Living Room', status: 'on', metrics: { volume: 45 } },
  { name: 'Gaming PC', type: 'pc', room: 'Bedroom', status: 'on', metrics: { usage: 'high' } },
  { name: 'Kitchen Chandelier', type: 'light', room: 'Kitchen', status: 'on', metrics: { brightness: 80 } },
  { name: 'Front Porch Lights', type: 'light', room: 'Exterior', status: 'on', metrics: { brightness: 100 } },
  { name: 'Security Camera', type: 'camera', room: 'Front Door', status: 'on', metrics: { recording: true } },
  { name: 'Smoke Detector', type: 'sensor', room: 'Hallway', status: 'on', metrics: { smokeLevel: 0 } },
  { name: 'Smart Heater', type: 'heater', room: 'Basement', status: 'off', metrics: { targetTemp: 24 } },
  { name: 'Bedroom AC', type: 'ac', room: 'Bedroom', status: 'off', metrics: { temperature: 24, mode: 'eco' } }
];

const seedDevices = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/intellihome', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB.');
    await Device.deleteMany({});
    console.log('Old devices cleared.');
    
    await Device.insertMany(diverseDevices);
    console.log('Diverse devices seeded successfully.');
    
    process.exit();
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedDevices();
