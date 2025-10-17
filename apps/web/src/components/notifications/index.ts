/**
 * Real-time Notifications Module
 * 
 * This module provides comprehensive real-time notification capabilities
 * including WebSocket-based notifications, notification center, and preferences.
 */

export { RealtimeNotificationManager, NotificationPreferences } from './RealtimeNotificationManager';
export { NotificationCenter } from './NotificationCenter';

export type {
  RealtimeNotification,
  NotificationAction,
  NotificationPreferences as NotificationPreferencesType,
} from './RealtimeNotificationManager';