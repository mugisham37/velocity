'use client';

import React, { useState, useCallback } from 'react';
import { useDashboardStore } from '@/stores/dashboard';
import { WidgetContainer } from './WidgetContainer';
import type { DashboardConfig, WidgetConfig, WidgetPosition, WidgetSize } from '@/types/dashboard';

interface DashboardGridProps {
  dashboard: DashboardConfig;
}

export function DashboardGrid({ dashboard }: DashboardGridProps) {
  const { isEditing, moveWidget, resizeWidget } = useDashboardStore();
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const gridSize = 60; // Size of each grid cell in pixels
  const { columns, gridGap } = dashboard.layout;

  const handleMouseDown = useCallback((e: React.MouseEvent, widgetId: string) => {
    if (!isEditing) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setDraggedWidget(widgetId);
  }, [isEditing]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedWidget || !isEditing) return;

    const gridContainer = document.querySelector('.dashboard-grid') as HTMLElement;
    if (!gridContainer) return;

    const containerRect = gridContainer.getBoundingClientRect();
    const x = e.clientX - containerRect.left - dragOffset.x;
    const y = e.clientY - containerRect.top - dragOffset.y;

    // Snap to grid
    const gridX = Math.max(0, Math.round(x / (gridSize + gridGap)));
    const gridY = Math.max(0, Math.round(y / (gridSize + gridGap)));

    // Ensure widget stays within bounds
    const widget = dashboard.widgets.find(w => w.id === draggedWidget);
    if (widget) {
      const maxX = Math.max(0, columns - widget.size.width);
      const finalX = Math.min(gridX, maxX);
      
      moveWidget(draggedWidget, { x: finalX, y: gridY });
    }
  }, [draggedWidget, isEditing, dragOffset, gridSize, gridGap, columns, dashboard.widgets, moveWidget]);

  const handleMouseUp = useCallback(() => {
    setDraggedWidget(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  React.useEffect(() => {
    if (draggedWidget) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedWidget, handleMouseMove, handleMouseUp]);

  const handleResize = useCallback((widgetId: string, newSize: WidgetSize) => {
    if (!isEditing) return;
    resizeWidget(widgetId, newSize);
  }, [isEditing, resizeWidget]);

  const getWidgetStyle = (widget: WidgetConfig) => {
    const { position, size } = widget;
    return {
      position: 'absolute' as const,
      left: position.x * (gridSize + gridGap),
      top: position.y * (gridSize + gridGap),
      width: size.width * gridSize + (size.width - 1) * gridGap,
      height: size.height * gridSize + (size.height - 1) * gridGap,
      zIndex: draggedWidget === widget.id ? 1000 : 1,
    };
  };

  const getGridHeight = () => {
    if (dashboard.widgets.length === 0) return 400;
    
    const maxY = Math.max(
      ...dashboard.widgets.map(w => w.position.y + w.size.height)
    );
    return Math.max(400, (maxY + 1) * (gridSize + gridGap));
  };

  return (
    <div 
      className="dashboard-grid relative bg-gray-50 rounded-lg border-2 border-dashed border-gray-200"
      style={{
        height: getGridHeight(),
        backgroundImage: isEditing 
          ? `radial-gradient(circle, #d1d5db 1px, transparent 1px)`
          : 'none',
        backgroundSize: isEditing 
          ? `${gridSize + gridGap}px ${gridSize + gridGap}px`
          : 'auto',
      }}
    >
      {/* Grid overlay when editing */}
      {isEditing && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Vertical grid lines */}
          {Array.from({ length: columns + 1 }).map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute top-0 bottom-0 border-l border-gray-300 opacity-30"
              style={{ left: i * (gridSize + gridGap) - 1 }}
            />
          ))}
          {/* Horizontal grid lines */}
          {Array.from({ length: Math.ceil(getGridHeight() / (gridSize + gridGap)) + 1 }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute left-0 right-0 border-t border-gray-300 opacity-30"
              style={{ top: i * (gridSize + gridGap) - 1 }}
            />
          ))}
        </div>
      )}

      {/* Widgets */}
      {dashboard.widgets.map((widget) => (
        <div
          key={widget.id}
          style={getWidgetStyle(widget)}
          className={`widget-wrapper ${
            isEditing ? 'cursor-move' : ''
          } ${
            draggedWidget === widget.id ? 'opacity-75 shadow-lg' : ''
          }`}
          onMouseDown={(e) => handleMouseDown(e, widget.id)}
        >
          <WidgetContainer
            widget={widget}
            isEditing={isEditing}
            onResize={(newSize) => handleResize(widget.id, newSize)}
          />
        </div>
      ))}

      {/* Empty state when no widgets */}
      {dashboard.widgets.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No widgets</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing 
                ? 'Click "Add Widget" to get started.'
                : 'This dashboard is empty. Switch to edit mode to add widgets.'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardGrid;