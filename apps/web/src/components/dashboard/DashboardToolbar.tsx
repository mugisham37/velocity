'use client';

import React from 'react';
import { useDashboardStore } from '@/stores/dashboard';
import type { DashboardConfig } from '@/types/dashboard';

interface DashboardToolbarProps {
  dashboard: DashboardConfig;
  onAddWidget: () => void;
  onSettings: () => void;
}

export function DashboardToolbar({ dashboard, onAddWidget, onSettings }: DashboardToolbarProps) {
  const { 
    isEditing, 
    isLoading, 
    toggleEditMode, 
    saveDashboard, 
    refreshAllWidgets 
  } = useDashboardStore();

  const handleSave = async () => {
    await saveDashboard(dashboard);
    toggleEditMode();
  };

  const handleRefresh = () => {
    refreshAllWidgets();
  };

  return (
    <div className="dashboard-toolbar bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Dashboard info */}
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{dashboard.title}</h1>
            <p className="text-sm text-gray-500">
              {dashboard.type === 'workspace' && 'Workspace Dashboard'}
              {dashboard.type === 'module' && `${dashboard.module} Module`}
              {dashboard.type === 'custom' && 'Custom Dashboard'}
              {' • '}
              {dashboard.widgets.length} widget{dashboard.widgets.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {/* Dashboard type indicator */}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            dashboard.type === 'workspace' 
              ? 'bg-blue-100 text-blue-800'
              : dashboard.type === 'module'
              ? 'bg-green-100 text-green-800'
              : 'bg-purple-100 text-purple-800'
          }`}>
            {dashboard.type}
          </span>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-3">
          {/* Refresh button */}
          {!isEditing && (
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg className={`-ml-0.5 mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          )}

          {/* Add Widget button - only in edit mode */}
          {isEditing && (
            <button
              onClick={onAddWidget}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Widget
            </button>
          )}

          {/* Settings button */}
          <button
            onClick={onSettings}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>

          {/* Edit/Save toggle */}
          <div className="flex items-center">
            {isEditing ? (
              <div className="flex space-x-2">
                <button
                  onClick={toggleEditMode}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={toggleEditMode}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit mode indicator */}
      {isEditing && (
        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <strong>Edit Mode:</strong> You can now drag widgets to reposition them, resize them, or add new widgets. 
                Don't forget to save your changes when you're done.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardToolbar;