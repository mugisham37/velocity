'use client';

import React, { useEffect, useCallback } from 'react';
import { useRealtimeNotifications } from '@/lib/websocket/hooks';
import { useNotifications } from '@/hooks/useNotifications';
import { useAppStore } from '@/stores/app';

/**
 * Real-time Notification Manager Component
 * 
 * This component manages real-time notifications received through WebSocket
 * and integrates them with the existing notification system.
 */

export interface RealtimeNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
  source: 'system' | 'user' | 'workflow' | 'integration';
  metadata?: {
    doctype?: string;
    docname?: string;
    user?: string;
    action?: string;
    [key: string]: any;
  };
  timestamp: Date;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: () => void;
}

export interface NotificationPreferences {
  email: boolean;
  browser: boolean;
  sound: boolean;
  categories: {
    [category: string]: boolean;
  };
  priorities: {
    low: boolean;
    normal: boolean;
    high: boolean;
    urgent: boolean;
  };
}

export function RealtimeNotificationManager() {
  const { 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo,
    addNotification 
  } = useNotifications();
  
  const { preferences } = useAppStore();

  // Handle real-time notification messages
  const handleRealtimeMessage = useCallback((message: any) => {
    const { type, data } = message;

    switch (type) {
      case 'notification':
        handleIncomingNotification(data.notification);
        break;
      
      case 'notification_update':
        handleNotificationUpdate(data);
        break;
      
      case 'notification_batch':
        data.notifications?.forEach((notification: RealtimeNotification) => {
          handleIncomingNotification(notification);
        });
        break;
      
      case 'notification_settings_changed':
        handleSettingsChange(data);
        break;
    }
  }, []);

  const { isSubscribed } = useRealtimeNotifications();

  // Handle incoming notification
  const handleIncomingNotification = useCallback((notification: RealtimeNotification) => {
    // Check if notification should be shown based on preferences
    if (!shouldShowNotification(notification, preferences.notifications)) {
      return;
    }

    // Play sound if enabled
    if (preferences.notifications.sound && notification.priority !== 'low') {
      playNotificationSound(notification.priority);
    }

    // Show browser notification if enabled and supported
    if (preferences.notifications.browser && 'Notification' in window) {
      showBrowserNotification(notification);
    }

    // Add to in-app notification system
    const duration = notification.duration || getDurationByPriority(notification.priority);
    
    switch (notification.type) {
      case 'success':
        showSuccess(notification.title, notification.message, duration);
        break;
      case 'error':
        showError(notification.title, notification.message, duration);
        break;
      case 'warning':
        showWarning(notification.title, notification.message, duration);
        break;
      case 'info':
        showInfo(notification.title, notification.message, duration);
        break;
    }

    // Store notification for history
    storeNotificationHistory(notification);
  }, [preferences, showSuccess, showError, showWarning, showInfo]);

  // Handle notification updates (mark as read, etc.)
  const handleNotificationUpdate = useCallback((data: any) => {
    // Handle notification status updates
    console.log('Notification update:', data);
  }, []);

  // Handle settings changes
  const handleSettingsChange = useCallback((data: any) => {
    console.log('Notification settings changed:', data);
  }, []);

  // Check if notification should be shown based on preferences
  const shouldShowNotification = (
    notification: RealtimeNotification,
    prefs: any
  ): boolean => {
    // Check if notifications are enabled
    if (!prefs.enabled) return false;

    // Check category preferences
    if (prefs.categories && !prefs.categories[notification.category]) {
      return false;
    }

    // Check priority preferences
    if (prefs.priorities && !prefs.priorities[notification.priority]) {
      return false;
    }

    return true;
  };

  // Get notification duration based on priority
  const getDurationByPriority = (priority: string): number => {
    switch (priority) {
      case 'urgent': return 0; // No auto-dismiss
      case 'high': return 10000; // 10 seconds
      case 'normal': return 5000; // 5 seconds
      case 'low': return 3000; // 3 seconds
      default: return 5000;
    }
  };

  // Play notification sound
  const playNotificationSound = (priority: string) => {
    try {
      const audio = new Audio();
      
      switch (priority) {
        case 'urgent':
          audio.src = '/sounds/urgent-notification.mp3';
          break;
        case 'high':
          audio.src = '/sounds/high-notification.mp3';
          break;
        default:
          audio.src = '/sounds/default-notification.mp3';
          break;
      }
      
      audio.volume = 0.5;
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  };

  // Show browser notification
  const showBrowserNotification = (notification: RealtimeNotification) => {
    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent',
        silent: notification.priority === 'low',
      });

      // Auto-close after duration (except for urgent notifications)
      if (notification.priority !== 'urgent') {
        setTimeout(() => {
          browserNotification.close();
        }, getDurationByPriority(notification.priority));
      }

      // Handle click
      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        
        // Navigate to relevant document if metadata is available
        if (notification.metadata?.doctype && notification.metadata?.docname) {
          // You can implement navigation logic here
          console.log('Navigate to:', notification.metadata);
        }
      };
    }
  };

  // Store notification in history
  const storeNotificationHistory = (notification: RealtimeNotification) => {
    // You can implement persistent storage here
    // For now, just log it
    console.log('Storing notification:', notification);
  };

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  // This component doesn't render anything visible
  // It just manages real-time notifications in the background
  return null;
}

/**
 * Notification Preferences Component
 */
export function NotificationPreferences() {
  const { preferences, updatePreferences } = useAppStore();

  const updateNotificationPreferences = (updates: Partial<NotificationPreferences>) => {
    updatePreferences({
      notifications: {
        ...preferences.notifications,
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure how you want to receive notifications
        </p>
      </div>

      <div className="space-y-4">
        {/* Delivery Methods */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Delivery Methods</h4>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.notifications?.browser || false}
                onChange={(e) => updateNotificationPreferences({ browser: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Browser notifications</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.notifications?.email || false}
                onChange={(e) => updateNotificationPreferences({ email: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Email notifications</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.notifications?.sound || false}
                onChange={(e) => updateNotificationPreferences({ sound: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Sound notifications</span>
            </label>
          </div>
        </div>

        {/* Priority Levels */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Priority Levels</h4>
          <div className="space-y-2">
            {['urgent', 'high', 'normal', 'low'].map((priority) => (
              <label key={priority} className="flex items-center">
                <input
                  type="checkbox"
                  checked={true} // Default to true for demo
                  onChange={(e) => {
                    // Handle priority preference change
                    console.log(`Priority ${priority} changed to:`, e.target.checked);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">{priority} priority</span>
              </label>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Categories</h4>
          <div className="space-y-2">
            {['system', 'workflow', 'documents', 'reports', 'integrations'].map((category) => (
              <label key={category} className="flex items-center">
                <input
                  type="checkbox"
                  checked={true} // Default to true for demo
                  onChange={(e) => {
                    // Handle category preference change
                    console.log(`Category ${category} changed to:`, e.target.checked);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">{category}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}