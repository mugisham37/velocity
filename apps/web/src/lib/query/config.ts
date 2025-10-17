// React Query configuration and utilities

import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

// Performance-optimized query options
const defaultQueryOptions: DefaultOptions = {
  queries: {
    // Aggressive caching for better performance
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (increased for better caching)
    
    // Smart retry logic
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error instanceof Error && 'status' in error) {
        const status = (error as Error & { status?: number }).status;
        if (status === 401 || status === 403) {
          return false;
        }
      }
      
      // Don't retry on validation errors (400)
      if (error instanceof Error && 'status' in error) {
        const status = (error as Error & { status?: number }).status;
        if (status === 400) {
          return false;
        }
      }
      
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Performance optimizations
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
    
    // Background refetch for stale-while-revalidate pattern
    refetchInterval: false, // Disable automatic refetch by default
    refetchIntervalInBackground: false,
    
    // Network mode for offline support
    networkMode: 'online',
  },
  mutations: {
    retry: false,
    networkMode: 'online',
  },
};

// Create query client factory
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: defaultQueryOptions,
  });
}

// Query keys factory for consistent key management
export const queryKeys = {
  // Authentication
  auth: {
    user: () => ['auth', 'user'] as const,
    session: () => ['auth', 'session'] as const,
  },
  
  // Documents
  doc: {
    all: () => ['doc'] as const,
    lists: () => [...queryKeys.doc.all(), 'list'] as const,
    list: (doctype: string, filters?: unknown) => 
      [...queryKeys.doc.lists(), doctype, filters] as const,
    details: () => [...queryKeys.doc.all(), 'detail'] as const,
    detail: (doctype: string, name: string) => 
      [...queryKeys.doc.details(), doctype, name] as const,
    meta: (doctype: string) => 
      [...queryKeys.doc.all(), 'meta', doctype] as const,
  },
  
  // Reports
  report: {
    all: () => ['report'] as const,
    data: (reportName: string, filters?: unknown) => 
      [...queryKeys.report.all(), reportName, filters] as const,
  },
  
  // Dashboard
  dashboard: {
    all: () => ['dashboard'] as const,
    charts: () => [...queryKeys.dashboard.all(), 'charts'] as const,
    chart: (chartName: string) => 
      [...queryKeys.dashboard.charts(), chartName] as const,
    numbers: () => [...queryKeys.dashboard.all(), 'numbers'] as const,
    number: (cardName: string) => 
      [...queryKeys.dashboard.numbers(), cardName] as const,
  },
  
  // Search
  search: {
    all: () => ['search'] as const,
    results: (doctype: string, query: string, filters?: unknown) => 
      [...queryKeys.search.all(), doctype, query, filters] as const,
  },
  
  // Files
  file: {
    all: () => ['file'] as const,
    list: (folder?: string) => [...queryKeys.file.all(), 'list', folder] as const,
    detail: (fileName: string) => [...queryKeys.file.all(), 'detail', fileName] as const,
  },
};

// Common query functions
export const queryFunctions = {
  // Document queries
  getDoc: (doctype: string, name: string) => ({
    queryKey: queryKeys.doc.detail(doctype, name),
    queryFn: () => apiClient.getDoc(doctype, name),
  }),
  
  getDocList: (doctype: string, options?: Parameters<typeof apiClient.getList>[1]) => ({
    queryKey: queryKeys.doc.list(doctype, options),
    queryFn: () => apiClient.getList(doctype, options),
  }),
  
  getDocMeta: (doctype: string) => ({
    queryKey: queryKeys.doc.meta(doctype),
    queryFn: () => apiClient.getDocMeta(doctype),
    staleTime: 30 * 60 * 1000, // 30 minutes - meta doesn't change often
  }),
  
  // Search queries
  searchDocs: (doctype: string, query: string, filters?: Record<string, unknown>) => ({
    queryKey: queryKeys.search.results(doctype, query, filters),
    queryFn: () => apiClient.search(doctype, query, filters),
    enabled: query.length > 0,
  }),
  
  // User query
  getCurrentUser: () => ({
    queryKey: queryKeys.auth.user(),
    queryFn: () => apiClient.getCurrentUser(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  }),
};

// Mutation functions
export const mutationFunctions = {
  saveDoc: () => ({
    mutationFn: ({ doctype, doc }: { doctype: string; doc: Record<string, unknown> }) =>
      apiClient.saveDoc(doctype, doc),
  }),
  
  deleteDoc: () => ({
    mutationFn: ({ doctype, name }: { doctype: string; name: string }) =>
      apiClient.deleteDoc(doctype, name),
  }),
  
  submitDoc: () => ({
    mutationFn: ({ doctype, name }: { doctype: string; name: string }) =>
      apiClient.submitDoc(doctype, name),
  }),
  
  cancelDoc: () => ({
    mutationFn: ({ doctype, name }: { doctype: string; name: string }) =>
      apiClient.cancelDoc(doctype, name),
  }),
  
  uploadFile: () => ({
    mutationFn: ({ file, isPrivate, folder }: { file: File; isPrivate?: boolean; folder?: string }) =>
      apiClient.uploadFile(file, isPrivate, folder),
  }),
};

// Utility functions for cache management
export const cacheUtils = {
  // Invalidate all queries for a doctype
  invalidateDoctype: (queryClient: QueryClient, doctype: string) => {
    queryClient.invalidateQueries({
      queryKey: ['doc', 'list', doctype],
    });
    queryClient.invalidateQueries({
      queryKey: ['doc', 'detail', doctype],
    });
  },
  
  // Update document in cache
  updateDocInCache: (
    queryClient: QueryClient,
    doctype: string,
    name: string,
    updater: (oldData: unknown) => unknown
  ) => {
    queryClient.setQueryData(
      queryKeys.doc.detail(doctype, name),
      updater
    );
  },
  
  // Remove document from cache
  removeDocFromCache: (queryClient: QueryClient, doctype: string, name: string) => {
    queryClient.removeQueries({
      queryKey: queryKeys.doc.detail(doctype, name),
    });
    
    // Also update list caches
    queryClient.invalidateQueries({
      queryKey: queryKeys.doc.list(doctype),
    });
  },
  
  // Prefetch document
  prefetchDoc: (queryClient: QueryClient, doctype: string, name: string) => {
    queryClient.prefetchQuery(queryFunctions.getDoc(doctype, name));
  },
};