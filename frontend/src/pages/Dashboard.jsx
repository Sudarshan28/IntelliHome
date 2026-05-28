import { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import GlassCard from '../components/GlassCard';
import { 
  Lightbulb, Thermometer, ShieldAlert, Power, Activity, 
  ShieldCheck, Home as HomeIcon, Moon, Zap, Wifi, Printer, Laptop, Smartphone, Cpu, Video, Tv
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AuthContext } from '../context/AuthContext';

export default function Dashboard() {
  const { user, token } = useContext(AuthContext);
  const [devices, setDevices] = useState([]);
  const [fsmLog, setFsmLog] = useState([]);
  const [homeState, setHomeState] = useState('HOME');
  const [liveLoad, setLiveLoad] = useState('0.000');
  const [liveEnergyData, setLiveEnergyData] = useState([]);

  useEffect(() => {
    if (!token) return;

    const socket = io(`${import.meta.env.VITE_API_URL}`);
    
    // Fetch initial registered devices
    fetch(`${import.meta.env.VITE_API_URL}/api/devices`, {
      headers: { 'x-auth-token': token }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDevices(data);
          
          // Calculate initial live load draw in W
          const initialLoad = data
            .filter(d => ['CONNECTED', 'ACTIVE', 'IDLE'].includes(d.status))
            .reduce((acc, d) => acc + d.powerRating, 0);
          setLiveLoad((initialLoad / 1000).toFixed(3));

          // Prepopulate graph with some base points
          const baseData = Array.from({ length: 7 }).map((_, idx) => {
            const time = new Date(Date.now() - (7 - idx) * 15000);
            return {
              time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              power: initialLoad + Math.floor(Math.random() * 20 - 10)
            };
          });
          setLiveEnergyData(baseData);
        }
      });

    // Fetch initial FSM state
    fetch(`${import.meta.env.VITE_API_URL}/api/fsm/state`, {
      headers: { 'x-auth-token': token }
    })
      .then(res => res.json())
      .then(data => setHomeState(data.homeMode));

    // Fetch initial FSM logs
    fetch(`${import.meta.env.VITE_API_URL}/api/fsm/logs`, {
      headers: { 'x-auth-token': token }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFsmLog(data);
        }
      });

    socket.on('devices_updated', (updatedDevices) => {
      setDevices(updatedDevices);
    });

    socket.on('fsm_action', (log) => {
      setFsmLog(prev => [log, ...prev].slice(0, 20));
    });

    socket.on('fsm_state_change', setHomeState);

    // Listen for live power update calculations
    socket.on('live_power_update', (data) => {
      setLiveLoad(data.totalLiveUsageKw);
      
      setLiveEnergyData(prev => {
        const newPoint = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          power: Math.round(parseFloat(data.totalLiveUsageKw) * 1000)
        };
        return [...prev, newPoint].slice(-10);
      });
    });

    return () => socket.disconnect();
  }, [token]);

  const changeHomeState = async (state) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/fsm/state`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ state })
    });
  };

  const getIcon = (type, status) => {
    const isOffline = status === 'OFFLINE';
    const color = isOffline ? 'text-gray-600' : 'text-brand-400';
    switch(type) {
      case 'light': return <Lightbulb className={color} size={24} />;
      case 'ac': return <Thermometer className={color} size={24} />;
      case 'alarm': return <ShieldAlert className={status === 'OFFLINE' ? 'text-gray-600' : 'text-rose-500'} size={24} />;
      case 'printer': return <Printer className={color} size={24} />;
      case 'laptop': return <Laptop className={color} size={24} />;
      case 'phone': return <Smartphone className={color} size={24} />;
      case 'sensor': return <Cpu className={color} size={24} />;
      case 'camera': return <Video className={color} size={24} />;
      case 'tv': return <Tv className={color} size={24} />;
      default: return <Power className={color} size={24} />;
    }
  };

  const registeredDevices = devices.filter(d => d.status !== 'DISCOVERED');
  const activeCount = registeredDevices.filter(d => ['CONNECTED', 'ACTIVE', 'IDLE'].includes(d.status)).length;
  const isSystemAlert = homeState === 'ALERT';

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-4xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-gray-400 mt-2 text-lg">Welcome home, {user?.name}. The system is monitoring your space.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass px-6 py-3 rounded-full flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSystemAlert ? 'bg-red-400' : 'bg-brand-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isSystemAlert ? 'bg-red-500' : 'bg-brand-500'}`}></span>
            </span>
            <span className={`font-semibold ${isSystemAlert ? 'text-red-400' : 'text-brand-400'}`}>{homeState}</span>
          </div>
          <div className="w-px h-6 bg-white/20" />
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <Wifi size={16} /> All systems online
          </div>
        </motion.div>
      </div>

      {/* Top Stats */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          { label: 'Registered Devices', value: registeredDevices.length, icon: Power, color: 'text-blue-400' },
          { label: 'Active Devices', value: activeCount, icon: Activity, color: 'text-brand-400' },
          { label: 'Energy Usage Load', value: `${liveLoad} kW`, icon: Zap, color: 'text-yellow-400' },
          { label: 'Security Status', value: isSystemAlert ? 'BREACHED' : 'Secure', icon: isSystemAlert ? ShieldAlert : ShieldCheck, color: isSystemAlert ? 'text-red-500' : 'text-green-400' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <GlassCard className="flex items-center justify-between h-full">
              <div>
                <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
                <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
              </div>
              <div className={`p-4 rounded-2xl bg-dark-800/80 border border-white/5 ${stat.color}`}>
                <stat.icon size={28} />
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick State Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { state: 'HOME', icon: HomeIcon, desc: 'Normal operation' },
          { state: 'AWAY', icon: ShieldAlert, desc: 'Security arms, low device load' },
          { state: 'NIGHT', icon: Moon, desc: 'Dim lights, quiet monitoring' }
        ].map((mode, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.08, rotateX: 5, boxShadow: "0px 15px 35px rgba(20,184,166,0.4)" }}
            whileTap={{ scale: 0.92 }}
            onClick={() => changeHomeState(mode.state)}
            style={{ perspective: 1000 }}
            className={`w-full p-6 rounded-2xl border text-left transition-all ${
              homeState === mode.state 
                ? 'bg-brand-500/20 border-brand-500 shadow-[0_0_30px_rgba(20,184,166,0.5)]' 
                : 'glass hover:bg-white/10 border-white/10'
            }`}
          >
            <div className="flex items-center gap-4">
              <mode.icon size={32} className={homeState === mode.state ? 'text-brand-400' : 'text-gray-400'} />
              <div>
                <h3 className="text-xl font-bold">{mode.state}</h3>
                <p className="text-gray-400 text-sm">{mode.desc}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="col-span-2 min-h-[400px] h-[450px] md:h-auto flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-xl">Real-time Load Monitor (Watts)</h3>
            <span className="text-xs font-semibold px-2.5 py-1 bg-brand-500/20 text-brand-400 rounded-full animate-pulse border border-brand-500/20">
              Live Feed
            </span>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={liveEnergyData}>
                <defs>
                  <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 11}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#14b8a6', fontWeight: 'bold' }}
                  formatter={(value) => [`${value} W`, 'Instantaneous Draw']}
                />
                <Area type="monotone" dataKey="power" stroke="#2dd4bf" strokeWidth={4} fillOpacity={1} fill="url(#colorPower)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="min-h-[400px] h-[450px] md:h-auto flex flex-col">
          <h3 className="font-semibold text-xl mb-4 flex items-center gap-2">
            <Activity className="text-brand-400" size={20} />
            FSM Event Log
          </h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {fsmLog.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">Waiting for events...</div>
            ) : (
              fsmLog.map((log, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={log._id || i} 
                  className="p-4 rounded-xl bg-dark-800/60 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500" />
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-mono text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span className="text-xs text-gray-500">{log.stateAtTime}</span>
                  </div>
                  <p className="text-sm font-semibold text-white mt-2">{log.event}</p>
                  <p className="text-xs text-gray-400 mt-1">{log.action}</p>
                </motion.div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
