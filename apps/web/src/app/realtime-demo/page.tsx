'use client';

import React, { useState } from 'react';
import { CollaborativeEditor } from '@/components/collaboration/CollaborativeEditor';
import { ActivityFeed } from '@/components/activity/ActivityFeed';
import { RealtimeStatusIndicator, RealtimeStatusPanel } from '@/components/ui/RealtimeStatusIndicator';
import { NotificationPreferences } from '@/components/notifications/RealtimeNotificationManager';
import { useWebSocketStatus } from '@/lib/websocket/hooks';
import { useNotifications } from '@/hooks/useNotifications';
import { getWebSocketManager } from '@/lib/websocket/manager';
import { 
  Wifi, 
  Bell, 
  Users, 
  Activity, 
  Settings, 
  Send,
  FileText,
  MessageCircle
} from 'lucide-react';

/**
 * Real-time Features Demo Page
 * 
 * This page demonstrates all the real-time features implemented in Task 16:
 * - WebSocket connection status
 * - Real-time notifications
 * - Collaborative editing
 * - Activity feed
 * - User presence
 */

export default function RealtimeDemoPage() {
  const [activeTab, setActiveTab] = useState<'collaboration' | 'activity' | 'notifications' | 'status'>('collaboration');
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  
  const { isConnected } = useWebSocketStatus();
  const { showSuccess, showError, showWarning, showInfo } = useNotifications();
  const wsManager = getWebSocketManager();

  // Test functions for demonstrating real-time features
  const sendTestNotification = () => {
    wsManager.sendNotification({
      title: 'Test Notification',
      message: `Test message sent at ${new Date().toLocaleTimeString()}`,
      type: 'info',
    });
    showInfo('Test Notification Sent', 'Check the notification center for the real-time update');
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

  const updatePresenceStatus = (status: 'online' | 'away' | 'busy') => {
    wsManager.updatePresence(status, {
      location: 'Real-time Demo Page',
      activity: 'Testing real-time features',
    });
    showInfo('Presence Updated', `Status changed to ${status}`);
  };

  const testCollaborativeFeature = () => {
    // Simulate a document edit
    wsManager.updateDocumentStatus('Demo Document', 'TEST-001', 'editing', {
      field: 'description',
      action: 'update',
      timestamp: new Date().toISOString(),
    });
    showSuccess('Document Update', 'Collaborative edit simulation sent');
  };

  const tabs = [
    { id: 'collaboration', label: 'Collaboration', icon: Users },
    { id: 'activity', label: 'Activity Feed', icon: Activity },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'status', label: 'Connection', icon: Wifi },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Real-time Features Demo</h1>
              <p className="text-gray-600 mt-2">
                Demonstration of WebSocket-based real-time features for ERPNext frontend
              </p>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-4">
              <RealtimeStatusIndicator 
                showLabel={true} 
                size="md"
                position="relative"
              />
              <button
                onClick={() => setShowStatusPanel(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Status Details</span>
              </button>
            </div>
          </div>

          {/* Connection Warning */}
          {!isConnected && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Notification Test */}
            <button
              onClick={sendTestNotification}
              disabled={!isConnected}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Bell className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-sm font-medium">Send Notification</div>
              <div className="text-xs text-gray-500">Test real-time notifications</div>
            </button>

            {/* Activity Test */}
            <button
              onClick={sendTestActivity}
              disabled={!isConnected}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Activity className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-sm font-medium">Send Activity</div>
              <div className="text-xs text-gray-500">Test activity feed updates</div>
            </button>

            {/* Presence Test */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-sm font-medium mb-2">Update Presence</div>
              <select
                onChange={(e) => updatePresenceStatus(e.target.value as any)}
                disabled={!isConnected}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 disabled:opacity-50"
              >
                <option value="">Select status...</option>
                <option value="online">Online</option>
                <option value="away">Away</option>
                <option value="busy">Busy</option>
              </select>
            </div>

            {/* Collaboration Test */}
            <button
              onClick={testCollaborativeFeature}
              disabled={!isConnected}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <div className="text-sm font-medium">Test Collaboration</div>
              <div className="text-xs text-gray-500">Simulate document edit</div>
            </button>
          </div>

          {/* Message Input */}
          <div className="mt-4 flex space-x-2">
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

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'collaboration' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Collaborative Editing</h3>
                <CollaborativeEditor
                  doctype="Demo Document"
                  docname="TEST-001"
                  onConflict={(conflict) => {
                    showWarning('Edit Conflict', 'Another user is editing the same field');
                  }}
                  onParticipantChange={(participants) => {
                    console.log('Participants changed:', participants);
                  }}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Document Title
                      </label>
                      <input
                        type="text"
                        defaultValue="Demo Document for Real-time Testing"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        rows={4}
                        defaultValue="This is a demo document for testing collaborative editing features. Multiple users can edit this simultaneously and see real-time updates."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex space-x-2">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Save
                      </button>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                </CollaborativeEditor>
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Feed</h3>
                <ActivityFeed
                  showFilters={true}
                  maxItems={20}
                  autoRefresh={true}
                  onActivityClick={(activity) => {
                    showInfo('Activity Clicked', `Clicked on: ${activity.title}`);
                  }}
                />
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                <NotificationPreferences />
              </div>
            )}

            {activeTab === 'status' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Status</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">WebSocket Connection</h4>
                      <div className="flex items-center space-x-2">
                        <RealtimeStatusIndicator showLabel={true} size="lg" />
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Real-time Features</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Notifications</span>
                          <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                            {isConnected ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Document Sync</span>
                          <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                            {isConnected ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>User Presence</span>
                          <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                            {isConnected ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Activity Feed</span>
                          <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                            {isConnected ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">How to Test</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Open this page in multiple browser tabs to test collaboration</li>
                      <li>• Use the test controls above to send real-time updates</li>
                      <li>• Check the notification center for real-time notifications</li>
                      <li>• Monitor the activity feed for live updates</li>
                      <li>• Test presence updates and document collaboration</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Panel */}
      {showStatusPanel && (
        <RealtimeStatusPanel
          isOpen={showStatusPanel}
          onClose={() => setShowStatusPanel(false)}
        />
      )}
    </div>
  );
}