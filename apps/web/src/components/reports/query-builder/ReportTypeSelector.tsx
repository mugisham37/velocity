'use client';

import React from 'react';
import { ReportType, ChartConfig, SummaryConfig, FormattingOptions } from '@/types/reports';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TableCellsIcon,
  CalculatorIcon,
  ChartBarIcon,
  CodeBracketIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface ReportTypeSelectorProps {
  selectedType: ReportType;
  onTypeChange: (type: ReportType) => void;
  chartConfig?: ChartConfig;
  onChartConfigChange?: (config: ChartConfig) => void;
  summaryConfig?: SummaryConfig;
  onSummaryConfigChange?: (config: SummaryConfig) => void;
  formattingOptions?: FormattingOptions;
  onFormattingChange?: (options: FormattingOptions) => void;
}

export function ReportTypeSelector({
  selectedType,
  onTypeChange,
  chartConfig,
  onChartConfigChange,
  summaryConfig,
  onSummaryConfigChange,
  formattingOptions,
  onFormattingChange
}: ReportTypeSelectorProps) {
  
  const reportTypes = [
    {
      type: 'tabular' as ReportType,
      label: 'Tabular Report',
      description: 'Display data in rows and columns',
      icon: TableCellsIcon
    },
    {
      type: 'summary' as ReportType,
      label: 'Summary Report',
      description: 'Group and aggregate data',
      icon: CalculatorIcon
    },
    {
      type: 'chart' as ReportType,
      label: 'Chart Report',
      description: 'Visualize data with charts',
      icon: ChartBarIcon
    },
    {
      type: 'script' as ReportType,
      label: 'Script Report',
      description: 'Custom Python script reports',
      icon: CodeBracketIcon
    }
  ];

  const renderSummaryConfig = () => {
    if (selectedType !== 'summary') return null;

    return (
      <Card className="p-4 mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Summary Configuration</h4>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={summaryConfig?.show_totals || false}
                onChange={(e) => onSummaryConfigChange?.({
                  ...summaryConfig!,
                  show_totals: e.target.checked
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show Totals</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={summaryConfig?.show_percentages || false}
                onChange={(e) => onSummaryConfigChange?.({
                  ...summaryConfig!,
                  show_percentages: e.target.checked
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show Percentages</span>
            </label>
          </div>
        </div>
      </Card>
    );
  };

  const renderChartConfig = () => {
    if (selectedType !== 'chart') return null;

    return (
      <Card className="p-4 mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Chart Configuration</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chart Type
            </label>
            <select
              value={chartConfig?.type || 'bar'}
              onChange={(e) => onChartConfigChange?.({
                ...chartConfig!,
                type: e.target.value as any
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="donut">Donut Chart</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Height (px)
            </label>
            <input
              type="number"
              value={chartConfig?.height || 400}
              onChange={(e) => onChartConfigChange?.({
                ...chartConfig!,
                height: parseInt(e.target.value)
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="200"
              max="800"
              step="50"
            />
          </div>
        </div>
      </Card>
    );
  };

  const renderFormattingOptions = () => {
    if (selectedType === 'script') return null;

    return (
      <Card className="p-4 mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Formatting Options</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formattingOptions?.show_row_numbers || false}
                onChange={(e) => onFormattingChange?.({
                  ...formattingOptions!,
                  show_row_numbers: e.target.checked
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show Row Numbers</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formattingOptions?.alternate_row_colors || false}
                onChange={(e) => onFormattingChange?.({
                  ...formattingOptions!,
                  alternate_row_colors: e.target.checked
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Alternate Row Colors</span>
            </label>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Page Size
              </label>
              <select
                value={formattingOptions?.page_size || 50}
                onChange={(e) => onFormattingChange?.({
                  ...formattingOptions!,
                  page_size: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={formattingOptions?.currency_symbol || '$'}
                onChange={(e) => onFormattingChange?.({
                  ...formattingOptions!,
                  currency_symbol: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="$"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Format
              </label>
              <select
                value={formattingOptions?.date_format || 'short'}
                onChange={(e) => onFormattingChange?.({
                  ...formattingOptions!,
                  date_format: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="short">Short (MM/DD/YYYY)</option>
                <option value="long">Long (Month DD, YYYY)</option>
              </select>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Report Type</h3>
        <div className="grid grid-cols-2 gap-3">
          {reportTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.type;
            
            return (
              <button
                key={type.type}
                onClick={() => onTypeChange(type.type)}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Icon className={`h-6 w-6 mt-0.5 ${
                    isSelected ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <div>
                    <h4 className={`text-sm font-medium ${
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {type.label}
                    </h4>
                    <p className={`text-xs mt-1 ${
                      isSelected ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {type.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {renderSummaryConfig()}
      {renderChartConfig()}
      {renderFormattingOptions()}
    </div>
  );
}