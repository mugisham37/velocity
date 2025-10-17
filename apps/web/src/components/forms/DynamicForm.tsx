'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DocTypeSchema, DocField, DocumentState } from '@/types';
import { FormSection } from './FormSection';
import { evaluateDependsOn } from '@/lib/utils/form-utils';

interface FormSectionConfig {
  label?: string;
  fields: string[];
  collapsible?: boolean;
}

interface ProcessedFormSection {
  label?: string;
  fields: DocField[];
  collapsible?: boolean;
}

interface DynamicFormProps {
  id?: string;
  doctype?: string;
  meta?: DocTypeSchema;
  schema?: any;
  form?: any;
  document?: DocumentState;
  data?: Record<string, unknown>;
  onSubmit?: (data: Record<string, unknown>) => void;
  onChange?: (data: Record<string, unknown>) => void;
  readOnly?: boolean;
  className?: string;
}

export function DynamicForm({
  id,
  doctype,
  meta,
  schema,
  form,
  document,
  data,
  onSubmit,
  onChange,
  readOnly = false,
  className,
}: DynamicFormProps) {
  // doctype is kept for potential future use and API compatibility
  // Create dynamic validation schema based on DocType fields
  const validationSchema = useMemo(() => {
    const fieldsToUse = meta?.fields || schema?.fields || [];
    if (fieldsToUse.length === 0) return z.object({});

    const schemaFields: Record<string, z.ZodTypeAny> = {};

    fieldsToUse.forEach((field: DocField) => {
      let fieldSchema: z.ZodTypeAny;

      switch (field.fieldtype) {
        case 'Data':
        case 'Text':
        case 'Text Editor':
        case 'Link':
        case 'Select':
          fieldSchema = z.string();
          break;
        case 'Int':
          fieldSchema = z.number().int();
          break;
        case 'Float':
        case 'Currency':
          fieldSchema = z.number();
          break;
        case 'Check':
          fieldSchema = z.boolean();
          break;
        case 'Date':
        case 'Datetime':
          fieldSchema = z.string().or(z.date());
          break;
        case 'Table':
          fieldSchema = z.array(z.record(z.string(), z.unknown()));
          break;
        case 'Attach':
          fieldSchema = z.string().optional();
          break;
        default:
          fieldSchema = z.unknown();
      }

      // Make field required if specified
      if (field.reqd) {
        if (field.fieldtype === 'Check') {
          fieldSchema = fieldSchema;
        } else {
          fieldSchema = fieldSchema.refine(
            (val) => val !== undefined && val !== null && val !== '',
            { message: `${field.label} is required` }
          );
        }
      } else {
        fieldSchema = fieldSchema.optional();
      }

      schemaFields[field.fieldname] = fieldSchema;
    });

    return z.object(schemaFields);
  }, [meta?.fields, schema?.fields]);

  // Initialize form with React Hook Form
  const methods =
    form ||
    useForm({
      resolver: zodResolver(validationSchema),
      defaultValues: data || document?.data || {},
      mode: 'onChange',
    });

  const { watch, reset } = methods;
  const formData = watch();

  // Reset form when document or data changes
  useEffect(() => {
    const formData = data || document?.data;
    if (formData) {
      reset(formData);
    }
  }, [data, document?.data, reset]);

  // Call onChange when form data changes
  useEffect(() => {
    if (onChange) {
      onChange(formData);
    }
  }, [formData, onChange]);

  // Group fields by sections
  const sections = useMemo(() => {
    const fieldsToUse = meta?.fields || schema?.fields || [];
    const formSettings = meta?.formSettings || schema?.formSettings;

    if (fieldsToUse.length === 0) return [];

    if (formSettings?.sections?.length) {
      return formSettings.sections.map(
        (section: FormSectionConfig): ProcessedFormSection => ({
          ...section,
          fields: section.fields
            .map((fieldname: string) =>
              fieldsToUse.find((f: DocField) => f.fieldname === fieldname)
            )
            .filter(Boolean) as DocField[],
        })
      );
    }

    // Default single section with all fields
    return [
      {
        label: 'Details',
        fields: fieldsToUse as DocField[],
        collapsible: false,
      },
    ] as ProcessedFormSection[];
  }, [meta?.fields, meta?.formSettings, schema?.fields, schema?.formSettings]);

  // Filter visible fields based on depends_on conditions
  const getVisibleFields = (fields: DocField[]) => {
    return fields.filter((field) => {
      if (!field.depends_on) return true;
      return evaluateDependsOn(field.depends_on, formData);
    });
  };

  const handleFormSubmit = (data: Record<string, unknown>) => {
    if (onSubmit) {
      onSubmit(data);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        id={id}
        onSubmit={methods.handleSubmit(handleFormSubmit)}
        className={className || 'space-y-6'}
      >
        <div className='rounded-lg border border-gray-200 bg-white'>
          {sections.map((section: ProcessedFormSection, index: number) => {
            const visibleFields = getVisibleFields(section.fields);

            if (visibleFields.length === 0) return null;

            return (
              <FormSection
                key={section.label || index}
                title={section.label || 'Details'}
                fields={visibleFields}
                collapsible={section.collapsible}
                columns={
                  (meta?.formSettings || schema?.formSettings)?.layout
                    ?.columns || 2
                }
                readOnly={readOnly}
              />
            );
          })}
        </div>
      </form>
    </FormProvider>
  );
}
