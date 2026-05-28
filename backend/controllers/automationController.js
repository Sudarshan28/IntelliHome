const Automation = require('../models/Automation');

exports.getAutomations = async (req, res) => {
  try {
    const automations = await Automation.find({ userId: req.user.id });
    res.json(automations);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.addAutomation = async (req, res) => {
  try {
    const newAutomation = new Automation({
      ...req.body,
      userId: req.user.id
    });
    const automation = await newAutomation.save();
    res.json(automation);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.deleteAutomation = async (req, res) => {
  try {
    const automation = await Automation.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!automation) return res.status(404).json({ msg: 'Automation not found' });
    res.json({ msg: 'Automation deleted' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.toggleAutomation = async (req, res) => {
  try {
    const automation = await Automation.findOne({ _id: req.params.id, userId: req.user.id });
    if (!automation) return res.status(404).json({ msg: 'Not found' });
    
    automation.active = !automation.active;
    await automation.save();
    res.json(automation);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};
