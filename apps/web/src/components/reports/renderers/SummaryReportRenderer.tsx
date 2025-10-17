'use client';

import React, { useMemo } from 'react';
import { ReportResult, ReportColumn, SummaryConfig, FormattingOptions } from '@/types/reports';
import { Button } from '@/components/ui/button';
import { 
  DocumentArrowDownIcon,
  CalculatorIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface SummaryReportRendererProps {
  data: ReportResult;
  title?: string;
  summaryConfig: SummaryConfig;
  formattingOptions?: FormattingOptions;
  showExportOptions?: boolean;
  onExport?: (format: 'PDF' | 'Excel' | 'CSV') => void;
}

interface SummaryRow {
  groupValues: Record<string, unknown>;
  aggregates: Record<string, number>;
  count: number;
  percentage?: number;
}

export function SummaryReportRenderer({ 
  data, 
  title, 
  summaryConfig,
  formattingOptions,
  showExportOptions = true, 
  onExport 
}: SummaryReportRendererProps) {
  const { columns, data: rows } = data;

  const summaryData = useMemo(() => {
    if (!summaryConfig.group_by_fields.length || !summaryConfig.aggregate_functions.length) {
      return [];
    }

    // Group data by the specified fields
    const groups = new Map<string, unknown[][]>();
    
    rows.forEach(row => {
      const groupKey = summaryConfig.group_by_fields
        .map(fieldname => {
          const colIndex = columns.findIndex(col => col.fieldname === fieldname);
          return colIndex >= 0 ? row[colIndex] : '';
        })
        .join('|');
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(row);
    });

    // Calculate aggregates for each group
    const summaryRows: SummaryRow[] = [];
    const totalCount = rows.length;

    groups.forEach((groupRows, groupKey) => {
      const groupValues: Record<string, unknown> = {};
      const groupKeyParts = groupKey.split('|');
      
      summaryConfig.group_by_fields.forEach((fieldname, index) => {
        groupValues[fieldname] = groupKeyParts[index];
      });

      const aggregates: Record<string, number> = {};
      
      summaryConfig.aggregate_functions.forEach(aggFunc => {
        const colIndex = columns.findIndex(col => col.fieldname === aggFunc.field);
        if (colIndex >= 0) {
          const values = groupRows
            .map(row => row[colIndex])
            .filter(val => val !== null && val !== undefined && val !== '')
            .map(val => typeof val === 'number' ? val : parseFloat(String(val)))
            .filter(val => !isNaN(val));

          let result = 0;
          switch (aggFunc.function) {
            case 'sum':
              result = values.reduce((sum, val) => sum + val, 0);
              break;
            case 'avg':
              result = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
              break;
            case 'count':
              result = values.length;
              break;
            case 'min':
              result = values.length > 0 ? Math.min(...values) : 0;
              break;
            case 'max':
              result = values.length > 0 ? Math.max(...values) : 0;
              break;
          }
          
          const key = aggFunc.label || `${aggFunc.function}(${aggFunc.field})`;
          aggregates[key] = result;
        }
      });

      const count = groupRows.length;
      const percentage = summaryConfig.show_percentages ? (count / totalCount) * 100 : undefined;

      summaryRows.push({
        groupValues,
        aggregates,
        count,
        percentage
      });
    });

    // Sort by first group field
    summaryRows.sort((a, b) => {
      const firstField = summaryConfig.group_by_fields[0];
      const aVal = String(a.groupValues[firstField] || '');
      const bVal = String(b.groupValues[firstField] || '');
      return aVal.localeCompare(bVal);
    });

    return summaryRows;
  }, [data, summaryConfig, columns, rows]);

  const formatValue = (value: unknown, type: 'currency' | 'number' | 'percentage' | 'text' = 'text') => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    if (typeof value === 'number') {
      switch (type) {
        case 'currency':
          const symbol = formattingOptions?.currency_symbol || '$';
          return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        case 'percentage':
          return `${value.toFixed(2)}%`;
        case 'number':
          return value.toLocaleString();
        default:
          return value.toString();
      }
    }

    return String(value);
  };

  const getAggregateType = (key: string): 'currency' | 'number' | 'percentage' | 'text' => {
    if (key.includes('amount') || key.includes('cost') || key.includes('price')) {
      return 'currency';
    }
    if (key.includes('count') || key.includes('sum') || key.includes('avg')) {
      return 'number';
    }
    return 'text';
  };

  // Calculate totals if enabled
  const totals = useMemo(() => {
    if (!summaryConfig.show_totals || summaryData.length === 0) {
      return null;
    }

    const totalAggregates: Record<string, number> = {};
    const aggregateKeys = Object.keys(summaryData[0].aggregates);

    aggregateKeys.forEach(key => {
      const aggFunc = summaryConfig.aggregate_functions.find(af => 
        (af.label || `${af.function}(${af.field})`) === key
      );
      
      if (aggFunc?.function === 'sum' || aggFunc?.function === 'count') {
        totalAggregates[key] = summaryData.reduce((sum, row) => sum + row.aggregates[key], 0);
      } else if (aggFunc?.function === 'avg') {
        const sum = summaryData.reduce((sum, row) => sum + row.aggregates[key], 0);
        totalAggregates[key] = sum / summaryData.length;
      }
    });

    return totalAggregates;
  }, [summaryData, summaryConfig]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          {title && (
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          )}
          <p className="text-sm text-gray-600 mt-1">
            Summary Report - {summaryData.length} groups from {rows.length} records
          </p>
        </div>
        {showExportOptions && onExport && (
          <div className="flex items-center space-x-2">
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
          </div>
        )}
      </div>

      {/* Summary Table */}
      <div className="flex-1 overflow-auto">
        {summaryData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <CalculatorIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Summary Data</h3>
              <p className="text-gray-600">
                Configure group by fields and aggregate functions to generate summary data.
              </p>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {/* Group by columns */}
                {summaryConfig.group_by_fields.map(fieldname => {
                  const column = columns.find(col => col.fieldname === fieldname);
                  return (
                    <th
                      key={fieldname}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column?.label || fieldname}
                    </th>
                  );
                })}
                
                {/* Aggregate columns */}
                {summaryConfig.aggregate_functions.map(aggFunc => {
                  const key = aggFunc.label || `${aggFunc.function}(${aggFunc.field})`;
                  return (
                    <th
                      key={key}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {key}
                    </th>
                  );
                })}
                
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
                
                {summaryConfig.show_percentages && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {summaryData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {/* Group values */}
                  {summaryConfig.group_by_fields.map(fieldname => (
                    <td key={fieldname} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatValue(row.groupValues[fieldname])}
                    </td>
                  ))}
                  
                  {/* Aggregate values */}
                  {Object.entries(row.aggregates).map(([key, value]) => (
                    <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      {formatValue(value, getAggregateType(key))}
                    </td>
                  ))}
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {row.count.toLocaleString()}
                  </td>
                  
                  {summaryConfig.show_percentages && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatValue(row.percentage, 'percentage')}
                    </td>
                  )}
                </tr>
              ))}
              
              {/* Totals row */}
              {totals && (
                <tr className="bg-gray-100 font-semibold">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" colSpan={summaryConfig.group_by_fields.length}>
                    Total
                  </td>
                  {Object.entries(totals).map(([key, value]) => (
                    <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                      {formatValue(value, getAggregateType(key))}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                    {rows.length.toLocaleString()}
                  </td>
                  {summaryConfig.show_percentages && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                      100.00%
                    </td>
                  )}
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}