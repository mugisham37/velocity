'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PurchaseOrderForm } from '@/components/modules/buying';
import { useNotifications } from '@/hooks/useNotifications';
import { useDocuments } from '@/hooks/useDocuments';

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const { showNotification } = useNotifications();
  const { createDocument, submitDocument } = useDocuments();

  const handleSave = async (data: any) => {
    try {
      const result = await createDocument('Purchase Order', data);
      showNotification('Purchase Order saved successfully', 'success');
      router.push(`/buying/purchase-order/${result.name}`);
    } catch (error) {
      console.error('Failed to save purchase order:', error);
      showNotification('Failed to save purchase order', 'error');
      throw error;
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const result = await createDocument('Purchase Order', data);
      await submitDocument('Purchase Order', result.name);
      showNotification('Purchase Order submitted successfully', 'success');
      router.push(`/buying/purchase-order/${result.name}`);
    } catch (error) {
      console.error('Failed to submit purchase order:', error);
      showNotification('Failed to submit purchase order', 'error');
      throw error;
    }
  };

  const handleCancel = () => {
    router.push('/buying/purchase-order');
  };

  return (
    <div className="new-purchase-order-page">
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <button
                onClick={() => router.push('/buying')}
                className="text-gray-400 hover:text-gray-500"
              >
                Buying
              </button>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <button
                  onClick={() => router.push('/buying/purchase-order')}
                  className="ml-4 text-gray-400 hover:text-gray-500"
                >
                  Purchase Orders
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
        <PurchaseOrderForm
          mode="create"
          onSave={handleSave}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}