'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { PaymentEntry, PaymentType, PartyType } from '@/types/accounts';
import { apiClient } from '@/lib/api/client';
import { useNotifications } from '@/hooks/useNotifications';

interface PaymentEntryListProps {
  onCreateNew: () => void;
  onEdit: (paymentEntry: PaymentEntry) => void;
  onView: (paymentEntry: PaymentEntry) => void;
}

interface ListState {
  entries: PaymentEntry[];
  isLoading: boolean;
  searchQuery: string;
  filters: {
    company?: string;
    paymentType?: PaymentType;
    partyType?: PartyType;
    fromDate?: string;
    toDate?: string;
    docstatus?: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
  };
  selectedEntries: Set<string>;
}

export function PaymentEntryList({ onCreateNew, onEdit, onView }: PaymentEntryListProps) {
  const [state, setState] = useState<ListState>({
    entries: [],
    isLoading: true,
    searchQuery: '',
    filters: {},
    pagination: {
      page: 1,
      pageSize: 20,
      totalCount: 0,
    },
    selectedEntries: new Set(),
  });

  const { showError, showSuccess } = useNotifications();

  // Load payment entries
  const loadEntries = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const filters: Record<string, unknown> = {};
      
      if (state.filters.company) {
        filters.company = state.filters.company;
      }
      if (state.filters.paymentType) {
        filters.payment_type = state.filters.paymentType;
      }
      if (state.filters.partyType) {
        filters.party_type = state.filters.partyType;
      }
      if (state.filters.docstatus !== undefined) {
        filters.docstatus = state.filters.docstatus;
      }
      if (state.filters.fromDate) {
        filters.posting_date = ['>=', state.filters.fromDate];
      }
      if (state.filters.toDate) {
        if (filters.posting_date) {
          filters.posting_date = [
            ['>=', state.filters.fromDate],
            ['<=', state.filters.toDate]
          ];
        } else {
          filters.posting_date = ['<=', state.filters.toDate];
        }
      }

      // Add search filter
      if (state.searchQuery.trim()) {
        filters.party = ['like', `%${state.searchQuery}%`];
      }

      const response = await apiClient.getList<PaymentEntry>('Payment Entry', {
        fields: [
          'name', 'payment_type', 'party_type', 'party', 'party_name',
          'posting_date', 'company', 'mode_of_payment', 'paid_amount',
          'received_amount', 'reference_no', 'reference_date', 'docstatus',
          'total_allocated_amount', 'unallocated_amount'
        ],
        filters,
        order_by: 'posting_date desc, creation desc',
        limit_start: (state.pagination.page - 1) * state.pagination.pageSize,
        limit_page_length: state.pagination.pageSize,
      });

      setState(prev => ({
        ...prev,
        entries: response.data,
        pagination: {
          ...prev.pagination,
          totalCount: response.total_count || response.data.length,
        },
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to load payment entries:', error);
      showError('Failed to load payment entries');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.filters, state.searchQuery, state.pagination.page, state.pagination.pageSize, showError]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
      pagination: { ...prev.pagination, page: 1 },
    }));
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((filterKey: string, value: unknown) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [filterKey]: value },
      pagination: { ...prev.pagination, page: 1 },
    }));
  }, []);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page },
    }));
  }, []);

  // Handle selection
  const handleSelectEntry = useCallback((entryName: string, selected: boolean) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedEntries);
      if (selected) {
        newSelected.add(entryName);
      } else {
        newSelected.delete(entryName);
      }
      return { ...prev, selectedEntries: newSelected };
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    setState(prev => ({
      ...prev,
      selectedEntries: selected ? new Set(prev.entries.map(e => e.name!)) : new Set(),
    }));
  }, []);

  // Handle actions
  const handleDuplicate = useCallback(async (entry: PaymentEntry) => {
    try {
      const duplicatedEntry = {
        ...entry,
        name: undefined,
        posting_date: new Date().toISOString().split('T')[0],
        docstatus: 0,
        reference_no: '',
        reference_date: '',
      };
      
      const savedEntry = await apiClient.saveDoc<PaymentEntry>('Payment Entry', duplicatedEntry);
      showSuccess('Payment Entry duplicated successfully');
      onEdit(savedEntry);
    } catch (error) {
      console.error('Failed to duplicate payment entry:', error);
      showError('Failed to duplicate payment entry');
    }
  }, [showSuccess, showError, onEdit]);

  const handleDelete = useCallback(async (entry: PaymentEntry) => {
    if (!confirm(`Are you sure you want to delete payment entry "${entry.name}"?`)) {
      return;
    }

    try {
      await apiClient.deleteDoc('Payment Entry', entry.name!);
      showSuccess('Payment Entry deleted successfully');
      loadEntries();
    } catch (error) {
      console.error('Failed to delete payment entry:', error);
      showError('Failed to delete payment entry');
    }
  }, [showSuccess, showError, loadEntries]);

  const handleSubmit = useCallback(async (entry: PaymentEntry) => {
    try {
      await apiClient.submitDoc('Payment Entry', entry.name!);
      showSuccess('Payment Entry submitted successfully');
      loadEntries();
    } catch (error) {
      console.error('Failed to submit payment entry:', error);
      showError('Failed to submit payment entry');
    }
  }, [showSuccess, showError, loadEntries]);

  // Get status badge
  const getStatusBadge = (docstatus: number) => {
    switch (docstatus) {
      case 0:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Draft</span>;
      case 1:
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Submitted</span>;
      case 2:
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Cancelled</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Unknown</span>;
    }
  };

  // Get payment type badge
  const getPaymentTypeBadge = (paymentType: PaymentType) => {
    const colors = {
      'Receive': 'bg-green-100 text-green-800',
      'Pay': 'bg-red-100 text-red-800',
      'Internal Transfer': 'bg-blue-100 text-blue-800',
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[paymentType]}`}>
        {paymentType}
      </span>
    );
  };

  const totalPages = Math.ceil(state.pagination.totalCount / state.pagination.pageSize);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Payment Entries</h2>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            New Payment Entry
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by party name..."
              value={state.searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={state.filters.paymentType ?? ''}
            onChange={(e) => handleFilterChange('paymentType', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Payment Types</option>
            <option value="Receive">Receive</option>
            <option value="Pay">Pay</option>
            <option value="Internal Transfer">Internal Transfer</option>
          </select>

          <select
            value={state.filters.docstatus ?? ''}
            onChange={(e) => handleFilterChange('docstatus', e.target.value ? parseInt(e.target.value) : undefined)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="0">Draft</option>
            <option value="1">Submitted</option>
            <option value="2">Cancelled</option>
          </select>

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

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {state.isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : state.entries.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            {state.searchQuery ? 'No payment entries found matching your search' : 'No payment entries found'}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={state.selectedEntries.size === state.entries.length && state.entries.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Party
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.entries.map((entry) => (
                <tr key={entry.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={state.selectedEntries.has(entry.name!)}
                      onChange={(e) => handleSelectEntry(entry.name!, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <BanknotesIcon className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{entry.name}</div>
                        {entry.reference_no && (
                          <div className="text-sm text-gray-500">Ref: {entry.reference_no}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(entry.posting_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPaymentTypeBadge(entry.payment_type)}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {entry.party_name || entry.party}
                      </div>
                      <div className="text-sm text-gray-500">{entry.party_type}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(entry.paid_amount)}
                      </div>
                      {entry.unallocated_amount > 0 && (
                        <div className="text-sm text-orange-600">
                          Unallocated: {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(entry.unallocated_amount)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.mode_of_payment}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(entry.docstatus)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onView(entry)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      {entry.docstatus === 0 && (
                        <>
                          <button
                            onClick={() => onEdit(entry)}
                            className="text-green-600 hover:text-green-900"
                            title="Edit"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSubmit(entry)}
                            className="text-purple-600 hover:text-purple-900 text-xs"
                            title="Submit"
                          >
                            Submit
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDuplicate(entry)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Duplicate"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      </button>
                      {entry.docstatus === 0 && (
                        <button
                          onClick={() => handleDelete(entry)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((state.pagination.page - 1) * state.pagination.pageSize) + 1} to{' '}
            {Math.min(state.pagination.page * state.pagination.pageSize, state.pagination.totalCount)} of{' '}
            {state.pagination.totalCount} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(state.pagination.page - 1)}
              disabled={state.pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {state.pagination.page} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(state.pagination.page + 1)}
              disabled={state.pagination.page === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}