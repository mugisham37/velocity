'use client';

import React from 'react';
import { PurchaseReceipt } from '@/types/buying';
import { useDocumentList } from '@/hooks/useDocuments';

interface PurchaseReceiptListProps {
  onEdit?: (receipt: PurchaseReceipt) => void;
  onView?: (receipt: PurchaseReceipt) => void;
}

export default function PurchaseReceiptList({ onEdit, onView }: PurchaseReceiptListProps) {
  const { data: receipts, isLoading } = useDocumentList('Purchase Receipt');

  if (isLoading) {
    return <div>Loading purchase receipts...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Purchase Receipts</h2>
      <div className="grid gap-4">
        {receipts.map((receipt) => (
          <div key={receipt.name} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{receipt.name}</h3>
                <p className="text-sm text-gray-600">Supplier: {(receipt as any).supplier_name}</p>
                <p className="text-sm text-gray-600">Date: {(receipt as any).posting_date}</p>
              </div>
              <div className="flex space-x-2">
                {onView && (
                  <button
                    onClick={() => onView(receipt as PurchaseReceipt)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded"
                  >
                    View
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => onEdit(receipt as PurchaseReceipt)}
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