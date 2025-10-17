'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { DocField } from '@/types';
import { cn } from '@/lib/utils';
import { CalendarIcon, ClockIcon } from 'lucide-react';
import { format } from 'date-fns';

interface DatetimeFieldProps {
  field: DocField;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
}

export function DatetimeField({ field, error, required, readOnly }: DatetimeFieldProps) {
  const { register, setValue, watch } = useFormContext();
  const value = watch(field.fieldname);

  const handleDatetimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const datetimeValue = event.target.value;
    setValue(field.fieldname, datetimeValue, { shouldDirty: true });
  };

  const formatDisplayDatetime = (datetimeString: string) => {
    if (!datetimeString) return '';
    try {
      const date = new Date(datetimeString);
      return format(date, 'MMM dd, yyyy hh:mm a');
    } catch {
      return datetimeString;
    }
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
        <input
          id={field.fieldname}
          type="datetime-local"
          {...register(field.fieldname)}
          onChange={handleDatetimeChange}
          readOnly={readOnly}
          className={cn(
            'block w-full rounded-md border-gray-300 shadow-sm',
            'focus:border-blue-500 focus:ring-blue-500',
            'disabled:bg-gray-50 disabled:text-gray-500',
            readOnly && 'bg-gray-50 text-gray-500 cursor-not-allowed',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
            'text-sm px-3 py-2 border pr-10'
          )}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <div className="flex items-center space-x-1">
            <CalendarIcon className="h-3 w-3 text-gray-400" />
            <ClockIcon className="h-3 w-3 text-gray-400" />
          </div>
        </div>
      </div>
      
      {/* Display formatted datetime */}
      {value && (
        <p className="text-xs text-gray-600">
          {formatDisplayDatetime(value)}
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