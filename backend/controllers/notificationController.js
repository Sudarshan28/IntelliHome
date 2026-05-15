const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(20);
    res.json(notifications);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ msg: 'Marked as read' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ msg: 'All marked as read' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};
