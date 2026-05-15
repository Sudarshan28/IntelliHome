import { useState, useEffect, useContext } from 'react';
import GlassCard from '../components/GlassCard';
import { Activity, Plus, Server, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';

export default function SimulationLab() {
  const { token } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [activeNode, setActiveNode] = useState(null);
  const [homeState, setHomeState] = useState('HOME');

  useEffect(() => {
    const socket = io(`${import.meta.env.VITE_API_URL}`);
    
    fetch(`${import.meta.env.VITE_API_URL}/api/fsm/state`)
      .then(res => res.json())
      .then(data => setHomeState(data.homeMode));

    socket.on('fsm_action', (log) => {
      setLogs(prev => [log, ...prev]);
      setActiveNode('action');
      setTimeout(() => setActiveNode(null), 2000);
    });

    socket.on('fsm_state_change', setHomeState);

    return () => socket.disconnect();
  }, []);

  const simulateEvent = async (eventType, value) => {
    setActiveNode('trigger');
    await fetch(`${import.meta.env.VITE_API_URL}/api/devices/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, value })
    });
  };

  const simulationButtons = [
    { label: 'Trigger Motion Sensor', event: 'motion', value: true, color: 'from-blue-500 to-cyan-400' },
    { label: 'Trigger Smoke Alarm', event: 'smoke', value: true, color: 'from-red-500 to-orange-400' },
    { label: 'Open Front Door', event: 'door', value: true, color: 'from-purple-500 to-pink-400' },
    { label: 'Set Temp to 28°C', event: 'temperature', value: 28, color: 'from-brand-500 to-brand-400' },
  ];

  return (
    <div className="space-y-6 pb-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-4xl font-bold tracking-tight">FSM Simulation Lab</h2>
        <p className="text-gray-400 mt-2 text-lg">Test the real database-driven Finite State Machine engine.</p>
      </motion.div>

      {/* Visualizer Graph */}
      <GlassCard className="mb-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-900/20 via-dark-900/50 to-transparent pointer-events-none" />
        <h3 className="font-semibold text-xl mb-8 flex items-center gap-2">
          <Server className="text-brand-400" />
          Live Automation Graph
        </h3>
        
        <div className="flex flex-col md:flex-row items-center justify-between max-w-4xl mx-auto py-8 px-4 relative z-10">
          
          {/* Node 1: Event Trigger */}
          <div className={`flex flex-col items-center transition-all duration-500 ${activeNode === 'trigger' ? 'scale-110' : 'scale-100'}`}>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${activeNode === 'trigger' ? 'border-brand-400 shadow-[0_0_30px_rgba(20,184,166,0.6)] bg-brand-500/20' : 'border-gray-700 bg-dark-800'}`}>
              <Activity className={activeNode === 'trigger' ? 'text-brand-400' : 'text-gray-500'} size={32} />
            </div>
            <p className="mt-4 font-semibold">Sensor Event</p>
          </div>

          <ArrowRight className={`hidden md:block transition-colors duration-500 ${activeNode ? 'text-brand-400' : 'text-gray-700'}`} size={32} />

          {/* Node 2: FSM Engine / Current State */}
          <div className="flex flex-col items-center relative my-8 md:my-0">
            <div className="absolute -top-10 bg-brand-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(20,184,166,0.5)]">
              State: {homeState}
            </div>
            <div className={`w-32 h-32 rounded-xl flex items-center justify-center border-4 ${activeNode ? 'border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.6)] bg-blue-500/20' : 'border-gray-700 bg-dark-800'}`}>
              <Server className={activeNode ? 'text-blue-400' : 'text-gray-500'} size={40} />
            </div>
            <p className="mt-4 font-semibold text-center">FSM Engine<br/><span className="text-xs text-gray-500">(MongoDB Logging)</span></p>
          </div>

          <ArrowRight className={`hidden md:block transition-colors duration-500 ${activeNode === 'action' ? 'text-brand-400' : 'text-gray-700'}`} size={32} />

          {/* Node 3: Device Action */}
          <div className={`flex flex-col items-center transition-all duration-500 ${activeNode === 'action' ? 'scale-110' : 'scale-100'}`}>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${activeNode === 'action' ? 'border-green-400 shadow-[0_0_30px_rgba(74,222,128,0.6)] bg-green-500/20' : 'border-gray-700 bg-dark-800'}`}>
              <CheckCircle2 className={activeNode === 'action' ? 'text-green-400' : 'text-gray-500'} size={32} />
            </div>
            <p className="mt-4 font-semibold">Execute Action</p>
          </div>

        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="font-semibold text-xl mb-6 flex items-center gap-2">
            <Activity className="text-brand-400" />
            Sensor Triggers
          </h3>
          <div className="space-y-4">
            {simulationButtons.map((btn, i) => (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={i}
                onClick={() => simulateEvent(btn.event, btn.value)}
                className={`w-full py-4 px-6 rounded-xl bg-gradient-to-r ${btn.color} text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-between`}
              >
                {btn.label}
                <Plus size={24} />
              </motion.button>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold text-xl mb-6">Database Execution Log</h3>
          <div className="bg-dark-900 rounded-xl p-4 h-[300px] overflow-y-auto font-mono text-sm space-y-3 border border-white/5 custom-scrollbar">
            <AnimatePresence>
              {logs.map((log) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={log._id} 
                  className="p-3 bg-dark-800 rounded border border-white/5"
                >
                  <div className="text-gray-400 flex justify-between mb-1">
                    <span className="text-brand-500 font-bold">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className="text-xs">State: {log.stateAtTime}</span>
                  </div>
                  <div className="text-white font-semibold">Event: {log.event}</div>
                  <div className="text-green-400">Action: {log.action}</div>
                </motion.div>
              ))}
            </AnimatePresence>
            {logs.length === 0 && <div className="text-gray-500 italic">No events triggered yet.</div>}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
