// Validation engine for ERPNext documents

import { validateFields, ValidationResult } from './field-validators';
import { sanitizeObject } from './sanitizers';
import { getValidationSchema, DocTypeValidationSchema } from './validation-schemas';
import { FieldType } from '@/lib/api/types';

export interface DocumentValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedDoc: Record<string, unknown>;
  warnings?: string[];
}

export interface ValidationContext {
  doctype: string;
  doc: Record<string, unknown>;
  isNew?: boolean;
  isSubmit?: boolean;
  user?: {
    name: string;
    roles: string[];
  };
}

/**
 * Main document validation engine
 */
export class ValidationEngine {
  private schemas: Record<string, DocTypeValidationSchema> = {};
  private globalValidators: Array<{
    name: string;
    validator: (context: ValidationContext) => ValidationResult;
  }> = [];

  /**
   * Register a validation schema
   */
  registerSchema(schema: DocTypeValidationSchema): void {
    this.schemas[schema.doctype] = schema;
  }

  /**
   * Register a global validator that applies to all documents
   */
  registerGlobalValidator(
    name: string,
    validator: (context: ValidationContext) => ValidationResult
  ): void {
    this.globalValidators.push({ name, validator });
  }

  /**
   * Validate a document
   */
  async validateDocument(context: ValidationContext): Promise<DocumentValidationResult> {
    const { doctype, doc } = context;
    const schema = this.schemas[doctype] || getValidationSchema(doctype);
    
    if (!schema) {
      // No schema found, perform basic sanitization only
      const sanitizedDoc = sanitizeObject(doc);
      return {
        isValid: true,
        errors: {},
        sanitizedDoc,
        warnings: [`No validation schema found for doctype: ${doctype}`],
      };
    }

    const errors: Record<string, string> = {};
    const warnings: string[] = [];
    let isValid = true;

    // 1. Field-level validation and sanitization
    const fields = Object.entries(schema.fields).map(([fieldname, fieldSchema]) => ({
      fieldname,
      fieldtype: fieldSchema.fieldtype,
      value: doc[fieldname],
      rules: fieldSchema.rules,
    }));

    const fieldValidationResult = validateFields(fields);
    
    if (!fieldValidationResult.isValid) {
      isValid = false;
      Object.assign(errors, fieldValidationResult.errors);
    }

    // 2. Sanitize the document
    const fieldTypes: Record<string, string> = {};
    Object.entries(schema.fields).forEach(([fieldname, fieldSchema]) => {
      fieldTypes[fieldname] = fieldSchema.sanitizationType || 'text';
    });

    const sanitizedDoc = {
      ...sanitizeObject(doc, fieldTypes),
      ...fieldValidationResult.sanitizedValues,
    };

    // 3. Custom document-level validators
    if (schema.customValidators) {
      for (const customValidator of schema.customValidators) {
        try {
          const result = customValidator.validator(sanitizedDoc);
          if (!result.isValid) {
            isValid = false;
            errors[customValidator.name] = result.error || 'Custom validation failed';
          }
        } catch (error) {
          isValid = false;
          errors[customValidator.name] = `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      }
    }

    // 4. Global validators
    for (const globalValidator of this.globalValidators) {
      try {
        const result = globalValidator.validator({ ...context, doc: sanitizedDoc });
        if (!result.isValid) {
          isValid = false;
          errors[globalValidator.name] = result.error || 'Global validation failed';
        }
      } catch (error) {
        isValid = false;
        errors[globalValidator.name] = `Global validation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }

    // 5. Business rule validation (ERPNext-specific)
    const businessRuleResult = await this.validateBusinessRules(context, sanitizedDoc);
    if (!businessRuleResult.isValid) {
      isValid = false;
      Object.assign(errors, businessRuleResult.errors);
    }

    return {
      isValid,
      errors,
      sanitizedDoc,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate business rules specific to ERPNext
   */
  private async validateBusinessRules(
    context: ValidationContext,
    doc: Record<string, unknown>
  ): Promise<{ isValid: boolean; errors: Record<string, string> }> {
    const errors: Record<string, string> = {};
    let isValid = true;

    // Common business rules
    
    // 1. Naming series validation
    if (doc.naming_series && typeof doc.naming_series === 'string') {
      if (!/^[A-Z0-9\-\.]+$/.test(doc.naming_series)) {
        isValid = false;
        errors.naming_series = 'Invalid naming series format';
      }
    }

    // 2. Company validation (if company field exists)
    if (doc.company && typeof doc.company === 'string') {
      if (doc.company.trim().length === 0) {
        isValid = false;
        errors.company = 'Company is required';
      }
    }

    // 3. Currency validation
    if (doc.currency && typeof doc.currency === 'string') {
      const validCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'SEK'];
      if (!validCurrencies.includes(doc.currency)) {
        // This would normally be validated against the Currency doctype
        // For now, we'll just warn
      }
    }

    // 4. Date validation
    const dateFields = ['posting_date', 'transaction_date', 'due_date', 'delivery_date', 'schedule_date'];
    for (const field of dateFields) {
      if (doc[field]) {
        const date = new Date(String(doc[field]));
        if (isNaN(date.getTime())) {
          isValid = false;
          errors[field] = 'Invalid date format';
        }
      }
    }

    // 5. Doctype-specific business rules
    switch (context.doctype) {
      case 'Sales Order':
        const soValidation = this.validateSalesOrderBusinessRules(doc);
        if (!soValidation.isValid) {
          isValid = false;
          Object.assign(errors, soValidation.errors);
        }
        break;

      case 'Purchase Order':
        const poValidation = this.validatePurchaseOrderBusinessRules(doc);
        if (!poValidation.isValid) {
          isValid = false;
          Object.assign(errors, poValidation.errors);
        }
        break;

      case 'Journal Entry':
        const jeValidation = this.validateJournalEntryBusinessRules(doc);
        if (!jeValidation.isValid) {
          isValid = false;
          Object.assign(errors, jeValidation.errors);
        }
        break;

      case 'Payment Entry':
        const peValidation = this.validatePaymentEntryBusinessRules(doc);
        if (!peValidation.isValid) {
          isValid = false;
          Object.assign(errors, peValidation.errors);
        }
        break;
    }

    return { isValid, errors };
  }

  /**
   * Sales Order specific business rules
   */
  private validateSalesOrderBusinessRules(doc: Record<string, unknown>): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    let isValid = true;

    // Check if delivery date is after transaction date
    if (doc.transaction_date && doc.delivery_date) {
      const transactionDate = new Date(String(doc.transaction_date));
      const deliveryDate = new Date(String(doc.delivery_date));
      
      if (deliveryDate < transactionDate) {
        isValid = false;
        errors.delivery_date = 'Delivery date cannot be before transaction date';
      }
    }

    // Validate items table (if present)
    if (doc.items && Array.isArray(doc.items)) {
      if (doc.items.length === 0) {
        isValid = false;
        errors.items = 'At least one item is required';
      }

      doc.items.forEach((item: unknown, index: number) => {
        if (typeof item === 'object' && item !== null) {
          const itemObj = item as Record<string, unknown>;
          
          if (!itemObj.item_code) {
            isValid = false;
            errors[`items_${index}_item_code`] = 'Item code is required';
          }
          
          if (!itemObj.qty || Number(itemObj.qty) <= 0) {
            isValid = false;
            errors[`items_${index}_qty`] = 'Quantity must be greater than 0';
          }
          
          if (!itemObj.rate || Number(itemObj.rate) < 0) {
            isValid = false;
            errors[`items_${index}_rate`] = 'Rate cannot be negative';
          }
        }
      });
    }

    return { isValid, errors };
  }

  /**
   * Purchase Order specific business rules
   */
  private validatePurchaseOrderBusinessRules(doc: Record<string, unknown>): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    let isValid = true;

    // Similar validation to Sales Order but for Purchase Order
    if (doc.transaction_date && doc.schedule_date) {
      const transactionDate = new Date(String(doc.transaction_date));
      const scheduleDate = new Date(String(doc.schedule_date));
      
      if (scheduleDate < transactionDate) {
        isValid = false;
        errors.schedule_date = 'Schedule date cannot be before transaction date';
      }
    }

    return { isValid, errors };
  }

  /**
   * Journal Entry specific business rules
   */
  private validateJournalEntryBusinessRules(doc: Record<string, unknown>): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    let isValid = true;

    // Validate accounts table
    if (doc.accounts && Array.isArray(doc.accounts)) {
      if (doc.accounts.length < 2) {
        isValid = false;
        errors.accounts = 'At least two accounting entries are required';
      }

      let totalDebit = 0;
      let totalCredit = 0;

      doc.accounts.forEach((account: unknown, index: number) => {
        if (typeof account === 'object' && account !== null) {
          const accountObj = account as Record<string, unknown>;
          
          if (!accountObj.account) {
            isValid = false;
            errors[`accounts_${index}_account`] = 'Account is required';
          }
          
          const debit = Number(accountObj.debit_in_account_currency || 0);
          const credit = Number(accountObj.credit_in_account_currency || 0);
          
          if (debit > 0 && credit > 0) {
            isValid = false;
            errors[`accounts_${index}`] = 'Cannot have both debit and credit amounts';
          }
          
          if (debit === 0 && credit === 0) {
            isValid = false;
            errors[`accounts_${index}`] = 'Either debit or credit amount is required';
          }
          
          totalDebit += debit;
          totalCredit += credit;
        }
      });

      // Check if debits equal credits
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        isValid = false;
        errors.total_balance = `Total Debit (${totalDebit}) must equal Total Credit (${totalCredit})`;
      }
    }

