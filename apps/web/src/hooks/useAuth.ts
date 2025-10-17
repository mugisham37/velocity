'use client';

import { useEffect, useCallback} from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

export function useAuth() {
  const router = useRouter();
  const authStore = useAuthStore();

  // Memoize auth store methods to prevent unnecessary re-renders
  const checkSession = useCallback(() => authStore.checkSession(), [authStore]);
  const refreshSession = useCallback(() => authStore.refreshSession(), [authStore]);
  const isSessionExpired = useCallback(() => authStore.isSessionExpired(), [authStore]);

  // Auto-refresh session periodically
  useEffect(() => {
    if (!authStore.isAuthenticated) return;

    const interval = setInterval(async () => {
      const isValid = await checkSession();
      if (!isValid) {
        router.push('/login');
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [authStore.isAuthenticated, checkSession, router]);

  // Check for session expiry on page focus
  useEffect(() => {
    const handleFocus = async () => {
      if (authStore.isAuthenticated && isSessionExpired()) {
        const refreshed = await refreshSession();
        if (!refreshed) {
          router.push('/login');
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [authStore.isAuthenticated, isSessionExpired, refreshSession, router]);

  const requireAuth = useCallback(() => {
    if (!authStore.isAuthenticated) {
      router.push('/login');
      return false;
    }
    return true;
  }, [authStore.isAuthenticated, router]);

  const requireRole = useCallback((roles: string | string[]) => {
    if (!requireAuth()) return false;

    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    const hasRole = requiredRoles.some(role => 
      authStore.user?.roles.includes(role)
    );

    if (!hasRole) {
      console.warn(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
      return false;
    }

    return true;
  }, [requireAuth, authStore.user?.roles]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!authStore.user) return false;
    
    // Check if user has the specific permission
    // This would typically check against a permissions system
    // For now, we'll check if user has 'System Manager' role for admin permissions
    if (permission === 'system_manager') {
      return authStore.user.roles.includes('System Manager');
    }

    // Add more permission checks as needed
    return true;
  }, [authStore.user]);

  return {
    // State
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    error: authStore.error,

    // Actions
    login: authStore.login,
    logout: authStore.logout,
    updateUser: authStore.updateUser,
    clearError: authStore.clearError,

    // Utilities
    requireAuth,
    requireRole,
    hasPermission,
    checkSession,
    refreshSession,
  };
}