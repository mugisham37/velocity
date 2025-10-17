'use client';

import React, { useState, useEffect } from 'react';
import { ReportResult, ScriptConfig, FormattingOptions } from '@/types/reports';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDocuments } from '@/hooks/useDocuments';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  DocumentArrowDownIcon,
  CodeBracketIcon,
  PlayIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ScriptReportRendererProps {
  title?: string;
  scriptConfig: ScriptConfig;
  formattingOptions?: FormattingOptions;
  showExportOptions?: boolean;
  onExport?: (format: 'PDF' | 'Excel' | 'CSV') => void;
}

interface ScriptReportResult {
  columns: Array<{
    fieldname: string;
    label: string;
    fieldtype?: string;
    width?: number;
  }>;
  data: unknown[][];
  message?: string;
  chart?: {
    data: {
      labels: string[];
      datasets: Array<{
        name: string;
        values: number[];
      }>;
    };
  };
}

export function ScriptReportRenderer({ 
  title, 
  scriptConfig,
  formattingOptions,
  showExportOptions = true, 
  onExport
}: ScriptReportRendererProps) {
  const [reportData, setReportData] = useState<ScriptReportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parameters, setParameters] = useState<Record<string, unknown>>(scriptConfig.parameters || {});
  
  const { getList } = useDocuments();
  const { showError, showSuccess } = useNotifications();

  const executeScript = async () => {
    if (!scriptConfig.script_name) {
      setError('No script name specified');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call the script report API
      const response = await fetch('/api/method/frappe.desk.query_report.run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_name: scriptConfig.script_name,
          filters: parameters
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.message) {
        setReportData(result.message);
        showSuccess('Script Executed', 'Report generated successfully');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Script execution failed:', error);
      setError(error instanceof Error ? error.message : 'Script execution failed');
      showError('Script Failed', 'Failed to execute script report');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-execute on mount if parameters are provided
  useEffect(() => {
    if (scriptConfig.script_name && Object.keys(parameters).length > 0) {
      executeScript();
    }
  }, [scriptConfig.script_name]);

  const formatCellValue = (value: unknown, column: any) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    if (typeof value === 'number') {
      if (column.fieldtype === 'Currency' || column.fieldname?.includes('amount')) {
        const symbol = formattingOptions?.currency_symbol || '$';
        return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      if (column.fieldtype === 'Float') {
        return value.toFixed(2);
      }
      return value.toLocaleString();
    }

    if (typeof value === 'string') {
      if (column.fieldtype === 'Date' && value.includes('-')) {
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return value;
        }
      }
      if (column.fieldtype === 'Datetime' && value.includes('-')) {
        try {
          return new Date(value).toLocaleString();
        } catch {
          return value;
        }
      }
    }

    return String(value);
  };

  const renderParameterInput = (key: string, value: unknown) => {
    return (
      <div key={key} className="flex flex-col space-y-1">
        <label className="text-sm font-medium text-gray-700">
          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </label>
        <input
          type="text"
          value={String(value || '')}
          onChange={(e) => setParameters(prev => ({ ...prev, [key]: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={`Enter ${key}...`}
        />
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          {title && (
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          )}
          <p className="text-sm text-gray-600 mt-1">
            Script Report: {scriptConfig.script_name}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={executeScript}
            disabled={isLoading || !scriptConfig.script_name}
            className="flex items-center space-x-1"
          >
            <PlayIcon className="h-4 w-4" />
            <span>{isLoading ? 'Running...' : 'Run Script'}</span>
          </Button>
          {showExportOptions && onExport && reportData && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('CSV')}
                className="flex items-center space-x-1"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>CSV</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('Excel')}
                className="flex items-center space-x-1"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>Excel</span>
              </Button>
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

      {/* Parameters Panel */}
      {Object.keys(parameters).length > 0 && (
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(parameters).map(([key, value]) => renderParameterInput(key, value))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {error ? (
          <div className="h-full flex items-center justify-center">
            <Card className="p-6 max-w-md">
              <div className="text-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Script Error</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={executeScript} disabled={isLoading}>
                  Try Again
                </Button>
              </div>
            </Card>
          </div>
        ) : !reportData ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <CodeBracketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isLoading ? 'Executing Script...' : 'Ready to Execute'}
              </h3>
              <p className="text-gray-600 mb-4">
                {isLoading 
                  ? 'Please wait while the script is running...'
                  : 'Click "Run Script" to execute the report and view results.'
                }
              </p>
              {!isLoading && (
                <Button onClick={executeScript} disabled={!scriptConfig.script_name}>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Run Script
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6">
            {reportData.message && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">{reportData.message}</p>
              </div>
            )}
            
            {/* Data Table */}
            {reportData.data.length > 0 && (
              <Card>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {reportData.columns.map((column, index) => (
                          <th
                            key={index}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            style={{ width: column.width ? `${column.width}px` : 'auto' }}
                          >
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.data.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50">
                          {row.map((cell, cellIndex) => {
                            const column = reportData.columns[cellIndex];
                            return (
                              <td
                                key={cellIndex}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                              >
                                {formatCellValue(cell, column)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Chart (if provided by script) */}
            {reportData.chart && (
              <Card className="mt-6">
                <div className="p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Chart</h4>
                  {/* Chart implementation would go here */}
                  <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
                    <p className="text-gray-500">Chart rendering not implemented</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}