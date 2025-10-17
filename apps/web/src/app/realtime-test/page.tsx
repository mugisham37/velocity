'use client';

import React, { useState } from 'react';
import { useWebSocketStatus } from '@/lib/websocket/hooks';
import { useNotifications } from '@/hooks/useNotifications';
import { getWebSocketManager } from '@/lib/websocket/manager';
import { RealtimeStatusIndicator } from '@/components/ui/RealtimeStatusIndicator';
import { 
  Wifi, 
  Bell, 
  Users, 
  Activity, 
  Send,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

/**
 * Simple Real-time Features Test Page
 * 
 * A simplified test page for demonstrating WebSocket functionality
 */

export default function RealtimeTestPage() {
  const [testMessage, setTestMessage] = useState('');
  const { isConnected, status } = useWebSocketStatus();
  const { showSuccess, showInfo } = useNotifications();
  const wsManager = getWebSocketManager();

  const sendTestNotification = () => {
    wsManager.sendNotification({
      title: 'Test Notification',
      message: `Test message sent at ${new Date().toLocaleTimeString()}`,
      type: 'info',
    });
    showInfo('Test Notification Sent', 'Check the notification center');
  };

  const sendTestActivity = () => {
    wsManager.updateUserActivity({
      action: 'test_action',
      doctype: 'Demo Document',
      docname: 'TEST-001',
      metadata: {
        message: testMessage || 'Demo activity update',
        timestamp: new Date().toISOString(),
      },
    });
    showSuccess('Activity Sent', 'Activity update sent to real-time feed');
  };

  const updatePresence = (status: 'online' | 'away' | 'busy') => {
    wsManager.updatePresence(status, {
      location: 'Real-time Test Page',
      activity: 'Testing real-time features',
    });
    showInfo('Presence Updated', `Status changed to ${status}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Real-time Features Test
          </h1>
          <p className="text-gray-600">
            Test WebSocket-based real-time features for ERPNext frontend
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection Status</h2>
          
          <div className="flex items-center space-x-4 mb-4">
            <RealtimeStatusIndicator showLabel={true} size="lg" />
            <div>
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  WebSocket Status: {status}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {isConnected 
                  ? 'Real-time features are active and working'
                  : 'Real-time features are currently unavailable'
                }
              </p>
            </div>
          </div>

          {!isConnected && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Wifi className="h-5 w-5 text-yellow-600" />
                <span className="text-yellow-800 font-medium">
                  WebSocket connection is not active. Some features may not work properly.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Notification Test */}
            <button
              onClick={sendTestNotification}
              disabled={!isConnected}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-center"
            >
              <Bell className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-sm font-medium">Send Notification</div>
              <div className="text-xs text-gray-500">Test real-time notifications</div>
            </button>

            {/* Activity Test */}
            <button
              onClick={sendTestActivity}
              disabled={!isConnected}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-center"
            >
              <Activity className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-sm font-medium">Send Activity</div>
              <div className="text-xs text-gray-500">Test activity feed updates</div>
            </button>

            {/* Presence Test */}
            <div className="p-4 border border-gray-200 rounded-lg text-center">
              <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-sm font-medium mb-2">Update Presence</div>
              <select
                onChange={(e) => updatePresence(e.target.value as 'online' | 'away' | 'busy')}
                disabled={!isConnected}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 disabled:opacity-50"
              >
                <option value="">Select status...</option>
                <option value="online">Online</option>
                <option value="away">Away</option>
                <option value="busy">Busy</option>
              </select>
            </div>
          </div>

          {/* Message Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter test message..."
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={sendTestActivity}
              disabled={!isConnected || !testMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Send</span>
            </button>
          </div>
        </div>

        {/* Feature Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Real-time Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Available Features</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>WebSocket Connection</span>
                  <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                    {isConnected ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Real-time Notifications</span>
                  <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                    {isConnected ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Activity Feed Updates</span>
                  <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                    {isConnected ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>User Presence Tracking</span>
                  <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                    {isConnected ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Document Collaboration</span>
                  <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                    {isConnected ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">How to Test</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Open this page in multiple browser tabs</li>
                <li>• Use the test controls to send real-time updates</li>
                <li>• Check the notification center for notifications</li>
                <li>• Monitor the activity feed for live updates</li>
                <li>• Test presence updates and collaboration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}