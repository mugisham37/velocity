// API utility functions for ERPNext integration

import { FilterOptions, ListOptions, ApiError } from './types';

/**
 * Converts filter options to Frappe filter format
 */
export function convertFiltersToFrappeFormat(filters: FilterOptions[]): Array<[string, string, unknown]> {
  return filters.map(filter => [filter.field, filter.operator, filter.value]);
}

/**
 * Builds query parameters for list requests
 */
export function buildListParams(options: ListOptions): URLSearchParams {
  const params = new URLSearchParams();

  if (options.fields) {
    params.append('fields', JSON.stringify(options.fields));
  }

  if (options.filters) {
    if (Array.isArray(options.filters)) {
      params.append('filters', JSON.stringify(convertFiltersToFrappeFormat(options.filters)));
    } else {
      params.append('filters', JSON.stringify(options.filters));
    }
  }

  if (options.sort && options.sort.length > 0) {
    const orderBy = options.sort.map(s => `${s.field} ${s.direction}`).join(', ');
    params.append('order_by', orderBy);
  }

  if (options.start !== undefined) {
    params.append('limit_start', options.start.toString());
  } else if (options.page !== undefined && options.pageSize !== undefined) {
    params.append('limit_start', ((options.page - 1) * options.pageSize).toString());
  }

  if (options.limit !== undefined) {
    params.append('limit_page_length', options.limit.toString());
  } else if (options.pageSize !== undefined) {
    params.append('limit_page_length', options.pageSize.toString());
  }

  if (options.groupBy) {
    params.append('group_by', options.groupBy);
  }

  return params;
}

/**
 * Creates a standardized API error
 */
export function createApiError(message: string, status?: number, code?: string, details?: unknown): ApiError {
  const error = new Error(message) as ApiError;
  error.name = 'ApiError';
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
}

/**
 * Checks if an error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && error.name === 'ApiError';
}

/**
 * Extracts error message from various error formats
 */
export function extractErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    
    if (typeof errorObj.message === 'string') {
      return errorObj.message;
    }
    
    if (typeof errorObj.error === 'string') {
      return errorObj.error;
    }
    
    if (typeof errorObj.exc === 'string') {
      return errorObj.exc;
    }
  }

  return 'An unknown error occurred';
}

/**
 * Validates document name format
 */
export function isValidDocName(name: string): boolean {
  // ERPNext document names should not contain certain characters
  const invalidChars = /[<>"'&]/;
  return !invalidChars.test(name) && name.trim().length > 0;
}

/**
 * Formats document name for display
 */
export function formatDocName(name: string): string {
  return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Generates a unique request ID for tracking
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function for API calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Retry function for failed API calls
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (i === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }

  throw lastError!;
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validates file type against allowed types
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => {
    if (type.startsWith('.')) {
      return file.name.toLowerCase().endsWith(type.toLowerCase());
    }
    return file.type.toLowerCase().includes(type.toLowerCase());
  });
}

/**
 * Converts Frappe datetime to JavaScript Date
 */
export function parseFrappeDateTime(dateTimeStr: string): Date {
  // Frappe uses 'YYYY-MM-DD HH:mm:ss' format
  return new Date(dateTimeStr.replace(' ', 'T') + 'Z');
}

/**
 * Converts JavaScript Date to Frappe datetime format
 */
export function formatFrappeDateTime(date: Date): string {
  return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
}

/**
 * Converts Frappe date to JavaScript Date
 */
export function parseFrappeDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00Z');
}

/**
 * Converts JavaScript Date to Frappe date format
 */
export function formatFrappeDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Sanitizes HTML content for safe display
 */
export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}