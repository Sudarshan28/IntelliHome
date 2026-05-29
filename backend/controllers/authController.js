const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const UAParser = require('ua-parser-js');

const getLocation = async (ip) => {
  try {
    if (ip === '::1' || ip === '127.0.0.1') return { city: 'Noida', country: 'India', timezone: 'Asia/Kolkata' };
    const res = await axios.get(`http://ip-api.com/json/${ip}`);
    if (res.data.status === 'success') {
      return { city: res.data.city, country: res.data.country, timezone: res.data.timezone };
    }
  } catch (err) {
    console.error('IP Geolocation failed');
  }
  return { city: 'Noida', country: 'India', timezone: 'Asia/Kolkata' };
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, location } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    // Default location for instant login
    const defaultLocation = { city: 'Unknown', country: 'Unknown', timezone: 'UTC' };
    const initialLocation = location || defaultLocation;
    
    const parser = new UAParser(req.headers['user-agent']);
    const browser = parser.getBrowser().name || 'Unknown Browser';
    const os = parser.getOS().name || 'Unknown OS';
    const deviceInfo = `${browser} on ${os}`;

    user = new User({ 
      name, 
      email, 
      password: hashedPassword,
      lastLogin: Date.now(),
      location: initialLocation,
      deviceInfo
    });
    await user.save();
    
    // Background task to update location if not provided
    if (!location) {
      getLocation(ip).then(loc => {
        if (loc.city !== 'Unknown') {
          User.findByIdAndUpdate(user.id, { location: loc }).catch(console.error);
        }
      });
    }

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret123', { expiresIn: '1h' });

    res.status(201).json({ token, user: { id: user.id, name, email, location: initialLocation, settings: user.settings } });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, location } = req.body;
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    const parser = new UAParser(req.headers['user-agent']);
    const browser = parser.getBrowser().name || 'Unknown Browser';
    const os = parser.getOS().name || 'Unknown OS';
    const deviceInfo = `${browser} on ${os}`;

    user.lastLogin = Date.now();
    user.deviceInfo = deviceInfo;
    if (location) {
      user.location = {
        ...user.location,
        city: location.city,
        country: location.country,
        timezone: location.timezone
      };
    }
    await user.save();

    // Background task to update location without lagging the login if not provided
    if (!location) {
      getLocation(ip).then(loc => {
        if (loc.city !== 'Unknown') {
          User.findByIdAndUpdate(user.id, { location: loc }).catch(console.error);
        }
      });
    }

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret123', { expiresIn: '1h' });

    res.json({ token, user: { id: user.id, name: user.name, email, location: user.location, settings: user.settings } });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, location } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (name) user.name = name;
    if (location) {
      user.location = {
        ...user.location,
        city: location.city !== undefined ? location.city : user.location.city,
        country: location.country !== undefined ? location.country : user.location.country,
        timezone: location.timezone !== undefined ? location.timezone : user.location.timezone
      };
    }
    await user.save();

    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating profile:', err.message);
    res.status(500).send('Server error');
  }
};
