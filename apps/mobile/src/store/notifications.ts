import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: Date;
  isRead: boolean;
}

interface NotificationState {
  notifications: NotificationData[];
  unreadCount: number;
  pushToken?: string;
}

type NotificationStore = NotificationState & {
  addNotification: (notification: NotificationData) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  setPushToken: (token: string) => void;
  setNotifications: (notifications: NotificationData[]) => void;
};

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      pushToken: undefined,

      // Actions
      addNotification: (notification: NotificationData) => {
        set(state => ({
          notifications: [notification, ...state.notifications],
          unreadCount: notification.isRead
            ? state.unreadCount
            : state.unreadCount + 1,
        }));
      },

      markAsRead: (id: string) => {
        set(state => {
          const notifications = state.notifications.map(notification =>
            notification.id === id
              ? { ...notification, isRead: true }
              : notification
          );
          const unreadCount = notifications.filter(n => !n.isRead).length;
          return { notifications, unreadCount };
        });
      },

      markAllAsRead: () => {
        set(state => ({
          notifications: state.notifications.map(notification => ({
            ...notification,
            isRead: true,
          })),
          unreadCount: 0,
        }));
      },

      removeNotification: (id: string) => {
        set(state => {
          const notifications = state.notifications.filter(n => n.id !== id);
          const unreadCount = notifications.filter(n => !n.isRead).length;
          return { notifications, unreadCount };
        });
      },

      clearAllNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      setPushToken: (token: string) => {
        set({ pushToken: token });
      },

      setNotifications: (notifications: NotificationData[]) => {
        const unreadCount = notifications.filter(n => !n.isRead).length;
        set({ notifications, unreadCount });
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
