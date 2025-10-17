'use client';

import React, { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ReportField, DocTypeRelation } from '@/types/reports';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  Bars3Icon,
  LinkIcon
} from '@heroicons/react/24/outline';

interface FieldSelectorProps {
  availableFields: ReportField[];
  selectedFields: ReportField[];
  relations: DocTypeRelation[];
  onFieldsChange: (fields: ReportField[]) => void;
}

interface DraggableFieldProps {
  field: ReportField;
  index: number;
  onRemove: (index: number) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}

const DraggableField: React.FC<DraggableFieldProps> = ({ field, index, onRemove, onMove }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'field',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'field',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        onMove(item.index, index);
        item.index = index;
      }
    },
  });

  const getFieldTypeIcon = (fieldtype: string) => {
    switch (fieldtype) {
      case 'Link':
        return <LinkIcon className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getFieldTypeColor = (fieldtype: string) => {
    switch (fieldtype) {
      case 'Link':
        return 'text-blue-600 bg-blue-50';
      case 'Data':
      case 'Small Text':
      case 'Text':
        return 'text-green-600 bg-green-50';
      case 'Int':
      case 'Float':
      case 'Currency':
        return 'text-purple-600 bg-purple-50';
      case 'Date':
      case 'Datetime':
        return 'text-orange-600 bg-orange-50';
      case 'Check':
        return 'text-indigo-600 bg-indigo-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`flex items-center justify-between p-2 bg-white border border-gray-200 rounded-md cursor-move ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        <Bars3Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {field.label}
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getFieldTypeColor(field.fieldtype)}`}>
              {getFieldTypeIcon(field.fieldtype)}
              <span className="ml-1">{field.fieldtype}</span>
            </span>
            {field.doctype && (
              <span className="text-xs text-gray-500">
                {field.doctype}
              </span>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={() => onRemove(index)}
        className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

export function FieldSelector({ 
  availableFields, 
  selectedFields, 
  relations, 
  onFieldsChange 
}: FieldSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRelations, setExpandedRelations] = useState<Set<string>>(new Set());

  const filteredFields = availableFields.filter(field =>
    field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.fieldname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddField = (field: ReportField) => {
    if (!selectedFields.find(f => f.fieldname === field.fieldname && f.doctype === field.doctype)) {
      onFieldsChange([...selectedFields, field]);
    }
  };

  const handleRemoveField = (index: number) => {
    const newFields = selectedFields.filter((_, i) => i !== index);
    onFieldsChange(newFields);
  };

  const handleMoveField = (dragIndex: number, hoverIndex: number) => {
    const newFields = [...selectedFields];
    const draggedField = newFields[dragIndex];
    newFields.splice(dragIndex, 1);
    newFields.splice(hoverIndex, 0, draggedField);
    onFieldsChange(newFields);
  };

  const toggleRelation = (relationKey: string) => {
    const newExpanded = new Set(expandedRelations);
    if (newExpanded.has(relationKey)) {
      newExpanded.delete(relationKey);
    } else {
      newExpanded.add(relationKey);
    }
    setExpandedRelations(newExpanded);
  };

  const groupedFields = filteredFields.reduce((acc, field) => {
    const doctype = field.doctype;
    if (!acc[doctype]) {
      acc[doctype] = [];
    }
    acc[doctype].push(field);
    return acc;
  }, {} as Record<string, ReportField[]>);

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Selected Fields */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          Selected Fields ({selectedFields.length})
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {selectedFields.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4 border-2 border-dashed border-gray-300 rounded-md">
              Drag fields here or click + to add
            </div>
          ) : (
            selectedFields.map((field, index) => (
              <DraggableField
                key={`${field.doctype}-${field.fieldname}`}
                field={field}
                index={index}
                onRemove={handleRemoveField}
                onMove={handleMoveField}
              />
            ))
          )}
        </div>
      </div>

      {/* Available Fields */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Available Fields</h3>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Fields List */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {Object.entries(groupedFields).map(([doctype, fields]) => (
            <div key={doctype} className="border border-gray-200 rounded-md">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-900">{doctype}</h4>
              </div>
              <div className="p-2 space-y-1">
                {fields.map((field) => (
                  <div
                    key={`${field.doctype}-${field.fieldname}`}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 truncate">
                        {field.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {field.fieldtype}
                        {field.options && ` → ${field.options}`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddField(field)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-500 transition-opacity"
                      disabled={selectedFields.some(f => f.fieldname === field.fieldname && f.doctype === field.doctype)}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}