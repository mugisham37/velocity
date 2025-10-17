'use client';

import React from 'react';
import { ReportField, ReportGroupBy } from '@/types/reports';
import { Button } from '@/components/ui/button';
import { 
  PlusIcon,
  XMarkIcon,
  Squares2X2Icon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

interface GroupByBuilderProps {
  availableFields: ReportField[];
  groupBy: ReportGroupBy[];
  onGroupByChange: (groupBy: ReportGroupBy[]) => void;
}

interface GroupByRowProps {
  groupBy: ReportGroupBy;
  index: number;
  availableFields: ReportField[];
  onUpdate: (index: number, groupBy: ReportGroupBy) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const GroupByRow: React.FC<GroupByRowProps> = ({
  groupBy,
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
    const field = availableFields.find(f => f.fieldname === fieldname);
    onUpdate(index, {
      ...groupBy,
      fieldname,
      label: field?.label || fieldname
    });
  };

  const handleSortOrderChange = (sort_order: 'asc' | 'desc') => {
    onUpdate(index, { ...groupBy, sort_order });
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-md">
      {/* Move buttons */}
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

      {/* Field */}
      <select
        value={groupBy.fieldname}
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

      {/* Sort Order */}
      <select
        value={groupBy.sort_order || 'asc'}
        onChange={(e) => handleSortOrderChange(e.target.value as 'asc' | 'desc')}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        disabled={!groupBy.fieldname}
      >
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>

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

export function GroupByBuilder({ availableFields, groupBy, onGroupByChange }: GroupByBuilderProps) {
  const handleAddGroupBy = () => {
    const newGroupBy: ReportGroupBy = {
      fieldname: '',
      label: '',
      sort_order: 'asc'
    };
    onGroupByChange([...groupBy, newGroupBy]);
  };

  const handleUpdateGroupBy = (index: number, updatedGroupBy: ReportGroupBy) => {
    const newGroupBy = [...groupBy];
    newGroupBy[index] = updatedGroupBy;
    onGroupByChange(newGroupBy);
  };

  const handleRemoveGroupBy = (index: number) => {
    const newGroupBy = groupBy.filter((_, i) => i !== index);
    onGroupByChange(newGroupBy);
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newGroupBy = [...groupBy];
      [newGroupBy[index - 1], newGroupBy[index]] = [newGroupBy[index], newGroupBy[index - 1]];
      onGroupByChange(newGroupBy);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < groupBy.length - 1) {
      const newGroupBy = [...groupBy];
      [newGroupBy[index], newGroupBy[index + 1]] = [newGroupBy[index + 1], newGroupBy[index]];
      onGroupByChange(newGroupBy);
    }
  };

  // Filter available fields to only include groupable types
  const groupableFields = availableFields.filter(field => 
    ['Data', 'Link', 'Select', 'Date', 'Check'].includes(field.fieldtype)
  );

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">
          Group By ({groupBy.length})
        </h3>
        <Button
          onClick={handleAddGroupBy}
          size="sm"
          variant="outline"
          className="flex items-center space-x-1"
          disabled={groupableFields.length === 0}
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add Group</span>
        </Button>
      </div>

      {groupableFields.length === 0 ? (
        <div className="text-center py-8">
          <Squares2X2Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-sm font-medium text-gray-900 mb-2">No Groupable Fields</h4>
          <p className="text-sm text-gray-600">
            Add fields to your report first to enable grouping
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3">
          {groupBy.length === 0 ? (
            <div className="text-center py-8">
              <Squares2X2Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-sm font-medium text-gray-900 mb-2">No Grouping Applied</h4>
              <p className="text-sm text-gray-600 mb-4">
                Group your data by one or more fields to create summary reports
              </p>
              <Button onClick={handleAddGroupBy} size="sm">
                Add First Group
              </Button>
            </div>
          ) : (
            <>
              <div className="text-xs text-gray-600 mb-2">
                Groups are applied in order. Use the arrows to reorder.
              </div>
              {groupBy.map((group, index) => (
                <GroupByRow
                  key={index}
                  groupBy={group}
                  index={index}
                  availableFields={groupableFields}
                  onUpdate={handleUpdateGroupBy}
                  onRemove={handleRemoveGroupBy}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  canMoveUp={index > 0}
                  canMoveDown={index < groupBy.length - 1}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}