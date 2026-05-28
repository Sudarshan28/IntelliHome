import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import { Settings2, Plus, Trash2, Power, Zap, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function Automations() {
  const { token } = useContext(AuthContext);
  const [automations, setAutomations] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Rule Form State
  const [showForm, setShowForm] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    triggerDeviceId: '',
    triggerProp: 'status',
    triggerOperator: '==',
    triggerVal: 'OFFLINE',
    actionType: 'notify', // notify or device_update
    actionDeviceId: '',
    actionPayloadVal: 'CONNECTED',
    actionNotifyTitle: 'Device Alert',
    actionNotifyMessage: '{device} status changed to OFFLINE'
  });

  const fetchData = async () => {
    try {
      const authHeaders = { 'x-auth-token': token };
      
      const rulesRes = await fetch(`${import.meta.env.VITE_API_URL}/api/automations`, {
        headers: authHeaders
      });
      const rulesData = await rulesRes.json();
      
      const devRes = await fetch(`${import.meta.env.VITE_API_URL}/api/devices`, {
        headers: authHeaders
      });
      const devData = await devRes.json();

      if (Array.isArray(rulesData)) setAutomations(rulesData);
      if (Array.isArray(devData)) setDevices(devData);
    } catch (err) {
      console.error('Error fetching automations data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const toggleRule = async (id) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/automations/${id}/toggle`, {
      method: 'PUT',
      headers: { 'x-auth-token': token }
    });
    fetchData();
  };

  const deleteRule = async (id) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/automations/${id}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': token }
    });
    fetchData();
  };

  const addRule = async (e) => {
    e.preventDefault();
    if (!newRule.triggerDeviceId) {
      alert("Please select a triggering device.");
      return;
    }

    const selectedTriggerDev = devices.find(d => d._id === newRule.triggerDeviceId);

    // Cast trigger value appropriately
    let castedVal = newRule.triggerVal;
    if (newRule.triggerVal === 'true') castedVal = true;
    if (newRule.triggerVal === 'false') castedVal = false;
    if (!isNaN(Number(newRule.triggerVal))) castedVal = Number(newRule.triggerVal);

    const conditions = [{
      type: 'device',
      deviceId: newRule.triggerDeviceId,
      deviceType: selectedTriggerDev?.type || '',
      property: newRule.triggerProp,
      operator: newRule.triggerOperator,
      value: castedVal
    }];

    const actions = [];
    if (newRule.actionType === 'notify') {
      actions.push({
        actionType: 'notify',
        payload: {
          title: newRule.actionNotifyTitle,
          message: newRule.actionNotifyMessage,
          type: newRule.triggerVal === 'OFFLINE' ? 'alert' : 'info'
        }
      });
    } else {
      if (!newRule.actionDeviceId) {
        alert("Please select a target device for the action.");
        return;
      }
      const selectedActionDev = devices.find(d => d._id === newRule.actionDeviceId);
      actions.push({
        actionType: 'device_update',
        deviceId: newRule.actionDeviceId,
        deviceType: selectedActionDev?.type || '',
        payload: { status: newRule.actionPayloadVal }
      });
    }

    const payload = {
      name: newRule.name || `IF ${selectedTriggerDev?.name} ${newRule.triggerProp} ${newRule.triggerOperator} ${newRule.triggerVal}`,
      conditions,
      actions
    };

    await fetch(`${import.meta.env.VITE_API_URL}/api/automations`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-auth-token': token 
      },
      body: JSON.stringify(payload)
    });

    setShowForm(false);
    // Reset form state
    setNewRule({
      name: '',
      triggerDeviceId: '',
      triggerProp: 'status',
      triggerOperator: '==',
      triggerVal: 'OFFLINE',
      actionType: 'notify',
      actionDeviceId: '',
      actionPayloadVal: 'CONNECTED',
      actionNotifyTitle: 'Device Alert',
      actionNotifyMessage: '{device} status changed to OFFLINE'
    });
    fetchData();
  };

  const getDeviceNameById = (id) => {
    const dev = devices.find(d => d._id === id);
    return dev ? dev.name : 'Unknown Device';
  };

  if (loading) return <div className="text-brand-500 text-center mt-20 animate-pulse">Loading rules...</div>;

  return (
    <div className="space-y-8 pb-10 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-4xl font-bold tracking-tight">Automation Rules</h2>
          <p className="text-gray-400 mt-2 text-lg">Manage your real network device IFTTT logic engine.</p>
        </motion.div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(!showForm)}
          className="bg-brand-500 text-white px-6 py-3 rounded-xl shadow-[0_0_15px_rgba(20,184,166,0.4)] flex items-center gap-2 font-bold"
        >
          {showForm ? 'Cancel' : <><Plus size={20} /> New Rule</>}
        </motion.button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard className="border-brand-500/30 bg-brand-900/5 mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-brand-400"><Zap size={20}/> Create Custom Rule</h3>
              
              {devices.length === 0 ? (
                <div className="text-center py-6 text-gray-500 flex items-center justify-center gap-2 bg-dark-900/50 rounded-xl border border-white/5">
                  <AlertCircle size={20} />
                  Please register devices in the Devices tab first to build rules.
                </div>
              ) : (
                <form onSubmit={addRule} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-400 mb-1">Rule Name (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Printer Offline Notify"
                        className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-brand-500 text-sm"
                        value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-dark-900/50 rounded-xl border border-white/5 space-y-4">
                    <h4 className="font-bold text-sm text-white">IF (Condition)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Device</label>
                        <select 
                          className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-brand-500 text-xs"
                          value={newRule.triggerDeviceId} onChange={e => setNewRule({...newRule, triggerDeviceId: e.target.value})}
                        >
                          <option value="">Select device...</option>
                          {devices.map(d => (
                            <option key={d._id} value={d._id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Property</label>
                        <select 
                          className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-brand-500 text-xs"
                          value={newRule.triggerProp} onChange={e => setNewRule({...newRule, triggerProp: e.target.value})}
                        >
                          <option value="status">FSM Status</option>
                          <option value="latency">Ping Latency (ms)</option>
                          <option value="onlineTime">Active Duration (sec)</option>
                          <option value="powerUsage">Power Usage (W)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Operator</label>
                        <select 
                          className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-brand-500 text-xs"
                          value={newRule.triggerOperator} onChange={e => setNewRule({...newRule, triggerOperator: e.target.value})}
                        >
                          <option value="==">equals</option>
                          <option value="!=">not equals</option>
                          <option value=">">greater than</option>
                          <option value="<">less than</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Value</label>
                        {newRule.triggerProp === 'status' ? (
                          <select 
                            className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-brand-500 text-xs"
                            value={newRule.triggerVal} onChange={e => setNewRule({...newRule, triggerVal: e.target.value})}
                          >
                            <option value="CONNECTED">CONNECTED</option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="IDLE">IDLE</option>
                            <option value="OFFLINE">OFFLINE</option>
                          </select>
                        ) : (
                          <input 
                            type="text" 
                            placeholder="e.g. 50"
                            className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-brand-500 text-xs"
                            value={newRule.triggerVal} onChange={e => setNewRule({...newRule, triggerVal: e.target.value})}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-dark-900/50 rounded-xl border border-white/5 space-y-4">
                    <h4 className="font-bold text-sm text-white">THEN (Action)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Action Type</label>
                        <select 
                          className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-brand-500 text-xs"
                          value={newRule.actionType} onChange={e => setNewRule({...newRule, actionType: e.target.value})}
                        >
                          <option value="notify">Notify User</option>
                          <option value="device_update">Control/Update Device</option>
                        </select>
                      </div>

                      {newRule.actionType === 'notify' ? (
                        <>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Alert Title</label>
                            <input 
                              type="text" 
                              className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-brand-500 text-xs"
                              value={newRule.actionNotifyTitle} onChange={e => setNewRule({...newRule, actionNotifyTitle: e.target.value})}
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">Message (Use {"{device}"} for triggering device)</label>
                            <input 
                              type="text" 
                              className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-brand-500 text-xs"
                              value={newRule.actionNotifyMessage} onChange={e => setNewRule({...newRule, actionNotifyMessage: e.target.value})}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Target Device</label>
                            <select 
                              className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-brand-500 text-xs"
                              value={newRule.actionDeviceId} onChange={e => setNewRule({...newRule, actionDeviceId: e.target.value})}
                            >
                              <option value="">Select target...</option>
                              {devices.map(d => (
                                <option key={d._id} value={d._id}>{d.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Set FSM Status to</label>
                            <select 
                              className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-brand-500 text-xs"
                              value={newRule.actionPayloadVal} onChange={e => setNewRule({...newRule, actionPayloadVal: e.target.value})}
                            >
                              <option value="CONNECTED">CONNECTED</option>
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="IDLE">IDLE</option>
                              <option value="OFFLINE">OFFLINE</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button 
                      type="button" 
                      onClick={() => setShowForm(false)} 
                      className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-gray-300 font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] text-xs"
                    >
                      Save Rule
                    </button>
                  </div>
                </form>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {automations.map((rule) => (
          <GlassCard key={rule._id} className={`transition-all duration-300 ${rule.active ? 'border-brand-500/20 shadow-[0_0_20px_rgba(20,184,166,0.03)]' : 'opacity-60 border-white/5'}`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings2 className={rule.active ? 'text-brand-400 animate-spin-slow' : 'text-gray-500'} />
                {rule.name}
              </h3>
              <div className="flex items-center gap-3">
                <button onClick={() => toggleRule(rule._id)} className={`w-12 h-6 rounded-full transition-colors relative ${rule.active ? 'bg-brand-500' : 'bg-gray-600'}`}>
                  <motion.div layout className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-md" initial={false} animate={{ left: rule.active ? '28px' : '4px' }} />
                </button>
                <button onClick={() => deleteRule(rule._id)} className="text-gray-500 hover:text-red-500 transition-colors p-1">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="bg-dark-900/50 rounded-xl p-4 font-mono text-xs border border-white/5 space-y-2.5">
              <div className="text-gray-400">
                <span className="text-blue-400 font-bold">IF</span>{' '}
                {rule.conditions.map((c, i) => {
                  const devName = getDeviceNameById(c.deviceId);
                  return (
                    <span key={i} className="text-gray-300">
                      [{devName}] {c.property} {c.operator} {c.value ? String(c.value) : 'N/A'}
                    </span>
                  );
                })}
              </div>
              <div className="text-gray-400 border-t border-white/5 pt-2">
                <span className="text-green-400 font-bold">THEN</span>{' '}
                {rule.actions.map((a, i) => {
                  if (a.actionType === 'notify') {
                    return (
                      <span key={i} className="text-gray-300">
                        Notify: "{a.payload.title}" - {a.payload.message}
                      </span>
                    );
                  } else {
                    const devName = getDeviceNameById(a.deviceId);
                    return (
                      <span key={i} className="text-gray-300">
                        Update [{devName}] status to {a.payload.status}
                      </span>
                    );
                  }
                })}
              </div>
            </div>
          </GlassCard>
        ))}

        {automations.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-500 bg-white/5 rounded-2xl border border-white/5">
            <Zap className="mx-auto text-gray-600 mb-2" size={32} />
            <p className="font-semibold text-white">No automation rules configured.</p>
            <p className="text-xs text-gray-400 mt-1">Click "New Rule" at the top to build real IFTTT rules.</p>
          </div>
        )}
      </div>
    </div>
  );
}
