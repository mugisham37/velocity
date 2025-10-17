'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ListView } from '@/components/lists/ListView';
import { ListFilters } from '@/components/lists/ListFilters';
import { useListView } from '@/hooks/useListView';
import { DocumentListItem } from '@/types';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function ItemListPage() {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const {
    data: items,
    isLoading,
    error,
    pagination,
    filters,
    sorting,
    updateFilters,
    updateSorting,
    updatePagination,
    refetch,
  } = useListView({
    doctype: 'Item',
    fields: [
      'name',
      'item_code',
      'item_name',
      'item_group',
      'brand',
      'uom',
      'standard_rate',
      'is_stock_item',
      'disabled',
      'creation',
      'modified',
    ],
    initialPageSize: 20,
  });

  const columns = [
    {
      fieldname: 'item_code',
      label: 'Item Code',
      fieldtype: 'Link',
      width: 150,
    },
    {
      fieldname: 'item_name',
      label: 'Item Name',
      fieldtype: 'Data',
      width: 200,
    },
    {
      fieldname: 'item_group',
      label: 'Item Group',
      fieldtype: 'Link',
      width: 150,
    },
    {
      fieldname: 'brand',
      label: 'Brand',
      fieldtype: 'Link',
      width: 120,
    },
    {
      fieldname: 'uom',
      label: 'UOM',
      fieldtype: 'Link',
      width: 80,
    },
    {
      fieldname: 'standard_rate',
      label: 'Rate',
      fieldtype: 'Currency',
      width: 100,
    },
    {
      fieldname: 'is_stock_item',
      label: 'Stock Item',
      fieldtype: 'Check',
      width: 100,
    },
    {
      fieldname: 'disabled',
      label: 'Disabled',
      fieldtype: 'Check',
      width: 80,
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
      fieldname: 'item_code',
      label: 'Item Code',
      fieldtype: 'Data' as const,
    },
    {
      fieldname: 'item_name',
      label: 'Item Name',
      fieldtype: 'Data' as const,
    },
    {
      fieldname: 'item_group',
      label: 'Item Group',
      fieldtype: 'Link' as const,
      options: 'Item Group',
    },
    {
      fieldname: 'brand',
      label: 'Brand',
      fieldtype: 'Link' as const,
      options: 'Brand',
    },
    {
      fieldname: 'is_stock_item',
      label: 'Is Stock Item',
      fieldtype: 'Select' as const,
      options: '\nYes\nNo',
    },
    {
      fieldname: 'disabled',
      label: 'Disabled',
      fieldtype: 'Select' as const,
      options: '\nYes\nNo',
    },
  ];

  const handleRowClick = (doc: DocumentListItem) => {
    router.push(`/stock/item/${doc.name}`);
  };

  const handleNewItem = () => {
    router.push('/stock/item/new');
  };

  const handleBulkAction = (action: string, selectedIds: string[]) => {
    console.log(`Bulk action: ${action}`, selectedIds);
    // Implement bulk actions like enable/disable, delete, etc.
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900">Error loading items</h2>
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
                <h1 className="text-3xl font-bold text-gray-900">Items</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Manage your inventory items and their properties
                </p>
              </div>
              <button
                onClick={handleNewItem}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Item
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
            doctype="Item"
            data={items}
            columns={columns}
            totalCount={items.length}
            isLoading={isLoading}
            selection={selectedItems}
            onRowClick={handleRowClick}
            onSelect={setSelectedItems}
            onBulkAction={handleBulkAction}
          />
        </div>
      </div>
    </div>
  );
}