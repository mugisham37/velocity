'use client';

import React from 'react';
import { SupplierQuotation } from '@/types/buying';
import { useDocumentList } from '@/hooks/useDocuments';

interface SupplierQuotationListProps {
  onEdit?: (quotation: SupplierQuotation) => void;
  onView?: (quotation: SupplierQuotation) => void;
}

export default function SupplierQuotationList({ onEdit, onView }: SupplierQuotationListProps) {
  const { data: quotations, isLoading } = useDocumentList('Supplier Quotation');

  if (isLoading) {
    return <div>Loading supplier quotations...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Supplier Quotations</h2>
      <div className="grid gap-4">
        {quotations.map((quotation) => (
          <div key={quotation.name} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{quotation.name}</h3>
                <p className="text-sm text-gray-600">Supplier: {(quotation as any).supplier_name}</p>
                <p className="text-sm text-gray-600">Date: {(quotation as any).transaction_date}</p>
              </div>
              <div className="flex space-x-2">
                {onView && (
                  <button
                    onClick={() => onView(quotation as SupplierQuotation)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded"
                  >
                    View
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => onEdit(quotation as SupplierQuotation)}
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