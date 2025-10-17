'use client';

import { getWebSocketClient, WebSocketMessage } from './client';

/**
 * WebSocket Manager for handling multiple WebSocket channels and features
 * 
 * This manager provides a higher-level interface for managing WebSocket
 * connections and coordinating between different real-time features.
 */

export interface ChannelSubscription {
  channel: string;
  handler: (message: WebSocketMessage) => void;
  unsubscribe: () => void;
}

export class WebSocketManager {
  private client = getWebSocketClient();
  private subscriptions = new Map<string, ChannelSubscription>();
  private messageHandlers = new Map<string, Set<(message: WebSocketMessage) => void>>();

  /**
   * Subscribe to multiple channels with a single handler
   */
  subscribeToChannels(
    channels: string[],
    handler: (message: WebSocketMessage) => void
  ): () => void {
    const unsubscribeFunctions: (() => void)[] = [];

    channels.forEach(channel => {
      const unsubscribe = this.client.subscribe(channel, handler);
      unsubscribeFunctions.push(unsubscribe);
    });

    // Return function to unsubscribe from all channels
    return () => {
      unsubscribeFunctions.forEach(fn => fn());
    };
  }

  /**
   * Subscribe to a specific message type across all channels
   */
  subscribeToMessageType(
    messageType: string,
    handler: (message: WebSocketMessage) => void
  ): () => void {
    const wrappedHandler = (message: WebSocketMessage) => {
      if (message.type === messageType) {
        handler(message);
      }
    };

    // Subscribe to all active channels
    const channels = ['notifications', 'documents', 'presence', 'activity'];
    return this.subscribeToChannels(channels, wrappedHandler);
  }

  /**
   * Broadcast message to multiple channels
   */
  broadcast(channels: string[], data: any, messageType = 'broadcast'): void {
    channels.forEach(channel => {
      this.client.sendMessage({
        type: messageType,
        channel,
        data,
      });
    });
  }

  /**
   * Send notification through WebSocket
   */
  sendNotification(notification: {
    title: string;
    message?: string;
    type: 'success' | 'error' | 'warning' | 'info';
    recipients?: string[];
    channels?: string[];
  }): void {
    this.client.sendMessage({
      type: 'send_notification',
      channel: 'notifications',
      data: notification,
    });
  }

  /**
   * Update document status for real-time collaboration
   */
  updateDocumentStatus(
    doctype: string,
    docname: string,
    status: 'editing' | 'viewing' | 'locked',
    metadata?: any
  ): void {
    this.client.sendMessage({
      type: 'document_status',
      channel: 'documents',
      data: {
        doctype,
        name: docname,
        status,
        metadata,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Send user activity update
   */
  updateUserActivity(activity: {
    action: string;
    doctype?: string;
    docname?: string;
    metadata?: any;
  }): void {
    this.client.sendMessage({
      type: 'user_activity',
      channel: 'activity',
      data: {
        ...activity,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Update user presence status
   */
  updatePresence(status: 'online' | 'away' | 'busy' | 'offline', metadata?: any): void {
    this.client.sendMessage({
      type: 'presence_update',
      channel: 'presence',
      data: {
        status,
        metadata,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Request real-time data sync
   */
  requestSync(syncType: string, filters?: any): void {
    this.client.sendMessage({
      type: 'sync_request',
      channel: 'documents',
      data: {
        syncType,
        filters,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Join a collaborative session
   */
  joinCollaborativeSession(sessionId: string, doctype: string, docname: string): void {
    this.client.sendMessage({
      type: 'join_session',
      channel: 'documents',
      data: {
        sessionId,
        doctype,
        name: docname,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Leave a collaborative session
   */
  leaveCollaborativeSession(sessionId: string): void {
    this.client.sendMessage({
      type: 'leave_session',
      channel: 'documents',
      data: {
        sessionId,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Send collaborative edit operation
   */
  sendEditOperation(
    sessionId: string,
    operation: {
      type: 'insert' | 'delete' | 'update';
      field: string;
      value: any;
      position?: number;
      metadata?: any;
    }
  ): void {
    this.client.sendMessage({
      type: 'edit_operation',
      channel: 'documents',
      data: {
        sessionId,
        operation,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      status: this.client.getStatus(),
      isConnected: this.client.isConnected(),
    };
  }

  /**
   * Force reconnection
   */
  async reconnect(): Promise<void> {
    this.client.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.client.connect();
  }

  /**
   * Clean up all subscriptions
   */
  cleanup(): void {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
    this.messageHandlers.clear();
  }
}

// Singleton instance
let wsManager: WebSocketManager | null = null;

/**
 * Get or create WebSocket manager instance
 */
export function getWebSocketManager(): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager();
  }
  return wsManager;
}