const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['light', 'ac', 'alarm', 'sensor', 'fridge', 'ev_charger', 'tv', 'pc', 'camera', 'heater'], required: true },
  status: { type: String, enum: ['on', 'off', 'triggered', 'idle'], default: 'off' },
  metrics: {
    temperature: { type: Number, default: 22 },
    motionDetected: { type: Boolean, default: false },
    smokeDetected: { type: Boolean, default: false },
    doorOpen: { type: Boolean, default: false }
  },
  room: { type: String, default: 'Living Room' },
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

// Middleware to update lastActive when status changes
DeviceSchema.pre('findOneAndUpdate', function(next) {
  if (this._update.status) {
    this._update.lastActive = Date.now();
  }
  next();
});

module.exports = mongoose.model('Device', DeviceSchema);
