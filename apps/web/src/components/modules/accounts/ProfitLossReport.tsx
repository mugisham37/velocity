'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  DocumentArrowDownIcon,
  PrinterIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { ProfitLossEntry } from '@/types/accounts';
import { apiClient } from '@/lib/api/client';
import { useNotifications } from '@/hooks/useNotifications';

interface ProfitLossReportProps {
  className?: string;
}

interface ReportState {
  entries: ProfitLossEntry[];
  isLoading: boolean;
  filters: {
    company?: string;
    from_date: string;
    to_date: string;
    periodicity: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';
    accumulated_values: boolean;
  };
  expandedGroups: Set<string>;
}

export function ProfitLossReport({ className = '' }: ProfitLossReportProps) {
  const [state, setState] = useState<ReportState>({
    entries: [],
    isLoading: false,
    filters: {
      from_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of current year
      to_date: new Date().toISOString().split('T')[0], // Today
      periodicity: 'Yearly',
      accumulated_values: true,
    },
    expandedGroups: new Set(['Income', 'Expense']),
  });

  const [companies, setCompanies] = useState<Array<{ name: string; company_name: string }>>([]);

  const { showError } = useNotifications();

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const companiesRes = await apiClient.getList('Company', {
          fields: ['name', 'company_name'],
          limit_page_length: 100,
        });

        setCompanies(companiesRes.data as Array<{ name: string; company_name: string }>);

        // Set default company if only one exists
        if (companiesRes.data.length === 1) {
          setState(prev => ({
            ...prev,
            filters: { ...prev.filters, company: (companiesRes.data[0] as { name: string }).name }
          }));
        }
      } catch (error) {
        console.error('Failed to load dropdown data:', error);
        showError('Failed to load dropdown data');
      }
    };

    loadDropdownData();
  }, [showError]);

  // Load report data
  const loadReport = useCallback(async () => {
    if (!state.filters.from_date || !state.filters.to_date || !state.filters.company) {
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Call the Profit and Loss report API
      const reportData = await apiClient.call('erpnext.accounts.report.profit_and_loss_statement.profit_and_loss_statement.execute', {
        filters: {
          ...state.filters,
          presentation_currency: 'USD', // Default currency
        },
      });

      // Transform the report data to match our interface
      const entries: ProfitLossEntry[] = ((reportData as any)?.data || []).map((row: any[]) => ({
        account: row[0] || '',
        account_name: row[1] || row[0] || '',
        parent_account: row[2] || '',
        indent: parseInt(row[3]) || 0,
        account_type: row[4] || '',
        is_group: Boolean(row[5]),
        opening_balance: parseFloat(row[6]) || 0,
        debit: parseFloat(row[7]) || 0,
        credit: parseFloat(row[8]) || 0,
        closing_balance: parseFloat(row[9]) || 0,
      }));

      setState(prev => ({
        ...prev,
        entries,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to load profit and loss report:', error);
      showError('Failed to load profit and loss report');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.filters, showError]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: string | boolean) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
    }));
  }, []);

  // Toggle group expansion
  const toggleGroup = useCallback((groupName: string) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedGroups);
      if (newExpanded.has(groupName)) {
        newExpanded.delete(groupName);
      } else {
        newExpanded.add(groupName);
      }
      return { ...prev, expandedGroups: newExpanded };
    });
  }, []);

  // Group entries by account type
  const groupedEntries = state.entries.reduce((groups, entry) => {
    const groupName = entry.account_type === 'Income Account' ? 'Income' : 
                     entry.account_type === 'Expense Account' ? 'Expense' : 
                     'Other';
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(entry);
    return groups;
  }, {} as Record<string, ProfitLossEntry[]>);

  // Calculate totals
  const totals = {
    income: (groupedEntries.Income || []).reduce((sum, entry) => sum + entry.closing_balance, 0),
    expense: (groupedEntries.Expense || []).reduce((sum, entry) => sum + Math.abs(entry.closing_balance), 0),
  };

  const netProfit = totals.income - totals.expense;

  // Export functions
  const handleExport = useCallback((format: 'excel' | 'pdf' | 'csv') => {
    // In a real implementation, this would call the backend export API
    console.log(`Exporting Profit & Loss as ${format}`);
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Profit & Loss Statement</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleExport('excel')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
              Export
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <PrinterIcon className="w-4 h-4 mr-2" />
              Print
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <select
              value={state.filters.company || ''}
              onChange={(e) => handleFilterChange('company', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Company</option>
              {companies.map((company) => (
                <option key={company.name} value={company.name}>
                  {company.company_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={state.filters.from_date}
              onChange={(e) => handleFilterChange('from_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={state.filters.to_date}
              onChange={(e) => handleFilterChange('to_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Periodicity</label>
            <select
              value={state.filters.periodicity}
              onChange={(e) => handleFilterChange('periodicity', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Half-Yearly">Half-Yearly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadReport}
              disabled={state.isLoading || !state.filters.company}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {state.isLoading ? 'Loading...' : 'Run Report'}
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center space-x-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={state.filters.accumulated_values}
              onChange={(e) => handleFilterChange('accumulated_values', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Accumulated Values</span>
          </label>
        </div>
      </div>

      {/* Report Content */}
      <div className="p-6">
        {state.isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : state.entries.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No data found for the selected criteria
          </div>
        ) : (
          <div className="space-y-6">
            {/* Company Header */}
            {state.filters.company && (
              <div className="text-center border-b border-gray-200 pb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {companies.find(c => c.name === state.filters.company)?.company_name}
                </h2>
                <h3 className="text-lg text-gray-700">Profit & Loss Statement</h3>
                <p className="text-sm text-gray-600">
                  For the period from {new Date(state.filters.from_date).toLocaleDateString()} to {new Date(state.filters.to_date).toLocaleDateString()}
                </p>
              </div>
            )}

            {/* Income Section */}
            <div>
              <div 
                className="flex items-center justify-between py-2 border-b border-gray-300 cursor-pointer"
                onClick={() => toggleGroup('Income')}
              >
                <div className="flex items-center">
                  {state.expandedGroups.has('Income') ? (
                    <ChevronDownIcon className="w-5 h-5 mr-2" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 mr-2" />
                  )}
                  <h4 className="text-lg font-semibold text-gray-900">INCOME</h4>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(totals.income)}
                </div>
              </div>

              {state.expandedGroups.has('Income') && (groupedEntries.Income || []).map((entry, index) => (
                <div key={index} className="flex items-center justify-between py-2 pl-8 border-b border-gray-100">
                  <div className="text-sm text-gray-700" style={{ paddingLeft: `${entry.indent * 20}px` }}>
                    {entry.account_name}
                  </div>
                  <div className="text-sm text-gray-900">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(entry.closing_balance)}
                  </div>
                </div>
              ))}
            </div>

            {/* Expense Section */}
            <div>
              <div 
                className="flex items-center justify-between py-2 border-b border-gray-300 cursor-pointer"
                onClick={() => toggleGroup('Expense')}
              >
                <div className="flex items-center">
                  {state.expandedGroups.has('Expense') ? (
                    <ChevronDownIcon className="w-5 h-5 mr-2" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 mr-2" />
                  )}
                  <h4 className="text-lg font-semibold text-gray-900">EXPENSES</h4>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(totals.expense)}
                </div>
              </div>

              {state.expandedGroups.has('Expense') && (groupedEntries.Expense || []).map((entry, index) => (
                <div key={index} className="flex items-center justify-between py-2 pl-8 border-b border-gray-100">
                  <div className="text-sm text-gray-700" style={{ paddingLeft: `${entry.indent * 20}px` }}>
                    {entry.account_name}
                  </div>
                  <div className="text-sm text-gray-900">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(Math.abs(entry.closing_balance))}
                  </div>
                </div>
              ))}
            </div>

            {/* Net Profit/Loss */}
            <div className="border-t-2 border-gray-400 pt-4">
              <div className="flex items-center justify-between py-2">
                <h4 className={`text-lg font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS'}
                </h4>
                <div className={`text-lg font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(Math.abs(netProfit))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Income:</span>
                  <div className="font-medium text-green-600">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totals.income)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Total Expenses:</span>
                  <div className="font-medium text-red-600">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totals.expense)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">{netProfit >= 0 ? 'Net Profit:' : 'Net Loss:'}</span>
                  <div className={`font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(netProfit))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}