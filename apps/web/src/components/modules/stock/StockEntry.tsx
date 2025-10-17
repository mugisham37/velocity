'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { StockEntry, StockEntryDetail, StockEntryPurpose, DocTypeSchema } from '@/types';
import { FormSection } from '@/components/forms/FormSection';
import { FormToolbar } from '@/components/forms/FormToolbar';
import { Timeline } from '@/components/forms/Timeline';
import { AttachmentManager } from '@/components/forms/AttachmentManager';
import { useDocument, useDocumentMeta } from '@/hooks/useDocuments';
import { useNotifications } from '@/hooks/useNotifications';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface StockEntryProps {
  entryName?: string;
  onSave?: (entry: StockEntry) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

// Stock Entry validation schema
const stockEntryDetailSchema = z.object({
  idx: z.number(),
  item_code: z.string().min(1, 'Item Code is required'),
  item_name: z.string(),
  description: z.string().optional(),
  item_group: z.string(),
  qty: z.number().min(0, 'Quantity must be positive'),
  transfer_qty: z.number(),
  uom: z.string(),
  stock_uom: z.string(),
  conversion_factor: z.number().default(1),
  s_warehouse: z.string().optional(),
  t_warehouse: z.string().optional(),
  basic_rate: z.number().default(0),
  valuation_rate: z.number().default(0),
  basic_amount: z.number().default(0),
  amount: z.number().default(0),
  additional_cost: z.number().default(0),
  serial_no: z.string().optional(),
  batch_no: z.string().optional(),
  bom_no: z.string().optional(),
  original_item: z.string().optional(),
  sample_quantity: z.number().optional(),
  cost_center: z.string().optional(),
  project: z.string().optional(),
  material_request: z.string().optional(),
  material_request_item: z.string().optional(),
  actual_qty: z.number().optional(),
  transferred_qty: z.number().optional(),
});

const stockEntryValidationSchema = z.object({
  naming_series: z.string().default('STE-'),
  stock_entry_type: z.string().optional(),
  purpose: z.string().min(1, 'Purpose is required'),
  company: z.string().min(1, 'Company is required'),
  posting_date: z.string().min(1, 'Posting Date is required'),
  posting_time: z.string().default('12:00:00'),
  set_posting_time: z.boolean().default(false),
  from_warehouse: z.string().optional(),
  to_warehouse: z.string().optional(),
  from_bom: z.string().optional(),
  bom_no: z.string().optional(),
  use_multi_level_bom: z.boolean().default(false),
  fg_completed_qty: z.number().optional(),
  project: z.string().optional(),
  cost_center: z.string().optional(),
  remarks: z.string().optional(),
  per_transferred: z.number().optional(),
  total_outgoing_value: z.number().default(0),
  total_incoming_value: z.number().default(0),
  value_difference: z.number().default(0),
  total_additional_costs: z.number().default(0),
  items: z.array(stockEntryDetailSchema).min(1, 'At least one item is required'),
});

export function StockEntry({ entryName, onSave, onCancel, readOnly = false }: StockEntryProps) {
  const [activeTab, setActiveTab] = useState('details');
  const { showApiError, showApiSuccess } = useNotifications();
  
  // Use the document hooks
  const { doc: entry, isLoading, save, isSaving } = useDocument('Stock Entry', entryName || '', !!entryName);
  const { meta } = useDocumentMeta('Stock Entry');

  // Initialize form
  const methods = useForm({
    resolver: zodResolver(stockEntryValidationSchema),
    defaultValues: entry || {
      naming_series: 'STE-',
      posting_date: new Date().toISOString().split('T')[0],
      posting_time: '12:00:00',
      set_posting_time: false,
      use_multi_level_bom: false,
      total_outgoing_value: 0,
      total_incoming_value: 0,
      value_difference: 0,
      total_additional_costs: 0,
      items: [],
    },
    mode: 'onChange',
  });

  const { watch, reset, setValue, control } = methods;
  const formData = watch();

  // Field array for items
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Reset form when entry data changes
  useEffect(() => {
    if (entry) {
      reset(entry);
    }
  }, [entry, reset]);

  // Handle purpose-based field visibility and validation
  useEffect(() => {
    const purpose = formData.purpose as StockEntryPurpose;
    
    // Set default warehouses based on purpose
    switch (purpose) {
      case 'Material Issue':
        setValue('to_warehouse', '');
        break;
      case 'Material Receipt':
        setValue('from_warehouse', '');
        break;
      case 'Material Transfer':
        // Both warehouses required
        break;
      case 'Manufacture':
        // Special handling for manufacturing
        break;
    }
  }, [formData.purpose, setValue]);

  // Calculate totals when items change
  useEffect(() => {
    let totalOutgoing = 0;
    let totalIncoming = 0;

    formData.items?.forEach((item) => {
      if (item.s_warehouse) {
        totalOutgoing += item.amount || 0;
      }
      if (item.t_warehouse) {
        totalIncoming += item.amount || 0;
      }
    });

    setValue('total_outgoing_value', totalOutgoing);
    setValue('total_incoming_value', totalIncoming);
    setValue('value_difference', totalIncoming - totalOutgoing);
  }, [formData.items, setValue]);

  const purposeOptions = [
    'Material Issue',
    'Material Receipt', 
    'Material Transfer',
    'Material Transfer for Manufacture',
    'Material Consumption for Manufacture',
    'Manufacture',
    'Repack',
    'Send to Subcontractor',
  ];

  const addItem = () => {
    const newItem: Partial<StockEntryDetail> = {
      idx: (fields.length + 1),
      item_code: '',
      item_name: '',
      item_group: '',
      qty: 0,
      transfer_qty: 0,
      uom: '',
      stock_uom: '',
      conversion_factor: 1,
      basic_rate: 0,
      valuation_rate: 0,
      basic_amount: 0,
      amount: 0,
      additional_cost: 0,
    };

    // Set default warehouses based on purpose
    const purpose = formData.purpose as StockEntryPurpose;
    if (purpose === 'Material Issue' || purpose === 'Material Transfer') {
      newItem.s_warehouse = formData.from_warehouse;
    }
    if (purpose === 'Material Receipt' || purpose === 'Material Transfer') {
      newItem.t_warehouse = formData.to_warehouse;
    }

    append(newItem as StockEntryDetail);
  };

  const removeItem = (index: number) => {
    remove(index);
  };

  const handleSave = async (data: any) => {
    try {
      const savedEntry = await save(data);
      showApiSuccess('Stock Entry saved successfully');
      
      if (onSave) {
        onSave(savedEntry as StockEntry);
      }
    } catch (error) {
      showApiError(error, 'Failed to save stock entry');
    }
  };

  const handleCancel = () => {
    if (entry) {
      reset(entry);
    } else {
      reset();
    }
    
    if (onCancel) {
      onCancel();
    }
  };

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'attachments', label: 'Attachments' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {entryName ? `Stock Entry: ${entryName}` : 'New Stock Entry'}
            </h1>
            {entry && (
              <p className="text-sm text-gray-500 mt-1">
                {entry.purpose} - {entry.posting_date}
              </p>
            )}
          </div>
          
          <FormToolbar
            document={entry ? { 
              doctype: 'Stock Entry',
              name: entry.name,
              data: entry,
              meta: meta!,
              isDirty: methods.formState.isDirty,
              isSubmitted: entry.docstatus === 1,
              permissions: {
                read: true,
                write: !readOnly,
                create: !entryName,
                delete: !!entryName && !readOnly,
                submit: !!entryName && entry.docstatus === 0,
                cancel: !!entryName && entry.docstatus === 1,
                amend: false,
              },
              timeline: [],
              attachments: [],
            } : undefined}
            onSave={methods.handleSubmit(handleSave)}
            onSubmit={() => {}}
            onCancel={handleCancel}
            onPrint={() => {}}
            onEmail={() => {}}
            onShare={() => {}}
            isLoading={isSaving}
            isDirty={methods.formState.isDirty}
            readOnly={readOnly}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'details' && (
          <FormProvider {...methods}>
            <form className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-lg border border-gray-200">
                <FormSection
                  title="Basic Information"
                  fields={[
                    { fieldname: 'naming_series', fieldtype: 'Select', label: 'Series', reqd: true, options: 'STE-' },
                    { fieldname: 'purpose', fieldtype: 'Select', label: 'Purpose', reqd: true, options: purposeOptions.join('\n') },
                    { fieldname: 'stock_entry_type', fieldtype: 'Link', label: 'Stock Entry Type', options: 'Stock Entry Type' },
                    { fieldname: 'company', fieldtype: 'Link', label: 'Company', reqd: true, options: 'Company' },
                    { fieldname: 'posting_date', fieldtype: 'Date', label: 'Posting Date', reqd: true },
                    { fieldname: 'posting_time', fieldtype: 'Data', label: 'Posting Time' },
                    { fieldname: 'set_posting_time', fieldtype: 'Check', label: 'Edit Posting Date and Time' },
                  ]}
                  columns={2}
                  readOnly={readOnly}
                />
              </div>

              {/* Warehouse Information */}
              <div className="bg-white rounded-lg border border-gray-200">
                <FormSection
                  title="Warehouse Information"
                  fields={[
                    { fieldname: 'from_warehouse', fieldtype: 'Link', label: 'Default Source Warehouse', options: 'Warehouse' },
                    { fieldname: 'to_warehouse', fieldtype: 'Link', label: 'Default Target Warehouse', options: 'Warehouse' },
                    { fieldname: 'from_bom', fieldtype: 'Link', label: 'From BOM', options: 'BOM' },
                    { fieldname: 'bom_no', fieldtype: 'Link', label: 'BOM No', options: 'BOM' },
                    { fieldname: 'use_multi_level_bom', fieldtype: 'Check', label: 'Use Multi-Level BOM' },
                    { fieldname: 'fg_completed_qty', fieldtype: 'Float', label: 'For Quantity' },
                  ]}
                  columns={2}
                  readOnly={readOnly}
                />
              </div>

              {/* Items Table */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Items</h3>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={addItem}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Item
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UOM</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                        {!readOnly && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fields.map((field, index) => (
                        <tr key={field.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              {...methods.register(`items.${index}.item_code`)}
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="Item Code"
                              readOnly={readOnly}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              {...methods.register(`items.${index}.qty`, { valueAsNumber: true })}
                              type="number"
                              step="0.01"
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="0.00"
                              readOnly={readOnly}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              {...methods.register(`items.${index}.uom`)}
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="UOM"
                              readOnly={readOnly}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              {...methods.register(`items.${index}.basic_rate`, { valueAsNumber: true })}
                              type="number"
                              step="0.01"
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="0.00"
                              readOnly={readOnly}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              {...methods.register(`items.${index}.amount`, { valueAsNumber: true })}
                              type="number"
                              step="0.01"
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="0.00"
                              readOnly={readOnly}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              {...methods.register(`items.${index}.s_warehouse`)}
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="Source Warehouse"
                              readOnly={readOnly}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              {...methods.register(`items.${index}.t_warehouse`)}
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="Target Warehouse"
                              readOnly={readOnly}
                            />
                          </td>
                          {!readOnly && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-white rounded-lg border border-gray-200">
                <FormSection
                  title="Additional Information"
                  fields={[
                    { fieldname: 'project', fieldtype: 'Link', label: 'Project', options: 'Project' },
                    { fieldname: 'cost_center', fieldtype: 'Link', label: 'Cost Center', options: 'Cost Center' },
                    { fieldname: 'remarks', fieldtype: 'Text', label: 'Remarks' },
                  ]}
                  columns={2}
                  readOnly={readOnly}
                />
              </div>

              {/* Totals */}
              <div className="bg-white rounded-lg border border-gray-200">
                <FormSection
                  title="Totals"
                  fields={[
                    { fieldname: 'total_outgoing_value', fieldtype: 'Currency', label: 'Total Outgoing Value', readonly: true },
                    { fieldname: 'total_incoming_value', fieldtype: 'Currency', label: 'Total Incoming Value', readonly: true },
                    { fieldname: 'value_difference', fieldtype: 'Currency', label: 'Value Difference', readonly: true },
                    { fieldname: 'total_additional_costs', fieldtype: 'Currency', label: 'Total Additional Costs', readonly: true },
                  ]}
                  columns={2}
                  readOnly={true}
                />
              </div>
            </form>
          </FormProvider>
        )}

        {activeTab === 'timeline' && entry && (
          <div className="p-6">
            <Timeline
              entries={[]} // Will be populated by Timeline component
              attachments={[]}
              onAddComment={() => {}}
              onAddEmail={() => {}}
            />
          </div>
        )}

        {activeTab === 'attachments' && entry && (
          <div className="p-6">
            <AttachmentManager
              attachments={[]} // Will be populated by AttachmentManager component
              onUpload={() => {}}
              onDelete={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}