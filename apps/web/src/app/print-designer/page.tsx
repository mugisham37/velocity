'use client';

import React from 'react';
import { PrintManager } from '@/components/print';

export default function PrintDesignerPage() {
  const mockDocumentData = {
    name: 'SINV-2024-00001',
    title: 'Sales Invoice',
    customer: 'ABC Corporation',
    posting_date: '2024-01-15',
    due_date: '2024-02-15',
    grand_total: 15750.00,
    status: 'Paid',
    creation: new Date('2024-01-15T10:30:00'),
    modified: new Date('2024-01-16T14:20:00'),
    owner: 'Administrator',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PrintManager
        doctype="Sales Invoice"
        documentData={mockDocumentData}
        mode="list"
      />
    </div>
  );
}