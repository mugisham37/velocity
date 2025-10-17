'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PurchaseOrder } from '@/types/buying';
import { PlusIcon } from '@heroicons/react/24/outline';

// Note: PurchaseOrderList component would be similar to SalesOrderList
// For now, we'll create a placeholder

export default function PurchaseOrderPage() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreate = () => {
    router.push('/buying/purchase-order/new');
  };

  const handleEdit = (purchaseOrder: PurchaseOrder) => {
    router.push(`/buying/purchase-order/${purchaseOrder.name}/edit`);
  };

  const handleView = (purchaseOrder: PurchaseOrder) => {
    router.push(`/buying/purchase-order/${purchaseOrder.name}`);
  };

  const handleDelete = async (purchaseOrder: PurchaseOrder) => {
    if (window.confirm(`Are you sure you want to delete Purchase Order ${purchaseOrder.name}?`)) {
      try {
        // Implement delete logic here
        console.log('Deleting purchase order:', purchaseOrder.name);
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error('Failed to delete purchase order:', error);
      }
    }
  };

  return (
    <div className="purchase-order-page">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage supplier orders and track delivery status
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Purchase Order
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        {/* PurchaseOrderList component would go here */}
        <div className="p-6 text-center text-gray-500">
          Purchase Order List Component - To be implemented
        </div>
      </div>
    </div>
  );
}