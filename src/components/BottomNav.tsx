import { useLocation, useNavigate } from 'react-router-dom';
import { Heart, Users, MessageCircle, User, Search } from 'lucide-react';

const navItems = [
  { path: '/discover', icon: Heart, label: 'Discover' },
  { path: '/browse', icon: Search, label: 'Browse' },
  { path: '/matches', icon: Users, label: 'Matches' },
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div
                  className={`p-2 rounded-xl transition-all ${
                    isActive ? 'gradient-primary shadow-soft' : ''
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-primary-foreground' : ''
                    }`}
                  />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
