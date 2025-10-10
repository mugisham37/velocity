import { Injectable } from '@nestjs/common';
import type {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;

    console.log(`Audit: ${method} ${url} by user ${user?.id || 'anonymous'}`);

    return next.handle().pipe(
      tap(() => {
        console.log(`Audit: ${method} ${url} completed successfully`);
      })
    );
  }
}
