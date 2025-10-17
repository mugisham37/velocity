'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { DocField } from '@/types';
import { cn } from '@/lib/utils';
import { ChevronDownIcon } from 'lucide-react';

interface SelectFieldProps {
  field: DocField;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
}

export function SelectField({ field, error, required, readOnly }: SelectFieldProps) {
  const { register } = useFormContext();

  // Parse options from field.options string
  const options = React.useMemo(() => {
    if (!field.options) return [];
    
    // Handle different option formats
    if (field.options.includes('\n')) {
      // Multi-line options
      return field.options.split('\n').filter(Boolean);
    } else if (field.options.includes(',')) {
      // Comma-separated options
      return field.options.split(',').map(opt => opt.trim()).filter(Boolean);
    } else {
      // Single option or special format
      return [field.options];
    }
  }, [field.options]);

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
        <select
          id={field.fieldname}
          {...register(field.fieldname)}
          disabled={readOnly}
          className={cn(
            'block w-full rounded-md border-gray-300 shadow-sm',
            'focus:border-blue-500 focus:ring-blue-500',
            'disabled:bg-gray-50 disabled:text-gray-500',
            readOnly && 'bg-gray-50 text-gray-500 cursor-not-allowed',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
            'text-sm px-3 py-2 border pr-10 appearance-none'
          )}
        >
          <option value="">Select {field.label}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}