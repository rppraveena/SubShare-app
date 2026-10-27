import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ArrowLeft,
  Loader2,
  Inbox,
  IndianRupee,
  ShieldAlert,
  Info,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { notificationService } from '../../services/notificationService';
import { useAuthStore } from '../../stores/authStore';

export const NotificationCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch notifications where user_id = currentUser.id, ordered by created_at descending
  const loadNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id || user?.id;
      if (!userId) {
        setNotifications([]);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (e) {
      console.error('Error loading notifications:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // 2. Add a Supabase Realtime listener to fetch new notifications instantly
  useEffect(() => {
    loadNotifs();

    let channel: any = null;

    const setupRealtime = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id || user?.id;
      if (!userId) return;

      channel = supabase
        .channel(`user_notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newNotif = payload.new;
            if (newNotif) {
              setNotifications((prev) => {
                if (prev.some((n) => n.id === newNotif.id)) return prev;
                return [newNotif, ...prev];
              });
            }
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, loadNotifs]);

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleItemClick = async (notif: any) => {
    if (!notif.is_read) {
      notificationService.markAsRead(notif.id).catch(console.error);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
    }

    if (notif.type === 'request') {
      navigate('/requests');
    } else if (notif.type === 'payment') {
      navigate('/payments');
    } else if (notif.type === 'report') {
      navigate('/reports/my');
    } else {
      navigate('/notifications');
    }
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case 'request':
        return <Inbox className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
      case 'payment':
        return <IndianRupee className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
      case 'report':
      case 'warning':
        return <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400" />;
      default:
        return <Info className="w-4 h-4 text-violet-500 dark:text-violet-400" />;
    }
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSecs < 60) return 'Just now';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    return `${Math.floor(diffSecs / 86400)}d ago`;
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-base font-bold tracking-tight">Notifications</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Activity & requests updates</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {notifications.some((n) => !n.is_read) && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark read</span>
            </button>
          )}
          <button onClick={loadNotifs} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 p-4 pb-24 space-y-3">
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium">Loading notifications…</p>
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3 my-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
              <Bell className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-bold">You're All Caught Up!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Notifications will appear here when users request your listings or update payments.
            </p>
          </div>
        )}

        {!loading &&
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleItemClick(notif)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                notif.is_read
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 shadow-xs'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-bold text-sm truncate">{notif.title}</h4>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    {formatTimeAgo(notif.created_at)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                  {notif.message || notif.body}
                </p>
              </div>

              {!notif.is_read && (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-1 flex-shrink-0" />
              )}
            </div>
          ))}
      </div>
    </div>
  );
};
