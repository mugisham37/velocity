'use client';

import React from 'react';
import type { ShortcutWidgetConfig, ShortcutItem } from '@/types/dashboard';

interface ShortcutWidgetProps {
  config: ShortcutWidgetConfig;
  onShortcutClick?: (shortcut: ShortcutItem) => void;
}

export function ShortcutWidget({ config, onShortcutClick }: ShortcutWidgetProps) {
  const { shortcuts, layout } = config;

  const handleShortcutClick = (shortcut: ShortcutItem) => {
    if (onShortcutClick) {
      onShortcutClick(shortcut);
    } else {
      // Default action handling
      switch (shortcut.action.type) {
        case 'navigate':
          window.location.href = shortcut.action.target;
          break;
        case 'create':
          // Navigate to create form
          window.location.href = `/app/${shortcut.action.target.toLowerCase().replace(' ', '-')}/new`;
          break;
        case 'report':
          // Navigate to report
          window.location.href = `/app/query-report/${shortcut.action.target}`;
          break;
        case 'custom':
          // Execute custom action
          console.log('Custom action:', shortcut.action.target, shortcut.action.params);
          break;
      }
    }
  };

  const getGridCols = () => {
    switch (layout.columns) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-3';
      case 4:
        return 'grid-cols-4';
      default:
        return 'grid-cols-2';
    }
  };

  if (!shortcuts || shortcuts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="mt-2 text-sm">No shortcuts configured</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shortcut-widget h-full p-2">
      <div className={`grid ${getGridCols()} gap-2 h-full`}>
        {shortcuts.map((shortcut, index) => (
          <button
            key={index}
            onClick={() => handleShortcutClick(shortcut)}
            className="shortcut-item flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            style={{
              borderColor: shortcut.color ? `${shortcut.color}40` : undefined,
            }}
          >
            {/* Icon */}
            <div 
              className="text-2xl mb-2"
              style={{ color: shortcut.color || '#6b7280' }}
            >
              {shortcut.icon}
            </div>

            {/* Label */}
            {layout.showLabels && (
              <div className="text-xs font-medium text-gray-900 text-center leading-tight">
                {shortcut.label}
              </div>
            )}

            {/* Count Badge */}
            {layout.showCounts && shortcut.count !== undefined && (
              <div className="mt-1">
                <span 
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: shortcut.color || '#6b7280' }}
                >
                  {shortcut.count}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ShortcutWidget;