'use client';

import { useCallback } from 'react';
import { useAppStore, LoadingState } from '@/stores/app';

export function useLoading() {
  const { loading, setLoading, setGlobalLoading } = useAppStore();

  // Check if any loading state is active
  const isAnyLoading = useCallback(() => {
    return Object.values(loading).some(Boolean);
  }, [loading]);

  // Check specific loading state
  const isLoading = useCallback((key: keyof LoadingState | string) => {
    return loading[key] || false;
  }, [loading]);

  // Set loading state with automatic cleanup
  const withLoading = useCallback(async <T>(
    key: keyof LoadingState | string,
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    setLoading(key, true);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      setLoading(key, false);
    }
  }, [setLoading]);

  // Global loading helpers
  const withGlobalLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    setGlobalLoading(true);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      setGlobalLoading(false);
    }
  }, [setGlobalLoading]);

  return {
    // State
    loading,
    isGlobalLoading: loading.global,
    isSaving: loading.saving,
    isFetching: loading.fetching,
    isSubmitting: loading.submitting,
    
    // Utilities
    isAnyLoading,
    isLoading,
    
    // Actions
    setLoading,
    setGlobalLoading,
    withLoading,
    withGlobalLoading,
  };
}