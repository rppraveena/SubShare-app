import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NotificationItem } from '../types';

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  loadDemoNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (item) => {
        const newNotification: NotificationItem = {
          ...item,
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: 'Just now',
          read: false,
        };
        set((state) => {
          const updated = [newNotification, ...state.notifications];
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.read).length,
          };
        });
      },

      markAsRead: (id: string) => {
        set((state) => {
          const updated = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.read).length,
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      loadDemoNotifications: () => {
        const demoItems: NotificationItem[] = [
          {
            id: 'notif-demo-1',
            title: 'Ride Request Accepted',
            message: 'Vikram Chandran accepted your carpool request for Trichy → Chennai.',
            timestamp: '15 mins ago',
            type: 'rides',
            read: false,
            link: '/activity',
          },
          {
            id: 'notif-demo-2',
            title: 'New Blood Request Nearby',
            message: 'O- blood required at ABC Hospital (1.2 km away).',
            timestamp: '1 hour ago',
            type: 'blood',
            read: false,
            link: '/services?tab=blood',
          },
        ];
        set({
          notifications: demoItems,
          unreadCount: demoItems.length,
        });
      },
    }),
    {
      name: 'trustshare_notifications_storage',
    }
  )
);
