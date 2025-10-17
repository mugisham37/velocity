'use client';

import React from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/stores/app';
import { cn } from '@/lib/utils';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { 
  Menu,
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Plus
} from 'lucide-react';

/**
 * Top navigation bar component that recreates ERPNext's header
 * Includes global search, notifications, user menu, and quick actions
 */
export function Topbar() {
  const { 
    toggleSidebar,
    currentModule,
    isMobile 
  } = useLayout();
  
  const { user, logout } = useAuth();
  const { notifications, unreadCount } = useAppStore();
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement global search functionality
    // console.log('Searching for:', searchQuery);
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm touch:h-16 touch:px-2 pt-safe-top">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Mobile menu button */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 lg:hidden min-h-touch min-w-touch flex items-center justify-center touch:bg-gray-50 touch:active:bg-gray-100"
        >
          <Menu className="h-5 w-5 touch:h-6 touch:w-6" />
        </button>

        {/* Desktop sidebar toggle */}
        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 min-h-touch min-w-touch flex items-center justify-center"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Current Module Indicator */}
        <div className="hidden sm:flex items-center space-x-2">
          <span className="text-sm text-gray-500">Module:</span>
          <span className="text-sm font-medium text-gray-900">{currentModule}</span>
        </div>
      </div>

      {/* Center Section - Global Search */}
      <div className="flex-1 max-w-lg mx-4 mobile:mx-2">
        <form onSubmit={handleGlobalSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 touch:h-5 touch:w-5" />
          <input
            type="text"
            placeholder="Search anything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 focus:bg-white touch:py-3 touch:text-base touch:pl-12 mobile:placeholder:text-xs"
          />
        </form>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        {/* Quick Create Button */}
        <button className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 min-h-touch min-w-touch flex items-center justify-center touch:bg-gray-50 touch:active:bg-gray-100 mobile:hidden">
          <Plus className="h-5 w-5 touch:h-6 touch:w-6" />
        </button>

        {/* Notifications */}
        <NotificationCenter />

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-2 rounded-md text-gray-700 hover:bg-gray-100"
          >
            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-700">
                {user?.full_name?.charAt(0) || user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <span className="hidden sm:block text-sm font-medium">
              {user?.full_name || user?.name}
            </span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">
                  {user?.full_name || user?.name}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              
              <div className="py-1">
                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <User className="h-4 w-4 mr-3" />
                  Profile
                </button>
                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside handlers */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
}

export default Topbar;