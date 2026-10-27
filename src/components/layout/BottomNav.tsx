import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Layers, Inbox, MessageSquare, User, Building2, HeartHandshake, ShieldAlert, Flag } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { requestsService } from '../../services/requestsService';
import { supabase } from '../../lib/supabase';

export interface BottomNavProps {
  className?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ className = '' }) => {
  const user = useAuthStore((s) => s.user);

  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    const fetchPendingAndChat = async () => {
      try {
        const pCount = await requestsService.getPendingCount();
        setPendingRequestsCount(pCount);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: rooms } = await supabase
          .from('chat_rooms')
          .select('id')
          .contains('participant_ids', [user.id]);

        if (!rooms || rooms.length === 0) {
          setUnreadChatCount(0);
          return;
        }

        const roomIds = rooms.map((r) => r.id);
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .in('room_id', roomIds)
          .eq('is_read', false)
          .neq('sender_id', user.id);

        setUnreadChatCount(count || 0);
      } catch {
        setPendingRequestsCount(0);
        setUnreadChatCount(0);
      }
    };

    fetchPendingAndChat();
    const interval = setInterval(fetchPendingAndChat, 10000);
    return () => clearInterval(interval);
  }, []);

  const isAdmin = user?.role === 'admin' || user?.is_admin === true;
  const isOrg = user?.accountType === 'organization' || user?.isOrganization === true;

  const individualNavItems = [
    { label: 'Home', path: '/home', icon: Home },
    { label: 'Services', path: '/services', icon: Layers },
    { label: 'Requests', path: '/requests', icon: Inbox, badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined },
    { label: 'Chat', path: '/chat', icon: MessageSquare, badge: unreadChatCount > 0 ? unreadChatCount : undefined },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  const orgNavItems = [
    { label: 'Home', path: '/organization/home', icon: Home },
    { label: 'Donations', path: '/organization/donations', icon: Building2 },
    { label: 'Blood', path: '/organization/blood', icon: HeartHandshake },
    { label: 'Chat', path: '/chat', icon: MessageSquare, badge: unreadChatCount > 0 ? unreadChatCount : undefined },
    { label: 'Org Profile', path: '/organization/profile', icon: User },
  ];

  const adminNavItems = [
    { label: 'Dashboard', path: '/admin', icon: ShieldAlert },
    { label: 'Reports', path: '/admin/reports', icon: Flag },
    { label: 'Services', path: '/services', icon: Layers },
    { label: 'Chat', path: '/chat', icon: MessageSquare, badge: unreadChatCount > 0 ? unreadChatCount : undefined },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  const navItems = isAdmin ? adminNavItems : isOrg ? orgNavItems : individualNavItems;

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-[#E5E7EB] dark:border-slate-800 px-2 py-1.5 max-w-lg mx-auto md:max-w-md transition-colors ${className}`}
    >
      <div className="flex items-center justify-around h-12">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center py-1 px-2 transition-colors min-w-[58px] ${
                  isActive
                    ? 'text-[#0A66C2] dark:text-blue-400 font-semibold'
                    : 'text-[#9CA3AF] dark:text-slate-400 hover:text-gray-900 dark:hover:text-white font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.25px]' : 'stroke-[1.75px]'}`} />
                    {item.badge && (
                      <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#CC1016] text-white text-[10px] font-bold flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] mt-0.5 tracking-tight font-sans">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
