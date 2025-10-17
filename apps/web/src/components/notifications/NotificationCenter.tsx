'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Settings, Filter } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useWebSocketChannel } from '@/lib/websocket/hooks';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Notification Center Component
 * 
 * A comprehensive notification center that displays both in-app notifications
 * and real-time notifications from the WebSocket connection.
 */

interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
  metadata?: any;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const { unreadCount } = useNotifications();

  // Handle real-time notification updates
  const handleNotificationMessage = (message: any) => {
    const { type, data } = message;

    switch (type) {
      case 'notification':
        addNotification(data.notification);
        break;
      case 'notification_read':
        markAsRead(data.notificationId);
        break;
      case 'notification_list':
        setNotifications(data.notifications || []);
        break;
    }
  };

  const { isSubscribed, sendMessage } = useWebSocketChannel(
    'notifications',
    handleNotificationMessage
  );

  // Add new notification
  const addNotification = (notification: NotificationItem) => {
    setNotifications(prev => [notification, ...prev].slice(0, 100)); // Keep last 100
  };

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    sendMessage({ action: 'mark_all_read' });
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
    sendMessage({ action: 'clear_all' });
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'urgent':
        return notification.priority === 'urgent';
      default:
        return true;
    }
  });

  // Load notifications on mount
  useEffect(() => {
    if (isSubscribed) {
      sendMessage({ action: 'get_notifications', limit: 50 });
    }
  }, [isSubscribed, sendMessage]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'normal':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Notifications
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex space-x-1 mt-3">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'unread', label: 'Unread' },
                    { key: 'urgent', label: 'Urgent' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setFilter(tab.key as any)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        filter === tab.key
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Actions */}
                {filteredNotifications.length > 0 && (
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center space-x-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                    >
                      <CheckCheck className="h-3 w-3" />
                      <span>Mark all read</span>
                    </button>
                    <button
                      onClick={clearAll}
                      className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded"
                    >
                      <X className="h-3 w-3" />
                      <span>Clear all</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Icon */}
                          <div className="flex-shrink-0 mt-1">
                            <span className="text-lg">
                              {getNotificationIcon(notification.type)}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${
                                  !notification.read ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  {notification.title}
                                </p>
                                {notification.message && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {notification.message}
                                  </p>
                                )}
                              </div>

                              {/* Priority Badge */}
                              {notification.priority !== 'normal' && (
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                                  getPriorityColor(notification.priority)
                                }`}>
                                  {notification.priority}
                                </span>
                              )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs text-blue-600 hover:text-blue-700"
                                >
                                  Mark as read
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900">
                  <Settings className="h-4 w-4" />
                  <span>Notification settings</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}