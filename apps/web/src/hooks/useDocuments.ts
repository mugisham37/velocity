'use client';

import React, { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryFunctions, mutationFunctions, queryKeys, cacheUtils } from '@/lib/query/config';
import { useNotifications } from './useNotifications';

export function useDocument(doctype: string, name: string, enabled = true) {
  const { showApiError, showApiSuccess } = useNotifications();
  const queryClient = useQueryClient();

  const query = useQuery({
    ...queryFunctions.getDoc(doctype, name),
    enabled: enabled && !!name,
  });

  const saveMutation = useMutation({
    ...mutationFunctions.saveDoc(),
    onSuccess: (data) => {
      // Update cache with new data
      queryClient.setQueryData(queryKeys.doc.detail(doctype, name), data);
      
      // Invalidate list queries
      cacheUtils.invalidateDoctype(queryClient, doctype);
      
      showApiSuccess('Document saved successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to save document');
    },
  });

  const deleteMutation = useMutation({
    ...mutationFunctions.deleteDoc(),
    onSuccess: () => {
      // Remove from cache
      cacheUtils.removeDocFromCache(queryClient, doctype, name);
      
      showApiSuccess('Document deleted successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to delete document');
    },
  });

  const submitMutation = useMutation({
    ...mutationFunctions.submitDoc(),
    onSuccess: () => {
      // Refetch document to get updated status
      query.refetch();
      
      showApiSuccess('Document submitted successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to submit document');
    },
  });

  const cancelMutation = useMutation({
    ...mutationFunctions.cancelDoc(),
    onSuccess: () => {
      // Refetch document to get updated status
      query.refetch();
      
      showApiSuccess('Document cancelled successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to cancel document');
    },
  });

  const save = useCallback((doc: Record<string, unknown>) => {
    return saveMutation.mutateAsync({ doctype, doc });
  }, [saveMutation, doctype]);

  const deleteDoc = useCallback(() => {
    return deleteMutation.mutateAsync({ doctype, name });
  }, [deleteMutation, doctype, name]);

  const submit = useCallback(() => {
    return submitMutation.mutateAsync({ doctype, name });
  }, [submitMutation, doctype, name]);

  const cancel = useCallback(() => {
    return cancelMutation.mutateAsync({ doctype, name });
  }, [cancelMutation, doctype, name]);

  return {
    // Query state
    doc: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    
    // Mutation state
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSubmitting: submitMutation.isPending,
    isCancelling: cancelMutation.isPending,
    
    // Actions
    save,
    deleteDoc,
    submit,
    cancel,
  };
}

export function useDocumentList(doctype: string, options?: Parameters<typeof queryFunctions.getDocList>[1]) {
  const { showApiError } = useNotifications();

  const query = useQuery({
    ...queryFunctions.getDocList(doctype, options),
  });

  // Handle errors in useEffect
  React.useEffect(() => {
    if (query.error) {
      showApiError(query.error, `Failed to load ${doctype} list`);
    }
  }, [query.error, showApiError, doctype]);

  return {
    data: query.data?.data || [],
    totalCount: query.data?.total_count,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useDocumentMeta(doctype: string) {
  const { showApiError } = useNotifications();

  const query = useQuery({
    ...queryFunctions.getDocMeta(doctype),
  });

  // Handle errors in useEffect
  React.useEffect(() => {
    if (query.error) {
      showApiError(query.error, `Failed to load ${doctype} metadata`);
    }
  }, [query.error, showApiError, doctype]);

  return {
    meta: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

export function useDocumentSearch(doctype: string, searchQuery: string, filters?: Record<string, unknown>) {
  const { showApiError } = useNotifications();

  const query = useQuery({
    ...queryFunctions.searchDocs(doctype, searchQuery, filters),
  });

  // Handle errors in useEffect
  React.useEffect(() => {
    if (query.error) {
      showApiError(query.error, `Failed to search ${doctype}`);
    }
  }, [query.error, showApiError, doctype]);

  return {
    results: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

// Legacy alias for backward compatibility
export function useDocuments() {
  const getList = useCallback(async (doctype: string, options?: unknown) => {
    // This is a simplified implementation for the report builder
    // In a real implementation, this would use the API client
    const response = await fetch(`/api/method/frappe.desk.reportview.get?doctype=${doctype}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options || {}),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    
    return response.json();
  }, []);

  return {
    getList,
  };
}