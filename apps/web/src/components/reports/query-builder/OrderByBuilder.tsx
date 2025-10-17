'use client';

import React from 'react';
import { ReportField } from '@/types/reports';
import { Button } from '@/components/ui/button';
import { 
  PlusIcon,
  XMarkIcon,
  BarsArrowUpIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

interface OrderByItem {
  fieldname: string;
  order: 'asc' | 'desc';
}

interface OrderByBuilderProps {
  availableFields: ReportField[];
  orderBy: OrderByItem[];
  onOrderByChange: (orderBy: OrderByItem[]) => void;
}

interface OrderByRowProps {
  orderBy: OrderByItem;
  index: number;
  availableFields: ReportField[];
  onUpdate: (index: number, orderBy: OrderByItem) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const OrderByRow: React.FC<OrderByRowProps> = ({
  orderBy,
  index,
  availableFields,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}) => {
  const handleFieldChange = (fieldname: string) => {
    onUpdate(index, { ...orderBy, fieldname });
  };

  const handleOrderChange = (order: 'asc' | 'desc') => {
    onUpdate(index, { ...orderBy, order });
  };

  const selectedField = availableFields.find(f => f.fieldname === orderBy.fieldname);

  return (
    <div className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-md">
      {/* Priority indicator */}
      <div className="flex items-center space-x-2">
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {index + 1}
        </span>
        <div className="flex flex-col space-y-1">
          <button
            onClick={() => onMoveUp(index)}
            disabled={!canMoveUp}
            className="p-1 text-gray-400 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowUpIcon className="h-3 w-3" />
          </button>
          <button
            onClick={() => onMoveDown(index)}
            disabled={!canMoveDown}
            className="p-1 text-gray-400 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownIcon className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Field */}
      <select
        value={orderBy.fieldname}
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

      {/* Order */}
      <select
        value={orderBy.order}
        onChange={(e) => handleOrderChange(e.target.value as 'asc' | 'desc')}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        disabled={!orderBy.fieldname}
      >
        <option value="asc">Ascending (A-Z, 1-9)</option>
        <option value="desc">Descending (Z-A, 9-1)</option>
      </select>

      {/* Field type indicator */}
      {selectedField && (
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {selectedField.fieldtype}
        </span>
      )}

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

export function OrderByBuilder({ availableFields, orderBy, onOrderByChange }: OrderByBuilderProps) {
  const handleAddOrderBy = () => {
    const newOrderBy: OrderByItem = {
      fieldname: '',
      order: 'asc'
    };
    onOrderByChange([...orderBy, newOrderBy]);
  };

  const handleUpdateOrderBy = (index: number, updatedOrderBy: OrderByItem) => {
    const newOrderBy = [...orderBy];
    newOrderBy[index] = updatedOrderBy;
    onOrderByChange(newOrderBy);
  };

  const handleRemoveOrderBy = (index: number) => {
    const newOrderBy = orderBy.filter((_, i) => i !== index);
    onOrderByChange(newOrderBy);
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newOrderBy = [...orderBy];
      [newOrderBy[index - 1], newOrderBy[index]] = [newOrderBy[index], newOrderBy[index - 1]];
      onOrderByChange(newOrderBy);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < orderBy.length - 1) {
      const newOrderBy = [...orderBy];
      [newOrderBy[index], newOrderBy[index + 1]] = [newOrderBy[index + 1], newOrderBy[index]];
      onOrderByChange(newOrderBy);
    }
  };

  // Filter available fields to only include sortable types
  const sortableFields = availableFields.filter(field => 
    !['HTML', 'Button', 'Section Break', 'Column Break'].includes(field.fieldtype)
  );

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">
          Sort Order ({orderBy.length})
        </h3>
        <Button
          onClick={handleAddOrderBy}
          size="sm"
          variant="outline"
          className="flex items-center space-x-1"
          disabled={sortableFields.length === 0}
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add Sort</span>
        </Button>
      </div>

      {sortableFields.length === 0 ? (
        <div className="text-center py-8">
          <BarsArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-sm font-medium text-gray-900 mb-2">No Sortable Fields</h4>
          <p className="text-sm text-gray-600">
            Add fields to your report first to enable sorting
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3">
          {orderBy.length === 0 ? (
            <div className="text-center py-8">
              <BarsArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-sm font-medium text-gray-900 mb-2">No Sorting Applied</h4>
              <p className="text-sm text-gray-600 mb-4">
                Add sorting to control the order of your report data
              </p>
              <Button onClick={handleAddOrderBy} size="sm">
                Add First Sort
              </Button>
            </div>
          ) : (
            <>
              <div className="text-xs text-gray-600 mb-2">
                Sort priority is applied in order (1 = highest priority). Use arrows to reorder.
              </div>
              {orderBy.map((order, index) => (
                <OrderByRow
                  key={index}
                  orderBy={order}
                  index={index}
                  availableFields={sortableFields}
                  onUpdate={handleUpdateOrderBy}
                  onRemove={handleRemoveOrderBy}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  canMoveUp={index > 0}
                  canMoveDown={index < orderBy.length - 1}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}