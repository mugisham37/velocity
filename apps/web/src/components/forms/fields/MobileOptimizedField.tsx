'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MobileOptimizedFieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  description?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

/**
 * Mobile-optimized field wrapper that provides:
 * - Touch-friendly spacing and sizing
 * - Collapsible sections for complex forms
 * - Proper keyboard handling for mobile devices
 * - Accessibility improvements for touch interfaces
 */
export function MobileOptimizedField({
  label,
  children,
  required = false,
  error,
  description,
  collapsible = false,
  defaultCollapsed = false,
  className,
}: MobileOptimizedFieldProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const toggleCollapse = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div className={cn('mb-4 touch:mb-6', className)}>
      {/* Field Label */}
      <div
        className={cn(
          'flex items-center justify-between mb-2 touch:mb-3',
          collapsible && 'cursor-pointer touch:min-h-touch'
        )}
        onClick={toggleCollapse}
      >
        <label className="block text-sm font-medium text-gray-700 touch:text-base">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {collapsible && (
          <button
            type="button"
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 touch:p-2 touch:min-h-touch touch:min-w-touch flex items-center justify-center"
            aria-label={isCollapsed ? 'Expand field' : 'Collapse field'}
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4 touch:h-5 touch:w-5" />
            ) : (
              <ChevronUp className="h-4 w-4 touch:h-5 touch:w-5" />
            )}
          </button>
        )}
      </div>

      {/* Field Content */}
      {(!collapsible || !isCollapsed) && (
        <div className="space-y-2 touch:space-y-3">
          {/* Field Input */}
          <div className="relative">
            {children}
          </div>

          {/* Field Description */}
          {description && (
            <p className="text-xs text-gray-500 touch:text-sm">
              {description}
            </p>
          )}

          {/* Field Error */}
          {error && (
            <p className="text-xs text-red-600 touch:text-sm font-medium">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Mobile-optimized input component with touch-friendly sizing
 */
interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function MobileInput({ error, className, ...props }: MobileInputProps) {
  return (
    <input
      {...props}
      className={cn(
        'w-full px-3 py-2 border border-gray-300 rounded-md text-sm',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
        'touch:px-4 touch:py-3 touch:text-base touch:rounded-lg',
        'disabled:bg-gray-50 disabled:text-gray-500',
        error && 'border-red-300 focus:ring-red-500',
        className
      )}
    />
  );
}

/**
 * Mobile-optimized textarea component
 */
interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function MobileTextarea({ error, className, ...props }: MobileTextareaProps) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-vertical',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
        'touch:px-4 touch:py-3 touch:text-base touch:rounded-lg touch:min-h-[120px]',
        'disabled:bg-gray-50 disabled:text-gray-500',
        error && 'border-red-300 focus:ring-red-500',
        className
      )}
    />
  );
}

/**
 * Mobile-optimized select component
 */
interface MobileSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: Array<{ value: string; label: string }>;
}

export function MobileSelect({ error, options, className, ...props }: MobileSelectProps) {
  return (
    <select
      {...props}
      className={cn(
        'w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
        'touch:px-4 touch:py-3 touch:text-base touch:rounded-lg',
        'disabled:bg-gray-50 disabled:text-gray-500',
        error && 'border-red-300 focus:ring-red-500',
        className
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Mobile-optimized checkbox component
 */
interface MobileCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function MobileCheckbox({ label, className, ...props }: MobileCheckboxProps) {
  return (
    <label className="flex items-center space-x-3 cursor-pointer touch:min-h-touch touch:py-2">
      <input
        type="checkbox"
        {...props}
        className={cn(
          'h-4 w-4 text-primary-600 border-gray-300 rounded',
          'focus:ring-2 focus:ring-primary-500',
          'touch:h-5 touch:w-5 touch:rounded-md',
          className
        )}
      />
      <span className="text-sm text-gray-700 touch:text-base select-none">
        {label}
      </span>
    </label>
  );
}

/**
 * Mobile-optimized radio button component
 */
interface MobileRadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function MobileRadio({ label, className, ...props }: MobileRadioProps) {
  return (
    <label className="flex items-center space-x-3 cursor-pointer touch:min-h-touch touch:py-2">
      <input
        type="radio"
        {...props}
        className={cn(
          'h-4 w-4 text-primary-600 border-gray-300',
          'focus:ring-2 focus:ring-primary-500',
          'touch:h-5 touch:w-5',
          className
        )}
      />
      <span className="text-sm text-gray-700 touch:text-base select-none">
        {label}
      </span>
    </label>
  );
}

export default MobileOptimizedField;