// Validation schemas for common ERPNext document types

import { ValidationRule } from './field-validators';
import { FieldType } from '@/lib/api/types';

export interface DocTypeValidationSchema {
  doctype: string;
  fields: Record<string, FieldValidationSchema>;
  customValidators?: Array<{
    name: string;
    validator: (doc: Record<string, unknown>) => { isValid: boolean; error?: string };
  }>;
}

export interface FieldValidationSchema {
  fieldtype: FieldType | string;
  rules: ValidationRule;
  sanitizationType?: 'html' | 'text' | 'sql' | 'url' | 'filename' | 'json' | 'number' | 'email' | 'phone' | 'search' | 'css';
}

/**
 * User document validation schema
 */
export const userValidationSchema: DocTypeValidationSchema = {
  doctype: 'User',
  fields: {
    email: {
      fieldtype: 'Data',
      rules: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      },
      sanitizationType: 'email',
    },
    first_name: {
      fieldtype: 'Data',
      rules: {
        required: true,
        minLength: 1,
        maxLength: 50,
      },
      sanitizationType: 'text',
    },
    last_name: {
      fieldtype: 'Data',
      rules: {
        maxLength: 50,
      },
      sanitizationType: 'text',
    },
    username: {
      fieldtype: 'Data',
      rules: {
        minLength: 3,
        maxLength: 30,
        pattern: /^[a-zA-Z0-9_.-]+$/,
      },
      sanitizationType: 'text',
    },
    new_password: {
      fieldtype: 'Password',
      rules: {
        minLength: 8,
      },
    },
    phone: {
      fieldtype: 'Data',
      rules: {
        pattern: /^[\+]?[1-9][\d]{0,15}$/,
      },
      sanitizationType: 'phone',
    },
    mobile_no: {
      fieldtype: 'Data',
      rules: {
        pattern: /^[\+]?[1-9][\d]{0,15}$/,
      },
      sanitizationType: 'phone',
    },
  },
};

/**
 * Customer document validation schema
 */
export const customerValidationSchema: DocTypeValidationSchema = {
  doctype: 'Customer',
  fields: {
    customer_name: {
      fieldtype: 'Data',
      rules: {
        required: true,
        minLength: 1,
        maxLength: 100,
      },
      sanitizationType: 'text',
    },
    customer_type: {
      fieldtype: 'Select',
      rules: {
        required: true,
        options: ['Individual', 'Company'],
      },
    },
    customer_group: {
      fieldtype: 'Link',
      rules: {
        required: true,
      },
    },
    territory: {
      fieldtype: 'Link',
      rules: {
        required: true,
      },
    },
    email_id: {
      fieldtype: 'Data',
      rules: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      },
      sanitizationType: 'email',
    },
    mobile_no: {
      fieldtype: 'Data',
      rules: {
        pattern: /^[\+]?[1-9][\d]{0,15}$/,
      },
      sanitizationType: 'phone',
    },
    website: {
      fieldtype: 'Data',
      rules: {
        pattern: /^https?:\/\/.+/,
      },
      sanitizationType: 'url',
    },
  },
};

/**
 * Item document validation schema
 */
export const itemValidationSchema: DocTypeValidationSchema = {
  doctype: 'Item',
  fields: {
    item_code: {
      fieldtype: 'Data',
      rules: {
        required: true,
        minLength: 1,
        maxLength: 140,
        pattern: /^[a-zA-Z0-9\-_.@\s]+$/,
      },
      sanitizationType: 'text',
    },
    item_name: {
      fieldtype: 'Data',
      rules: {
        required: true,
        minLength: 1,
        maxLength: 140,
      },
      sanitizationType: 'text',
    },
    item_group: {
      fieldtype: 'Link',
      rules: {
        required: true,
      },
    },
    stock_uom: {
      fieldtype: 'Link',
      rules: {
        required: true,
      },
    },
    valuation_rate: {
      fieldtype: 'Currency',
      rules: {
        min: 0,
        precision: 2,
      },
      sanitizationType: 'number',
    },
    standard_rate: {
      fieldtype: 'Currency',
      rules: {
        min: 0,
        precision: 2,
      },
      sanitizationType: 'number',
    },
    description: {
      fieldtype: 'Text Editor',
      rules: {
        maxLength: 1000,
      },
      sanitizationType: 'html',
    },
  },
};

/**
 * Sales Order validation schema
 */
export const salesOrderValidationSchema: DocTypeValidationSchema = {
  doctype: 'Sales Order',
  fields: {
    customer: {
      fieldtype: 'Link',
      rules: {
        required: true,
      },
    },
    transaction_date: {
      fieldtype: 'Date',
      rules: {
        required: true,
      },
    },
    delivery_date: {
      fieldtype: 'Date',
      rules: {
        required: true,
      },
    },
    currency: {
      fieldtype: 'Link',
      rules: {
        required: true,
      },
    },
    selling_price_list: {
      fieldtype: 'Link',
      rules: {
        required: true,
      },
    },
    total: {
      fieldtype: 'Currency',
      rules: {
        min: 0,
        precision: 2,
      },
      sanitizationType: 'number',
    },
    grand_total: {
      fieldtype: 'Currency',
      rules: {
        min: 0,
        precision: 2,
      },
      sanitizationType: 'number',
    },
  },
  customValidators: [
    {
      name: 'delivery_date_validation',
      validator: (doc: Record<string, unknown>) => {
        const transactionDate = new Date(String(doc.transaction_date || ''));
        const deliveryDate = new Date(String(doc.delivery_date || ''));
        
        if (deliveryDate < transactionDate) {
          return {
            isValid: false,
            error: 'Delivery date cannot be before transaction date',
          };
        }
        
        return { isValid: true };
      },
    },
  ],
};

