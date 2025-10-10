import {
  Injectable,
} from '@nestjs/common';
import type {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { FastifyRequest } from 'fastify';
import { Logger } from 'winston';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const { method, url, headers } = request;
    const requestId = uuidv4();
    const startTime = Date.now();

    // Add request ID to request for tracking
    (request as any).requestId = requestId;

    // Log incoming request
    this.logger.info('Incoming request', {
      requestId,
      method,
      url,
      userAgent: headers['user-agent'],
      ip: request.ip,
      contentLength: headers['content-length'],
    });

    return next.handle().pipe(
      tap({
        next: (data: any) => {
          const duration = Date.now() - startTime;
          this.logger.info('Request completed', {
            requestId,
            method,
            url,
            duration: `${duration}ms`,
            responseSize: data ? JSON.stringify(data).length : 0,
          });
        },
        error: (error: any) => {
          const duration = Date.now() - startTime;
          this.logger.error('Request failed', {
            requestId,
            method,
            url,
            duration: `${duration}ms`,
            error: error.message,
            stack: error.stack,
          });
        },
      })
    );
  }
}