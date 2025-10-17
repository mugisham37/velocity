'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ListView } from '@/components/lists/ListView';
import { ListFilters } from '@/components/lists/ListFilters';
import { useListView } from '@/hooks/useListView';
import { MaterialRequest } from '@/types/stock';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function MaterialRequestListPage() {
  const router = useRouter();
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

  const {
    data: requests,
    isLoading,
    error,
    pagination,
    filters,
    sorting,
    updateFilters,
    updateSorting,
    updatePagination,
    refetch,
  } = useListView<MaterialRequest>({
    doctype: 'Material Request',
    fields: [
      'name',
      'naming_series',
      'material_request_type',
      'company',
      'transaction_date',
      'schedule_date',
      'status',
      'per_ordered',
      'per_received',
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
      fieldname: 'material_request_type',
      label: 'Type',
      fieldtype: 'Data',
      width: 120,
    },
    {
      fieldname: 'transaction_date',
      label: 'Date',
      fieldtype: 'Date',
      width: 100,
    },
    {
      fieldname: 'schedule_date',
      label: 'Required By',
      fieldtype: 'Date',
      width: 100,
    },
    {
      fieldname: 'company',
      label: 'Company',
      fieldtype: 'Link',
      width: 150,
    },
    {
      fieldname: 'status',
      label: 'Status',
      fieldtype: 'Data',
      width: 120,
    },
    {
      fieldname: 'per_ordered',
      label: '% Ordered',
      fieldtype: 'Percent',
      width: 100,
    },
    {
      fieldname: 'per_received',
      label: '% Received',
      fieldtype: 'Percent',
      width: 100,
    },
    {
      fieldname: 'docstatus',
      label: 'Doc Status',
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
      fieldname: 'material_request_type',
      label: 'Material Request Type',
      fieldtype: 'Select',
      options: '\nPurchase\nMaterial Transfer\nMaterial Issue\nManufacture\nCustomer Provided',
    },
    {
      fieldname: 'company',
      label: 'Company',
      fieldtype: 'Link',
      options: 'Company',
    },
    {
      fieldname: 'status',
      label: 'Status',
      fieldtype: 'Select',
      options: '\nDraft\nSubmitted\nStopped\nCancelled\nPending\nPartially Ordered\nOrdered\nIssued\nTransferred\nReceived',
    },
    {
      fieldname: 'transaction_date',
      label: 'Transaction Date',
      fieldtype: 'DateRange',
    },
    {
      fieldname: 'schedule_date',
      label: 'Required By',
      fieldtype: 'DateRange',
    },
    {
      fieldname: 'docstatus',
      label: 'Document Status',
      fieldtype: 'Select',
      options: '\nDraft\nSubmitted\nCancelled',
    },
  ];

  const handleRowClick = (request: MaterialRequest) => {
    router.push(`/stock/material-request/${request.name}`);
  };

  const handleNewRequest = () => {
    router.push('/stock/material-request/new');
  };

  const handleBulkAction = (action: string, selectedIds: string[]) => {
    console.log(`Bulk action: ${action}`, selectedIds);
    // Implement bulk actions like submit, cancel, delete, etc.
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Submitted': 'bg-blue-100 text-blue-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Partially Ordered': 'bg-orange-100 text-orange-800',
      'Ordered': 'bg-green-100 text-green-800',
      'Issued': 'bg-purple-100 text-purple-800',
      'Transferred': 'bg-indigo-100 text-indigo-800',
      'Received': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Stopped': 'bg-red-100 text-red-800',
    };

    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {status}
      </span>
    );
  };

  const getDocStatusBadge = (docstatus: number) => {
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
          <h2 className="text-lg font-medium text-gray-900">Error loading material requests</h2>
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
                <h1 className="text-3xl font-bold text-gray-900">Material Requests</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Manage material requests for purchase, transfer, and manufacturing
                </p>
              </div>
              <button
                onClick={handleNewRequest}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Material Request
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
            data={requests}
            columns={columns}
            isLoading={isLoading}
            pagination={pagination}
            sorting={sorting}
            selection={selectedRequests}
            onRowClick={handleRowClick}
            onSelectionChange={setSelectedRequests}
            onSortChange={updateSorting}
            onPageChange={updatePagination}
            bulkActions={[
              { label: 'Submit', action: 'submit' },
              { label: 'Stop', action: 'stop', variant: 'warning' },
              { label: 'Cancel', action: 'cancel', variant: 'danger' },
              { label: 'Delete', action: 'delete', variant: 'danger' },
            ]}
            onBulkAction={handleBulkAction}
            customRenderers={{
              status: (value: string) => getStatusBadge(value),
              docstatus: (value: number) => getDocStatusBadge(value),
              per_ordered: (value: number) => `${value.toFixed(1)}%`,
              per_received: (value: number) => `${value.toFixed(1)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}