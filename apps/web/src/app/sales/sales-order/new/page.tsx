'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SalesOrderForm } from '@/components/modules/sales';
import { useNotifications } from '@/hooks/useNotifications';
import { useDocuments } from '@/hooks/useDocuments';

export default function NewSalesOrderPage() {
  const router = useRouter();
  const { showNotification } = useNotifications();
  const { createDocument, submitDocument } = useDocuments();

  const handleSave = async (data: any) => {
    try {
      const result = await createDocument('Sales Order', data);
      showNotification('Sales Order saved successfully', 'success');
      router.push(`/sales/sales-order/${result.name}`);
    } catch (error) {
      console.error('Failed to save sales order:', error);
      showNotification('Failed to save sales order', 'error');
      throw error;
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const result = await createDocument('Sales Order', data);
      await submitDocument('Sales Order', result.name);
      showNotification('Sales Order submitted successfully', 'success');
      router.push(`/sales/sales-order/${result.name}`);
    } catch (error) {
      console.error('Failed to submit sales order:', error);
      showNotification('Failed to submit sales order', 'error');
      throw error;
    }
  };

  const handleCancel = () => {
    router.push('/sales/sales-order');
  };

  return (
    <div className="new-sales-order-page">
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <button
                onClick={() => router.push('/sales')}
                className="text-gray-400 hover:text-gray-500"
              >
                Sales
              </button>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <button
                  onClick={() => router.push('/sales/sales-order')}
                  className="ml-4 text-gray-400 hover:text-gray-500"
                >
                  Sales Orders
                </button>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-4 text-sm font-medium text-gray-500">New</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="bg-white shadow rounded-lg">
        <SalesOrderForm
          mode="create"
          onSave={handleSave}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}