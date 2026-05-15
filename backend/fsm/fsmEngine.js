const Device = require('../models/Device');
const AutomationLog = require('../models/AutomationLog');
const Automation = require('../models/Automation');
const notify = require('../utils/notifier');

let globalState = {
  homeMode: 'HOME', // HOME, AWAY, NIGHT, SLEEP, ALERT
};

// Scheduler memory map (Rule ID -> Timeout ID)
const activeSchedules = new Map();

const getGlobalState = () => globalState;

const logAction = async (event, action, io) => {
  const log = new AutomationLog({
    event,
    action,
    stateAtTime: globalState.homeMode
  });
  await log.save();
  io.emit('fsm_action', log);
};

const evaluateCondition = (cond, eventPayload, currentState) => {
  let sourceValue;
  if (cond.type === 'event') {
    // If the rule expects 'motion' and this event is 'temperature', it might not match, 
    // unless the eventPayload contains the property.
    // For our simplified payload: { eventType: 'motion', value: true }
    if (cond.property !== eventPayload.eventType) return false;
    sourceValue = eventPayload.value;
  } else if (cond.type === 'state') {
    sourceValue = currentState[cond.property];
  }

  switch (cond.operator) {
    case '==': return sourceValue === cond.value;
    case '!=': return sourceValue !== cond.value;
    case '>': return sourceValue > cond.value;
    case '<': return sourceValue < cond.value;
    case '>=': return sourceValue >= cond.value;
    case '<=': return sourceValue <= cond.value;
    default: return false;
  }
};

const executeAction = async (action, io) => {
  if (action.actionType === 'device_update') {
    // For demo purposes, we update all devices of that type.
    await Device.updateMany({ type: action.deviceType }, action.payload);
    io.emit('devices_updated', await Device.find());
  } else if (action.actionType === 'notify') {
    await notify(action.payload.title, action.payload.message, action.payload.type, io);
  }
};

const processFSMEvent = async (eventPayload, io) => {
  // eventPayload: { eventType: 'motion', value: true }
  
  // 1. Cancel any pending scheduled tasks that expect this event
  for (let [ruleId, task] of activeSchedules.entries()) {
    if (task.cancelEvent === eventPayload.eventType) {
      clearTimeout(task.timeoutId);
      activeSchedules.delete(ruleId);
      console.log(`Cancelled scheduled task for rule: ${ruleId}`);
    }
  }

  // 2. Fetch active rules
  const rules = await Automation.find({ active: true });

  for (let rule of rules) {
    // Evaluate all conditions (AND logic)
    let conditionsMet = true;
    for (let cond of rule.conditions) {
      if (!evaluateCondition(cond, eventPayload, globalState)) {
        conditionsMet = false;
        break;
      }
    }

    if (conditionsMet) {
      await logAction(eventPayload.eventType, `Rule Executed: ${rule.name}`, io);

      // Execute actions immediately
      for (let action of rule.actions) {
        await executeAction(action, io);
      }

      // Handle Scheduling (e.g., Turn off lights after 5 mins of no motion)
      if (rule.scheduler && rule.scheduler.delayMs) {
        // Clear existing schedule for this rule if any
        if (activeSchedules.has(rule._id.toString())) {
          clearTimeout(activeSchedules.get(rule._id.toString()).timeoutId);
        }

        const timeoutId = setTimeout(async () => {
          // Execution of the delayed payload
          // For simplicity in this demo, the delayed payload reverses the device update
          // A robust system would specify exactly what the delay payload is.
          // Here, we hardcode the specific reversal for the "motion lights" rule.
          if (rule.name === 'Motion triggers Lights ON') {
            await Device.updateMany({ type: 'light' }, { status: 'off' });
            io.emit('devices_updated', await Device.find());
            await logAction('Scheduled Timeout', `Reverted rule: ${rule.name}`, io);
          }
          activeSchedules.delete(rule._id.toString());
        }, rule.scheduler.delayMs);

        activeSchedules.set(rule._id.toString(), {
          timeoutId,
          cancelEvent: rule.scheduler.cancelOnEvent
        });
      }
    }
  }
};

const setGlobalState = async (newState, io) => {
  globalState.homeMode = newState;
  await logAction('User Command', `Changed mode to ${newState}`, io);
  
  // Execute state-based logic (can be expanded via DB rules too, but hardcoded here for fundamental mode switching)
  if (newState === 'AWAY') {
    await Device.updateMany({}, { status: 'off' });
    io.emit('devices_updated', await Device.find());
  } else if (newState === 'NIGHT') {
    await Device.updateMany({ type: 'light' }, { status: 'off' });
    io.emit('devices_updated', await Device.find());
  }
  
  io.emit('fsm_state_change', globalState.homeMode);
};

module.exports = { getGlobalState, processFSMEvent, setGlobalState };