/**
 * Purchase Order validation schema
 */
export const purchaseOrderValidationSchema: DocTypeValidationSchema = {
  doctype: 'Purchase Order',
  fields: {
    supplier: {
      fieldtype: 'Link',
      rules: {
        required: true,
      },
    },
    transaction_date: {
      fieldtype: 'Date',
      rules: {
        required: true,
      },
    },
    schedule_date: {
      fieldtype: 'Date',
      rules: {
        required: true,
      },
    },
    currency: {
      fieldtype: 'Link',
      rules: {
        required: true,
      },
    },
    buying_price_list: {
      fieldtype: 'Link',
      rules: {
        required: true,
      },
    },
    total: {
      fieldtype: 'Currency',
      rules: {
        min: 0,
        precision: 2,
      },
      sanitizationType: 'number',
    },
    grand_total: {
      fieldtype: 'Currency',
      rules: {
        min: 0,
        precision: 2,
      },
      sanitizationType: 'number',
    },
  },
};

/**
 * Journal Entry validation schema
 */
export const journalEntryValidationSchema: DocTypeValidationSchema = {
  doctype: 'Journal Entry',
  fields: {
    posting_date: {
      fieldtype: 'Date',
      rules: {
        required: true,
      },
    },
    voucher_type: {
      fieldtype: 'Select',
      rules: {
        required: true,
        options: [
          'Journal Entry',
          'Inter Company Journal Entry',
          'Bank Entry',
          'Cash Entry',
          'Credit Card Entry',
          'Debit Note',
          'Credit Note',
          'Contra Entry',
          'Excise Entry',
          'Write Off Entry',
          'Opening Entry',
          'Depreciation Entry',
          'Exchange Rate Revaluation',
          'Deferred Revenue',
          'Deferred Expense',
        ],
      },
    },
    company: {
      fieldtype: 'Link',
      rules: {
        required: true,
      },
    },
    total_debit: {
      fieldtype: 'Currency',
      rules: {
        min: 0,
        precision: 2,
      },
      sanitizationType: 'number',
    },
    total_credit: {
      fieldtype: 'Currency',
      rules: {
        min: 0,
        precision: 2,
      },
      sanitizationType: 'number',
    },
    difference: {
      fieldtype: 'Currency',
      rules: {
        precision: 2,
      },
      sanitizationType: 'number',
    },
  },
  customValidators: [
    {
      name: 'debit_credit_balance',
      validator: (doc: Record<string, unknown>) => {
        const totalDebit = Number(doc.total_debit || 0);
        const totalCredit = Number(doc.total_credit || 0);
        const difference = Math.abs(totalDebit - totalCredit);
        
        if (difference > 0.01) { // Allow for small rounding differences
          return {
            isValid: false,
            error: `Total Debit (${totalDebit}) must equal Total Credit (${totalCredit})`,
          };
        }
        
        return { isValid: true };
      },
    },
  ],
};

/**
 * Payment Entry validation schema
 */
export const paymentEntryValidationSchema: DocTypeValidationSchema = {
  doctype: 'Payment Entry',
  fields: {
    payment_type: {
      fieldtype: 'Select',
      rules: {
        required: true,
        options: ['Receive', 'Pay', 'Internal Transfer'],
      },
    },
    party_type: {
      fieldtype: 'Select',
      rules: {
        options: ['Customer', 'Supplier', 'Employee', 'Member', 'Shareholder', 'Student'],
      },
    },
    party: {
      fieldtype: 'Dynamic Link',
      rules: {
        required: true,
      },
    },
    posting_date: {
      fieldtype: 'Date',
      rules: {
        required: true,
      },
    },
    paid_amount: {
      fieldtype: 'Currency',
      rules: {
        required: true,
        min: 0.01,
        precision: 2,
      },
      sanitizationType: 'number',
    },
    received_amount: {
      fieldtype: 'Currency',
      rules: {
        required: true,
        min: 0.01,
        precision: 2,
      },
      sanitizationType: 'number',
    },
    source_exchange_rate: {
      fieldtype: 'Float',
      rules: {
        min: 0.000001,
        precision: 6,
      },
      sanitizationType: 'number',
    },
    target_exchange_rate: {
      fieldtype: 'Float',
      rules: {
        min: 0.000001,
        precision: 6,
      },
      sanitizationType: 'number',
    },
  },
};

/**
 * Registry of all validation schemas
 */
export const validationSchemaRegistry: Record<string, DocTypeValidationSchema> = {
  'User': userValidationSchema,
  'Customer': customerValidationSchema,
  'Item': itemValidationSchema,
  'Sales Order': salesOrderValidationSchema,
  'Purchase Order': purchaseOrderValidationSchema,
  'Journal Entry': journalEntryValidationSchema,
  'Payment Entry': paymentEntryValidationSchema,
};

/**
 * Get validation schema for a specific doctype
 */
export function getValidationSchema(doctype: string): DocTypeValidationSchema | null {
  return validationSchemaRegistry[doctype] || null;
}

/**
 * Register a new validation schema
 */
export function registerValidationSchema(schema: DocTypeValidationSchema): void {
  validationSchemaRegistry[schema.doctype] = schema;
}

/**
 * Common validation patterns
 */
export const commonPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  url: /^https?:\/\/.+/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/,
  alphanumericWithSpecial: /^[a-zA-Z0-9\-_.@\s]+$/,
  currency: /^\d+(\.\d{1,2})?$/,
  percentage: /^(100(\.0{1,2})?|[1-9]?\d(\.\d{1,2})?)$/,
  postalCode: /^[a-zA-Z0-9\s\-]{3,10}$/,
  ipAddress: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  macAddress: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
};