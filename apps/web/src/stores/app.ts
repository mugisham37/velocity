import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  timestamp: Date;
  read: boolean;
}

// Loading state for different operations
export interface LoadingState {
  global: boolean;
  saving: boolean;
  fetching: boolean;
  submitting: boolean;
  [key: string]: boolean;
}

// User preferences
export interface UserPreferences {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  listPageSize: number;
  autoSave: boolean;
  notifications: {
    email: boolean;
    browser: boolean;
    sound: boolean;
  };
}

// Application state interface
interface AppState {
  // UI State
  sidebarOpen: boolean;
  currentModule: string;
  currentWorkspace: string;
  currentDoctype?: string;
  currentDoc?: string;
  
  // Loading states
  loading: LoadingState;
  
  // User preferences
  preferences: UserPreferences;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Network status
  isOnline: boolean;
  
  // Error handling
  globalError: string | null;
  
  // Modal/Dialog state
  modals: {
    [key: string]: boolean;
  };
}

// Store interface with actions
interface AppStore extends AppState {
  // UI Actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setCurrentModule: (module: string) => void;
  setCurrentWorkspace: (workspace: string) => void;
  setCurrentLocation: (doctype?: string, doc?: string) => void;
  
  // Loading actions
  setLoading: (key: keyof LoadingState | string, loading: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
  
  // Preferences actions
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  
  // Network actions
  setOnlineStatus: (online: boolean) => void;
  
  // Error actions
  setGlobalError: (error: string | null) => void;
  clearGlobalError: () => void;
  
  // Modal actions
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  toggleModal: (modalId: string) => void;
  closeAllModals: () => void;
}

// Default preferences
const defaultPreferences: UserPreferences = {
  sidebarCollapsed: false,
  theme: 'light',
  language: 'en',
  timezone: 'UTC',
  dateFormat: 'DD-MM-YYYY',
  timeFormat: '24h',
  numberFormat: '#,##0.##',
  listPageSize: 20,
  autoSave: true,
  notifications: {
    email: true,
    browser: true,
    sound: false,
  },
};

// Default loading state
const defaultLoadingState: LoadingState = {
  global: false,
  saving: false,
  fetching: false,
  submitting: false,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarOpen: true,
      currentModule: 'Home',
      currentWorkspace: 'Home',
      currentDoctype: undefined,
      currentDoc: undefined,
      loading: defaultLoadingState,
      preferences: defaultPreferences,
      notifications: [],
      unreadCount: 0,
      isOnline: true,
      globalError: null,
      modals: {},

      // UI Actions
      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setCurrentModule: (module: string) => {
        set({ currentModule: module });
      },

      setCurrentWorkspace: (workspace: string) => {
        set({ currentWorkspace: workspace });
      },

      setCurrentLocation: (doctype?: string, doc?: string) => {
        set({ currentDoctype: doctype, currentDoc: doc });
      },

      // Loading actions
      setLoading: (key: keyof LoadingState | string, loading: boolean) => {
        set((state) => ({
          loading: {
            ...state.loading,
            [key]: loading,
          },
        }));
      },

      setGlobalLoading: (loading: boolean) => {
        set((state) => ({
          loading: {
            ...state.loading,
            global: loading,
          },
        }));
      },

      // Preferences actions
      updatePreferences: (newPreferences: Partial<UserPreferences>) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...newPreferences,
          },
        }));
      },

      resetPreferences: () => {
        set({ preferences: defaultPreferences });
      },

      // Notification actions
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          read: false,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));

        // Auto-remove notification after duration
        if (notification.duration && notification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(newNotification.id);
          }, notification.duration);
        }
      },

      removeNotification: (id: string) => {
        set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          const wasUnread = notification && !notification.read;
          
          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
          };
        });
      },

      markNotificationRead: (id: string) => {
        set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          if (!notification || notification.read) return state;

          return {
            notifications: state.notifications.map(n =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: state.unreadCount - 1,
          };
        });
      },

      markAllNotificationsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      // Network actions
      setOnlineStatus: (online: boolean) => {
        set({ isOnline: online });
      },

      // Error actions
      setGlobalError: (error: string | null) => {
        set({ globalError: error });
      },

      clearGlobalError: () => {
        set({ globalError: null });
      },

      // Modal actions
      openModal: (modalId: string) => {
        set((state) => ({
          modals: {
            ...state.modals,
            [modalId]: true,
          },
        }));
      },

      closeModal: (modalId: string) => {
        set((state) => ({
          modals: {
            ...state.modals,
            [modalId]: false,
          },
        }));
      },

      toggleModal: (modalId: string) => {
        set((state) => ({
          modals: {
            ...state.modals,
            [modalId]: !state.modals[modalId],
          },
        }));
      },

      closeAllModals: () => {
        set({ modals: {} });
      },
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        preferences: state.preferences,
        sidebarOpen: state.sidebarOpen,
        currentModule: state.currentModule,
        currentWorkspace: state.currentWorkspace,
      }),
    }
  )
);
