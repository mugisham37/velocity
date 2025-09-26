import { Injectable, Logger } from '@nestjs/common';

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
  metadata?: {
    changes?: { [field: string]: { from: any; to: any } };
    tags?: string[];
    mentions?: string[];
    attachments?: string[];
    location?: string;
    relatedEntities?: { type: string; id: string; name: string }[];
  };
  visibility: 'public' | 'team' | 'private' | 'system';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  readBy: string[];
}

interface ActivityFilter {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  visibility?: ActivityItem['visibility'];
  priority?: ActivityItem['priority'];
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
  limit?: number;
  offset?: number;
}

@Injectable()
export class ActivityFeedService {
  private readonly logger = new Logger(ActivityFeedService.name);
  private activities = new Map<string, ActivityItem>();
  private userSubscriptions = new Map<string, Set<string>>(); // userId -> Set of entityIds they're subscribed to

  async createActivity(data: {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    entityName?: string;
    description: string;
    metadata?: ActivityItem['metadata'];
    visibility?: ActivityItem['visibility'];
    priority?: ActivityItem['priority'];
  }): Promise<ActivityItem> {
    const id = this.generateId();
    const activity: ActivityItem = {
      id,
      userId: data.userId,
      username: `User ${data.userId}`, // In real app, get from user service
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      entityName: data.entityName,
      description: data.description,
      metadata: data.metadata,
      visibility: data.visibility || 'public',
      priority: data.priority || 'medium',
      createdAt: new Date(),
      readBy: [],
    };

    this.activities.set(id, activity);
    this.logger.log(
      `Activity created: ${data.action} on ${data.entityType} ${data.entityId} by user ${data.userId}`
    );

    return activity;
  }

  async getActivityFeed(
    userId: string,
    filter?: ActivityFilter
  ): Promise<{
    activities: ActivityItem[];
    total: number;
    unreadCount: number;
  }> {
    const userSubscriptions = this.userSubscriptions.get(userId) || new Set();
    const limit = filter?.limit || 50;
    const offset = filter?.offset || 0;

    let filteredActivities = Array.from(this.activities.values()).filter(
      activity => {
        // Visibility check
        if (activity.visibility === 'private' && activity.userId !== userId) {
          return false;
        }

        // Entity subscription check (user sees activities for entities they're subscribed to)
        if (
          activity.visibility === 'team' &&
          !userSubscriptions.has(activity.entityId)
        ) {
          return false;
        }

        // Apply filters
        if (filter?.entityType && activity.entityType !== filter.entityType)
          return false;
        if (filter?.entityId && activity.entityId !== filter.entityId)
          return false;
        if (filter?.action && activity.action !== filter.action) return false;
        if (filter?.visibility && activity.visibility !== filter.visibility)
          return false;
        if (filter?.priority && activity.priority !== filter.priority)
          return false;
        if (filter?.dateFrom && activity.createdAt < filter.dateFrom)
          return false;
        if (filter?.dateTo && activity.createdAt > filter.dateTo) return false;
        if (filter?.tags && filter.tags.length > 0) {
          const activityTags = activity.metadata?.tags || [];
          if (!filter.tags.some(tag => activityTags.includes(tag)))
            return false;
        }

        return true;
      }
    );

    // Sort by creation date (newest first)
    filteredActivities.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    const total = filteredActivities.length;
    const unreadCount = filteredActivities.filter(
      activity => !activity.readBy.includes(userId)
    ).length;

    // Apply pagination
    const paginatedActivities = filteredActivities.slice(
      offset,
      offset + limit
    );

    return {
      activities: paginatedActivities,
      total,
      unreadCount,
    };
  }

  async markAsRead(activityId: string, userId: string): Promise<boolean> {
    const activity = this.activities.get(activityId);
    if (!activity) return false;

    if (!activity.readBy.includes(userId)) {
      activity.readBy.push(userId);
      this.logger.log(
        `Activity ${activityId} marked as read by user ${userId}`
      );
    }

    return true;
  }

  async markAllAsRead(
    userId: string,
    filter?: ActivityFilter
  ): Promise<number> {
    const { activities } = await this.getActivityFeed(userId, filter);
    let markedCount = 0;

    for (const activity of activities) {
      if (!activity.readBy.includes(userId)) {
        activity.readBy.push(userId);
        markedCount++;
      }
    }

    this.logger.log(
      `Marked ${markedCount} activities as read for user ${userId}`
    );
    return markedCount;
  }

