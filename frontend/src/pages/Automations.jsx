import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import { Settings2, Plus, Trash2, Power, Zap } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function Automations() {
  const { token } = useContext(AuthContext);
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Rule Form State
  const [showForm, setShowForm] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    triggerProp: 'motion',
    triggerVal: 'true',
    actionDev: 'light',
    actionStatus: 'on'
  });

  const fetchRules = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/automations`, {
        headers: { 'x-auth-token': token }
      });
      const data = await res.json();
      setAutomations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [token]);

  const toggleRule = async (id) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/automations/${id}/toggle`, {
      method: 'PUT',
      headers: { 'x-auth-token': token }
    });
    fetchRules();
  };

  const deleteRule = async (id) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/automations/${id}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': token }
    });
    fetchRules();
  };

  const addRule = async (e) => {
    e.preventDefault();
    const payload = {
      name: newRule.name || `Custom Rule: ${newRule.triggerProp} -> ${newRule.actionDev}`,
      conditions: [{ type: 'event', property: newRule.triggerProp, operator: '==', value: newRule.triggerVal === 'true' }],
      actions: [{ actionType: 'device_update', deviceType: newRule.actionDev, payload: { status: newRule.actionStatus } }]
    };

    await fetch(`${import.meta.env.VITE_API_URL}/api/automations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify(payload)
    });
    setShowForm(false);
    fetchRules();
  };

  if (loading) return <div className="text-brand-500 text-center mt-20">Loading rules...</div>;

  return (
    <div className="space-y-8 pb-10 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-4xl font-bold tracking-tight">Automation Rules</h2>
          <p className="text-gray-400 mt-2 text-lg">Manage your smart home IFTTT logic engine.</p>
        </motion.div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(!showForm)}
          className="bg-brand-500 text-white px-6 py-3 rounded-xl shadow-[0_0_15px_rgba(20,184,166,0.4)] flex items-center gap-2 font-semibold"
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
            <GlassCard className="border-brand-500/30 bg-brand-900/10 mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-brand-400"><Zap size={20}/> Create Custom Rule</h3>
              <form onSubmit={addRule} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">If (Event triggers)</label>
                  <select 
                    className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-brand-500"
                    value={newRule.triggerProp} onChange={e => setNewRule({...newRule, triggerProp: e.target.value})}
                  >
                    <option value="motion">Motion Sensor</option>
                    <option value="smoke">Smoke Alarm</option>
                    <option value="door">Front Door</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Then (Action)</label>
                  <div className="flex gap-2">
                    <select 
                      className="w-2/3 bg-dark-800 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-brand-500"
                      value={newRule.actionDev} onChange={e => setNewRule({...newRule, actionDev: e.target.value})}
                    >
                      <option value="light">All Lights</option>
                      <option value="ac">All ACs</option>
                      <option value="alarm">Security Alarm</option>
                    </select>
                    <select 
                      className="w-1/3 bg-dark-800 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-brand-500"
                      value={newRule.actionStatus} onChange={e => setNewRule({...newRule, actionStatus: e.target.value})}
                    >
                      <option value="on">Turn ON</option>
                      <option value="off">Turn OFF</option>
                      <option value="triggered">TRIGGER</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 rounded-lg transition-colors">
                  Save Rule
                </button>
              </form>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {automations.map((rule) => (
          <GlassCard key={rule._id} className={`transition-all duration-300 ${rule.active ? 'border-brand-500/20' : 'opacity-60 border-white/5'}`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings2 className={rule.active ? 'text-brand-400' : 'text-gray-500'} />
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

            <div className="bg-dark-900/50 rounded-xl p-4 font-mono text-sm border border-white/5 space-y-2">
              <div className="text-gray-400"><span className="text-blue-400 font-bold">IF</span> {rule.conditions.map(c => `${c.property} ${c.operator} ${c.value}`).join(' AND ')}</div>
              <div className="text-gray-400"><span className="text-green-400 font-bold">THEN</span> {rule.actions.map(a => `${a.actionType} -> ${a.deviceType || 'system'}`).join(', ')}</div>
              {rule.scheduler && (
                <div className="text-gray-400 mt-2 pt-2 border-t border-white/5">
                  <span className="text-purple-400 font-bold">DELAY</span> {rule.scheduler.delayMs / 1000}s (Cancel if: {rule.scheduler.cancelOnEvent})
                </div>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
