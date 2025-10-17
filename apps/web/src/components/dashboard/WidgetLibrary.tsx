'use client';

import React, { useState } from 'react';
import { useDashboardStore } from '@/stores/dashboard';
import type { DashboardConfig, WidgetConfig, WidgetType } from '@/types/dashboard';

interface WidgetLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  dashboard: DashboardConfig;
}

interface WidgetTemplate {
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  defaultSize: { width: number; height: number };
}

const widgetTemplates: WidgetTemplate[] = [
  {
    type: 'chart',
    name: 'Chart Widget',
    description: 'Display data in various chart formats (bar, line, pie, donut)',
    icon: '📊',
    defaultSize: { width: 4, height: 3 },
  },
  {
    type: 'number',
    name: 'Number Card',
    description: 'Show KPI numbers with trend indicators',
    icon: '🔢',
    defaultSize: { width: 2, height: 2 },
  },
  {
    type: 'shortcut',
    name: 'Shortcut Widget',
    description: 'Quick access buttons for common actions',
    icon: '🚀',
    defaultSize: { width: 3, height: 2 },
  },
  {
    type: 'report',
    name: 'Report Widget',
    description: 'Embedded report displays with filtering',
    icon: '📋',
    defaultSize: { width: 6, height: 4 },
  },
  {
    type: 'custom',
    name: 'Custom Widget',
    description: 'User-defined content and functionality',
    icon: '🎨',
    defaultSize: { width: 3, height: 3 },
  },
];

export function WidgetLibrary({ isOpen, onClose, dashboard }: WidgetLibraryProps) {
  const { addWidget } = useDashboardStore();
  const [selectedTemplate, setSelectedTemplate] = useState<WidgetTemplate | null>(null);

  if (!isOpen) return null;

  const handleAddWidget = (template: WidgetTemplate) => {
    // Find an available position for the new widget
    const findAvailablePosition = () => {
      const { columns } = dashboard.layout;
      const occupiedPositions = new Set(
        dashboard.widgets.map(w => `${w.position.x},${w.position.y}`)
      );

      for (let y = 0; y < 20; y++) {
        for (let x = 0; x <= columns - template.defaultSize.width; x++) {
          let canPlace = true;
          
          // Check if this position and size would overlap with existing widgets
          for (let dy = 0; dy < template.defaultSize.height; dy++) {
            for (let dx = 0; dx < template.defaultSize.width; dx++) {
              if (occupiedPositions.has(`${x + dx},${y + dy}`)) {
                canPlace = false;
                break;
              }
            }
            if (!canPlace) break;
          }
          
          if (canPlace) {
            return { x, y };
          }
        }
      }
      
      // If no space found, place at 0,0 (will overlap)
      return { x: 0, y: 0 };
    };

    const position = findAvailablePosition();
    
    const newWidget: WidgetConfig = {
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: template.type,
      title: template.name,
      position,
      size: {
        width: template.defaultSize.width,
        height: template.defaultSize.height,
        minWidth: 1,
        minHeight: 1,
        maxWidth: 12,
        maxHeight: 8,
      },
      config: getDefaultConfig(template.type),
    };

    addWidget(newWidget);
    onClose();
  };

  const getDefaultConfig = (type: WidgetType) => {
    switch (type) {
      case 'chart':
        return {
          chartType: 'bar',
          dataSource: {
            doctype: 'Sales Invoice',
            groupBy: 'posting_date',
            aggregateFunction: 'sum',
          },
          styling: {
            colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
            showLegend: true,
            showGrid: true,
            showTooltip: true,
            height: 300,
          },
          interactions: {
            enableDrillDown: false,
            enableExport: true,
            enableZoom: false,
          },
        };
      case 'number':
        return {
          dataSource: {
            doctype: 'Sales Invoice',
            field: 'grand_total',
            aggregateFunction: 'sum',
          },
          display: {
            format: 'currency',
            decimals: 0,
            color: '#3B82F6',
            icon: '💰',
          },
          trend: {
            enabled: true,
            period: 'month',
            showPercentage: true,
            showArrow: true,
          },
        };
      case 'shortcut':
        return {
          shortcuts: [
            {
              label: 'New Invoice',
              icon: '📄',
              action: { type: 'create', target: 'Sales Invoice' },
              color: '#3B82F6',
            },
            {
              label: 'New Customer',
              icon: '👤',
              action: { type: 'create', target: 'Customer' },
              color: '#10B981',
            },
          ],
          layout: {
            columns: 2,
            showLabels: true,
            showCounts: false,
          },
        };
      case 'report':
        return {
          reportName: 'Sales Register',
          maxRows: 10,
          showHeader: true,
        };
      default:
        return {};
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Add Widget
              </h3>
              <button
                onClick={onClose}
                className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Choose a widget type to add to your dashboard
            </p>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {widgetTemplates.map((template) => (
                <div
                  key={template.type}
                  className={`relative rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors ${
                    selectedTemplate?.type === template.type ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-3">{template.icon}</div>
                    <h4 className="text-lg font-medium text-gray-900">{template.name}</h4>
                    <p className="mt-2 text-sm text-gray-500">{template.description}</p>
                    <div className="mt-3 text-xs text-gray-400">
                      Default size: {template.defaultSize.width} × {template.defaultSize.height}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={() => selectedTemplate && handleAddWidget(selectedTemplate)}
              disabled={!selectedTemplate}
              className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Widget
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WidgetLibrary;