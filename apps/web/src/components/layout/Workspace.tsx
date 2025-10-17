'use client';

import React from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { cn } from '@/lib/utils';
import { 
  Grid3X3, 
  BarChart3, 
  FileText, 
  Users, 
  Package,
  Plus,
  Settings
} from 'lucide-react';

// Workspace widget types
interface Widget {
  id: string;
  type: 'chart' | 'number' | 'shortcut' | 'report' | 'custom';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  data?: Record<string, unknown>;
}

// Sample workspace configurations matching ERPNext's structure
const workspaceConfigs = {
  Home: {
    name: 'Home',
    description: 'Welcome to your ERPNext dashboard',
    widgets: [
      {
        id: 'welcome',
        type: 'custom' as const,
        title: 'Welcome',
        size: 'large' as const,
        position: { x: 0, y: 0 },
      },
      {
        id: 'quick-actions',
        type: 'shortcut' as const,
        title: 'Quick Actions',
        size: 'medium' as const,
        position: { x: 1, y: 0 },
      },
    ],
  },
  Accounts: {
    name: 'Accounts',
    description: 'Manage your accounting operations',
    widgets: [
      {
        id: 'accounts-receivable',
        type: 'number' as const,
        title: 'Accounts Receivable',
        size: 'small' as const,
        position: { x: 0, y: 0 },
      },
      {
        id: 'accounts-payable',
        type: 'number' as const,
        title: 'Accounts Payable',
        size: 'small' as const,
        position: { x: 1, y: 0 },
      },
      {
        id: 'cash-flow',
        type: 'chart' as const,
        title: 'Cash Flow',
        size: 'large' as const,
        position: { x: 0, y: 1 },
      },
    ],
  },
  Stock: {
    name: 'Stock',
    description: 'Manage your inventory operations',
    widgets: [
      {
        id: 'stock-summary',
        type: 'number' as const,
        title: 'Total Stock Value',
        size: 'small' as const,
        position: { x: 0, y: 0 },
      },
      {
        id: 'low-stock',
        type: 'number' as const,
        title: 'Low Stock Items',
        size: 'small' as const,
        position: { x: 1, y: 0 },
      },
      {
        id: 'stock-movement',
        type: 'chart' as const,
        title: 'Stock Movement',
        size: 'large' as const,
        position: { x: 0, y: 1 },
      },
    ],
  },
  Selling: {
    name: 'Selling',
    description: 'Manage your sales operations',
    widgets: [
      {
        id: 'sales-orders',
        type: 'number' as const,
        title: 'Open Sales Orders',
        size: 'small' as const,
        position: { x: 0, y: 0 },
      },
      {
        id: 'monthly-sales',
        type: 'chart' as const,
        title: 'Monthly Sales',
        size: 'large' as const,
        position: { x: 1, y: 0 },
      },
    ],
  },
  CRM: {
    name: 'CRM',
    description: 'Manage your customer relationships',
    widgets: [
      {
        id: 'leads',
        type: 'number' as const,
        title: 'Open Leads',
        size: 'small' as const,
        position: { x: 0, y: 0 },
      },
      {
        id: 'opportunities',
        type: 'number' as const,
        title: 'Open Opportunities',
        size: 'small' as const,
        position: { x: 1, y: 0 },
      },
      {
        id: 'sales-funnel',
        type: 'chart' as const,
        title: 'Sales Funnel',
        size: 'large' as const,
        position: { x: 0, y: 1 },
      },
    ],
  },
  Setup: {
    name: 'Setup',
    description: 'Configure your system settings',
    widgets: [
      {
        id: 'system-health',
        type: 'custom' as const,
        title: 'System Health',
        size: 'medium' as const,
        position: { x: 0, y: 0 },
      },
      {
        id: 'setup-shortcuts',
        type: 'shortcut' as const,
        title: 'Setup Shortcuts',
        size: 'medium' as const,
        position: { x: 1, y: 0 },
      },
    ],
  },
};

interface WorkspaceProps {
  workspaceName?: string;
  customizable?: boolean;
}

/**
 * Workspace component for customizable dashboard layouts
 * Recreates ERPNext's workspace system with widget placement
 */
