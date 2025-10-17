'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  PurchaseOrder, 
  PurchaseOrderItem, 
  PurchaseOrderTax, 
  Supplier 
} from '@/types/buying';
import { DynamicForm, FormToolbar, FormSection } from '@/components/forms';
import { useNotifications } from '@/hooks/useNotifications';
import { useDocuments } from '@/hooks/useDocuments';

// Validation Schema
const purchaseOrderItemSchema = z.object({
  item_code: z.string().min(1, 'Item code is required'),
  item_name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  qty: z.number().min(0.01, 'Quantity must be greater than 0'),
  rate: z.number().min(0, 'Rate must be non-negative'),
  uom: z.string().min(1, 'UOM is required'),
  warehouse: z.string().optional(),
  schedule_date: z.string().optional(),
  expected_delivery_date: z.string().optional(),
  discount_percentage: z.number().min(0).max(100).default(0),
  item_tax_template: z.string().optional(),
  expense_account: z.string().optional(),
  material_request: z.string().optional(),
  material_request_item: z.string().optional(),
});

const purchaseOrderTaxSchema = z.object({
  charge_type: z.enum(['On Net Total', 'On Previous Row Amount', 'On Previous Row Total', 'Actual']),
  account_head: z.string().min(1, 'Account head is required'),
  description: z.string().min(1, 'Description is required'),
  rate: z.number().optional(),
  tax_amount: z.number().default(0),
  included_in_print_rate: z.boolean().default(false),
  cost_center: z.string().optional(),
});

const purchaseOrderSchema = z.object({
  naming_series: z.string().default('PUR-ORD-.YYYY.-'),
  supplier: z.string().min(1, 'Supplier is required'),
  supplier_name: z.string().min(1, 'Supplier name is required'),
  transaction_date: z.string().min(1, 'Transaction date is required'),
  schedule_date: z.string().optional(),
  company: z.string().min(1, 'Company is required'),
  currency: z.string().default('INR'),
  conversion_rate: z.number().default(1),
  buying_price_list: z.string().min(1, 'Price list is required'),
  price_list_currency: z.string().default('INR'),
  plc_conversion_rate: z.number().default(1),
  ignore_pricing_rule: z.boolean().default(false),
  
  // Items
  items: z.array(purchaseOrderItemSchema).min(1, 'At least one item is required'),
  
  // Taxes
  taxes_and_charges: z.string().optional(),
  tax_category: z.string().optional(),
  taxes: z.array(purchaseOrderTaxSchema).default([]),
  
  // Additional fields
  cost_center: z.string().optional(),
  project: z.string().optional(),
  supplier_quotation: z.string().optional(),
  is_subcontracted: z.boolean().default(false),
  drop_ship: z.boolean().default(false),
  customer: z.string().optional(),
  sales_order: z.string().optional(),
  payment_terms_template: z.string().optional(),
  tc_name: z.string().optional(),
  terms: z.string().optional(),
  
  // Totals (calculated fields)
  total_qty: z.number().default(0),
  base_total: z.number().default(0),
  total: z.number().default(0),
  base_net_total: z.number().default(0),
  net_total: z.number().default(0),
  base_total_taxes_and_charges: z.number().default(0),
  total_taxes_and_charges: z.number().default(0),
  base_grand_total: z.number().default(0),
  grand_total: z.number().default(0),
  rounding_adjustment: z.number().default(0),
  rounded_total: z.number().default(0),
});

type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

