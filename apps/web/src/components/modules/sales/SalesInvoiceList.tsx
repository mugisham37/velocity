'use client';

import React from 'react';
import { SalesInvoice } from '@/types/sales';
import { useDocumentList } from '@/hooks/useDocuments';

interface SalesInvoiceListProps {
  onEdit?: (invoice: SalesInvoice) => void;
  onView?: (invoice: SalesInvoice) => void;
}

export default function SalesInvoiceList({ onEdit, onView }: SalesInvoiceListProps) {
  const { data: invoices, isLoading } = useDocumentList('Sales Invoice');

  if (isLoading) {
    return <div>Loading sales invoices...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Sales Invoices</h2>
      <div className="grid gap-4">
        {invoices.map((invoice: any) => (
          <div key={invoice.name as string} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{invoice.name}</h3>
                <p className="text-sm text-gray-600">Customer: {(invoice as any).customer_name}</p>
                <p className="text-sm text-gray-600">Date: {(invoice as any).posting_date}</p>
              </div>
              <div className="flex space-x-2">
                {onView && (
                  <button
                    onClick={() => onView(invoice as SalesInvoice)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded"
                  >
                    View
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => onEdit(invoice as SalesInvoice)}
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