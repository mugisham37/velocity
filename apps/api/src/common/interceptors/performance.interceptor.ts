import {
  Injectable,
} from '@nestjs/common';
import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PerformanceMonitorService } from '../services/performance-monitor.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private readonly performanceMonitor: PerformanceMonitorService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = performance.now();
    const request = this.getRequest(context);
    const endpoint = this.getEndpoint(context);
    const method = this.getMethod(context);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = performance.now() - startTime;
          this.recordPerformance(request, endpoint, method, duration, 200);
        },
        error: (error: any) => {
          const duration = performance.now() - startTime;
          const statusCode = error.status || 500;
          this.recordPerformance(
            request,
            endpoint,
            method,
            duration,
            statusCode
          );
        },
      })
    );
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

  private getEndpoint(context: ExecutionContext): string {
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      return request.url || request.route?.path || 'unknown';
    } else if (context.getType<any>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      const info = gqlContext.getInfo();
      return `${info.operation.operation}:${info.fieldName}`;
    }
    return 'unknown';
  }

  private getMethod(context: ExecutionContext): string {
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      return request.method || 'GET';
    } else if (context.getType<any>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      const info = gqlContext.getInfo();
      return info.operation.operation.toUpperCase();
    }
    return 'UNKNOWN';
  }

  private recordPerformance(
    request: any,
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number
  ): void {
    const userAgent = request?.headers?.['user-agent'];
    const ip = request?.ip || request?.connection?.remoteAddress;

    this.performanceMonitor.recordAPIPerformance(
      endpoint,
      method,
      duration,
      statusCode,
      userAgent,
      ip
    );

    // Record additional metrics
    this.performanceMonitor.recordMetric('api.response_time', duration, 'ms', {
      endpoint,
      method,
      status: statusCode.toString(),
    });

    if (statusCode >= 400) {
      this.performanceMonitor.recordMetric('api.error_count', 1, 'count', {
        endpoint,
        method,
        status: statusCode.toString(),
      });
    }
  }
}

