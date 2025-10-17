import { FieldError, FieldErrorsImpl, Merge } from 'react-hook-form';

/**
 * Utility function to safely extract error message from React Hook Form errors
 */
export function getErrorMessage(
  error: string | FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined
): string | undefined {
  if (!error) return undefined;
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  
  return undefined;
}

/**
 * Evaluates depends_on conditions for form fields
 */
export function evaluateDependsOn(condition: string, formData: Record<string, unknown>): boolean {
  try {
    // Simple evaluation - in a real app, you'd want a more robust parser
    // This is a basic implementation for common cases
    const cleanCondition = condition.replace(/eval:/g, '');
    
    // Replace field references with actual values
    let evaluatedCondition = cleanCondition;
    Object.keys(formData).forEach(key => {
      const value = formData[key];
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      
      if (typeof value === 'string') {
        evaluatedCondition = evaluatedCondition.replace(regex, `"${value}"`);
      } else if (typeof value === 'number') {
        evaluatedCondition = evaluatedCondition.replace(regex, String(value));
      } else if (typeof value === 'boolean') {
        evaluatedCondition = evaluatedCondition.replace(regex, String(value));
      } else {
        evaluatedCondition = evaluatedCondition.replace(regex, 'null');
      }
    });
    
    // Basic evaluation for simple conditions
    // In production, use a proper expression evaluator
    return new Function('return ' + evaluatedCondition)();
  } catch (error) {
    console.warn('Error evaluating depends_on condition:', condition, error);
    return true; // Show field by default if evaluation fails
  }
}

/**
 * Format field value for display
 */
export function formatFieldValue(value: unknown, fieldtype: string): string {
  if (value === null || value === undefined) return '';
  
  switch (fieldtype) {
    case 'Date':
      return new Date(value as string).toLocaleDateString();
    case 'Datetime':
      return new Date(value as string).toLocaleString();
    case 'Currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value as number);
    case 'Float':
      return Number(value).toFixed(2);
    case 'Int':
      return Number(value).toLocaleString();
    case 'Check':
      return value ? '✓' : '';
    case 'Percent':
      return `${Number(value).toFixed(2)}%`;
    default:
      return String(value);
  }
}