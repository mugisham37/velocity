import { SetMetadata } from '@nestjs/common';
import type { PermissionRequirement } from '../guards/permissions.guard';

export const RequirePermissions = (...permissions: PermissionRequirement[]) =>
  SetMetadata('permissions', permissions);
