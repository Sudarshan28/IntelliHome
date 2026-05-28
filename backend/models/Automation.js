const mongoose = require('mongoose');

const ConditionSchema = new mongoose.Schema({
  type: { type: String, enum: ['event', 'state', 'device'], required: true },
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' }, // specific device
  deviceType: { type: String }, // e.g. 'printer', 'laptop', 'light'
  property: { type: String, required: true }, // e.g., 'status', 'onlineTime', 'latency', 'powerUsage', 'homeMode'
  operator: { type: String, enum: ['==', '!=', '>', '<', '>=', '<='], required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
});

const ActionSchema = new mongoose.Schema({
  actionType: { type: String, enum: ['device_update', 'notify', 'report'], required: true },
  deviceType: { type: String }, // e.g., 'light', 'ac', 'alarm'
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  payload: { type: mongoose.Schema.Types.Mixed, required: true } // e.g. { status: 'CONNECTED' } or { title: 'Alert', message: '...' }
});

const SchedulerSchema = new mongoose.Schema({
  delayMs: { type: Number, required: true },
  cancelOnEvent: { type: String } // e.g., 'motion'
});

const AutomationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  conditions: [ConditionSchema],
  actions: [ActionSchema],
  scheduler: SchedulerSchema, // Optional
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Automation', AutomationSchema, 'automation_rules');
