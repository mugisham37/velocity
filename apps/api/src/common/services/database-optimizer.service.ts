import { Database, db } from '@kiro/database';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { sql } from '@kiro/database';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export interface QueryAnalysis {
  query: string;
  executionTime: number;
  planningTime: number;
  totalCost: number;
  rows: number;
  bufferHits: number;
  bufferReads: number;
  suggestions: string[];
}

export interface IndexSuggestion {
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  reason: string;
  estimatedImprovement: number;
}

export interface DatabaseStats {
  totalSize: string;
  tableStats: Array<{
    tableName: string;
    size: string;
    rowCount: number;
    indexSize: string;
    indexCount: number;
  }>;
  slows: Array<{
    query: string;
    avgTime: number;
    calls: number;
    totalTime: number;
  }>;
  indexUsage: Array<{
    tableName: string;
    indexName: string;
    scans: number;
    tuples: number;
    usage: number;
  }>;
}

@Injectable()
export class DatabaseOptimizerService implements OnModuleInit {
  private database: Database;
  private queryCache = new Map<string, QueryAnalysis>();
  private readonly maxCacheSize = 1000;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.database = db;
  }

  async onModuleInit() {
    // Enable query statistics collection
    await this.enableQueryStats();

    // Schedule periodic optimization analysis
    setInterval(() => this.performPeriodicAnalysis(), 3600000); // Every hour
  }

  /**
   * Analyze a specific query and provide optimization suggestions
   */
  async analyzeQuery(
    query: string,
    params: any[] = []
  ): Promise<QueryAnalysis> {
    try {
      const cacheKey = this.getCacheKey(query, params);
      const cached = this.queryCache.get(cacheKey);

      if (cached) {
        return cached;
      }

      // Execute EXPLAIN ANALYZE
      const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
      const result = await this.database.execute(sql.raw(explainQuery, params));

      const plan = result[0]?.['QUERY PLAN']?.[0];
      if (!plan) {
        throw new Error('Failed to get query plan');
      }

      const analysis: QueryAnalysis = {
        query: this.sanitizeQuery(query),
        executionTime: plan['Execution Time'] || 0,
        planningTime: plan['Planning Time'] || 0,
        totalCost: plan.Plan?.['Total Cost'] || 0,
        rows: plan.Plan?.['Actual Rows'] || 0,
        bufferHits: plan.Plan?.['Shared Hit Blocks'] || 0,
        bufferReads: plan.Plan?.['Shared Read Blocks'] || 0,
        suggestions: this.generateSuggestions(plan),
      };

      // Cache the analysis
      this.cacheAnalysis(cacheKey, analysis);

      return analysis;
    } catch (error) {
      this.logger.error('Failed to analyze query', { error, query });
      throw error;
    }
  }

  /**
   * Get database statistics and performance metrics
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    try {
      const [totalSize, tableStats, slowQueries, indexUsage] =
        await Promise.all([
          this.getTotalDatabaseSize(),
          this.getTableStats(),
          this.getSlowQueries(),
          this.getIndexUsage(),
        ]);

      return {
        totalSize,
        tableStats,
        slowQueries,
        indexUsage,
      };
    } catch (error) {
      this.logger.error('Failed to get database stats', error);
      throw error;
    }
  }

  /**
   * Generate index suggestions based on query patterns
   */
  async generateIndexSuggestions(): Promise<IndexSuggestion[]> {
    try {
      const suggestions: IndexSuggestion[] = [];

      // Analyze slow queries for missing indexes
      const slowQueries = await this.getSlowQueries();

      for (const slowQuery of slowQueries) {
        const queryAnalysis = await this.analyzeQuery(slowQuery.query);
        const indexSuggestions = this.extractIndexSuggestions(queryAnalysis);
        suggestions.push(...indexSuggestions);
      }

      // Analyze table scans
      const tableScans = await this.getTableScans();
      for (const scan of tableScans) {
        suggestions.push({
          table: scan.table,
          columns: scan.columns,
          type: 'btree',
          reason: 'Frequent sequential scans detected',
          estimatedImprovement: scan.scanCount * 0.1, // Rough estimate
        });
      }

      // Remove duplicates and sort by estimated improvement
      const uniqueSuggestions = this.deduplicateIndexSuggestions(suggestions);
      return uniqueSuggestions.sort(
        (a, b) => b.estimatedImprovement - a.estimatedImprovement
      );
    } catch (error) {
      this.logger.error('Failed to generate index suggestions', error);
      return [];
    }
  }

  /**
   * Create recommended indexes
   */
  async createRecommendedIndexes(
    suggestions: IndexSuggestion[]
  ): Promise<void> {
    try {
      for (const suggestion of suggestions) {
        await this.createIndex(suggestion);
      }
    } catch (error) {
      this.logger.error('Failed to create recommended indexes', error);
      throw error;
    }
  }

  /**
   * Analyze table partitioning opportunities
   */
  async analyzePartitioning(): Promise<
    Array<{
      table: string;
      recommendedPartitioning: 'range' | 'hash' | 'list';
      partitionColumn: string;
      reason: string;
      estimatedBenefit: number;
    }>
  > {
    try {
      const largeTablesQuery = sql`
        SELECT
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
          n_tup_ins + n_tup_upd + n_tup_del as total_writes
        FROM pg_stat_user_tables
        WHERE pg_total_relation_size(schemaname||'.'||tablename) > 1073741824 -- 1GB
        ORDER BY size_bytes DESC
        LIMIT 20
      `;

      const largeTables = await this.database.execute(largeTablesQuery);
      const recommendations = [];

      for (const table of largeTables) {
        const analysis = await this.analyzeTableForPartitioning(
          table.tablename
        );
        if (analysis) {
          recommendations.push(analysis);
        }
      }

      return recommendations;
    } catch (error) {
      this.logger.error('Failed to analyze partitioning opportunities', error);
      return [];
    }
  }

  /**
   * Optimize database configuration
   */
  async optimizeConfiguration(): Promise<Record<string, any>> {
    try {
      const currentConfig = await this.getCurrentConfiguration();
      const systemInfo = await this.getSystemInfo();

      const recommendations = {
        shared_buffers: this.calculateSharedBuffers(systemInfo.totalMemory),
        effective_cache_size: this.calculateEffectiveCacheSize(
          systemInfo.totalMemory
        ),
        work_mem: this.calculateWorkMem(systemInfo.totalMemory),
        maintenance_work_mem: this.calculateMaintenanceWorkMem(
          systemInfo.totalMemory
        ),
        checkpoint_completion_target: 0.9,
        wal_buffers: '16MB',
        default_statistics_target: 100,
        random_page_cost: systemInfo.hasSSD ? 1.1 : 4.0,
        effective_io_concurrency: systemInfo.hasSSD ? 200 : 2,
      };

      // Compare with current configuration
      const changes = {};
      for (const [key, recommendedValue] of Object.entries(recommendations)) {
        const currentValue = currentConfig[key];
        if (currentValue !== recommendedValue) {
          changes[key] = {
            current: currentValue,
            recommended: recommendedValue,
            reason: this.getConfigurationReason(
              key,
              recommendedValue,
              systemInfo
            ),
          };
        }
      }

      return changes;
    } catch (error) {
      this.logger.error('Failed to optimize configuration', error);
      return {};
    }
  }

  /**
   * Monitor query performance in real-time
   */
  async startQueryMonitoring(): Promise<void> {
    try {
      // Enable pg_stat_statements if not already enabled
      await this.database.execute(
        sql`CREATE EXTENSION IF NOT EXISTS pg_stat_statements`
      );

      this.logger.info('Query monitoring started');
    } catch (error) {
      this.logger.error('Failed to start query monitoring', error);
    }
  }

  private async enableQueryStats(): Promise<void> {
    try {
      await this.database.execute(sql`
        ALTER SYSTEM SET track_activities = on;
        ALTER SYSTEM SET track_counts = on;
        ALTER SYSTEM SET track_io_timing = on;
        ALTER SYSTEM SET track_functions = 'all';
        ALTER SYSTEM SET log_statement_stats = off;
        ALTER SYSTEM SET log_parser_stats = off;
        ALTER SYSTEM SET log_planner_stats = off;
        ALTER SYSTEM SET log_executor_stats = off;
      `);

      // Note: In production, you would need to reload configuration
      this.logger.info('Query statistics enabled');
    } catch (error) {
      this.logger.warn(
        'Failed to enable query stats (may require superuser privileges)',
        error
      );
    }
  }

  private async getTotalDatabaseSize(): Promise<string> {
    const result = await this.database.execute(sql`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);
    return result[0]?.size || '0 bytes';
  }

  private async getTableStats(): Promise<DatabaseStats['tableStats']> {
    const result = await this.database.execute(sql`
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_stat_get_tuples_returned(c.oid) as row_count,
        pg_size_pretty(pg_indexes_size(c.oid)) as index_size,
        (SELECT count(*) FROM pg_indexes WHERE tablename = t.tablename) as index_count
      FROM pg_stat_user_tables t
      JOIN pg_class c ON c.relname = t.tablename
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 20
    `);

    return result.map(row => ({
      tableName: row.tablename,
      size: row.size,
      rowCount: parseInt(row.row_count) || 0,
      indexSize: row.index_size,
      indexCount: parseInt(row.index_count) || 0,
    }));
  }

  private async getSlowQueries(): Promise<DatabaseStats['slowQueries']> {
    try {
      const result = await this.database.execute(sql`
        SELECT
          query,
          mean_exec_time as avg_time,
          calls,
          total_exec_time as total_time
        FROM pg_stat_statements
        WHERE mean_exec_time > 100 -- queries taking more than 100ms on average
        ORDER BY mean_exec_time DESC
        LIMIT 20
      `);

      return result.map(row => ({
        query: this.sanitizeQuery(row.query),
        avgTime: parseFloat(row.avg_time) || 0,
        calls: parseInt(row.calls) || 0,
        totalTime: parseFloat(row.total_time) || 0,
      }));
    } catch (error) {
      // pg_stat_statements might not be available
      this.logger.warn(
        'pg_stat_statements not available for slow query analysis'
      );
      return [];
    }
  }

  private async getIndexUsage(): Promise<DatabaseStats['indexUsage']> {
    const result = await this.database.execute(sql`
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan as scans,
        idx_tup_read as tuples,
        CASE
          WHEN idx_scan = 0 THEN 0
          ELSE round((idx_tup_read::numeric / idx_scan), 2)
        END as usage
      FROM pg_stat_user_indexes
      ORDER BY idx_scan DESC
      LIMIT 50
    `);

    return result.map(row => ({
      tableName: row.tablename,
      indexName: row.indexname,
      scans: parseInt(row.scans) || 0,
      tuples: parseInt(row.tuples) || 0,
      usage: parseFloat(row.usage) || 0,
    }));
  }

  private async getTableScans(): Promise<
    Array<{ table: string; columns: string[]; scanCount: number }>
  > {
    // This would require more sophisticated analysis of query logs
    // For now, return empty array
    return [];
  }

  private generateSuggestions(plan: any): string[] {
    const suggestions: string[] = [];

    if (plan.Plan) {
      this.analyzePlanNode(plan.Plan, suggestions);
    }

    return suggestions;
  }

  private analyzePlanNode(node: any, suggestions: string[]): void {
    // Analyze different node types for optimization opportunities
    switch (node['Node Type']) {
      case 'Seq Scan':
        if (node['Actual Rows'] > 1000) {
          suggestions.push(
            `Consider adding an index on table ${node['Relation Name']} for better performance`
          );
        }
        break;

      case 'Sort':
        if (node['Sort Method'] === 'external merge') {
          suggestions.push(
            'Sort operation is using disk. Consider increasing work_mem'
          );
        }
        break;

      case 'Hash Join':
        if (node['Hash Buckets'] && node['Hash Batches'] > 1) {
          suggestions.push(
            'Hash join is using multiple batches. Consider increasing work_mem'
          );
        }
        break;

      case 'Nested Loop':
        if (node['Actual Rows'] > 10000) {
          suggestions.push(
            'Nested loop with many rows. Consider adding indexes or rewriting query'
          );
        }
        break;
    }

    // Recursively analyze child nodes
    if (node.Plans) {
      for (const childNode of node.Plans) {
        this.analyzePlanNode(childNode, suggestions);
      }
    }
  }

  private extractIndexSuggestions(analysis: QueryAnalysis): IndexSuggestion[] {
    // This would require sophisticated query parsing
    // For now, return empty array
    return [];
  }

  private deduplicateIndexSuggestions(
    suggestions: IndexSuggestion[]
  ): IndexSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      const key = `${suggestion.table}:${suggestion.columns.join(',')}:${suggestion.type}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private async createIndex(suggestion: IndexSuggestion): Promise<void> {
    try {
      const indexName = `idx_${suggestion.table}_${suggestion.columns.join('_')}`;
      const columnsStr = suggestion.columns.join(', ');

      const createIndexQuery = sql.raw(`
        CREATE INDEX CONCURRENTLY ${indexName}
        ON ${suggestion.table}
        USING ${suggestion.type} (${columnsStr})
      `);

      await this.database.execute(createIndexQuery);
      this.logger.info('Index created successfully', {
        indexName,
        table: suggestion.table,
      });
    } catch (error) {
      this.logger.error('Failed to create index', { error, suggestion });
      throw error;
    }
  }

  private async analyzeTableForPartitioning(tableName: string): Promise<any> {
    // Analyze table structure and access patterns for partitioning recommendations
    // This would require detailed analysis of table schema and query patterns
    return null;
  }

  private async getCurrentConfiguration(): Promise<Record<string, any>> {
    const result = await this.database.execute(sql`
      SELECT name, setting, unit
      FROM pg_settings
      WHERE name IN (
        'shared_buffers', 'effective_cache_size', 'work_mem',
        'maintenance_work_mem', 'checkpoint_completion_target',
        'wal_buffers', 'default_statistics_target', 'random_page_cost',
        'effective_io_concurrency'
      )
    `);

    const config = {};
    for (const row of result) {
      config[row.name] = row.setting + (row.unit ? row.unit : '');
    }
    return config;
  }

  private async getSystemInfo(): Promise<{
    totalMemory: number;
    hasSSD: boolean;
  }> {
    // This would require system-level queries or external tools
    // For now, return default values
    return {
      totalMemory: 8 * 1024 * 1024 * 1024, // 8GB default
      hasSSD: true, // Assume SSD
    };
  }

  private calculateSharedBuffers(totalMemory: number): string {
    // 25% of total memory, but not more than 8GB
    const bufferSize = Math.min(totalMemory * 0.25, 8 * 1024 * 1024 * 1024);
    return `${Math.round(bufferSize / (1024 * 1024))}MB`;
  }

  private calculateEffectiveCacheSize(totalMemory: number): string {
    // 75% of total memory
    const cacheSize = totalMemory * 0.75;
    return `${Math.round(cacheSize / (1024 * 1024))}MB`;
  }

  private calculateWorkMem(totalMemory: number): string {
    // Start with 4MB and scale based on memory
    const workMem = Math.max(4 * 1024 * 1024, totalMemory / 200);
    return `${Math.round(workMem / (1024 * 1024))}MB`;
  }

  private calculateMaintenanceWorkMem(totalMemory: number): string {
    // 5% of total memory, but not more than 2GB
    const maintenanceWorkMem = Math.min(
      totalMemory * 0.05,
      2 * 1024 * 1024 * 1024
    );
    return `${Math.round(maintenanceWorkMem / (1024 * 1024))}MB`;
  }

  private getConfigurationReason(
    key: string,
    value: any,
    systemInfo: any
  ): string {
    const reasons = {
      shared_buffers: 'Optimized for available system memory',
      effective_cache_size: 'Set to utilize available system cache',
      work_mem: 'Balanced for concurrent operations',
      maintenance_work_mem: 'Optimized for maintenance operations',
      random_page_cost: systemInfo.hasSSD
        ? 'Optimized for SSD storage'
        : 'Optimized for HDD storage',
      effective_io_concurrency: systemInfo.hasSSD
        ? 'Optimized for SSD concurrent I/O'
        : 'Conservative setting for HDD',
    };
    return reasons[key] || 'Performance optimization';
  }

  private async performPeriodicAnalysis(): Promise<void> {
    try {
      this.logger.info('Starting periodic database analysis');

      const [stats, indexSuggestions] = await Promise.all([
        this.getDatabaseStats(),
        this.generateIndexSuggestions(),
      ]);

      // Log important findings
      if (stats.slowQueries.length > 0) {
        this.logger.warn('Slow queries detected', {
          count: stats.slowQueries.length,
        });
      }

      if (indexSuggestions.length > 0) {
        this.logger.info('Index suggestions available', {
          count: indexSuggestions.length,
        });
      }

      // Clean up query cache
      if (this.queryCache.size > this.maxCacheSize) {
        const keysToDelete = Array.from(this.queryCache.keys()).slice(
          0,
          this.queryCache.size - this.maxCacheSize
        );
        keysToDelete.forEach(key => this.queryCache.delete(key));
      }
    } catch (error) {
      this.logger.error('Periodic database analysis failed', error);
    }
  }

  private getCacheKey(query: string, params: any[]): string {
    return `${this.sanitizeQuery(query)}:${JSON.stringify(params)}`;
  }

  private cacheAnalysis(key: string, analysis: QueryAnalysis): void {
    if (this.queryCache.size >= this.maxCacheSize) {
      const firstKey = this.queryCache.keys().next().value;
      this.queryCache.delete(firstKey);
    }
    this.queryCache.set(key, analysis);
  }

  private sanitizeQuery(query: string): string {
    return query.replace(/\s+/g, ' ').trim().substring(0, 200);
  }
}
