'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getWebSocketClient, WebSocketStatus } from './client';
import { useNotifications } from '@/hooks/useNotifications';

interface WebSocketContextValue {
  status: WebSocketStatus;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
  config?: any;
}

export function WebSocketProvider({ 
  children, 
  autoConnect = true,
  config 
}: WebSocketProviderProps) {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const { showError, showSuccess, showInfo } = useNotifications();
  const client = getWebSocketClient(config);

  useEffect(() => {
    // Set initial status
    setStatus(client.getStatus());

    // Subscribe to status changes
    const unsubscribe = client.onStatusChange((newStatus) => {
      setStatus(newStatus);
      
      // Show user-friendly status notifications
      switch (newStatus) {
        case 'connected':
          if (status === 'reconnecting') {
            showSuccess('Connection Restored', 'Real-time features are now available');
          }
          break;
        case 'disconnected':
          if (status === 'connected') {
            showInfo('Connection Lost', 'Attempting to reconnect...');
          }
          break;
        case 'error':
          showError('Connection Error', 'Unable to establish real-time connection');
          break;
      }
    });

    return unsubscribe;
  }, [client, status, showError, showSuccess, showInfo]);

  useEffect(() => {
    if (autoConnect && status === 'disconnected') {
      connect();
    }
  }, [autoConnect]);

  const connect = async () => {
    try {
      await client.connect();
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const disconnect = () => {
    client.disconnect();
  };

  const reconnect = async () => {
    disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay
    await connect();
  };

  const value: WebSocketContextValue = {
    status,
    isConnected: status === 'connected',
    connect,
    disconnect,
    reconnect,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}