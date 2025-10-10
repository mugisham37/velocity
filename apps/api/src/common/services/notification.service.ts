import {
  db,
  notificationChannels,
  notificationPreferences,
  notificationTemplates,
  notifications,
} from '@kiro/database';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray } from '@kiro/database';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export interface NotificationData {
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  recipientId: string;
  senderId?: string;
  entityType?: string;
  entityId?: string;
  scheduledAt?: Date;
  metadata?: Record<string, any>;
}

export interface NotificationTemplate {
  name: string;
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  subject?: string;
  bodyTemplate: string;
  variables?: Record<string, any>;
}

export interface NotificationChannel {
  name: string;
  type: 'EMAIL' | 'SMS' | 'PUSH';
  configuration: Record<string, any>;
}

@Injectable()
export class NotificationService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  /**
   * Send notification to user(s)
   */
  async sendNotification(
    data: NotificationData,
    companyId: string,
    channels: ('EMAIL' | 'SMS' | 'PUSH' | 'IN_APP')[] = ['IN_APP']
  ): Promise<void> {
    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(
        data.recipientId,
        companyId
      );

      // Filter channels based on user preferences
      const enabledChannels = channels.filter(channel => {
        switch (channel) {
          case 'EMAIL':
            return preferences?.emailEnabled ?? true;
          case 'SMS':
            return preferences?.smsEnabled ?? false;
          case 'PUSH':
            return preferences?.pushEnabled ?? true;
          case 'IN_APP':
            return preferences?.inAppEnabled ?? true;
          default:
            return false;
        }
      });

      // Create notification records for each enabled channel
      const notificationPromises = enabledChannels.map(channel =>
        this.createNotification({
          ...data,
          channel,
          companyId,
        })
      );

      await Promise.all(notificationPromises);

      this.logger.info('Notifications sent', {
        recipientId: data.recipientId,
        channels: enabledChannels,
        companyId,
      });
    } catch (error) {
      this.logger.error('Failed to send notification', {
        error,
        data,
        companyId,
      });
      throw new BadRequestException(
        `Failed to send notification: ${error.message}`
      );
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(
    data: Omit<NotificationData, 'recipientId'>,
    recipientIds: string[],
    companyId: string,
    channels: ('EMAIL' | 'SMS' | 'PUSH' | 'IN_APP')[] = ['IN_APP']
  ): Promise<void> {
    try {
      const notificationPromises = recipientIds.map(recipientId =>
        this.sendNotification({ ...data, recipientId }, companyId, channels)
      );

      await Promise.all(notificationPromises);

      this.logger.info('Bulk notifications sent', {
        recipientCount: recipientIds.length,
        channels,
        companyId,
      });
    } catch (error) {
      this.logger.error('Failed to send bulk notifications', {
        error,
        data,
        companyId,
      });
      throw new BadRequestException(
        `Failed to send bulk notifications: ${error.message}`
      );
    }
  }

  /**
   * Create notification from template
   */
  async sendNotificationFromTemplate(
    templateName: string,
    recipientId: string,
    variables: Record<string, any>,
    companyId: string,
    entityType?: string,
    entityId?: string
  ): Promise<void> {
    try {
      const template = await this.getTemplate(templateName, companyId);
      if (!template) {
        throw new BadRequestException(`Template ${templateName} not found`);
      }

      // Replace variables in template
      const message = this.replaceTemplateVariables(
        template.bodyTemplate,
        variables
      );
      const title = template.subject
        ? this.replaceTemplateVariables(template.subject, variables)
        : 'Notification';

      await this.sendNotification(
        {
          title,
          message,
          type: 'INFO',
          recipientId,
          entityType,
          entityId,
          metadata: { templateName, variables },
        },
        companyId,
        [template.type as any]
      );
    } catch (error) {
      this.logger.error('Failed to send notification from template', {
        error,
        templateName,
        recipientId,
        companyId,
      });
      throw error;
    }
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(
    userId: string,
    companyId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      channel?: string;
    } = {}
  ): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 20, unreadOnly = false, channel } = options;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [
      eq(notifications.recipientId, userId),
      eq(notifications.companyId, companyId),
    ];

    if (unreadOnly) {
      conditions.push(eq(notifications.readAt, null));
    }

    if (channel) {
      conditions.push(eq(notifications.channel, channel));
    }

    const whereClause = and(...conditions);

    // Get total count
    const [{ count: total }] = await db
      .select({ count: db.$count(notifications) })
      .from(notifications)
      .where(whereClause);

    // Get data with pagination
    const data = await db
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(
    notificationId: string,
    userId: string,
    companyId: string
  ): Promise<void> {
    await db
      .update(notifications)
      .set({
        readAt: new Date(),
        status: 'READ',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.recipientId, userId),
          eq(notifications.companyId, companyId)
        )
      );
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(
    notificationIds: string[],
    userId: string,
    companyId: string
  ): Promise<void> {
    await db
      .update(notifications)
      .set({
        readAt: new Date(),
        status: 'READ',
        updatedAt: new Date(),
      })
      .where(
        and(
          inArray(notifications.id, notificationIds),
          eq(notifications.recipientId, userId),
          eq(notifications.companyId, companyId)
        )
      );
  }

  /**
   * Create notification template
   */
  async createTemplate(
    template: NotificationTemplate,
    companyId: string
  ): Promise<void> {
    await db.insert(notificationTemplates).values({
      ...template,
      companyId,
    });

    this.logger.info('Notification template created', {
      name: template.name,
      type: template.type,
      companyId,
    });
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    userId: string,
    eventType: string,
    preferences: {
      emailEnabled?: boolean;
      smsEnabled?: boolean;
      pushEnabled?: boolean;
      inAppEnabled?: boolean;
    },
    companyId: string
  ): Promise<void> {
    await db
      .insert(notificationPreferences)
      .values({
        userId,
        eventType,
        companyId,
        ...preferences,
      })
      .onConflictDoUpdate({
        target: [
          notificationPreferences.userId,
          notificationPreferences.eventType,
          notificationPreferences.companyId,
        ],
        set: {
          ...preferences,
          updatedAt: new Date(),
        },
      });

    this.logger.info('User notification preferences updated', {
      userId,
      eventType,
      preferences,
      companyId,
    });
  }

  /**
   * Configure notification channel
   */
  async configureChannel(
    channel: NotificationChannel,
    companyId: string
  ): Promise<void> {
    await db.insert(notificationChannels).values({
      ...channel,
      companyId,
    });

    this.logger.info('Notification channel configured', {
      name: channel.name,
      type: channel.type,
      companyId,
    });
  }

  /**
   * Private helper methods
   */
  private async createNotification(
    data: NotificationData & { channel: string; companyId: string }
  ): Promise<void> {
    await db.insert(notifications).values({
      title: data.title,
      message: data.message,
      type: data.type,
      channel: data.channel,
      recipientId: data.recipientId,
      senderId: data.senderId,
      entityType: data.entityType,
      entityId: data.entityId,
      scheduledAt: data.scheduledAt,
      metadata: data.metadata,
      companyId: data.companyId,
      status: data.scheduledAt ? 'PENDING' : 'SENT',
    });
  }

  private async getUserPreferences(
    userId: string,
    companyId: string
  ): Promise<any> {
    const [preferences] = await db
      .select()
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.userId, userId),
          eq(notificationPreferences.companyId, companyId)
        )
      )
      .limit(1);

    return preferences;
  }

  private async getTemplate(name: string, companyId: string): Promise<any> {
    const [template] = await db
      .select()
      .from(notificationTemplates)
      .where(
        and(
          eq(notificationTemplates.name, name),
          eq(notificationTemplates.companyId, companyId),
          eq(notificationTemplates.isActive, true)
        )
      )
      .limit(1);

    return template;
  }

  private replaceTemplateVariables(
    template: string,
    variables: Record<string, any>
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    }
    return result;
  }
}
