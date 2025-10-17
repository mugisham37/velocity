/**
 * WebSocket Integration Module
 * 
 * This module provides real-time communication capabilities for the ERPNext frontend,
 * including WebSocket client management, React hooks, and integration utilities.
 */

export {
  WebSocketClient,
  getWebSocketClient,
  initializeWebSocket,
  type WebSocketMessage,
  type WebSocketChannel,
  type WebSocketConfig,
  type WebSocketStatus,
} from './client';

export {
  useWebSocketStatus,
  useWebSocketChannel,
  useRealtimeNotifications,
  useDocumentUpdates,
  useUserPresence,
  useActivityFeed,
} from './hooks';

export { WebSocketProvider, useWebSocketContext } from './provider';
export { WebSocketManager } from './manager';