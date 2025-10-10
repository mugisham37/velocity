import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { RbacService } from '../services/rbac.service';

export interface PermissionRequirement {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionRequirement[]
    >('permissions', [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user;
    const args = ctx.getArgs();

    if (!user) {
      return false;
    }

    // Check if user has all required permissions
    for (const permission of requiredPermissions) {
      const hasPermission = await this.rbacService.hasPermission(
        user.id,
        permission.resource,
        permission.action,
        { ...permission.conditions, ...args, userId: user.id }
      );

      if (!hasPermission) {
        return false;
      }
    }

    return true;
  }
}
