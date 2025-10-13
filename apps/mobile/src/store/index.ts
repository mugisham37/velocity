// Re-export all stores for centralized access
export { useAuthStore } from './auth';
export { useNotificationStore } from './notifications';
export { useOfflineStore } from './offline';
export { useSyncStore } from './sync';

// For backward compatibility with Redux selectors
export type RootState = any;
