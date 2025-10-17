'use client';

import React, { useState, useEffect } from 'react';
import { SalesOrder } from '@/types/sales';
import { ListView, ListFilters, ListPagination } from '@/components/lists';
import { useListView } from '@/hooks/useListView';
import { useNotifications } from '@/hooks/useNotifications';

interface SalesOrderListProps {
  onEdit?: (salesOrder: SalesOrder) => void;
  onView?: (salesOrder: SalesOrder) => void;
  onDelete?: (salesOrder: SalesOrder) => void;
  filters?: Record<string, any>;
}

export default function SalesOrderList({
  onEdit,
  onView,
  onDelete,
  filters: externalFilters = {}
}: SalesOrderListProps) {
  const { showNotification } = useNotifications();
  
  const {
    data,
    loading,
    error,
    pagination,
    filters,
    sorting,
    selection,
    refresh,
    updateFilters,
    updateSorting,
    updatePagination,
    updateSelection,
  } = useListView<SalesOrder>({
    doctype: 'Sales Order',
    fields: [
      'name',
      'customer',
      'customer_name',
      'transaction_date',
      'delivery_date',
      'grand_total',
      'currency',
      'status',
      'docstatus',
      'per_delivered',
      'per_billed',
      'order_type',
      'company',
      'sales_partner',
      'territory'
    ],
    initialFilters: externalFilters,
    initialSorting: [{ field: 'transaction_date', direction: 'desc' }],
    pageSize: 20,
  });

  const columns = [
    {
      fieldname: 'name',
      fieldtype: 'Link',
      label: 'ID',
      sortable: true,
      width: 120,
      render: (value: string, record: SalesOrder) => (
        <button
          onClick={() => onView?.(record)}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          {value}
        </button>
      ),
    },
    {
      fieldname: 'customer_name',
      fieldtype: 'Data',
      label: 'Customer',
      sortable: true,
      width: 200,
    },
    {
      fieldname: 'transaction_date',
      fieldtype: 'Date',
      label: 'Date',
      sortable: true,
      width: 120,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      fieldname: 'delivery_date',
      fieldtype: 'Date',
      label: 'Delivery Date',
      sortable: true,
      width: 120,
      render: (value: string) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      fieldname: 'grand_total',
      fieldtype: 'Currency',
      label: 'Grand Total',
      sortable: true,
      width: 120,
      align: 'right' as const,
      render: (value: number, record: SalesOrder) => 
        `${record.currency} ${value?.toLocaleString() || '0.00'}`,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '150px',
      render: (value: string, record: SalesOrder) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(value, record.docstatus)}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'per_delivered',
      label: '% Delivered',
      sortable: true,
      width: '100px',
      align: 'center' as const,
      render: (value: number) => (
        <div className="flex items-center">
          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${value || 0}%` }}
            ></div>
          </div>
          <span className="text-xs">{value || 0}%</span>
        </div>
      ),
    },
    {
      key: 'per_billed',
      label: '% Billed',
      sortable: true,
      width: '100px',
      align: 'center' as const,
      render: (value: number) => (
        <div className="flex items-center">
          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
            <div 
              className="bg-green-600 h-2 rounded-full" 
              style={{ width: `${value || 0}%` }}
            ></div>
          </div>
          <span className="text-xs">{value || 0}%</span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      render: (value: any, record: SalesOrder) => (
        <div className="flex space-x-2">
          <button
            onClick={() => onView?.(record)}
            className="text-blue-600 hover:text-blue-800 text-sm"
            title="View"
          >
            View
          </button>
          {record.docstatus === 0 && (
            <button
              onClick={() => onEdit?.(record)}
              className="text-green-600 hover:text-green-800 text-sm"
              title="Edit"
            >
              Edit
            </button>
          )}
          {record.docstatus === 0 && (
            <button
              onClick={() => onDelete?.(record)}
              className="text-red-600 hover:text-red-800 text-sm"
              title="Delete"
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  const filterFields = [
    {
      fieldname: 'customer',
      fieldtype: 'Link',
      label: 'Customer',
      options: 'Customer',
    },
    {
      fieldname: 'status',
      fieldtype: 'Select',
      label: 'Status',
      options: 'Draft\nTo Deliver and Bill\nTo Bill\nTo Deliver\nCompleted\nCancelled\nClosed',
    },
    {
      fieldname: 'order_type',
      fieldtype: 'Select',
      label: 'Order Type',
      options: 'Sales\nMaintenance\nShopping Cart',
    },
    {
      fieldname: 'company',
      fieldtype: 'Link',
      label: 'Company',
      options: 'Company',
    },
    {
      fieldname: 'transaction_date',
      fieldtype: 'Date',
      label: 'Date Range',
    },
    {
      fieldname: 'grand_total',
      fieldtype: 'Currency',
      label: 'Amount Range',
    },
    {
      key: 'sales_partner',
      label: 'Sales Partner',
      type: 'link' as const,
      doctype: 'Sales Partner',
    },
    {
      key: 'territory',
      label: 'Territory',
      type: 'link' as const,
      doctype: 'Territory',
    },
  ];

  const bulkActions = [
    {
      key: 'submit',
      label: 'Submit',
      action: async (selectedIds: string[]) => {
        try {
          // Implement bulk submit logic
          showNotification(`${selectedIds.length} sales orders submitted`, 'success');
          refresh();
        } catch (error) {
          showNotification('Failed to submit sales orders', 'error');
        }
      },
      condition: (records: SalesOrder[]) => records.every(r => r.docstatus === 0),
    },
    {
      key: 'cancel',
      label: 'Cancel',
      action: async (selectedIds: string[]) => {
        try {
          // Implement bulk cancel logic
          showNotification(`${selectedIds.length} sales orders cancelled`, 'success');
          refresh();
        } catch (error) {
          showNotification('Failed to cancel sales orders', 'error');
        }
      },
      condition: (records: SalesOrder[]) => records.every(r => r.docstatus === 1),
      variant: 'danger' as const,
    },
    {
      key: 'delete',
      label: 'Delete',
      action: async (selectedIds: string[]) => {
        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} sales orders?`)) {
          try {
            // Implement bulk delete logic
            showNotification(`${selectedIds.length} sales orders deleted`, 'success');
            refresh();
          } catch (error) {
            showNotification('Failed to delete sales orders', 'error');
          }
        }
      },
      condition: (records: SalesOrder[]) => records.every(r => r.docstatus === 0),
      variant: 'danger' as const,
    },
  ];

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-800">Error loading sales orders: {error.message}</p>
        <button
          onClick={refresh}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="sales-order-list">
      <div className="mb-6">
        <ListFilters
          fields={filterFields}
          filters={filters}
          onFiltersChange={updateFilters}
        />
      </div>

      <ListView
        data={data}
        columns={columns}
        loading={loading}
        selection={selection}
        onSelectionChange={updateSelection}
        sorting={sorting}
        onSortingChange={updateSorting}
        bulkActions={bulkActions}
        emptyMessage="No sales orders found"
        emptyDescription="Create your first sales order to get started"
      />

      <div className="mt-6">
        <ListPagination
          pagination={pagination}
          onPageChange={(page) => updatePagination({ page })}
          onPageSizeChange={(pageSize) => updatePagination({ pageSize })}
        />
      </div>
    </div>
  );
}

function getStatusColor(status: string, docstatus: number): string {
  if (docstatus === 0) {
    return 'bg-gray-100 text-gray-800'; // Draft
  }
  
  if (docstatus === 2) {
    return 'bg-red-100 text-red-800'; // Cancelled
  }

  // Submitted statuses
  switch (status) {
    case 'To Deliver and Bill':
      return 'bg-yellow-100 text-yellow-800';
    case 'To Bill':
      return 'bg-blue-100 text-blue-800';
    case 'To Deliver':
      return 'bg-orange-100 text-orange-800';
    case 'Completed':
      return 'bg-green-100 text-green-800';
    case 'Closed':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}