'use client';

import React, { useState } from 'react';
import { useDashboardStore } from '@/stores/dashboard';
import type { WidgetConfig, WidgetSize } from '@/types/dashboard';

interface WidgetContainerProps {
  widget: WidgetConfig;
  isEditing: boolean;
  onResize: (newSize: WidgetSize) => void;
}

export function WidgetContainer({ widget, isEditing, onResize }: WidgetContainerProps) {
  const { widgetData, removeWidget, refreshWidget } = useDashboardStore();
  const [isResizing, setIsResizing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const data = widgetData[widget.id];
  const isLoading = data?.isLoading || false;
  const error = data?.error;

  const handleRefresh = () => {
    refreshWidget(widget.id);
    setShowMenu(false);
  };

  const handleRemove = () => {
    if (confirm('Are you sure you want to remove this widget?')) {
      removeWidget(widget.id);
    }
    setShowMenu(false);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (!isEditing) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = widget.size.width;
    const startHeight = widget.size.height;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      // Calculate new size based on grid (60px per unit + gap)
      const gridSize = 60;
      const gridGap = 16;
      const cellSize = gridSize + gridGap;
      
      const newWidth = Math.max(1, startWidth + Math.round(deltaX / cellSize));
      const newHeight = Math.max(1, startHeight + Math.round(deltaY / cellSize));

      // Apply min/max constraints
      const finalWidth = Math.max(
        widget.size.minWidth || 1,
        Math.min(widget.size.maxWidth || 12, newWidth)
      );
      const finalHeight = Math.max(
        widget.size.minHeight || 1,
        Math.min(widget.size.maxHeight || 8, newHeight)
      );

      if (finalWidth !== widget.size.width || finalHeight !== widget.size.height) {
        onResize({
          ...widget.size,
          width: finalWidth,
          height: finalHeight,
        });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className={`widget-container h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${
      isEditing ? 'ring-2 ring-blue-200' : ''
    } ${isResizing ? 'ring-2 ring-blue-400' : ''}`}>
      {/* Widget Header */}
      <div className="widget-header flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-900 truncate">{widget.title}</h3>
        
        <div className="flex items-center space-x-2">
          {/* Loading indicator */}
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
          
          {/* Widget menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  <button
                    onClick={handleRefresh}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <svg className="mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                  
                  {isEditing && (
                    <button
                      onClick={handleRemove}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      <svg className="mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Widget Content */}
      <div className="widget-content flex-1 p-4 relative">
        {error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-2 text-sm text-red-600">Error loading widget</p>
              <p className="text-xs text-gray-500">{error}</p>
            </div>
          </div>
        ) : (
          <div className="h-full">
            {/* Widget content will be rendered here based on widget type */}
            <WidgetContent widget={widget} data={data} />
          </div>
        )}
      </div>

      {/* Resize handle - only visible in edit mode */}
      {isEditing && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-blue-500 opacity-50 hover:opacity-75"
          onMouseDown={handleResizeStart}
          style={{
            clipPath: 'polygon(100% 0, 0 100%, 100% 100%)',
          }}
        />
      )}

      {/* Click overlay to prevent interaction when not editing */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}

// Widget content renderer - renders different widget types
function WidgetContent({ widget, data }: { widget: WidgetConfig; data: any }) {
  // For widgets that don't require data, render them directly
  if (widget.type === 'shortcut' || widget.type === 'custom') {
    return renderWidgetByType(widget, data);
  }

  // For data-dependent widgets, check if data is available
  if (!data?.data) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="mt-2 text-sm">No data available</p>
        </div>
      </div>
    );
  }

  return renderWidgetByType(widget, data);
}

function renderWidgetByType(widget: WidgetConfig, data: any) {
  switch (widget.type) {
    case 'chart':
      // Dynamic import to avoid loading Chart.js on server
      const ChartWidget = React.lazy(() => import('./widgets/ChartWidget'));
      return (
        <React.Suspense fallback={<div className="flex items-center justify-center h-full">Loading chart...</div>}>
          <ChartWidget
            config={widget.config as any}
            data={data?.data}
            height={widget.size.height * 60 - 40} // Adjust for padding
          />
        </React.Suspense>
      );
    
    case 'number':
      const NumberCardWidget = React.lazy(() => import('./widgets/NumberCardWidget'));
      return (
        <React.Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
          <NumberCardWidget
            config={widget.config as any}
            data={data?.data}
          />
        </React.Suspense>
      );

    case 'shortcut':
      const ShortcutWidget = React.lazy(() => import('./widgets/ShortcutWidget'));
      return (
        <React.Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
          <ShortcutWidget
            config={widget.config as any}
          />
        </React.Suspense>
      );

    case 'report':
      const ReportWidget = React.lazy(() => import('./widgets/ReportWidget'));
      return (
        <React.Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
          <ReportWidget
            config={widget.config as any}
          />
        </React.Suspense>
      );

    case 'custom':
      const CustomWidget = React.lazy(() => import('./widgets/CustomWidget'));
      return (
        <React.Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
          <CustomWidget
            config={widget.config as any}
          />
        </React.Suspense>
      );
    
    default:
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{String(widget.type).toUpperCase()}</div>
            <div className="text-sm text-gray-500 mt-1">Widget type not implemented</div>
            <div className="text-xs text-gray-400 mt-2">
              {data?.lastUpdated && `Last updated: ${new Date(data.lastUpdated).toLocaleTimeString()}`}
            </div>
          </div>
        </div>
      );
  }
}

export default WidgetContainer;