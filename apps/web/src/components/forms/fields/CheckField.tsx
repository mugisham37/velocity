'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { DocField } from '@/types';
import { cn } from '@/lib/utils';

interface CheckFieldProps {
  field: DocField;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
}

export function CheckField({ field, error, required, readOnly }: CheckFieldProps) {
  const { register } = useFormContext();

  return (
    <div className="space-y-1">
      <div className="flex items-center space-x-3">
        <input
          id={field.fieldname}
          type="checkbox"
          {...register(field.fieldname)}
          disabled={readOnly}
          className={cn(
            'h-4 w-4 rounded border-gray-300 text-blue-600',
            'focus:ring-blue-500 focus:ring-2',
            'disabled:bg-gray-50 disabled:text-gray-500',
            readOnly && 'cursor-not-allowed',
            error && 'border-red-300 focus:ring-red-500'
          )}
        />
        <label
          htmlFor={field.fieldname}
          className={cn(
            'text-sm font-medium text-gray-700',
            readOnly && 'text-gray-500 cursor-not-allowed',
            required && 'after:content-["*"] after:text-red-500 after:ml-1'
          )}
        >
          {field.label}
        </label>
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {field.options && (
        <p className="text-xs text-gray-500 ml-7">{field.options}</p>
      )}
    </div>
  );
}