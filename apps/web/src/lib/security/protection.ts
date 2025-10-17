// Additional security protection utilities

/**
 * XSS Protection utilities
 */
export class XSSProtection {
  /**
   * Encode HTML entities to prevent XSS
   */
  static encodeHTML(str: string): string {
    const entityMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;',
    };

    return str.replace(/[&<>"'`=\/]/g, (s) => entityMap[s]);
  }

  /**
   * Decode HTML entities
   */
  static decodeHTML(str: string): string {
    const entityMap: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&#x2F;': '/',
      '&#x60;': '`',
      '&#x3D;': '=',
    };

    return str.replace(/&(amp|lt|gt|quot|#39|#x2F|#x60|#x3D);/g, (match) => entityMap[match]);
  }

  /**
   * Strip dangerous HTML tags
   */
  static stripDangerousTags(html: string): string {
    const dangerousTags = [
      'script',
      'object',
      'embed',
      'form',
      'iframe',
      'frame',
      'frameset',
      'applet',
      'link',
      'style',
      'meta',
      'base',
    ];

    let cleaned = html;
    
    for (const tag of dangerousTags) {
      const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
      cleaned = cleaned.replace(regex, '');
      
      // Also remove self-closing tags
      const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
      cleaned = cleaned.replace(selfClosingRegex, '');
    }

    return cleaned;
  }

  /**
   * Remove dangerous attributes
   */
  static stripDangerousAttributes(html: string): string {
    const dangerousAttributes = [
      'onload',
      'onerror',
      'onclick',
      'onmouseover',
      'onmouseout',
      'onkeydown',
      'onkeyup',
      'onkeypress',
      'onfocus',
      'onblur',
      'onchange',
      'onsubmit',
      'onreset',
      'onselect',
      'onresize',
      'onscroll',
      'style',
    ];

    let cleaned = html;
    
    for (const attr of dangerousAttributes) {
      const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
      cleaned = cleaned.replace(regex, '');
    }

    return cleaned;
  }

  /**
   * Comprehensive XSS cleaning
   */
  static clean(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let cleaned = input;
    
    // Remove dangerous tags
    cleaned = this.stripDangerousTags(cleaned);
    
    // Remove dangerous attributes
    cleaned = this.stripDangerousAttributes(cleaned);
    
    // Remove javascript: and data: protocols
    cleaned = cleaned.replace(/javascript:/gi, '');
    cleaned = cleaned.replace(/data:(?!image\/)/gi, '');
    
    // Remove vbscript: protocol
    cleaned = cleaned.replace(/vbscript:/gi, '');
    
    return cleaned.trim();
  }
}

/**
 * SQL Injection Protection
 */
export class SQLInjectionProtection {
  /**
   * Escape SQL special characters
   */
  static escape(value: string): string {
    if (typeof value !== 'string') {
      return String(value);
    }

    return value
      .replace(/'/g, "''")
      .replace(/\\/g, '\\\\')
      .replace(/\0/g, '\\0')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\x1a/g, '\\Z');
  }

  /**
   * Validate SQL input for dangerous patterns
   */
  static validate(input: string): { isValid: boolean; error?: string } {
    if (!input || typeof input !== 'string') {
      return { isValid: true };
    }

    const dangerousPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
      /(\b(UNION|OR|AND)\s+(SELECT|INSERT|UPDATE|DELETE)\b)/gi,
      /(--|\/\*|\*\/)/g,
      /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b)/gi,
      /('|(\\')|(;)|(\\;)|(\|)|(\*))/g,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(input)) {
        return {
          isValid: false,
          error: 'Input contains potentially dangerous SQL patterns',
        };
      }
    }

    return { isValid: true };
  }
}

/**
 * Path Traversal Protection
 */
export class PathTraversalProtection {
  /**
   * Normalize path to prevent traversal
   */
  static normalizePath(path: string): string {
    if (!path || typeof path !== 'string') {
      return '';
    }

    // Remove dangerous patterns
    let normalized = path
      .replace(/\.\.\//g, '')
      .replace(/\.\.\\/g, '')
      .replace(/%2e%2e%2f/gi, '')
      .replace(/%2e%2e%5c/gi, '')
      .replace(/\.\.%2f/gi, '')
      .replace(/\.\.%5c/gi, '');

    // Remove null bytes
    normalized = normalized.replace(/\0/g, '');

    // Ensure path doesn't start with /
    if (normalized.startsWith('/')) {
      normalized = normalized.substring(1);
    }

    return normalized;
  }

  /**
   * Validate path for traversal attempts
   */
  static validate(path: string): { isValid: boolean; error?: string } {
    if (!path || typeof path !== 'string') {
      return { isValid: true };
    }

    const dangerousPatterns = [
      /\.\.\//,
      /\.\.\\/,
      /%2e%2e%2f/i,
      /%2e%2e%5c/i,
      /\.\.%2f/i,
      /\.\.%5c/i,
      /\0/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(path)) {
        return {
          isValid: false,
          error: 'Path contains traversal patterns',
        };
      }
    }

    return { isValid: true };
  }
}

