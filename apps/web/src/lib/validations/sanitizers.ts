// Input sanitization utilities to prevent XSS and other security issues

// Simple HTML sanitizer without external dependencies
interface SanitizeConfig {
  allowedTags?: string[];
  allowedAttributes?: string[];
  stripTags?: boolean;
}

/**
 * Simple HTML sanitizer to prevent XSS attacks (without external dependencies)
 */
function simpleHtmlSanitizer(input: string, config: SanitizeConfig): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const allowedTags = config.allowedTags || [
    'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ];
  
  const allowedAttributes = config.allowedAttributes || [
    'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'
  ];

  if (config.stripTags) {
    // Strip all HTML tags but keep content
    return input.replace(/<[^>]*>/g, '');
  }

  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove dangerous event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocol (except for images)
  sanitized = sanitized.replace(/data:(?!image\/)/gi, '');
  
  // Remove style attributes that could contain expressions
  sanitized = sanitized.replace(/style\s*=\s*["'][^"']*expression[^"']*["']/gi, '');
  
  // Basic tag filtering - remove tags not in allowed list
  sanitized = sanitized.replace(/<(\/?)([\w-]+)([^>]*)>/gi, (match, slash, tagName, attributes) => {
    if (!allowedTags.includes(tagName.toLowerCase())) {
      return '';
    }
    
    // Filter attributes
    const filteredAttributes = attributes.replace(/(\w+)\s*=\s*["']([^"']*)["']/g, (attrMatch: string, attrName: string, attrValue: string) => {
      if (allowedAttributes.includes(attrName.toLowerCase())) {
        // Additional sanitization for specific attributes
        if (attrName.toLowerCase() === 'href' || attrName.toLowerCase() === 'src') {
          // Only allow safe protocols
          if (!/^(https?:|mailto:|tel:|#)/i.test(attrValue)) {
            return '';
          }
        }
        return attrMatch;
      }
      return '';
    });
    
    return `<${slash}${tagName}${filteredAttributes}>`;
  });
  
  return sanitized;
}

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string, options?: {
  allowedTags?: string[];
  allowedAttributes?: string[];
  stripTags?: boolean;
}): string {
  return simpleHtmlSanitizer(input, options || {});
}

/**
 * Sanitize plain text input by removing/escaping dangerous characters
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitize SQL input to prevent injection (client-side validation)
 */
export function sanitizeSqlInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove common SQL injection patterns
  return input
    .replace(/['";]/g, '') // Remove quotes and semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*.*?\*\//g, '') // Remove block comments
    .replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi, '') // Remove SQL keywords
    .trim();
}

/**
 * Sanitize URL input
 */
export function sanitizeUrl(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Allow only safe protocols
  const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'ftp:'];
  
  try {
    const url = new URL(input);
    if (!allowedProtocols.includes(url.protocol)) {
      return '';
    }
    return url.toString();
  } catch {
    // If not a valid URL, treat as relative path
    return input.replace(/[<>'"]/g, '');
  }
}

/**
 * Sanitize file name
 */
export function sanitizeFileName(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid file name characters
    .replace(/\.\./g, '') // Remove directory traversal
    .replace(/^\./, '') // Remove leading dot
    .trim();
}

/**
 * Sanitize JSON input
 */
export function sanitizeJson(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  try {
    // Parse and stringify to ensure valid JSON
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed);
  } catch {
    return '';
  }
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: string | number): number | null {
  if (typeof input === 'number') {
    return isFinite(input) ? input : null;
  }

  if (!input || typeof input !== 'string') {
    return null;
  }

  // Remove non-numeric characters except decimal point and minus sign
  const cleaned = input.replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  
  return isFinite(num) ? num : null;
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .toLowerCase()
    .replace(/[<>'"]/g, '')
    .trim();
}

/**
 * Sanitize phone number input
 */
export function sanitizePhone(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Keep only digits, plus sign, and hyphens
  return input.replace(/[^0-9+\-\s()]/g, '').trim();
}

/**
 * Sanitize search query input
 */
export function sanitizeSearchQuery(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[<>'"]/g, '') // Remove dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 100); // Limit length
}

/**
 * Sanitize CSS input (for custom styling)
 */
export function sanitizeCss(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove dangerous CSS patterns
  return input
    .replace(/javascript:/gi, '')
    .replace(/expression\s*\(/gi, '')
    .replace(/@import/gi, '')
    .replace(/behavior\s*:/gi, '')
    .replace(/binding\s*:/gi, '')
    .replace(/url\s*\(/gi, '')
    .trim();
}

/**
 * Generic sanitizer that applies appropriate sanitization based on data type
 */
export function sanitizeInput(
  input: unknown,
  type: 'html' | 'text' | 'sql' | 'url' | 'filename' | 'json' | 'number' | 'email' | 'phone' | 'search' | 'css' = 'text'
): unknown {
  if (input === null || input === undefined) {
    return input;
  }

  const stringInput = String(input);

  switch (type) {
    case 'html':
      return sanitizeHtml(stringInput);
    case 'text':
      return sanitizeText(stringInput);
    case 'sql':
      return sanitizeSqlInput(stringInput);
    case 'url':
      return sanitizeUrl(stringInput);
    case 'filename':
      return sanitizeFileName(stringInput);
    case 'json':
      return sanitizeJson(stringInput);
    case 'number':
      return sanitizeNumber(stringInput);
    case 'email':
      return sanitizeEmail(stringInput);
    case 'phone':
      return sanitizePhone(stringInput);
    case 'search':
      return sanitizeSearchQuery(stringInput);
    case 'css':
      return sanitizeCss(stringInput);
    default:
      return sanitizeText(stringInput);
  }
}

/**
 * Sanitize an entire object recursively
 */
export function sanitizeObject(
  obj: Record<string, unknown>,
  fieldTypes?: Record<string, string>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      sanitized[key] = value;
      continue;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>, fieldTypes);
      continue;
    }

    if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'object' && item !== null
          ? sanitizeObject(item as Record<string, unknown>, fieldTypes)
          : sanitizeInput(item, 'text')
      );
      continue;
    }

    // Determine sanitization type based on field type or key name
    let sanitizationType: Parameters<typeof sanitizeInput>[1] = 'text';
    
    if (fieldTypes && fieldTypes[key]) {
      const fieldType = fieldTypes[key].toLowerCase();
      if (fieldType.includes('html') || fieldType.includes('editor')) {
        sanitizationType = 'html';
      } else if (fieldType.includes('email')) {
        sanitizationType = 'email';
      } else if (fieldType.includes('url') || fieldType.includes('link')) {
        sanitizationType = 'url';
      } else if (fieldType.includes('number') || fieldType.includes('currency') || fieldType.includes('float')) {
        sanitizationType = 'number';
      } else if (fieldType.includes('phone')) {
        sanitizationType = 'phone';
      }
    } else {
      // Infer from key name
      const keyLower = key.toLowerCase();
      if (keyLower.includes('email')) {
        sanitizationType = 'email';
      } else if (keyLower.includes('url') || keyLower.includes('link')) {
        sanitizationType = 'url';
      } else if (keyLower.includes('phone')) {
        sanitizationType = 'phone';
      } else if (keyLower.includes('html') || keyLower.includes('content')) {
        sanitizationType = 'html';
      }
    }

    sanitized[key] = sanitizeInput(value, sanitizationType);
  }

  return sanitized;
}