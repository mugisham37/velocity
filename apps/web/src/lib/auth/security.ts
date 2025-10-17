// Enhanced security features for authentication system

import { apiClient } from '@/lib/api';

export interface SecurityConfig {
  sessionTimeout: number; // in milliseconds
  maxLoginAttempts: number;
  lockoutDuration: number; // in milliseconds
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  enableMFA: boolean;
  csrfProtection: boolean;
}

export const defaultSecurityConfig: SecurityConfig = {
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: true,
  enableMFA: false,
  csrfProtection: true,
};

/**
 * Password strength validator
 */
export function validatePasswordStrength(
  password: string,
  config: Partial<SecurityConfig> = {}
): { isValid: boolean; score: number; feedback: string[] } {
  const cfg = { ...defaultSecurityConfig, ...config };
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return { isValid: false, score: 0, feedback: ['Password is required'] };
  }

  // Length check
  if (password.length < cfg.passwordMinLength) {
    feedback.push(`Password must be at least ${cfg.passwordMinLength} characters long`);
  } else {
    score += 1;
  }

  // Uppercase check
  if (cfg.passwordRequireUppercase && !/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score += 1;
  }

  // Lowercase check
  if (cfg.passwordRequireLowercase && !/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score += 1;
  }

  // Numbers check
  if (cfg.passwordRequireNumbers && !/\d/.test(password)) {
    feedback.push('Password must contain at least one number');
  } else if (/\d/.test(password)) {
    score += 1;
  }

  // Special characters check
  if (cfg.passwordRequireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('Password must contain at least one special character');
  } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  }

  // Additional strength checks
  if (password.length >= 12) {
    score += 1;
  }

  if (/[!@#$%^&*(),.?":{}|<>].*[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1; // Multiple special characters
  }

  // Check for common patterns
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /admin/i,
    /letmein/i,
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      feedback.push('Password contains common patterns that are easily guessed');
      score = Math.max(0, score - 2);
      break;
    }
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Password should not contain repeated characters');
    score = Math.max(0, score - 1);
  }

  const isValid = feedback.length === 0;
  return { isValid, score: Math.min(score, 5), feedback };
}

/**
 * Login attempt tracker for rate limiting
 */
export class LoginAttemptTracker {
  private attempts: Map<string, { count: number; lastAttempt: number; lockedUntil?: number }> = new Map();
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...defaultSecurityConfig, ...config };
  }

  /**
   * Check if user is locked out
   */
  isLockedOut(identifier: string): boolean {
    const record = this.attempts.get(identifier);
    if (!record) return false;

    if (record.lockedUntil && Date.now() < record.lockedUntil) {
      return true;
    }

    // Clear lockout if expired
    if (record.lockedUntil && Date.now() >= record.lockedUntil) {
      record.lockedUntil = undefined;
      record.count = 0;
    }

    return false;
  }

  /**
   * Record a failed login attempt
   */
  recordFailedAttempt(identifier: string): { isLockedOut: boolean; attemptsRemaining: number; lockoutDuration?: number } {
    const now = Date.now();
    const record = this.attempts.get(identifier) || { count: 0, lastAttempt: now };

    record.count += 1;
    record.lastAttempt = now;

    if (record.count >= this.config.maxLoginAttempts) {
      record.lockedUntil = now + this.config.lockoutDuration;
      this.attempts.set(identifier, record);
      
      return {
        isLockedOut: true,
        attemptsRemaining: 0,
        lockoutDuration: this.config.lockoutDuration,
      };
    }

    this.attempts.set(identifier, record);
    
    return {
      isLockedOut: false,
      attemptsRemaining: this.config.maxLoginAttempts - record.count,
    };
  }

  /**
   * Record a successful login (clears attempts)
   */
  recordSuccessfulLogin(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Get remaining lockout time
   */
  getRemainingLockoutTime(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record || !record.lockedUntil) return 0;

    return Math.max(0, record.lockedUntil - Date.now());
  }

  /**
   * Clear old entries to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [identifier, record] of this.attempts.entries()) {
      if (now - record.lastAttempt > maxAge) {
        this.attempts.delete(identifier);
      }
    }
  }
}

/**
 * CSRF Token Manager
 */
