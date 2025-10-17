'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  DeliveryNote, 
  DeliveryNoteItem, 
  Customer 
} from '@/types/sales';
import { DynamicForm, FormToolbar, FormSection } from '@/components/forms';
import { useNotifications } from '@/hooks/useNotifications';
import { useDocuments } from '@/hooks/useDocuments';

// Validation Schema
const deliveryNoteItemSchema = z.object({
  item_code: z.string().min(1, 'Item code is required'),
  item_name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  qty: z.number().min(0.01, 'Quantity must be greater than 0'),
  rate: z.number().min(0, 'Rate must be non-negative'),
  uom: z.string().min(1, 'UOM is required'),
  warehouse: z.string().optional(),
  target_warehouse: z.string().optional(),
  serial_no: z.string().optional(),
  batch_no: z.string().optional(),
  quality_inspection: z.string().optional(),
  against_sales_order: z.string().optional(),
  so_detail: z.string().optional(),
  against_sales_invoice: z.string().optional(),
  si_detail: z.string().optional(),
});

const deliveryNoteSchema = z.object({
  naming_series: z.string().default('MAT-DN-.YYYY.-'),
  customer: z.string().min(1, 'Customer is required'),
  customer_name: z.string().min(1, 'Customer name is required'),
  posting_date: z.string().min(1, 'Posting date is required'),
  posting_time: z.string().default('12:00:00'),
  set_posting_time: z.boolean().default(false),
  company: z.string().min(1, 'Company is required'),
  currency: z.string().default('INR'),
  conversion_rate: z.number().default(1),
  
  // Items
  items: z.array(deliveryNoteItemSchema).min(1, 'At least one item is required'),
  
  // Delivery Information
  shipping_address_name: z.string().optional(),
  shipping_address: z.string().optional(),
  dispatch_address_name: z.string().optional(),
  dispatch_address: z.string().optional(),
  
  // Transport
  transporter: z.string().optional(),
  transporter_name: z.string().optional(),
  lr_no: z.string().optional(),
  lr_date: z.string().optional(),
  vehicle_no: z.string().optional(),
  
  // Additional fields
  cost_center: z.string().optional(),
  project: z.string().optional(),
  customer_po: z.string().optional(),
  po_date: z.string().optional(),
  
  // Totals (calculated fields)
  total_qty: z.number().default(0),
  base_total: z.number().default(0),
  total: z.number().default(0),
  net_total: z.number().default(0),
  base_net_total: z.number().default(0),
});

type DeliveryNoteFormData = z.infer<typeof deliveryNoteSchema>;

