import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import { AuthContext } from '../context/AuthContext';
import { 
  Wifi, Tv, Laptop, Smartphone, Cpu, Printer, Video, 
  Activity, Power, Loader2, ShieldCheck, Zap, AlertCircle, Trash2
} from 'lucide-react';
import { io } from 'socket.io-client';
import DeviceDashboard from '../components/DeviceDashboard';

export default function Devices() {
  const { token, user } = useContext(AuthContext);
  const [devices, setDevices] = useState([]);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState({});
  const [showMonitorId, setShowMonitorId] = useState(null);
  const [showAnalyticsId, setShowAnalyticsId] = useState(null);

  const fetchRegisteredDevices = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/devices`, {
        headers: { 'x-auth-token': token }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setDevices(data);
      }
    } catch (err) {
      console.error('Failed to load registered devices:', err);
    }
  };

  useEffect(() => {
    if (!token) return;

    fetchRegisteredDevices();

    const socket = io(`${import.meta.env.VITE_API_URL}`);
    
    socket.on('devices_updated', (updatedDevices) => {
      if (Array.isArray(updatedDevices)) {
        const currentUserId = user?._id || user?.id;
        const filtered = updatedDevices.filter(d => d.userId === currentUserId && d.status !== 'DISCOVERED');
        setDevices(filtered);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user]);

  const discoverDevices = async () => {
    setIsScanning(true);
    setDiscoveredDevices([]);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/devices/discover`, {
        headers: { 'x-auth-token': token }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const unregistered = data.filter(d => d.status === 'DISCOVERED');
        setDiscoveredDevices(unregistered);
      }
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const connectDevice = async (device) => {
    const devKey = device.ip || device.mac;
    setIsConnecting(prev => ({ ...prev, [devKey]: true }));

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/devices`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token 
        },
        body: JSON.stringify({
          name: device.name,
          type: device.type,
          ip: device.ip,
          mac: device.mac,
          hostname: device.hostname,
          vendor: device.vendor,
          powerRating: device.powerRating
        })
      });
      if (res.ok) {
        setDiscoveredDevices(prev => prev.filter(d => (d.ip !== device.ip || d.mac !== device.mac)));
        fetchRegisteredDevices();
      }
    } catch (err) {
      console.error('Failed to connect device:', err);
    } finally {
      setIsConnecting(prev => ({ ...prev, [devKey]: false }));
    }
  };

  const disconnectDevice = async (id) => {
    if (!window.confirm("Are you sure you want to disconnect and unregister this device?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/devices/${id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });
      if (res.ok) {
        fetchRegisteredDevices();
        if (showMonitorId === id) setShowMonitorId(null);
        if (showAnalyticsId === id) setShowAnalyticsId(null);
      }
    } catch (err) {
      console.error('Disconnect failed:', err);
    }
  };

  const toggleDevicePower = async (device) => {
    const newStatus = device.status === 'ACTIVE' ? 'CONNECTED' : 'ACTIVE';
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/devices/${device._id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token 
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchRegisteredDevices();
      }
    } catch (err) {
      console.error('Failed to toggle device power:', err);
    }
  };

  const getDeviceIcon = (type, status) => {
    const isOffline = status === 'OFFLINE';
    const color = isOffline ? 'text-gray-600' : 'text-brand-400';
    
    switch (type) {
      case 'printer': return <Printer className={color} size={22} />;
      case 'laptop': return <Laptop className={color} size={22} />;
      case 'phone': return <Smartphone className={color} size={22} />;
      case 'tv': return <Tv className={color} size={22} />;
      case 'sensor': return <Cpu className={color} size={22} />;
      case 'camera': return <Video className={color} size={22} />;
      default: return <Wifi className={color} size={22} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'CONNECTED': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'IDLE': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'PAIRING': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'OFFLINE': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const formatUptime = (seconds) => {
    if (!seconds) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="space-y-8 pb-10 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-4xl font-bold tracking-tight">Device Management</h2>
          <p className="text-gray-400 mt-1">Discover, connect, and monitor active devices on your local network.</p>
        </div>
        <button 
          onClick={discoverDevices}
          disabled={isScanning}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-800 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(20,184,166,0.4)] disabled:shadow-none"
        >
          {isScanning ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Scanning Network...
            </>
          ) : (
            <>
              <Wifi size={20} />
              Discover Devices
            </>
          )}
        </button>
      </div>

      {/* Discovered Network Scan Section */}
      <AnimatePresence>
        {(isScanning || discoveredDevices.length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-200 flex items-center gap-2">
                <Wifi className="text-brand-400 animate-pulse" size={20} />
                Available Network Devices
              </h3>
              <span className="text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-full font-mono">
                Subnet Scan
              </span>
            </div>

            <GlassCard className="border-brand-500/20 bg-brand-950/5">
              {isScanning && discoveredDevices.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-3">
                  <Loader2 className="animate-spin text-brand-400" size={36} />
                  <p className="font-semibold text-white">Performing sweeps, pinging subnet, and scanning mDNS...</p>
                  <p className="text-xs text-gray-500">Hint: Wake up mobile devices (unlock them) to ensure they are discoverable on the network.</p>
                </div>
              )}

              <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
                {discoveredDevices.map((dev) => {
                  const devKey = dev.ip || dev.mac;
                  const connecting = isConnecting[devKey];

                  return (
                    <div key={devKey} className="flex justify-between items-center py-4 first:pt-0 last:pb-0 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-dark-800 border border-white/5">
                          {getDeviceIcon(dev.type, 'CONNECTED')}
                        </div>
                        <div>
                          <h4 className="font-bold text-white flex items-center gap-2">
                            {dev.name}
                            <span className="text-xs font-mono bg-white/5 text-gray-400 px-2 py-0.5 rounded-md">
                              {dev.type.toUpperCase()}
                            </span>
                          </h4>
                          <p className="text-xs text-gray-400 mt-1">
                            IP: <span className="font-mono text-gray-300">{dev.ip}</span> • MAC: <span className="font-mono text-gray-300">{dev.mac || 'N/A'}</span>
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Vendor: {dev.vendor}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="hidden sm:block text-right">
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            AVAILABLE
                          </span>
                        </div>
                        <button
                          onClick={() => connectDevice(dev)}
                          disabled={connecting}
                          className="bg-brand-500 hover:bg-brand-600 disabled:bg-brand-800 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] disabled:shadow-none flex items-center gap-1.5 text-xs"
                        >
                          {connecting ? (
                            <>
                              <Loader2 className="animate-spin" size={16} />
                              Pairing...
                            </>
                          ) : (
                            'Connect'
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Registered Devices List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-200 flex items-center gap-2">
          <ShieldCheck className="text-emerald-400" size={20} />
          My Connected Devices ({devices.length})
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {devices.map((device) => {
            const isMonitorOpen = showMonitorId === device._id;
            const isAnalyticsOpen = showAnalyticsId === device._id;
            const isOffline = device.status === 'OFFLINE';

            return (
              <GlassCard 
                key={device._id} 
                className={`transition-all duration-300 relative overflow-hidden group border-white/5 ${
                  !isOffline && 'hover:border-brand-500/30'
                }`}
              >
                {!isOffline && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-400 to-cyan-500" />
                )}
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3.5 rounded-xl bg-dark-800 border border-white/5 relative ${!isOffline && 'shadow-[0_0_15px_rgba(20,184,166,0.15)]'}`}>
                      {getDeviceIcon(device.type, device.status)}
                      {!isOffline && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-white flex items-center gap-2">
                        {device.name}
                        <span className="text-xs font-mono text-gray-400">({device.hostname || 'local'})</span>
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                        IP: <span className="font-mono text-gray-300">{device.ip}</span> • MAC: <span className="font-mono text-gray-300">{device.mac}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Vendor: {device.vendor}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusColor(device.status)}`}>
                      {device.status}
                    </span>

                    {device.status !== 'OFFLINE' && (
                      <button 
                        onClick={() => toggleDevicePower(device)}
                        className={`p-2 rounded-xl transition-all border ${
                          device.status === 'ACTIVE' 
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                            : 'bg-dark-800 border-white/10 hover:border-white/20 text-gray-400 hover:text-gray-200'
                        }`}
                        title={device.status === 'ACTIVE' ? "Turn OFF" : "Turn ON"}
                      >
                        <Power size={16} />
                      </button>
                    )}

                    <button 
                      onClick={() => {
                        setShowMonitorId(isMonitorOpen ? null : device._id);
                        setShowAnalyticsId(null);
                      }}
                      className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all border ${
                        isMonitorOpen ? 'bg-brand-500/20 border-brand-500/50 text-brand-400' : 'bg-dark-800 border-white/10 hover:border-white/20 text-gray-300'
                      }`}
                    >
                      Monitor
                    </button>
                    
                    <button 
                      onClick={() => {
                        setShowAnalyticsId(isAnalyticsOpen ? null : device._id);
                        setShowMonitorId(null);
                      }}
                      className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all border ${
                        isAnalyticsOpen ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-dark-800 border-white/10 hover:border-white/20 text-gray-300'
                      }`}
                    >
                      Analytics
                    </button>

                    <button 
                      onClick={() => disconnectDevice(device._id)}
                      className="p-2 bg-dark-800 border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-xl transition-all"
                      title="Disconnect & Unregister"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Real-time Monitoring Panel */}
                <AnimatePresence>
                  {isMonitorOpen && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-4 pt-4 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                      <div className="bg-dark-800/50 p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Latency</p>
                        <p className="text-lg font-bold text-brand-400 mt-0.5 font-mono">{device.latency || 0} ms</p>
                      </div>
                      <div className="bg-dark-800/50 p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total Uptime</p>
                        <p className="text-lg font-bold text-white mt-0.5 font-mono">{formatUptime(device.uptime)}</p>
                      </div>
                      <div className="bg-dark-800/50 p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Active Session</p>
                        <p className="text-lg font-bold text-white mt-0.5 font-mono">{formatUptime(device.onlineTime / 1000)}</p>
                      </div>
                      <div className="bg-dark-800/50 p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Last Checked</p>
                        <p className="text-xs font-semibold text-gray-400 mt-1.5">{new Date(device.lastSeen).toLocaleTimeString()}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Power Usage Analytics Panel */}
                <AnimatePresence>
                  {isAnalyticsOpen && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-4 pt-4 border-t border-white/5"
                    >
                      <div className="bg-dark-800/50 p-4 rounded-xl border border-cyan-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-lg bg-cyan-500/15 text-cyan-400">
                            <Zap size={20} />
                          </div>
                          <div>
                            <h5 className="font-semibold text-white">Estimated Power Consumption</h5>
                            <p className="text-xs text-gray-400 mt-0.5">Calculated dynamically based on hardware power profiles.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 md:gap-8 pr-2">
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Device Load</p>
                            <p className="text-xl font-bold text-cyan-400 font-mono mt-0.5">{device.powerRating} W</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Est. Energy Used</p>
                            <p className="text-xl font-bold text-white font-mono mt-0.5">
                              {((device.powerRating * (device.uptime || 0)) / 3600000).toFixed(4)} kWh
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Est. Cost</p>
                            <p className="text-xl font-bold text-brand-400 font-mono mt-0.5">
                              ₹{(((device.powerRating * (device.uptime || 0)) / 3600000) * 8).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            );
          })}

          {devices.length === 0 && (
            <div className="text-center py-16 text-gray-500 bg-white/5 rounded-2xl border border-white/5">
              <AlertCircle className="mx-auto text-gray-600 mb-3" size={40} />
              <h4 className="font-semibold text-white text-lg">No devices registered</h4>
              <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                Click "Discover Devices" at the top to scan your network for connected smart appliances.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Onboarding Device Dashboard */}
      <DeviceDashboard />
    </div>
  );
}
