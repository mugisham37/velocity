'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Supplier, SupplierFormData } from '@/types/buying';

interface SupplierFormProps {
  supplier?: Supplier;
  onSubmit: (data: SupplierFormData) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

export default function SupplierForm({ supplier, onSubmit, onCancel, readOnly = false }: SupplierFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<SupplierFormData>({
    defaultValues: supplier || {}
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">
          {supplier ? 'Edit Supplier' : 'New Supplier'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier Name *
            </label>
            <input
              {...register('supplier_name', { required: 'Supplier name is required' })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              readOnly={readOnly}
            />
            {errors.supplier_name && (
              <p className="mt-1 text-sm text-red-600">{errors.supplier_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier Type
            </label>
            <select
              {...register('supplier_type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={readOnly}
            >
              <option value="">Select Type</option>
              <option value="Company">Company</option>
              <option value="Individual">Individual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              {...register('email_id')}
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              readOnly={readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mobile No
            </label>
            <input
              {...register('mobile_no')}
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
              {supplier ? 'Update' : 'Create'} Supplier
            </button>
          </div>
        )}
      </div>
    </form>
  );
}