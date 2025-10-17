'use client';

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { DocField } from '@/types';
import { cn } from '@/lib/utils';
import { PlusIcon, TrashIcon, EditIcon, MoveIcon } from 'lucide-react';

interface TableFieldProps {
  field: DocField;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
}

interface TableRow {
  idx: number;
  [key: string]: unknown;
}

export function TableField({ field, error, required, readOnly }: TableFieldProps) {
  const { setValue, watch } = useFormContext();
  const [editingRow, setEditingRow] = useState<number | null>(null);
  
  const value = watch(field.fieldname) || [];
  const rows: TableRow[] = Array.isArray(value) ? value : [];

  // Mock child table fields - in real implementation, this would come from DocType meta
  const childFields = [
    { fieldname: 'item_code', label: 'Item Code', fieldtype: 'Link', options: 'Item' },
    { fieldname: 'item_name', label: 'Item Name', fieldtype: 'Data' },
    { fieldname: 'qty', label: 'Quantity', fieldtype: 'Float' },
    { fieldname: 'rate', label: 'Rate', fieldtype: 'Currency' },
    { fieldname: 'amount', label: 'Amount', fieldtype: 'Currency' },
  ];

  const addRow = () => {
    if (readOnly) return;
    
    const newRow: TableRow = {
      idx: rows.length + 1,
      ...childFields.reduce((acc, field) => {
        acc[field.fieldname] = field.fieldtype === 'Float' || field.fieldtype === 'Currency' ? 0 : '';
        return acc;
      }, {} as Record<string, unknown>)
    };
    
    const updatedRows = [...rows, newRow];
    setValue(field.fieldname, updatedRows, { shouldDirty: true });
  };

  const removeRow = (index: number) => {
    if (readOnly) return;
    
    const updatedRows = rows.filter((_, i) => i !== index);
    // Reindex rows
    const reindexedRows = updatedRows.map((row, i) => ({ ...row, idx: i + 1 }));
    setValue(field.fieldname, reindexedRows, { shouldDirty: true });
  };

  const updateRow = (index: number, fieldname: string, newValue: unknown) => {
    if (readOnly) return;
    
    const updatedRows = [...rows];
    updatedRows[index] = { ...updatedRows[index], [fieldname]: newValue };
    
    // Calculate amount if qty and rate are updated
    if (fieldname === 'qty' || fieldname === 'rate') {
      const qty = Number(updatedRows[index].qty) || 0;
      const rate = Number(updatedRows[index].rate) || 0;
      updatedRows[index].amount = qty * rate;
    }
    
    setValue(field.fieldname, updatedRows, { shouldDirty: true });
  };

  const renderCellValue = (row: TableRow, childField: typeof childFields[0], rowIndex: number) => {
    const cellValue = row[childField.fieldname];
    const isEditing = editingRow === rowIndex;

    if (readOnly && !isEditing) {
      return (
        <span className="text-sm text-gray-900">
          {formatCellValue(cellValue, childField.fieldtype)}
        </span>
      );
    }

    if (isEditing) {
      return (
        <input
          type={getInputType(childField.fieldtype)}
          value={cellValue as string}
          onChange={(e) => updateRow(rowIndex, childField.fieldname, e.target.value)}
          onBlur={() => setEditingRow(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setEditingRow(null);
            if (e.key === 'Escape') setEditingRow(null);
          }}
          className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
      );
    }

    return (
      <button
        type="button"
        onClick={() => setEditingRow(rowIndex)}
        className="w-full text-left px-2 py-1 text-sm text-gray-900 hover:bg-gray-50 rounded"
      >
        {formatCellValue(cellValue, childField.fieldtype)}
      </button>
    );
  };

  const formatCellValue = (value: unknown, fieldtype: string): string => {
    if (value === null || value === undefined || value === '') return '';
    
    switch (fieldtype) {
      case 'Currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(Number(value));
      case 'Float':
        return Number(value).toFixed(2);
      default:
        return String(value);
    }
  };

  const getInputType = (fieldtype: string): string => {
    switch (fieldtype) {
      case 'Float':
      case 'Currency':
        return 'number';
      case 'Date':
        return 'date';
      case 'Datetime':
        return 'datetime-local';
      default:
        return 'text';
    }
  };

  return (
    <div className="space-y-1">
      <label
        className={cn(
          'block text-sm font-medium text-gray-700',
          required && 'after:content-["*"] after:text-red-500 after:ml-1'
        )}
      >
        {field.label}
      </label>
      
      <div className={cn(
        'border border-gray-300 rounded-md overflow-hidden',
        error && 'border-red-300'
      )}>
        {/* Table Header */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-2 px-3 py-2">
            <div className="col-span-1 text-xs font-medium text-gray-700">#</div>
            {childFields.map((childField) => (
              <div
                key={childField.fieldname}
                className="col-span-2 text-xs font-medium text-gray-700"
              >
                {childField.label}
              </div>
            ))}
            <div className="col-span-1 text-xs font-medium text-gray-700">Actions</div>
          </div>
        </div>
        
        {/* Table Body */}
        <div className="max-h-64 overflow-y-auto">
          {rows.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-gray-500">
              No items added yet. Click "Add Row" to get started.
            </div>
          ) : (
            rows.map((row, rowIndex) => (
              <div
                key={row.idx}
                className={cn(
                  'grid grid-cols-12 gap-2 px-3 py-2 border-b border-gray-100 last:border-b-0',
                  'hover:bg-gray-50'
                )}
              >
                <div className="col-span-1 flex items-center">
                  <span className="text-xs text-gray-500">{row.idx}</span>
                </div>
                
                {childFields.map((childField) => (
                  <div key={childField.fieldname} className="col-span-2">
                    {renderCellValue(row, childField, rowIndex)}
                  </div>
                ))}
                
                <div className="col-span-1 flex items-center space-x-1">
                  {!readOnly && (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditingRow(rowIndex)}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                        title="Edit row"
                      >
                        <EditIcon className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRow(rowIndex)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Delete row"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Table Footer */}
        {!readOnly && (
          <div className="bg-gray-50 border-t border-gray-200 px-3 py-2">
            <button
              type="button"
              onClick={addRow}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add Row</span>
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {/* Summary */}
      {rows.length > 0 && (
        <div className="text-xs text-gray-500">
          {rows.length} item{rows.length !== 1 ? 's' : ''} • Total: {
            new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(
              rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
            )
          }
        </div>
      )}
    </div>
  );
}