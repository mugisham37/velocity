// Security headers and protection utilities

export interface SecurityHeaders {
  'Content-Security-Policy'?: string;
  'X-Content-Type-Options'?: string;
  'X-Frame-Options'?: string;
  'X-XSS-Protection'?: string;
  'Strict-Transport-Security'?: string;
  'Referrer-Policy'?: string;
  'Permissions-Policy'?: string;
  'Cross-Origin-Embedder-Policy'?: string;
  'Cross-Origin-Opener-Policy'?: string;
  'Cross-Origin-Resource-Policy'?: string;
}

/**
 * Generate Content Security Policy header
 */
export function generateCSP(options?: {
  allowInlineStyles?: boolean;
  allowInlineScripts?: boolean;
  allowEval?: boolean;
  additionalScriptSources?: string[];
  additionalStyleSources?: string[];
  additionalImageSources?: string[];
}): string {
  const {
    allowInlineStyles = false,
    allowInlineScripts = false,
    allowEval = false,
    additionalScriptSources = [],
    additionalStyleSources = [],
    additionalImageSources = [],
  } = options || {};

  const directives: string[] = [];

  // Default source
  directives.push("default-src 'self'");

  // Script sources
  const scriptSources = ["'self'"];
  if (allowInlineScripts) {
    scriptSources.push("'unsafe-inline'");
  }
  if (allowEval) {
    scriptSources.push("'unsafe-eval'");
  }
  // Add Next.js specific sources
  scriptSources.push("'unsafe-eval'"); // Next.js requires this for development
  scriptSources.push(...additionalScriptSources);
  directives.push(`script-src ${scriptSources.join(' ')}`);

  // Style sources
  const styleSources = ["'self'"];
  if (allowInlineStyles) {
    styleSources.push("'unsafe-inline'");
  }
  styleSources.push("'unsafe-inline'"); // Required for Tailwind CSS
  styleSources.push(...additionalStyleSources);
  directives.push(`style-src ${styleSources.join(' ')}`);

  // Image sources
  const imageSources = ["'self'", "data:", "blob:"];
  imageSources.push(...additionalImageSources);
  directives.push(`img-src ${imageSources.join(' ')}`);

  // Font sources
  directives.push("font-src 'self' data:");

  // Connect sources (for API calls)
  directives.push("connect-src 'self' ws: wss:");

  // Media sources
  directives.push("media-src 'self'");

  // Object sources
  directives.push("object-src 'none'");

  // Base URI
  directives.push("base-uri 'self'");

  // Form action
  directives.push("form-action 'self'");

  // Frame ancestors (prevent clickjacking)
  directives.push("frame-ancestors 'none'");

  // Upgrade insecure requests in production
  if (process.env.NODE_ENV === 'production') {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join('; ');
}

/**
 * Get default security headers
 */
export function getDefaultSecurityHeaders(): SecurityHeaders {
  return {
    'Content-Security-Policy': generateCSP({
      allowInlineStyles: true, // Required for Tailwind CSS
      allowEval: true, // Required for Next.js development
      additionalScriptSources: [
        "'sha256-*'", // Allow specific script hashes
        "'nonce-*'", // Allow nonce-based scripts
      ],
      additionalStyleSources: [
        "'sha256-*'", // Allow specific style hashes
        "'nonce-*'", // Allow nonce-based styles
        "fonts.googleapis.com",
      ],
      additionalImageSources: [
        "*.gravatar.com",
        "*.githubusercontent.com",
        "data:",
        "blob:",
      ],
    }),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'accelerometer=()',
      'gyroscope=()',
    ].join(', '),
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  };
}

/**
 * CSRF Protection utilities
 */
export class CSRFProtection {
  private static readonly CSRF_HEADER = 'X-CSRF-Token';
  private static readonly CSRF_COOKIE = 'csrf_token';

  /**
   * Generate CSRF token
   */
  static generateToken(): string {
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      // Fallback for server-side
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Set CSRF token in cookie
   */
  static setTokenCookie(token: string): void {
    if (typeof document !== 'undefined') {
      const secure = window.location.protocol === 'https:';
      document.cookie = `${this.CSRF_COOKIE}=${token}; Path=/; SameSite=Strict; HttpOnly=false${secure ? '; Secure' : ''}`;
    }
  }

  /**
   * Get CSRF token from cookie
   */
  static getTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === this.CSRF_COOKIE) {
        return value;
      }
    }
    return null;
  }

  /**
   * Get CSRF token from meta tag
   */
  static getTokenFromMeta(): string | null {
    if (typeof document === 'undefined') return null;

    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') : null;
  }

  /**
   * Get CSRF token (try multiple sources)
   */
  static getToken(): string | null {
    return this.getTokenFromMeta() || this.getTokenFromCookie();
  }

  /**
   * Validate CSRF token
   */
  static validateToken(token: string, expectedToken: string): boolean {
    if (!token || !expectedToken) return false;
    return token === expectedToken;
  }

  /**
   * Add CSRF token to request headers
   */
  static addTokenToHeaders(headers: Record<string, string> = {}): Record<string, string> {
    const token = this.getToken();
    if (token) {
      headers[this.CSRF_HEADER] = token;
    }
    return headers;
  }
}

/**
 * Secure cookie utilities
 */
