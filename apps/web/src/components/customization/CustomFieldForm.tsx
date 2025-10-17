'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/forms/FormField';

// Field type options matching ERPNext's field types
const FIELD_TYPES = [
  { value: 'Data', label: 'Data' },
  { value: 'Text', label: 'Text' },
  { value: 'Long Text', label: 'Long Text' },
  { value: 'Text Editor', label: 'Text Editor' },
  { value: 'Select', label: 'Select' },
  { value: 'Link', label: 'Link' },
  { value: 'Table', label: 'Table' },
  { value: 'Check', label: 'Check' },
  { value: 'Date', label: 'Date' },
  { value: 'Datetime', label: 'Datetime' },
  { value: 'Time', label: 'Time' },
  { value: 'Int', label: 'Integer' },
  { value: 'Float', label: 'Float' },
  { value: 'Currency', label: 'Currency' },
  { value: 'Percent', label: 'Percent' },
  { value: 'Attach', label: 'Attach' },
  { value: 'Attach Image', label: 'Attach Image' },
  { value: 'Color', label: 'Color' },
  { value: 'Rating', label: 'Rating' },
  { value: 'Signature', label: 'Signature' },
  { value: 'Password', label: 'Password' },
  { value: 'Read Only', label: 'Read Only' },
  { value: 'HTML', label: 'HTML' },
  { value: 'Code', label: 'Code' },
  { value: 'JSON', label: 'JSON' },
];

// Validation schema for custom field
const customFieldSchema = z.object({
  fieldname: z.string()
    .min(1, 'Field name is required')
    .regex(/^[a-z][a-z0-9_]*$/, 'Field name must start with lowercase letter and contain only lowercase letters, numbers, and underscores'),
  label: z.string().min(1, 'Label is required'),
  fieldtype: z.string().min(1, 'Field type is required'),
  options: z.string().optional(),
  reqd: z.boolean().default(false),
  unique: z.boolean().default(false),
  readonly: z.boolean().default(false),
  hidden: z.boolean().default(false),
  no_copy: z.boolean().default(false),
  allow_in_quick_entry: z.boolean().default(false),
  in_list_view: z.boolean().default(false),
  in_standard_filter: z.boolean().default(false),
  in_global_search: z.boolean().default(false),
  bold: z.boolean().default(false),
  collapsible: z.boolean().default(false),
  collapsible_depends_on: z.string().optional(),
  depends_on: z.string().optional(),
  mandatory_depends_on: z.string().optional(),
  read_only_depends_on: z.string().optional(),
  default: z.string().optional(),
  description: z.string().optional(),
  width: z.string().optional(),
  columns: z.number().min(1).max(12).optional(),
  insert_after: z.string().optional(),
  permlevel: z.number().min(0).max(9).default(0),
  precision: z.number().min(0).max(9).optional(),
  length: z.number().min(1).optional(),
  fetch_from: z.string().optional(),
  fetch_if_empty: z.boolean().default(false),
  ignore_user_permissions: z.boolean().default(false),
  allow_on_submit: z.boolean().default(false),
  sort_options: z.boolean().default(false),
  in_preview: z.boolean().default(false),
  remember_last_selected_value: z.boolean().default(false),
  ignore_xss_filter: z.boolean().default(false),
  print_hide: z.boolean().default(false),
  print_hide_if_no_value: z.boolean().default(false),
  print_width: z.string().optional(),
  report_hide: z.boolean().default(false),
  non_negative: z.boolean().default(false),
  translatable: z.boolean().default(false),
});

type CustomFieldFormData = z.infer<typeof customFieldSchema>;

interface CustomFieldFormProps {
  doctype: string;
  onSubmit: (data: CustomFieldFormData) => void;
  onCancel: () => void;
  initialData?: Partial<CustomFieldFormData>;
  isEditing?: boolean;
}

