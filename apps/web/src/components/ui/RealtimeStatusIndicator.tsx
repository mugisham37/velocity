'use client';

import React from 'react';
import { useWebSocketStatus } from '@/lib/websocket/hooks';
import { WifiOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Real-time Status Indicator Component
 * 
 * Shows the current WebSocket connection status with visual indicators
 * and provides connection management controls.
 */

interface RealtimeStatusIndicatorProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  position?: 'fixed' | 'relative';
}

export function RealtimeStatusIndicator({
  showLabel = false,
  size = 'md',
  position = 'relative',
}: RealtimeStatusIndicatorProps) {
  const { status, isConnected, hasError, connect } = useWebSocketStatus();

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-100',
          label: 'Connected',
          description: 'Real-time features are active',
        };
      case 'connecting':
        return {
          icon: Loader2,
          color: 'text-blue-500',
          bgColor: 'bg-blue-100',
          label: 'Connecting',
          description: 'Establishing connection...',
          animate: true,
        };
      case 'reconnecting':
        return {
          icon: Loader2,
          color: 'text-orange-500',
          bgColor: 'bg-orange-100',
          label: 'Reconnecting',
          description: 'Attempting to reconnect...',
          animate: true,
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-100',
          label: 'Error',
          description: 'Connection failed',
        };
      case 'disconnected':
      default:
        return {
          icon: WifiOff,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          label: 'Disconnected',
          description: 'Real-time features unavailable',
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          icon: 'h-3 w-3',
          container: 'p-1',
          text: 'text-xs',
        };
      case 'lg':
        return {
          icon: 'h-6 w-6',
          container: 'p-3',
          text: 'text-base',
        };
      case 'md':
      default:
        return {
          icon: 'h-4 w-4',
          container: 'p-2',
          text: 'text-sm',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const sizeClasses = getSizeClasses();
  const Icon = statusConfig.icon;

  const handleClick = () => {
    if (hasError || status === 'disconnected') {
      connect();
    }
  };

  const containerClasses = `
    ${position === 'fixed' ? 'fixed bottom-4 right-4 z-50' : ''}
    inline-flex items-center space-x-2 rounded-lg border border-gray-200 bg-white shadow-sm
    ${sizeClasses.container}
    ${(hasError || status === 'disconnected') ? 'cursor-pointer hover:shadow-md' : ''}
    transition-all duration-200
  `;

  return (
    <div className={containerClasses} onClick={handleClick} title={statusConfig.description}>
      {/* Status Icon */}
      <div className={`rounded-full ${statusConfig.bgColor} p-1`}>
        <Icon
          className={`${sizeClasses.icon} ${statusConfig.color} ${
            statusConfig.animate ? 'animate-spin' : ''
          }`}
        />
      </div>

      {/* Status Label */}
      {showLabel && (
        <span className={`${sizeClasses.text} font-medium text-gray-700`}>
          {statusConfig.label}
        </span>
      )}

      {/* Connection Pulse Animation */}
      <AnimatePresence>
        {isConnected && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute -top-1 -right-1 h-3 w-3"
          >
            <div className="h-full w-full bg-green-400 rounded-full animate-ping opacity-75" />
            <div className="absolute inset-0 h-full w-full bg-green-500 rounded-full" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Detailed Real-time Status Panel Component
 */
interface RealtimeStatusPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RealtimeStatusPanel({ isOpen, onClose }: RealtimeStatusPanelProps) {
  const { status, connect, disconnect, reconnect } = useWebSocketStatus();

  if (!isOpen) return null;

  const statusConfig = {
    connected: {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    connecting: {
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    reconnecting: {
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    error: {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    disconnected: {
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
    },
  };

  const config = statusConfig[status] || statusConfig.disconnected;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-25 z-40" onClick={onClose} />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed bottom-20 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Real-time Status</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded"
            >
              ×
            </button>
          </div>

          {/* Status Display */}
          <div className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor} mb-4`}>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                status === 'connected' ? 'bg-green-500' :
                status === 'connecting' || status === 'reconnecting' ? 'bg-blue-500 animate-pulse' :
                status === 'error' ? 'bg-red-500' :
                'bg-gray-400'
              }`} />
              <span className={`font-medium ${config.color} capitalize`}>
                {status}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {status === 'connected' && 'All real-time features are working normally'}
              {status === 'connecting' && 'Establishing connection to server...'}
              {status === 'reconnecting' && 'Attempting to restore connection...'}
              {status === 'error' && 'Unable to connect to real-time services'}
              {status === 'disconnected' && 'Real-time features are currently unavailable'}
            </p>
          </div>

          {/* Connection Controls */}
          <div className="space-y-2">
            {status === 'connected' && (
              <button
                onClick={disconnect}
                className="w-full px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
              >
                Disconnect
              </button>
            )}
            
            {(status === 'disconnected' || status === 'error') && (
              <button
                onClick={connect}
                className="w-full px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Connect
              </button>
            )}
            
            {status === 'connected' && (
              <button
                onClick={reconnect}
                className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Reconnect
              </button>
            )}
          </div>

          {/* Feature Status */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Features</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Notifications</span>
                <span className={status === 'connected' ? 'text-green-600' : 'text-gray-400'}>
                  {status === 'connected' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Document Sync</span>
                <span className={status === 'connected' ? 'text-green-600' : 'text-gray-400'}>
                  {status === 'connected' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>User Presence</span>
                <span className={status === 'connected' ? 'text-green-600' : 'text-gray-400'}>
                  {status === 'connected' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Activity Feed</span>
                <span className={status === 'connected' ? 'text-green-600' : 'text-gray-400'}>
                  {status === 'connected' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}