import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import * as os from 'os';
import { performance } from 'perf_hooks';
import { Logger } from 'winston';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface QueryPerformanceData {
  query: string;
  duration: number;
  timestamp: Date;
  params?: any[];
  error?: string;
}

export interface APIPerformanceData {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    free: number;
    total: number;
    usage: number;
  };
  disk: {
    usage: number;
  };
  network: {
    connections: number;
  };
}

@Injectable()
export class PerformanceMonitorService implements OnModuleInit {
  private metrics: PerformanceMetric[] = [];
  private queryMetrics: QueryPerformanceData[] = [];
  private apiMetrics: APIPerformanceData[] = [];
  private readonly maxMetricsHistory = 10000;
  readonly metricsRetentionMs = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  onModuleInit() {
    // Start system metrics collection
    this.startSystemMetricsCollection();

    // Clean up old metrics periodically
    setInterval(() => this.cleanupOldMetrics(), 60000); // Every minute
  }

  /**
   * Record a custom performance metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string,
    tags?: Record<string, string>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags,
    };

    this.metrics.push(metric);
    this.trimMetricsArray();

    // Log significant metrics
    if (this.isSignificantMetric(name, value)) {
      this.logger.warn('Performance alert', { metric });
    }
  }

  /**
   * Record database query performance
   */
  recordQueryPerformance(
    query: string,
    duration: number,
    params?: any[],
    error?: string
  ): void {
    const queryMetric: QueryPerformanceData = {
      query: this.sanitizeQuery(query),
      duration,
      timestamp: new Date(),
      params: params ? this.sanitizeParams(params) : undefined,
      error,
    };

    this.queryMetrics.push(queryMetric);
    this.trimQueryMetricsArray();

    // Log slow queries
    if (duration > 1000) {
      // Queries taking more than 1 second
      this.logger.warn('Slow query detected', {
        query: queryMetric.query,
        duration,
        error,
      });
    }
  }

