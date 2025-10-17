'use client';

import React, { useEffect, useState } from 'react';
import { useDashboardStore } from '@/stores/dashboard';
import { DashboardGrid } from './DashboardGrid';
import { DashboardToolbar } from './DashboardToolbar';
import { WidgetLibrary } from './WidgetLibrary';
import { DashboardSettings } from './DashboardSettings';
import type { DashboardConfig } from '@/types/dashboard';

interface DashboardProps {
  dashboardName?: string;
  className?: string;
}

export function Dashboard({ dashboardName = 'default', className = '' }: DashboardProps) {
  const {
    currentDashboard,
    isLoading,
    isEditing,
    error,
    loadDashboard,
    refreshAllWidgets,
  } = useDashboardStore();

  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadDashboard(dashboardName);
  }, [dashboardName, loadDashboard]);

  useEffect(() => {
    if (currentDashboard && !isEditing) {
      // Auto-refresh widgets every 5 minutes when not in edit mode
      const interval = setInterval(() => {
        refreshAllWidgets();
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [currentDashboard, isEditing, refreshAllWidgets]);

  if (isLoading && !currentDashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentDashboard) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No dashboard found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new dashboard or selecting an existing one.
        </p>
      </div>
    );
  }

  return (
    <div className={`dashboard-container ${className}`}>
      {/* Dashboard Toolbar */}
      <DashboardToolbar
        dashboard={currentDashboard}
        onAddWidget={() => setShowWidgetLibrary(true)}
        onSettings={() => setShowSettings(true)}
      />

      {/* Main Dashboard Grid */}
      <div className="dashboard-content">
        <DashboardGrid dashboard={currentDashboard} />
      </div>

      {/* Widget Library Modal */}
      {showWidgetLibrary && (
        <WidgetLibrary
          isOpen={showWidgetLibrary}
          onClose={() => setShowWidgetLibrary(false)}
          dashboard={currentDashboard}
        />
      )}

      {/* Dashboard Settings Modal */}
      {showSettings && (
        <DashboardSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          dashboard={currentDashboard}
        />
      )}
    </div>
  );
}

export default Dashboard;