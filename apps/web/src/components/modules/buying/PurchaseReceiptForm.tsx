'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  PurchaseReceipt, 
  PurchaseReceiptItem, 
  Supplier 
} from '@/types/buying';
import { DynamicForm, FormToolbar, FormSection } from '@/components/forms';
import { useNotifications } from '@/hooks/useNotifications';
import { useDocuments } from '@/hooks/useDocuments';

// Validation Schema
const purchaseReceiptItemSchema = z.object({
  item_code: z.string().min(1, 'Item code is required'),
  item_name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  qty: z.number().min(0.01, 'Quantity must be greater than 0'),
  received_qty: z.number().min(0, 'Received quantity must be non-negative'),
  rejected_qty: z.number().min(0, 'Rejected quantity must be non-negative').default(0),
  rate: z.number().min(0, 'Rate must be non-negative'),
  uom: z.string().min(1, 'UOM is required'),
  warehouse: z.string().optional(),
  rejected_warehouse: z.string().optional(),
  serial_no: z.string().optional(),
  batch_no: z.string().optional(),
  quality_inspection: z.string().optional(),
  purchase_order: z.string().optional(),
  purchase_order_item: z.string().optional(),
  material_request: z.string().optional(),
  material_request_item: z.string().optional(),
  is_fixed_asset: z.boolean().default(false),
  asset_location: z.string().optional(),
  asset_category: z.string().optional(),
});

const purchaseReceiptSchema = z.object({
  naming_series: z.string().default('MAT-PRE-.YYYY.-'),
  supplier: z.string().min(1, 'Supplier is required'),
  supplier_name: z.string().min(1, 'Supplier name is required'),
  posting_date: z.string().min(1, 'Posting date is required'),
  posting_time: z.string().default('12:00:00'),
  set_posting_time: z.boolean().default(false),
  company: z.string().min(1, 'Company is required'),
  currency: z.string().default('INR'),
  conversion_rate: z.number().default(1),
  
  // Items
  items: z.array(purchaseReceiptItemSchema).min(1, 'At least one item is required'),
  
  // Supplier Information
  supplier_address: z.string().optional(),
  contact_person: z.string().optional(),
  contact_display: z.string().optional(),
  contact_mobile: z.string().optional(),
  contact_email: z.string().optional(),
  
  // Transport and Reference
  supplier_delivery_note: z.string().optional(),
  lr_no: z.string().optional(),
  lr_date: z.string().optional(),
  transporter_name: z.string().optional(),
  
  // Additional fields
  cost_center: z.string().optional(),
  project: z.string().optional(),
  is_subcontracted: z.boolean().default(false),
  supplier_warehouse: z.string().optional(),
  
  // Totals (calculated fields)
  total_qty: z.number().default(0),
  base_total: z.number().default(0),
  total: z.number().default(0),
  net_total: z.number().default(0),
  base_net_total: z.number().default(0),
});

type PurchaseReceiptFormData = z.infer<typeof purchaseReceiptSchema>;

