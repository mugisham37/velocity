'use client';

import React from 'react';
import { useLayout } from '@/contexts/LayoutContext';

import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  topbar?: React.ReactNode;
}

/**
 * Main application layout component that recreates ERPNext's exact structure
 * Provides the foundation for sidebar, topbar, and main content area
 */
export function AppLayout({ children, sidebar, topbar }: AppLayoutProps) {
  const { sidebarOpen, sidebarCollapsed, isMobile } = useLayout();

  // Calculate sidebar width based on state
  const sidebarWidth = sidebarCollapsed ? 'w-16' : 'w-64';
  const sidebarTransform = sidebarOpen ? 'translate-x-0' : '-translate-x-full';

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 touch:h-screen-safe">
      {/* Sidebar */}
      {sidebar && (
        <>
          {/* Mobile sidebar backdrop */}
          {isMobile && sidebarOpen && (
            <div 
              className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity duration-300 ease-linear touch:bg-opacity-50"
              onClick={() => {/* Will be handled by sidebar component */}}
            />
          )}
          
          {/* Sidebar container */}
          <div
            className={cn(
              'fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out',
              // Mobile: full overlay, Desktop: normal positioning
              isMobile 
                ? `w-64 ${sidebarTransform}` 
                : `${sidebarWidth} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`,
              // Background and border
              'bg-white border-r border-gray-200 shadow-sm'
            )}
          >
            {sidebar}
          </div>
        </>
      )}

      {/* Main content area */}
      <div 
        className={cn(
          'flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out',
          // Adjust margin based on sidebar state (desktop only)
          !isMobile && sidebarOpen && sidebar && (sidebarCollapsed ? 'ml-16' : 'ml-64')
        )}
      >
        {/* Top navigation bar */}
        {topbar && (
          <div className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm z-30">
            {topbar}
          </div>
        )}

        {/* Main content */}
        <main className={cn(
          "flex-1 relative overflow-y-auto focus:outline-none",
          isMobile && "pb-20" // Add bottom padding for mobile navigation
        )}>
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Loading overlay for global operations */}
      <GlobalLoadingOverlay />
    </div>
  );
}

/**
 * Global loading overlay component
 * Shows when global operations are in progress
 */
function GlobalLoadingOverlay() {
  // This will be connected to the global loading state from the store
  const isLoading = false; // TODO: Connect to useAppStore loading.global

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="text-gray-700 font-medium">Loading...</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Layout wrapper that provides the layout context
 * Use this as the root layout component in your app
 */
interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}

export default AppLayout;