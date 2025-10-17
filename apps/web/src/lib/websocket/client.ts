'use client';

/**
 * WebSocket Client for Real-time Communication with Frappe Backend
 * 
 * This client manages WebSocket connections for real-time features including:
 * - Document updates and synchronization
 * - Notifications and alerts
 * - User presence and activity tracking
 * - Collaborative editing features
 */

export interface WebSocketMessage {
  type: string;
  channel?: string;
  data: any;
  timestamp?: number;
  user?: string;
}

export interface WebSocketChannel {
  name: string;
  subscribed: boolean;
  handlers: Set<(message: WebSocketMessage) => void>;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  channels: string[];
}

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private status: WebSocketStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private channels = new Map<string, WebSocketChannel>();
  private messageQueue: WebSocketMessage[] = [];
  private statusHandlers = new Set<(status: WebSocketStatus) => void>();

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = {
      url: config.url || this.getWebSocketUrl(),
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      channels: config.channels || ['notifications', 'documents', 'presence'],
    };

    // Initialize default channels
    this.config.channels.forEach(channelName => {
      this.channels.set(channelName, {
        name: channelName,
        subscribed: false,
        handlers: new Set(),
      });
    });
  }

  /**
   * Get WebSocket URL based on current environment
   */
  private getWebSocketUrl(): string {
    if (typeof window === 'undefined') return '';
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    
    // For development, assume Frappe backend is on port 8000
    if (process.env.NODE_ENV === 'development') {
      return `${protocol}//${host.replace(':3000', ':8000')}/socket.io/`;
    }
    
    return `${protocol}//${host}/socket.io/`;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.setStatus('connecting');
      
      try {
        this.ws = new WebSocket(this.config.url);
        
        this.ws.onopen = () => {
          this.setStatus('connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.subscribeToChannels();
          this.flushMessageQueue();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          this.handleClose(event);
        };

        this.ws.onerror = (error) => {
          this.handleError(error);
          reject(error);
        };

      } catch (error) {
        this.setStatus('error');
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.stopHeartbeat();
    this.stopReconnect();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.setStatus('disconnected');
  }

  /**
   * Subscribe to a channel
   */
  subscribe(channelName: string, handler: (message: WebSocketMessage) => void): () => void {
    let channel = this.channels.get(channelName);
    
    if (!channel) {
      channel = {
        name: channelName,
        subscribed: false,
        handlers: new Set(),
      };
      this.channels.set(channelName, channel);
    }

    channel.handlers.add(handler);

    // Subscribe to channel if connected
    if (this.isConnected() && !channel.subscribed) {
      this.sendMessage({
        type: 'subscribe',
        channel: channelName,
        data: {},
      });
      channel.subscribed = true;
    }

    // Return unsubscribe function
    return () => {
      channel?.handlers.delete(handler);
      if (channel?.handlers.size === 0) {
        this.unsubscribe(channelName);
      }
    };
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (!channel) return;

    if (this.isConnected() && channel.subscribed) {
      this.sendMessage({
        type: 'unsubscribe',
        channel: channelName,
        data: {},
      });
    }

    channel.subscribed = false;
    channel.handlers.clear();
  }

  /**
   * Send message to server
   */
  sendMessage(message: WebSocketMessage): void {
    const messageWithTimestamp = {
      ...message,
      timestamp: Date.now(),
    };

    if (this.isConnected()) {
      this.ws!.send(JSON.stringify(messageWithTimestamp));
    } else {
      // Queue message for later sending
      this.messageQueue.push(messageWithTimestamp);
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current connection status
   */
  getStatus(): WebSocketStatus {
    return this.status;
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(handler: (status: WebSocketStatus) => void): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Handle system messages
      if (message.type === 'pong') {
        // Heartbeat response
        return;
      }

      // Route message to appropriate channel handlers
      if (message.channel) {
        const channel = this.channels.get(message.channel);
        if (channel) {
          channel.handlers.forEach(handler => {
            try {
              handler(message);
            } catch (error) {
              console.error('Error in message handler:', error);
            }
          });
        }
      }

    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  /**
   * Handle connection close
   */
  private handleClose(event: CloseEvent): void {
    this.stopHeartbeat();
    
    if (event.code !== 1000) { // Not a normal closure
      this.setStatus('disconnected');
      this.attemptReconnect();
    } else {
      this.setStatus('disconnected');
    }
  }

  /**
   * Handle connection error
   */
  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    this.setStatus('error');
  }

  /**
   * Set connection status and notify handlers
   */
  private setStatus(status: WebSocketStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.statusHandlers.forEach(handler => {
        try {
          handler(status);
        } catch (error) {
          console.error('Error in status handler:', error);
        }
      });
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage({
          type: 'ping',
          data: {},
        });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat timer
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.setStatus('error');
      return;
    }

    this.setStatus('reconnecting');
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`);
      this.connect().catch(() => {
        // Connection failed, will try again
      });
    }, this.config.reconnectInterval);
  }

  /**
   * Stop reconnection attempts
   */
  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to all configured channels
   */
  private subscribeToChannels(): void {
    this.channels.forEach((channel, channelName) => {
      if (channel.handlers.size > 0 && !channel.subscribed) {
        this.sendMessage({
          type: 'subscribe',
          channel: channelName,
          data: {},
        });
        channel.subscribed = true;
      }
    });
  }

  /**
   * Send queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift();
      if (message) {
        this.ws!.send(JSON.stringify(message));
      }
    }
  }
}

// Singleton instance
let wsClient: WebSocketClient | null = null;

/**
 * Get or create WebSocket client instance
 */
export function getWebSocketClient(config?: Partial<WebSocketConfig>): WebSocketClient {
  if (!wsClient) {
    wsClient = new WebSocketClient(config);
  }
  return wsClient;
}

/**
 * Initialize WebSocket connection
 */
export async function initializeWebSocket(config?: Partial<WebSocketConfig>): Promise<WebSocketClient> {
  const client = getWebSocketClient(config);
  await client.connect();
  return client;
}