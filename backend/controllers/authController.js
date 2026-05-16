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
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const location = await getLocation(ip);
    
    const parser = new UAParser(req.headers['user-agent']);
    const browser = parser.getBrowser().name || 'Unknown Browser';
    const os = parser.getOS().name || 'Unknown OS';
    const deviceInfo = `${browser} on ${os}`;

    user = new User({ 
      name, 
      email, 
      password: hashedPassword,
      lastLogin: Date.now(),
      location,
      deviceInfo
    });
    await user.save();

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret123', { expiresIn: '1h' });

    res.status(201).json({ token, user: { id: user.id, name, email, location, settings: user.settings } });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const location = await getLocation(ip);
    
    const parser = new UAParser(req.headers['user-agent']);
    const browser = parser.getBrowser().name || 'Unknown Browser';
    const os = parser.getOS().name || 'Unknown OS';
    const deviceInfo = `${browser} on ${os}`;

    user.lastLogin = Date.now();
    user.location = location;
    user.deviceInfo = deviceInfo;
    await user.save();

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret123', { expiresIn: '1h' });

    res.json({ token, user: { id: user.id, name: user.name, email, location, settings: user.settings } });
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
