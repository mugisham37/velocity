'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  DocumentArrowDownIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import { GeneralLedgerEntry } from '@/types/accounts';
import { apiClient } from '@/lib/api/client';
import { useNotifications } from '@/hooks/useNotifications';

interface GeneralLedgerReportProps {
  className?: string;
}

interface ReportState {
  entries: GeneralLedgerEntry[];
  isLoading: boolean;
  filters: {
    company?: string;
    account?: string;
    party_type?: string;
    party?: string;
    cost_center?: string;
    project?: string;
    from_date: string;
    to_date: string;
    voucher_type?: string;
    group_by?: string;
  };
  searchQuery: string;
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
  };
}

export function GeneralLedgerReport({ className = '' }: GeneralLedgerReportProps) {
  const [state, setState] = useState<ReportState>({
    entries: [],
    isLoading: false,
    filters: {
      from_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of current year
      to_date: new Date().toISOString().split('T')[0], // Today
    },
    searchQuery: '',
    pagination: {
      page: 1,
      pageSize: 50,
      totalCount: 0,
    },
  });

  const [companies, setCompanies] = useState<Array<{ name: string; company_name: string }>>([]);
  const [accounts, setAccounts] = useState<Array<{ name: string; account_name: string }>>([]);

  const { showError } = useNotifications();

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [companiesRes, accountsRes] = await Promise.all([
          apiClient.getList('Company', {
            fields: ['name', 'company_name'],
            limit_page_length: 100,
          }),
          apiClient.getList('Account', {
            fields: ['name', 'account_name'],
            filters: { disabled: 0 },
            order_by: 'account_name asc',
            limit_page_length: 500,
          }),
        ]);

        setCompanies(companiesRes.data as Array<{ name: string; company_name: string }>);
        setAccounts(accountsRes.data as Array<{ name: string; account_name: string }>);

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
    if (!state.filters.from_date || !state.filters.to_date) {
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Call the General Ledger report API
      const reportData = await apiClient.call('erpnext.accounts.report.general_ledger.general_ledger.execute', {
        filters: {
          ...state.filters,
          presentation_currency: 'USD', // Default currency
        },
        limit_start: (state.pagination.page - 1) * state.pagination.pageSize,
        limit_page_length: state.pagination.pageSize,
      });

      // Transform the report data to match our interface
      const entries: GeneralLedgerEntry[] = ((reportData as any)?.data || []).map((row: unknown[]) => ({
        posting_date: row[0] || '',
        account: row[1] || '',
        debit: parseFloat(row[2]) || 0,
        credit: parseFloat(row[3]) || 0,
        balance: parseFloat(row[4]) || 0,
        voucher_type: row[5] || '',
        voucher_no: row[6] || '',
        against: row[7] || '',
        party_type: row[8] || '',
        party: row[9] || '',
        cost_center: row[10] || '',
        project: row[11] || '',
        against_voucher_type: row[12] || '',
        against_voucher: row[13] || '',
        remarks: row[14] || '',
      }));

      setState(prev => ({
        ...prev,
        entries,
        pagination: {
          ...prev.pagination,
          totalCount: entries.length, // In a real implementation, this would come from the API
        },
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to load general ledger report:', error);
      showError('Failed to load general ledger report');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.filters, state.pagination.page, state.pagination.pageSize, showError]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: string) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
      pagination: { ...prev.pagination, page: 1 },
    }));
  }, []);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
      pagination: { ...prev.pagination, page: 1 },
    }));
  }, []);

  // Filter entries based on search query
  const filteredEntries = state.entries.filter(entry => {
    if (!state.searchQuery.trim()) return true;
    
    const query = state.searchQuery.toLowerCase();
    return (
      entry.account.toLowerCase().includes(query) ||
      entry.voucher_no.toLowerCase().includes(query) ||
      entry.party?.toLowerCase().includes(query) ||
      entry.against.toLowerCase().includes(query) ||
      entry.remarks?.toLowerCase().includes(query)
    );
  });

  // Calculate totals
  const totals = filteredEntries.reduce(
    (acc, entry) => ({
      debit: acc.debit + entry.debit,
      credit: acc.credit + entry.credit,
    }),
    { debit: 0, credit: 0 }
  );

  // Export functions
  const handleExport = useCallback((format: 'excel' | 'pdf' | 'csv') => {
    // In a real implementation, this would call the backend export API
    console.log(`Exporting General Ledger as ${format}`);
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">General Ledger</h3>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <select
              value={state.filters.company || ''}
              onChange={(e) => handleFilterChange('company', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Companies</option>
              {companies.map((company) => (
                <option key={company.name} value={company.name}>
                  {company.company_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
            <select
              value={state.filters.account || ''}
              onChange={(e) => handleFilterChange('account', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Accounts</option>
              {accounts.map((account) => (
                <option key={account.name} value={account.name}>
                  {account.account_name}
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
        </div>

        {/* Search and Actions */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search entries..."
              value={state.searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            onClick={loadReport}
            disabled={state.isLoading}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {state.isLoading ? 'Loading...' : 'Run Report'}
          </button>

          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <FunnelIcon className="w-4 h-4 mr-2" />
            More Filters
          </button>

          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <ArrowsUpDownIcon className="w-4 h-4 mr-2" />
            Sort
          </button>
        </div>
      </div>

      {/* Report Table */}
      <div className="overflow-x-auto">
        {state.isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            {state.searchQuery ? 'No entries found matching your search' : 'No entries found for the selected criteria'}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Voucher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Party
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Debit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Against
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.map((entry, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(entry.posting_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {entry.account}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{entry.voucher_no}</div>
                      <div className="text-gray-500">{entry.voucher_type}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {entry.party && (
                      <div>
                        <div className="font-medium">{entry.party}</div>
                        <div className="text-gray-500">{entry.party_type}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {entry.debit > 0 ? new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(entry.debit) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {entry.credit > 0 ? new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(entry.credit) : '-'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                    entry.balance > 0 ? 'text-green-600' : entry.balance < 0 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(Math.abs(entry.balance))}
                    {entry.balance !== 0 && (
                      <span className="ml-1 text-xs">
                        {entry.balance > 0 ? 'Dr' : 'Cr'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {entry.against}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {entry.remarks}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={4} className="px-6 py-3 text-sm font-medium text-gray-900">
                  Total
                </td>
                <td className="px-6 py-3 text-sm font-medium text-right text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(totals.debit)}
                </td>
                <td className="px-6 py-3 text-sm font-medium text-right text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(totals.credit)}
                </td>
                <td colSpan={3} className="px-6 py-3"></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Summary */}
      {filteredEntries.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Showing {filteredEntries.length} entries
            </span>
            <div className="flex items-center space-x-6">
              <span className="text-gray-600">
                Total Debit: <span className="font-medium text-gray-900">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totals.debit)}
                </span>
              </span>
              <span className="text-gray-600">
                Total Credit: <span className="font-medium text-gray-900">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totals.credit)}
                </span>
              </span>
              <span className="text-gray-600">
                Difference: <span className={`font-medium ${
                  Math.abs(totals.debit - totals.credit) < 0.01 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(totals.debit - totals.credit))}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}