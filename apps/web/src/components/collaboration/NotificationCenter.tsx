'use client';

import { gql, useQuery, useMutation } from '@apollo/client';
import {
    BellIcon,
    CheckIcon,
    CogIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

const GET_NOTIFICATION_HISTORY = gql`
  query GetNotificationHistory($limit: Int) {
    getNotificationHistory(limit: $limit)
  }
`;

const GET_NOTIFICATION_STATS = gql`
  query GetNotificationStats {
    getNotificationStats
  }
`;

const MARK_NOTIFICATION_AS_READ = gql`
  mutation MarkNotificationAsRead($notificationId: String!) {
    markNotificationAsRead(notificationId: $notificationId)
  }
`;

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data?: any;
  channels: string[];
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
}

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<any>(null);

  const { data: historyData, loading } = useQuery(GET_NOTIFICATION_HISTORY, {
    variables: { limit: 50 },
    skip: !isOpen,
  });

  const { data: statsData } = useQuery(GET_NOTIFICATION_STATS, {
    pollInterval: 60000, // Poll every minute
  });

  const [markAsRead] = useMutation(MARK_NOTIFICATION_AS_READ);

  useEffect(() => {
    if (historyData?.getNotificationHistory) {
      const notificationData = JSON.parse(historyData.getNotificationHistory);
      setNotifications(notificationData);
    }
  }, [historyData]);

  useEffect(() => {
    if (statsData?.getNotificationStats) {
      const statsInfo = JSON.parse(statsData.getNotificationStats);
      setStats(statsInfo);
    }
  }, [statsData]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead({ variables: { notificationId } });
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, status: 'delivered' as const }
            : n
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'high':
        return <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />;
      case 'medium':
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
      case 'low':
        return <InformationCircleIcon className="w-5 h-5 text-gray-500" />;
      default:
        return <BellIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-300 bg-white';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const unreadCount = stats?.pending || 0;

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {stats && (
                <span className="text-sm text-gray-500">
                  {stats.pending} unread
                </span>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} hover:bg-gray-50`}
                  >
                    <div className="flex space-x-3">
                      <div className="flex-shrink-0">
                        {getPriorityIcon(notification.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </h4>
                            <p className="mt-1 text-sm text-gray-700">
                              {notification.message}
                            </p>
                            <div className="mt-2 flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500 capitalize">
                                {notification.category}
                              </span>
                            </div>
                          </div>
                          {notification.status !== 'delivered' && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="ml-2 text-gray-400 hover:text-green-600"
                              title="Mark as read"
                            >
                              <CheckIcon className="w-4 h-4" />
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
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  // Implement view all functionality
                  console.log('View all notifications');
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View all
              </button>
              <button
                onClick={() => {
                  // Implement settings functionality
                  console.log('Notification settings');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <CogIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
