import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import { User, Mail, Shield, Zap, Activity, MapPin, Clock, Smartphone } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Profile() {
  const { user, logout, token } = useContext(AuthContext);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/analytics/activity`, {
      headers: { 'x-auth-token': token }
    })
    .then(res => res.json())
    .then(setStats);
  }, [token]);

  return (
    <div className="space-y-8 pb-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h2 className="text-4xl font-bold tracking-tight">Profile</h2>
        <p className="text-gray-400 mt-2 text-lg">Manage your identity and smart home score.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="col-span-1 flex flex-col items-center text-center py-10 relative overflow-hidden h-fit">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-brand-600 to-blue-600 opacity-20" />
          <div className="w-32 h-32 rounded-full bg-dark-800 border-4 border-dark-900 shadow-[0_0_20px_rgba(20,184,166,0.5)] flex items-center justify-center relative z-10 mb-6">
            <User size={64} className="text-brand-400" />
          </div>
          <h3 className="text-2xl font-bold">{user?.name}</h3>
          <p className="text-gray-400 flex items-center justify-center gap-2 mt-2">
            <Mail size={16} /> {user?.email}
          </p>
          <div className="mt-4 text-sm text-gray-500 space-y-2 text-left bg-dark-900/50 p-4 rounded-xl w-full">
            <p className="flex items-center gap-2"><MapPin size={14} className="text-brand-400"/> {user?.location?.city || 'Unknown City'}, {user?.location?.country || 'Unknown Country'}</p>
            <p className="flex items-center gap-2"><Clock size={14} className="text-brand-400"/> Last login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}</p>
            <p className="flex items-center gap-2 truncate" title={user?.deviceInfo}><Smartphone size={14} className="text-brand-400 flex-shrink-0"/> {user?.deviceInfo || 'Unknown Device'}</p>
          </div>
          <div className="mt-8 flex gap-4 w-full px-6">
            <button className="flex-1 bg-white/10 hover:bg-white/20 transition-colors py-2 rounded-xl text-sm font-medium">Edit Profile</button>
            <button onClick={logout} className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors py-2 rounded-xl text-sm font-medium">Log out</button>
          </div>
        </GlassCard>

        <div className="col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <GlassCard className="bg-gradient-to-br from-brand-900/40 to-transparent border-brand-500/30">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-brand-500/20 rounded-2xl text-brand-400"><Zap size={32} /></div>
                <div>
                  <p className="text-sm text-gray-400">Smart Home Score</p>
                  <h4 className="text-3xl font-bold text-white">{stats?.smartScore || 0}<span className="text-brand-400 text-lg">/100</span></h4>
                </div>
              </div>
            </GlassCard>
            <GlassCard className="bg-gradient-to-br from-blue-900/40 to-transparent border-blue-500/30">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-500/20 rounded-2xl text-blue-400"><Activity size={32} /></div>
                <div>
                  <p className="text-sm text-gray-400">Automations Executed</p>
                  <h4 className="text-3xl font-bold text-white">{stats?.totalAutomations || 0}</h4>
                </div>
              </div>
            </GlassCard>
          </div>
          
          <GlassCard>
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2"><Shield className="text-brand-400" /> Automation History Log</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {!stats?.recentLogs?.length ? (
                <p className="text-gray-500">No recent activity.</p>
              ) : (
                stats.recentLogs.map((log) => (
                  <div key={log._id} className="flex justify-between items-center p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                    <div>
                      <p className="text-sm font-medium">{log.action}</p>
                      <p className="text-xs text-gray-500 mt-1">Trigger: {log.event} ({log.stateAtTime})</p>
                    </div>
                    <span className="text-xs text-brand-400">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
