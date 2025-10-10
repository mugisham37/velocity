import {
  Injectable,
} from '@nestjs/common';
import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Observable } from 'rxjs';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';

export const CACHE_KEY_METADATA = 'cache_key';
export const CACHE_TTL_METADATA = 'cache_ttl';
export const CACHE_TAGS_METADATA = 'cache_tags';

export interface CacheConfig {
  key?: string;
  ttl?: number;
  tags?: string[];
  condition?: (context: ExecutionContext, result: any) => boolean;
}

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const cacheKey = this.reflector.get<string>(
      CACHE_KEY_METADATA,
      context.getHandler()
    );
    const cacheTtl = this.reflector.get<number>(
      CACHE_TTL_METADATA,
      context.getHandler()
    );
    const cacheTags = this.reflector.get<string[]>(
      CACHE_TAGS_METADATA,
      context.getHandler()
    );

    if (!cacheKey) {
      return next.handle();
    }

    const resolvedCacheKey = this.resolveCacheKey(cacheKey, context);

    // Try to get from cache
    const cachedResult = await this.cacheService.get(resolvedCacheKey);
    if (cachedResult !== null) {
      return of(cachedResult);
    }

    // Execute the handler and cache the result
    return next.handle().pipe(
      tap(async (result: any) => {
        if (result !== null && result !== undefined) {
          await this.cacheService.set(resolvedCacheKey, result, {
            ttl: cacheTtl || 300, // Default 5 minutes
            tags: cacheTags || [],
          });
        }
      })
    );
  }

  private resolveCacheKey(template: string, context: ExecutionContext): string {
    const request = this.getRequest(context);
    const args = this.getArgs(context);

    let resolvedKey = template;

    // Replace placeholders in the cache key template
    if (request) {
      // Replace user-related placeholders
      if (request.user?.id) {
        resolvedKey = resolvedKey.replace('{userId}', request.user.id);
      }
      if (request.user?.companyId) {
        resolvedKey = resolvedKey.replace(
          '{companyId}',
          request.user.companyId
        );
      }
    }

    // Replace argument placeholders
    if (args) {
      Object.keys(args).forEach(key => {
        const placeholder = `{${key}}`;
        if (resolvedKey.includes(placeholder)) {
          resolvedKey = resolvedKey.replace(placeholder, String(args[key]));
        }
      });
    }

    return resolvedKey;
  }

  private getRequest(context: ExecutionContext): any {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest();
    } else if (context.getType<any>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      return gqlContext.getContext().request || gqlContext.getContext().req;
    }
    return null;
  }

  private getArgs(context: ExecutionContext): any {
    if (context.getType<any>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      return gqlContext.getArgs();
    }
    return null;
  }
}

// Decorators for easy cache configuration
export const Cache = (config: CacheConfig | string) => {
  return (
    _target: any,
    _propertyName: string,
    descriptor: PropertyDescriptor
  ) => {
    if (typeof config === 'string') {
      Reflect.defineMetadata(CACHE_KEY_METADATA, config, descriptor.value);
    } else {
      if (config.key) {
        Reflect.defineMetadata(
          CACHE_KEY_METADATA,
          config.key,
          descriptor.value
        );
      }
      if (config.ttl) {
        Reflect.defineMetadata(
          CACHE_TTL_METADATA,
          config.ttl,
          descriptor.value
        );
      }
      if (config.tags) {
        Reflect.defineMetadata(
          CACHE_TAGS_METADATA,
          config.tags,
          descriptor.value
        );
      }
    }
  };
};

export const CacheKey = (key: string) => {
  return (
    _target: any,
    _propertyName: string,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata(CACHE_KEY_METADATA, key, descriptor.value);
  };
};

export const CacheTTL = (ttl: number) => {
  return (
    _target: any,
    _propertyName: string,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata(CACHE_TTL_METADATA, ttl, descriptor.value);
  };
};

export const CacheTags = (tags: string[]) => {
  return (
    _target: any,
    _propertyName: string,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata(CACHE_TAGS_METADATA, tags, descriptor.value);
  };
};
