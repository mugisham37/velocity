'use client';

import React, { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { ReportResult, ChartConfig, FormattingOptions } from '@/types/reports';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  DocumentArrowDownIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartReportRendererProps {
  data: ReportResult;
  title?: string;
  chartConfig: ChartConfig;
  formattingOptions?: FormattingOptions;
  showExportOptions?: boolean;
  onExport?: (format: 'PDF' | 'Excel' | 'CSV') => void;
  onConfigChange?: (config: ChartConfig) => void;
}

export function ChartReportRenderer({ 
  data, 
  title, 
  chartConfig,
  formattingOptions,
  showExportOptions = true, 
  onExport,
  onConfigChange
}: ChartReportRendererProps) {
  const { columns, data: rows } = data;

  const chartData = useMemo(() => {
    if (!chartConfig.x_field || !chartConfig.y_fields.length) {
      return null;
    }

    const xColumnIndex = columns.findIndex(col => col.fieldname === chartConfig.x_field);
    if (xColumnIndex === -1) return null;

    // Extract labels (x-axis values)
    const labels = rows.map(row => String(row[xColumnIndex] || ''));

    // Extract datasets (y-axis values)
    const datasets = chartConfig.y_fields.map((fieldname, index) => {
      const yColumnIndex = columns.findIndex(col => col.fieldname === fieldname);
      if (yColumnIndex === -1) return null;

      const column = columns[yColumnIndex];
      const data = rows.map(row => {
        const value = row[yColumnIndex];
        return typeof value === 'number' ? value : parseFloat(String(value)) || 0;
      });

      // Generate colors
      const colors = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
        '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1'
      ];
      
      const color = colors[index % colors.length];
      
      return {
        label: column.label || fieldname,
        data,
        backgroundColor: chartConfig.type === 'pie' || chartConfig.type === 'donut' 
          ? colors.slice(0, data.length)
          : color + '80', // Add transparency for bar/line charts
        borderColor: color,
        borderWidth: 2,
        fill: chartConfig.type === 'area'
      };
    }).filter((dataset): dataset is NonNullable<typeof dataset> => dataset !== null);

    return {
      labels,
      datasets
    };
  }, [data, chartConfig, columns, rows]);

  const chartOptions = useMemo(() => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: !!title,
          text: title,
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y || context.parsed;
              
              // Format value based on field type
              const fieldname = chartConfig.y_fields[context.datasetIndex];
              const column = columns.find(col => col.fieldname === fieldname);
              
              if (column?.format === 'Currency' || fieldname?.includes('amount') || fieldname?.includes('cost')) {
                const symbol = formattingOptions?.currency_symbol || '$';
                return `${label}: ${symbol}${value.toLocaleString()}`;
              }
              
              return `${label}: ${value.toLocaleString()}`;
            }
          }
        }
      },
      scales: chartConfig.type !== 'pie' && chartConfig.type !== 'donut' ? {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value: any) {
              // Format y-axis labels
              const firstYField = chartConfig.y_fields[0];
              const column = columns.find(col => col.fieldname === firstYField);
              
              if (column?.format === 'Currency' || firstYField?.includes('amount') || firstYField?.includes('cost')) {
                const symbol = formattingOptions?.currency_symbol || '$';
                return `${symbol}${value.toLocaleString()}`;
              }
              
              return value.toLocaleString();
            }
          }
        }
      } : undefined
    };

    return baseOptions;
  }, [chartConfig, title, columns, formattingOptions]);

  const renderChart = () => {
    if (!chartData) return null;

    const commonProps = {
      data: chartData,
      options: chartOptions,
      height: chartConfig.height || 400
    };

    switch (chartConfig.type) {
      case 'bar':
        return <Bar {...commonProps} />;
      case 'line':
      case 'area':
        return <Line {...commonProps} />;
      case 'pie':
        return <Pie {...commonProps} />;
      case 'donut':
        return <Doughnut {...commonProps} />;
      default:
        return <Bar {...commonProps} />;
    }
  };

  const availableFields = columns.filter(col => 
    ['Int', 'Float', 'Currency'].includes(col.format || '') ||
    col.fieldname?.includes('amount') ||
    col.fieldname?.includes('cost') ||
    col.fieldname?.includes('count')
  );

  const availableXFields = columns.filter(col => 
    ['Data', 'Link', 'Select', 'Date'].includes(col.format || '')
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          {title && (
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          )}
          <p className="text-sm text-gray-600 mt-1">
            Chart Report - {rows.length} records
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {onConfigChange && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
            >
              <Cog6ToothIcon className="h-4 w-4" />
              <span>Configure</span>
            </Button>
          )}
          {showExportOptions && onExport && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('PDF')}
                className="flex items-center space-x-1"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>PDF</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Chart Configuration Panel */}
      {onConfigChange && (
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Chart Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chart Type
              </label>
              <select
                value={chartConfig.type}
                onChange={(e) => onConfigChange({ ...chartConfig, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="area">Area Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="donut">Donut Chart</option>
              </select>
            </div>

            {/* X Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                X-Axis Field
              </label>
              <select
                value={chartConfig.x_field}
                onChange={(e) => onConfigChange({ ...chartConfig, x_field: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Field...</option>
                {availableXFields.map(field => (
                  <option key={field.fieldname} value={field.fieldname}>
                    {field.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Y Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Y-Axis Fields
              </label>
              <select
                multiple
                value={chartConfig.y_fields}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  onConfigChange({ ...chartConfig, y_fields: values });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                size={3}
              >
                {availableFields.map(field => (
                  <option key={field.fieldname} value={field.fieldname}>
                    {field.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Height */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height (px)
              </label>
              <input
                type="number"
                value={chartConfig.height || 400}
                onChange={(e) => onConfigChange({ ...chartConfig, height: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="200"
                max="800"
                step="50"
              />
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="flex-1 p-6">
        {!chartData ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Configure Chart</h3>
              <p className="text-gray-600">
                Select X-axis and Y-axis fields to generate your chart.
              </p>
            </div>
          </div>
        ) : (
          <Card className="h-full p-6">
            <div style={{ height: chartConfig.height || 400 }}>
              {renderChart()}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}