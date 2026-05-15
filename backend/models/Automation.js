const mongoose = require('mongoose');

const ConditionSchema = new mongoose.Schema({
  type: { type: String, enum: ['event', 'state'], required: true },
  property: { type: String, required: true }, // e.g., 'motion', 'temperature', 'homeMode'
  operator: { type: String, enum: ['==', '!=', '>', '<', '>=', '<='], required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
});

const ActionSchema = new mongoose.Schema({
  actionType: { type: String, enum: ['device_update', 'notify'], required: true },
  deviceType: { type: String }, // e.g., 'light', 'ac', 'alarm'
  payload: { type: mongoose.Schema.Types.Mixed, required: true } // { status: 'on' } or { title: 'Alert', message: '...' }
});

const SchedulerSchema = new mongoose.Schema({
  delayMs: { type: Number, required: true },
  cancelOnEvent: { type: String } // e.g., 'motion'
});

const AutomationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  conditions: [ConditionSchema],
  actions: [ActionSchema],
  scheduler: SchedulerSchema, // Optional
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Automation', AutomationSchema);
