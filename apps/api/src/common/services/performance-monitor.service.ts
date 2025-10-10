import { Injectable } from '@nestjs/common';

export interface MetricTags {
  [key: string]: string;
}

@Injectable()
export class PerformanceMonitorService {
  createTimer(operation: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      console.log(`${operation} took ${duration.toFixed(2)}ms`);
    };
  }

  recordQueryPerformance(
    query: string,
    duration: number,
    params?: any[]
  ): void {
    if (duration > 1000) {
      // Log slow queries (>1s)
      console.warn(`Slow query detected: ${query}`, {
        duration: `${duration.toFixed(2)}ms`,
        params,
      });
    }
  }

  recordAPIPerformance(
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number,
    userAgent?: string,
    ip?: string
  ): void {
    console.log(`API Performance: ${method} ${endpoint}`, {
      duration: `${duration.toFixed(2)}ms`,
      statusCode,
      userAgent,
      ip,
    });
  }

  recordMetric(
    name: string,
    value: number,
    unit: string,
    tags?: MetricTags
  ): void {
    console.log(`Metric: ${name}`, {
      value,
      unit,
      tags,
    });
  }
}
