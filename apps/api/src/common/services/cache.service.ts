import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean; // Compress large values
  tags?: string[]; // Cache tags for invalidation
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private localCache = neMap<
    string,
    { data: any; expires: number; tags: string[] }
  >();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0,
  };
  private readonly maxLocalCacheSize = 1000;
  private readonly defaultTtl = 3600; // 1 hour

  constructor(
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  async onModuleInit() {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL');
      this.redis = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      await this.redis.connect();
      this.logger.info('Redis cache service connected successfully');

      // Set up Redis event listeners
      this.redis.on('error', error => {
        this.logger.error('Redis connection error:', error);
      });

      this.redis.on('reconnecting', () => {
        this.logger.info('Redis reconnecting...');
      });

      // Clean up local cache periodically
      setInterval(() => this.cleanupLocalCache(), 60000); // Every minute
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      this.logger.warn('Falling back to local cache only');
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.disconnect();
    }
  }

  /**
   * Get value from cache (multi-layer: local -> Redis)
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      // Try local cache first
      const localValue = this.getFromLocalCache(key);
      if (localValue !== null) {
        this.stats.hits++;
        this.updateHitRate();
        return localValue;
      }

      // Try Redis cache
      if (this.redis && this.redis.status === 'ready') {
        const redisValue = await this.redis.get(key);
        if (redisValue !== null) {
          const parsed = JSON.parse(redisValue);
          // Store in local cache for faster access
          this.setLocalCache(key, parsed.data, parsed.ttl, parsed.tags || []);
          this.stats.hits++;
          this.updateHitRate();
          return parsed.data;
        }
      }

      this.stats.misses++;
      this.updateHitRate();
      return null;
    } catch (error) {
      this.logger.error('Cache get error:', { error, key });
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  /**
   * Set value in cache (multi-layer: local + Redis)
   */
  async set<T = any>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const { ttl = this.defaultTtl, compress = false, tags = [] } = options;
      const expires = Date.now() + ttl * 1000;

      // Store in local cache
      this.setLocalCache(key, value, ttl, tags);

      // Store in Redis
      if (this.redis && this.redis.status === 'ready') {
        const cacheData = {
          data: value,
          ttl,
          tags,
          compressed: compress,
        };

        let serialized = JSON.stringify(cacheData);

        // Compress if requested and data is large
        if (compress && serialized.length > 1024) {
          // Simple compression placeholder - in production use zlib
          this.logger.debug('Compressing cache data', {
            key,
            size: serialized.length,
          });
        }

        await this.redis.setex(key, ttl, serialized);

        // Store tags for invalidation
        if (tags.length > 0) {
          for (const tag of tags) {
            await this.redis.sadd(`tag:${tag}`, key);
            await this.redis.expire(`tag:${tag}`, ttl);
          }
        }
      }

      this.stats.sets++;
      this.logger.debug('Cache set', { key, ttl, tags });
    } catch (error) {
      this.logger.error('Cache set error:', { error, key });
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      // Remove from local cache
      this.localCache.delete(key);

      // Remove from Redis
      if (this.redis && this.redis.status === 'ready') {
        await this.redis.del(key);
      }

      this.stats.deletes++;
      this.logger.debug('Cache delete', { key });
    } catch (error) {
      this.logger.error('Cache delete error:', { error, key });
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      if (!this.redis || this.redis.status !== 'ready') {
        // Fallback to local cache invalidation
        for (const [key, value] of this.localCache.entries()) {
          if (value.tags.some(tag => tags.includes(tag))) {
            this.localCache.delete(key);
          }
        }
        return;
      }

      const keysToDelete = new Set<string>();

      for (const tag of tags) {
        const keys = await this.redis.smembers(`tag:${tag}`);
        keys.forEach(key => keysToDelete.add(key));
        await this.redis.del(`tag:${tag}`);
      }

      if (keysToDelete.size > 0) {
        await this.redis.del(...Array.from(keysToDelete));

        // Also remove from local cache
        for (const key of keysToDelete) {
          this.localCache.delete(key);
        }
      }

      this.logger.info('Cache invalidated by tags', {
        tags,
        keysDeleted: keysToDelete.size,
      });
    } catch (error) {
      this.logger.error('Cache invalidation error:', { error, tags });
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      this.localCache.clear();

      if (this.redis && this.redis.status === 'ready') {
        await this.redis.flushdb();
      }

      this.logger.info('Cache cleared');
    } catch (error) {
      this.logger.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T = any>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Increment counter in cache
   */
  async increment(key: string, by: number = 1, ttl?: number): Promise<number> {
    try {
      if (this.redis && this.redis.status === 'ready') {
        const result = await this.redis.incrby(key, by);
        if (ttl) {
          await this.redis.expire(key, ttl);
        }
        return result;
      }

      // Fallback to local cache
      const current = this.getFromLocalCache(key) || 0;
      const newValue = current + by;
      this.setLocalCache(key, newValue, ttl || this.defaultTtl);
      return newValue;
    } catch (error) {
      this.logger.error('Cache increment error:', { error, key });
      return 0;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      // Check local cache first
      if (this.localCache.has(key)) {
        const cached = this.localCache.get(key);
        if (cached && Date.now() < cached.expires) {
          return true;
        }
        this.localCache.delete(key);
      }

      // Check Redis
      if (this.redis && this.redis.status === 'ready') {
        const exists = await this.redis.exists(key);
        return exists === 1;
      }

      return false;
    } catch (error) {
      this.logger.error('Cache exists error:', { error, key });
      return false;
    }
  }

  /**
   * Get multiple keys at once
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    try {
      const results: (T | null)[] = new Array(keys.length).fill(null);
      const missingKeys: { index: number; key: string }[] = [];

      // Check local cache first
      for (let i = 0; i < keys.length; i++) {
        const localValue = this.getFromLocalCache(keys[i]);
        if (localValue !== null) {
          results[i] = localValue;
          this.stats.hits++;
        } else {
          missingKeys.push({ index: i, key: keys[i] });
        }
      }

      // Get missing keys from Redis
      if (
        missingKeys.length > 0 &&
        this.redis &&
        this.redis.status === 'ready'
      ) {
        const redisKeys = missingKeys.map(item => item.key);
        const redisValues = await this.redis.mget(...redisKeys);

        for (let i = 0; i < redisValues.length; i++) {
          const redisValue = redisValues[i];
          const { index, key } = missingKeys[i];

          if (redisValue !== null) {
            const parsed = JSON.parse(redisValue);
            results[index] = parsed.data;
            this.setLocalCache(key, parsed.data, parsed.ttl, parsed.tags || []);
            this.stats.hits++;
          } else {
            this.stats.misses++;
          }
        }
      } else {
        this.stats.misses += missingKeys.length;
      }

      this.updateHitRate();
      return results;
    } catch (error) {
      this.logger.error('Cache mget error:', { error, keys });
      return new Array(keys.length).fill(null);
    }
  }

  private getFromLocalCache(key: string): any | null {
    const cached = this.localCache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expires) {
      this.localCache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setLocalCache(
    key: string,
    data: any,
    ttl: number,
    tags: string[] = []
  ): void {
    // Implement LRU eviction if cache is full
    if (this.localCache.size >= this.maxLocalCacheSize) {
      const firstKey = this.localCache.keys().next().value;
      this.localCache.delete(firstKey);
    }

    const expires = Date.now() + ttl * 1000;
    this.localCache.set(key, { data, expires, tags });
  }

  private cleanupLocalCache(): void {
    const now = Date.now();
    for (const [key, value] of this.localCache.entries()) {
      if (now > value.expires) {
        this.localCache.delete(key);
      }
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }
}
