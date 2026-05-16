import { Link, useLocation } from 'react-router-dom';
import { Home, MonitorSpeaker, Settings2, BarChart2, User } from 'lucide-react';
import { cn } from '../utils/cn';

const mobileNavItems = [
  { path: '/dashboard', icon: Home },
  { path: '/devices', icon: MonitorSpeaker },
  { path: '/automations', icon: Settings2 },
  { path: '/analytics', icon: BarChart2 },
  { path: '/profile', icon: User },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/5 z-50 bg-dark-900/90 backdrop-blur-xl pb-safe">
      <div className="flex items-center justify-between px-6 py-4">
        {mobileNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "p-2 rounded-xl transition-all duration-300 relative",
                isActive ? "text-brand-400" : "text-gray-400 hover:text-white"
              )}
            >
              {isActive && (
                <span className="absolute inset-0 bg-brand-500/20 rounded-xl" />
              )}
              <item.icon size={24} className="relative z-10" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
