import { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Shield,
  LayoutDashboard,
  MessageSquare,
  UserCheck,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  pendingVerifications: number;
  todayMessages: number;
  flaggedMessages: number;
  activeUsers: number;
}

export default function AdminDashboard() {
  const { adminUser, loading, isAdmin, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingVerifications: 0,
    todayMessages: 0,
    flaggedMessages: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/admin/login');
    }
  }, [loading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get pending verifications
      const { count: pendingVerifications } = await supabase
        .from('user_verifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get today's messages
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayMessages } = await supabase
        .from('message_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Get flagged messages
      const { count: flaggedMessages } = await supabase
        .from('message_logs')
        .select('*', { count: 'exact', head: true })
        .eq('flagged', true)
        .eq('reviewed', false);

      // Get active users (logged in within last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', yesterday.toISOString());

      setStats({
        totalUsers: totalUsers || 0,
        pendingVerifications: pendingVerifications || 0,
        todayMessages: todayMessages || 0,
        flaggedMessages: flaggedMessages || 0,
        activeUsers: activeUsers || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: MessageSquare, label: 'Messages', path: '/admin/messages' },
    { icon: UserCheck, label: 'Verifications', path: '/admin/verifications' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: FileText, label: 'Reports', path: '/admin/reports' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <h1 className="font-bold text-white">Love Angel</h1>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActivePath(item.path)
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
              {adminUser?.display_name?.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {adminUser?.display_name}
                </p>
                <p className="text-xs text-slate-400 capitalize">{adminUser?.role}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full mt-3 text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 w-64"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              {stats.pendingVerifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {stats.pendingVerifications}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {location.pathname === '/admin/dashboard' ? (
            <DashboardHome stats={stats} onRefresh={fetchStats} />
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}

// Dashboard Home Component
function DashboardHome({ stats, onRefresh }: { stats: DashboardStats; onRefresh: () => void }) {
  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue' },
    { label: 'Pending Verifications', value: stats.pendingVerifications, icon: UserCheck, color: 'yellow' },
    { label: "Today's Messages", value: stats.todayMessages, icon: MessageSquare, color: 'green' },
    { label: 'Flagged Messages', value: stats.flaggedMessages, icon: FileText, color: 'red' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400">Welcome back! Here's what's happening.</p>
        </div>
        <Button onClick={onRefresh} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-800 rounded-xl p-6 border border-slate-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  stat.color === 'blue'
                    ? 'bg-blue-500/20 text-blue-400'
                    : stat.color === 'yellow'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : stat.color === 'green'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-slate-400 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/admin/verifications"
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
            >
              <UserCheck className="w-5 h-5 text-yellow-400" />
              <span className="text-white">Review pending verifications</span>
              {stats.pendingVerifications > 0 && (
                <span className="ml-auto bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full text-xs">
                  {stats.pendingVerifications} pending
                </span>
              )}
            </Link>
            <Link
              to="/admin/messages"
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
            >
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <span className="text-white">Monitor messages</span>
            </Link>
            <Link
              to="/admin/reports"
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
            >
              <FileText className="w-5 h-5 text-red-400" />
              <span className="text-white">Review user reports</span>
            </Link>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">System Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Database</span>
              <span className="flex items-center gap-2 text-green-400">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Healthy
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Storage</span>
              <span className="flex items-center gap-2 text-green-400">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Healthy
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Authentication</span>
              <span className="flex items-center gap-2 text-green-400">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Healthy
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Active Users (24h)</span>
              <span className="text-white">{stats.activeUsers}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
