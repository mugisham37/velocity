'use client';

import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  DocumentTextIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { NotificationCenter } from '../../components/collaboration/NotificationCenter';
import { ActivityFeed } from '../../components/collaboration/ActivityFeed';
import { ChatPanel } from '../../components/collaboration/ChatPanel';
import { CollaborationProvider } from '../../components/collaboration/CollaborationProvider';
import { CollaborativeEditor } from '../../components/collaboration/CollaborativeEditor';
import { PresenceIndicator } from '../../components/collaboration/PresenceIndicator';

export default function CollaborationPage() {
  const [activeTab, setActiveTab] = useState<'editor' | 'chat' | 'activity'>(
    'editor'
  );
  const [documentId] = useState('demo-document-1');
  const [channelId] = useState('general-channel');

  const tabs = [
    { id: 'editor', name: 'Collaborative Editor', icon: DocumentTextIcon },
    { id: 'chat', name: 'Team Chat', icon: ChatBubbleLeftRightIcon },
    { id: 'activity', name: 'Activity Feed', icon: ClockIcon },
  ];

  return (
    <CollaborationProvider documentId={documentId} channelId={channelId}>
      <div className='min-h-screen bg-gray-50'>
        {/* Header */}
        <header className='bg-white shadow-sm border-b border-gray-200'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex items-center justify-between h-16'>
              <div className='flex items-center space-x-4'>
                <UsersIcon className='w-8 h-8 text-blue-600' />
                <h1 className='text-xl font-semibold text-gray-900'>
                  Real-time Collaboration
                </h1>
              </div>

              <div className='flex items-center space-x-4'>
                <PresenceIndicator />
                <NotificationCenter />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
            {/* Main Panel */}
            <div className='lg:col-span-3'>
              <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
                {/* Tab Navigation */}
                <div className='border-b border-gray-200'>
                  <nav className='flex space-x-8 px-6' aria-label='Tabs'>
                    {tabs.map(tab => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`${
                            activeTab === tab.id
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                        >
                          <Icon className='w-5 h-5' />
                          <span>{tab.name}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className='p-6'>
                  {activeTab === 'editor' && (
                    <div>
                      <div className='mb-4'>
                        <h2 className='text-lg font-medium text-gray-900 mb-2'>
                          Collaborative Document Editor
                        </h2>
                        <p className='text-sm text-gray-600'>
                          Edit documents in real-time with your team. Changes
                          are synchronized instantly.
                        </p>
                      </div>
                      <CollaborativeEditor
                        placeholder='Start typing to collaborate with your team...'
                        className='min-h-96'
                      />
                    </div>
                  )}

                  {activeTab === 'chat' && (
                    <div className='h-96'>
                      <div className='mb-4'>
                        <h2 className='text-lg font-medium text-gray-900 mb-2'>
                          Team Communication
                        </h2>
                        <p className='text-sm text-gray-600'>
                          Chat with your team members in real-time.
                        </p>
                      </div>
                      <ChatPanel />
                    </div>
                  )}

                  {activeTab === 'activity' && (
                    <div>
                      <div className='mb-4'>
                        <h2 className='text-lg font-medium text-gray-900 mb-2'>
                          Activity Timeline
                        </h2>
                        <p className='text-sm text-gray-600'>
                          Stay updated with all team activities and changes.
                        </p>
                      </div>
                      <ActivityFeed className='max-h-96 overflow-y-auto' />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className='lg:col-span-1 space-y-6'>
              {/* Quick Stats */}
              <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
                <h3 className='text-lg font-medium text-gray-900 mb-4'>
                  Collaboration Stats
                </h3>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>Active Users</span>
                    <span className='text-sm font-medium text-gray-900'>5</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>Documents</span>
                    <span className='text-sm font-medium text-gray-900'>
                      12
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>
                      Messages Today
                    </span>
                    <span className='text-sm font-medium text-gray-900'>
                      47
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>Activities</span>
                    <span className='text-sm font-medium text-gray-900'>
                      23
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
                <div className='p-4 border-b border-gray-200'>
                  <h3 className='text-lg font-medium text-gray-900'>
                    Recent Activity
                  </h3>
                </div>
                <ActivityFeed limit={5} className='max-h-64 overflow-y-auto' />
              </div>

              {/* Quick Actions */}
              <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
                <h3 className='text-lg font-medium text-gray-900 mb-4'>
                  Quick Actions
                </h3>
                <div className='space-y-3'>
                  <button className='w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm'>
                    Create New Document
                  </button>
                  <button className='w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm'>
                    Start Video Call
                  </button>
                  <button className='w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm'>
                    Share Screen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CollaborationProvider>
  );
}
