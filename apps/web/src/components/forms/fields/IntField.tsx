'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { DocField } from '@/types';
import { cn } from '@/lib/utils';

interface IntFieldProps {
  field: DocField;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
}

export function IntField({ field, error, required, readOnly }: IntFieldProps) {
  const { register, setValue, watch } = useFormContext();
  const value = watch(field.fieldname);

  const handleIntChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    
    // Remove any non-numeric characters except minus sign
    const cleanValue = inputValue.replace(/[^0-9-]/g, '');
    
    // Parse as integer
    const numericValue = parseInt(cleanValue, 10);
    
    if (!isNaN(numericValue)) {
      setValue(field.fieldname, numericValue, { shouldDirty: true });
    } else if (cleanValue === '' || cleanValue === '-') {
      setValue(field.fieldname, '', { shouldDirty: true });
    }
  };

  const formatIntDisplay = (value: number | string) => {
    if (value === '' || value === null || value === undefined) return '';
    
    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(numValue)) return '';
    
    return new Intl.NumberFormat('en-US').format(numValue);
  };

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
        onChange={handleIntChange}
        placeholder="0"
        readOnly={readOnly}
        className={cn(
          'block w-full rounded-md border-gray-300 shadow-sm',
          'focus:border-blue-500 focus:ring-blue-500',
          'disabled:bg-gray-50 disabled:text-gray-500',
          readOnly && 'bg-gray-50 text-gray-500 cursor-not-allowed',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
          'text-sm px-3 py-2 border text-right'
        )}
      />
      
      {/* Display formatted integer */}
      {value && value !== '' && (
        <p className="text-xs text-gray-600 text-right">
          {formatIntDisplay(value)}
        </p>
      )}
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {field.options && (
        <p className="text-xs text-gray-500">{field.options}</p>
      )}
    </div>
  );
}