    return { isValid, errors };
  }

  /**
   * Payment Entry specific business rules
   */
  private validatePaymentEntryBusinessRules(doc: Record<string, unknown>): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    let isValid = true;

    // Validate payment type specific rules
    const paymentType = String(doc.payment_type || '');
    
    if (paymentType === 'Internal Transfer') {
      if (!doc.paid_from || !doc.paid_to) {
        isValid = false;
        errors.accounts = 'Both source and target accounts are required for internal transfer';
      }
      
      if (doc.paid_from === doc.paid_to) {
        isValid = false;
        errors.accounts = 'Source and target accounts cannot be the same';
      }
    } else {
      if (!doc.party) {
        isValid = false;
        errors.party = 'Party is required for customer/supplier payments';
      }
    }

    // Validate amounts
    const paidAmount = Number(doc.paid_amount || 0);
    const receivedAmount = Number(doc.received_amount || 0);
    
    if (paidAmount <= 0) {
      isValid = false;
      errors.paid_amount = 'Paid amount must be greater than 0';
    }
    
    if (receivedAmount <= 0) {
      isValid = false;
      errors.received_amount = 'Received amount must be greater than 0';
    }

    return { isValid, errors };
  }

  /**
   * Quick validation for single field
   */
  validateField(
    doctype: string,
    fieldname: string,
    value: unknown
  ): ValidationResult {
    const schema = this.schemas[doctype] || getValidationSchema(doctype);
    
    if (!schema || !schema.fields[fieldname]) {
      return { isValid: true, sanitizedValue: value };
    }

    const fieldSchema = schema.fields[fieldname];
    return validateFields([{
      fieldname,
      fieldtype: fieldSchema.fieldtype,
      value,
      rules: fieldSchema.rules,
    }]).isValid ? 
      { isValid: true, sanitizedValue: value } : 
      { isValid: false, error: 'Validation failed' };
  }
}

// Create singleton instance
export const validationEngine = new ValidationEngine();

// Register default global validators
validationEngine.registerGlobalValidator('required_fields', (context) => {
  // This would check for system-required fields
  return { isValid: true };
});

validationEngine.registerGlobalValidator('permissions', (context) => {
  // This would check user permissions
  return { isValid: true };
});

/**
 * Convenience function to validate a document
 */
export async function validateDocument(
  doctype: string,
  doc: Record<string, unknown>,
  options?: {
    isNew?: boolean;
    isSubmit?: boolean;
    user?: { name: string; roles: string[] };
  }
): Promise<DocumentValidationResult> {
  return validationEngine.validateDocument({
    doctype,
    doc,
    isNew: options?.isNew,
    isSubmit: options?.isSubmit,
    user: options?.user,
  });
}

/**
 * Convenience function to validate a single field
 */
export function validateSingleField(
  doctype: string,
  fieldname: string,
  value: unknown
): ValidationResult {
  return validationEngine.validateField(doctype, fieldname, value);
}