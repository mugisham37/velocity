'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SalesOrder } from '@/types/sales';
import { SalesOrderList } from '@/components/modules/sales';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function SalesOrderPage() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreate = () => {
    router.push('/sales/sales-order/new');
  };

  const handleEdit = (salesOrder: SalesOrder) => {
    router.push(`/sales/sales-order/${salesOrder.name}/edit`);
  };

  const handleView = (salesOrder: SalesOrder) => {
    router.push(`/sales/sales-order/${salesOrder.name}`);
  };

  const handleDelete = async (salesOrder: SalesOrder) => {
    if (window.confirm(`Are you sure you want to delete Sales Order ${salesOrder.name}?`)) {
      try {
        // Implement delete logic here
        console.log('Deleting sales order:', salesOrder.name);
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error('Failed to delete sales order:', error);
      }
    }
  };

  return (
    <div className="sales-order-page">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage customer orders and track delivery status
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Sales Order
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <SalesOrderList
          key={refreshKey}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}