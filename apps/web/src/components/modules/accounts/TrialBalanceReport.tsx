'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FunnelIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { TrialBalanceEntry } from '@/types/accounts';
import { apiClient } from '@/lib/api/client';
import { useNotifications } from '@/hooks/useNotifications';

interface TrialBalanceReportProps {
  className?: string;
}

interface ReportState {
  entries: TrialBalanceEntry[];
  isLoading: boolean;
  filters: {
    company?: string;
    from_date: string;
    to_date: string;
    show_zero_values: boolean;
    include_default_book_entries: boolean;
  };
  expandedGroups: Set<string>;
}

export function TrialBalanceReport({
  className = '',
}: TrialBalanceReportProps) {
  const [state, setState] = useState<ReportState>({
    entries: [],
    isLoading: false,
    filters: {
      from_date: new Date(new Date().getFullYear(), 0, 1)
        .toISOString()
        .split('T')[0], // Start of current year
      to_date: new Date().toISOString().split('T')[0], // Today
      show_zero_values: false,
      include_default_book_entries: true,
    },
    expandedGroups: new Set(),
  });

  const [companies, setCompanies] = useState<
    Array<{ name: string; company_name: string }>
  >([]);

  const { showError } = useNotifications();

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const companiesRes = await apiClient.getList('Company', {
          fields: ['name', 'company_name'],
          limit_page_length: 100,
        });

        setCompanies(
          companiesRes.data as Array<{ name: string; company_name: string }>
        );

        // Set default company if only one exists
        if (companiesRes.data.length === 1) {
          setState((prev) => ({
            ...prev,
            filters: {
              ...prev.filters,
              company: (companiesRes.data[0] as { name: string }).name,
            },
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
    if (
      !state.filters.from_date ||
      !state.filters.to_date ||
      !state.filters.company
    ) {
      return;
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      // Call the Trial Balance report API
      const reportData = await apiClient.call(
        'erpnext.accounts.report.trial_balance.trial_balance.execute',
        {
          filters: {
            ...state.filters,
            presentation_currency: 'USD', // Default currency
          },
        }
      );

      // Transform the report data to match our interface
      const entries: TrialBalanceEntry[] = (
        (reportData as any)?.data || []
      ).map((row: unknown[]) => ({
        account: row[0] || '',
        opening_debit: parseFloat(String(row[1])) || 0,
        opening_credit: parseFloat(String(row[2])) || 0,
        debit: parseFloat(String(row[3])) || 0,
        credit: parseFloat(String(row[4])) || 0,
        closing_debit: parseFloat(String(row[5])) || 0,
        closing_credit: parseFloat(String(row[6])) || 0,
      }));

      // Filter out zero values if requested
      const filteredEntries = state.filters.show_zero_values
        ? entries
        : entries.filter(
            (entry) =>
              entry.opening_debit !== 0 ||
              entry.opening_credit !== 0 ||
              entry.debit !== 0 ||
              entry.credit !== 0 ||
              entry.closing_debit !== 0 ||
              entry.closing_credit !== 0
          );

      setState((prev) => ({
        ...prev,
        entries: filteredEntries,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to load trial balance report:', error);
      showError('Failed to load trial balance report');
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [state.filters, showError]);

  // Handle filter changes
  const handleFilterChange = useCallback(
    (key: string, value: string | boolean) => {
      setState((prev) => ({
        ...prev,
        filters: { ...prev.filters, [key]: value },
      }));
    },
    []
  );

  // Toggle group expansion
  const toggleGroup = useCallback((groupName: string) => {
    setState((prev) => {
      const newExpanded = new Set(prev.expandedGroups);
      if (newExpanded.has(groupName)) {
        newExpanded.delete(groupName);
      } else {
        newExpanded.add(groupName);
      }
      return { ...prev, expandedGroups: newExpanded };
    });
  }, []);

  // Group entries by account hierarchy
  const groupedEntries = state.entries.reduce(
    (groups, entry) => {
      // Simple grouping by first part of account name (before first space or dash)
      const groupName = entry.account.split(/[\s-]/)[0] || 'Other';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(entry);
      return groups;
    },
    {} as Record<string, TrialBalanceEntry[]>
  );

  // Calculate totals
  const totals = state.entries.reduce(
    (acc, entry) => ({
      opening_debit: acc.opening_debit + entry.opening_debit,
      opening_credit: acc.opening_credit + entry.opening_credit,
      debit: acc.debit + entry.debit,
      credit: acc.credit + entry.credit,
      closing_debit: acc.closing_debit + entry.closing_debit,
      closing_credit: acc.closing_credit + entry.closing_credit,
    }),
    {
      opening_debit: 0,
      opening_credit: 0,
      debit: 0,
      credit: 0,
      closing_debit: 0,
      closing_credit: 0,
    }
  );

  // Export functions
  const handleExport = useCallback((format: 'excel' | 'pdf' | 'csv') => {
    // In a real implementation, this would call the backend export API
    console.log(`Exporting Trial Balance as ${format}`);
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
    >
      {/* Header */}
      <div className='border-b border-gray-200 px-6 py-4'>
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='text-lg font-medium text-gray-900'>Trial Balance</h3>
          <div className='flex items-center space-x-2'>
            <button
              onClick={() => handleExport('excel')}
              className='inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
            >
              <DocumentArrowDownIcon className='mr-2 h-4 w-4' />
              Export
            </button>
            <button
              onClick={handlePrint}
              className='inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
            >
              <PrinterIcon className='mr-2 h-4 w-4' />
              Print
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className='mb-4 grid grid-cols-1 gap-4 md:grid-cols-4'>
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>
              Company
            </label>
            <select
              value={state.filters.company || ''}
              onChange={(e) => handleFilterChange('company', e.target.value)}
              className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500'
            >
              <option value=''>Select Company</option>
              {companies.map((company) => (
                <option key={company.name} value={company.name}>
                  {company.company_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>
              From Date
            </label>
            <input
              type='date'
              value={state.filters.from_date}
              onChange={(e) => handleFilterChange('from_date', e.target.value)}
              className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500'
            />
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>
              To Date
            </label>
            <input
              type='date'
              value={state.filters.to_date}
              onChange={(e) => handleFilterChange('to_date', e.target.value)}
              className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500'
            />
          </div>

          <div className='flex items-end'>
            <button
              onClick={loadReport}
              disabled={state.isLoading || !state.filters.company}
              className='w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50'
            >
              {state.isLoading ? 'Loading...' : 'Run Report'}
            </button>
          </div>
        </div>

        {/* Options */}
        <div className='flex items-center space-x-6'>
          <label className='flex items-center'>
            <input
              type='checkbox'
              checked={state.filters.show_zero_values}
              onChange={(e) =>
                handleFilterChange('show_zero_values', e.target.checked)
              }
              className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
            />
            <span className='ml-2 text-sm text-gray-700'>Show Zero Values</span>
          </label>

          <label className='flex items-center'>
            <input
              type='checkbox'
              checked={state.filters.include_default_book_entries}
              onChange={(e) =>
                handleFilterChange(
                  'include_default_book_entries',
                  e.target.checked
                )
              }
              className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
            />
            <span className='ml-2 text-sm text-gray-700'>
              Include Default Book Entries
            </span>
          </label>

          <button className='inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'>
            <FunnelIcon className='mr-2 h-4 w-4' />
            More Options
          </button>
        </div>
      </div>

      {/* Report Table */}
      <div className='overflow-x-auto'>
        {state.isLoading ? (
          <div className='flex h-64 items-center justify-center'>
            <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
          </div>
        ) : state.entries.length === 0 ? (
          <div className='flex h-64 items-center justify-center text-gray-500'>
            No data found for the selected criteria
          </div>
        ) : (
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                  Account
                </th>
                <th
                  className='px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase'
                  colSpan={2}
                >
                  Opening Balance
                </th>
                <th
                  className='px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase'
                  colSpan={2}
                >
                  Transactions
                </th>
                <th
                  className='px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase'
                  colSpan={2}
                >
                  Closing Balance
                </th>
              </tr>
              <tr className='border-t border-gray-200 bg-gray-50'>
                <th className='px-6 py-2'></th>
                <th className='px-6 py-2 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>
                  Debit
                </th>
                <th className='px-6 py-2 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>
                  Credit
                </th>
                <th className='px-6 py-2 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>
                  Debit
                </th>
                <th className='px-6 py-2 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>
                  Credit
                </th>
                <th className='px-6 py-2 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>
                  Debit
                </th>
                <th className='px-6 py-2 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>
                  Credit
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 bg-white'>
              {Object.entries(groupedEntries).map(([groupName, entries]) => (
                <React.Fragment key={groupName}>
                  {/* Group Header */}
                  <tr
                    className='cursor-pointer bg-gray-100'
                    onClick={() => toggleGroup(groupName)}
                  >
                    <td className='px-6 py-3 text-sm font-medium text-gray-900'>
                      <div className='flex items-center'>
                        {state.expandedGroups.has(groupName) ? (
                          <ChevronDownIcon className='mr-2 h-4 w-4' />
                        ) : (
                          <ChevronRightIcon className='mr-2 h-4 w-4' />
                        )}
                        {groupName}
                      </div>
                    </td>
                    <td colSpan={6} className='px-6 py-3 text-sm text-gray-500'>
                      {entries.length} accounts
                    </td>
                  </tr>

                  {/* Group Entries */}
                  {state.expandedGroups.has(groupName) &&
                    entries.map((entry, index) => (
                      <tr
                        key={`${groupName}-${index}`}
                        className='hover:bg-gray-50'
                      >
                        <td className='px-6 py-4 pl-12 text-sm text-gray-900'>
                          {entry.account}
                        </td>
                        <td className='px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900'>
                          {entry.opening_debit > 0
                            ? new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(entry.opening_debit)
                            : '-'}
                        </td>
                        <td className='px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900'>
                          {entry.opening_credit > 0
                            ? new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(entry.opening_credit)
                            : '-'}
                        </td>
                        <td className='px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900'>
                          {entry.debit > 0
                            ? new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(entry.debit)
                            : '-'}
                        </td>
                        <td className='px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900'>
                          {entry.credit > 0
                            ? new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(entry.credit)
                            : '-'}
                        </td>
                        <td className='px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900'>
                          {entry.closing_debit > 0
                            ? new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(entry.closing_debit)
                            : '-'}
                        </td>
                        <td className='px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900'>
                          {entry.closing_credit > 0
                            ? new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(entry.closing_credit)
                            : '-'}
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot className='bg-gray-50'>
              <tr>
                <td className='px-6 py-3 text-sm font-medium text-gray-900'>
                  Total
                </td>
                <td className='px-6 py-3 text-right text-sm font-medium text-gray-900'>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(totals.opening_debit)}
                </td>
                <td className='px-6 py-3 text-right text-sm font-medium text-gray-900'>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(totals.opening_credit)}
                </td>
                <td className='px-6 py-3 text-right text-sm font-medium text-gray-900'>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(totals.debit)}
                </td>
                <td className='px-6 py-3 text-right text-sm font-medium text-gray-900'>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(totals.credit)}
                </td>
                <td className='px-6 py-3 text-right text-sm font-medium text-gray-900'>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(totals.closing_debit)}
                </td>
                <td className='px-6 py-3 text-right text-sm font-medium text-gray-900'>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(totals.closing_credit)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Summary */}
      {state.entries.length > 0 && (
        <div className='border-t border-gray-200 bg-gray-50 px-6 py-4'>
          <div className='grid grid-cols-1 gap-4 text-sm md:grid-cols-3'>
            <div>
              <span className='text-gray-600'>Period:</span>
              <span className='ml-2 font-medium text-gray-900'>
                {new Date(state.filters.from_date).toLocaleDateString()} to{' '}
                {new Date(state.filters.to_date).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className='text-gray-600'>Total Accounts:</span>
              <span className='ml-2 font-medium text-gray-900'>
                {state.entries.length}
              </span>
            </div>
            <div>
              <span className='text-gray-600'>Balance Check:</span>
              <span
                className={`ml-2 font-medium ${
                  Math.abs(totals.closing_debit - totals.closing_credit) < 0.01
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {Math.abs(totals.closing_debit - totals.closing_credit) < 0.01
                  ? 'Balanced'
                  : 'Unbalanced'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
