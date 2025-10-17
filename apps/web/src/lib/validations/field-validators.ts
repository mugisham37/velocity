// Field-specific validation functions matching ERPNext's validation rules

import { FieldType } from '@/lib/api/types';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: unknown;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  precision?: number;
  options?: string[];
  customValidator?: (value: unknown) => ValidationResult;
}

/**
 * Validate data field (text input)
 */
export function validateDataField(value: unknown, rules: ValidationRule = {}): ValidationResult {
  const strValue = String(value || '').trim();

  // Required validation
  if (rules.required && !strValue) {
    return { isValid: false, error: 'This field is required' };
  }

  if (!strValue) {
    return { isValid: true, sanitizedValue: '' };
  }

  // Length validation
  if (rules.minLength && strValue.length < rules.minLength) {
    return { isValid: false, error: `Minimum length is ${rules.minLength} characters` };
  }

  if (rules.maxLength && strValue.length > rules.maxLength) {
    return { isValid: false, error: `Maximum length is ${rules.maxLength} characters` };
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(strValue)) {
    return { isValid: false, error: 'Invalid format' };
  }

  // Custom validation
  if (rules.customValidator) {
    return rules.customValidator(strValue);
  }

  return { isValid: true, sanitizedValue: strValue };
}

/**
 * Validate email field
 */
export function validateEmailField(value: unknown, rules: ValidationRule = {}): ValidationResult {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return validateDataField(value, {
    ...rules,
    pattern: emailPattern,
  });
}

/**
 * Validate phone field
 */
export function validatePhoneField(value: unknown, rules: ValidationRule = {}): ValidationResult {
  const phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
  
  return validateDataField(value, {
    ...rules,
    pattern: phonePattern,
  });
}

/**
 * Validate numeric fields (Int, Float, Currency, Percent)
 */
export function validateNumericField(value: unknown, rules: ValidationRule = {}): ValidationResult {
  const strValue = String(value || '').trim();

  // Required validation
  if (rules.required && !strValue) {
    return { isValid: false, error: 'This field is required' };
  }

  if (!strValue) {
    return { isValid: true, sanitizedValue: null };
  }

  // Convert to number
  const numValue = Number(strValue);
  
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }

  // Range validation
  if (rules.min !== undefined && numValue < rules.min) {
    return { isValid: false, error: `Value must be at least ${rules.min}` };
  }

  if (rules.max !== undefined && numValue > rules.max) {
    return { isValid: false, error: `Value must not exceed ${rules.max}` };
  }

  // Precision validation for decimals
  if (rules.precision !== undefined) {
    const decimalPlaces = (strValue.split('.')[1] || '').length;
    if (decimalPlaces > rules.precision) {
      return { isValid: false, error: `Maximum ${rules.precision} decimal places allowed` };
    }
  }

  return { isValid: true, sanitizedValue: numValue };
}

/**
 * Validate date field
 */
export function validateDateField(value: unknown, rules: ValidationRule = {}): ValidationResult {
  const strValue = String(value || '').trim();

  // Required validation
  if (rules.required && !strValue) {
    return { isValid: false, error: 'This field is required' };
  }

  if (!strValue) {
    return { isValid: true, sanitizedValue: null };
  }

  // Parse date
  const dateValue = new Date(strValue);
  
  if (isNaN(dateValue.getTime())) {
    return { isValid: false, error: 'Please enter a valid date' };
  }

  // Range validation (if min/max are provided as dates)
  if (rules.min && dateValue < new Date(rules.min)) {
    return { isValid: false, error: `Date must be after ${new Date(rules.min).toLocaleDateString()}` };
  }

  if (rules.max && dateValue > new Date(rules.max)) {
    return { isValid: false, error: `Date must be before ${new Date(rules.max).toLocaleDateString()}` };
  }

  return { isValid: true, sanitizedValue: dateValue.toISOString().split('T')[0] };
}

/**
 * Validate select field
 */
export function validateSelectField(value: unknown, rules: ValidationRule = {}): ValidationResult {
  const strValue = String(value || '').trim();

  // Required validation
  if (rules.required && !strValue) {
    return { isValid: false, error: 'Please select an option' };
  }

  if (!strValue) {
    return { isValid: true, sanitizedValue: '' };
  }

  // Options validation
  if (rules.options && !rules.options.includes(strValue)) {
    return { isValid: false, error: 'Please select a valid option' };
  }

  return { isValid: true, sanitizedValue: strValue };
}

