'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { initializeSecurity } from '@/lib/security/headers';
import { secureSessionManager } from '@/lib/auth/security';
import { accessControlManager } from '@/lib/security/access-control';
import { validationEngine } from '@/lib/validations/validation-engine';

interface SecurityContextType {
  isSecurityInitialized: boolean;
  csrfToken: string | null;
  hasPermission: (doctype: string, permission: string, docname?: string) => boolean;
  hasFieldPermission: (doctype: string, fieldname: string, permission: 'read' | 'write') => boolean;
  validateInput: (input: string, type?: string) => { isValid: boolean; error?: string };
  sanitizeInput: (input: string) => string;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

export function useSecurityContext() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
}

interface SecurityProviderProps {
  children: React.ReactNode;
}

export function SecurityProvider({ children }: SecurityProviderProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [isSecurityInitialized, setIsSecurityInitialized] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    // Initialize security measures
    initializeSecurity();
    
    // Get CSRF token
    const token = secureSessionManager.getCSRFToken();
    setCsrfToken(token);
    
    setIsSecurityInitialized(true);
  }, []);

  useEffect(() => {
    // Update activity when user interacts
    const updateActivity = () => {
      if (isAuthenticated) {
        secureSessionManager.updateActivity();
      }
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [isAuthenticated]);

  const hasPermission = (doctype: string, permission: string, docname?: string) => {
    if (!user) return false;
    return accessControlManager.hasPermission(
      user.name,
      doctype,
      permission as keyof import('@/lib/security/access-control').Permission,
      docname
    );
  };

  const hasFieldPermission = (doctype: string, fieldname: string, permission: 'read' | 'write') => {
    if (!user) return false;
    return accessControlManager.hasFieldPermission(user.name, doctype, fieldname, permission);
  };

  const validateInput = (input: string, type?: string) => {
    // Use the validation engine for comprehensive validation
    return validationEngine.validateField('Generic', 'input', input);
  };

  const sanitizeInput = (input: string) => {
    // Basic sanitization - in a real implementation, this would use the sanitizers
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  };

  const contextValue: SecurityContextType = {
    isSecurityInitialized,
    csrfToken,
    hasPermission,
    hasFieldPermission,
    validateInput,
    sanitizeInput,
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
}

/**
 * Higher-order component for permission-based rendering
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission: {
    doctype: string;
    permission: string;
    docname?: string;
  }
) {
  return function PermissionWrappedComponent(props: P) {
    const { hasPermission } = useSecurityContext();
    const { user } = useAuthStore();

    if (!user) {
      return null;
    }

    const hasAccess = hasPermission(
      requiredPermission.doctype,
      requiredPermission.permission,
      requiredPermission.docname
    );

    if (!hasAccess) {
      return (
        <div className="p-4 text-center text-gray-500">
          <p>You don't have permission to access this content.</p>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

/**
 * Permission-based conditional rendering hook
 */
export function usePermissionCheck() {
  const { hasPermission, hasFieldPermission } = useSecurityContext();
  const { user } = useAuthStore();

  return {
    canRead: (doctype: string, docname?: string) => 
      user ? hasPermission(doctype, 'read', docname) : false,
    
    canWrite: (doctype: string, docname?: string) => 
      user ? hasPermission(doctype, 'write', docname) : false,
    
    canCreate: (doctype: string) => 
      user ? hasPermission(doctype, 'create') : false,
    
    canDelete: (doctype: string, docname?: string) => 
      user ? hasPermission(doctype, 'delete', docname) : false,
    
    canSubmit: (doctype: string, docname?: string) => 
      user ? hasPermission(doctype, 'submit', docname) : false,
    
    canCancel: (doctype: string, docname?: string) => 
      user ? hasPermission(doctype, 'cancel', docname) : false,
    
    canReadField: (doctype: string, fieldname: string) => 
      user ? hasFieldPermission(doctype, fieldname, 'read') : false,
    
    canWriteField: (doctype: string, fieldname: string) => 
      user ? hasFieldPermission(doctype, fieldname, 'write') : false,
  };
}