'use client';

import React from 'react';
import { ReportResult, ReportType, ChartConfig, SummaryConfig, ScriptConfig, FormattingOptions } from '@/types/reports';
import { TabularReportRenderer } from './renderers/TabularReportRenderer';
import { SummaryReportRenderer } from './renderers/SummaryReportRenderer';
import { ChartReportRenderer } from './renderers/ChartReportRenderer';
import { ScriptReportRenderer } from './renderers/ScriptReportRenderer';

interface ReportRendererProps {
  data?: ReportResult;
  title?: string;
  reportType?: ReportType;
  chartConfig?: ChartConfig;
  summaryConfig?: SummaryConfig;
  scriptConfig?: ScriptConfig;
  formattingOptions?: FormattingOptions;
  showExportOptions?: boolean;
  onExport?: (format: 'PDF' | 'Excel' | 'CSV') => void;
  onConfigChange?: (config: ChartConfig) => void;
}

export function ReportRenderer({ 
  data,
  title, 
  reportType = 'tabular',
  chartConfig,
  summaryConfig,
  scriptConfig,
  formattingOptions,
  showExportOptions = true, 
  onExport,
  onConfigChange
}: ReportRendererProps) {
  
  // Handle script reports differently as they don't use the standard data prop
  if (reportType === 'script' && scriptConfig) {
    return (
      <ScriptReportRenderer
        title={title}
        scriptConfig={scriptConfig}
        formattingOptions={formattingOptions}
        showExportOptions={showExportOptions}
        onExport={onExport}
      />
    );
  }

  // For other report types, data is required
  if (!data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">
            Please run your query to generate report data.
          </p>
        </div>
      </div>
    );
  }

  switch (reportType) {
    case 'summary':
      if (!summaryConfig) {
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Summary Configuration Required</h3>
              <p className="text-gray-600">
                Please configure group by fields and aggregate functions for summary reports.
              </p>
            </div>
          </div>
        );
      }
      return (
        <SummaryReportRenderer
          data={data}
          title={title}
          summaryConfig={summaryConfig}
          formattingOptions={formattingOptions}
          showExportOptions={showExportOptions}
          onExport={onExport}
        />
      );

    case 'chart':
      if (!chartConfig) {
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chart Configuration Required</h3>
              <p className="text-gray-600">
                Please configure chart settings to display chart reports.
              </p>
            </div>
          </div>
        );
      }
      return (
        <ChartReportRenderer
          data={data}
          title={title}
          chartConfig={chartConfig}
          formattingOptions={formattingOptions}
          showExportOptions={showExportOptions}
          onExport={onExport}
          onConfigChange={onConfigChange}
        />
      );

    case 'tabular':
    default:
      return (
        <TabularReportRenderer
          data={data}
          title={title}
          formattingOptions={formattingOptions}
          showExportOptions={showExportOptions}
          onExport={onExport}
        />
      );
  }
}