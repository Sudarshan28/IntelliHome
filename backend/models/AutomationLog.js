const mongoose = require('mongoose');

const AutomationLogSchema = new mongoose.Schema({
  event: { type: String, required: true },
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  stateAtTime: { type: String, required: true }
});

module.exports = mongoose.model('AutomationLog', AutomationLogSchema);
