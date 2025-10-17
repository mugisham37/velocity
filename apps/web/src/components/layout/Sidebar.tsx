'use client';

import React from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { 
  Home, 
  FileText, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings,
  ChevronLeft,
  Search,
  Menu,
  Wrench
} from 'lucide-react';

// ERPNext modules configuration
const modules = [
  {
    name: 'Home',
    icon: Home,
    path: '/',
    color: 'text-blue-600',
  },
  {
    name: 'Accounts',
    icon: FileText,
    path: '/accounts',
    color: 'text-green-600',
  },
  {
    name: 'Stock',
    icon: Package,
    path: '/stock',
    color: 'text-orange-600',
  },
  {
    name: 'Selling',
    icon: ShoppingCart,
    path: '/selling',
    color: 'text-purple-600',
  },
  {
    name: 'CRM',
    icon: Users,
    path: '/crm',
    color: 'text-pink-600',
  },
  {
    name: 'POS',
    icon: Menu,
    path: '/pos',
    color: 'text-indigo-600',
  },
  {
    name: 'Reports',
    icon: FileText,
    path: '/reports',
    color: 'text-red-600',
  },
  {
    name: 'Setup',
    icon: Settings,
    path: '/setup',
    color: 'text-gray-600',
  },
];

/**
 * Sidebar component that recreates ERPNext's navigation sidebar
 * Includes module navigation, search, and collapsible functionality
 */
export function Sidebar() {
  const { 
    setSidebarOpen, 
    sidebarCollapsed, 
    setSidebarCollapsed,
    currentModule,
    setCurrentModule,
    isMobile 
  } = useLayout();
  
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter modules based on search query
  const filteredModules = modules.filter(module =>
    module.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleModuleClick = (moduleName: string) => {
    setCurrentModule(moduleName);
    // TODO: Navigate to path when routing is implemented
    
    // Close sidebar on mobile after selection
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleToggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!sidebarCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="font-semibold text-gray-900">ERPNext</span>
          </div>
        )}
        
        {/* Mobile close button */}
        {isMobile ? (
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 min-h-touch min-w-touch flex items-center justify-center touch:bg-gray-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : (
          /* Desktop collapse button */
          <button
            onClick={handleToggleCollapse}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 min-h-touch min-w-touch flex items-center justify-center"
          >
            {sidebarCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        )}
      </div>

      {/* Search Bar */}
      {!sidebarCollapsed && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent touch:py-4 touch:text-base"
            />
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {filteredModules.map((module) => {
            const Icon = module.icon;
            const isActive = currentModule === module.name;
            
            return (
              <button
                key={module.name}
                onClick={() => handleModuleClick(module.name)}
                className={cn(
                  'w-full flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors duration-150 min-h-touch',
                  'touch:py-4 touch:text-base touch:min-h-touch-lg',
                  isActive
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 touch:active:bg-gray-100',
                  sidebarCollapsed ? 'justify-center' : 'justify-start'
                )}
                title={sidebarCollapsed ? module.name : undefined}
              >
                <Icon className={cn('h-5 w-5', module.color, sidebarCollapsed ? '' : 'mr-3')} />
                {!sidebarCollapsed && (
                  <span className="truncate">{module.name}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Info Footer */}
      {!sidebarCollapsed && user && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {user.full_name?.charAt(0) || user.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.full_name || user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;