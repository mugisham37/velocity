/**
 * Evaluates depends_on expressions for conditional field display
 * Supports ERPNext's depends_on syntax like "eval:doc.field_name == 'value'"
 */
export function evaluateDependsOn(
  dependsOn: string,
  formData: Record<string, unknown>
): boolean {
  if (!dependsOn) return true;

  try {
    // Handle eval: expressions
    if (dependsOn.startsWith('eval:')) {
      const expression = dependsOn.substring(5);
      
      // Create a safe evaluation context
      const context = {
        doc: formData,
        ...formData, // Allow direct field access
      };

      // Simple expression evaluator for common patterns
      return evaluateExpression(expression, context);
    }

    // Handle simple field value checks
    if (dependsOn.includes('=')) {
      const [fieldName, expectedValue] = dependsOn.split('=').map(s => s.trim());
      const actualValue = formData[fieldName];
      
      // Remove quotes from expected value if present
      const cleanExpectedValue = expectedValue.replace(/['"]/g, '');
      
      return String(actualValue) === cleanExpectedValue;
    }

    // Handle simple field existence checks
    const fieldValue = formData[dependsOn];
    return Boolean(fieldValue);
  } catch (error) {
    console.warn('Error evaluating depends_on expression:', dependsOn, error);
    return true; // Show field by default if evaluation fails
  }
}

/**
 * Simple expression evaluator for common depends_on patterns
 */
function evaluateExpression(
  expression: string,
  context: Record<string, unknown>
): boolean {
  // Replace doc.fieldname with actual values
  let processedExpression = expression;

  // Handle doc.fieldname references
  const docFieldRegex = /doc\.(\w+)/g;
  processedExpression = processedExpression.replace(docFieldRegex, (match, fieldName) => {
    const value = context[fieldName];
    if (typeof value === 'string') {
      return `"${value}"`;
    }
    return String(value);
  });

  // Handle direct field references
  const fieldRegex = /\b(\w+)\b/g;
  processedExpression = processedExpression.replace(fieldRegex, (match) => {
    // Skip operators and keywords
    if (['==', '!=', '&&', '||', 'true', 'false', 'null', 'undefined'].includes(match)) {
      return match;
    }
    
    // Skip if it's already quoted
    if (processedExpression.includes(`"${match}"`)) {
      return match;
    }

    const value = context[match];
    if (value !== undefined) {
      if (typeof value === 'string') {
        return `"${value}"`;
      }
      return String(value);
    }
    return match;
  });

  try {
    // Use Function constructor for safer evaluation than eval
    const func = new Function('return ' + processedExpression);
    return Boolean(func());
  } catch (error) {
    console.warn('Error in expression evaluation:', processedExpression, error);
    return true;
  }
}

/**
 * Formats field values for display
 */
export function formatFieldValue(
  value: unknown,
  fieldtype: string,
  options?: string
): string {
  if (value === null || value === undefined) {
    return '';
  }

  switch (fieldtype) {
    case 'Currency':
      return formatCurrency(Number(value));
    case 'Float':
      return formatFloat(Number(value));
    case 'Int':
      return String(Math.floor(Number(value)));
    case 'Date':
      return formatDate(value as string);
    case 'Datetime':
      return formatDatetime(value as string);
    case 'Check':
      return value ? '1' : '0';
    default:
      return String(value);
  }
}

/**
 * Formats currency values
 */
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats float values
 */
export function formatFloat(value: number, precision = 2): string {
  return value.toFixed(precision);
}

/**
 * Formats date values
 */
export function formatDate(value: string | Date): string {
  if (!value) return '';
  
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Formats datetime values
 */
export function formatDatetime(value: string | Date): string {
  if (!value) return '';
  
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Validates field values based on field type and validation rules
 */
export function validateFieldValue(
  value: unknown,
  field: { fieldtype: string; reqd?: boolean; validation?: Array<{ type: string; value: unknown; message: string }> }
): string | null {
  // Check required fields
  if (field.reqd && (value === null || value === undefined || value === '')) {
    return 'This field is required';
  }

  // Type-specific validation
  switch (field.fieldtype) {
    case 'Int':
      if (value !== '' && value !== null && value !== undefined) {
        const num = Number(value);
        if (isNaN(num) || !Number.isInteger(num)) {
          return 'Please enter a valid integer';
        }
      }
      break;
    case 'Float':
    case 'Currency':
      if (value !== '' && value !== null && value !== undefined) {
        const num = Number(value);
        if (isNaN(num)) {
          return 'Please enter a valid number';
        }
      }
      break;
    case 'Date':
    case 'Datetime':
      if (value && typeof value === 'string') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return 'Please enter a valid date';
        }
      }
      break;
  }

  // Custom validation rules
  if (field.validation) {
    for (const rule of field.validation) {
      const error = validateRule(value, rule);
      if (error) return error;
    }
  }

  return null;
}

/**
 * Validates individual validation rules
 */
function validateRule(
  value: unknown,
  rule: { type: string; value: unknown; message: string }
): string | null {
  switch (rule.type) {
    case 'min_length':
      if (typeof value === 'string' && value.length < Number(rule.value)) {
        return rule.message;
      }
      break;
    case 'max_length':
      if (typeof value === 'string' && value.length > Number(rule.value)) {
        return rule.message;
      }
      break;
    case 'min_value':
      if (typeof value === 'number' && value < Number(rule.value)) {
        return rule.message;
      }
      break;
    case 'max_value':
      if (typeof value === 'number' && value > Number(rule.value)) {
        return rule.message;
      }
      break;
    case 'regex':
      if (typeof value === 'string' && typeof rule.value === 'string') {
        const regex = new RegExp(rule.value);
        if (!regex.test(value)) {
          return rule.message;
        }
      }
      break;
  }
  return null;
}