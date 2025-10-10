import { Injectable } from '@nestjs/common';

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

@Injectable()
export class CacheService {
  private cache = new Map<string, { value: any; expiry: number; tags: string[] }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || 300; // 5 minutes default
    const expiry = Date.now() + (ttl * 1000);
    
    this.cache.set(key, {
      value,
      expiry,
      tags: options.tags || []
    });
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    for (const [key, item] of this.cache.entries()) {
      if (item.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
      }
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}