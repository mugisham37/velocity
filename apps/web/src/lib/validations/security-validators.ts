// Security-specific validators for preventing common attacks

import { ValidationResult } from './field-validators';

/**
 * SQL Injection detection patterns
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
  /(\b(UNION|OR|AND)\s+(SELECT|INSERT|UPDATE|DELETE)\b)/gi,
  /(--|\/\*|\*\/)/g,
  /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT|ONLOAD|ONERROR|ONCLICK)\b)/gi,
  /('|(\\')|(;)|(\\;)|(\|)|(\*)|(%)|(<)|(>)|(\{)|(\})|(\[)|(\]))/g,
];

/**
 * XSS detection patterns
 */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /on\w+\s*=/gi,
  /<[^>]*\s(on\w+|href|src)\s*=\s*["'][^"']*["'][^>]*>/gi,
];

/**
 * Path traversal patterns
 */
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//g,
  /\.\.\\/g,
  /%2e%2e%2f/gi,
  /%2e%2e%5c/gi,
  /\.\.%2f/gi,
  /\.\.%5c/gi,
];

/**
 * Command injection patterns
 */
const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$(){}[\]]/g,
  /\b(cat|ls|dir|type|copy|move|del|rm|mkdir|rmdir|cd|pwd|whoami|id|ps|kill|chmod|chown|sudo|su)\b/gi,
];

/**
 * LDAP injection patterns
 */
const LDAP_INJECTION_PATTERNS = [
  /[()&|!*]/g,
  /\x00/g,
];

/**
 * NoSQL injection patterns
 */
const NOSQL_INJECTION_PATTERNS = [
  /\$where/gi,
  /\$ne/gi,
  /\$gt/gi,
  /\$lt/gi,
  /\$regex/gi,
  /\$or/gi,
  /\$and/gi,
];

/**
 * Validate input against SQL injection patterns
 */
export function validateSqlInjection(input: string): ValidationResult {
  if (!input || typeof input !== 'string') {
    return { isValid: true, sanitizedValue: input };
  }

  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return {
        isValid: false,
        error: 'Input contains potentially dangerous SQL patterns',
      };
    }
  }

  return { isValid: true, sanitizedValue: input };
}

/**
 * Validate input against XSS patterns
 */
export function validateXss(input: string): ValidationResult {
  if (!input || typeof input !== 'string') {
    return { isValid: true, sanitizedValue: input };
  }

  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(input)) {
      return {
        isValid: false,
        error: 'Input contains potentially dangerous script content',
      };
    }
  }

  return { isValid: true, sanitizedValue: input };
}

/**
 * Validate input against path traversal patterns
 */
export function validatePathTraversal(input: string): ValidationResult {
  if (!input || typeof input !== 'string') {
    return { isValid: true, sanitizedValue: input };
  }

  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(input)) {
      return {
        isValid: false,
        error: 'Input contains path traversal patterns',
      };
    }
  }

  return { isValid: true, sanitizedValue: input };
}

/**
 * Validate input against command injection patterns
 */
export function validateCommandInjection(input: string): ValidationResult {
  if (!input || typeof input !== 'string') {
    return { isValid: true, sanitizedValue: input };
  }

  for (const pattern of COMMAND_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return {
        isValid: false,
        error: 'Input contains potentially dangerous command patterns',
      };
    }
  }

  return { isValid: true, sanitizedValue: input };
}

/**
 * Validate input against LDAP injection patterns
 */
export function validateLdapInjection(input: string): ValidationResult {
  if (!input || typeof input !== 'string') {
    return { isValid: true, sanitizedValue: input };
  }

  for (const pattern of LDAP_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return {
        isValid: false,
        error: 'Input contains LDAP injection patterns',
      };
    }
  }

  return { isValid: true, sanitizedValue: input };
}

/**
 * Validate input against NoSQL injection patterns
 */
export function validateNoSqlInjection(input: string): ValidationResult {
  if (!input || typeof input !== 'string') {
    return { isValid: true, sanitizedValue: input };
  }

  for (const pattern of NOSQL_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return {
        isValid: false,
        error: 'Input contains NoSQL injection patterns',
      };
    }
  }

  return { isValid: true, sanitizedValue: input };
}

