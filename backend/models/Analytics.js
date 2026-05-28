const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  deviceName: { type: String, required: true },
  deviceType: { type: String, required: true },
  energyConsumed: { type: Number, required: true }, // in kWh
  activeTime: { type: Number, required: true }, // in seconds
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Analytics', AnalyticsSchema, 'analytics');
