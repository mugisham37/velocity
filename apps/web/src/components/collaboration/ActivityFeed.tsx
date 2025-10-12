'use client';

import { gql, useQuery } from '@apollo/client';
import {
    ClockIcon,
    CogIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

const GET_ACTIVITY_FEED = gql`
  query GetActivityFeed($limit: Int, $offset: Int, $entityType: String, $entityId: String) {
    getActivityFeed(limit: $limit, offset: $offset, entityType: $entityType, entityId: $entityId)
  }
`;

interface ActivityItem {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  description: string;
  metadata?: any;
  visibility: 'public' | 'team' | 'private' | 'system';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  readBy: string[];
}

interface ActivityFeedProps {
  entityType?: string;
  entityId?: string;
  limit?: number;
  className?: string;
}

export function ActivityFeed({
  entityType,
  entityId,
  limit = 50,
  className = ''
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { data, loading, error, refetch } = useQuery(GET_ACTIVITY_FEED, {
    variables: { limit, offset: 0, entityType, entityId },
    pollInterval: 30000, // Poll every 30 seconds
  });

  useEffect(() => {
    if (data?.getActivityFeed) {
      const feedData = JSON.parse(data.getActivityFeed);
      setActivities(feedData.activities);
      setUnreadCount(feedData.unreadCount);
    }
  }, [data]);

  const getActivityIcon = (entityType: string) => {
    switch (entityType) {
      case 'document':
        return <DocumentTextIcon className="w-5 h-5 text-blue-500" />;
      case 'user':
        return <UserIcon className="w-5 h-5 text-green-500" />;
      case 'system':
        return <CogIcon className="w-5 h-5 text-gray-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-300';
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

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load activity feed</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Activity Feed</h3>
        {unreadCount > 0 && (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
            {unreadCount} new
          </span>
        )}
      </div>

      {/* Activities */}
      <div className="divide-y divide-gray-200">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No activities yet</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className={`p-4 border-l-4 ${getPriorityColor(activity.priority)} hover:bg-gray-50`}
            >
              <div className="flex space-x-3">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.entityType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {activity.username}
                      </span>
                      <span className="text-sm text-gray-500">
                        {activity.action}
                      </span>
                      {activity.entityName && (
                        <span className="text-sm font-medium text-blue-600">
                          {activity.entityName}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(activity.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">
                    {activity.description}
                  </p>

                  {/* Metadata */}
                  {activity.metadata?.changes && (
                    <div className="mt-2 text-xs text-gray-500">
                      <details className="cursor-pointer">
                        <summary>View changes</summary>
                        <div className="mt-1 pl-4 border-l-2 border-gray-200">
                          {Object.entries(activity.metadata.changes).map(([field, change]: [string, any]) => (
                            <div key={field} className="flex items-center space-x-2">
                              <span className="font-medium">{field}:</span>
                              <span className="text-red-600">"{change.from}"</span>
                              <span>→</span>
                              <span className="text-green-600">"{change.to}"</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}

                  {/* Tags */}
                  {activity.metadata?.tags && activity.metadata.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {activity.metadata.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load more */}
      {activities.length >= limit && (
        <div className="p-4 text-center border-t border-gray-200">
          <button
            onClick={() => {
              // Implement load more functionality
              console.log('Load more activities');
            }}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Load more activities
          </button>
        </div>
      )}
    </div>
  );
}
