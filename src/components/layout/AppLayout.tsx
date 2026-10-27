import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  Home,
  Layers,
  Ticket,
  Car,
  HeartHandshake,
  Utensils,
  Share2,
  Activity,
  MessageSquare,
  UserCheck,
  ShieldAlert,
  Bell,
  Search,
} from 'lucide-react';
import { BottomNav } from './BottomNav';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';

export interface AppLayoutProps {
  children?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const threads = useChatStore((state) => state.threads);
  const totalUnread = threads.reduce((acc, t) => acc + t.unreadCount, 0);

  const isAuthScreen =
    location.pathname === '/' ||
    location.pathname === '/auth' ||
    location.pathname === '/profile-setup';
  const isAdminScreen = location.pathname.startsWith('/admin');

  const baseSidebarLinks = [
    { label: 'Home Dashboard', path: '/home', icon: Home },
    { label: 'All Services', path: '/services', icon: Layers },
    { label: 'Movie & Event Tickets', path: '/services?tab=tickets', icon: Ticket },
    { label: 'Travel / Rides', path: '/services?tab=rides', icon: Car },
    { label: 'Blood Donation (SOS)', path: '/services?tab=blood', highlight: true },
    { label: 'Food Donation & NGOs', path: '/services?tab=food', icon: Utensils },
    { label: 'Subscription Sharing', path: '/services?tab=subscriptions', icon: Share2 },
    { label: 'Activity & Escrow', path: '/activity', icon: Activity },
    { label: 'Private Chat', path: '/chat', icon: MessageSquare, badge: totalUnread > 0 ? totalUnread : undefined },
    { label: 'Profile & Trust Center', path: '/profile', icon: UserCheck },
  ];

  const sidebarLinks = user?.role === 'admin'
    ? [...baseSidebarLinks, { label: 'Admin Console', path: '/admin', icon: ShieldAlert }]
    : baseSidebarLinks;

  if (isAuthScreen || isAdminScreen) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-slate-950 flex flex-col lg:flex-row text-gray-900 dark:text-slate-100 transition-colors font-sans">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-[#E5E7EB] dark:border-slate-800 h-screen sticky top-0 px-4 py-5">
        {/* Brand Cluster */}
        <Link to="/home" className="flex items-center gap-3 px-2 mb-5 group">
          <div className="w-9 h-9 rounded-md bg-[#4A90E2] text-white flex items-center justify-center font-bold text-lg shadow-2xs group-hover:bg-[#3A7BC8] transition-colors">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-lg text-[#4A90E2] dark:text-white tracking-tight flex items-center gap-1.5">
              <span>SubShare</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-normal">Peer Services Network</p>
          </div>
        </Link>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-1">
            Navigation
          </div>
          {sidebarLinks.map((item) => {
            const Icon = item.icon || Shield;
            const isActive =
              location.pathname === item.path ||
              (item.path.includes('?') && location.pathname + location.search === item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-sm text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#EBF4FE] dark:bg-blue-950/40 text-[#4A90E2] dark:text-blue-400 border-l-4 border-[#4A90E2]'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-[#F5F7FA] dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#4A90E2] dark:text-blue-400' : 'text-gray-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-[#EF4444] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* User Card in Sidebar */}
        <div className="pt-4 border-t border-[#E5E7EB] dark:border-slate-800 flex items-center justify-between px-2">
          <Link to="/profile" className="flex items-center gap-3 hover:opacity-85 transition-opacity min-w-0">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={user?.name || 'User'}
              className="w-10 h-10 rounded-full object-cover border border-[#E5E7EB] dark:border-slate-800 flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name || 'Guest User'}</div>
              <div className="text-xs text-[#4A90E2] dark:text-blue-400 font-medium">
                {user?.trustScore ?? 10}/100 Trust Score
              </div>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col items-center justify-start min-h-screen">
        <div className="w-full max-w-lg bg-[#F5F7FA] dark:bg-slate-950 min-h-screen flex flex-col relative pb-20 transition-colors">
          {/* Top App Header */}
          <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 px-4 h-14 flex items-center justify-between transition-colors">
            <Link to="/home" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-[#4A90E2] text-white flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-[#4A90E2] dark:text-white tracking-tight">SubShare</span>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                to="/services"
                className="p-2 text-gray-600 dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Search"
              >
                <Search className="w-5 h-5 text-[#4A90E2] dark:text-blue-400" />
              </Link>

              <button
                onClick={() => navigate('/notifications')}
                className="relative p-2 text-gray-600 dark:text-slate-300 hover:bg-[#F5F7FA] dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
              </button>

              <Link to="/profile">
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border border-[#E5E7EB] dark:border-slate-700"
                />
              </Link>
            </div>
          </header>

          {/* Page Route Content */}
          <main className="flex-1 flex flex-col">
            <Outlet />
          </main>

          {/* Bottom Navigation */}
          <BottomNav />
        </div>
      </div>
    </div>
  );
};
