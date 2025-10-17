'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { RequestForQuotation } from '@/types/buying';

interface RequestForQuotationFormProps {
  rfq?: RequestForQuotation;
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

export default function RequestForQuotationForm({ rfq, onSubmit, onCancel, readOnly = false }: RequestForQuotationFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: rfq || {}
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">
          {rfq ? 'Edit Request for Quotation' : 'New Request for Quotation'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Date
            </label>
            <input
              {...register('transaction_date')}
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              readOnly={readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company
            </label>
            <input
              {...register('company')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              readOnly={readOnly}
            />
          </div>
        </div>

        {!readOnly && (
          <div className="flex justify-end space-x-3 mt-6">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {rfq ? 'Update' : 'Create'} RFQ
            </button>
          </div>
        )}
      </div>
    </form>
  );
}