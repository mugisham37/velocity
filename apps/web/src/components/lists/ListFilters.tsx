'use client';

import React from 'react';
import { DocField, FilterCondition } from '@/types';

interface ListFiltersProps {
  fields: DocField[];
  filters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;
}

export function ListFilters({ fields, filters, onFiltersChange }: ListFiltersProps) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Filters</h3>
      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.fieldname} className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 min-w-[100px]">
              {field.label}
            </label>
            <input
              type="text"
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
              placeholder={`Filter by ${field.label}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}