interface PurchaseReceiptFormProps {
  initialData?: Partial<PurchaseReceipt>;
  onSave?: (data: PurchaseReceiptFormData) => void;
  onSubmit?: (data: PurchaseReceiptFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit' | 'view';
}

export default function PurchaseReceiptForm({
  initialData,
  onSave,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create'
}: PurchaseReceiptFormProps) {
  const { showNotification } = useNotifications();
  const { getDocument, getList } = useDocuments();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const form = useForm<PurchaseReceiptFormData>({
    resolver: zodResolver(purchaseReceiptSchema),
    defaultValues: {
      naming_series: 'MAT-PRE-.YYYY.-',
      posting_date: new Date().toISOString().split('T')[0],
      posting_time: '12:00:00',
      set_posting_time: false,
      currency: 'INR',
      conversion_rate: 1,
      is_subcontracted: false,
      items: [{
        item_code: '',
        item_name: '',
        qty: 1,
        received_qty: 1,
        rejected_qty: 0,
        rate: 0,
        uom: '',
        is_fixed_asset: false,
      }],
      total_qty: 0,
      base_total: 0,
      total: 0,
      net_total: 0,
      base_net_total: 0,
      ...initialData,
    },
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedSupplier = form.watch('supplier');
  const watchedItems = form.watch('items');
  const watchedIsSubcontracted = form.watch('is_subcontracted');

  // Load suppliers on component mount
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const response = await getList('Supplier', {
          fields: ['name', 'supplier_name', 'supplier_type', 'default_currency'],
          limit: 100,
        });
        setSuppliers(response.data);
      } catch (error) {
        console.error('Failed to load suppliers:', error);
        showNotification('error', 'Error', 'Failed to load suppliers');
      }
    };

    loadSuppliers();
  }, [getList, showNotification]);

  // Load supplier details when supplier changes
  useEffect(() => {
    if (watchedSupplier) {
      const loadSupplierDetails = async () => {
        try {
          const supplier = await getDocument('Supplier', watchedSupplier);
          setSelectedSupplier(supplier);
          
          // Update form with supplier defaults
          if (supplier.default_currency) {
            form.setValue('currency', supplier.default_currency);
          }
          form.setValue('supplier_name', supplier.supplier_name);
        } catch (error) {
          console.error('Failed to load supplier details:', error);
        }
      };

      loadSupplierDetails();
    }
  }, [watchedSupplier, getDocument, form]);

  // Calculate totals when items change
  useEffect(() => {
    calculateTotals();
  }, [watchedItems]);

  const calculateTotals = useCallback(() => {
    const items = form.getValues('items');
    const conversionRate = form.getValues('conversion_rate') || 1;

    // Calculate item totals
    let totalQty = 0;
    let baseTotal = 0;
    let total = 0;

    items.forEach((item) => {
      const receivedQty = item.received_qty || 0;
      const rate = item.rate || 0;
      
      totalQty += receivedQty;
      const amount = receivedQty * rate;
      
      baseTotal += amount;
      total += amount / conversionRate;
    });

    // Update form values
    form.setValue('total_qty', totalQty);
    form.setValue('base_total', baseTotal);
    form.setValue('total', total);
    form.setValue('base_net_total', baseTotal);
    form.setValue('net_total', total);
  }, [form]);

  const handleAddItem = () => {
    appendItem({
      item_code: '',
      item_name: '',
      qty: 1,
      received_qty: 1,
      rejected_qty: 0,
      rate: 0,
      uom: '',
      is_fixed_asset: false,
    });
  };

  const handleRemoveItem = (index: number) => {
    if (itemFields.length > 1) {
      removeItem(index);
    }
  };

  const handleSave = async (data: PurchaseReceiptFormData) => {
    try {
      if (onSave) {
        await onSave(data);
        showNotification('success', 'Success', 'Purchase Receipt saved successfully');
      }
    } catch (error) {
      console.error('Failed to save purchase receipt:', error);
      showNotification('error', 'Error', 'Failed to save purchase receipt');
    }
  };

  const handleSubmit = async (data: PurchaseReceiptFormData) => {
    try {
      if (onSubmit) {
        await onSubmit(data);
        showNotification('success', 'Success', 'Purchase Receipt submitted successfully');
      }
    } catch (error) {
      console.error('Failed to submit purchase receipt:', error);
      showNotification('error', 'Error', 'Failed to submit purchase receipt');
    }
  };

  const formSections = [
    {
      id: 'supplier_details',
      label: 'Supplier and Posting Details',
      collapsible: false,
      fields: [
        'naming_series', 'supplier', 'supplier_name', 
        'posting_date', 'posting_time', 'set_posting_time'
      ]
    },
    {
      id: 'items',
      label: 'Items',
      collapsible: false,
      fields: ['items']
    },
    {
      id: 'supplier_info',
      label: 'Supplier Information',
      collapsible: true,
      fields: [
        'supplier_address', 'contact_person', 'contact_display',
        'contact_mobile', 'contact_email'
      ]
    },
    {
      id: 'transport_details',
      label: 'Transport and Reference Details',
      collapsible: true,
      fields: [
        'supplier_delivery_note', 'lr_no', 'lr_date', 'transporter_name'
      ]
    },
    {
      id: 'totals',
      label: 'Totals',
      collapsible: false,
      fields: ['total_qty', 'base_total', 'total', 'base_net_total', 'net_total']
    },
    {
      id: 'additional_info',
      label: 'Additional Information',
      collapsible: true,
      fields: ['company', 'cost_center', 'project', 'is_subcontracted', 'supplier_warehouse']
    }
  ];

  return (
    <div className="purchase-receipt-form">
      <FormToolbar
        onSave={form.handleSubmit(handleSave)}
        onSubmit={form.handleSubmit(handleSubmit)}
        onCancel={onCancel}
        onPrint={() => {}}
        onEmail={() => {}}
        onShare={() => {}}
        isLoading={isLoading}
        readOnly={mode === 'view'}
      />

      <form className="space-y-6">
        {formSections.map((section) => (
          <FormSection
            key={section.id}
            title={section.label}
            collapsible={section.collapsible}
          >
            {section.id === 'items' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-900">Items</h4>
                  {mode !== 'view' && (
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add Item
                    </button>
                  )}
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ordered Qty</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Received Qty</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rejected Qty</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">UOM</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quality</th>
                        {mode !== 'view' && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {itemFields.map((field, index) => {
                        const item = watchedItems[index];
                        const amount = (item?.received_qty || 0) * (item?.rate || 0);

                        return (
                          <tr key={field.id}>
                            <td className="px-3 py-2">
                              <input
                                {...form.register(`items.${index}.item_code`)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Item Code"
                                readOnly={mode === 'view'}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                {...form.register(`items.${index}.item_name`)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Item Name"
                                readOnly={mode === 'view'}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                {...form.register(`items.${index}.qty`, { valueAsNumber: true })}
                                type="number"
                                step="0.01"
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                readOnly={mode === 'view'}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                {...form.register(`items.${index}.received_qty`, { valueAsNumber: true })}
                                type="number"
                                step="0.01"
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                readOnly={mode === 'view'}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                {...form.register(`items.${index}.rejected_qty`, { valueAsNumber: true })}
                                type="number"
                                step="0.01"
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                readOnly={mode === 'view'}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                {...form.register(`items.${index}.uom`)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="UOM"
                                readOnly={mode === 'view'}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                {...form.register(`items.${index}.rate`, { valueAsNumber: true })}
                                type="number"
                                step="0.01"
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                readOnly={mode === 'view'}
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <span className="text-sm font-medium">
                                {amount.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <div className="space-y-1">
                                <input
                                  {...form.register(`items.${index}.warehouse`)}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-xs"
                                  placeholder="Accepted"
                                  readOnly={mode === 'view'}
                                />
                                <input
                                  {...form.register(`items.${index}.rejected_warehouse`)}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-xs"
                                  placeholder="Rejected"
                                  readOnly={mode === 'view'}
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                {...form.register(`items.${index}.quality_inspection`)}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-xs"
                                placeholder="QI No"
                                readOnly={mode === 'view'}
                              />
                            </td>
                            {mode !== 'view' && (
                              <td className="px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                  disabled={itemFields.length === 1}
                                >
                                  Remove
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : section.id === 'totals' ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Qty</label>
                  <input
                    {...form.register('total_qty', { valueAsNumber: true })}
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Total</label>
                  <input
                    {...form.register('base_total', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                  <input
                    {...form.register('total', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Net Total</label>
                  <input
                    {...form.register('net_total', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-semibold"
                    readOnly
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.fields.map((fieldName) => {
                  const fieldConfig = getFieldConfig(fieldName);
                  return (
                    <div key={fieldName}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {fieldConfig.label}
                      </label>
                      {fieldConfig.type === 'textarea' ? (
                        <textarea
                          {...form.register(fieldName as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={3}
                          readOnly={mode === 'view'}
                        />
                      ) : fieldConfig.type === 'checkbox' ? (
                        <div className="flex items-center">
                          <input
                            {...form.register(fieldName as any)}
                            type="checkbox"
                            className="mr-2"
                            disabled={mode === 'view'}
                          />
                          <span className="text-sm text-gray-700">{fieldConfig.label}</span>
                        </div>
                      ) : (
                        <input
                          {...form.register(fieldName as any, fieldConfig.type === 'number' ? { valueAsNumber: true } : {})}
                          type={fieldConfig.type}
                          step={fieldConfig.type === 'number' ? '0.01' : undefined}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          readOnly={mode === 'view'}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </FormSection>
        ))}

        {/* Subcontracting Section */}
        {watchedIsSubcontracted && (
          <FormSection title="Subcontracting Details" collapsible={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Warehouse</label>
                <input
                  {...form.register('supplier_warehouse')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Supplier warehouse for subcontracting"
                  readOnly={mode === 'view'}
                />
              </div>
            </div>
          </FormSection>
        )}
      </form>
    </div>
  );
}

function getFieldConfig(fieldName: string) {
  const configs: Record<string, any> = {
    naming_series: { label: 'Series', type: 'text' },
    supplier: { label: 'Supplier', type: 'text' },
    supplier_name: { label: 'Supplier Name', type: 'text' },
    posting_date: { label: 'Posting Date', type: 'date' },
    posting_time: { label: 'Posting Time', type: 'time' },
    set_posting_time: { label: 'Edit Posting Date and Time', type: 'checkbox' },
    supplier_address: { label: 'Supplier Address', type: 'textarea' },
    contact_person: { label: 'Contact Person', type: 'text' },
    contact_display: { label: 'Contact Display', type: 'text' },
    contact_mobile: { label: 'Contact Mobile', type: 'text' },
    contact_email: { label: 'Contact Email', type: 'email' },
    supplier_delivery_note: { label: 'Supplier Delivery Note', type: 'text' },
    lr_no: { label: 'LR No', type: 'text' },
    lr_date: { label: 'LR Date', type: 'date' },
    transporter_name: { label: 'Transporter Name', type: 'text' },
    company: { label: 'Company', type: 'text' },
    cost_center: { label: 'Cost Center', type: 'text' },
    project: { label: 'Project', type: 'text' },
    is_subcontracted: { label: 'Is Subcontracted', type: 'checkbox' },
    supplier_warehouse: { label: 'Supplier Warehouse', type: 'text' },
  };

  return configs[fieldName] || { label: fieldName, type: 'text' };
}