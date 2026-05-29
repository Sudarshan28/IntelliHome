const Device = require('../models/Device');
const DeviceLog = require('../models/DeviceLog');
const Automation = require('../models/Automation');
const notify = require('../utils/notifier');

let globalState = {
  homeMode: 'HOME', // HOME, AWAY, NIGHT
};

const getGlobalState = () => globalState;

const logDeviceTransition = async (device, oldState, newState, io, description = '') => {
  const log = new DeviceLog({
    deviceId: device._id,
    deviceName: device.name,
    event: 'State Transition',
    action: description || `${device.name} transitioned from ${oldState} to ${newState}`,
    stateAtTime: globalState.homeMode
  });
  await log.save();
  io.emit('fsm_action', log);
  return log;
};

const compareValues = (sourceValue, operator, targetValue) => {
  const srcNum = Number(sourceValue);
  const tgtNum = Number(targetValue);
  
  // If either is NaN, do a string/boolean compare
  if (isNaN(srcNum) || isNaN(tgtNum)) {
    const srcStr = String(sourceValue).toLowerCase();
    const tgtStr = String(targetValue).toLowerCase();
    
    switch (operator) {
      case '==': return srcStr === tgtStr;
      case '!=': return srcStr !== tgtStr;
      default: return false;
    }
  }

  switch (operator) {
    case '==': return srcNum === tgtNum;
    case '!=': return srcNum !== tgtNum;
    case '>': return srcNum > tgtNum;
    case '<': return srcNum < tgtNum;
    case '>=': return srcNum >= tgtNum;
    case '<=': return srcNum <= tgtNum;
    default: return false;
  }
};

const evaluateCondition = (cond, device, currentState) => {
  if (cond.type === 'state') {
    return compareValues(currentState.homeMode, cond.operator, cond.value);
  }
  
  if (cond.type === 'device') {
    // Check if condition applies to this device
    if (cond.deviceId && cond.deviceId.toString() !== device._id.toString()) {
      return false;
    }
    if (cond.deviceType && cond.deviceType.toLowerCase() !== device.type.toLowerCase()) {
      return false;
    }
    
    // Resolve property value
    let sourceValue;
    if (cond.property === 'status') {
      sourceValue = device.status;
    } else if (cond.property === 'onlineTime') {
      sourceValue = device.onlineTime / 1000; // convert to seconds or compare in seconds/hours
    } else if (cond.property === 'latency') {
      sourceValue = device.latency;
    } else if (cond.property === 'powerUsage' || cond.property === 'powerRating') {
      sourceValue = device.powerRating;
    } else {
      sourceValue = device[cond.property];
    }
    
    if (sourceValue === undefined) return false;
    return compareValues(sourceValue, cond.operator, cond.value);
  }
  
  return false;
};

const executeAction = async (action, device, io) => {
  try {
    if (action.actionType === 'device_update') {
      let query = {};
      if (action.deviceId) {
        query._id = action.deviceId;
      } else if (action.deviceType) {
        query.type = action.deviceType;
      } else {
        return;
      }
      
      const prevDevices = await Device.find(query);
      await Device.updateMany(query, action.payload);
      const updatedDevices = await Device.find(query);
      
      for (const updated of updatedDevices) {
        const prev = prevDevices.find(d => d._id.toString() === updated._id.toString());
        if (prev && prev.status !== updated.status) {
          await transitionDeviceState(updated, prev.status, updated.status, io, `Automation trigger updated status to ${updated.status}`);
        }
      }
      io.emit('devices_updated', await Device.find());
      
    } else if (action.actionType === 'notify' || action.actionType === 'report') {
      const title = action.payload.title || 'Automation Alert';
      let message = action.payload.message || '';
      // Inject device properties into title/message
      message = message.replace(/{device}/g, device.name);
      
      await notify(title, message, action.payload.type || 'info', io);
      
      // Save notification event in device logs
      const log = new DeviceLog({
        deviceId: device._id,
        deviceName: device.name,
        event: 'Automation Triggered',
        action: `Notification sent: "${title} - ${message}"`,
        stateAtTime: globalState.homeMode
      });
      await log.save();
      io.emit('fsm_action', log);
    }
  } catch (err) {
    console.error('Error executing automation action:', err);
  }
};

const processAutomationRules = async (device, io) => {
  try {
    const rules = await Automation.find({ active: true });
    
    for (let rule of rules) {
      let conditionsMet = true;
      
      for (let cond of rule.conditions) {
        if (!evaluateCondition(cond, device, globalState)) {
          conditionsMet = false;
          break;
        }
      }

      if (conditionsMet) {
        console.log(`Automation rule "${rule.name}" triggered by device "${device.name}".`);
        for (let action of rule.actions) {
          await executeAction(action, device, io);
        }
      }
    }
  } catch (err) {
    console.error('Error processing automation rules:', err);
  }
};

const transitionDeviceState = async (device, oldState, newState, io, description = '') => {
  console.log(`FSM transition: ${device.name} [${oldState} -> ${newState}]`);
  
  // 1. Persist FSM state transition log
  await logDeviceTransition(device, oldState, newState, io, description);
  
  // 2. Trigger screen popups for online/offline transitions
  if (newState === 'CONNECTED' && oldState !== 'CONNECTED') {
    await notify('Device Online', `${device.name} (${device.ip}) is now online and monitored.`, 'success', io);
  } else if (newState === 'OFFLINE' && oldState !== 'OFFLINE') {
    await notify('Device Offline', `${device.name} (${device.ip}) went offline.`, 'alert', io);
  }
  
  // 3. Process automation rules triggered by the device state change
  await processAutomationRules(device, io);

  // 4. If this is a virtual device, push the status update to it
  if (device.vendor === 'Virtual Emulator') {
    try {
      const { controlVirtualDevice } = require('../deviceManager');
      await controlVirtualDevice(device._id, { status: newState }, io);
    } catch (err) {
      console.error('Failed to notify virtual device of state transition:', err);
    }
  }
};

const setGlobalState = async (newState, io) => {
  const oldMode = globalState.homeMode;
  globalState.homeMode = newState;
  
  const log = new DeviceLog({
    event: 'System Mode Change',
    action: `Changed mode from ${oldMode} to ${newState}`,
    stateAtTime: newState
  });
  await log.save();
  io.emit('fsm_action', log);
  
  // If Away, we can mark devices as IDLE or simulate power savings
  if (newState === 'AWAY') {
    // Optionally dim lights or set devices to IDLE/CONNECTED instead of ACTIVE
    const devices = await Device.find({ status: 'ACTIVE' });
    for (const device of devices) {
      const oldStatus = device.status;
      device.status = 'CONNECTED'; // drop from active to connected
      await device.save();
      await transitionDeviceState(device, oldStatus, 'CONNECTED', io, 'System armed to AWAY; lowered device activity');
    }
  }
  
  io.emit('fsm_state_change', globalState.homeMode);
};

module.exports = { 
  getGlobalState, 
  setGlobalState, 
  transitionDeviceState,
  processAutomationRules
};
