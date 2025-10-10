import { Injectable } from '@nestjs/common';

@Injectable()
export class PerformanceMonitorService {
  createTimer(operation: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      console.log(`${operation} took ${duration.toFixed(2)}ms`);
    };
  }

  recordQueryPerformance(query: string, duration: number, params?: any[]): void {
    if (duration > 1000) { // Log slow queries (>1s)
      console.warn(`Slow query detected: ${query}`, {
        duration: `${duration.toFixed(2)}ms`,
        params
      });
    }
  }
}