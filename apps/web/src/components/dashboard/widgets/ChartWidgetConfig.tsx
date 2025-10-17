'use client';

import React, { useState } from 'react';
import type { ChartWidgetConfig, ChartType, AggregateFunction } from '@/types/dashboard';

interface ChartWidgetConfigProps {
  config: ChartWidgetConfig;
  onChange: (config: ChartWidgetConfig) => void;
}

const chartTypes: { value: ChartType; label: string; description: string }[] = [
  { value: 'bar', label: 'Bar Chart', description: 'Compare values across categories' },
  { value: 'line', label: 'Line Chart', description: 'Show trends over time' },
  { value: 'area', label: 'Area Chart', description: 'Line chart with filled area' },
  { value: 'pie', label: 'Pie Chart', description: 'Show parts of a whole' },
  { value: 'donut', label: 'Donut Chart', description: 'Pie chart with center hole' },
];

const aggregateFunctions: { value: AggregateFunction; label: string }[] = [
  { value: 'sum', label: 'Sum' },
  { value: 'count', label: 'Count' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
];

const doctypes = [
  'Sales Invoice',
  'Purchase Invoice',
  'Sales Order',
  'Purchase Order',
  'Customer',
  'Supplier',
  'Item',
  'Stock Entry',
];

const defaultColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
];

export function ChartWidgetConfig({ config, onChange }: ChartWidgetConfigProps) {
  const [activeTab, setActiveTab] = useState<'data' | 'styling' | 'interactions'>('data');

  const updateConfig = (updates: Partial<ChartWidgetConfig>) => {
    onChange({ ...config, ...updates });
  };

  const updateDataSource = (updates: Partial<ChartWidgetConfig['dataSource']>) => {
    updateConfig({
      dataSource: { ...config.dataSource, ...updates },
    });
  };

  const updateStyling = (updates: Partial<ChartWidgetConfig['styling']>) => {
    updateConfig({
      styling: { ...config.styling, ...updates },
    });
  };

  const updateInteractions = (updates: Partial<ChartWidgetConfig['interactions']>) => {
    updateConfig({
      interactions: { ...config.interactions, ...updates },
    });
  };

  return (
    <div className="chart-widget-config">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'data', label: 'Data Source' },
            { id: 'styling', label: 'Styling' },
            { id: 'interactions', label: 'Interactions' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-4 space-y-4">
        {/* Data Source Tab */}
        {activeTab === 'data' && (
          <div className="space-y-4">
            {/* Chart Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chart Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {chartTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => updateConfig({ chartType: type.value })}
                    className={`p-3 text-left border rounded-md hover:bg-gray-50 ${
                      config.chartType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs text-gray-500">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* DocType */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Type
              </label>
              <select
                value={config.dataSource.doctype || ''}
                onChange={(e) => updateDataSource({ doctype: e.target.value })}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select DocType</option>
                {doctypes.map((doctype) => (
                  <option key={doctype} value={doctype}>
                    {doctype}
                  </option>
                ))}
              </select>
            </div>

            {/* Group By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group By Field
              </label>
              <input
                type="text"
                value={config.dataSource.groupBy || ''}
                onChange={(e) => updateDataSource({ groupBy: e.target.value })}
                placeholder="e.g., posting_date, customer, territory"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Aggregate Function */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aggregate Function
              </label>
              <select
                value={config.dataSource.aggregateFunction || 'sum'}
                onChange={(e) => updateDataSource({ aggregateFunction: e.target.value as AggregateFunction })}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {aggregateFunctions.map((func) => (
                  <option key={func.value} value={func.value}>
                    {func.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={config.dataSource.dateRange?.from || ''}
                  onChange={(e) => updateDataSource({
                    dateRange: { ...config.dataSource.dateRange, from: e.target.value, to: config.dataSource.dateRange?.to || '' }
                  })}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <input
                  type="date"
                  value={config.dataSource.dateRange?.to || ''}
                  onChange={(e) => updateDataSource({
                    dateRange: { ...config.dataSource.dateRange, from: config.dataSource.dateRange?.from || '', to: e.target.value }
                  })}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Styling Tab */}
        {activeTab === 'styling' && (
          <div className="space-y-4">
            {/* Colors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Palette
              </label>
              <div className="grid grid-cols-8 gap-2">
                {defaultColors.map((color, index) => (
                  <button
                    key={color}
                    onClick={() => {
                      const newColors = [...config.styling.colors];
                      newColors[0] = color;
                      updateStyling({ colors: newColors });
                    }}
                    className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-400"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Chart Height */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chart Height (px)
              </label>
              <input
                type="number"
                min="200"
                max="600"
                step="50"
                value={config.styling.height}
                onChange={(e) => updateStyling({ height: parseInt(e.target.value) })}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Display Options */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  id="showLegend"
                  type="checkbox"
                  checked={config.styling.showLegend}
                  onChange={(e) => updateStyling({ showLegend: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showLegend" className="ml-2 block text-sm text-gray-900">
                  Show Legend
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="showGrid"
                  type="checkbox"
                  checked={config.styling.showGrid}
                  onChange={(e) => updateStyling({ showGrid: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showGrid" className="ml-2 block text-sm text-gray-900">
                  Show Grid Lines
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="showTooltip"
                  type="checkbox"
                  checked={config.styling.showTooltip}
                  onChange={(e) => updateStyling({ showTooltip: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showTooltip" className="ml-2 block text-sm text-gray-900">
                  Show Tooltips
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Interactions Tab */}
        {activeTab === 'interactions' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  id="enableDrillDown"
                  type="checkbox"
                  checked={config.interactions.enableDrillDown}
                  onChange={(e) => updateInteractions({ enableDrillDown: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enableDrillDown" className="ml-2 block text-sm text-gray-900">
                  Enable Drill Down
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Allow users to click on data points for detailed views
              </p>

              <div className="flex items-center">
                <input
                  id="enableExport"
                  type="checkbox"
                  checked={config.interactions.enableExport}
                  onChange={(e) => updateInteractions({ enableExport: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enableExport" className="ml-2 block text-sm text-gray-900">
                  Enable Export
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Allow users to export chart as image
              </p>

              <div className="flex items-center">
                <input
                  id="enableZoom"
                  type="checkbox"
                  checked={config.interactions.enableZoom}
                  onChange={(e) => updateInteractions({ enableZoom: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enableZoom" className="ml-2 block text-sm text-gray-900">
                  Enable Zoom
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Allow users to zoom into chart data
              </p>
            </div>

            {/* Click Action */}
            {config.interactions.enableDrillDown && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Click Action
                </label>
                <input
                  type="text"
                  value={config.interactions.clickAction || ''}
                  onChange={(e) => updateInteractions({ clickAction: e.target.value })}
                  placeholder="e.g., open_form, show_report"
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Action to perform when user clicks on data points
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChartWidgetConfig;