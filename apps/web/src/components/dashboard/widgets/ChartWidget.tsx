'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import type {
  ChartWidgetConfig,
  ChartData as CustomChartData,
} from '@/types/dashboard';

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
  Legend,
  Filler
);

interface ChartWidgetProps {
  config: ChartWidgetConfig;
  data: CustomChartData;
  height?: number;
  onDrillDown?: (dataPoint: any) => void;
  onExport?: () => void;
}

export function ChartWidget({
  config,
  data,
  height = 300,
  onDrillDown,
  onExport,
}: ChartWidgetProps) {
  const chartRef = useRef<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { chartType, styling, interactions } = config;

  // Convert our custom chart data to Chart.js format
  const chartData: ChartData<any> = {
    labels: data.labels,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor:
        dataset.backgroundColor ||
        styling.colors[index % styling.colors.length],
      borderColor:
        dataset.borderColor || styling.colors[index % styling.colors.length],
      borderWidth: dataset.borderWidth || 1,
      // Additional styling based on chart type
      ...(chartType === 'line' && {
        fill: false,
        tension: 0.1,
      }),
      ...(chartType === 'area' && {
        fill: true,
        tension: 0.1,
      }),
    })),
  };

  // Chart.js options
  const options: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: styling.showLegend,
        position: 'top' as const,
      },
      tooltip: {
        enabled: styling.showTooltip,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y || context.parsed;
            return `${label}: ${typeof value === 'number' ? value.toLocaleString() : value}`;
          },
        },
      },
    },
    scales:
      chartType === 'pie' || chartType === 'donut'
        ? {}
        : {
            x: {
              grid: {
                display: styling.showGrid,
              },
            },
            y: {
              grid: {
                display: styling.showGrid,
              },
              beginAtZero: true,
            },
          },
    onClick: (event: any, elements: any) => {
      if (interactions.enableDrillDown && elements.length > 0 && onDrillDown) {
        const element = elements[0];
        const datasetIndex = element.datasetIndex;
        const index = element.index;
        const dataPoint = {
          label: data.labels[index],
          value: data.datasets[datasetIndex].data[index],
          dataset: data.datasets[datasetIndex].label,
        };
        onDrillDown(dataPoint);
      }
    },
    // Zoom functionality (basic implementation)
    ...(interactions.enableZoom && {
      interaction: {
        intersect: false,
        mode: 'index' as const,
      },
    }),
  };

  const handleExport = async () => {
    if (!chartRef.current || !interactions.enableExport) return;

    setIsExporting(true);
    try {
      const canvas = chartRef.current.canvas;
      const url = canvas.toDataURL('image/png');

      // Create download link
      const link = document.createElement('a');
      link.download = 'chart.png';
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (onExport) {
        onExport();
      }
    } catch (error) {
      console.error('Failed to export chart:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const renderChart = () => {
    const commonProps: {
      ref: React.RefObject<ChartJS>;
      data: ChartData<'bar' | 'line' | 'pie' | 'doughnut'>;
      options: ChartOptions<'bar' | 'line' | 'pie' | 'doughnut'>;
      height?: number;
    } = {
      ref: chartRef,
      data: {
        ...chartData,
        datasets: chartData.datasets.map(ds => ({
          ...ds,
          type: chartType === 'area' ? 'line' : chartType === 'donut' ? 'doughnut' : chartType
        }))
      },
      options,
      height
    };

    // Cast the chart type to ensure type safety
    const chartProps = {
      data: {
        ...chartData,
        datasets: chartData.datasets.map(ds => ({
          ...ds,
          type: chartType === 'area' ? 'line' : chartType === 'donut' ? 'doughnut' : chartType
        }))
      },
      options,
      height
    } as const;

    switch (chartType) {
      case 'bar':
        return <Bar {...chartProps} />;
      case 'line':
      case 'area':
        return <Line {...chartProps} />;
      case 'pie':
        return <Pie {...chartProps} />;
      case 'donut':
        return <Doughnut {...chartProps} />;
      default:
        return <Bar {...chartProps} />;
    }
  };

  if (!data || !data.labels || !data.datasets) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='text-center'>
          <svg
            className='mx-auto h-8 w-8 text-gray-400'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
            />
          </svg>
          <p className='mt-2 text-sm text-gray-500'>No chart data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className='chart-widget flex h-full flex-col'>
      {/* Chart Actions */}
      {(interactions.enableExport || interactions.enableDrillDown) && (
        <div className='mb-2 flex justify-end'>
          {interactions.enableExport && (
            <button
              onClick={handleExport}
              disabled={isExporting}
              className='inline-flex items-center rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50'
            >
              <svg
                className='mr-1 h-3 w-3'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          )}
        </div>
      )}

      {/* Chart Container */}
      <div className='relative flex-1' style={{ height: height || 300 }}>
        {renderChart()}
      </div>

      {/* Drill-down hint */}
      {interactions.enableDrillDown && (
        <div className='mt-2 text-center text-xs text-gray-500'>
          Click on data points to drill down
        </div>
      )}
    </div>
  );
}

export default ChartWidget;
