// Performance monitoring provider for the application

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  initializePerformanceMonitoring,
  createPerformanceTracker,
  type PerformanceMetrics 
} from '@/lib/utils/performance';
import { 
  initializeCacheManager,
  type CacheManager,
  type OfflineCacheManager 
} from '@/lib/query/cache-strategies';
import { useQueryClient } from '@tanstack/react-query';

interface PerformanceContextType {
  trackMetric: (metric: PerformanceMetrics) => void;
  getCacheStats: () => any;
  clearLowPriorityCache: () => void;
  warmCache: (doctypes: string[]) => void;
  isMonitoringEnabled: boolean;
  toggleMonitoring: () => void;
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}

interface PerformanceProviderProps {
  children: React.ReactNode;
  enableInProduction?: boolean;
}

export function PerformanceProvider({ 
  children, 
  enableInProduction = false 
}: PerformanceProviderProps) {
  const queryClient = useQueryClient();
  const [isMonitoringEnabled, setIsMonitoringEnabled] = useState(
    process.env.NODE_ENV === 'development' || enableInProduction
  );
  const [cacheManager, setCacheManager] = useState<CacheManager | null>(null);
  const [offlineCacheManager, setOfflineCacheManager] = useState<OfflineCacheManager | null>(null);
  const [performanceTracker] = useState(() => createPerformanceTracker(2000));

  useEffect(() => {
    if (isMonitoringEnabled) {
      // Initialize performance monitoring
      const monitor = initializePerformanceMonitoring();
      
      // Initialize cache managers
      const { cacheManager: cm, offlineCacheManager: ocm } = initializeCacheManager(queryClient);
      setCacheManager(cm);
      setOfflineCacheManager(ocm);
      
      // Restore offline cache on startup
      if (ocm) {
        ocm.restoreOfflineData(queryClient);
      }
      
      // Set up periodic cache cleanup
      const cleanupInterval = setInterval(() => {
        if (cm) {
          cm.clearLowPriorityCache();
        }
      }, 5 * 60 * 1000); // Every 5 minutes
      
      // Set up offline cache persistence
      const persistInterval = setInterval(() => {
        if (ocm) {
          ocm.persistCriticalData(queryClient);
        }
      }, 30 * 1000); // Every 30 seconds
      
      // Performance budget monitoring
      const budgetInterval = setInterval(() => {
        if (typeof window !== 'undefined' && 'performance' in window) {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigation) {
            const loadTime = navigation.loadEventEnd - navigation.fetchStart;
            const renderTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
            
            const metrics: PerformanceMetrics = {
              loadTime,
              renderTime,
              interactionTime: 0,
              memoryUsage: getMemoryUsage(),
              bundleSize: getBundleSize(),
            };
            
            performanceTracker.track(metrics);
          }
        }
      }, 10000); // Every 10 seconds
      
      return () => {
        clearInterval(cleanupInterval);
        clearInterval(persistInterval);
        clearInterval(budgetInterval);
        
        if (monitor) {
          monitor.disconnect();
        }
      };
    }
  }, [isMonitoringEnabled, queryClient, performanceTracker]);

  // Helper functions
  const getMemoryUsage = (): number | undefined => {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }
    return undefined;
  };

  const getBundleSize = (): number | undefined => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(resource => 
        resource.name.includes('.js') && !resource.name.includes('node_modules')
      );
      
      const totalSize = jsResources.reduce((total, resource) => {
        return total + (resource.transferSize || 0);
      }, 0);
      
      return totalSize / 1024; // Convert to KB
    }
    return undefined;
  };

  const contextValue: PerformanceContextType = {
    trackMetric: (metric: PerformanceMetrics) => {
      if (isMonitoringEnabled) {
        performanceTracker.track(metric);
      }
    },
    
    getCacheStats: () => {
      return cacheManager?.getCacheStats() || null;
    },
    
    clearLowPriorityCache: () => {
      if (cacheManager) {
        cacheManager.clearLowPriorityCache();
      }
    },
    
    warmCache: (doctypes: string[]) => {
      if (cacheManager) {
        cacheManager.warmCache(doctypes);
      }
    },
    
    isMonitoringEnabled,
    
    toggleMonitoring: () => {
      setIsMonitoringEnabled(prev => !prev);
    },
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
      {isMonitoringEnabled && <PerformanceIndicator />}
    </PerformanceContext.Provider>
  );
}

// Performance indicator component
function PerformanceIndicator() {
  const [metrics, setMetrics] = useState<{ fps: number; memory: number } | null>(null);
  const frameCount = React.useRef(0);
  const lastTime = React.useRef(performance.now());

  useEffect(() => {
    let animationId: number;
    
    const updateMetrics = () => {
      const now = performance.now();
      frameCount.current++;
      
      // Calculate FPS every second
      if (now - lastTime.current >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / (now - lastTime.current));
        const memory = getMemoryUsage() || 0;
        
        setMetrics({ fps, memory });
        
        frameCount.current = 0;
        lastTime.current = now;
      }
      
      animationId = requestAnimationFrame(updateMetrics);
    };
    
    animationId = requestAnimationFrame(updateMetrics);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  const getMemoryUsage = (): number | undefined => {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }
    return undefined;
  };

  if (!metrics) return null;

  const fpsColor = metrics.fps >= 55 ? 'text-green-500' : metrics.fps >= 30 ? 'text-yellow-500' : 'text-red-500';
  const memoryColor = metrics.memory <= 30 ? 'text-green-500' : metrics.memory <= 50 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded font-mono z-50">
      <div className={`${fpsColor}`}>FPS: {metrics.fps}</div>
      <div className={`${memoryColor}`}>MEM: {metrics.memory.toFixed(1)}MB</div>
    </div>
  );
}

// Performance hooks for components
export function useComponentPerformance(componentName: string) {
  const { trackMetric } = usePerformance();
  const renderStart = React.useRef<number>(0);
  const renderCount = React.useRef(0);

  React.useEffect(() => {
    renderStart.current = performance.now();
    renderCount.current++;
    
    return () => {
      const renderTime = performance.now() - renderStart.current;
      
      trackMetric({
        loadTime: renderStart.current,
        renderTime,
        interactionTime: 0,
        componentName,
        renderCount: renderCount.current,
      } as PerformanceMetrics & { componentName: string; renderCount: number });
    };
  });

  return {
    renderCount: renderCount.current,
  };
}

// Performance-aware data fetching hook
export function usePerformantQuery(queryKey: any[], queryFn: () => Promise<any>, options?: any) {
  const { trackMetric } = usePerformance();
  const startTime = React.useRef<number>(0);

  const enhancedOptions = {
    ...options,
    onSuccess: (data: any) => {
      const fetchTime = performance.now() - startTime.current;
      
      trackMetric({
        loadTime: startTime.current,
        renderTime: 0,
        interactionTime: fetchTime,
        queryKey: JSON.stringify(queryKey),
        dataSize: JSON.stringify(data).length,
      } as PerformanceMetrics & { queryKey: string; dataSize: number });
      
      options?.onSuccess?.(data);
    },
    onError: (error: any) => {
      const fetchTime = performance.now() - startTime.current;
      
      console.warn(`Query ${JSON.stringify(queryKey)} failed after ${fetchTime.toFixed(2)}ms:`, error);
      
      options?.onError?.(error);
    },
  };

  React.useEffect(() => {
    startTime.current = performance.now();
  }, [queryKey]);

  return enhancedOptions;
}