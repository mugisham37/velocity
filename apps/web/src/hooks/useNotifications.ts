'use client';

import { useCallback } from 'react';
import { useAppStore } from '@/stores/app';

export function useNotifications() {
  const {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  } = useAppStore();

  // Convenience methods for different notification types
  const showSuccess = useCallback((title: string, message?: string, duration = 5000) => {
    addNotification({
      type: 'success',
      title,
      message,
      duration,
    });
  }, [addNotification]);

  const showError = useCallback((title: string, message?: string, duration = 0) => {
    addNotification({
      type: 'error',
      title,
      message,
      duration, // 0 means no auto-dismiss for errors
    });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message?: string, duration = 7000) => {
    addNotification({
      type: 'warning',
      title,
      message,
      duration,
    });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message?: string, duration = 5000) => {
    addNotification({
      type: 'info',
      title,
      message,
      duration,
    });
  }, [addNotification]);

  // Handle API errors
  const showApiError = useCallback((error: unknown, fallbackMessage = 'An error occurred') => {
    let message = fallbackMessage;
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    showError('Error', message);
  }, [showError]);

  // Handle API success
  const showApiSuccess = useCallback((message = 'Operation completed successfully') => {
    showSuccess('Success', message);
  }, [showSuccess]);

  return {
    // State
    notifications,
    unreadCount,
    
    // Actions
    addNotification,
    removeNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    
    // Convenience methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showApiError,
    showApiSuccess,
  };
}