interface DeliveryNoteFormProps {
  initialData?: Partial<DeliveryNote>;
  onSave?: (data: DeliveryNoteFormData) => void;
  onSubmit?: (data: DeliveryNoteFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit' | 'view';
}

export default function DeliveryNoteForm({
  initialData,
  onSave,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create'
}: DeliveryNoteFormProps) {
  const { showNotification } = useNotifications();
  const { getDocument, getList } = useDocuments();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const form = useForm<DeliveryNoteFormData>({
    resolver: zodResolver(deliveryNoteSchema),
    defaultValues: {
      naming_series: 'MAT-DN-.YYYY.-',
      posting_date: new Date().toISOString().split('T')[0],
      posting_time: '12:00:00',
      set_posting_time: false,
      currency: 'INR',
      conversion_rate: 1,
      items: [{
        item_code: '',
        item_name: '',
        qty: 1,
        rate: 0,
        uom: '',
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

  const watchedCustomer = form.watch('customer');
  const watchedItems = form.watch('items');

  // Load customers on component mount
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await getList('Customer', {
          fields: ['name', 'customer_name', 'customer_type', 'default_currency'],
          limit: 100,
        });
        setCustomers(response.data);
      } catch (error) {
        console.error('Failed to load customers:', error);
        showNotification('Failed to load customers', 'error');
      }
    };

    loadCustomers();
  }, [getList, showNotification]);

  // Load customer details when customer changes
  useEffect(() => {
    if (watchedCustomer) {
      const loadCustomerDetails = async () => {
        try {
          const customer = await getDocument('Customer', watchedCustomer);
          setSelectedCustomer(customer);
          
          // Update form with customer defaults
          if (customer.default_currency) {
            form.setValue('currency', customer.default_currency);
          }
          form.setValue('customer_name', customer.customer_name);
        } catch (error) {
          console.error('Failed to load customer details:', error);
        }
      };

      loadCustomerDetails();
    }
  }, [watchedCustomer, getDocument, form]);

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
      const qty = item.qty || 0;
      const rate = item.rate || 0;
      
      totalQty += qty;
      const amount = qty * rate;
      
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
      rate: 0,
      uom: '',
    });
  };

  const handleRemoveItem = (index: number) => {
    if (itemFields.length > 1) {
      removeItem(index);
    }
  };

  const handleSave = async (data: DeliveryNoteFormData) => {
    try {
      if (onSave) {
        await onSave(data);
        showNotification('Delivery Note saved successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to save delivery note:', error);
      showNotification('Failed to save delivery note', 'error');
    }
  };

  const handleSubmit = async (data: DeliveryNoteFormData) => {
    try {
      if (onSubmit) {
        await onSubmit(data);
        showNotification('Delivery Note submitted successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to submit delivery note:', error);
      showNotification('Failed to submit delivery note', 'error');
    }
  };

  const formSections = [
    {
      id: 'customer_details',
      label: 'Customer and Posting Details',
      collapsible: false,
      fields: [
        'naming_series', 'customer', 'customer_name', 
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
      id: 'delivery_details',
      label: 'Delivery Details',
      collapsible: true,
      fields: [
        'shipping_address_name', 'shipping_address',
        'dispatch_address_name', 'dispatch_address'
      ]
    },
    {
      id: 'transport_details',
      label: 'Transport Details',
      collapsible: true,
      fields: [
        'transporter', 'transporter_name', 'lr_no', 'lr_date', 'vehicle_no'
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
      fields: ['company', 'cost_center', 'project', 'customer_po', 'po_date']
    }
  ];

  return (
    <div className="delivery-note-form">
      <FormToolbar
        onSave={form.handleSubmit(handleSave)}
        onSubmit={form.handleSubmit(handleSubmit)}
        onCancel={onCancel}
        onPrint={() => {}}
        onEmail={() => {}}
        onShare={() => {}}
        isLoading={isLoading}
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
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">UOM</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Serial/Batch</th>
                        {mode !== 'view' && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {itemFields.map((field, index) => {
                        const item = watchedItems[index];
                        const amount = (item?.qty || 0) * (item?.rate || 0);

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
                              <input
                                {...form.register(`items.${index}.warehouse`)}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Warehouse"
                                readOnly={mode === 'view'}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <div className="space-y-1">
                                <input
                                  {...form.register(`items.${index}.serial_no`)}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-xs"
                                  placeholder="Serial No"
                                  readOnly={mode === 'view'}
                                />
                                <input
                                  {...form.register(`items.${index}.batch_no`)}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-xs"
                                  placeholder="Batch No"
                                  readOnly={mode === 'view'}
                                />
                              </div>
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
      </form>
    </div>
  );
}

function getFieldConfig(fieldName: string) {
  const configs: Record<string, any> = {
    naming_series: { label: 'Series', type: 'text' },
    customer: { label: 'Customer', type: 'text' },
    customer_name: { label: 'Customer Name', type: 'text' },
    posting_date: { label: 'Posting Date', type: 'date' },
    posting_time: { label: 'Posting Time', type: 'time' },
    set_posting_time: { label: 'Edit Posting Date and Time', type: 'checkbox' },
    shipping_address_name: { label: 'Shipping Address', type: 'text' },
    shipping_address: { label: 'Shipping Address Display', type: 'textarea' },
    dispatch_address_name: { label: 'Dispatch Address', type: 'text' },
    dispatch_address: { label: 'Dispatch Address Display', type: 'textarea' },
    transporter: { label: 'Transporter', type: 'text' },
    transporter_name: { label: 'Transporter Name', type: 'text' },
    lr_no: { label: 'LR No', type: 'text' },
    lr_date: { label: 'LR Date', type: 'date' },
    vehicle_no: { label: 'Vehicle No', type: 'text' },
    company: { label: 'Company', type: 'text' },
    cost_center: { label: 'Cost Center', type: 'text' },
    project: { label: 'Project', type: 'text' },
    customer_po: { label: 'Customer PO', type: 'text' },
    po_date: { label: 'PO Date', type: 'date' },
  };

  return configs[fieldName] || { label: fieldName, type: 'text' };
}