export class CSRFTokenManager {
  private token: string | null = null;
  private tokenExpiry: number = 0;

  /**
   * Generate a new CSRF token
   */
  generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    this.token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    this.tokenExpiry = Date.now() + (60 * 60 * 1000); // 1 hour
    
    // Store in session storage for persistence across tabs
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('csrf_token', this.token);
      sessionStorage.setItem('csrf_token_expiry', this.tokenExpiry.toString());
    }
    
    return this.token;
  }

  /**
   * Get current CSRF token
   */
  getToken(): string | null {
    // Try to get from memory first
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    // Try to get from session storage
    if (typeof window !== 'undefined') {
      const storedToken = sessionStorage.getItem('csrf_token');
      const storedExpiry = sessionStorage.getItem('csrf_token_expiry');
      
      if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry)) {
        this.token = storedToken;
        this.tokenExpiry = parseInt(storedExpiry);
        return this.token;
      }
    }

    // Generate new token if none exists or expired
    return this.generateToken();
  }

  /**
   * Validate CSRF token
   */
  validateToken(token: string): boolean {
    const currentToken = this.getToken();
    return currentToken === token && Date.now() < this.tokenExpiry;
  }

  /**
   * Clear CSRF token
   */
  clearToken(): void {
    this.token = null;
    this.tokenExpiry = 0;
    
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('csrf_token');
      sessionStorage.removeItem('csrf_token_expiry');
    }
  }
}

/**
 * Secure session manager with enhanced security features
 */
