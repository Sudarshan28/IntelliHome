import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import { Bell, Shield, Moon, Smartphone, Globe } from 'lucide-react';
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Toggle = ({ active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-12 h-6 rounded-full transition-colors relative ${active ? 'bg-brand-500' : 'bg-gray-600'}`}
  >
    <motion.div 
      layout
      className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-md"
      initial={false}
      animate={{ left: active ? '28px' : '4px' }}
    />
  </button>
);

export default function Settings() {
  const { token } = useContext(AuthContext);
  const [settings, setSettings] = useState({
    pushNotifs: true,
    emailAlerts: false,
    autoAway: true,
    darkMode: true,
    remoteAccess: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/settings`, {
      headers: { 'x-auth-token': token }
    })
    .then(res => res.json())
    .then(data => {
      if (data) setSettings(data);
      setLoading(false);
    });
  }, [token]);

  const toggle = async (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    
    await fetch(`${import.meta.env.VITE_API_URL}/api/settings`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-auth-token': token 
      },
      body: JSON.stringify({ [key]: newSettings[key] })
    });
  };

  if (loading) return <div className="text-brand-500 text-center mt-20">Loading settings...</div>;

  return (
    <div className="space-y-8 pb-10 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-4xl font-bold tracking-tight">Settings</h2>
        <p className="text-gray-400 mt-2 text-lg">Configure your smart home ecosystem.</p>
      </motion.div>

      <GlassCard className="space-y-6">
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
          <Bell className="text-brand-400" />
          <h3 className="text-xl font-semibold">Notifications</h3>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Push Notifications</p>
            <p className="text-sm text-gray-400">Receive alerts on your mobile device</p>
          </div>
          <Toggle active={settings.pushNotifs} onClick={() => toggle('pushNotifs')} />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Email Security Alerts</p>
            <p className="text-sm text-gray-400">Get emailed when the alarm is triggered</p>
          </div>
          <Toggle active={settings.emailAlerts} onClick={() => toggle('emailAlerts')} />
        </div>
      </GlassCard>

      <GlassCard className="space-y-6">
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
          <Shield className="text-brand-400" />
          <h3 className="text-xl font-semibold">Automation & Security</h3>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Auto-Away Mode</p>
            <p className="text-sm text-gray-400">Automatically arm system when phone leaves geofence</p>
          </div>
          <Toggle active={settings.autoAway} onClick={() => toggle('autoAway')} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Remote Access</p>
            <p className="text-sm text-gray-400">Allow control from outside the home Wi-Fi network</p>
          </div>
          <Toggle active={settings.remoteAccess} onClick={() => toggle('remoteAccess')} />
        </div>
      </GlassCard>
    </div>
  );
}