interface PurchaseOrderFormProps {
  initialData?: Partial<PurchaseOrder>;
  onSave?: (data: PurchaseOrderFormData) => void;
  onSubmit?: (data: PurchaseOrderFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit' | 'view';
}

export default function PurchaseOrderForm({
  initialData,
  onSave,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create'
}: PurchaseOrderFormProps) {
  const { showNotification } = useNotifications();
  const { getDocument, getList } = useDocuments();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const form = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      naming_series: 'PUR-ORD-.YYYY.-',
      transaction_date: new Date().toISOString().split('T')[0],
      currency: 'INR',
      conversion_rate: 1,
      price_list_currency: 'INR',
      plc_conversion_rate: 1,
      ignore_pricing_rule: false,
      is_subcontracted: false,
      drop_ship: false,
      items: [{
        item_code: '',
        item_name: '',
        qty: 1,
        rate: 0,
        uom: '',
        discount_percentage: 0,
      }],
      taxes: [],
      total_qty: 0,
      base_total: 0,
      total: 0,
      base_net_total: 0,
      net_total: 0,
      base_total_taxes_and_charges: 0,
      total_taxes_and_charges: 0,
      base_grand_total: 0,
      grand_total: 0,
      rounding_adjustment: 0,
      rounded_total: 0,
      ...initialData,
    },
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const { fields: taxFields, append: appendTax, remove: removeTax } = useFieldArray({
    control: form.control,
    name: 'taxes',
  });

  const watchedSupplier = form.watch('supplier');
  const watchedItems = form.watch('items');
  const watchedTaxes = form.watch('taxes');
  const watchedDropShip = form.watch('drop_ship');

