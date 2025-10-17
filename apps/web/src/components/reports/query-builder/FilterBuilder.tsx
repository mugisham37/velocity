'use client';

import React, { useState } from 'react';
import { ReportField, ReportFilter, FilterOperator } from '@/types/reports';
import { Button } from '@/components/ui/button';
import { 
  PlusIcon,
  XMarkIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface FilterBuilderProps {
  availableFields: ReportField[];
  filters: ReportFilter[];
  onFiltersChange: (filters: ReportFilter[]) => void;
}

const FILTER_OPERATORS: { value: FilterOperator; label: string; types: string[] }[] = [
  { value: '=', label: 'Equals', types: ['Data', 'Link', 'Select', 'Int', 'Float', 'Currency', 'Date', 'Datetime'] },
  { value: '!=', label: 'Not Equals', types: ['Data', 'Link', 'Select', 'Int', 'Float', 'Currency', 'Date', 'Datetime'] },
  { value: '>', label: 'Greater Than', types: ['Int', 'Float', 'Currency', 'Date', 'Datetime'] },
  { value: '<', label: 'Less Than', types: ['Int', 'Float', 'Currency', 'Date', 'Datetime'] },
  { value: '>=', label: 'Greater Than or Equal', types: ['Int', 'Float', 'Currency', 'Date', 'Datetime'] },
  { value: '<=', label: 'Less Than or Equal', types: ['Int', 'Float', 'Currency', 'Date', 'Datetime'] },
  { value: 'like', label: 'Contains', types: ['Data', 'Text', 'Small Text'] },
  { value: 'not like', label: 'Does Not Contain', types: ['Data', 'Text', 'Small Text'] },
  { value: 'in', label: 'In', types: ['Data', 'Link', 'Select'] },
  { value: 'not in', label: 'Not In', types: ['Data', 'Link', 'Select'] },
  { value: 'is', label: 'Is', types: ['Check', 'Data'] },
  { value: 'is not', label: 'Is Not', types: ['Check', 'Data'] },
  { value: 'between', label: 'Between', types: ['Int', 'Float', 'Currency', 'Date', 'Datetime'] },
  { value: 'timespan', label: 'Timespan', types: ['Date', 'Datetime'] }
];

interface FilterRowProps {
  filter: ReportFilter;
  index: number;
  availableFields: ReportField[];
  onUpdate: (index: number, filter: ReportFilter) => void;
  onRemove: (index: number) => void;
  showCondition: boolean;
}

const FilterRow: React.FC<FilterRowProps> = ({ 
  filter, 
  index, 
  availableFields, 
  onUpdate, 
  onRemove, 
  showCondition 
}) => {
  const selectedField = availableFields.find(f => f.fieldname === filter.fieldname);
  const availableOperators = FILTER_OPERATORS.filter(op => 
    !selectedField || op.types.includes(selectedField.fieldtype)
  );

  const handleFieldChange = (fieldname: string) => {
    const field = availableFields.find(f => f.fieldname === fieldname);
    onUpdate(index, {
      ...filter,
      fieldname,
      operator: '=', // Reset operator when field changes
      value: ''
    });
  };

  const handleOperatorChange = (operator: FilterOperator) => {
    onUpdate(index, {
      ...filter,
      operator,
      value: operator === 'between' ? ['', ''] : ''
    });
  };

  const handleValueChange = (value: unknown) => {
    onUpdate(index, { ...filter, value });
  };

  const renderValueInput = () => {
    if (!selectedField) return null;

    const { fieldtype, options } = selectedField;

    if (filter.operator === 'between') {
      const values = Array.isArray(filter.value) ? filter.value : ['', ''];
      return (
        <div className="flex space-x-2">
          <input
            type={fieldtype === 'Date' ? 'date' : fieldtype === 'Datetime' ? 'datetime-local' : 'text'}
            value={values[0] || ''}
            onChange={(e) => handleValueChange([e.target.value, values[1]])}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="From"
          />
          <input
            type={fieldtype === 'Date' ? 'date' : fieldtype === 'Datetime' ? 'datetime-local' : 'text'}
            value={values[1] || ''}
            onChange={(e) => handleValueChange([values[0], e.target.value])}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="To"
          />
        </div>
      );
    }

    if (['in', 'not in'].includes(filter.operator)) {
      return (
        <input
          type="text"
          value={Array.isArray(filter.value) ? filter.value.join(', ') : filter.value as string || ''}
          onChange={(e) => handleValueChange(e.target.value.split(',').map(v => v.trim()))}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Value1, Value2, Value3..."
        />
      );
    }

    if (fieldtype === 'Check') {
      return (
        <select
          value={filter.value as string || ''}
          onChange={(e) => handleValueChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select...</option>
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>
      );
    }

    if (fieldtype === 'Select' && options) {
      return (
        <select
          value={filter.value as string || ''}
          onChange={(e) => handleValueChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select...</option>
          {options.split('\n').map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={
          fieldtype === 'Date' ? 'date' :
          fieldtype === 'Datetime' ? 'datetime-local' :
          ['Int', 'Float', 'Currency'].includes(fieldtype) ? 'number' :
          'text'
        }
        value={filter.value as string || ''}
        onChange={(e) => handleValueChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Enter value..."
      />
    );
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-md">
      {/* Condition */}
      {showCondition && (
        <select
          value={filter.condition || 'AND'}
          onChange={(e) => onUpdate(index, { ...filter, condition: e.target.value as 'AND' | 'OR' })}
          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="AND">AND</option>
          <option value="OR">OR</option>
        </select>
      )}

      {/* Field */}
      <select
        value={filter.fieldname}
        onChange={(e) => handleFieldChange(e.target.value)}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Select Field...</option>
        {availableFields.map((field) => (
          <option key={`${field.doctype}-${field.fieldname}`} value={field.fieldname}>
            {field.label} ({field.fieldtype})
          </option>
        ))}
      </select>

      {/* Operator */}
      <select
        value={filter.operator}
        onChange={(e) => handleOperatorChange(e.target.value as FilterOperator)}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        disabled={!selectedField}
      >
        {availableOperators.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      {/* Value */}
      <div className="flex-1">
        {renderValueInput()}
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(index)}
        className="p-2 text-gray-400 hover:text-red-500"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

export function FilterBuilder({ availableFields, filters, onFiltersChange }: FilterBuilderProps) {
  const handleAddFilter = () => {
    const newFilter: ReportFilter = {
      fieldname: '',
      operator: '=',
      value: '',
      condition: 'AND'
    };
    onFiltersChange([...filters, newFilter]);
  };

  const handleUpdateFilter = (index: number, filter: ReportFilter) => {
    const newFilters = [...filters];
    newFilters[index] = filter;
    onFiltersChange(newFilters);
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    onFiltersChange(newFilters);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">
          Filters ({filters.length})
        </h3>
        <Button
          onClick={handleAddFilter}
          size="sm"
          variant="outline"
          className="flex items-center space-x-1"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add Filter</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {filters.length === 0 ? (
          <div className="text-center py-8">
            <FunnelIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-sm font-medium text-gray-900 mb-2">No Filters Added</h4>
            <p className="text-sm text-gray-600 mb-4">
              Add filters to narrow down your report data
            </p>
            <Button onClick={handleAddFilter} size="sm">
              Add First Filter
            </Button>
          </div>
        ) : (
          filters.map((filter, index) => (
            <FilterRow
              key={index}
              filter={filter}
              index={index}
              availableFields={availableFields}
              onUpdate={handleUpdateFilter}
              onRemove={handleRemoveFilter}
              showCondition={index > 0}
            />
          ))
        )}
      </div>
    </div>
  );
}