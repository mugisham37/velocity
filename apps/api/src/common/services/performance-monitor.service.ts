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

  async getPerformanceSummary(): Promise<{
    averageResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    activeConnections: number;
    uptime: number;
  }> {
    // Mock performance data - in production, collect actual metrics
    return {
      averageResponseTime: 150, // ms
      requestsPerSecond: 45,
      errorRate: 0.02, // 2%
      activeConnections: 12,
      uptime: Date.now() - (24 * 60 * 60 * 1000) // 24 hours
    };
  }

  async getSystemMetrics(): Promise<{
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIO: { in: number; out: number };
    processCount: number;
  }> {
    // Mock system metrics - in production, use actual system monitoring
    return {
      cpuUsage: 35.5, // percentage
      memoryUsage: 68.2, // percentage
      diskUsage: 45.8, // percentage
      networkIO: {
        in: 1024 * 1024 * 50, // 50MB
        out: 1024 * 1024 * 30 // 30MB
      },
      processCount: 156
    };
  }
}
