import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CacheService } from '../common/services/cache.service';
import { DatabaseOptimizerService } from '../common/services/database-optimizer.service';
import { PerformanceMonitorService } from '../common/services/performance-monitor.service';
import { QueueService } from '../common/services/queue.service';

@Controller('performance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'system_admin')
export class PerformanceController {
  constructor(
    private readonly cacheService: CacheService,
    private readonly performanceMonitor: PerformanceMonitorService,
    private readonly databaseOptimizer: DatabaseOptimizerService,
    private readonly queueService: QueueService
  ) {}

  @Get('stats')
  async getPerformanceStats() {
    const [cacheStats, performanceSummary, systemMetrics] = await Promise.all([
      this.cacheService.getStats(),
      this.performanceMonitor.getPerformanceSummary(),
      this.performanceMonitor.getSystemMetrics(),
    ]);

    return {
      cache: cacheStats,
      performance: performanceSummary,
      system: systemMetrics,
    };
  }

  @Get('database/stats')
  async getDatabaseStats() {
    return await this.databaseOptimizer.getDatabaseStats();
  }

  @Get('database/suggestions')
  async getIndexSuggestions() {
    return await this.databaseOptimizer.generateIndexSuggestions();
  }

  @Post('database/analyze-query')
  async analyzeQuery(@Body() body: { query: string; params?: any[] }) {
    return await this.databaseOptimizer.analyzeQuery(body.query, body.params);
  }

  @Get('database/partitioning')
  async getPartitioningSuggestions() {
    return await this.databaseOptimizer.analyzePartitioning();
  }

  @Get('database/config')
  async getDatabaseConfigSuggestions() {
    return await this.databaseOptimizer.optimizeConfiguration();
  }

  @Post('database/create-indexes')
  async createRecommendedIndexes(@Body() body: { suggestions: any[] }) {
    await this.databaseOptimizer.createRecommendedIndexes(body.suggestions);
    return { success: true, message: 'Indexes created successfully' };
  }

  @Get('queue/:queueName/stats')
  async getQueueStats(@Param('queueName') queueName: string) {
    return await this.queueService.getStats(queueName);
  }

  @Post('queue/:queueName/clean')
  async cleanQueue(@Param('queueName') queueName: string) {
    await this.queueService.clean(queueName);
    return { success: true, message: 'Queue cleaned successfully' };
  }

  @Post('cache/clear')
  async clearCache(@Body() body?: { tags?: string[] }) {
    if (body?.tags) {
      await this.cacheService.invalidateByTags(body.tags);
    } else {
      await this.cacheService.clear();
    }
    return { success: true, message: 'Cache cleared successfully' };
  }

  @Get('health')
  async getHealthCheck() {
    const [cacheHealth, queueHealth] = await Promise.all([
      this.checkCacheHealth(),
      this.checkQueueHealth(),
    ]);

    return {
      cache: cacheHealth,
      queue: queueHealth,
      timestamp: new Date().toISOString(),
    };
  }

  private async checkCacheHealth(): Promise<{
    status: string;
    latency?: number;
  }> {
    try {
      const start = performance.now();
      await this.cacheService.set('health_check', 'ok', { ttl: 10 });
      const result = await this.cacheService.get('health_check');
      const latency = performance.now() - start;

      if (result === 'ok') {
        return { status: 'healthy', latency };
      } else {
        return { status: 'unhealthy' };
      }
    } catch (error) {
      return { status: 'error' };
    }
  }

  private async checkQueueHealth(): Promise<{ status: string }> {
    try {
      // Add a simple health check job
      await this.queueService.add('health', 'check', { timestamp: Date.now() });
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'error' };
    }
  }
}
