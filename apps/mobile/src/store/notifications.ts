import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NotificationData } from '@types/index';

interface NotificationState {
  notifications: NotificationData[];
  unreadCount: number;
  pushToken?: string;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  pushToken: undefined,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<NotificationData>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },

    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(
        n => n.id === action.payload
      );
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    markAllAsRead: state => {
      state.notifications.forEach(notification => {
        notification.isRead = true;
      });
      state.unreadCount = 0;
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    },

    clearAllNotifications: state => {
      state.notifications = [];
      state.unreadCount = 0;
    },

    setPushToken: (state, action: PayloadAction<string>) => {
      state.pushToken = action.payload;
    },

    setNotifications: (state, action: PayloadAction<NotificationData[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(n => !n.isRead).length;
    },
  },
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearAllNotifications,
  setPushToken,
  setNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;
