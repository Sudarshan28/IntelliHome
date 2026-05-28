const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  lastLogin: { type: Date },
  location: {
    ip: String,
    city: String,
    country: String,
    timezone: String
  },
  deviceInfo: { type: String },
  homeMode: { type: String, enum: ['HOME', 'AWAY', 'NIGHT', 'SLEEP', 'ALERT'], default: 'HOME' },
  settings: {
    pushNotifs: { type: Boolean, default: true },
    emailAlerts: { type: Boolean, default: false },
    autoAway: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: true },
    remoteAccess: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema, 'users');