/**
 * Validate file upload security
 */
export function validateFileUpload(file: File): ValidationResult {
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size exceeds maximum allowed size (10MB)',
    };
  }

  // Check file extension
  const allowedExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', // Images
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', // Documents
    '.txt', '.csv', '.json', '.xml', // Text files
    '.zip', '.rar', '.7z', // Archives
  ];

  const fileName = file.name.toLowerCase();
  const hasAllowedExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

  if (!hasAllowedExtension) {
    return {
      isValid: false,
      error: 'File type not allowed',
    };
  }

  // Check for dangerous file names
  const dangerousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.com$/i,
    /\.pif$/i,
    /\.scr$/i,
    /\.vbs$/i,
    /\.js$/i,
    /\.jar$/i,
    /\.php$/i,
    /\.asp$/i,
    /\.jsp$/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(fileName)) {
      return {
        isValid: false,
        error: 'Dangerous file type detected',
      };
    }
  }

  return { isValid: true, sanitizedValue: file };
}

/**
 * Validate URL for security issues
 */
export function validateSecureUrl(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return { isValid: true, sanitizedValue: url };
  }

  try {
    const urlObj = new URL(url);
    
    // Only allow safe protocols
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return {
        isValid: false,
        error: 'URL protocol not allowed',
      };
    }

    // Block localhost and private IP ranges in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = urlObj.hostname.toLowerCase();
      
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        return {
          isValid: false,
          error: 'Localhost URLs not allowed in production',
        };
      }

      // Block private IP ranges
      const privateIpPatterns = [
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^192\.168\./,
        /^169\.254\./, // Link-local
        /^fc00:/, // IPv6 private
        /^fe80:/, // IPv6 link-local
      ];

      for (const pattern of privateIpPatterns) {
        if (pattern.test(hostname)) {
          return {
            isValid: false,
            error: 'Private IP addresses not allowed',
          };
        }
      }
    }

    return { isValid: true, sanitizedValue: url };
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Comprehensive security validation
 */
export function validateSecurity(
  input: string,
  options: {
    checkSql?: boolean;
    checkXss?: boolean;
    checkPathTraversal?: boolean;
    checkCommandInjection?: boolean;
    checkLdap?: boolean;
    checkNoSql?: boolean;
  } = {}
): ValidationResult {
  if (!input || typeof input !== 'string') {
    return { isValid: true, sanitizedValue: input };
  }

  const {
    checkSql = true,
    checkXss = true,
    checkPathTraversal = true,
    checkCommandInjection = true,
    checkLdap = false,
    checkNoSql = false,
  } = options;

  // Run all enabled security checks
  const checks = [
    { enabled: checkSql, validator: validateSqlInjection },
    { enabled: checkXss, validator: validateXss },
    { enabled: checkPathTraversal, validator: validatePathTraversal },
    { enabled: checkCommandInjection, validator: validateCommandInjection },
    { enabled: checkLdap, validator: validateLdapInjection },
    { enabled: checkNoSql, validator: validateNoSqlInjection },
  ];

  for (const check of checks) {
    if (check.enabled) {
      const result = check.validator(input);
      if (!result.isValid) {
        return result;
      }
    }
  }

  return { isValid: true, sanitizedValue: input };
}

/**
 * Rate limiting validation (for API endpoints)
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Check if request is within rate limit
   */
  checkRateLimit(identifier: string): ValidationResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this identifier
    const requests = this.requests.get(identifier) || [];
    
    // Filter out old requests
    const recentRequests = requests.filter(time => time > windowStart);
    
    // Check if limit exceeded
    if (recentRequests.length >= this.maxRequests) {
      return {
        isValid: false,
        error: 'Rate limit exceeded. Please try again later.',
      };
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return { isValid: true };
  }

  /**
   * Clear old entries to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [identifier, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => time > windowStart);
      
      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }
}

// Create default rate limiter instance
export const defaultRateLimiter = new RateLimiter();

// Cleanup old entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    defaultRateLimiter.cleanup();
  }, 5 * 60 * 1000);
}