export function CustomFieldForm({
  doctype,
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}: CustomFieldFormProps) {
  const [selectedFieldType, setSelectedFieldType] = useState(initialData?.fieldtype || '');
  
  const form = useForm<CustomFieldFormData>({
    resolver: zodResolver(customFieldSchema),
    defaultValues: {
      reqd: false,
      unique: false,
      readonly: false,
      hidden: false,
      no_copy: false,
      allow_in_quick_entry: false,
      in_list_view: false,
      in_standard_filter: false,
      in_global_search: false,
      bold: false,
      collapsible: false,
      permlevel: 0,
      fetch_if_empty: false,
      ignore_user_permissions: false,
      allow_on_submit: false,
      sort_options: false,
      in_preview: false,
      remember_last_selected_value: false,
      ignore_xss_filter: false,
      print_hide: false,
      print_hide_if_no_value: false,
      report_hide: false,
      non_negative: false,
      translatable: false,
      ...initialData,
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  const watchedFieldType = watch('fieldtype');

  // Update selected field type when form value changes
  React.useEffect(() => {
    setSelectedFieldType(watchedFieldType);
  }, [watchedFieldType]);

  // Show options field for Select and Link field types
  const showOptionsField = ['Select', 'Link'].includes(selectedFieldType);
  
  // Show precision field for Float and Currency field types
  const showPrecisionField = ['Float', 'Currency', 'Percent'].includes(selectedFieldType);
  
  // Show length field for Data field type
  const showLengthField = ['Data'].includes(selectedFieldType);

  const handleFormSubmit = (data: CustomFieldFormData) => {
    onSubmit(data);
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Edit Custom Field' : 'Add Custom Field'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          DocType: <span className="font-medium">{doctype}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Basic Information Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Name *
            </label>
            <Input
              {...register('fieldname')}
              placeholder="e.g., custom_field_name"
              disabled={isEditing}
              className={errors.fieldname ? 'border-red-500' : ''}
            />
            {errors.fieldname && (
              <p className="text-red-500 text-xs mt-1">{errors.fieldname.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Must start with lowercase letter, use only lowercase letters, numbers, and underscores
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label *
            </label>
            <Input
              {...register('label')}
              placeholder="Field Label"
              className={errors.label ? 'border-red-500' : ''}
            />
            {errors.label && (
              <p className="text-red-500 text-xs mt-1">{errors.label.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Type *
            </label>
            <select
              {...register('fieldtype')}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.fieldtype ? 'border-red-500' : ''
              }`}
            >
              <option value="">Select Field Type</option>
              {FIELD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.fieldtype && (
              <p className="text-red-500 text-xs mt-1">{errors.fieldtype.message}</p>
            )}
          </div>

          {showOptionsField && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Options {selectedFieldType === 'Select' ? '*' : ''}
              </label>
              <Input
                {...register('options')}
                placeholder={
                  selectedFieldType === 'Select'
                    ? 'Option 1\nOption 2\nOption 3'
                    : 'DocType Name'
                }
                className={errors.options ? 'border-red-500' : ''}
              />
              {errors.options && (
                <p className="text-red-500 text-xs mt-1">{errors.options.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {selectedFieldType === 'Select'
                  ? 'Enter each option on a new line'
                  : 'Enter the DocType name to link to'}
              </p>
            </div>
          )}
        </div>

        {/* Field Properties Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Field Properties</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('reqd')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Mandatory</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('unique')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Unique</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('readonly')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Read Only</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('hidden')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Hidden</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('in_list_view')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">In List View</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('in_standard_filter')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">In Standard Filter</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('bold')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Bold</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('allow_on_submit')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Allow on Submit</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('translatable')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Translatable</span>
            </label>
          </div>
        </div>

        {/* Advanced Properties Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Advanced Properties</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Value
              </label>
              <Input
                {...register('default')}
                placeholder="Default value"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Input
                {...register('description')}
                placeholder="Field description"
              />
            </div>

            {showPrecisionField && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precision
                </label>
                <Input
                  type="number"
                  {...register('precision', { valueAsNumber: true })}
                  placeholder="2"
                  min="0"
                  max="9"
                />
              </div>
            )}

            {showLengthField && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Length
                </label>
                <Input
                  type="number"
                  {...register('length', { valueAsNumber: true })}
                  placeholder="140"
                  min="1"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Columns
              </label>
              <Input
                type="number"
                {...register('columns', { valueAsNumber: true })}
                placeholder="6"
                min="1"
                max="12"
              />
              <p className="text-xs text-gray-500 mt-1">
                Width in grid columns (1-12)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Permission Level
              </label>
              <Input
                type="number"
                {...register('permlevel', { valueAsNumber: true })}
                placeholder="0"
                min="0"
                max="9"
              />
            </div>
          </div>
        </div>

        {/* Dependency Configuration Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Dependencies</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Depends On
              </label>
              <Input
                {...register('depends_on')}
                placeholder="eval:doc.field_name == 'value'"
              />
              <p className="text-xs text-gray-500 mt-1">
                JavaScript expression to control field visibility
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mandatory Depends On
              </label>
              <Input
                {...register('mandatory_depends_on')}
                placeholder="eval:doc.field_name == 'value'"
              />
              <p className="text-xs text-gray-500 mt-1">
                JavaScript expression to control when field is mandatory
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Read Only Depends On
              </label>
              <Input
                {...register('read_only_depends_on')}
                placeholder="eval:doc.field_name == 'value'"
              />
              <p className="text-xs text-gray-500 mt-1">
                JavaScript expression to control when field is read-only
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Update Field' : 'Add Field'}
          </Button>
        </div>
      </form>
    </Card>
  );
}