/**
 * Validate link field (reference to another document)
 */
export function validateLinkField(value: unknown, rules: ValidationRule = {}): ValidationResult {
  const strValue = String(value || '').trim();

  // Required validation
  if (rules.required && !strValue) {
    return { isValid: false, error: 'This field is required' };
  }

  if (!strValue) {
    return { isValid: true, sanitizedValue: '' };
  }

  // Basic format validation (ERPNext document names)
  const linkPattern = /^[a-zA-Z0-9\-_.@\s]+$/;
  if (!linkPattern.test(strValue)) {
    return { isValid: false, error: 'Invalid document reference format' };
  }

  return { isValid: true, sanitizedValue: strValue };
}

/**
 * Validate check field (boolean)
 */
export function validateCheckField(value: unknown): ValidationResult {
  const boolValue = Boolean(value);
  return { isValid: true, sanitizedValue: boolValue };
}

/**
 * Validate text field (multiline text)
 */
export function validateTextField(value: unknown, rules: ValidationRule = {}): ValidationResult {
  return validateDataField(value, rules);
}

/**
 * Validate password field
 */
export function validatePasswordField(value: unknown, rules: ValidationRule = {}): ValidationResult {
  const strValue = String(value || '');

  // Required validation
  if (rules.required && !strValue) {
    return { isValid: false, error: 'Password is required' };
  }

  if (!strValue) {
    return { isValid: true, sanitizedValue: '' };
  }

  // Minimum length (default 8 characters)
  const minLength = rules.minLength || 8;
  if (strValue.length < minLength) {
    return { isValid: false, error: `Password must be at least ${minLength} characters long` };
  }

  // Password strength validation
  const hasUpperCase = /[A-Z]/.test(strValue);
  const hasLowerCase = /[a-z]/.test(strValue);
  const hasNumbers = /\d/.test(strValue);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(strValue);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return {
      isValid: false,
      error: 'Password must contain uppercase, lowercase, numbers, and special characters'
    };
  }

  return { isValid: true, sanitizedValue: strValue };
}

/**
 * Main field validator that routes to specific validators based on field type
 */
export function validateField(
  fieldType: FieldType | string,
  value: unknown,
  rules: ValidationRule = {}
): ValidationResult {
  switch (fieldType) {
    case FieldType.Data:
      return validateDataField(value, rules);
    
    case FieldType.Text:
    case FieldType.TextEditor:
      return validateTextField(value, rules);
    
    case FieldType.Select:
      return validateSelectField(value, rules);
    
    case FieldType.Link:
      return validateLinkField(value, rules);
    
    case FieldType.Date:
    case FieldType.Datetime:
      return validateDateField(value, rules);
    
    case FieldType.Check:
      return validateCheckField(value);
    
    case FieldType.Currency:
    case FieldType.Float:
    case FieldType.Int:
    case FieldType.Percent:
      return validateNumericField(value, rules);
    
    case FieldType.Password:
      return validatePasswordField(value, rules);
    
    case 'Email':
      return validateEmailField(value, rules);
    
    case 'Phone':
      return validatePhoneField(value, rules);
    
    default:
      // Default to data field validation
      return validateDataField(value, rules);
  }
}

/**
 * Validate multiple fields at once
 */
export function validateFields(
  fields: Array<{
    fieldname: string;
    fieldtype: FieldType | string;
    value: unknown;
    rules?: ValidationRule;
  }>
): { isValid: boolean; errors: Record<string, string>; sanitizedValues: Record<string, unknown> } {
  const errors: Record<string, string> = {};
  const sanitizedValues: Record<string, unknown> = {};
  let isValid = true;

  for (const field of fields) {
    const result = validateField(field.fieldtype, field.value, field.rules);
    
    if (!result.isValid) {
      isValid = false;
      if (result.error) {
        errors[field.fieldname] = result.error;
      }
    } else {
      sanitizedValues[field.fieldname] = result.sanitizedValue;
    }
  }

  return { isValid, errors, sanitizedValues };
}