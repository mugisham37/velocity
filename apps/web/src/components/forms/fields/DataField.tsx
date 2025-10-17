'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { DocField } from '@/types';
import { cn } from '@/lib/utils';

interface DataFieldProps {
  field: DocField;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
}

export function DataField({ field, error, required, readOnly }: DataFieldProps) {
  const { register } = useFormContext();

  return (
    <div className="space-y-1">
      <label
        htmlFor={field.fieldname}
        className={cn(
          'block text-sm font-medium text-gray-700',
          required && 'after:content-["*"] after:text-red-500 after:ml-1'
        )}
      >
        {field.label}
      </label>
      <input
        id={field.fieldname}
        type="text"
        {...register(field.fieldname)}
        placeholder={field.default as string}
        readOnly={readOnly}
        className={cn(
          'block w-full rounded-md border-gray-300 shadow-sm',
          'focus:border-blue-500 focus:ring-blue-500',
          'disabled:bg-gray-50 disabled:text-gray-500',
          readOnly && 'bg-gray-50 text-gray-500 cursor-not-allowed',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
          'text-sm px-3 py-2 border'
        )}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {field.options && (
        <p className="text-xs text-gray-500">{field.options}</p>
      )}
    </div>
  );
}