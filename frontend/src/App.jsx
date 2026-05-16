import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { io } from 'socket.io-client';
import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import SimulationLab from './pages/SimulationLab';
import Automations from './pages/Automations';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

// Components
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import MobileNav from './components/MobileNav';

const pageVariants = {
  initial: { opacity: 0, y: 30, scale: 0.98, rotateX: 5 },
  animate: { opacity: 1, y: 0, scale: 1, rotateX: 0 },
  exit: { opacity: 0, y: -30, scale: 0.98, rotateX: -5 }
};

const PageWrapper = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
    className="h-full origin-bottom"
    style={{ perspective: 1000 }}
  >
    {children}
  </motion.div>
);

function AppRoutes() {
  const location = useLocation();
  const isAuthRoute = ['/', '/login', '/register'].includes(location.pathname);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Request Native Notification Permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const socket = io(`${import.meta.env.VITE_API_URL}`);
    socket.on('new_notification', (notif) => {
      setNotification(notif);
      setTimeout(() => setNotification(null), 5000);

      // Trigger Native HTML5 Notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`IntelliHome: ${notif.title}`, {
          body: notif.message,
          icon: '/favicon.ico' // Assuming there is a default favicon
        });
      }
    });
    return () => socket.disconnect();
  }, []);

  return (
    <AnimatePresence mode="wait">
      {notification && (
        <motion.div 
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -50, x: '-50%' }}
          className="fixed top-6 left-1/2 z-50 flex items-center gap-3 p-4 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] border bg-dark-800 text-white w-[90vw] max-w-[350px]"
          style={{ borderColor: notification.type === 'alert' ? '#ef4444' : '#14b8a6' }}
        >
          <div className={`p-2 rounded-lg ${notification.type === 'alert' ? 'bg-red-500/20 text-red-500' : 'bg-brand-500/20 text-brand-400'}`}>
            <Bell size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm">{notification.title}</h4>
            <p className="text-xs text-gray-300 mt-0.5">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-gray-500 hover:text-white">
            <X size={16} />
          </button>
        </motion.div>
      )}

      {isAuthRoute ? (
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><Landing /></PageWrapper>} />
          <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
          <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
        </Routes>
      ) : (
        <div className="flex h-screen overflow-hidden bg-dark-900 text-white selection:bg-brand-500/30">
          <Sidebar />
          <div className="flex-1 flex flex-col relative z-0 overflow-y-auto overflow-x-hidden">
            <Topbar />
            <main className="flex-1 p-6 pb-24 md:pb-6 lg:p-10 z-10 relative">
              <div className="absolute inset-0 bg-brand-500/5 blur-[120px] rounded-full pointer-events-none" />
              <Routes location={location} key={location.pathname}>
                <Route path="/dashboard" element={<ProtectedRoute><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>} />
                <Route path="/devices" element={<ProtectedRoute><PageWrapper><Devices /></PageWrapper></ProtectedRoute>} />
                <Route path="/automations" element={<ProtectedRoute><PageWrapper><Automations /></PageWrapper></ProtectedRoute>} />
                <Route path="/lab" element={<ProtectedRoute><PageWrapper><SimulationLab /></PageWrapper></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><PageWrapper><Analytics /></PageWrapper></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><PageWrapper><Settings /></PageWrapper></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><PageWrapper><Profile /></PageWrapper></ProtectedRoute>} />
              </Routes>
            </main>
          </div>
          <MobileNav />
        </div>
      )}
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
