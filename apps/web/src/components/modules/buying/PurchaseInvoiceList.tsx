'use client';

import React from 'react';
import { PurchaseInvoice } from '@/types/buying';
import { useDocumentList } from '@/hooks/useDocuments';

interface PurchaseInvoiceListProps {
  onEdit?: (invoice: PurchaseInvoice) => void;
  onView?: (invoice: PurchaseInvoice) => void;
}

export default function PurchaseInvoiceList({ onEdit, onView }: PurchaseInvoiceListProps) {
  const { data: invoices, isLoading } = useDocumentList('Purchase Invoice');

  if (isLoading) {
    return <div>Loading purchase invoices...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Purchase Invoices</h2>
      <div className="grid gap-4">
        {invoices.map((invoice) => (
          <div key={invoice.name} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{invoice.name}</h3>
                <p className="text-sm text-gray-600">Supplier: {(invoice as any).supplier_name}</p>
                <p className="text-sm text-gray-600">Date: {(invoice as any).posting_date}</p>
              </div>
              <div className="flex space-x-2">
                {onView && (
                  <button
                    onClick={() => onView(invoice as PurchaseInvoice)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded"
                  >
                    View
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => onEdit(invoice as PurchaseInvoice)}
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