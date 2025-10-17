'use client';

import React, { useState, useMemo } from 'react';
import { ReportResult, ReportColumn, FormattingOptions } from '@/types/reports';
import { Button } from '@/components/ui/button';
import { 
  DocumentArrowDownIcon,
  TableCellsIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface TabularReportRendererProps {
  data: ReportResult;
  title?: string;
  formattingOptions?: FormattingOptions;
  showExportOptions?: boolean;
  onExport?: (format: 'PDF' | 'Excel' | 'CSV') => void;
}

export function TabularReportRenderer({ 
  data, 
  title, 
  formattingOptions,
  showExportOptions = true, 
  onExport 
}: TabularReportRendererProps) {
  const { columns, data: rows, message } = data;
  const [currentPage, setCurrentPage] = useState(1);
  
  const pageSize = formattingOptions?.page_size || 50;
  const totalPages = Math.ceil(rows.length / pageSize);
  
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return rows.slice(startIndex, endIndex);
  }, [rows, currentPage, pageSize]);

  const formatCellValue = (value: unknown, column: ReportColumn, rowIndex: number) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    // Format based on field type
    if (typeof value === 'number') {
      if (column.format === 'Currency' || column.fieldname?.includes('amount') || column.fieldname?.includes('cost')) {
        const symbol = formattingOptions?.currency_symbol || '$';
        return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      if (column.format === 'Percentage') {
        return `${(value * 100).toFixed(2)}%`;
      }
      if (column.format === 'Float' || typeof value === 'number') {
        const format = formattingOptions?.number_format || 'standard';
        if (format === 'standard') {
          return value.toLocaleString();
        }
        return value.toFixed(2);
      }
      return value.toString();
    }

    if (typeof value === 'string') {
      // Format dates
      if (column.format === 'Date' && value.includes('-')) {
        try {
          const dateFormat = formattingOptions?.date_format || 'short';
          const date = new Date(value);
          if (dateFormat === 'long') {
            return date.toLocaleDateString(undefined, { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
          }
          return date.toLocaleDateString();
        } catch {
          return value;
        }
      }
      if (column.format === 'Datetime' && value.includes('-')) {
        try {
          return new Date(value).toLocaleString();
        } catch {
          return value;
        }
      }
    }

    return String(value);
  };

  const getColumnAlignment = (column: ReportColumn) => {
    if (column.align) return column.align;
    if (column.format === 'Currency' || column.format === 'Float' || column.format === 'Percentage') {
      return 'right';
    }
    return 'left';
  };

  const getRowClassName = (rowIndex: number) => {
    let className = 'hover:bg-gray-50';
    if (formattingOptions?.alternate_row_colors && rowIndex % 2 === 1) {
      className += ' bg-gray-25';
    }
    return className;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          {title && (
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          )}
          {message && (
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          )}
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

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {rows.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <TableCellsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Found</h3>
              <p className="text-gray-600">
                Your query returned no results. Try adjusting your filters.
              </p>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {formattingOptions?.show_row_numbers && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                )}
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      getColumnAlignment(column) === 'right' ? 'text-right' : 
                      getColumnAlignment(column) === 'center' ? 'text-center' : 'text-left'
                    } ${formattingOptions?.freeze_first_column && index === 0 ? 'sticky left-0 bg-gray-50 z-10' : ''}`}
                    style={{ width: column.width ? `${column.width}px` : 'auto' }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedRows.map((row, rowIndex) => (
                <tr key={rowIndex} className={getRowClassName(rowIndex)}>
                  {formattingOptions?.show_row_numbers && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(currentPage - 1) * pageSize + rowIndex + 1}
                    </td>
                  )}
                  {row.map((cell, cellIndex) => {
                    const column = columns[cellIndex];
                    return (
                      <td
                        key={cellIndex}
                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                          getColumnAlignment(column) === 'right' ? 'text-right' : 
                          getColumnAlignment(column) === 'center' ? 'text-center' : 'text-left'
                        } ${formattingOptions?.freeze_first_column && cellIndex === 0 ? 'sticky left-0 bg-white z-10' : ''}`}
                      >
                        {formatCellValue(cell, column, rowIndex)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {rows.length > pageSize && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, rows.length)} of {rows.length} records
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center space-x-1"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <span>Previous</span>
              </Button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}