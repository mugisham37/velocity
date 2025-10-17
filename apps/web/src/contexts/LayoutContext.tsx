'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useAppStore } from '@/stores/app';

// Layout context interface
interface LayoutContextType {
  // Sidebar state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  
  // Current navigation state
  currentModule: string;
  currentWorkspace: string;
  setCurrentModule: (module: string) => void;
  setCurrentWorkspace: (workspace: string) => void;
  
  // Layout preferences
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Responsive state
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}

interface LayoutProviderProps {
  children: React.ReactNode;
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    currentModule,
    currentWorkspace,
    setCurrentModule,
    setCurrentWorkspace,
    preferences,
    updatePreferences,
  } = useAppStore();

  // Responsive breakpoint detection
  const [windowSize, setWindowSize] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Responsive breakpoints matching ERPNext's design
  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;
  const isDesktop = windowSize.width >= 1024;

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [isMobile, sidebarOpen, setSidebarOpen]);

  // Keyboard shortcuts for navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function handleKeyDown(event: KeyboardEvent) {
      // Ctrl/Cmd + B to toggle sidebar
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
      
      // Escape to close sidebar on mobile
      if (event.key === 'Escape' && isMobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, isMobile, sidebarOpen, setSidebarOpen]);

  const setSidebarCollapsed = (collapsed: boolean) => {
    updatePreferences({ sidebarCollapsed: collapsed });
  };

  const value: LayoutContextType = {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    currentModule,
    currentWorkspace,
    setCurrentModule,
    setCurrentWorkspace,
    sidebarCollapsed: preferences.sidebarCollapsed,
    setSidebarCollapsed,
    isMobile,
    isTablet,
    isDesktop,
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}