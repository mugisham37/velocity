'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { MaterialRequest as MaterialRequestDoc, MaterialRequestItem, MaterialRequestType, MaterialRequestStatus, DocTypeSchema } from '@/types';
import { FormSection } from '@/components/forms/FormSection';
import { FormToolbar } from '@/components/forms/FormToolbar';
import { Timeline } from '@/components/forms/Timeline';
import { AttachmentManager } from '@/components/forms/AttachmentManager';
import { useDocument, useDocumentMeta } from '@/hooks/useDocuments';
import { useNotifications } from '@/hooks/useNotifications';
import { PlusIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface MaterialRequestProps {
  requestName?: string;
  onSave?: (request: MaterialRequestDoc) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

// Material Request validation schema
const materialRequestItemSchema = z.object({
  idx: z.number(),
  item_code: z.string().min(1, 'Item Code is required'),
  item_name: z.string(),
  description: z.string().optional(),
  item_group: z.string(),
  brand: z.string().optional(),
  qty: z.number().min(0.01, 'Quantity must be greater than 0'),
  stock_qty: z.number(),
  uom: z.string(),
  stock_uom: z.string(),
  conversion_factor: z.number().default(1),
  warehouse: z.string().optional(),
  from_warehouse: z.string().optional(),
  schedule_date: z.string().min(1, 'Schedule Date is required'),
  rate: z.number().optional(),
  amount: z.number().optional(),
  project: z.string().optional(),
  cost_center: z.string().optional(),
  sales_order: z.string().optional(),
  sales_order_item: z.string().optional(),
  ordered_qty: z.number().default(0),
  received_qty: z.number().default(0),
  stock_balance: z.number().optional(),
});

const materialRequestValidationSchema = z.object({
  naming_series: z.string().default('MR-'),
  material_request_type: z.string().min(1, 'Material Request Type is required'),
  company: z.string().min(1, 'Company is required'),
  transaction_date: z.string().min(1, 'Transaction Date is required'),
  schedule_date: z.string().min(1, 'Required By is required'),
  set_warehouse: z.string().optional(),
  set_from_warehouse: z.string().optional(),
  customer: z.string().optional(),
  cost_center: z.string().optional(),
  project: z.string().optional(),
  status: z.string().default('Draft'),
  per_ordered: z.number().default(0),
  per_received: z.number().default(0),
  items: z.array(materialRequestItemSchema).min(1, 'At least one item is required'),
});

export function MaterialRequest({ requestName, onSave, onCancel, readOnly = false }: MaterialRequestProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const { showApiError, showApiSuccess } = useNotifications();
  
  // Use the document hooks
  const { doc: request, isLoading, save, isSaving, submit, isSubmitting } = useDocument('Material Request', requestName || '', !!requestName);
  const { meta } = useDocumentMeta('Material Request');

  // Initialize form
  const methods = useForm<z.infer<typeof materialRequestValidationSchema>>({
    resolver: zodResolver(materialRequestValidationSchema),
    defaultValues: request || {
      naming_series: 'MR-',
      transaction_date: new Date().toISOString().split('T')[0],
      schedule_date: new Date().toISOString().split('T')[0],
      status: 'Draft',
      per_ordered: 0,
      per_received: 0,
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

  // Reset form when request data changes
  useEffect(() => {
    if (request) {
      reset(request);
    }
  }, [request, reset]);

  // Handle material request type changes
  useEffect(() => {
    const requestType = formData.material_request_type as string;
    
    // Set default warehouses and fields based on type
    switch (requestType) {
      case 'Purchase':
        // Clear warehouses for purchase requests
        setValue('set_warehouse', '');
        setValue('set_from_warehouse', '');
        break;
      case 'Material Transfer':
        // Both warehouses may be needed
        break;
      case 'Material Issue':
        // Only from warehouse needed
        setValue('set_warehouse', '');
        break;
      case 'Manufacture':
        // Manufacturing specific settings
        break;
    }
  }, [formData.material_request_type, setValue]);

  // Calculate percentages when items change
  useEffect(() => {
    if (formData.items?.length > 0) {
      let totalQty = 0;
      let orderedQty = 0;
      let receivedQty = 0;

      formData.items.forEach((item: any) => {
        totalQty += item.qty || 0;
        orderedQty += item.ordered_qty || 0;
        receivedQty += item.received_qty || 0;
      });

      const perOrdered = totalQty > 0 ? (orderedQty / totalQty) * 100 : 0;
      const perReceived = totalQty > 0 ? (receivedQty / totalQty) * 100 : 0;

      setValue('per_ordered', perOrdered);
      setValue('per_received', perReceived);
    }
  }, [formData.items, setValue]);

  const requestTypeOptions = [
    'Purchase',
    'Material Transfer',
    'Material Issue',
    'Manufacture',
    'Customer Provided',
  ];

  const addItem = () => {
    const newItem = {
      idx: (fields.length + 1),
      item_code: '',
      item_name: '',
      item_group: '',
      qty: 0,
      stock_qty: 0,
      uom: '',
      stock_uom: '',
      conversion_factor: 1,
      schedule_date: formData.schedule_date || new Date().toISOString().split('T')[0],
      ordered_qty: 0,
      received_qty: 0,
      warehouse: formData.set_warehouse || '',
      from_warehouse: formData.set_from_warehouse || '',
    };

    append(newItem);
  };

  const removeItem = (index: number) => {
    remove(index);
  };

  const handleSave = async (data: unknown) => {
    try {
      const savedRequest = await save(data as Record<string, unknown>);
      showApiSuccess('Material Request saved successfully');
      
      if (onSave) {
        onSave(savedRequest as unknown as MaterialRequestDoc);
      }
    } catch (error) {
      showApiError(error, 'Failed to save material request');
    }
  };

  const handleSubmit = async () => {
    if (!request) return;
    
    try {
      await submit();
      showApiSuccess('Material Request submitted successfully');
    } catch (error) {
      showApiError(error, 'Failed to submit material request');
    } finally {
      setShowApprovalDialog(false);
    }
  };

  const handleCancel = () => {
    if (request) {
      reset(request);
    } else {
      reset();
    }
    
    if (onCancel) {
      onCancel();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Submitted':
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Partially Ordered':
        return 'bg-blue-100 text-blue-800';
      case 'Ordered':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-semibold text-gray-900">
                {requestName ? `Material Request: ${requestName}` : 'New Material Request'}
              </h1>
              {request && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor((request as any).status)}`}>
                  {(request as any).status}
                </span>
              )}
            </div>
            {request && (
              <p className="text-sm text-gray-500 mt-1">
                {(request as any).material_request_type} - {(request as any).transaction_date}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {request && request.docstatus === 0 && (
              <button
                onClick={() => setShowApprovalDialog(true)}
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <CheckIcon className="h-4 w-4 mr-2" />
                )}
                Submit for Approval
              </button>
            )}
            
            <FormToolbar
              document={request ? { 
                doctype: 'Material Request',
                name: (request as any).name,
                data: request,
                meta: meta as any,
                isDirty: methods.formState.isDirty,
                isSubmitted: (request as any).docstatus === 1,
                permissions: {
                  read: true,
                  write: !readOnly,
                  create: !requestName,
                  delete: !!requestName && !readOnly,
                  submit: !!requestName && (request as any).docstatus === 0,
                  cancel: !!requestName && (request as any).docstatus === 1,
                  amend: false,
                },
                timeline: [],
                attachments: [],
              } as any : undefined}
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
                    { fieldname: 'naming_series', fieldtype: 'Select', label: 'Series', reqd: true, options: 'MR-' },
                    { fieldname: 'material_request_type', fieldtype: 'Select', label: 'Material Request Type', reqd: true, options: requestTypeOptions.join('\n') },
                    { fieldname: 'company', fieldtype: 'Link', label: 'Company', reqd: true, options: 'Company' },
                    { fieldname: 'transaction_date', fieldtype: 'Date', label: 'Transaction Date', reqd: true },
                    { fieldname: 'schedule_date', fieldtype: 'Date', label: 'Required By', reqd: true },
                    { fieldname: 'customer', fieldtype: 'Link', label: 'Customer', options: 'Customer' },
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
                    { fieldname: 'set_warehouse', fieldtype: 'Link', label: 'Set Warehouse', options: 'Warehouse' },
                    { fieldname: 'set_from_warehouse', fieldtype: 'Link', label: 'Set From Warehouse', options: 'Warehouse' },
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
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
                              {...methods.register(`items.${index}.schedule_date`)}
                              type="date"
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              readOnly={readOnly}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              {...methods.register(`items.${index}.warehouse`)}
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="Warehouse"
                              readOnly={readOnly}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              {...methods.register(`items.${index}.ordered_qty`, { valueAsNumber: true })}
                              type="number"
                              step="0.01"
                              className="block w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                              placeholder="0.00"
                              readOnly
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              {...methods.register(`items.${index}.received_qty`, { valueAsNumber: true })}
                              type="number"
                              step="0.01"
                              className="block w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                              placeholder="0.00"
                              readOnly
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
                  ]}
                  columns={2}
                  readOnly={readOnly}
                />
              </div>

              {/* Status Information */}
              {request && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <FormSection
                    title="Status"
                    fields={[
                      { fieldname: 'status', fieldtype: 'Data', label: 'Status', readonly: true },
                      { fieldname: 'per_ordered', fieldtype: 'Float', label: '% Ordered', readonly: true },
                      { fieldname: 'per_received', fieldtype: 'Float', label: '% Received', readonly: true },
                    ]}
                    columns={3}
                    readOnly={true}
                  />
                </div>
              )}
            </form>
          </FormProvider>
        )}

        {activeTab === 'timeline' && request && (
          <div className="p-6">
            <Timeline
              entries={[]} // Will be populated by Timeline component
              attachments={[]}
              onAddComment={() => {}}
              onAddEmail={() => {}}
            />
          </div>
        )}

        {activeTab === 'attachments' && request && (
          <div className="p-6">
            <AttachmentManager
              attachments={[]} // Will be populated by AttachmentManager component
              onUpload={() => {}}
              onDelete={() => {}}
            />
          </div>
        )}
      </div>

      {/* Approval Dialog */}
      {showApprovalDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <CheckIcon className="mx-auto h-12 w-12 text-green-600" />
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                Submit Material Request
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to submit this material request for approval? 
                  Once submitted, you won't be able to edit it.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:opacity-50"
                >
                  {isSubmitting ? '...' : 'Submit'}
                </button>
                <button
                  onClick={() => setShowApprovalDialog(false)}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}