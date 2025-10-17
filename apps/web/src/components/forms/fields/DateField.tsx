'use client';

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { DocField } from '@/types';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface DateFieldProps {
  field: DocField;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
}

export function DateField({ field, error, required, readOnly }: DateFieldProps) {
  const { register, setValue, watch } = useFormContext();
  const [showCalendar, setShowCalendar] = useState(false);
  const value = watch(field.fieldname);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = event.target.value;
    setValue(field.fieldname, dateValue, { shouldDirty: true });
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy');
    } catch {
      return dateString;
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
          type="date"
          {...register(field.fieldname)}
          onChange={handleDateChange}
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
          <CalendarIcon className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      {/* Display formatted date */}
      {value && (
        <p className="text-xs text-gray-600">
          {formatDisplayDate(value)}
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