'use client';

import React from 'react';
import { Customer } from '@/types/sales';
import { useDocumentList } from '@/hooks/useDocuments';

interface CustomerListProps {
  onEdit?: (customer: Customer) => void;
  onView?: (customer: Customer) => void;
}

export default function CustomerList({ onEdit, onView }: CustomerListProps) {
  const { data: customers, isLoading } = useDocumentList('Customer');

  if (isLoading) {
    return <div>Loading customers...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Customers</h2>
      <div className="grid gap-4">
        {customers.map((customer) => (
          <div key={customer.name} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{(customer as any).customer_name}</h3>
                <p className="text-sm text-gray-600">Type: {(customer as any).customer_type}</p>
                <p className="text-sm text-gray-600">Email: {(customer as any).email_id}</p>
              </div>
              <div className="flex space-x-2">
                {onView && (
                  <button
                    onClick={() => onView(customer as Customer)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded"
                  >
                    View
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => onEdit(customer as Customer)}
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