export class SecureCookies {
  /**
   * Set a secure cookie
   */
  static set(
    name: string,
    value: string,
    options: {
      maxAge?: number; // in seconds
      expires?: Date;
      path?: string;
      domain?: string;
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: 'Strict' | 'Lax' | 'None';
    } = {}
  ): void {
    if (typeof document === 'undefined') return;

    const {
      maxAge,
      expires,
      path = '/',
      domain,
      secure = window.location.protocol === 'https:',
      httpOnly = false,
      sameSite = 'Strict',
    } = options;

    let cookieString = `${name}=${encodeURIComponent(value)}`;

    if (maxAge !== undefined) {
      cookieString += `; Max-Age=${maxAge}`;
    }

    if (expires) {
      cookieString += `; Expires=${expires.toUTCString()}`;
    }

    cookieString += `; Path=${path}`;

    if (domain) {
      cookieString += `; Domain=${domain}`;
    }

    if (secure) {
      cookieString += '; Secure';
    }

    if (httpOnly) {
      cookieString += '; HttpOnly';
    }

    cookieString += `; SameSite=${sameSite}`;

    document.cookie = cookieString;
  }

  /**
   * Get cookie value
   */
  static get(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name) {
        return decodeURIComponent(cookieValue);
      }
    }
    return null;
  }

  /**
   * Delete cookie
   */
  static delete(name: string, path: string = '/', domain?: string): void {
    if (typeof document === 'undefined') return;

    let cookieString = `${name}=; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;

    if (domain) {
      cookieString += `; Domain=${domain}`;
    }

    document.cookie = cookieString;
  }

  /**
   * Set session cookie (expires when browser closes)
   */
  static setSession(name: string, value: string, options: Omit<Parameters<typeof SecureCookies.set>[2], 'maxAge' | 'expires'> = {}): void {
    this.set(name, value, options);
  }

  /**
   * Set persistent cookie (with expiration)
   */
  static setPersistent(
    name: string,
    value: string,
    daysToExpire: number,
    options: Omit<Parameters<typeof SecureCookies.set>[2], 'maxAge' | 'expires'> = {}
  ): void {
    const expires = new Date();
    expires.setDate(expires.getDate() + daysToExpire);
    this.set(name, value, { ...options, expires });
  }
}

/**
 * HTTPS enforcement utilities
 */
export class HTTPSEnforcement {
  /**
   * Check if current connection is secure
   */
  static isSecure(): boolean {
    if (typeof window === 'undefined') return true; // Assume secure on server
    return window.location.protocol === 'https:';
  }

  /**
   * Redirect to HTTPS if not already secure
   */
  static enforceHTTPS(): void {
    if (typeof window === 'undefined') return;

    if (!this.isSecure() && process.env.NODE_ENV === 'production') {
      const httpsUrl = window.location.href.replace('http://', 'https://');
      window.location.replace(httpsUrl);
    }
  }

  /**
   * Get HSTS header value
   */
  static getHSTSHeader(maxAge: number = 31536000, includeSubDomains: boolean = true, preload: boolean = true): string {
    let header = `max-age=${maxAge}`;
    
    if (includeSubDomains) {
      header += '; includeSubDomains';
    }
    
    if (preload) {
      header += '; preload';
    }
    
    return header;
  }
}

/**
 * Security middleware for API requests
 */
export class SecurityMiddleware {
  /**
   * Add security headers to request
   */
  static addSecurityHeaders(headers: Record<string, string> = {}): Record<string, string> {
    // Add CSRF token
    CSRFProtection.addTokenToHeaders(headers);

    // Add other security headers
    headers['X-Requested-With'] = 'XMLHttpRequest';
    
    // Add content type if not present
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  /**
   * Validate response security
   */
  static validateResponse(response: Response): boolean {
    // Check for security headers in response
    const securityHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
    ];

    for (const header of securityHeaders) {
      if (!response.headers.get(header)) {
        console.warn(`Missing security header: ${header}`);
      }
    }

    return true;
  }

  /**
   * Sanitize response data
   */
  static sanitizeResponseData(data: unknown): unknown {
    if (typeof data === 'string') {
      // Remove potential XSS payloads from string responses
      return data
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeResponseData(item));
    }

    if (data && typeof data === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeResponseData(value);
      }
      return sanitized;
    }

    return data;
  }
}

/**
 * Initialize security measures
 */
export function initializeSecurity(): void {
  // Enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    HTTPSEnforcement.enforceHTTPS();
  }

  // Generate and set CSRF token
  const csrfToken = CSRFProtection.generateToken();
  CSRFProtection.setTokenCookie(csrfToken);

  // Add CSRF token to meta tag for easy access
  if (typeof document !== 'undefined') {
    let metaTag = document.querySelector('meta[name="csrf-token"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'csrf-token');
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', csrfToken);
  }

  // Set up security event listeners
  if (typeof window !== 'undefined') {
    // Detect and prevent clickjacking
    if (window.top !== window.self) {
      console.warn('Potential clickjacking attempt detected');
      // Could implement additional protection here
    }

    // Monitor for XSS attempts
    window.addEventListener('error', (event) => {
      if (event.message && event.message.includes('script')) {
        console.warn('Potential XSS attempt detected:', event.message);
      }
    });
  }
}

// All utilities are already exported above