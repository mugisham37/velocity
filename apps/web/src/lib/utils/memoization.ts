// Memoization utilities for performance optimization

import { useMemo, useCallback, useRef, useEffect } from 'react';

// Deep comparison for complex objects
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return a === b;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return a === b;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
}

// Memoization with deep comparison
export function useDeepMemo<T>(factory: () => T, deps: React.DependencyList): T {
  const ref = useRef<{ deps: React.DependencyList; value: T }>();
  
  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = {
      deps,
      value: factory(),
    };
  }
  
  return ref.current.value;
}

// Stable callback with deep comparison
export function useDeepCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useDeepMemo(() => callback, deps);
}

// Memoized calculation with performance tracking
export function useExpensiveCalculation<T>(
  calculation: () => T,
  deps: React.DependencyList,
  debugName?: string
): T {
  return useMemo(() => {
    const startTime = performance.now();
    const result = calculation();
    const endTime = performance.now();
    
    if (debugName && endTime - startTime > 10) {
      console.log(`Expensive calculation "${debugName}" took ${(endTime - startTime).toFixed(2)}ms`);
    }
    
    return result;
  }, deps);
}

// Debounced value hook
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// Throttled callback
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  
  return useCallback(
    ((...args: any[]) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

// Memoized component factory
export function createMemoizedComponent<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return React.memo(Component, propsAreEqual || ((prev, next) => deepEqual(prev, next)));
}

// Performance-optimized list renderer
export function useMemoizedList<T>(
  items: T[],
  renderItem: (item: T, index: number) => React.ReactNode,
  keyExtractor: (item: T, index: number) => string | number,
  deps: React.DependencyList = []
) {
  return useMemo(() => {
    return items.map((item, index) => {
      const key = keyExtractor(item, index);
      return (
        <MemoizedListItem key={key} item={item} index={index} renderItem={renderItem} />
      );
    });
  }, [items, ...deps]);
}

// Memoized list item component
const MemoizedListItem = React.memo(function MemoizedListItem<T>({
  item,
  index,
  renderItem,
}: {
  item: T;
  index: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  return <>{renderItem(item, index)}</>;
});

// Intersection observer hook for lazy rendering
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options,
      }
    );
    
    observer.observe(element);
    
    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);
  
  return isIntersecting;
}

// Lazy component renderer
export function LazyRenderer({
  children,
  fallback = null,
  rootMargin = '100px',
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref, { rootMargin });
  
  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  );
}

// Memoized form field component
export const MemoizedFormField = React.memo(function MemoizedFormField({
  field,
  value,
  onChange,
  error,
  ...props
}: {
  field: any;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  [key: string]: any;
}) {
  const handleChange = useCallback(
    (newValue: any) => {
      if (newValue !== value) {
        onChange(newValue);
      }
    },
    [value, onChange]
  );
  
  return (
    <div className="form-field">
      {/* Field implementation */}
    </div>
  );
});

// Virtualization utilities
export function useVirtualization({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    );
    
    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(itemCount - 1, endIndex + overscan),
    };
  }, [scrollTop, itemHeight, containerHeight, itemCount, overscan]);
  
  const totalHeight = itemCount * itemHeight;
  const offsetY = visibleRange.start * itemHeight;
  
  return {
    visibleRange,
    totalHeight,
    offsetY,
    setScrollTop,
  };
}

// Performance monitoring for components
export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    const currentTime = performance.now();
    
    if (lastRenderTime.current > 0) {
      const timeSinceLastRender = currentTime - lastRenderTime.current;
      
      if (timeSinceLastRender < 16.67) { // Less than 60fps
        console.warn(
          `Component ${componentName} rendered ${renderCount.current} times. ` +
          `Time since last render: ${timeSinceLastRender.toFixed(2)}ms`
        );
      }
    }
    
    lastRenderTime.current = currentTime;
  });
  
  return {
    renderCount: renderCount.current,
  };
}

// Batch state updates
export function useBatchedUpdates() {
  const [updates, setUpdates] = useState<(() => void)[]>([]);
  
  const batchUpdate = useCallback((updateFn: () => void) => {
    setUpdates(prev => [...prev, updateFn]);
  }, []);
  
  useEffect(() => {
    if (updates.length > 0) {
      const timeoutId = setTimeout(() => {
        updates.forEach(update => update());
        setUpdates([]);
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [updates]);
  
  return batchUpdate;
}

// Memoized selector hook
export function useMemoizedSelector<T, R>(
  state: T,
  selector: (state: T) => R,
  equalityFn: (a: R, b: R) => boolean = Object.is
): R {
  const selectedState = selector(state);
  const ref = useRef<R>(selectedState);
  
  if (!equalityFn(ref.current, selectedState)) {
    ref.current = selectedState;
  }
  
  return ref.current;
}

import React, { useState } from 'react';