import { supabase } from '../lib/supabase';

export const notificationService = {
  /** Task 4: Fetch notifications where user_id = currentUser.id, order by created_at desc */
  async getNotifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase select notifications failed:', error.message);
        throw error;
      }

      return (data || []).map((n) => ({
        ...n,
        body: n.body || n.message || '',
      }));
    } catch (err: any) {
      console.error('Error in notificationService.getNotifications:', err?.message || err);
      return [];
    }
  },

  async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Supabase update notification is_read failed:', error.message);
      }
    } catch (err: any) {
      console.error('Error in markAsRead:', err?.message || err);
    }
  },

  async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Supabase markAllAsRead failed:', error.message);
      }
    } catch (err: any) {
      console.error('Error in markAllAsRead:', err?.message || err);
    }
  },

  /** Task 4: Set up Supabase realtime channel for new notifications */
  subscribeToNotifications(userId: string, callback: (notif: any) => void) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => callback(payload.new)
      )
      .subscribe();
  },
};

export default notificationService;
