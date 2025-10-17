'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { SupplierQuotation } from '@/types/buying';

interface SupplierQuotationFormProps {
  quotation?: SupplierQuotation;
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

export default function SupplierQuotationForm({ quotation, onSubmit, onCancel, readOnly = false }: SupplierQuotationFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: quotation || {}
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">
          {quotation ? 'Edit Supplier Quotation' : 'New Supplier Quotation'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier *
            </label>
            <input
              {...register('supplier', { required: 'Supplier is required' })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              readOnly={readOnly}
            />
            {errors.supplier && (
              <p className="mt-1 text-sm text-red-600">{String(errors.supplier.message)}</p>
            )}
          </div>

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
              {quotation ? 'Update' : 'Create'} Quotation
            </button>
          </div>
        )}
      </div>
    </form>
  );
}