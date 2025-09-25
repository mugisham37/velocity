import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { Logger } from 'winston';
import { v4 as uuidv4 } from 'uuid';

interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  requestId: string;
  details?: any;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const response = ctx.getResponse<FastifyReply>();
    const requestId = uuidv4();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'InternalServerError';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || exception.name;
        details = (exceptionResponse as any).details;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
      
      // Handle specific error types
      if (exception.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        error = 'ValidationError';
      } else if (exception.name === 'UnauthorizedError') {
        status = HttpStatus.UNAUTHORIZED;
        error = 'UnauthorizedError';
      } else if (exception.name === 'ForbiddenError') {
        status = HttpStatus.FORBIDDEN;
        error = 'ForbiddenError';
      } else if (exception.name === 'NotFoundError') {
        status = HttpStatus.NOT_FOUND;
        error = 'NotFoundError';
      }
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
      ...(details && { details }),
    };

    // Log the error
    this.logger.error('Exception caught by global filter', {
      requestId,
      method: request.method,
      url: request.url,
      statusCode: status,
      error: error,
      message: message,
      stack: exception instanceof Error ? exception.stack : undefined,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });

    // Send error response
    response.status(status).send(errorResponse);
  }
}