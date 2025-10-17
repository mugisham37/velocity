'use client';

import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { DocField } from '@/types';
import { FormField } from './FormField';
import { cn } from '@/lib/utils';

interface FormSectionProps {
  title: string;
  fields?: DocField[];
  collapsible?: boolean;
  columns?: number;
  readOnly?: boolean;
  children?: React.ReactNode;
}

export function FormSection({
  title,
  fields = [],
  collapsible = false,
  columns = 2,
  readOnly = false,
  children,
}: FormSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      {/* Section Header */}
      <div
        className={cn(
          'px-6 py-4 bg-gray-50 border-b border-gray-200',
          collapsible && 'cursor-pointer hover:bg-gray-100'
        )}
        onClick={toggleCollapse}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          {collapsible && (
            <div className="text-gray-400">
              {isCollapsed ? (
                <ChevronRightIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section Content */}
      {!isCollapsed && (
        <div className="p-6">
          {children ? (
            children
          ) : (
            <div
              className={cn(
                'grid gap-6',
                columns === 1 && 'grid-cols-1',
                columns === 2 && 'grid-cols-1 md:grid-cols-2',
                columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
                columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
              )}
            >
              {fields.map((field) => (
                <FormField
                  key={field.fieldname}
                  field={field}
                  readOnly={readOnly || field.readonly}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}