'use client';

import React, { useState, useEffect } from 'react';
import { CustomFieldForm } from './CustomFieldForm';
import { CustomFieldList, CustomField } from './CustomFieldList';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useNotifications } from '@/hooks/useNotifications';

interface CustomFieldManagerProps {
  doctype: string;
  onBack?: () => void;
}

type ViewMode = 'list' | 'add' | 'edit';

export function CustomFieldManager({ doctype, onBack }: CustomFieldManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedField, setSelectedField] = useState<CustomField | null>(null);
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocType, setSelectedDocType] = useState(doctype);
  const { addNotification } = useNotifications();

  // Mock data for demonstration - in real implementation, this would come from API
  useEffect(() => {
    const loadFields = async () => {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock custom fields data
      const mockFields: CustomField[] = [
        {
          name: 'Custom Field-customer_priority',
          fieldname: 'custom_customer_priority',
          label: 'Customer Priority',
          fieldtype: 'Select',
          options: 'High\nMedium\nLow',
          reqd: false,
          unique: false,
          readonly: false,
          hidden: false,
          in_list_view: true,
          in_standard_filter: true,
          default: 'Medium',
          description: 'Priority level for customer service',
          permlevel: 0,
          insert_after: 'customer_name',
          created: '2024-01-15T10:30:00.000Z',
          modified: '2024-01-15T10:30:00.000Z',
          owner: 'Administrator',
        },
        {
          name: 'Custom Field-internal_notes',
          fieldname: 'custom_internal_notes',
          label: 'Internal Notes',
          fieldtype: 'Long Text',
          reqd: false,
          unique: false,
          readonly: false,
          hidden: false,
          in_list_view: false,
          in_standard_filter: false,
          description: 'Internal notes not visible to customer',
          permlevel: 1,
          created: '2024-01-10T14:20:00.000Z',
          modified: '2024-01-12T09:15:00.000Z',
          owner: 'Administrator',
        },
        {
          name: 'Custom Field-external_id',
          fieldname: 'custom_external_id',
          label: 'External System ID',
          fieldtype: 'Data',
          reqd: false,
          unique: true,
          readonly: true,
          hidden: true,
          in_list_view: false,
          in_standard_filter: false,
          description: 'ID from external system integration',
          permlevel: 0,
          created: '2024-01-05T16:45:00.000Z',
          modified: '2024-01-05T16:45:00.000Z',
          owner: 'Administrator',
        },
      ];
      
      setFields(mockFields);
      setLoading(false);
    };

    loadFields();
  }, [selectedDocType]);

  const handleAddField = () => {
    setSelectedField(null);
    setViewMode('add');
  };

  const handleEditField = (field: CustomField) => {
    setSelectedField(field);
    setViewMode('edit');
  };

  const handleDeleteField = async (field: CustomField) => {
    if (!confirm(`Are you sure you want to delete the custom field "${field.label}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // In real implementation, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setFields(prev => prev.filter(f => f.name !== field.name));
      
      addNotification({
        type: 'success',
        title: 'Field Deleted',
        message: `Custom field "${field.label}" has been deleted successfully.`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete the custom field. Please try again.',
      });
    }
  };

  const handleToggleVisibility = async (field: CustomField) => {
    try {
      // In real implementation, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setFields(prev => prev.map(f => 
        f.name === field.name 
          ? { ...f, hidden: !f.hidden }
          : f
      ));
      
      addNotification({
        type: 'success',
        title: 'Field Updated',
        message: `Field "${field.label}" is now ${field.hidden ? 'visible' : 'hidden'}.`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update field visibility. Please try again.',
      });
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      // In real implementation, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newField: CustomField = {
        name: `Custom Field-${data.fieldname}`,
        ...data,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        owner: 'Administrator',
      };

      if (viewMode === 'edit' && selectedField) {
        // Update existing field
        setFields(prev => prev.map(f => 
          f.name === selectedField.name 
            ? { ...newField, name: selectedField.name, created: selectedField.created }
            : f
        ));
        
        addNotification({
          type: 'success',
          title: 'Field Updated',
          message: `Custom field "${data.label}" has been updated successfully.`,
        });
      } else {
        // Add new field
        setFields(prev => [...prev, newField]);
        
        addNotification({
          type: 'success',
          title: 'Field Added',
          message: `Custom field "${data.label}" has been added successfully.`,
        });
      }
      
      setViewMode('list');
      setSelectedField(null);
    } catch (error) {
      addNotification({
        type: 'error',
        title: viewMode === 'edit' ? 'Update Failed' : 'Add Failed',
        message: 'Failed to save the custom field. Please try again.',
      });
    }
  };

  const handleFormCancel = () => {
    setViewMode('list');
    setSelectedField(null);
  };

  const handleDocTypeChange = (newDocType: string) => {
    setSelectedDocType(newDocType);
    setViewMode('list');
    setSelectedField(null);
  };

  // Common DocTypes for quick selection
  const commonDocTypes = [
    'Customer',
    'Supplier',
    'Item',
    'Sales Order',
    'Purchase Order',
    'Sales Invoice',
    'Purchase Invoice',
    'Delivery Note',
    'Purchase Receipt',
    'Payment Entry',
    'Journal Entry',
    'Lead',
    'Opportunity',
    'Quotation',
    'Project',
    'Task',
    'Employee',
    'Leave Application',
    'Expense Claim',
  ];

  return (
    <div className="space-y-6">
      {/* Header with DocType Selection */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {onBack && (
              <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Custom Fields</h1>
              <p className="text-sm text-gray-600">
                Add and manage custom fields for DocTypes
              </p>
            </div>
          </div>
          
          {viewMode === 'list' && (
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700">DocType:</label>
              <select
                value={selectedDocType}
                onChange={(e) => handleDocTypeChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
              >
                {commonDocTypes.map((dt) => (
                  <option key={dt} value={dt}>
                    {dt}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* Warning about custom fields */}
      {viewMode !== 'list' && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Important Notes about Custom Fields
              </h3>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Custom fields are added to the database schema and cannot be easily removed</li>
                <li>• Field names must be unique and follow naming conventions</li>
                <li>• Changes to custom fields may require system restart in some cases</li>
                <li>• Test custom fields thoroughly before deploying to production</li>
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content */}
      {viewMode === 'list' ? (
        <CustomFieldList
          doctype={selectedDocType}
          fields={fields}
          onAdd={handleAddField}
          onEdit={handleEditField}
          onDelete={handleDeleteField}
          onToggleVisibility={handleToggleVisibility}
          loading={loading}
        />
      ) : (
        <CustomFieldForm
          doctype={selectedDocType}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          initialData={selectedField || undefined}
          isEditing={viewMode === 'edit'}
        />
      )}
    </div>
  );
}