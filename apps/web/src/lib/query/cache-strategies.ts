// Advanced caching strategies for optimal performance

import { QueryClient, QueryKey, InfiniteData } from '@tanstack/react-query';
import { queryKeys } from './config';

// Cache invalidation strategies
export enum CacheStrategy {
  IMMEDIATE = 'immediate',
  DEBOUNCED = 'debounced',
  BACKGROUND = 'background',
  OPTIMISTIC = 'optimistic',
}

// Cache priority levels
export enum CachePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Cache configuration for different data types
export const cacheConfig = {
  // Static/rarely changing data - aggressive caching
  meta: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    priority: CachePriority.HIGH,
  },
  
  // User preferences - medium caching
  preferences: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    priority: CachePriority.MEDIUM,
  },
  
  // Document lists - smart caching with background refresh
  lists: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    priority: CachePriority.MEDIUM,
    backgroundRefresh: true,
  },
  
  // Individual documents - optimistic caching
  documents: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    priority: CachePriority.HIGH,
    optimisticUpdates: true,
  },
  
  // Real-time data - minimal caching
  realtime: {
    staleTime: 0, // Always stale
    gcTime: 5 * 60 * 1000, // 5 minutes
    priority: CachePriority.LOW,
  },
  
  // Search results - short-term caching
  search: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    priority: CachePriority.LOW,
  },
};

// Intelligent cache invalidation
export class CacheManager {
  private queryClient: QueryClient;
  private invalidationQueue: Map<string, NodeJS.Timeout> = new Map();
  private dependencyGraph: Map<string, Set<string>> = new Map();

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.setupDependencyGraph();
  }

  // Setup cache dependency relationships
  private setupDependencyGraph() {
    // Document changes affect related lists
    this.addDependency('doc.detail', 'doc.list');
    this.addDependency('doc.detail', 'search.results');
    
    // List changes might affect dashboard widgets
    this.addDependency('doc.list', 'dashboard.charts');
    this.addDependency('doc.list', 'dashboard.numbers');
    
    // Meta changes affect forms and lists
    this.addDependency('doc.meta', 'doc.detail');
    this.addDependency('doc.meta', 'doc.list');
  }

  private addDependency(source: string, target: string) {
    if (!this.dependencyGraph.has(source)) {
      this.dependencyGraph.set(source, new Set());
    }
    this.dependencyGraph.get(source)!.add(target);
  }

  // Invalidate cache with strategy
  invalidate(
    queryKey: QueryKey,
    strategy: CacheStrategy = CacheStrategy.IMMEDIATE,
    delay: number = 1000
  ) {
    const keyString = JSON.stringify(queryKey);
    
    switch (strategy) {
      case CacheStrategy.IMMEDIATE:
        this.performInvalidation(queryKey);
        break;
        
      case CacheStrategy.DEBOUNCED:
        this.debouncedInvalidation(keyString, queryKey, delay);
        break;
        
      case CacheStrategy.BACKGROUND:
        this.backgroundInvalidation(queryKey);
        break;
        
      case CacheStrategy.OPTIMISTIC:
        this.optimisticInvalidation(queryKey);
        break;
    }
  }

  private performInvalidation(queryKey: QueryKey) {
    this.queryClient.invalidateQueries({ queryKey });
    
    // Invalidate dependent queries
    const keyString = this.getQueryKeyType(queryKey);
    const dependencies = this.dependencyGraph.get(keyString);
    
    if (dependencies) {
      dependencies.forEach(dep => {
        this.queryClient.invalidateQueries({
          predicate: (query) => this.getQueryKeyType(query.queryKey) === dep,
        });
      });
    }
  }

  private debouncedInvalidation(keyString: string, queryKey: QueryKey, delay: number) {
    // Clear existing timeout
    const existingTimeout = this.invalidationQueue.get(keyString);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      this.performInvalidation(queryKey);
      this.invalidationQueue.delete(keyString);
    }, delay);
    
    this.invalidationQueue.set(keyString, timeout);
  }

  private backgroundInvalidation(queryKey: QueryKey) {
    // Refetch in background without affecting UI
    this.queryClient.refetchQueries({
      queryKey,
      type: 'active',
    });
  }

  private optimisticInvalidation(queryKey: QueryKey) {
    // Mark as stale but don't refetch immediately
    this.queryClient.invalidateQueries({
      queryKey,
      refetchType: 'none',
    });
  }

  private getQueryKeyType(queryKey: QueryKey): string {
    if (Array.isArray(queryKey) && queryKey.length > 0) {
      return queryKey.slice(0, 2).join('.');
    }
    return 'unknown';
  }

  // Preload related data
  preloadRelatedData(doctype: string, name?: string) {
    // Preload meta if not cached
    this.queryClient.prefetchQuery({
      queryKey: queryKeys.doc.meta(doctype),
      queryFn: () => apiClient.getDocMeta(doctype),
      staleTime: cacheConfig.meta.staleTime,
    });

    // Preload list if document is being viewed
    if (name) {
      this.queryClient.prefetchQuery({
        queryKey: queryKeys.doc.list(doctype),
        queryFn: () => apiClient.getList(doctype),
        staleTime: cacheConfig.lists.staleTime,
      });
    }
  }

  // Cache warming for critical data
  warmCache(doctypes: string[]) {
    doctypes.forEach(doctype => {
      // Warm meta cache
      this.queryClient.prefetchQuery({
        queryKey: queryKeys.doc.meta(doctype),
        queryFn: () => apiClient.getDocMeta(doctype),
        staleTime: cacheConfig.meta.staleTime,
      });
      
      // Warm list cache with basic filters
      this.queryClient.prefetchQuery({
        queryKey: queryKeys.doc.list(doctype, { limit: 20 }),
        queryFn: () => apiClient.getList(doctype, { limit: 20 }),
        staleTime: cacheConfig.lists.staleTime,
      });
    });
  }

  // Memory management
  clearLowPriorityCache() {
    // Remove search results
    this.queryClient.removeQueries({
      predicate: (query) => this.getQueryKeyType(query.queryKey) === 'search.results',
    });
    
    // Remove old real-time data
    this.queryClient.removeQueries({
      predicate: (query) => {
        const type = this.getQueryKeyType(query.queryKey);
        return type.includes('realtime') && 
               (Date.now() - (query.state.dataUpdatedAt || 0)) > 5 * 60 * 1000;
      },
    });
  }

  // Get cache statistics
  getCacheStats() {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const stats = {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      memoryUsage: this.estimateMemoryUsage(queries),
    };
    
    return stats;
  }

  private estimateMemoryUsage(queries: any[]): number {
    // Rough estimation of memory usage
    let totalSize = 0;
    
    queries.forEach(query => {
      if (query.state.data) {
        try {
          const dataString = JSON.stringify(query.state.data);
          totalSize += dataString.length * 2; // Rough estimate (UTF-16)
        } catch (e) {
          // Circular reference or other serialization issue
          totalSize += 1000; // Rough estimate
        }
      }
    });
    
    return totalSize / 1024 / 1024; // Convert to MB
  }
}

