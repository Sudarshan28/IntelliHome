import { Bell, Search, User, Check, X, MonitorSpeaker, Settings2 } from 'lucide-react';
import { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';

export default function Topbar() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ devices: [], automations: [] });
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        headers: { 'x-auth-token': token }
      });
      const data = await res.json();
      if (Array.isArray(data)) setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const socket = io(`${import.meta.env.VITE_API_URL}`);
    socket.on('new_notification', (notif) => {
      setNotifications(prev => [notif, ...prev]);
    });

    // Close search dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      socket.disconnect();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [token]);

  // Handle Search Input
  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim().length === 0) {
        setSearchResults({ devices: [], automations: [] });
        setShowSearch(false);
        return;
      }
      try {
        const [devRes, autoRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/devices`, { headers: { 'x-auth-token': token } }),
          fetch(`${import.meta.env.VITE_API_URL}/api/automations`, { headers: { 'x-auth-token': token } })
        ]);
        const devices = await devRes.json();
        const automations = await autoRes.json();
        
        const q = searchQuery.toLowerCase();
        setSearchResults({
          devices: devices.filter(d => d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q)),
          automations: automations.filter(a => a.name.toLowerCase().includes(q))
        });
        setShowSearch(true);
      } catch (err) {
        console.error('Search error', err);
      }
    };
    
    const debounce = setTimeout(handleSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, token]);

  const markAsRead = async (id) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, {
      method: 'PUT',
      headers: { 'x-auth-token': token }
    });
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = async () => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/readAll`, {
      method: 'PUT',
      headers: { 'x-auth-token': token }
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-20 glass border-b border-white/5 px-6 flex items-center justify-between sticky top-0 z-50">
      <div ref={searchRef} className="relative w-96">
        <div className="flex items-center gap-2 bg-dark-800/50 border border-white/10 rounded-full px-4 py-2 w-full focus-within:border-brand-500/50 transition-colors">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search devices, rules..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim().length > 0 && setShowSearch(true)}
            className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-gray-500"
          />
        </div>

        {/* Search Dropdown */}
        <AnimatePresence>
          {showSearch && (searchResults.devices.length > 0 || searchResults.automations.length > 0) && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="absolute top-12 left-0 w-full bg-dark-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2"
            >
              {searchResults.devices.length > 0 && (
                <div className="px-4 py-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Devices</h4>
                  {searchResults.devices.map(d => (
                    <div 
                      key={d._id} 
                      onClick={() => { navigate('/devices'); setShowSearch(false); setSearchQuery(''); }}
                      className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                    >
                      <MonitorSpeaker size={16} className="text-brand-400" />
                      <div>
                        <p className="text-sm text-white">{d.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{d.type} • {d.room}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {searchResults.automations.length > 0 && (
                <div className="px-4 py-2 border-t border-white/5">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Automations</h4>
                  {searchResults.automations.map(a => (
                    <div 
                      key={a._id} 
                      onClick={() => { navigate('/automations'); setShowSearch(false); setSearchQuery(''); }}
                      className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                    >
                      <Settings2 size={16} className="text-blue-400" />
                      <div>
                        <p className="text-sm text-white">{a.name}</p>
                        <p className="text-xs text-gray-400">{a.active ? 'Active' : 'Inactive'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-4 relative">
        <button 
          onClick={() => setShowNotifs(!showNotifs)}
          className={`p-2 rounded-full transition-colors relative ${showNotifs ? 'bg-white/10' : 'hover:bg-white/10'}`}
        >
          <Bell size={20} className={unreadCount > 0 ? 'text-white' : 'text-gray-400'} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,1)]" />
          )}
        </button>

        <AnimatePresence>
          {showNotifs && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-14 right-12 w-80 bg-dark-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-dark-900/50">
                <h3 className="font-bold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-brand-400 hover:text-brand-300">Mark all read</button>
                )}
              </div>
              <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">No notifications yet.</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n._id} className={`p-4 border-b border-white/5 transition-colors ${!n.read ? 'bg-brand-500/5 hover:bg-brand-500/10' : 'hover:bg-white/5'}`}>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <h4 className={`text-sm ${!n.read ? 'font-bold text-white' : 'font-medium text-gray-300'}`}>{n.title}</h4>
                          <p className={`text-xs mt-1 ${!n.read ? 'text-gray-300' : 'text-gray-500'}`}>{n.message}</p>
                          <span className="text-[10px] text-gray-500 block mt-2">{new Date(n.createdAt).toLocaleString()}</span>
                        </div>
                        {!n.read && (
                          <button onClick={() => markAsRead(n._id)} className="text-gray-500 hover:text-brand-400" title="Mark as read">
                            <Check size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center p-0.5 cursor-pointer hover:shadow-[0_0_15px_rgba(20,184,166,0.5)] transition-all"
        >
          <div className="w-full h-full bg-dark-900 rounded-full flex items-center justify-center font-bold text-brand-400 text-sm">
            {user?.name?.charAt(0) || <User size={18} />}
          </div>
        </div>
      </div>
    </header>
  );
}
