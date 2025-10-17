'use client';

import React, { useState, useEffect } from 'react';
import type { ReportWidgetConfig } from '@/types/dashboard';

interface ReportWidgetProps {
  config: ReportWidgetConfig;
  onRowClick?: (row: any) => void;
}

interface ReportData {
  columns: Array<{
    fieldname: string;
    label: string;
    fieldtype: string;
    width?: number;
  }>;
  data: Array<Record<string, any>>;
  total_count: number;
}

export function ReportWidget({ config, onRowClick }: ReportWidgetProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { reportName, filters, columns, maxRows, showHeader } = config;

  useEffect(() => {
    fetchReportData();
  }, [reportName, filters]);

  const fetchReportData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Mock data for demonstration
      // In real implementation, this would call the Frappe API
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockData: ReportData = {
        columns: [
          { fieldname: 'name', label: 'ID', fieldtype: 'Link', width: 120 },
          { fieldname: 'customer', label: 'Customer', fieldtype: 'Link', width: 150 },
          { fieldname: 'posting_date', label: 'Date', fieldtype: 'Date', width: 100 },
          { fieldname: 'grand_total', label: 'Amount', fieldtype: 'Currency', width: 120 },
          { fieldname: 'status', label: 'Status', fieldtype: 'Data', width: 100 },
        ],
        data: [
          {
            name: 'SI-2024-001',
            customer: 'Customer A',
            posting_date: '2024-01-15',
            grand_total: 15000,
            status: 'Paid',
          },
          {
            name: 'SI-2024-002',
            customer: 'Customer B',
            posting_date: '2024-01-16',
            grand_total: 25000,
            status: 'Unpaid',
          },
          {
            name: 'SI-2024-003',
            customer: 'Customer C',
            posting_date: '2024-01-17',
            grand_total: 18500,
            status: 'Paid',
          },
        ],
        total_count: 3,
      };

      // Filter columns if specified
      if (columns && columns.length > 0) {
        mockData.columns = mockData.columns.filter(col => 
          columns.includes(col.fieldname)
        );
      }

      // Limit rows
      if (maxRows && mockData.data.length > maxRows) {
        mockData.data = mockData.data.slice(0, maxRows);
      }

      setReportData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCellValue = (value: any, fieldtype: string) => {
    if (value === null || value === undefined) return '';

    switch (fieldtype) {
      case 'Currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
      case 'Date':
        return new Date(value).toLocaleDateString();
      case 'Datetime':
        return new Date(value).toLocaleString();
      case 'Float':
        return parseFloat(value).toFixed(2);
      case 'Int':
        return parseInt(value).toLocaleString();
      default:
        return String(value);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
      case 'pending':
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading report...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2 text-sm text-red-600">Error loading report</p>
          <p className="text-xs text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!reportData || reportData.data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-widget h-full flex flex-col">
      {/* Report Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900">{reportName}</h4>
          <span className="text-xs text-gray-500">
            {reportData.data.length} of {reportData.total_count} records
          </span>
        </div>
      )}

      {/* Report Table */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {reportData.columns.map((column) => (
                <th
                  key={column.fieldname}
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportData.data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {reportData.columns.map((column) => (
                  <td
                    key={column.fieldname}
                    className="px-3 py-2 whitespace-nowrap text-sm text-gray-900"
                  >
                    {column.fieldname === 'status' ? (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        getStatusColor(row[column.fieldname])
                      }`}>
                        {row[column.fieldname]}
                      </span>
                    ) : (
                      formatCellValue(row[column.fieldname], column.fieldtype)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show more indicator */}
      {reportData.total_count > reportData.data.length && (
        <div className="mt-2 text-center">
          <span className="text-xs text-gray-500">
            Showing {reportData.data.length} of {reportData.total_count} records
          </span>
        </div>
      )}
    </div>
  );
}

export default ReportWidget;