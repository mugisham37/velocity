// Swagger decorators - using underscore prefix for unused parameters to avoid TypeScript warnings
export const ApiTags = (_tag: string) => (target: any) => target;
export const ApiBearerAuth = () => (target: any) => target;
export const ApiProperty =
  (_options?: any) => (_target: any, _propertyKey: string) => {};
export const ApiPropertyOptional =
  (_options?: any) => (_target: any, _propertyKey: string) => {};
export const ApiOperation =
  (_options?: any) =>
  (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) =>
    descriptor;
export const ApiParam =
  (_options?: any) =>
  (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) =>
    descriptor;
export const ApiQuery =
  (_options?: any) =>
  (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) =>
    descriptor;
export const ApiResponse =
  (_options?: any) =>
  (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) =>
    descriptor;

// PartialType utility
export function PartialType<T>(_classRef: new () => T): new () => Partial<T> {
  return class {} as new () => Partial<T>;
}
