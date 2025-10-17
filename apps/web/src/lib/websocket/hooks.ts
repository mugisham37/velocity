'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { getWebSocketClient, WebSocketMessage, WebSocketStatus } from './client';

/**
 * Hook for managing WebSocket connection status
 */
export function useWebSocketStatus() {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const client = getWebSocketClient();

  useEffect(() => {
    // Set initial status
    setStatus(client.getStatus());

    // Subscribe to status changes
    const unsubscribe = client.onStatusChange(setStatus);

    return unsubscribe;
  }, [client]);

  const connect = useCallback(async () => {
    try {
      await client.connect();
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }, [client]);

  const disconnect = useCallback(() => {
    client.disconnect();
  }, [client]);

  const reconnect = useCallback(async () => {
    try {
      client.disconnect();
      await client.connect();
    } catch (error) {
      console.error('Failed to reconnect WebSocket:', error);
    }
  }, [client]);

  return {
    status,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    isReconnecting: status === 'reconnecting',
    hasError: status === 'error',
    connect,
    disconnect,
    reconnect,
  };
}

/**
 * Hook for subscribing to WebSocket channels
 */
export function useWebSocketChannel(
  channelName: string,
  handler: (message: WebSocketMessage) => void,
  enabled = true
) {
  const client = getWebSocketClient();
  const handlerRef = useRef(handler);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Update handler ref when it changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) {
      setIsSubscribed(false);
      return;
    }

    // Wrapper to use the latest handler
    const messageHandler = (message: WebSocketMessage) => {
      handlerRef.current(message);
    };

    const unsubscribe = client.subscribe(channelName, messageHandler);
    setIsSubscribed(true);

    return () => {
      unsubscribe();
      setIsSubscribed(false);
    };
  }, [client, channelName, enabled]);

  const sendMessage = useCallback((data: any, type = 'message') => {
    client.sendMessage({
      type,
      channel: channelName,
      data,
    });
  }, [client, channelName]);

  return {
    isSubscribed,
    sendMessage,
  };
}

/**
 * Hook for real-time notifications
 */
export function useRealtimeNotifications() {
  const handleNotification = useCallback((message: WebSocketMessage) => {
    if (message.type === 'notification') {
      // Handle different notification types
      const { notification } = message.data;
      
      // You can integrate with your notification system here
      // For example, using the useNotifications hook
      console.log('Received real-time notification:', notification);
    }
  }, []);

  const { isSubscribed, sendMessage } = useWebSocketChannel(
    'notifications',
    handleNotification
  );

  return {
    isSubscribed,
    sendNotification: sendMessage,
  };
}

/**
 * Hook for document real-time updates
 */
export function useDocumentUpdates(doctype?: string, docname?: string) {
  const [lastUpdate, setLastUpdate] = useState<any>(null);
  const [conflictData, setConflictData] = useState<any>(null);

  const handleDocumentUpdate = useCallback((message: WebSocketMessage) => {
    const { type, data } = message;

    switch (type) {
      case 'document_updated':
        if (!doctype || !docname || 
            (data.doctype === doctype && data.name === docname)) {
          setLastUpdate(data);
        }
        break;

      case 'document_conflict':
        if (data.doctype === doctype && data.name === docname) {
          setConflictData(data);
        }
        break;

      case 'document_locked':
      case 'document_unlocked':
        // Handle document locking
        setLastUpdate(data);
        break;
    }
  }, [doctype, docname]);

  const { isSubscribed, sendMessage } = useWebSocketChannel(
    'documents',
    handleDocumentUpdate,
    !!(doctype && docname)
  );

  const notifyDocumentChange = useCallback((changeData: any) => {
    if (doctype && docname) {
      sendMessage({
        doctype,
        name: docname,
        ...changeData,
      }, 'document_change');
    }
  }, [doctype, docname, sendMessage]);

  const lockDocument = useCallback(() => {
    if (doctype && docname) {
      sendMessage({
        doctype,
        name: docname,
        action: 'lock',
      }, 'document_lock');
    }
  }, [doctype, docname, sendMessage]);

  const unlockDocument = useCallback(() => {
    if (doctype && docname) {
      sendMessage({
        doctype,
        name: docname,
        action: 'unlock',
      }, 'document_lock');
    }
  }, [doctype, docname, sendMessage]);

  const resolveConflict = useCallback((resolution: 'accept' | 'reject') => {
    if (conflictData) {
      sendMessage({
        ...conflictData,
        resolution,
      }, 'resolve_conflict');
      setConflictData(null);
    }
  }, [conflictData, sendMessage]);

  return {
    isSubscribed,
    lastUpdate,
    conflictData,
    notifyDocumentChange,
    lockDocument,
    unlockDocument,
    resolveConflict,
    hasConflict: !!conflictData,
  };
}

/**
 * Hook for user presence tracking
 */
export function useUserPresence() {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [userActivity, setUserActivity] = useState<Record<string, any>>({});

  const handlePresenceUpdate = useCallback((message: WebSocketMessage) => {
    const { type, data } = message;

    switch (type) {
      case 'user_online':
        setOnlineUsers(prev => {
          const existing = prev.find(u => u.user === data.user);
          if (existing) {
            return prev.map(u => u.user === data.user ? { ...u, ...data } : u);
          }
          return [...prev, data];
        });
        break;

      case 'user_offline':
        setOnlineUsers(prev => prev.filter(u => u.user !== data.user));
        break;

      case 'user_activity':
        setUserActivity(prev => ({
          ...prev,
          [data.user]: data,
        }));
        break;

      case 'presence_list':
        setOnlineUsers(data.users || []);
        break;
    }
  }, []);

  const { isSubscribed, sendMessage } = useWebSocketChannel(
    'presence',
    handlePresenceUpdate
  );

  const updateActivity = useCallback((activity: any) => {
    sendMessage(activity, 'user_activity');
  }, [sendMessage]);

  const setStatus = useCallback((status: 'online' | 'away' | 'busy') => {
    sendMessage({ status }, 'user_status');
  }, [sendMessage]);

  return {
    isSubscribed,
    onlineUsers,
    userActivity,
    updateActivity,
    setStatus,
  };
}

/**
 * Hook for activity feed updates
 */
export function useActivityFeed(filters?: any) {
  const [activities, setActivities] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleActivityUpdate = useCallback((message: WebSocketMessage) => {
    const { type, data } = message;

    switch (type) {
      case 'new_activity':
        setActivities(prev => [data, ...prev].slice(0, 100)); // Keep last 100
        setUnreadCount(prev => prev + 1);
        break;

      case 'activity_read':
        setUnreadCount(0);
        break;

      case 'activity_list':
        setActivities(data.activities || []);
        setUnreadCount(data.unreadCount || 0);
        break;
    }
  }, []);

  const { isSubscribed, sendMessage } = useWebSocketChannel(
    'activity',
    handleActivityUpdate
  );

  const markAsRead = useCallback(() => {
    sendMessage({}, 'mark_read');
    setUnreadCount(0);
  }, [sendMessage]);

  const loadMore = useCallback((offset = 0) => {
    sendMessage({ offset, filters }, 'load_activities');
  }, [sendMessage, filters]);

  return {
    isSubscribed,
    activities,
    unreadCount,
    markAsRead,
    loadMore,
  };
}