/**
 * Command Injection Protection
 */
export class CommandInjectionProtection {
  /**
   * Validate input for command injection patterns
   */
  static validate(input: string): { isValid: boolean; error?: string } {
    if (!input || typeof input !== 'string') {
      return { isValid: true };
    }

    const dangerousPatterns = [
      /[;&|`$(){}[\]]/,
      /\b(cat|ls|dir|type|copy|move|del|rm|mkdir|rmdir|cd|pwd|whoami|id|ps|kill|chmod|chown|sudo|su)\b/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(input)) {
        return {
          isValid: false,
          error: 'Input contains potentially dangerous command patterns',
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Sanitize command input
   */
  static sanitize(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/[;&|`$(){}[\]]/g, '')
      .replace(/\b(cat|ls|dir|type|copy|move|del|rm|mkdir|rmdir|cd|pwd|whoami|id|ps|kill|chmod|chown|sudo|su)\b/gi, '')
      .trim();
  }
}

/**
 * File Upload Security
 */
export class FileUploadSecurity {
  private static readonly ALLOWED_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', // Images
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', // Documents
    '.txt', '.csv', '.json', '.xml', // Text files
    '.zip', '.rar', '.7z', // Archives
  ];

  private static readonly DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js',
    '.jar', '.php', '.asp', '.jsp', '.py', '.rb', '.pl', '.sh',
  ];

  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  /**
   * Validate file upload
   */
  static validate(file: File): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size (${this.MAX_FILE_SIZE / 1024 / 1024}MB)`,
      };
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasAllowedExtension = this.ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));

    if (!hasAllowedExtension) {
      return {
        isValid: false,
        error: 'File type not allowed',
      };
    }

    // Check for dangerous extensions
    const hasDangerousExtension = this.DANGEROUS_EXTENSIONS.some(ext => fileName.endsWith(ext));

    if (hasDangerousExtension) {
      return {
        isValid: false,
        error: 'Dangerous file type detected',
      };
    }

    // Check for double extensions
    const extensionCount = (fileName.match(/\./g) || []).length;
    if (extensionCount > 1) {
      return {
        isValid: false,
        error: 'Files with multiple extensions are not allowed',
      };
    }

    return { isValid: true };
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(filename: string): string {
    if (!filename || typeof filename !== 'string') {
      return 'unnamed_file';
    }

    return filename
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
      .replace(/\.\./g, '') // Remove directory traversal
      .replace(/^\./, '') // Remove leading dot
      .trim()
      .substring(0, 255); // Limit length
  }

  /**
   * Generate secure filename
   */
  static generateSecureFilename(originalName: string): string {
    const sanitized = this.sanitizeFilename(originalName);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    const extension = sanitized.substring(sanitized.lastIndexOf('.'));
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
    
    return `${nameWithoutExt}_${timestamp}_${random}${extension}`;
  }
}

/**
 * Session Security
 */
export class SessionSecurity {
  /**
   * Generate secure session ID
   */
  static generateSessionId(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate session ID format
   */
  static validateSessionId(sessionId: string): boolean {
    if (!sessionId || typeof sessionId !== 'string') {
      return false;
    }

    // Check length (should be 64 characters for 32 bytes in hex)
    if (sessionId.length !== 64) {
      return false;
    }

    // Check if it's valid hex
    return /^[a-f0-9]{64}$/i.test(sessionId);
  }

  /**
   * Check if session is expired
   */
  static isSessionExpired(sessionStart: number, maxAge: number): boolean {
    return Date.now() - sessionStart > maxAge;
  }

  /**
   * Generate session fingerprint for additional security
   */
  static generateFingerprint(userAgent: string, ip: string): string {
    const data = `${userAgent}:${ip}`;
    // In a real implementation, you'd use a proper hash function
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
}

// All protection classes are already exported above