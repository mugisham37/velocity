import { Database, db } from '@kiro/database';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SQL, and, asc, count, desc, eq, sql } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

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
  TTable extends PgTable,
  TSelect,
  TInsert,
  TUpdate = Partial<TInsert>,
> {
  protected abstract table: TTable;
  protected abstract tableName: string;
  protected database: Database;
  private cache = new Map<string, { data: any; expires: number }>();

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
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
        .insert(this.table)
        .values(insertData)
        .returning();

      this.invalidateCache();

      this.logger.info(`Created ${this.tableName}`, { id: (result as any).id });
      return result as TSelect;
    } catch (error) {
      this.logger.error(`Failed to create ${this.tableName}`, { error, data });
      throw new BadRequestException(
        `Failed to create ${this.tableName}: ${error.message}`
      );
    }
  }

  /**
   * Find record by ID
   */
  async findById(id: string, companyId?: string): Promise<TSelect | null> {
    try {
      const cacheKey = `${this.tableName}:${id}:${companyId || 'global'}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const conditions = [eq((this.table as any).id, id)];
      if (companyId) {
        conditions.push(eq((this.table as any).companyId, companyId));
      }

      const [result] = await this.database
        .select()
        .from(this.table)
        .where(and(...conditions))
        .limit(1);

      if (result) {
        this.setCache(cacheKey, result);
      }

      return (result as TSelect) || null;
    } catch (error) {
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
        .update(this.table)
        .set(updateData)
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
        .delete(this.table)
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
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      const offset = (page - 1) * limit;
      const cacheKey = `${this.tableName}:list:${JSON.stringify({ options, companyId, additionalWhere })}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
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
      const [{ total }] = await this.database
        .select({ total: count() })
        .from(this.table)
        .where(whereClause);

      // Get data with pagination
      const orderBy =
        sortOrder === 'asc'
          ? asc((this.table as any)[sortBy])
          : desc((this.table as any)[sortBy]);

      const data = await this.database
        .select()
        .from(this.table)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

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

      this.setCache(cacheKey, result, 300); // Cache for 5 minutes
      return result;
    } catch (error) {
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

      const [{ total }] = await this.database
        .select({ total: count() })
        .from(this.table)
        .where(whereClause);

      return total;
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
        .from(this.table)
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
        .insert(this.table)
        .values(insertData)
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
      throw new BadRequestException(
        `Failed to bulk create ${this.tableName}: ${error.message}`
      );
    }
  }

  /**
   * Cache management
   */
  protected setCache(key: string, data: any, ttl: number = 600): void {
    const expires = Date.now() + ttl * 1000;
    this.cache.set(key, { data, expires });
  }

  protected getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  protected invalidateCache(): void {
    // Clear all cache entries for this service
    const keysToDelete = Array.from(this.cache.keys()).filter(key =>
      key.startsWith(`${this.tableName}:`)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Execute raw SQL query
   */
  protected async executeRawQuery<T = any>(
    query: string,
    params: any[] = []
  ): Promise<T[]> {
    try {
      const result = await this.database.execute(sql.raw(query, params));
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
