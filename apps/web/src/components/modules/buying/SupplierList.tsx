'use client';

import React from 'react';
import { Supplier } from '@/types/buying';
import { useDocumentList } from '@/hooks/useDocuments';

interface SupplierListProps {
  onEdit?: (supplier: Supplier) => void;
  onView?: (supplier: Supplier) => void;
}

export default function SupplierList({ onEdit, onView }: SupplierListProps) {
  const { data: suppliers, isLoading } = useDocumentList('Supplier');

  if (isLoading) {
    return <div>Loading suppliers...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Suppliers</h2>
      <div className="grid gap-4">
        {suppliers.map((supplier) => (
          <div key={supplier.name} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{(supplier as any).supplier_name}</h3>
                <p className="text-sm text-gray-600">Type: {(supplier as any).supplier_type}</p>
                <p className="text-sm text-gray-600">Email: {(supplier as any).email_id}</p>
              </div>
              <div className="flex space-x-2">
                {onView && (
                  <button
                    onClick={() => onView(supplier as Supplier)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded"
                  >
                    View
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => onEdit(supplier as Supplier)}
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