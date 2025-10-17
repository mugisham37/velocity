'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ListView } from '@/components/lists/ListView';
import { ListFilters } from '@/components/lists/ListFilters';
import { useListView } from '@/hooks/useListView';
import { StockEntry } from '@/types/stock';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function StockEntryListPage() {
  const router = useRouter();
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);

  const {
    data: entries,
    isLoading,
    error,
    pagination,
    filters,
    sorting,
    updateFilters,
    updateSorting,
    updatePagination,
    refetch,
  } = useListView<StockEntry>({
    doctype: 'Stock Entry',
    fields: [
      'name',
      'naming_series',
      'purpose',
      'stock_entry_type',
      'company',
      'posting_date',
      'from_warehouse',
      'to_warehouse',
      'total_outgoing_value',
      'total_incoming_value',
      'docstatus',
      'creation',
      'modified',
    ],
    pageSize: 20,
  });

  const columns = [
    {
      fieldname: 'name',
      label: 'ID',
      fieldtype: 'Link',
      width: 120,
    },
    {
      fieldname: 'purpose',
      label: 'Purpose',
      fieldtype: 'Data',
      width: 150,
    },
    {
      fieldname: 'stock_entry_type',
      label: 'Type',
      fieldtype: 'Data',
      width: 120,
    },
    {
      fieldname: 'posting_date',
      label: 'Date',
      fieldtype: 'Date',
      width: 100,
    },
    {
      fieldname: 'from_warehouse',
      label: 'From Warehouse',
      fieldtype: 'Link',
      width: 150,
    },
    {
      fieldname: 'to_warehouse',
      label: 'To Warehouse',
      fieldtype: 'Link',
      width: 150,
    },
    {
      fieldname: 'total_outgoing_value',
      label: 'Outgoing Value',
      fieldtype: 'Currency',
      width: 120,
    },
    {
      fieldname: 'total_incoming_value',
      label: 'Incoming Value',
      fieldtype: 'Currency',
      width: 120,
    },
    {
      fieldname: 'docstatus',
      label: 'Status',
      fieldtype: 'Select',
      width: 100,
    },
    {
      fieldname: 'modified',
      label: 'Last Modified',
      fieldtype: 'Datetime',
      width: 150,
    },
  ];

  const filterFields = [
    {
      fieldname: 'purpose',
      label: 'Purpose',
      fieldtype: 'Select',
      options: '\nMaterial Issue\nMaterial Receipt\nMaterial Transfer\nMaterial Transfer for Manufacture\nMaterial Consumption for Manufacture\nManufacture\nRepack\nSend to Subcontractor',
    },
    {
      fieldname: 'stock_entry_type',
      label: 'Stock Entry Type',
      fieldtype: 'Link',
      options: 'Stock Entry Type',
    },
    {
      fieldname: 'company',
      label: 'Company',
      fieldtype: 'Link',
      options: 'Company',
    },
    {
      fieldname: 'from_warehouse',
      label: 'From Warehouse',
      fieldtype: 'Link',
      options: 'Warehouse',
    },
    {
      fieldname: 'to_warehouse',
      label: 'To Warehouse',
      fieldtype: 'Link',
      options: 'Warehouse',
    },
    {
      fieldname: 'posting_date',
      label: 'Posting Date',
      fieldtype: 'DateRange',
    },
    {
      fieldname: 'docstatus',
      label: 'Status',
      fieldtype: 'Select',
      options: '\nDraft\nSubmitted\nCancelled',
    },
  ];

  const handleRowClick = (entry: StockEntry) => {
    router.push(`/stock/stock-entry/${entry.name}`);
  };

  const handleNewEntry = () => {
    router.push('/stock/stock-entry/new');
  };

  const handleBulkAction = (action: string, selectedIds: string[]) => {
    console.log(`Bulk action: ${action}`, selectedIds);
    // Implement bulk actions like submit, cancel, delete, etc.
  };

  const getStatusBadge = (docstatus: number) => {
    switch (docstatus) {
      case 0:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Draft</span>;
      case 1:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Submitted</span>;
      case 2:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900">Error loading stock entries</h2>
          <p className="text-sm text-gray-500 mt-1">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Stock Entries</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Manage stock movements and transactions
                </p>
              </div>
              <button
                onClick={handleNewEntry}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Stock Entry
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <ListFilters
            fields={filterFields}
            filters={filters}
            onFiltersChange={updateFilters}
          />
        </div>

        {/* List View */}
        <div className="bg-white rounded-lg shadow">
          <ListView
            data={entries}
            columns={columns}
            isLoading={isLoading}
            pagination={pagination}
            sorting={sorting}
            selection={selectedEntries}
            onRowClick={handleRowClick}
            onSelectionChange={setSelectedEntries}
            onSortChange={updateSorting}
            onPageChange={updatePagination}
            bulkActions={[
              { label: 'Submit', action: 'submit' },
              { label: 'Cancel', action: 'cancel', variant: 'danger' },
              { label: 'Delete', action: 'delete', variant: 'danger' },
            ]}
            onBulkAction={handleBulkAction}
            customRenderers={{
              docstatus: (value: number) => getStatusBadge(value),
            }}
          />
        </div>
      </div>
    </div>
  );
}