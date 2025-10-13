import { db, and, asc, count, desc, eq, sql } from '../../database';
import type { Database, SQL } from '../../database';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PgTable, TableConfig } from 'drizzle-orm/pg-core';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { CacheService } from './cache.service';
import { PerformanceMonitorService } from './performance-monitor.service';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CacheOptions {
  key: string;
  ttl?: number; // Time to live in seconds
}

@Injectable()
export abstract class BaseService<
  TTable extends PgTable<TableConfig>,
  TSelect extends Record<string, unknown>,
  TInsert extends Record<string, unknown>,
  TUpdate extends Record<string, unknown> = Partial<TInsert>,
> {
  protected abstract table: TTable;
  protected abstract tableName: string;
  protected database: Database;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger,
    protected readonly cacheService: CacheService,
    protected readonly performanceMonitor: PerformanceMonitorService
  ) {
    this.database = db;
  }

  /**
   * Create a new record
   */
  async create(data: TInsert, companyId?: string): Promise<TSelect> {
    try {
      this.logger.info(`Creating ${this.tableName}`, { data, companyId });

      const insertData = companyId ? ({ ...data, companyId } as TInsert) : data;

      const [result] = await this.database
        .insert(this.table as any)
        .values(insertData as any)
        .returning();

      this.invalidateCache();

      this.logger.info(`Created ${this.tableName}`, { id: (result as any).id });
      return result as TSelect;
    } catch (error) {
      this.logger.error(`Failed to create ${this.tableName}`, { error, data });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to create ${this.tableName}: ${errorMessage}`
      );
    }
  }

  /**
   * Find record by ID
   */
  async findById(id: string, companyId?: string): Promise<TSelect | null> {
    const timer = this.performanceMonitor.createTimer(
      `${this.tableName}.findById`
    );

    try {
      const cacheKey = `${this.tableName}:${id}:${companyId || 'global'}`;
      const cached = await this.cacheService.get<TSelect>(cacheKey);
      if (cached) {
        timer();
        return cached;
      }

      const conditions = [eq((this.table as any).id, id)];
      if (companyId) {
        conditions.push(eq((this.table as any).companyId, companyId));
      }

      const queryStart = performance.now();
      const [result] = await this.database
        .select()
        .from(this.table as any)
        .where(and(...conditions))
        .limit(1);

      const queryDuration = performance.now() - queryStart;
      this.performanceMonitor.recordQueryPerformance(
        `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`,
        queryDuration,
        [id]
      );

      if (result) {
        await this.cacheService.set(cacheKey, result, {
          ttl: 300, // 5 minutes
          tags: [this.tableName, `${this.tableName}:${id}`],
        });
      }

      timer();
      return (result as TSelect) || null;
    } catch (error) {
      timer();
      this.logger.error(`Failed to find ${this.tableName} by ID`, {
        error,
        id,
        companyId,
      });
      throw error;
    }
  }

  /**
   * Find record by ID or throw NotFoundException
   */
  async findByIdOrFail(id: string, companyId?: string): Promise<TSelect> {
    const result = await this.findById(id, companyId);
    if (!result) {
      throw new NotFoundException(`${this.tableName} with ID ${id} not found`);
    }
    return result;
  }

  /**
   * Update record by ID
   */
  async update(
    id: string,
    data: TUpdate,
    companyId?: string
  ): Promise<TSelect> {
    try {
      this.logger.info(`Updating ${this.tableName}`, { id, data, companyId });

      const conditions = [eq((this.table as any).id, id)];
      if (companyId) {
        conditions.push(eq((this.table as any).companyId, companyId));
      }

      const updateData = {
        ...data,
        updatedAt: new Date(),
      } as TUpdate;

      const [result] = await this.database
        .update(this.table as any)
        .set(updateData as any)
        .where(and(...conditions))
        .returning();

      if (!result) {
        throw new NotFoundException(
          `${this.tableName} with ID ${id} not found`
        );
      }

      this.invalidateCache();

      this.logger.info(`Updated ${this.tableName}`, { id });
      return result as TSelect;
    } catch (error) {
      this.logger.error(`Failed to update ${this.tableName}`, {
        error,
        id,
        data,
      });
      throw error;
    }
  }

  /**
   * Delete record by ID
   */
  async delete(id: string, companyId?: string): Promise<void> {
    try {
      this.logger.info(`Deleting ${this.tableName}`, { id, companyId });

      const conditions = [eq((this.table as any).id, id)];
      if (companyId) {
        conditions.push(eq((this.table as any).companyId, companyId));
      }

      const [result] = await this.database
        .delete(this.table as any)
        .where(and(...conditions))
        .returning();

      if (!result) {
        throw new NotFoundException(
          `${this.tableName} with ID ${id} not found`
        );
      }

      this.invalidateCache();

      this.logger.info(`Deleted ${this.tableName}`, { id });
    } catch (error) {
      this.logger.error(`Failed to delete ${this.tableName}`, { error, id });
      throw error;
    }
  }

  /**
   * Find all records with pagination
   */
  async findAll(
    options: PaginationOptions = {},
    companyId?: string,
    additionalWhere?: SQL
  ): Promise<PaginationResult<TSelect>> {
    const timer = this.performanceMonitor.createTimer(
      `${this.tableName}.findAll`
    );

    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      const offset = (page - 1) * limit;
      const cacheKey = `${this.tableName}:list:${JSON.stringify({ options, companyId })}`;
      const cached =
        await this.cacheService.get<PaginationResult<TSelect>>(cacheKey);
      if (cached) {
        timer();
        return cached;
      }

      // Build where conditions
      const conditions = [];
      if (companyId) {
        conditions.push(eq((this.table as any).companyId, companyId));
      }
      if (additionalWhere) {
        conditions.push(additionalWhere);
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const countStart = performance.now();
      const countResult = await this.database
        .select({ total: count() })
        .from(this.table as any)
        .where(whereClause);
      
      const total = Number(countResult[0]?.total || 0);

      const countDuration = performance.now() - countStart;
      this.performanceMonitor.recordQueryPerformance(
        `SELECT COUNT(*) FROM ${this.tableName}`,
        countDuration
      );

      // Get data with pagination
      const orderBy =
        sortOrder === 'asc'
          ? asc((this.table as any)[sortBy])
          : desc((this.table as any)[sortBy]);

      const queryStart = performance.now();
      const data = await this.database
        .select()
        .from(this.table as any)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      const queryDuration = performance.now() - queryStart;
      this.performanceMonitor.recordQueryPerformance(
        `SELECT * FROM ${this.tableName} ORDER BY ${sortBy} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`,
        queryDuration
      );

      const totalPages = Math.ceil(total / limit);
      const result = {
        data: data as TSelect[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };

      await this.cacheService.set(cacheKey, result, {
        ttl: 300, // 5 minutes
        tags: [this.tableName, `${this.tableName}:list`],
      });

      timer();
      return result;
    } catch (error) {
      timer();
      this.logger.error(`Failed to find all ${this.tableName}`, {
        error,
        options,
        companyId,
      });
      throw error;
    }
  }

  /**
   * Count records
   */
  async count(companyId?: string, additionalWhere?: SQL): Promise<number> {
    try {
      const conditions = [];
      if (companyId) {
        conditions.push(eq((this.table as any).companyId, companyId));
      }
      if (additionalWhere) {
        conditions.push(additionalWhere);
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const countResult = await this.database
        .select({ total: count() })
        .from(this.table as any)
        .where(whereClause);

      return Number(countResult[0]?.total || 0);
    } catch (error) {
      this.logger.error(`Failed to count ${this.tableName}`, {
        error,
        companyId,
      });
      throw error;
    }
  }

  /**
   * Check if record exists
   */
  async exists(id: string, companyId?: string): Promise<boolean> {
    try {
      const conditions = [eq((this.table as any).id, id)];
      if (companyId) {
        conditions.push(eq((this.table as any).companyId, companyId));
      }

      const [result] = await this.database
        .select({ id: (this.table as any).id })
        .from(this.table as any)
        .where(and(...conditions))
        .limit(1);

      return !!result;
    } catch (error) {
      this.logger.error(`Failed to check if ${this.tableName} exists`, {
        error,
        id,
        companyId,
      });
      throw error;
    }
  }

  /**
   * Bulk create records
   */
  async bulkCreate(data: TInsert[], companyId?: string): Promise<TSelect[]> {
    try {
      this.logger.info(`Bulk creating ${this.tableName}`, {
        count: data.length,
        companyId,
      });

      const insertData = companyId
        ? data.map(item => ({ ...item, companyId }) as TInsert)
        : data;

      const results = await this.database
        .insert(this.table as any)
        .values(insertData as any)
        .returning();

      this.invalidateCache();

      this.logger.info(`Bulk created ${this.tableName}`, {
        count: results.length,
      });
      return results as TSelect[];
    } catch (error) {
      this.logger.error(`Failed to bulk create ${this.tableName}`, {
        error,
        count: data.length,
      });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to bulk create ${this.tableName}: ${errorMessage}`
      );
    }
  }

  /**
   * Cache management
   */
  protected async invalidateCache(): Promise<void> {
    await this.cacheService.invalidateByTags([this.tableName]);
  }

  /**
   * Execute raw SQL query
   */
  protected async executeRawQuery<T = any>(
    query: string,
    params: any[] = []
  ): Promise<T[]> {
    try {
      const result = await this.database.execute(sql.raw(query));
      return result as T[];
    } catch (error) {
      this.logger.error('Failed to execute raw query', {
        error,
        query,
        params,
      });
      throw error;
    }
  }

  /**
   * Begin transaction
   */
  async transaction<T>(callback: (tx: Database) => Promise<T>): Promise<T> {
    return await this.database.transaction(callback);
  }
}

