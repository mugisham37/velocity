// Session management utilities for ERPNext authentication

import { apiClient } from '@/lib/api';

export interface SessionConfig {
  checkInterval: number; // in milliseconds
  warningTime: number; // in milliseconds before expiry to show warning
  maxRetries: number;
  retryDelay: number; // in milliseconds
}

export const defaultSessionConfig: SessionConfig = {
  checkInterval: 5 * 60 * 1000, // 5 minutes
  warningTime: 10 * 60 * 1000, // 10 minutes
  maxRetries: 3,
  retryDelay: 1000, // 1 second
};

export class SessionManager {
  private config: SessionConfig;
  private checkTimer?: NodeJS.Timeout;
  private warningTimer?: NodeJS.Timeout;
  private onSessionExpired?: () => void;
  private onSessionWarning?: (timeLeft: number) => void;
  private retryCount = 0;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...defaultSessionConfig, ...config };
  }

  /**
   * Start automatic session monitoring
   */
  start(callbacks?: {
    onSessionExpired?: () => void;
    onSessionWarning?: (timeLeft: number) => void;
  }) {
    this.onSessionExpired = callbacks?.onSessionExpired;
    this.onSessionWarning = callbacks?.onSessionWarning;

    this.startSessionCheck();
  }

  /**
   * Stop session monitoring
   */
  stop() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = undefined;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = undefined;
    }
    this.retryCount = 0;
  }

  /**
   * Check if session is still valid
   */
  async checkSession(): Promise<boolean> {
    try {
      const isValid = await apiClient.ping();
      this.retryCount = 0; // Reset retry count on success
      return isValid;
    } catch (error) {
      console.warn('Session check failed:', error);
      
      // Retry logic
      if (this.retryCount < this.config.maxRetries) {
        this.retryCount++;
        await this.delay(this.config.retryDelay * this.retryCount);
        return this.checkSession();
      }
      
      return false;
    }
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<boolean> {
    try {
      // Try to get current user info to refresh session
      await apiClient.getCurrentUser();
      this.retryCount = 0;
      return true;
    } catch (error) {
      console.warn('Session refresh failed:', error);
      return false;
    }
  }

  /**
   * Get session expiry time from server
   */
  async getSessionExpiry(): Promise<Date | null> {
    try {
      // This would call a Frappe method to get session expiry
      // For now, we'll estimate based on typical Frappe session timeout (24 hours)
      const response = await apiClient.call<{ expires_on?: string }>('frappe.auth.get_session_info');
      
      if (response && response.expires_on) {
        return new Date(response.expires_on);
      }
      
      // Fallback: assume 24 hour session
      const now = new Date();
      now.setHours(now.getHours() + 24);
      return now;
    } catch (error) {
      console.warn('Could not get session expiry:', error);
      return null;
    }
  }

  /**
   * Set up session warning
   */
  private async setupSessionWarning() {
    const expiryTime = await this.getSessionExpiry();
    if (!expiryTime) return;

    const now = new Date();
    const timeUntilExpiry = expiryTime.getTime() - now.getTime();
    const timeUntilWarning = timeUntilExpiry - this.config.warningTime;

    if (timeUntilWarning > 0) {
      this.warningTimer = setTimeout(() => {
        const timeLeft = Math.max(0, expiryTime.getTime() - new Date().getTime());
        this.onSessionWarning?.(timeLeft);
      }, timeUntilWarning);
    } else if (timeUntilExpiry > 0) {
      // Show warning immediately if we're already in warning period
      this.onSessionWarning?.(timeUntilExpiry);
    }
  }

  /**
   * Start periodic session checking
   */
  private startSessionCheck() {
    // Initial setup
    this.setupSessionWarning();

    // Periodic checks
    this.checkTimer = setInterval(async () => {
      const isValid = await this.checkSession();
      
      if (!isValid) {
        this.stop();
        this.onSessionExpired?.();
      }
    }, this.config.checkInterval);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const sessionManager = new SessionManager();

/**
 * Hook for session management in React components
 */
export function useSessionManager(config?: Partial<SessionConfig>) {
  const manager = new SessionManager(config);
  
  return {
    start: manager.start.bind(manager),
    stop: manager.stop.bind(manager),
    checkSession: manager.checkSession.bind(manager),
    refreshSession: manager.refreshSession.bind(manager),
    getSessionExpiry: manager.getSessionExpiry.bind(manager),
  };
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return 'less than a minute';
  }
}