'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export interface CustomField {
  name: string;
  fieldname: string;
  label: string;
  fieldtype: string;
  options?: string;
  reqd: boolean;
  unique: boolean;
  readonly: boolean;
  hidden: boolean;
  in_list_view: boolean;
  in_standard_filter: boolean;
  default?: string;
  description?: string;
  permlevel: number;
  insert_after?: string;
  depends_on?: string;
  created: string;
  modified: string;
  owner: string;
}

interface CustomFieldListProps {
  doctype: string;
  fields: CustomField[];
  onAdd: () => void;
  onEdit: (field: CustomField) => void;
  onDelete: (field: CustomField) => void;
  onToggleVisibility: (field: CustomField) => void;
  loading?: boolean;
}

export function CustomFieldList({
  doctype,
  fields,
  onAdd,
  onEdit,
  onDelete,
  onToggleVisibility,
  loading = false,
}: CustomFieldListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Filter fields based on search term and type
  const filteredFields = fields.filter((field) => {
    const matchesSearch = 
      field.fieldname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.fieldtype.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = 
      filterType === 'all' ||
      (filterType === 'mandatory' && field.reqd) ||
      (filterType === 'hidden' && field.hidden) ||
      (filterType === 'readonly' && field.readonly) ||
      (filterType === 'unique' && field.unique) ||
      field.fieldtype.toLowerCase() === filterType.toLowerCase();

    return matchesSearch && matchesType;
  });

  const getFieldTypeColor = (fieldtype: string) => {
    const colors: Record<string, string> = {
      'Data': 'bg-blue-100 text-blue-800',
      'Text': 'bg-green-100 text-green-800',
      'Select': 'bg-purple-100 text-purple-800',
      'Link': 'bg-orange-100 text-orange-800',
      'Check': 'bg-gray-100 text-gray-800',
      'Date': 'bg-indigo-100 text-indigo-800',
      'Currency': 'bg-yellow-100 text-yellow-800',
      'Float': 'bg-pink-100 text-pink-800',
      'Int': 'bg-red-100 text-red-800',
      'Table': 'bg-teal-100 text-teal-800',
    };
    return colors[fieldtype] || 'bg-gray-100 text-gray-800';
  };

  const getFieldIcons = (field: CustomField) => {
    const icons = [];
    
    if (field.reqd) {
      icons.push(
        <ExclamationTriangleIcon 
          key="required" 
          className="h-4 w-4 text-red-500" 
          title="Mandatory Field"
        />
      );
    }
    
    if (field.readonly) {
      icons.push(
        <LockClosedIcon 
          key="readonly" 
          className="h-4 w-4 text-gray-500" 
          title="Read Only"
        />
      );
    }
    
    if (field.hidden) {
      icons.push(
        <EyeSlashIcon 
          key="hidden" 
          className="h-4 w-4 text-gray-400" 
          title="Hidden Field"
        />
      );
    } else {
      icons.push(
        <EyeIcon 
          key="visible" 
          className="h-4 w-4 text-green-500" 
          title="Visible Field"
        />
      );
    }

    return icons;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Custom Fields</h2>
          <p className="text-sm text-gray-600 mt-1">
            DocType: <span className="font-medium">{doctype}</span>
            {fields.length > 0 && (
              <span className="ml-2">({fields.length} field{fields.length !== 1 ? 's' : ''})</span>
            )}
          </p>
        </div>
        <Button onClick={onAdd} className="flex items-center space-x-2">
          <PlusIcon className="h-4 w-4" />
          <span>Add Custom Field</span>
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Fields</option>
          <option value="mandatory">Mandatory</option>
          <option value="hidden">Hidden</option>
          <option value="readonly">Read Only</option>
          <option value="unique">Unique</option>
          <option value="data">Data Fields</option>
          <option value="select">Select Fields</option>
          <option value="link">Link Fields</option>
          <option value="date">Date Fields</option>
          <option value="currency">Currency Fields</option>
        </select>
      </div>

      {/* Fields List */}
      {filteredFields.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <PlusIcon className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {fields.length === 0 ? 'No Custom Fields' : 'No Matching Fields'}
          </h3>
          <p className="text-gray-600 mb-4">
            {fields.length === 0 
              ? `Add custom fields to extend the ${doctype} DocType with additional functionality.`
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
          {fields.length === 0 && (
            <Button onClick={onAdd}>Add Your First Custom Field</Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFields.map((field) => (
            <div
              key={field.name}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {field.label}
                    </h3>
                    <Badge className={getFieldTypeColor(field.fieldtype)}>
                      {field.fieldtype}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      {getFieldIcons(field)}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>
                      <span className="font-medium">Field Name:</span> {field.fieldname}
                    </div>
                    {field.description && (
                      <div>
                        <span className="font-medium">Description:</span> {field.description}
                      </div>
                    )}
                    {field.options && (
                      <div>
                        <span className="font-medium">Options:</span> {field.options}
                      </div>
                    )}
                    {field.default && (
                      <div>
                        <span className="font-medium">Default:</span> {field.default}
                      </div>
                    )}
                    {field.depends_on && (
                      <div>
                        <span className="font-medium">Depends On:</span> {field.depends_on}
                      </div>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      <span>
                        <span className="font-medium">Permission Level:</span> {field.permlevel}
                      </span>
                      <span>
                        <span className="font-medium">Created:</span> {new Date(field.created).toLocaleDateString()}
                      </span>
                      <span>
                        <span className="font-medium">By:</span> {field.owner}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleVisibility(field)}
                    title={field.hidden ? 'Show Field' : 'Hide Field'}
                  >
                    {field.hidden ? (
                      <EyeIcon className="h-4 w-4" />
                    ) : (
                      <EyeSlashIcon className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(field)}
                    title="Edit Field"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(field)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Delete Field"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Field Properties Summary */}
              <div className="flex flex-wrap gap-2 mt-3">
                {field.reqd && (
                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                    Mandatory
                  </Badge>
                )}
                {field.unique && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    Unique
                  </Badge>
                )}
                {field.readonly && (
                  <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                    Read Only
                  </Badge>
                )}
                {field.in_list_view && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    In List View
                  </Badge>
                )}
                {field.in_standard_filter && (
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                    In Filter
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}