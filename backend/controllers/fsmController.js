const { setGlobalState, getGlobalState } = require('../fsm/fsmEngine');
const AutomationLog = require('../models/AutomationLog');

exports.getState = (req, res) => {
  res.json(getGlobalState());
};

exports.setState = async (req, res) => {
  try {
    const { state } = req.body;
    await setGlobalState(state, req.app.get('io'));
    res.json({ msg: `State updated to ${state}`, state: getGlobalState() });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.getLogs = async (req, res) => {
  try {
    const logs = await AutomationLog.find().sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};