export function Workspace({ workspaceName, customizable = true }: WorkspaceProps) {
  const { currentWorkspace } = useLayout();
  const workspace = workspaceName || currentWorkspace;
  
  const config = workspaceConfigs[workspace as keyof typeof workspaceConfigs] || workspaceConfigs.Home;
  const [widgets, setWidgets] = React.useState<Widget[]>(config.widgets);
  const [isEditing, setIsEditing] = React.useState(false);

  const handleAddWidget = () => {
    // TODO: Implement widget addition modal
    // console.log('Add widget clicked');
  };

  const handleEditMode = () => {
    setIsEditing(!isEditing);
  };

  return (
    <div className="h-full bg-gray-50">
      {/* Workspace Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{config.name}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {config.description}
            </p>
          </div>
          
          {customizable && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleEditMode}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isEditing
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <Settings className="h-4 w-4 mr-2" />
                {isEditing ? 'Done' : 'Customize'}
              </button>
              
              {isEditing && (
                <button
                  onClick={handleAddWidget}
                  className="px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widget
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Workspace Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {widgets.map((widget) => (
            <WorkspaceWidget
              key={widget.id}
              widget={widget}
              isEditing={isEditing}

              onRemove={() => {
                setWidgets(prev => prev.filter(w => w.id !== widget.id));
              }}
            />
          ))}
          
          {/* Empty state when no widgets */}
          {widgets.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <Grid3X3 className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No widgets configured</h3>
              <p className="text-gray-600 text-center mb-4">
                Add widgets to customize your workspace and get quick access to important information.
              </p>
              <button
                onClick={handleAddWidget}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Widget
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface WorkspaceWidgetProps {
  widget: Widget;
  isEditing: boolean;
  onRemove: () => void;
}

/**
 * Individual workspace widget component
 */
function WorkspaceWidget({ widget, isEditing, onRemove }: WorkspaceWidgetProps) {
  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-1 md:col-span-2',
    large: 'col-span-1 md:col-span-2 lg:col-span-3',
  };

  const renderWidgetContent = () => {
    switch (widget.type) {
      case 'custom':
        if (widget.id === 'welcome') {
          return <WelcomeWidget />;
        } else if (widget.id === 'system-health') {
          return <SystemHealthWidget />;
        }
        return <WelcomeWidget />;
      case 'shortcut':
        if (widget.id === 'setup-shortcuts') {
          return <SetupShortcutWidget />;
        }
        return <ShortcutWidget />;
      case 'number':
        return <NumberWidget title={widget.title} />;
      case 'chart':
        return <ChartWidget title={widget.title} />;
      default:
        return <div className="p-4 text-gray-500">Unknown widget type</div>;
    }
  };

  return (
    <div className={cn('relative', sizeClasses[widget.size])}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
        {/* Edit mode overlay */}
        {isEditing && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 rounded-lg flex items-center justify-center z-10">
            <div className="flex space-x-2">
              <button
                onClick={onRemove}
                className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        )}
        
        {renderWidgetContent()}
      </div>
    </div>
  );
}

// Sample widget components
function WelcomeWidget() {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to ERPNext</h3>
      <p className="text-gray-600 mb-4">
        Your business management system is ready. Start by exploring the modules or creating your first document.
      </p>
      <div className="flex space-x-3">
        <button className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">
          Get Started
        </button>
        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
          Learn More
        </button>
      </div>
    </div>
  );
}

function ShortcutWidget() {
  const shortcuts = [
    { name: 'New Customer', icon: Users, color: 'text-blue-600' },
    { name: 'New Item', icon: Package, color: 'text-green-600' },
    { name: 'New Invoice', icon: FileText, color: 'text-purple-600' },
    { name: 'View Reports', icon: BarChart3, color: 'text-orange-600' },
  ];

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <button
              key={shortcut.name}
              className="flex flex-col items-center p-3 text-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Icon className={cn('h-6 w-6 mb-2', shortcut.color)} />
              <span className="text-sm font-medium text-gray-900">{shortcut.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NumberWidget({ title }: { title: string }) {
  return (
    <div className="p-6">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <div className="flex items-baseline">
        <span className="text-2xl font-semibold text-gray-900">₹1,24,500</span>
        <span className="ml-2 text-sm text-green-600">+12%</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">vs last month</p>
    </div>
  );
}

function ChartWidget({ title }: { title: string }) {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-32 bg-gray-100 rounded-md flex items-center justify-center">
        <BarChart3 className="h-8 w-8 text-gray-400" />
        <span className="ml-2 text-gray-500">Chart placeholder</span>
      </div>
    </div>
  );
}

function SystemHealthWidget() {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Database</span>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-green-600">Healthy</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Background Jobs</span>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-green-600">Running</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Email Queue</span>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-yellow-600">3 Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SetupShortcutWidget() {
  const setupShortcuts = [
    { name: 'Company', icon: Settings, color: 'text-blue-600' },
    { name: 'Users', icon: Users, color: 'text-green-600' },
    { name: 'Print Settings', icon: FileText, color: 'text-purple-600' },
    { name: 'Email Settings', icon: Settings, color: 'text-orange-600' },
  ];

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Setup Shortcuts</h3>
      <div className="grid grid-cols-2 gap-3">
        {setupShortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <button
              key={shortcut.name}
              className="flex flex-col items-center p-3 text-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Icon className={cn('h-6 w-6 mb-2', shortcut.color)} />
              <span className="text-sm font-medium text-gray-900">{shortcut.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Workspace;