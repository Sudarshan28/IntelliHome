const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  type: { type: String, enum: ['light', 'ac', 'alarm', 'sensor', 'fridge', 'ev_charger', 'tv', 'pc', 'camera', 'heater', 'printer', 'laptop', 'phone', 'other'], default: 'other' },
  status: { type: String, enum: ['DISCOVERED', 'PAIRING', 'CONNECTED', 'ACTIVE', 'IDLE', 'OFFLINE'], default: 'DISCOVERED' },
  ip: { type: String },
  mac: { type: String },
  hostname: { type: String },
  vendor: { type: String },
  latency: { type: Number, default: 0 }, // in ms
  uptime: { type: Number, default: 0 }, // in seconds
  onlineTime: { type: Number, default: 0 }, // in ms
  lastSeen: { type: Date, default: Date.now },
  powerRating: { type: Number, default: 50 }, // in Watts
  metrics: {
    temperature: { type: Number, default: 22 },
    motionDetected: { type: Boolean, default: false },
    smokeDetected: { type: Boolean, default: false },
    doorOpen: { type: Boolean, default: false }
  },
  room: { type: String, default: 'Living Room' }
}, { timestamps: true });

// Pre-save or pre-update middleware to update lastSeen when status or network updates
DeviceSchema.pre('save', function(next) {
  this.lastSeen = Date.now();
  next();
});

module.exports = mongoose.model('Device', DeviceSchema, 'devices');
