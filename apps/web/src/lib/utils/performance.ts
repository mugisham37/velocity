// Performance monitoring and optimization utilities

import { useEffect, useRef, useState } from 'react';

// Performance metrics interface
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage?: number;
  bundleSize?: number;
}

// Core Web Vitals tracking
export interface WebVitals {
  CLS: number; // Cumulative Layout Shift
  FID: number; // First Input Delay
  FCP: number; // First Contentful Paint
  LCP: number; // Largest Contentful Paint
  TTFB: number; // Time to First Byte
}

// Performance observer for Core Web Vitals
export class PerformanceMonitor {
  private metrics: Partial<WebVitals> = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
        this.metrics.LCP = lastEntry.renderTime || lastEntry.loadTime || 0;
        this.reportMetric('LCP', this.metrics.LCP);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (e) {
      console.warn('LCP observer not supported');
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEntry & { processingStart?: number };
          this.metrics.FID = fidEntry.processingStart ? fidEntry.processingStart - entry.startTime : 0;
          this.reportMetric('FID', this.metrics.FID);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (e) {
      console.warn('FID observer not supported');
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const clsEntry = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
          if (!clsEntry.hadRecentInput) {
            clsValue += clsEntry.value || 0;
          }
        });
        this.metrics.CLS = clsValue;
        this.reportMetric('CLS', this.metrics.CLS);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (e) {
      console.warn('CLS observer not supported');
    }

    // Navigation timing for TTFB and FCP
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0];
        this.metrics.TTFB = nav.responseStart - nav.requestStart;
        this.reportMetric('TTFB', this.metrics.TTFB);
      }

      // First Contentful Paint
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.metrics.FCP = fcpEntry.startTime;
        this.reportMetric('FCP', this.metrics.FCP);
      }
    }
  }

  private reportMetric(name: string, value: number) {
    console.log(`Performance metric ${name}: ${value.toFixed(2)}ms`);
    
    // Send to analytics if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'web_vitals', {
        metric_name: name,
        metric_value: Math.round(value),
      });
    }
  }

  getMetrics(): Partial<WebVitals> {
    return { ...this.metrics };
  }

  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// React hook for component performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    renderStartTime.current = performance.now();
    
    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      const newMetrics: PerformanceMetrics = {
        loadTime: renderStartTime.current,
        renderTime,
        interactionTime: 0,
      };
      
      setMetrics(newMetrics);
      
      // Log performance data
      console.log(`Component ${componentName} render time: ${renderTime.toFixed(2)}ms`);
    };
  }, [componentName]);

  return metrics;
}

// Memory usage monitoring
export function getMemoryUsage(): number | null {
  if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
    const memory = (performance as any).memory;
    return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
  }
  return null;
}

// Bundle size analysis
export function analyzeBundleSize() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const jsResources = resources.filter(resource => 
      resource.name.includes('.js') && !resource.name.includes('node_modules')
    );
    
    const totalSize = jsResources.reduce((total, resource) => {
      return total + (resource.transferSize || 0);
    }, 0);
    
    return {
      totalSize: totalSize / 1024, // KB
      resourceCount: jsResources.length,
      resources: jsResources.map(resource => ({
        name: resource.name,
        size: (resource.transferSize || 0) / 1024,
        loadTime: resource.responseEnd - resource.requestStart,
      })),
    };
  }
  return null;
}

// Performance budget checker
export interface PerformanceBudget {
  maxBundleSize: number; // KB
  maxLoadTime: number; // ms
  maxRenderTime: number; // ms
  maxMemoryUsage: number; // MB
}

export const defaultPerformanceBudget: PerformanceBudget = {
  maxBundleSize: 500, // 500KB
  maxLoadTime: 3000, // 3 seconds
  maxRenderTime: 100, // 100ms
  maxMemoryUsage: 50, // 50MB
};

export function checkPerformanceBudget(
  metrics: PerformanceMetrics,
  budget: PerformanceBudget = defaultPerformanceBudget
): { passed: boolean; violations: string[] } {
  const violations: string[] = [];
  
  if (metrics.loadTime > budget.maxLoadTime) {
    violations.push(`Load time ${metrics.loadTime.toFixed(2)}ms exceeds budget ${budget.maxLoadTime}ms`);
  }
  
  if (metrics.renderTime > budget.maxRenderTime) {
    violations.push(`Render time ${metrics.renderTime.toFixed(2)}ms exceeds budget ${budget.maxRenderTime}ms`);
  }
  
  if (metrics.memoryUsage && metrics.memoryUsage > budget.maxMemoryUsage) {
    violations.push(`Memory usage ${metrics.memoryUsage.toFixed(2)}MB exceeds budget ${budget.maxMemoryUsage}MB`);
  }
  
  if (metrics.bundleSize && metrics.bundleSize > budget.maxBundleSize) {
    violations.push(`Bundle size ${metrics.bundleSize.toFixed(2)}KB exceeds budget ${budget.maxBundleSize}KB`);
  }
  
  return {
    passed: violations.length === 0,
    violations,
  };
}

// Performance optimization recommendations
export function getOptimizationRecommendations(metrics: PerformanceMetrics): string[] {
  const recommendations: string[] = [];
  
  if (metrics.loadTime > 2000) {
    recommendations.push('Consider implementing code splitting to reduce initial bundle size');
    recommendations.push('Enable compression and caching for static assets');
  }
  
  if (metrics.renderTime > 50) {
    recommendations.push('Use React.memo() for expensive components');
    recommendations.push('Implement virtual scrolling for large lists');
    recommendations.push('Consider using useMemo() and useCallback() for expensive calculations');
  }
  
  if (metrics.memoryUsage && metrics.memoryUsage > 30) {
    recommendations.push('Check for memory leaks in event listeners and subscriptions');
    recommendations.push('Implement proper cleanup in useEffect hooks');
    recommendations.push('Consider using React.lazy() for heavy components');
  }
  
  return recommendations;
}

// Debounced performance tracking
export function createPerformanceTracker(delay: number = 1000) {
  let timeoutId: NodeJS.Timeout;
  const metrics: PerformanceMetrics[] = [];
  
  return {
    track: (metric: PerformanceMetrics) => {
      metrics.push(metric);
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const avgMetrics = {
          loadTime: metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length,
          renderTime: metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length,
          interactionTime: metrics.reduce((sum, m) => sum + m.interactionTime, 0) / metrics.length,
        };
        
        console.log('Average performance metrics:', avgMetrics);
        metrics.length = 0; // Clear metrics
      }, delay);
    },
  };
}

// Initialize global performance monitor
let globalPerformanceMonitor: PerformanceMonitor | null = null;

export function initializePerformanceMonitoring() {
  if (typeof window !== 'undefined' && !globalPerformanceMonitor) {
    globalPerformanceMonitor = new PerformanceMonitor();
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      if (globalPerformanceMonitor) {
        globalPerformanceMonitor.disconnect();
      }
    });
  }
  
  return globalPerformanceMonitor;
}

export { globalPerformanceMonitor };