'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Item, ItemAttribute, DocTypeSchema, FieldType } from '@/types';
import { FormSection } from '@/components/forms/FormSection';
import { FormToolbar } from '@/components/forms/FormToolbar';
import { Timeline } from '@/components/forms/Timeline';
import { AttachmentManager } from '@/components/forms/AttachmentManager';
import { useDocument, useDocumentMeta } from '@/hooks/useDocuments';
import { useNotifications } from '@/hooks/useNotifications';

interface ItemMasterProps {
  itemName?: string;
  onSave?: (item: Item) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

// Item validation schema matching ERPNext's validation rules
const itemValidationSchema = z.object({
  item_code: z.string().min(1, 'Item Code is required'),
  item_name: z.string().min(1, 'Item Name is required'),
  item_group: z.string().min(1, 'Item Group is required'),
  description: z.string().optional(),
  brand: z.string().optional(),
  uom: z.string().min(1, 'UOM is required'),
  maintain_stock: z.boolean().default(true),
  is_stock_item: z.boolean().default(true),
  include_item_in_manufacturing: z.boolean().default(false),
  is_fixed_asset: z.boolean().default(false),
  auto_create_assets: z.boolean().default(false),
  asset_category: z.string().optional(),
  asset_naming_series: z.string().optional(),
  
  // Inventory settings
  valuation_method: z.enum(['FIFO', 'Moving Average']).default('FIFO'),
  default_warehouse: z.string().optional(),
  shelf_life_in_days: z.number().optional(),
  end_of_life: z.string().optional(),
  disabled: z.boolean().default(false),
  
  // Variant settings
  has_variants: z.boolean().default(false),
  variant_of: z.string().optional(),
  variant_based_on: z.string().optional(),
  attributes: z.array(z.object({
    attribute: z.string(),
    attribute_value: z.string(),
  })).optional(),
  
  // Serial and Batch settings
  has_serial_no: z.boolean().default(false),
  serial_no_series: z.string().optional(),
  has_batch_no: z.boolean().default(false),
  create_new_batch: z.boolean().default(false),
  batch_number_series: z.string().optional(),
  
  // Pricing
  standard_rate: z.number().optional(),
  
  // Tax and accounting
  item_tax_template: z.string().optional(),
  tax_code: z.string().optional(),
  
  // Purchase settings
  is_purchase_item: z.boolean().default(true),
  purchase_uom: z.string().optional(),
  min_order_qty: z.number().optional(),
  safety_stock: z.number().optional(),
  lead_time_days: z.number().optional(),
  last_purchase_rate: z.number().optional(),
  
  // Sales settings
  is_sales_item: z.boolean().default(true),
  sales_uom: z.string().optional(),
  max_discount: z.number().optional(),
  
  // Manufacturing settings
  default_bom: z.string().optional(),
  
  // Quality settings
  inspection_required_before_purchase: z.boolean().default(false),
  inspection_required_before_delivery: z.boolean().default(false),
  quality_inspection_template: z.string().optional(),
  
  // Website settings
  show_in_website: z.boolean().default(false),
  route: z.string().optional(),
  weightage: z.number().optional(),
});

export function ItemMaster({ itemName, onSave, onCancel, readOnly = false }: ItemMasterProps) {
  const [activeTab, setActiveTab] = useState('details');
  const { showApiError, showApiSuccess } = useNotifications();
  
  // Use the document hooks
  const { doc: item, isLoading, save, isSaving } = useDocument('Item', itemName || '', !!itemName);
  const { meta } = useDocumentMeta('Item');

  // Initialize form
  const methods = useForm({
    resolver: zodResolver(itemValidationSchema),
    defaultValues: item || {
      maintain_stock: true,
      is_stock_item: true,
      include_item_in_manufacturing: false,
      is_fixed_asset: false,
      auto_create_assets: false,
      valuation_method: 'FIFO',
      disabled: false,
      has_variants: false,
      has_serial_no: false,
      create_new_batch: false,
      is_purchase_item: true,
      is_sales_item: true,
      inspection_required_before_purchase: false,
      inspection_required_before_delivery: false,
      show_in_website: false,
    },
    mode: 'onChange',
  });

  const { watch, reset, setValue } = methods;
  const formData = watch();

  // Reset form when item data changes
  useEffect(() => {
    if (item) {
      reset(item);
    }
  }, [item, reset]);

  // Handle dependent field logic
  useEffect(() => {
    // Auto-set item name if not provided
    if (formData.item_code && !formData.item_name) {
      setValue('item_name', formData.item_code);
    }

    // Handle stock item dependencies
    if (!formData.is_stock_item) {
      setValue('maintain_stock', false);
      setValue('has_serial_no', false);
      setValue('has_batch_no', false);
      setValue('valuation_method', 'FIFO');
    }

    // Handle variant dependencies
    if (formData.has_variants) {
      setValue('is_stock_item', false);
      setValue('maintain_stock', false);
    }

    // Handle fixed asset dependencies
    if (formData.is_fixed_asset) {
      setValue('is_stock_item', false);
      setValue('maintain_stock', false);
    }

    // Handle serial number dependencies
    if (formData.has_serial_no && formData.has_batch_no) {
      // ERPNext doesn't allow both serial and batch
      setValue('has_batch_no', false);
    }
  }, [formData, setValue]);

  // Form sections configuration
  const formSections = useMemo(() => [
    {
      id: 'basic',
      label: 'Basic Information',
      fields: [
        'item_code', 'item_name', 'item_group', 'description', 
        'brand', 'uom', 'disabled'
      ]
    },
    {
      id: 'inventory',
      label: 'Inventory Settings',
      fields: [
        'maintain_stock', 'is_stock_item', 'valuation_method', 
        'default_warehouse', 'shelf_life_in_days', 'end_of_life'
      ]
    },
    {
      id: 'variants',
      label: 'Variants',
      fields: [
        'has_variants', 'variant_of', 'variant_based_on', 'attributes'
      ]
    },
    {
      id: 'serial_batch',
      label: 'Serial No and Batch',
      fields: [
        'has_serial_no', 'serial_no_series', 'has_batch_no', 
        'create_new_batch', 'batch_number_series'
      ]
    },
    {
      id: 'purchase',
      label: 'Purchase Details',
      fields: [
        'is_purchase_item', 'purchase_uom', 'min_order_qty', 
        'safety_stock', 'lead_time_days', 'last_purchase_rate'
      ]
    },
    {
      id: 'sales',
      label: 'Sales Details',
      fields: [
        'is_sales_item', 'sales_uom', 'max_discount'
      ]
    },
    {
      id: 'manufacturing',
      label: 'Manufacturing',
      fields: [
        'include_item_in_manufacturing', 'default_bom'
      ]
    },
    {
      id: 'accounting',
      label: 'Accounting',
      fields: [
        'standard_rate', 'item_tax_template', 'tax_code'
      ]
    },
    {
      id: 'quality',
      label: 'Quality',
      fields: [
        'inspection_required_before_purchase', 
        'inspection_required_before_delivery', 
        'quality_inspection_template'
      ]
    },
    {
      id: 'website',
      label: 'Website',
      fields: [
        'show_in_website', 'route', 'weightage'
      ]
    },
    {
      id: 'assets',
      label: 'Fixed Assets',
      fields: [
        'is_fixed_asset', 'auto_create_assets', 
        'asset_category', 'asset_naming_series'
      ]
    }
  ], []);

  const handleSave = async (data: any) => {
    try {
      const savedItem = await save(data);
      showApiSuccess('Item saved successfully');
      
      if (onSave) {
        onSave(savedItem as unknown as Item);
      }
    } catch (error) {
      showApiError(error, 'Failed to save item');
    }
  };

  const handleCancel = () => {
    if (item) {
      reset(item);
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
              {itemName ? `Item: ${formData.item_code || itemName}` : 'New Item'}
            </h1>
            {item && (
              <p className="text-sm text-gray-500 mt-1">
                {(item as any).item_name}
              </p>
            )}
          </div>
          
          <FormToolbar
            document={item ? { 
              doctype: 'Item',
              name: (item as any).name,
              data: item,
              meta: meta as any,
              isDirty: methods.formState.isDirty,
              isSubmitted: (item as any).docstatus === 1,
              permissions: {
                read: true,
                write: !readOnly,
                create: !itemName,
                delete: !!itemName && !readOnly,
                submit: false,
                cancel: false,
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
              {formSections.map((section) => {
                // Filter fields that should be visible based on current form state
                const visibleFields = section.fields.filter(fieldName => {
                  switch (fieldName) {
                    case 'variant_of':
                    case 'variant_based_on':
                    case 'attributes':
                      return formData.has_variants;
                    case 'serial_no_series':
                      return formData.has_serial_no;
                    case 'batch_number_series':
                      return formData.has_batch_no && formData.create_new_batch;
                    case 'purchase_uom':
                    case 'min_order_qty':
                    case 'safety_stock':
                    case 'lead_time_days':
                    case 'last_purchase_rate':
                      return formData.is_purchase_item;
                    case 'sales_uom':
                    case 'max_discount':
                      return formData.is_sales_item;
                    case 'default_bom':
                      return formData.include_item_in_manufacturing;
                    case 'asset_category':
                    case 'asset_naming_series':
                      return formData.is_fixed_asset;
                    case 'route':
                    case 'weightage':
                      return formData.show_in_website;
                    case 'quality_inspection_template':
                      return formData.inspection_required_before_purchase || 
                             formData.inspection_required_before_delivery;
                    default:
                      return true;
                  }
                });

                if (visibleFields.length === 0) return null;

                return (
                  <div key={section.id} className="bg-white rounded-lg border border-gray-200">
                    <FormSection
                      title={section.label}
                      fields={visibleFields.map(fieldName => ({
                        fieldname: fieldName,
                        fieldtype: getFieldType(fieldName) as FieldType,
                        label: getFieldLabel(fieldName),
                        reqd: isRequiredField(fieldName),
                        options: getFieldOptions(fieldName),
                      }))}
                      columns={2}
                      readOnly={readOnly}
                    />
                  </div>
                );
              })}
            </form>
          </FormProvider>
        )}

        {activeTab === 'timeline' && item && (
          <div className="p-6">
            <Timeline
              entries={[]} // Will be populated by Timeline component
              attachments={[]}
              onAddComment={() => {}}
              onAddEmail={() => {}}
            />
          </div>
        )}

        {activeTab === 'attachments' && item && (
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

// Helper functions for field configuration
function getFieldType(fieldName: string): string {
  const fieldTypeMap: Record<string, string> = {
    item_code: 'Data',
    item_name: 'Data',
    item_group: 'Link',
    description: 'Text',
    brand: 'Link',
    uom: 'Link',
    maintain_stock: 'Check',
    is_stock_item: 'Check',
    valuation_method: 'Select',
    default_warehouse: 'Link',
    shelf_life_in_days: 'Int',
    end_of_life: 'Date',
    disabled: 'Check',
    has_variants: 'Check',
    variant_of: 'Link',
    variant_based_on: 'Select',
    has_serial_no: 'Check',
    serial_no_series: 'Link',
    has_batch_no: 'Check',
    create_new_batch: 'Check',
    batch_number_series: 'Link',
    standard_rate: 'Currency',
    item_tax_template: 'Link',
    tax_code: 'Data',
    is_purchase_item: 'Check',
    purchase_uom: 'Link',
    min_order_qty: 'Float',
    safety_stock: 'Float',
    lead_time_days: 'Int',
    last_purchase_rate: 'Currency',
    is_sales_item: 'Check',
    sales_uom: 'Link',
    max_discount: 'Percent',
    include_item_in_manufacturing: 'Check',
    default_bom: 'Link',
    inspection_required_before_purchase: 'Check',
    inspection_required_before_delivery: 'Check',
    quality_inspection_template: 'Link',
    show_in_website: 'Check',
    route: 'Data',
    weightage: 'Int',
    is_fixed_asset: 'Check',
    auto_create_assets: 'Check',
    asset_category: 'Link',
    asset_naming_series: 'Select',
  };
  
  return fieldTypeMap[fieldName] || 'Data';
}

function getFieldLabel(fieldName: string): string {
  const labelMap: Record<string, string> = {
    item_code: 'Item Code',
    item_name: 'Item Name',
    item_group: 'Item Group',
    description: 'Description',
    brand: 'Brand',
    uom: 'Default Unit of Measure',
    maintain_stock: 'Maintain Stock',
    is_stock_item: 'Is Stock Item',
    valuation_method: 'Valuation Method',
    default_warehouse: 'Default Warehouse',
    shelf_life_in_days: 'Shelf Life In Days',
    end_of_life: 'End of Life',
    disabled: 'Disabled',
    has_variants: 'Has Variants',
    variant_of: 'Variant Of',
    variant_based_on: 'Variant Based On',
    has_serial_no: 'Has Serial No',
    serial_no_series: 'Serial Number Series',
    has_batch_no: 'Has Batch No',
    create_new_batch: 'Automatically Create New Batch',
    batch_number_series: 'Batch Number Series',
    standard_rate: 'Standard Selling Rate',
    item_tax_template: 'Item Tax Template',
    tax_code: 'Tax Code',
    is_purchase_item: 'Is Purchase Item',
    purchase_uom: 'Default Purchase Unit of Measure',
    min_order_qty: 'Minimum Order Qty',
    safety_stock: 'Safety Stock',
    lead_time_days: 'Lead Time Days',
    last_purchase_rate: 'Last Purchase Rate',
    is_sales_item: 'Is Sales Item',
    sales_uom: 'Default Sales Unit of Measure',
    max_discount: 'Max Discount (%)',
    include_item_in_manufacturing: 'Include Item In Manufacturing',
    default_bom: 'Default BOM',
    inspection_required_before_purchase: 'Inspection Required before Purchase',
    inspection_required_before_delivery: 'Inspection Required before Delivery',
    quality_inspection_template: 'Quality Inspection Template',
    show_in_website: 'Show in Website',
    route: 'Route',
    weightage: 'Weightage',
    is_fixed_asset: 'Is Fixed Asset',
    auto_create_assets: 'Auto Create Assets on Purchase',
    asset_category: 'Asset Category',
    asset_naming_series: 'Asset Naming Series',
  };
  
  return labelMap[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function isRequiredField(fieldName: string): boolean {
  const requiredFields = ['item_code', 'item_name', 'item_group', 'uom'];
  return requiredFields.includes(fieldName);
}

function getFieldOptions(fieldName: string): string | undefined {
  const optionsMap: Record<string, string> = {
    valuation_method: 'FIFO\nMoving Average',
    variant_based_on: 'Item Attribute\nManufacturer',
    item_group: 'Item Group',
    brand: 'Brand',
    uom: 'UOM',
    default_warehouse: 'Warehouse',
    purchase_uom: 'UOM',
    sales_uom: 'UOM',
    variant_of: 'Item',
    serial_no_series: 'Series',
    batch_number_series: 'Series',
    item_tax_template: 'Item Tax Template',
    default_bom: 'BOM',
    quality_inspection_template: 'Quality Inspection Template',
    asset_category: 'Asset Category',
    asset_naming_series: 'Series',
  };
  
  return optionsMap[fieldName];
}