  async subscribeToEntity(userId: string, entityId: string): Promise<void> {
    let subscriptions = this.userSubscriptions.get(userId);
    if (!subscriptions) {
      subscriptions = new Set();
      this.userSubscriptions.set(userId, subscriptions);
    }

    subscriptions.add(entityId);
    this.logger.log(`User ${userId} subscribed to entity ${entityId}`);
  }

  async unsubscribeFromEntity(userId: string, entityId: string): Promise<void> {
    const subscriptions = this.userSubscriptions.get(userId);
    if (subscriptions) {
      subscriptions.delete(entityId);
      this.logger.log(`User ${userId} unsubscribed from entity ${entityId}`);
    }
  }

  async getUserSubscriptions(userId: string): Promise<string[]> {
    const subscriptions = this.userSubscriptions.get(userId);
    return subscriptions ? Array.from(subscriptions) : [];
  }

  async getEntityActivities(
    entityType: string,
    entityId: string,
    limit: number = 20
  ): Promise<ActivityItem[]> {
    return Array.from(this.activities.values())
      .filter(
        activity =>
          activity.entityType === entityType && activity.entityId === entityId
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getUserActivities(
    userId: string,
    limit: number = 20
  ): Promise<ActivityItem[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async deleteActivity(activityId: string, userId: string): Promise<boolean> {
    const activity = this.activities.get(activityId);
    if (!activity) return false;

    // Only allow deletion by the activity creator or system admin
    if (activity.userId !== userId) {
      return false;
    }

    this.activities.delete(activityId);
    this.logger.log(`Activity ${activityId} deleted by user ${userId}`);
    return true;
  }

  async getActivityStats(filter?: ActivityFilter): Promise<{
    totalActivities: number;
    activitiesByType: { [type: string]: number };
    activitiesByAction: { [action: string]: number };
    activitiesByPriority: { [priority: string]: number };
    recentActivity: {
      last24Hours: number;
      last7Days: number;
      last30Days: number;
    };
  }> {
    let activities = Array.from(this.activities.values());

    // Apply filters
    if (filter) {
      activities = activities.filter(activity => {
        if (filter.entityType && activity.entityType !== filter.entityType)
          return false;
        if (filter.entityId && activity.entityId !== filter.entityId)
          return false;
        if (filter.action && activity.action !== filter.action) return false;
        if (filter.visibility && activity.visibility !== filter.visibility)
          return false;
        if (filter.priority && activity.priority !== filter.priority)
          return false;
        if (filter.dateFrom && activity.createdAt < filter.dateFrom)
          return false;
        if (filter.dateTo && activity.createdAt > filter.dateTo) return false;
        return true;
      });
    }

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const activitiesByType = activities.reduce(
      (acc, activity) => {
        acc[activity.entityType] = (acc[activity.entityType] || 0) + 1;
        return acc;
      },
      {} as { [type: string]: number }
    );

    const activitiesByAction = activities.reduce(
      (acc, activity) => {
        acc[activity.action] = (acc[activity.action] || 0) + 1;
        return acc;
      },
      {} as { [action: string]: number }
    );

    const activitiesByPriority = activities.reduce(
      (acc, activity) => {
        acc[activity.priority] = (acc[activity.priority] || 0) + 1;
        return acc;
      },
      {} as { [priority: string]: number }
    );

    return {
      totalActivities: activities.length,
      activitiesByType,
      activitiesByAction,
      activitiesByPriority,
      recentActivity: {
        last24Hours: activities.filter(a => a.createdAt > last24Hours).length,
        last7Days: activities.filter(a => a.createdAt > last7Days).length,
        last30Days: activities.filter(a => a.createdAt > last30Days).length,
      },
    };
  }

  // Helper methods for common activity types
  async logDocumentActivity(
    userId: string,
    action: string,
    documentId: string,
    documentName: string,
    changes?: any
  ) {
    return this.createActivity({
      userId,
      action,
      entityType: 'document',
      entityId: documentId,
      entityName: documentName,
      description: `${action} document "${documentName}"`,
      metadata: { changes },
      visibility: 'team',
      priority: 'low',
    });
  }

  async logProjectActivity(
    userId: string,
    action: string,
    projectId: string,
    projectName: string,
    metadata?: any
  ) {
    return this.createActivity({
      userId,
      action,
      entityType: 'project',
      entityId: projectId,
      entityName: projectName,
      description: `${action} project "${projectName}"`,
      metadata,
      visibility: 'team',
      priority: 'medium',
    });
  }

  async logSystemActivity(action: string, description: string, metadata?: any) {
    return this.createActivity({
      userId: 'system',
      action,
      entityType: 'system',
      entityId: 'system',
      description,
      metadata,
      visibility: 'system',
      priority: 'high',
    });
  }

  private generateId(): string {
    return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
