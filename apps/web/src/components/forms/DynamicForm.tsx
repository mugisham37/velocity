'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DocTypeSchema, DocField, DocumentState } from '@/types';
import { FormSection } from './FormSection';
import { evaluateDependsOn } from '@/lib/utils/form-utils';

interface DynamicFormProps {
  doctype: string;
  meta: DocTypeSchema;
  document?: DocumentState;
  onSubmit: (data: Record<string, unknown>) => void;
  onChange?: (data: Record<string, unknown>) => void;
  readOnly?: boolean;
}

export function DynamicForm({
  doctype,
  meta,
  document,
  onSubmit,
  onChange,
  readOnly = false,
}: DynamicFormProps) {
  // Create dynamic validation schema based on DocType fields
  const validationSchema = useMemo(() => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};

    meta.fields.forEach((field) => {
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
  }, [meta.fields]);

  // Initialize form with React Hook Form
  const methods = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: document?.data || {},
    mode: 'onChange',
  });

  const { watch, reset } = methods;
  const formData = watch();

  // Reset form when document changes
  useEffect(() => {
    if (document?.data) {
      reset(document.data);
    }
  }, [document?.data, reset]);

  // Call onChange when form data changes
  useEffect(() => {
    if (onChange) {
      onChange(formData);
    }
  }, [formData, onChange]);

  // Group fields by sections
  const sections = useMemo(() => {
    if (meta.formSettings?.sections?.length) {
      return meta.formSettings.sections.map((section) => ({
        ...section,
        fields: section.fields
          .map((fieldname) => meta.fields.find((f) => f.fieldname === fieldname))
          .filter(Boolean) as DocField[],
      }));
    }

    // Default single section with all fields
    return [
      {
        label: 'Details',
        fields: meta.fields,
        collapsible: false,
      },
    ];
  }, [meta.fields, meta.formSettings]);

  // Filter visible fields based on depends_on conditions
  const getVisibleFields = (fields: DocField[]) => {
    return fields.filter((field) => {
      if (!field.depends_on) return true;
      return evaluateDependsOn(field.depends_on, formData);
    });
  };

  const handleFormSubmit = (data: Record<string, unknown>) => {
    onSubmit(data);
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        <div className="bg-white rounded-lg border border-gray-200">
          {sections.map((section, index) => {
            const visibleFields = getVisibleFields(section.fields);
            
            if (visibleFields.length === 0) return null;

            return (
              <FormSection
                key={section.label || index}
                title={section.label}
                fields={visibleFields}
                collapsible={section.collapsible}
                columns={meta.formSettings?.layout?.columns || 2}
                readOnly={readOnly}
              />
            );
          })}
        </div>
      </form>
    </FormProvider>
  );
}