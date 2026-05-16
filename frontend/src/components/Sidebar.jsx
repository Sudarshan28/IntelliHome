import { Link, useLocation } from 'react-router-dom';
import { Home, MonitorSpeaker, FlaskConical, Settings, BarChart2, User, Settings2 } from 'lucide-react';
import { cn } from '../utils/cn';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/devices', label: 'Devices', icon: MonitorSpeaker },
  { path: '/automations', label: 'Automations', icon: Settings2 },
  { path: '/lab', label: 'Simulation Lab', icon: FlaskConical },
  { path: '/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex w-64 glass border-r border-white/5 flex-col h-full relative z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-500 shadow-[0_0_15px_rgba(20,184,166,0.6)] flex items-center justify-center">
          <Home size={18} className="text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">Intelli<span className="text-brand-400">Home</span></h1>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden group",
                isActive ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500 shadow-[0_0_10px_rgba(20,184,166,0.8)]" />
              )}
              <item.icon size={20} className={cn("transition-colors", isActive ? "text-brand-400" : "group-hover:text-brand-400")} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
