import { Global, Module } from '@nestjs/common';
import { CacheInterceptor } from './interceptors/cache.interceptor';
import { PerformanceInterceptor } from './interceptors/performance.interceptor';
import { CacheService } from './services/cache.service';
import { DatabaseOptimizerService } from './services/database-optimizer.service';
import { PerformanceMonitorService } from './services/performance-monitor.service';
import { QueueService } from './services/queue.service';

@Global()
@Module({
  providers: [
    CacheService,
    PerformanceMonitorService,
    QueueService,
    DatabaseOptimizerService,
    PerformanceInterceptor,
    CacheInterceptor,
  ],
  exports: [
    CacheService,
    PerformanceMonitorService,
    QueueService,
    DatabaseOptimizerService,
    PerformanceInterceptor,
    CacheInterceptor,
  ],
})
export class PerformanceModule {}