export class SecureSessionManager {
  private config: SecurityConfig;
  private loginTracker: LoginAttemptTracker;
  private csrfManager: CSRFTokenManager;
  private sessionStartTime: number = 0;
  private lastActivityTime: number = 0;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...defaultSecurityConfig, ...config };
    this.loginTracker = new LoginAttemptTracker(config);
    this.csrfManager = new CSRFTokenManager();
  }

  /**
   * Enhanced login with security checks
   */
  async secureLogin(credentials: { usr: string; pwd: string }): Promise<{
    success: boolean;
    error?: string;
    lockoutInfo?: { isLockedOut: boolean; attemptsRemaining: number; lockoutDuration?: number };
  }> {
    const identifier = credentials.usr.toLowerCase();

    // Check if user is locked out
    if (this.loginTracker.isLockedOut(identifier)) {
      const remainingTime = this.loginTracker.getRemainingLockoutTime(identifier);
      return {
        success: false,
        error: `Account locked. Try again in ${Math.ceil(remainingTime / 60000)} minutes.`,
        lockoutInfo: { isLockedOut: true, attemptsRemaining: 0, lockoutDuration: remainingTime },
      };
    }

    // Validate password strength (for new passwords)
    if (credentials.pwd) {
      const strengthCheck = validatePasswordStrength(credentials.pwd, this.config);
      if (!strengthCheck.isValid && credentials.usr !== 'Administrator') {
        // Allow weak passwords only for Administrator account
        return {
          success: false,
          error: `Password does not meet security requirements: ${strengthCheck.feedback.join(', ')}`,
        };
      }
    }

    try {
      // Attempt login
      await apiClient.login(credentials);
      
      // Record successful login
      this.loginTracker.recordSuccessfulLogin(identifier);
      this.sessionStartTime = Date.now();
      this.lastActivityTime = Date.now();
      
      // Generate CSRF token
      if (this.config.csrfProtection) {
        this.csrfManager.generateToken();
      }

      return { success: true };
    } catch (error) {
      // Record failed attempt
      const lockoutInfo = this.loginTracker.recordFailedAttempt(identifier);
      
      let errorMessage = 'Invalid credentials';
      if (lockoutInfo.isLockedOut) {
        errorMessage = `Too many failed attempts. Account locked for ${Math.ceil((lockoutInfo.lockoutDuration || 0) / 60000)} minutes.`;
      } else if (lockoutInfo.attemptsRemaining <= 2) {
        errorMessage = `Invalid credentials. ${lockoutInfo.attemptsRemaining} attempts remaining before lockout.`;
      }

      return {
        success: false,
        error: errorMessage,
        lockoutInfo,
      };
    }
  }

  /**
   * Check if session is expired
   */
  isSessionExpired(): boolean {
    if (!this.sessionStartTime) return true;

    const now = Date.now();
    const sessionAge = now - this.sessionStartTime;
    const inactivityTime = now - this.lastActivityTime;

    // Check absolute session timeout
    if (sessionAge > this.config.sessionTimeout) {
      return true;
    }

    // Check inactivity timeout (30 minutes)
    const inactivityTimeout = 30 * 60 * 1000;
    if (inactivityTime > inactivityTimeout) {
      return true;
    }

    return false;
  }

  /**
   * Update last activity time
   */
  updateActivity(): void {
    this.lastActivityTime = Date.now();
  }

  /**
   * Get CSRF token for requests
   */
  getCSRFToken(): string | null {
    if (!this.config.csrfProtection) return null;
    return this.csrfManager.getToken();
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(token: string): boolean {
    if (!this.config.csrfProtection) return true;
    return this.csrfManager.validateToken(token);
  }

  /**
   * Secure logout
   */
  async secureLogout(): Promise<void> {
    try {
      await apiClient.logout();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear all security tokens and session data
      this.csrfManager.clearToken();
      this.sessionStartTime = 0;
      this.lastActivityTime = 0;
      
      // Clear all stored authentication data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        sessionStorage.clear();
      }
    }
  }

  /**
   * Get session info for monitoring
   */
  getSessionInfo(): {
    sessionAge: number;
    inactivityTime: number;
    isExpired: boolean;
    csrfToken?: string;
  } {
    const now = Date.now();
    return {
      sessionAge: this.sessionStartTime ? now - this.sessionStartTime : 0,
      inactivityTime: this.lastActivityTime ? now - this.lastActivityTime : 0,
      isExpired: this.isSessionExpired(),
      csrfToken: this.getCSRFToken() || undefined,
    };
  }

  /**
   * Cleanup old data
   */
  cleanup(): void {
    this.loginTracker.cleanup();
  }
}

// Create singleton instances
export const secureSessionManager = new SecureSessionManager();
export const csrfTokenManager = new CSRFTokenManager();
export const loginAttemptTracker = new LoginAttemptTracker();

// Cleanup old data every hour
if (typeof window !== 'undefined') {
  setInterval(() => {
    secureSessionManager.cleanup();
  }, 60 * 60 * 1000);
}

/**
 * Multi-Factor Authentication (MFA) support
 */
export interface MFAConfig {
  enabled: boolean;
  methods: ('totp' | 'sms' | 'email')[];
  backupCodes: string[];
}

export class MFAManager {
  /**
   * Generate backup codes for MFA
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Verify TOTP code
   */
  async verifyTOTP(code: string, secret: string): Promise<boolean> {
    // This would integrate with a TOTP library like otplib
    // For now, return a placeholder
    return code.length === 6 && /^\d{6}$/.test(code);
  }

  /**
   * Send SMS verification code
   */
  async sendSMSCode(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    // This would integrate with an SMS service
    // For now, return a placeholder
    return { success: true };
  }

  /**
   * Send email verification code
   */
  async sendEmailCode(email: string): Promise<{ success: boolean; error?: string }> {
    // This would integrate with an email service
    // For now, return a placeholder
    return { success: true };
  }

  /**
   * Verify backup code
   */
  verifyBackupCode(code: string, validCodes: string[]): boolean {
    return validCodes.includes(code.toUpperCase());
  }
}

export const mfaManager = new MFAManager();