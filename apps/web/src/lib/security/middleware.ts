// Security middleware for Next.js application

import { NextRequest, NextResponse } from 'next/server';
import { getDefaultSecurityHeaders, CSRFProtection } from './headers';

/**
 * Security middleware for Next.js
 */
export function securityMiddleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers
  const securityHeaders = getDefaultSecurityHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value);
    }
  });

  // CSRF Protection for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const csrfToken = request.headers.get('X-CSRF-Token');
    const cookieToken = request.cookies.get('csrf_token')?.value;

    if (!csrfToken || !cookieToken || csrfToken !== cookieToken) {
      // Allow API routes to handle CSRF validation
      if (request.nextUrl.pathname.startsWith('/api/')) {
        // Let API routes handle CSRF validation
        response.headers.set('X-CSRF-Required', 'true');
      } else {
        return new NextResponse('CSRF token mismatch', { status: 403 });
      }
    }
  }

  // Add CSRF token to response for GET requests
  if (request.method === 'GET') {
    const existingToken = request.cookies.get('csrf_token')?.value;
    if (!existingToken) {
      const newToken = CSRFProtection.generateToken();
      response.cookies.set('csrf_token', newToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });
    }
  }

  return response;
}

/**
 * API route security wrapper
 */
export function withSecurity<T extends (...args: unknown[]) => unknown>(
  handler: T,
  options: {
    requireCSRF?: boolean;
    allowedMethods?: string[];
    rateLimit?: {
      windowMs: number;
      maxRequests: number;
    };
  } = {}
): T {
  const {
    requireCSRF = true,
    allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    rateLimit,
  } = options;

  return (async (req: NextRequest, ...args: unknown[]) => {
    // Method validation
    if (!allowedMethods.includes(req.method || '')) {
      return new NextResponse('Method not allowed', { status: 405 });
    }

    // CSRF validation for state-changing requests
    if (requireCSRF && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method || '')) {
      const csrfToken = req.headers.get('X-CSRF-Token');
      const cookieToken = req.cookies.get('csrf_token')?.value;

      if (!csrfToken || !cookieToken || !CSRFProtection.validateToken(csrfToken, cookieToken)) {
        return new NextResponse('CSRF token validation failed', { status: 403 });
      }
    }

    // Rate limiting (if configured)
    if (rateLimit) {
      // Implementation would depend on your rate limiting strategy
      // This is a placeholder for rate limiting logic
    }

    // Call the original handler
    return handler(req, ...args);
  }) as T;
}

/**
 * Content Security Policy nonce generator
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

/**
 * Security headers for API responses
 */
export function addAPISecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Prevent caching of sensitive API responses
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

/**
 * Input sanitization middleware
 */
export function sanitizeInput(data: unknown): unknown {
  if (typeof data === 'string') {
    return data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeInput(item));
  }

  if (data && typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  return data;
}

/**
 * Request validation middleware
 */
export function validateRequest(req: NextRequest): { isValid: boolean; error?: string } {
  // Check content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
    const contentType = req.headers.get('content-type');
    if (!contentType || (!contentType.includes('application/json') && !contentType.includes('multipart/form-data'))) {
      return { isValid: false, error: 'Invalid content type' };
    }
  }

  // Check for required headers
  const requiredHeaders = ['user-agent'];
  for (const header of requiredHeaders) {
    if (!req.headers.get(header)) {
      return { isValid: false, error: `Missing required header: ${header}` };
    }
  }

  // Check for suspicious patterns in URL
  const suspiciousPatterns = [
    /\.\.\//,
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(req.url)) {
      return { isValid: false, error: 'Suspicious URL pattern detected' };
    }
  }

  return { isValid: true };
}