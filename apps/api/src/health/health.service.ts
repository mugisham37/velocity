import { Injectable } from '@nestjs/common';
import { checkDatabaseHealth } from '@kiro/database';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: 'healthy' | 'unhealthy';
    redis: 'healthy' | 'unhealthy';
    elasticsearch: 'healthy' | 'unhealthy';
  };
}

@Injectable()
export class HealthService {
  async getHealthStatus(): Promise<HealthStatus> {
    // Check database health
    const databaseHealthy = await checkDatabaseHealth();

    // TODO: Add Redis health check
    const redisHealthy = true; // Placeholder

    // TODO: Add Elasticsearch health check
    const elasticsearchHealthy = true; // Placeholder

    const allServicesHealthy =
      databaseHealthy && redisHealthy && elasticsearchHealthy;

    return {
      status: allServicesHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env['npm_package_version'] || '1.0.0',
      environment: process.env['NODE_ENV'] || 'development',
      services: {
        database: databaseHealthy ? 'healthy' : 'unhealthy',
        redis: redisHealthy ? 'healthy' : 'unhealthy',
        elasticsearch: elasticsearchHealthy ? 'healthy' : 'unhealthy',
      },
    };
  }

  async getReadinessStatus() {
    const health = await this.getHealthStatus();
    return {
      ready: health.status === 'healthy',
      timestamp: health.timestamp,
      services: health.services,
    };
  }

  async getLivenessStatus() {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
