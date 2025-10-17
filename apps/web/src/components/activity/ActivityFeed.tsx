'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useActivityFeed } from '@/lib/websocket/hooks';
import { 
  Clock, 
  User, 
  FileText, 
  Edit3, 
  Trash2, 
  Plus, 
  Send, 
  Eye,
  Filter,
  Search,
  RefreshCw,
  MessageCircle,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Activity Feed Component
 * 
 * Displays real-time activity updates with filtering, search, and interaction capabilities.
 */

export interface ActivityItem {
  id: string;
  type: 'document' | 'comment' | 'notification' | 'system' | 'workflow';
  action: string;
  title: string;
  description?: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  target?: {
    doctype: string;
    docname: string;
    title: string;
  };
  metadata?: {
    [key: string]: any;
  };
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface ActivityFilters {
  types: string[];
  users: string[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
  priority: string[];
  read: boolean | null;
  search: string;
}

interface ActivityFeedProps {
  filters?: Partial<ActivityFilters>;
  showFilters?: boolean;
  maxItems?: number;
  autoRefresh?: boolean;
  onActivityClick?: (activity: ActivityItem) => void;
}

export function ActivityFeed({
  filters: initialFilters = {},
  showFilters = true,
  maxItems = 50,
  autoRefresh = true,
  onActivityClick,
}: ActivityFeedProps) {
  const [filters, setFilters] = useState<ActivityFilters>({
    types: [],
    users: [],
    dateRange: {},
    priority: [],
    read: null,
    search: '',
    ...initialFilters,
  });
  
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    activities,
    unreadCount,
    markAsRead,
    loadMore,
    isSubscribed,
  } = useActivityFeed(filters);

  // Auto-refresh activities
  useEffect(() => {
    if (autoRefresh && isSubscribed) {
      const interval = setInterval(() => {
        loadMore(0); // Refresh from beginning
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, isSubscribed, loadMore]);

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadMore(0);
    setTimeout(() => setIsRefreshing(false), 500);
  }, [loadMore]);

  // Filter activities based on current filters
  const filteredActivities = activities.filter(activity => {
    // Type filter
    if (filters.types.length > 0 && !filters.types.includes(activity.type)) {
      return false;
    }

    // User filter
    if (filters.users.length > 0 && !filters.users.includes(activity.user.id)) {
      return false;
    }

    // Priority filter
    if (filters.priority.length > 0 && !filters.priority.includes(activity.priority)) {
      return false;
    }

    // Read status filter
    if (filters.read !== null && activity.read !== filters.read) {
      return false;
    }

    // Date range filter
    if (filters.dateRange.start && activity.timestamp < filters.dateRange.start) {
      return false;
    }
    if (filters.dateRange.end && activity.timestamp > filters.dateRange.end) {
      return false;
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchableText = [
        activity.title,
        activity.description,
        activity.user.name,
        activity.target?.title,
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(searchLower)) {
        return false;
      }
    }

    return true;
  }).slice(0, maxItems);

  // Get activity icon
  const getActivityIcon = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'document':
        switch (activity.action) {
          case 'created': return <Plus className="h-4 w-4 text-green-500" />;
          case 'updated': return <Edit3 className="h-4 w-4 text-blue-500" />;
          case 'deleted': return <Trash2 className="h-4 w-4 text-red-500" />;
          case 'viewed': return <Eye className="h-4 w-4 text-gray-500" />;
          default: return <FileText className="h-4 w-4 text-gray-500" />;
        }
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-purple-500" />;
      case 'notification':
        return <Bell className="h-4 w-4 text-orange-500" />;
      case 'workflow':
        return <Send className="h-4 w-4 text-indigo-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format timestamp
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

  // Handle activity click
  const handleActivityClick = (activity: ActivityItem) => {
    if (!activity.read) {
      markAsRead();
    }
    onActivityClick?.(activity);
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">Activity Feed</h3>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Filter Toggle */}
            {showFilters && (
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilterPanel
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Filter className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search activities..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilterPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-gray-200 overflow-hidden"
          >
            <ActivityFilterPanel
              filters={filters}
              onChange={setFilters}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No activities found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <AnimatePresence>
              {filteredActivities.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => handleActivityClick(activity)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !activity.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            !activity.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {activity.title}
                          </p>
                          {activity.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {activity.description}
                            </p>
                          )}
                          
                          {/* Target Document */}
                          {activity.target && (
                            <div className="flex items-center space-x-1 mt-1">
                              <FileText className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {activity.target.doctype}: {activity.target.title}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Priority Badge */}
                        {activity.priority !== 'normal' && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            activity.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            activity.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {activity.priority}
                          </span>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {activity.user.name}
                          </span>
                        </div>
                        
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Load More */}
      {filteredActivities.length >= maxItems && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button
            onClick={() => loadMore(activities.length)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Load more activities
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Activity Filter Panel Component
 */
interface ActivityFilterPanelProps {
  filters: ActivityFilters;
  onChange: (filters: ActivityFilters) => void;
}

function ActivityFilterPanel({ filters, onChange }: ActivityFilterPanelProps) {
  const activityTypes = [
    { value: 'document', label: 'Documents' },
    { value: 'comment', label: 'Comments' },
    { value: 'notification', label: 'Notifications' },
    { value: 'workflow', label: 'Workflows' },
    { value: 'system', label: 'System' },
  ];

  const priorities = [
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'normal', label: 'Normal' },
    { value: 'low', label: 'Low' },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Activity Types */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">Activity Types</h4>
        <div className="flex flex-wrap gap-2">
          {activityTypes.map((type) => (
            <label key={type.value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.types.includes(type.value)}
                onChange={(e) => {
                  const newTypes = e.target.checked
                    ? [...filters.types, type.value]
                    : filters.types.filter(t => t !== type.value);
                  onChange({ ...filters, types: newTypes });
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">Priority</h4>
        <div className="flex flex-wrap gap-2">
          {priorities.map((priority) => (
            <label key={priority.value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.priority.includes(priority.value)}
                onChange={(e) => {
                  const newPriorities = e.target.checked
                    ? [...filters.priority, priority.value]
                    : filters.priority.filter(p => p !== priority.value);
                  onChange({ ...filters, priority: newPriorities });
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{priority.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Read Status */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">Status</h4>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="readStatus"
              checked={filters.read === null}
              onChange={() => onChange({ ...filters, read: null })}
              className="border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">All</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="readStatus"
              checked={filters.read === false}
              onChange={() => onChange({ ...filters, read: false })}
              className="border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Unread</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="readStatus"
              checked={filters.read === true}
              onChange={() => onChange({ ...filters, read: true })}
              className="border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Read</span>
          </label>
        </div>
      </div>

      {/* Clear Filters */}
      <div className="pt-2 border-t border-gray-200">
        <button
          onClick={() => onChange({
            types: [],
            users: [],
            dateRange: {},
            priority: [],
            read: null,
            search: '',
          })}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Clear all filters
        </button>
      </div>
    </div>
  );
}