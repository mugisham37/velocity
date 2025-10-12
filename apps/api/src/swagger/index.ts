/**
 * Swagger decorators for API documentation
 *
 * This module provides decorators compatible with @nestjs/swagger
 * for documenting REST API endpoints and DTOs.
 */

// Custom PartialType implementation for DTO inheritance
export function PartialType<T>(classRef: new (...args: any[]) => T) {
  class PartialClass extends (classRef as any) {}

  // Copy metadata from the original class
  const originalMetadata =
    Reflect.getMetadata('swagger/apiModelProperties', classRef) || {};
  const partialMetadata: any = {};

  // Make all properties optional
  Object.keys(originalMetadata).forEach(key => {
    partialMetadata[key] = {
      ...originalMetadata[key],
      required: false,
    };
  });

  Reflect.defineMetadata(
    'swagger/apiModelProperties',
    partialMetadata,
    PartialClass
  );

  return PartialClass as new (...args: any[]) => Partial<T>;
}

export function ApiTags(tag: string) {
  return function (target: any) {
    Reflect.defineMetadata('swagger/apiUseTags', tag, target);
    return target;
  };
}

export function ApiBearerAuth(name?: string) {
  return function (target: any) {
    const existingAuth =
      Reflect.getMetadata('swagger/apiSecurity', target) || [];
    const authName = name || 'bearer';
    Reflect.defineMetadata(
      'swagger/apiSecurity',
      [...existingAuth, { [authName]: [] }],
      target
    );
    return target;
  };
}

export function ApiOperation(options: {
  summary: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  deprecated?: boolean;
}) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    Reflect.defineMetadata('swagger/apiOperation', options, descriptor.value);
    return descriptor;
  };
}

export function ApiResponse(options: {
  status: number;
  description: string;
  type?: any;
  schema?: any;
  examples?: any;
}) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const existingResponses =
      Reflect.getMetadata('swagger/apiResponse', descriptor.value) || {};
    existingResponses[options.status] = options;
    Reflect.defineMetadata(
      'swagger/apiResponse',
      existingResponses,
      descriptor.value
    );
    return descriptor;
  };
}

export function ApiParam(options: {
  name: string;
  description?: string;
  type?: any;
  required?: boolean;
  enum?: any[];
  example?: any;
}) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const existingParams =
      Reflect.getMetadata('swagger/apiParam', descriptor.value) || [];
    existingParams.push(options);
    Reflect.defineMetadata(
      'swagger/apiParam',
      existingParams,
      descriptor.value
    );
    return descriptor;
  };
}

export function ApiQuery(options: {
  name: string;
  description?: string;
  type?: any;
  required?: boolean;
  enum?: any[];
  example?: any;
}) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const existingQueries =
      Reflect.getMetadata('swagger/apiQuery', descriptor.value) || [];
    existingQueries.push(options);
    Reflect.defineMetadata(
      'swagger/apiQuery',
      existingQueries,
      descriptor.value
    );
    return descriptor;
  };
}

export function ApiProperty(options?: {
  description?: string;
  enum?: any;
  type?: any;
  example?: any;
  default?: any;
  required?: boolean;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}) {
  return function (target: any, propertyKey: string) {
    const existingProperties =
      Reflect.getMetadata('swagger/apiModelProperties', target.constructor) ||
      {};
    existingProperties[propertyKey] = { ...options, required: true };
    Reflect.defineMetadata(
      'swagger/apiModelProperties',
      existingProperties,
      target.constructor
    );
  };
}

export function ApiPropertyOptional(options?: {
  description?: string;
  enum?: any;
  type?: any;
  example?: any;
  default?: any;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}) {
  return function (target: any, propertyKey: string) {
    const existingProperties =
      Reflect.getMetadata('swagger/apiModelProperties', target.constructor) ||
      {};
    existingProperties[propertyKey] = { ...options, required: false };
    Reflect.defineMetadata(
      'swagger/apiModelProperties',
      existingProperties,
      target.constructor
    );
  };
}

// Additional commonly used decorators
export function ApiBody(options: {
  description?: string;
  type?: any;
  required?: boolean;
  examples?: any;
}) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    Reflect.defineMetadata('swagger/apiBody', options, descriptor.value);
    return descriptor;
  };
}

export function ApiHeader(options: {
  name: string;
  description?: string;
  required?: boolean;
  schema?: any;
}) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const existingHeaders =
      Reflect.getMetadata('swagger/apiHeader', descriptor.value) || [];
    existingHeaders.push(options);
    Reflect.defineMetadata(
      'swagger/apiHeader',
      existingHeaders,
      descriptor.value
    );
    return descriptor;
  };
}

export function ApiExcludeEndpoint() {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    Reflect.defineMetadata(
      'swagger/apiExcludeEndpoint',
      true,
      descriptor.value
    );
    return descriptor;
  };
}

// Type definitions for better TypeScript support
export interface ApiResponseOptions {
  status: number;
  description: string;
  type?: any;
  schema?: any;
  examples?: any;
}

export interface ApiOperationOptions {
  summary: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  deprecated?: boolean;
}

export interface ApiPropertyOptions {
  description?: string;
  enum?: any;
  type?: any;
  example?: any;
  default?: any;
  required?: boolean;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}