// Offline cache persistence
export class OfflineCacheManager {
  private storageKey = 'erpnext-offline-cache';
  private maxStorageSize = 50 * 1024 * 1024; // 50MB

  // Persist critical data for offline use
  persistCriticalData(queryClient: QueryClient) {
    if (typeof window === 'undefined' || !window.localStorage) return;

    const cache = queryClient.getQueryCache();
    const criticalQueries = cache.getAll().filter(query => {
      const keyType = this.getQueryKeyType(query.queryKey);
      return ['doc.meta', 'auth.user', 'preferences'].includes(keyType);
    });

    const dataToStore = criticalQueries.map(query => ({
      queryKey: query.queryKey,
      data: query.state.data,
      dataUpdatedAt: query.state.dataUpdatedAt,
    }));

    try {
      const serialized = JSON.stringify(dataToStore);
      if (serialized.length < this.maxStorageSize) {
        localStorage.setItem(this.storageKey, serialized);
      }
    } catch (e) {
      console.warn('Failed to persist offline cache:', e);
    }
  }

  // Restore cached data on startup
  restoreOfflineData(queryClient: QueryClient) {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;

      const data = JSON.parse(stored);
      data.forEach(({ queryKey, data: queryData, dataUpdatedAt }: any) => {
        queryClient.setQueryData(queryKey, queryData);
      });
    } catch (e) {
      console.warn('Failed to restore offline cache:', e);
    }
  }

  private getQueryKeyType(queryKey: any[]): string {
    if (Array.isArray(queryKey) && queryKey.length > 0) {
      return queryKey.slice(0, 2).join('.');
    }
    return 'unknown';
  }
}

// Stale-while-revalidate implementation
export function createStaleWhileRevalidate(queryClient: QueryClient) {
  return {
    // Get data immediately from cache, then refetch in background
    getWithSWR: async (queryKey: QueryKey, queryFn: () => Promise<any>) => {
      // Get cached data immediately
      const cachedData = queryClient.getQueryData(queryKey);
      
      // Start background refetch
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 0, // Always refetch
      });
      
      return cachedData;
    },
    
    // Set up automatic background refresh
    setupBackgroundRefresh: (queryKey: QueryKey, interval: number) => {
      const intervalId = setInterval(() => {
        queryClient.refetchQueries({
          queryKey,
          type: 'active',
        });
      }, interval);
      
      return () => clearInterval(intervalId);
    },
  };
}

// Export singleton instance
let cacheManager: CacheManager | null = null;
let offlineCacheManager: OfflineCacheManager | null = null;

export function initializeCacheManager(queryClient: QueryClient) {
  if (!cacheManager) {
    cacheManager = new CacheManager(queryClient);
  }
  if (!offlineCacheManager) {
    offlineCacheManager = new OfflineCacheManager();
  }
  
  return { cacheManager, offlineCacheManager };
}

export { cacheManager, offlineCacheManager };