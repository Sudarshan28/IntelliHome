import { useState, useEffect, useContext } from 'react';
import GlassCard from '../components/GlassCard';
import { Activity, Server, ArrowRight, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';

export default function SimulationLab() {
  const { token } = useContext(AuthContext);
  const [devices, setDevices] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeNode, setActiveNode] = useState(null);
  const [homeState, setHomeState] = useState('HOME');
  
  // Simulation Form State
  const [simDevice, setSimDevice] = useState('');
  const [simStatus, setSimStatus] = useState('ACTIVE');
  const [simLatency, setSimLatency] = useState(10);
  const [simPower, setSimPower] = useState(50);
  const [isInjecting, setIsInjecting] = useState(false);

  const fetchInitialData = async () => {
    try {
      const authHeaders = { 'x-auth-token': token };
      
      const devRes = await fetch(`${import.meta.env.VITE_API_URL}/api/devices`, {
        headers: authHeaders
      });
      const devData = await devRes.json();
      if (Array.isArray(devData)) {
        setDevices(devData);
        if (devData.length > 0 && !simDevice) {
          setSimDevice(devData[0]._id);
          setSimPower(devData[0].powerRating);
        }
      }

      const stateRes = await fetch(`${import.meta.env.VITE_API_URL}/api/fsm/state`, {
        headers: authHeaders
      });
      const stateData = await stateRes.json();
      setHomeState(stateData.homeMode);

      const logsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/fsm/logs`, {
        headers: authHeaders
      });
      const logsData = await logsRes.json();
      if (Array.isArray(logsData)) {
        setLogs(logsData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchInitialData();

      const socket = io(`${import.meta.env.VITE_API_URL}`);
      
      socket.on('fsm_action', (log) => {
        setLogs(prev => [log, ...prev]);
        setActiveNode('action');
        setTimeout(() => setActiveNode(null), 2000);
      });

      socket.on('fsm_state_change', setHomeState);

      return () => socket.disconnect();
    }
  }, [token]);

  // Adjust initial power default when device changes in select input
  const handleDeviceChange = (deviceId) => {
    setSimDevice(deviceId);
    const selected = devices.find(d => d._id === deviceId);
    if (selected) {
      setSimPower(selected.powerRating);
      setSimStatus(selected.status === 'DISCOVERED' ? 'ACTIVE' : selected.status);
    }
  };

  const simulateEvent = async (e) => {
    e.preventDefault();
    if (!simDevice) return;

    setActiveNode('trigger');
    setIsInjecting(true);

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/devices/simulate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token 
        },
        body: JSON.stringify({ 
          deviceId: simDevice, 
          status: simStatus,
          latency: simLatency,
          powerUsage: simPower
        })
      });
    } catch (err) {
      console.error('Simulation injection failed:', err);
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <div className="space-y-6 pb-10 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-4xl font-bold tracking-tight">FSM Simulation Lab</h2>
        <p className="text-gray-400 mt-2 text-lg">Induce virtual device state modifications and test IFTTT rules on the Finite State Machine engine.</p>
      </motion.div>

      {/* Visualizer Graph */}
      <GlassCard className="mb-6 overflow-hidden relative border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-900/20 via-dark-900/50 to-transparent pointer-events-none" />
        <h3 className="font-semibold text-xl mb-8 flex items-center gap-2">
          <Server className="text-brand-400" />
          Live Automation Graph
        </h3>
        
        <div className="flex flex-col md:flex-row items-center justify-between max-w-4xl mx-auto py-8 px-4 relative z-10">
          
          {/* Node 1: Event Trigger */}
          <div className={`flex flex-col items-center transition-all duration-500 ${activeNode === 'trigger' ? 'scale-115' : 'scale-100'}`}>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${
              activeNode === 'trigger' ? 'border-brand-400 shadow-[0_0_30px_rgba(20,184,166,0.6)] bg-brand-500/20' : 'border-gray-700 bg-dark-800'
            }`}>
              <Activity className={activeNode === 'trigger' ? 'text-brand-400' : 'text-gray-500'} size={32} />
            </div>
            <p className="mt-4 font-semibold">Simulated Event</p>
          </div>

          <ArrowRight className={`hidden md:block transition-colors duration-500 ${activeNode ? 'text-brand-400' : 'text-gray-700'}`} size={32} />

          {/* Node 2: FSM Engine / Current State */}
          <div className="flex flex-col items-center relative my-8 md:my-0">
            <div className="absolute -top-10 bg-brand-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-[0_0_15px_rgba(20,184,166,0.5)]">
              Mode: {homeState}
            </div>
            <div className={`w-32 h-32 rounded-xl flex items-center justify-center border-4 ${
              activeNode ? 'border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.6)] bg-blue-500/20' : 'border-gray-700 bg-dark-800'
            }`}>
              <Server className={activeNode ? 'text-blue-400' : 'text-gray-500'} size={40} />
            </div>
            <p className="mt-4 font-semibold text-center">FSM Rules Engine<br/><span className="text-xs text-gray-500">(MongoDB Logging)</span></p>
          </div>

          <ArrowRight className={`hidden md:block transition-colors duration-500 ${activeNode === 'action' ? 'text-brand-400' : 'text-gray-700'}`} size={32} />

          {/* Node 3: Device Action */}
          <div className={`flex flex-col items-center transition-all duration-500 ${activeNode === 'action' ? 'scale-115' : 'scale-100'}`}>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${
              activeNode === 'action' ? 'border-green-400 shadow-[0_0_30px_rgba(74,222,128,0.6)] bg-green-500/20' : 'border-gray-700 bg-dark-800'
            }`}>
              <CheckCircle2 className={activeNode === 'action' ? 'text-green-400' : 'text-gray-500'} size={32} />
            </div>
            <p className="mt-4 font-semibold">Action Dispatched</p>
          </div>

        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="border-white/5">
          <h3 className="font-semibold text-xl mb-6 flex items-center gap-2">
            <Activity className="text-brand-400" />
            Sensor & Lifecycle Simulator
          </h3>
          
          {devices.length === 0 ? (
            <div className="text-center py-16 text-gray-500 flex flex-col items-center justify-center gap-3">
              <AlertCircle size={40} className="text-gray-600" />
              <p className="font-semibold">No registered devices found.</p>
              <p className="text-xs text-gray-400 max-w-xs">
                You must connect devices in the Devices tab first in order to trigger simulation events.
              </p>
            </div>
          ) : (
            <form onSubmit={simulateEvent} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5 font-semibold">Select Target Device</label>
                <select
                  value={simDevice}
                  onChange={e => handleDeviceChange(e.target.value)}
                  className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-brand-500 text-sm font-semibold"
                >
                  {devices.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.ip || 'Local'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 font-semibold">Simulate Status</label>
                  <select
                    value={simStatus}
                    onChange={e => setSimStatus(e.target.value)}
                    className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-brand-500 text-sm font-semibold"
                  >
                    <option value="CONNECTED">CONNECTED</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="IDLE">IDLE</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 font-semibold">Simulate Latency</label>
                  <div className="flex items-center gap-3 bg-dark-800 border border-white/10 rounded-xl px-4 py-3">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={simLatency}
                      onChange={e => setSimLatency(e.target.value)}
                      className="w-full bg-transparent border-none text-white outline-none text-sm font-mono"
                    />
                    <span className="text-xs text-gray-500 font-semibold">ms</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5 font-semibold">Simulate Power Usage (Watts)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="3000"
                    step="10"
                    value={simPower}
                    onChange={e => setSimPower(e.target.value)}
                    className="flex-1 accent-brand-500"
                  />
                  <span className="w-16 text-right font-mono text-sm text-white font-bold">{simPower} W</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isInjecting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-500 to-brand-400 text-white font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mt-4 text-base"
              >
                <Play size={20} fill="white" />
                Inject Simulation Event
              </button>
            </form>
          )}
        </GlassCard>

        <GlassCard className="border-white/5 flex flex-col">
          <h3 className="font-semibold text-xl mb-6">Database FSM Execution Log</h3>
          <div className="bg-dark-900 rounded-xl p-4 flex-1 h-[320px] overflow-y-auto font-mono text-xs space-y-3.5 border border-white/5 custom-scrollbar">
            <AnimatePresence>
              {logs.map((log, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={log._id || i} 
                  className="p-3.5 bg-dark-800 rounded-xl border border-white/5 relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-500" />
                  <div className="text-gray-400 flex justify-between mb-1.5">
                    <span className="text-brand-400 font-bold">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-500">Mode: {log.stateAtTime}</span>
                  </div>
                  <div className="text-white font-semibold">Event: {log.event}</div>
                  <div className="text-emerald-400 mt-1">Action: {log.action}</div>
                </motion.div>
              ))}
            </AnimatePresence>
            {logs.length === 0 && <div className="text-gray-500 italic text-center py-20">No logs triggered yet.</div>}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
