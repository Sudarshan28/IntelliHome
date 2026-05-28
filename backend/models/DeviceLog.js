const mongoose = require('mongoose');

const DeviceLogSchema = new mongoose.Schema({
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  deviceName: { type: String },
  event: { type: String, required: true }, // e.g. "Device status change", "State transition"
  action: { type: String, required: true }, // e.g. "MacBook Air transitioned to ACTIVE"
  stateAtTime: { type: String, required: true }, // HOME/AWAY/NIGHT
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('DeviceLog', DeviceLogSchema, 'device_logs');
