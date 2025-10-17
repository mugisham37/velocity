'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  children: React.ReactNode;
}

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

export function Select({ children, className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function SelectTrigger({ children, className, ...props }: SelectTriggerProps) {
  return (
    <button
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SelectContent({ children, className }: SelectContentProps) {
  return (
    <div className={cn('relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white text-gray-950 shadow-md', className)}>
      {children}
    </div>
  );
}

export function SelectItem({ children, className, ...props }: SelectItemProps) {
  return (
    <option
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </option>
  );
}

export function SelectValue({ placeholder, className }: SelectValueProps) {
  return (
    <span className={cn('block truncate', className)}>
      {placeholder}
    </span>
  );
}