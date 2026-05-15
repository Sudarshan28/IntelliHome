const User = require('../models/User');

exports.getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('settings');
    res.json(user.settings);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.settings = { ...user.settings, ...req.body };
    await user.save();
    res.json(user.settings);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};