  /**
   * Record API endpoint performance
   */
  recordAPIPerformance(
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number,
    userAgent?: string,
    ip?: string
  ): void {
    const apiMetric: APIPerformanceData = {
      endpoint,
      method,
      duration,
      statusCode,
      timestamp: new Date(),
      userAgent,
      ip,
    };

    this.apiMetrics.push(apiMetric);
    this.trimAPIMetricsArray();

    // Log slow API calls
    if (duration > 5000) {
      // API calls taking more than 5 seconds
      this.logger.warn('Slow API call detected', {
        endpoint,
        method,
        duration,
        statusCode,
      });
    }
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Calculate CPU usage (simplified)
    const cpuUsage = await this.getCPUUsage();

    return {
      cpu: {
        usage: cpuUsage,
        loadAverage: os.loadavg(),
      },
      memory: {
        used: usedMem,
        free: freeMem,
        total: totalMem,
        usage: (usedMem / totalMem) * 100,
      },
      disk: {
        usage: 0, // Would need additional library for disk usage
      },
      network: {
        connections: 0, // Would need additional monitoring
      },
    };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(timeRangeMs: number = 3600000): {
    api: {
      totalRequests: number;
      averageResponseTime: number;
      errorRate: number;
      slowestEndpoints: Array<{ endpoint: string; averageTime: number }>;
    };
    database: {
      totalQueries: number;
      averageQueryTime: number;
      slowestQueries: Array<{ query: string; averageTime: number }>;
    };
    system: SystemMetrics;
  } {
    const cutoffTime = new Date(Date.now() - timeRangeMs);

    // API metrics
    const recentAPIMetrics = this.apiMetrics.filter(
      m => m.timestamp > cutoffTime
    );
    const totalRequests = recentAPIMetrics.length;
    const averageResponseTime =
      totalRequests > 0
        ? recentAPIMetrics.reduce((sum, m) => sum + m.duration, 0) /
          totalRequests
        : 0;
    const errorRate =
      totalRequests > 0
        ? (recentAPIMetrics.filter(m => m.statusCode >= 400).length /
            totalRequests) *
          100
        : 0;

    // Group by endpoint for slowest endpoints
    const endpointGroups = recentAPIMetrics.reduce(
      (groups, metric) => {
        const key = `${metric.method} ${metric.endpoint}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(metric.duration);
        return groups;
      },
      {} as Record<string, number[]>
    );

    const slowestEndpoints = Object.entries(endpointGroups)
      .map(([endpoint, durations]) => ({
        endpoint,
        averageTime:
          durations.reduce((sum, d) => sum + d, 0) / durations.length,
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    // Database metrics
    const recentQueryMetrics = this.queryMetrics.filter(
      m => m.timestamp > cutoffTime
    );
    const totalQueries = recentQueryMetrics.length;
    const averageQueryTime =
      totalQueries > 0
        ? recentQueryMetrics.reduce((sum, m) => sum + m.duration, 0) /
          totalQueries
        : 0;

    // Group by query for slowest queries
    const queryGroups = recentQueryMetrics.reduce(
      (groups, metric) => {
        const key = metric.query;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(metric.duration);
        return groups;
      },
      {} as Record<string, number[]>
    );

    const slowestQueries = Object.entries(queryGroups)
      .map(([query, durations]) => ({
        query,
        averageTime:
          durations.reduce((sum, d) => sum + d, 0) / durations.length,
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    return {
      api: {
        totalRequests,
        averageResponseTime,
        errorRate,
        slowestEndpoints,
      },
      database: {
        totalQueries,
        averageQueryTime,
        slowestQueries,
      },
      system: {} as SystemMetrics, // Will be populated by getSystemMetrics
    };
  }

  /**
   * Create a performance timer
   */
  createTimer(name: string, tags?: Record<string, string>): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, 'ms', tags);
    };
  }

  /**
   * Decorator for measuring method performance
   */
  measurePerformance(
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const timer = this.performanceMonitor?.createTimer(
        `${target.constructor.name}.${propertyName}`
      );
      try {
        const result = await method.apply(this, args);
        timer?.();
        return result;
      } catch (error) {
        timer?.();
        throw error;
      }
    };

    return descriptor;
  }

  private startSystemMetricsCollection(): void {
    setInterval(async () => {
      try {
        const metrics = await this.getSystemMetrics();

        this.recordMetric('system.cpu.usage', metrics.cpu.usage, '%');
        this.recordMetric('system.memory.usage', metrics.memory.usage, '%');
        this.recordMetric('system.memory.used', metrics.memory.used, 'bytes');
        this.recordMetric('system.memory.free', metrics.memory.free, 'bytes');

        // Alert on high resource usage
        if (metrics.cpu.usage > 80) {
          this.logger.warn('High CPU usage detected', {
            usage: metrics.cpu.usage,
          });
        }
        if (metrics.memory.usage > 85) {
          this.logger.warn('High memory usage detected', {
            usage: metrics.memory.usage,
          });
        }
      } catch (error) {
        this.logger.error('Failed to collect system metrics', error);
      }
    }, 30000); // Every 30 seconds
  }

  private async getCPUUsage(): Promise<number> {
    return new Promise(resolve => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime();

      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = process.hrtime(startTime);

        const totalTime = endTime[0] * 1000000 + endTime[1] / 1000; // microseconds
        const totalUsage = endUsage.user + endUsage.system;
        const cpuPercent = (totalUsage / totalTime) * 100;

        resolve(Math.min(100, Math.max(0, cpuPercent)));
      }, 100);
    });
  }

  private isSignificantMetric(name: string, value: number): boolean {
    // Define thresholds for different metrics
    const thresholds: Record<string, number> = {
      'api.response_time': 5000, // 5 seconds
      'db.query_time': 1000, // 1 second
      'system.cpu.usage': 80, // 80%
      'system.memory.usage': 85, // 85%
    };

    return value > (thresholds[name] || Infinity);
  }

  private sanitizeQuery(query: string): string {
    // Remove sensitive data and normalize query
    return query
      .replace(/\$\d+/g, '?') // Replace parameter placeholders
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 200); // Limit length
  }

  private sanitizeParams(params: any[]): any[] {
    // Remove sensitive parameter values
    return params.map(param => {
      if (typeof param === 'string' && param.length > 100) {
        return `${param.substring(0, 100)}...`;
      }
      return param;
    });
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = new Date(Date.now() - this.metricsRetentionMs);

    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
    this.queryMetrics = this.queryMetrics.filter(m => m.timestamp > cutoffTime);
    this.apiMetrics = this.apiMetrics.filter(m => m.timestamp > cutoffTime);
  }

  private trimMetricsArray(): void {
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  private trimQueryMetricsArray(): void {
    if (this.queryMetrics.length > this.maxMetricsHistory) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxMetricsHistory);
    }
  }

  private trimAPIMetricsArray(): void {
    if (this.apiMetrics.length > this.maxMetricsHistory) {
      this.apiMetrics = this.apiMetrics.slice(-this.maxMetricsHistory);
    }
  }
}
