import { store } from '@store/index';
import { addNotification, setPushToken } from '@store/notifications';
import { NotificationData } from '@types/index';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    // Request permissions
    await this.requestPermissions();

    // Get push token
    const token = await thisshToken();
    if (token) {
      store.dispatch(setPushToken(token));
    }

    // Set up notification listeners
    this.setupNotificationListeners();

    this.isInitialized = true;
  }

  private async requestPermissions() {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return false;
    }

    return true;
  }

  private async getPushToken(): Promise<string | null> {
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push token:', token);
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  private setupNotificationListeners() {
    // Handle notifications received while app is foregrounded
    Notifications.addNotificationReceivedListener(notification => {
      const notificationData: NotificationData = {
        id: notification.request.identifier,
        title: notification.request.content.title || 'Notification',
        body: notification.request.content.body || '',
        data: notification.request.content.data,
        type: 'info',
        createdAt: new Date(),
        isRead: false,
      };

      store.dispatch(addNotification(notificationData));
    });

    // Handle notification taps
    Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      this.handleNotificationTap(data);
    });
  }

  private handleNotificationTap(data: any) {
    // Handle navigation based on notification data
    console.log('Notification tapped:', data);

    // You can implement navigation logic here
    // For example, navigate to specific screens based on notification type
    if (data?.type === 'sales_order') {
      // Navigate to sales order detail
    } else if (data?.type === 'customer') {
      // Navigate to customer detail
    }
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: trigger || null,
      });

      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  async cancelNotification(notificationId: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  async setBadgeCount(count: number) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  async clearBadge() {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error clearing badge:', error);
    }
  }

  // Notification templates for common scenarios
  async notifyOrderCreated(orderNumber: string, customerName: string) {
    return this.scheduleLocalNotification(
      'Order Created',
      `Order ${orderNumber} for ${customerName} has been created`,
      { type: 'sales_order', orderNumber }
    );
  }

  async notifyOrderStatusChanged(orderNumber: string, status: string) {
    return this.scheduleLocalNotification(
      'Order Status Updated',
      `Order ${orderNumber} status changed to ${status}`,
      { type: 'sales_order', orderNumber, status }
    );
  }

  async notifyLowStock(productName: string, quantity: number) {
    return this.scheduleLocalNotification(
      'Low Stock Alert',
      `${productName} is running low (${quantity} remaining)`,
      { type: 'inventory', productName, quantity }
    );
  }

  async notifyPaymentReceived(customerName: string, amount: number) {
    return this.scheduleLocalNotification(
      'Payment Received',
      `Payment of $${amount.toFixed(2)} received from ${customerName}`,
      { type: 'payment', customerName, amount }
    );
  }

  async notifyTaskAssigned(taskTitle: string, assignedBy: string) {
    return this.scheduleLocalNotification(
      'Task Assigned',
      `${assignedBy} assigned you a task: ${taskTitle}`,
      { type: 'task', taskTitle, assignedBy }
    );
  }

  async notifyTaskDue(taskTitle: string, dueDate: Date) {
    const trigger: Notifications.NotificationTriggerInput = {
      date: dueDate,
    };

    return this.scheduleLocalNotification(
      'Task Due',
      `Task "${taskTitle}" is due now`,
      { type: 'task', taskTitle },
      trigger
    );
  }

  async notifyMeetingReminder(meetingTitle: string, startTime: Date) {
    const reminderTime = new Date(startTime.getTime() - 15 * 60 * 1000); // 15 minutes before

    const trigger: Notifications.NotificationTriggerInput = {
      date: reminderTime,
    };

    return this.scheduleLocalNotification(
      'Meeting Reminder',
      `Meeting "${meetingTitle}" starts in 15 minutes`,
      { type: 'meeting', meetingTitle, startTime: startTime.toISOString() },
      trigger
    );
  }
}

export const notificationService = new NotificationService();
