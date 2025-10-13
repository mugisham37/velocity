import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Twilio } from 'twilio';
import * as webpush from 'web-push';

interface NotificationChannel {
  id: string;
  type: 'email' | 'sms' | 'push' | 'in-app';
  enabled: boolean;
  config?: any;
}

interface NotificationPreference {
  userId: string;
  channels: NotificationChannel[];
  categories: {
    [category: string]: {
      enabled: boolean;
      channels: string[];
      priority: 'low' | 'medium' | 'high' | 'urgent';
    };
  };
}

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

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private emailTransporter!: nodemailer.Transporter;
  private twilioClient!: Twilio;
  private notifications = new Map<string, Notification>();
  private userPreferences = new Map<string, NotificationPreference>();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize email transporter
    if (process.env['SMTP_HOST']) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env['SMTP_HOST'],
        port: parseInt(process.env['SMTP_PORT'] || '587'),
        secure: process.env['SMTP_SECURE'] === 'true',
        auth: {
          user: process.env['SMTP_USER'],
          pass: process.env['SMTP_PASS'],
        },
      });
    }

    // Initialize Twilio
    if (process.env['TWILIO_ACCOUNT_SID'] && process.env['TWILIO_AUTH_TOKEN']) {
      this.twilioClient = new Twilio(
        process.env['TWILIO_ACCOUNT_SID'],
        process.env['TWILIO_AUTH_TOKEN']
      );
    }

    // Initialize Web Push
    if (process.env['VAPID_PUBLIC_KEY'] && process.env['VAPID_PRIVATE_KEY']) {
      webpush.setVapidDetails(
        process.env['VAPID_SUBJECT'] || 'mailto:admin@kiro-erp.com',
        process.env['VAPID_PUBLIC_KEY'],
        process.env['VAPID_PRIVATE_KEY']
      );
    }
  }

  async sendNotification(
    notification: Omit<Notification, 'id' | 'status' | 'createdAt'>
  ): Promise<string> {
    const id = this.generateId();
    const fullNotification: Notification = {
      ...notification,
      id,
      status: 'pending',
      createdAt: new Date(),
    };

    this.notifications.set(id, fullNotification);

    // Get user preferences
    const preferences = await this.getUserPreferences(notification.userId);
    const categoryPrefs = preferences.categories[notification.category];

    if (!categoryPrefs?.enabled) {
      fullNotification.status = 'failed';
      this.logger.log(
        `Notification ${id} skipped - category ${notification.category} disabled for user ${notification.userId}`
      );
      return id;
    }

    // Send through enabled channels
    const enabledChannels = notification.channels.filter(channel =>
      categoryPrefs.channels.includes(channel)
    );

    const sendPromises = enabledChannels.map(channel =>
      this.sendThroughChannel(fullNotification, channel)
    );

    try {
      await Promise.allSettled(sendPromises);
      fullNotification.status = 'sent';
      fullNotification.sentAt = new Date();
      this.logger.log(`Notification ${id} sent successfully`);
    } catch (error) {
      fullNotification.status = 'failed';
      this.logger.error(`Failed to send notification ${id}:`, error);
    }

    return id;
  }

  private async sendThroughChannel(
    notification: Notification,
    channel: string
  ): Promise<void> {
    switch (channel) {
      case 'email':
        await this.sendEmail(notification);
        break;
      case 'sms':
        await this.sendSMS(notification);
        break;
      case 'push':
        await this.sendPushNotification(notification);
        break;
      case 'in-app':
        await this.sendInAppNotification(notification);
        break;
      default:
        this.logger.warn(`Unknown notification channel: ${channel}`);
    }
  }

  private async sendEmail(notification: Notification): Promise<void> {
    if (!this.emailTransporter) {
      throw new Error('Email transporter not configured');
    }

    // In a real implementation, you would get user email from database
    const userEmail = `user${notification.userId}@example.com`;

    await this.emailTransporter.sendMail({
      from: process.env['SMTP_FROM'] || 'noreply@kiro-erp.com',
      to: userEmail,
      subject: notification.title,
      html: this.generateEmailTemplate(notification),
    });

    this.logger.log(`Email sent for notification ${notification.id}`);
  }

  private async sendSMS(notification: Notification): Promise<void> {
    if (!this.twilioClient) {
      throw new Error('Twilio client not configured');
    }

    // In a real implementation, you would get user phone from database
    const userPhone = `+1234567890`; // Placeholder

    const fromNumber = process.env['TWILIO_PHONE_NUMBER'];
    if (!fromNumber) {
      throw new Error('TWILIO_PHONE_NUMBER not configured');
    }

    await this.twilioClient.messages.create({
      body: `${notification.title}\n\n${notification.message}`,
      from: fromNumber,
      to: userPhone,
    });

    this.logger.log(`SMS sent for notification ${notification.id}`);
  }

  private async sendPushNotification(
    notification: Notification
  ): Promise<void> {
    // In a real implementation, you would get user's push subscriptions from database
    const subscriptions = await this.getUserPushSubscriptions(
      notification.userId
    );

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.message,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: notification.data,
    });

    const sendPromises = subscriptions.map(subscription =>
      webpush.sendNotification(subscription, payload)
    );

    await Promise.allSettled(sendPromises);
    this.logger.log(
      `Push notifications sent for notification ${notification.id}`
    );
  }

  private async sendInAppNotification(
    notification: Notification
  ): Promise<void> {
    // This would typically emit through the WebSocket gateway
    // For now, we'll just log it
    this.logger.log(
      `In-app notification queued for notification ${notification.id}`
    );
  }

  async getUserPreferences(userId: string): Promise<NotificationPreference> {
    let preferences = this.userPreferences.get(userId);

    if (!preferences) {
      // Create default preferences
      preferences = {
        userId,
        channels: [
          { id: 'email', type: 'email', enabled: true },
          { id: 'sms', type: 'sms', enabled: false },
          { id: 'push', type: 'push', enabled: true },
          { id: 'in-app', type: 'in-app', enabled: true },
        ],
        categories: {
          system: {
            enabled: true,
            channels: ['email', 'in-app'],
            priority: 'medium',
          },
          collaboration: {
            enabled: true,
            channels: ['push', 'in-app'],
            priority: 'low',
          },
          workflow: {
            enabled: true,
            channels: ['email', 'push', 'in-app'],
            priority: 'medium',
          },
          security: {
            enabled: true,
            channels: ['email', 'sms', 'push', 'in-app'],
            priority: 'high',
          },
          financial: {
            enabled: true,
            channels: ['email', 'in-app'],
            priority: 'high',
          },
        },
      };

      this.userPreferences.set(userId, preferences);
    }

    return preferences;
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<NotificationPreference>
  ): Promise<void> {
    const current = await this.getUserPreferences(userId);
    const updated = { ...current, ...preferences };
    this.userPreferences.set(userId, updated);

    this.logger.log(`Updated notification preferences for user ${userId}`);
  }

  async getNotificationHistory(
    userId: string,
    limit: number = 50
  ): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async markAsDelivered(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.status = 'delivered';
      notification.deliveredAt = new Date();
    }
  }

  async getNotificationStats(userId?: string): Promise<{
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    failed: number;
  }> {
    const notifications = userId
      ? Array.from(this.notifications.values()).filter(n => n.userId === userId)
      : Array.from(this.notifications.values());

    return {
      total: notifications.length,
      pending: notifications.filter(n => n.status === 'pending').length,
      sent: notifications.filter(n => n.status === 'sent').length,
      delivered: notifications.filter(n => n.status === 'delivered').length,
      failed: notifications.filter(n => n.status === 'failed').length,
    };
  }

  private generateEmailTemplate(notification: Notification): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${notification.title}</h2>
        <p style="color: #666; line-height: 1.6;">${notification.message}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          This notification was sent from KIRO ERP System.
        </p>
      </div>
    `;
  }

  private async getUserPushSubscriptions(_userId: string): Promise<any[]> {
    // In a real implementation, you would fetch from database
    return [];
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

