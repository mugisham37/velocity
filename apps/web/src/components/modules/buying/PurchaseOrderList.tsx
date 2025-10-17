'use client';

import React from 'react';
import { PurchaseOrder } from '@/types/buying';
import { useDocumentList } from '@/hooks/useDocuments';

interface PurchaseOrderListProps {
  onEdit?: (order: PurchaseOrder) => void;
  onView?: (order: PurchaseOrder) => void;
}

export default function PurchaseOrderList({ onEdit, onView }: PurchaseOrderListProps) {
  const { data: orders, isLoading } = useDocumentList('Purchase Order');

  if (isLoading) {
    return <div>Loading purchase orders...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Purchase Orders</h2>
      <div className="grid gap-4">
        {orders.map((order) => (
          <div key={order.name} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{order.name}</h3>
                <p className="text-sm text-gray-600">Supplier: {(order as any).supplier_name}</p>
                <p className="text-sm text-gray-600">Date: {(order as any).transaction_date}</p>
              </div>
              <div className="flex space-x-2">
                {onView && (
                  <button
                    onClick={() => onView(order as PurchaseOrder)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded"
                  >
                    View
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => onEdit(order as PurchaseOrder)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}