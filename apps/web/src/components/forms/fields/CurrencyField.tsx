'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { DocField } from '@/types';
import { cn } from '@/lib/utils';
import { DollarSignIcon } from 'lucide-react';

interface CurrencyFieldProps {
  field: DocField;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
}

export function CurrencyField({ field, error, required, readOnly }: CurrencyFieldProps) {
  const { register, setValue, watch } = useFormContext();
  const value = watch(field.fieldname);

  const handleCurrencyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    
    // Remove any non-numeric characters except decimal point and minus sign
    const cleanValue = inputValue.replace(/[^0-9.-]/g, '');
    
    // Parse as float
    const numericValue = parseFloat(cleanValue);
    
    if (!isNaN(numericValue)) {
      setValue(field.fieldname, numericValue, { shouldDirty: true });
    } else if (cleanValue === '' || cleanValue === '-') {
      setValue(field.fieldname, '', { shouldDirty: true });
    }
  };

  const formatCurrencyDisplay = (value: number | string) => {
    if (value === '' || value === null || value === undefined) return '';
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue);
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
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <DollarSignIcon className="h-4 w-4 text-gray-400" />
        </div>
        
        <input
          id={field.fieldname}
          type="text"
          {...register(field.fieldname)}
          onChange={handleCurrencyChange}
          placeholder="0.00"
          readOnly={readOnly}
          className={cn(
            'block w-full rounded-md border-gray-300 shadow-sm',
            'focus:border-blue-500 focus:ring-blue-500',
            'disabled:bg-gray-50 disabled:text-gray-500',
            readOnly && 'bg-gray-50 text-gray-500 cursor-not-allowed',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
            'text-sm pl-10 pr-3 py-2 border'
          )}
        />
      </div>
      
      {/* Display formatted currency */}
      {value && value !== '' && (
        <p className="text-xs text-gray-600">
          {formatCurrencyDisplay(value)}
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