  // Load suppliers on component mount
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const response = await getList('Supplier', {
          fields: ['name', 'supplier_name', 'supplier_type', 'default_currency', 'default_price_list'],
          limit: 100,
        });
        setSuppliers(response.data);
      } catch (error) {
        console.error('Failed to load suppliers:', error);
        showNotification('Failed to load suppliers', 'error');
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
            form.setValue('price_list_currency', supplier.default_currency);
          }
          if (supplier.default_price_list) {
            form.setValue('buying_price_list', supplier.default_price_list);
          }
          form.setValue('supplier_name', supplier.supplier_name);
        } catch (error) {
          console.error('Failed to load supplier details:', error);
        }
      };

      loadSupplierDetails();
    }
  }, [watchedSupplier, getDocument, form]);

  // Calculate totals when items or taxes change
  useEffect(() => {
    calculateTotals();
  }, [watchedItems, watchedTaxes]);

  const calculateTotals = useCallback(() => {
    const items = form.getValues('items');
    const taxes = form.getValues('taxes');
    const conversionRate = form.getValues('conversion_rate') || 1;

    // Calculate item totals
    let totalQty = 0;
    let baseTotal = 0;
    let total = 0;

    items.forEach((item) => {
      const qty = item.qty || 0;
      const rate = item.rate || 0;
      const discountPercentage = item.discount_percentage || 0;
      
      totalQty += qty;
      const amount = qty * rate;
      const discountAmount = (amount * discountPercentage) / 100;
      const netAmount = amount - discountAmount;
      
      baseTotal += netAmount;
      total += netAmount / conversionRate;
    });

    // Calculate tax totals
    let baseTotalTaxes = 0;
    let totalTaxes = 0;

    taxes.forEach((tax) => {
      const taxAmount = tax.tax_amount || 0;
      baseTotalTaxes += taxAmount;
      totalTaxes += taxAmount / conversionRate;
    });

    // Calculate grand totals
    const baseGrandTotal = baseTotal + baseTotalTaxes;
    const grandTotal = total + totalTaxes;
    const roundedTotal = Math.round(grandTotal);
    const roundingAdjustment = roundedTotal - grandTotal;

    // Update form values
    form.setValue('total_qty', totalQty);
    form.setValue('base_total', baseTotal);
    form.setValue('total', total);
    form.setValue('base_net_total', baseTotal);
    form.setValue('net_total', total);
    form.setValue('base_total_taxes_and_charges', baseTotalTaxes);
    form.setValue('total_taxes_and_charges', totalTaxes);
    form.setValue('base_grand_total', baseGrandTotal);
    form.setValue('grand_total', grandTotal);
    form.setValue('rounding_adjustment', roundingAdjustment);
    form.setValue('rounded_total', roundedTotal);
  }, [form]);

  const handleAddItem = () => {
    appendItem({
      item_code: '',
      item_name: '',
      qty: 1,
      rate: 0,
      uom: '',
      discount_percentage: 0,
    });
  };

  const handleRemoveItem = (index: number) => {
    if (itemFields.length > 1) {
      removeItem(index);
    }
  };

  const handleAddTax = () => {
    appendTax({
      charge_type: 'On Net Total',
      account_head: '',
      description: '',
      rate: 0,
      tax_amount: 0,
      included_in_print_rate: false,
    });
  };

  const handleRemoveTax = (index: number) => {
    removeTax(index);
  };

  const handleSave = async (data: PurchaseOrderFormData) => {
    try {
      if (onSave) {
        await onSave(data);
        showNotification('Purchase Order saved successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to save purchase order:', error);
      showNotification('Failed to save purchase order', 'error');
    }
  };

  const handleSubmit = async (data: PurchaseOrderFormData) => {
    try {
      if (onSubmit) {
        await onSubmit(data);
        showNotification('Purchase Order submitted successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to submit purchase order:', error);
      showNotification('Failed to submit purchase order', 'error');
    }
  };

  const formSections = [
    {
      id: 'supplier_details',
      label: 'Supplier Details',
      collapsible: false,
      fields: [
        'naming_series', 'supplier', 'supplier_name', 
        'transaction_date', 'schedule_date', 'supplier_quotation'
      ]
    },
    {
      id: 'currency_and_price_list',
      label: 'Currency and Price List',
      collapsible: true,
      fields: [
        'currency', 'conversion_rate', 'buying_price_list', 
        'price_list_currency', 'plc_conversion_rate', 'ignore_pricing_rule'
      ]
    },
    {
      id: 'items',
      label: 'Items',
      collapsible: false,
      fields: ['items']
    },
    {
      id: 'taxes_and_charges',
      label: 'Taxes and Charges',
      collapsible: true,
      fields: ['taxes_and_charges', 'tax_category', 'taxes']
    },
    {
      id: 'totals',
      label: 'Totals',
      collapsible: false,
      fields: [
        'total_qty', 'base_total', 'total', 'base_net_total', 'net_total',
        'base_total_taxes_and_charges', 'total_taxes_and_charges',
        'base_grand_total', 'grand_total', 'rounding_adjustment', 'rounded_total'
      ]
    },
    {
      id: 'additional_info',
      label: 'Additional Information',
      collapsible: true,
      fields: [
        'company', 'cost_center', 'project', 'is_subcontracted',
        'drop_ship', 'customer', 'sales_order', 'payment_terms_template'
      ]
    },
    {
      id: 'terms_and_conditions',
      label: 'Terms and Conditions',
      collapsible: true,
      fields: ['tc_name', 'terms']
    }
  ];

  return (
    <div className="purchase-order-form">
      <FormToolbar
        title={mode === 'create' ? 'New Purchase Order' : 'Purchase Order'}
        onSave={form.handleSubmit(handleSave)}
        onSubmit={form.handleSubmit(handleSubmit)}
        onCancel={onCancel}
        isLoading={isLoading}
        canSave={mode !== 'view'}
        canSubmit={mode !== 'view'}
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
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Discount %</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Schedule Date</th>
                        {mode !== 'view' && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {itemFields.map((field, index) => {
                        const item = watchedItems[index];
                        const amount = (item?.qty || 0) * (item?.rate || 0);
                        const discountAmount = (amount * (item?.discount_percentage || 0)) / 100;
                        const netAmount = amount - discountAmount;

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
                            <td className="px-3 py-2">
                              <input
                                {...form.register(`items.${index}.discount_percentage`, { valueAsNumber: true })}
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                readOnly={mode === 'view'}
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <span className="text-sm font-medium">
                                {netAmount.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                {...form.register(`items.${index}.schedule_date`)}
                                type="date"
                                className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
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
            ) : section.id === 'taxes_and_charges' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Taxes and Charges Template
                    </label>
                    <input
                      {...form.register('taxes_and_charges')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Select template"
                      readOnly={mode === 'view'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Category
                    </label>
                    <input
                      {...form.register('tax_category')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Tax Category"
                      readOnly={mode === 'view'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-gray-900">Tax Details</h4>
                    {mode !== 'view' && (
                      <button
                        type="button"
                        onClick={handleAddTax}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Add Tax
                      </button>
                    )}
                  </div>

                  {taxFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 border border-gray-200 rounded">
                      <div>
                        <select
                          {...form.register(`taxes.${index}.charge_type`)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          disabled={mode === 'view'}
                        >
                          <option value="On Net Total">On Net Total</option>
                          <option value="On Previous Row Amount">On Previous Row Amount</option>
                          <option value="On Previous Row Total">On Previous Row Total</option>
                          <option value="Actual">Actual</option>
                        </select>
                      </div>
                      <div>
                        <input
                          {...form.register(`taxes.${index}.account_head`)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Account Head"
                          readOnly={mode === 'view'}
                        />
                      </div>
                      <div>
                        <input
                          {...form.register(`taxes.${index}.rate`, { valueAsNumber: true })}
                          type="number"
                          step="0.01"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Rate %"
                          readOnly={mode === 'view'}
                        />
                      </div>
                      <div>
                        <input
                          {...form.register(`taxes.${index}.tax_amount`, { valueAsNumber: true })}
                          type="number"
                          step="0.01"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Tax Amount"
                          readOnly={mode === 'view'}
                        />
                      </div>
                      {mode !== 'view' && (
                        <div>
                          <button
                            type="button"
                            onClick={() => handleRemoveTax(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : section.id === 'totals' ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Net Total</label>
                  <input
                    {...form.register('net_total', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Taxes</label>
                  <input
                    {...form.register('total_taxes_and_charges', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grand Total</label>
                  <input
                    {...form.register('grand_total', { valueAsNumber: true })}
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
                      {fieldConfig.type === 'select' ? (
                        <select
                          {...form.register(fieldName as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          disabled={mode === 'view'}
                        >
                          <option value="">Select {fieldConfig.label}</option>
                          {fieldConfig.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : fieldConfig.type === 'textarea' ? (
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

        {/* Drop Ship Section */}
        {watchedDropShip && (
          <FormSection title="Drop Ship Details" collapsible={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <input
                  {...form.register('customer')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Customer for drop ship"
                  readOnly={mode === 'view'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sales Order</label>
                <input
                  {...form.register('sales_order')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Related sales order"
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
    transaction_date: { label: 'Date', type: 'date' },
    schedule_date: { label: 'Required By', type: 'date' },
    supplier_quotation: { label: 'Supplier Quotation', type: 'text' },
    currency: { label: 'Currency', type: 'text' },
    conversion_rate: { label: 'Exchange Rate', type: 'number' },
    buying_price_list: { label: 'Price List', type: 'text' },
    price_list_currency: { label: 'Price List Currency', type: 'text' },
    plc_conversion_rate: { label: 'Price List Exchange Rate', type: 'number' },
    ignore_pricing_rule: { label: 'Ignore Pricing Rule', type: 'checkbox' },
    company: { label: 'Company', type: 'text' },
    cost_center: { label: 'Cost Center', type: 'text' },
    project: { label: 'Project', type: 'text' },
    is_subcontracted: { label: 'Is Subcontracted', type: 'checkbox' },
    drop_ship: { label: 'Drop Ship', type: 'checkbox' },
    customer: { label: 'Customer', type: 'text' },
    sales_order: { label: 'Sales Order', type: 'text' },
    payment_terms_template: { label: 'Payment Terms Template', type: 'text' },
    tc_name: { label: 'Terms Template', type: 'text' },
    terms: { label: 'Terms and Conditions', type: 'textarea' },
  };

  return configs[fieldName] || { label: fieldName, type: 'text' };
}