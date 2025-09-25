import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/users.service';

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  parentRoleId?: string;
  isSystemRole: boolean;
}

export interface RoleHierarchy {
  role: Role;
  children: RoleHierarchy[];
}

@Injectable()
export class RbacService {
  constructor(private readonly usersService: UsersService) {}

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const userRoles = await this.usersService.getUserRoles(userId);
    const allPermissions = new Map<string, Permission>();

    // Collect permissions from all roles (including inherited)
    for (const role of userRoles) {
      const rolePermissions = await this.getRolePermissions(role.id);
      for (const permission of rolePermissions) {
        allPermissions.set(permission.id, permission);
      }
    }

    return Array.from(allPermissions.values());
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const role = await this.usersService.findRoleById(roleId);
    if (!role) {
      return [];
    }

    const permissions = new Map<string, Permission>();

    // Add direct permissions
    const directPermissions =
      await this.usersService.getRolePermissions(roleId);
    for (const permission of directPermissions) {
      permissions.set(permission.id, permission);
    }

    // Add inherited permissions from parent roles
    if (role.parentRoleId) {
      const parentPermissions = await this.getRolePermissions(
        role.parentRoleId
      );
      for (const permission of parentPermissions) {
        permissions.set(permission.id, permission);
      }
    }

    return Array.from(permissions.values());
  }

  async hasPermission(
    userId: string,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);

    for (const permission of permissions) {
      if (permission.resource === resource && permission.action === action) {
        // Check conditions if they exist
        if (permission.conditions && context) {
          if (this.evaluateConditions(permission.conditions, context)) {
            return true;
          }
        } else if (!permission.conditions) {
          return true;
        }
      }
    }

    return false;
  }

  async hasRole(userId: string, roleName: string): Promise<boolean> {
    const userRoles = await this.usersService.getUserRoles(userId);
    return userRoles.some(role => role.name === roleName);
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    await this.usersService.assignUserRole(userId, roleId);
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    await this.usersService.removeUserRole(userId, roleId);
  }

  async createRole(
    name: string,
    description: string,
    permissionIds: string[],
    parentRoleId?: string
  ): Promise<Role> {
    return this.usersService.createRole({
      name,
      description,
      permissionIds,
      parentRoleId,
      isSystemRole: false,
    });
  }

  async updateRole(
    roleId: string,
    updates: Partial<{
      name: string;
      description: string;
      permissionIds: string[];
      parentRoleId: string;
    }>
  ): Promise<Role> {
    return this.usersService.updateRole(roleId, updates);
  }

  async deleteRole(roleId: string): Promise<void> {
    const role = await this.usersService.findRoleById(roleId);
    if (role?.isSystemRole) {
      throw new Error('Cannot delete system role');
    }

    await this.usersService.deleteRole(roleId);
  }

  async getRoleHierarchy(companyId: string): Promise<RoleHierarchy[]> {
    const roles = await this.usersService.getCompanyRoles(companyId);
    const roleMap = new Map<string, Role>();
    const rootRoles: RoleHierarchy[] = [];

    // Build role map
    for (const role of roles) {
      roleMap.set(role.id, role);
    }

    // Build hierarchy
    for (const role of roles) {
      if (!role.parentRoleId) {
        rootRoles.push(this.buildRoleHierarchy(role, roleMap));
      }
    }

    return rootRoles;
  }

  private buildRoleHierarchy(
    role: Role,
    roleMap: Map<string, Role>
  ): RoleHierarchy {
    const children: RoleHierarchy[] = [];

    for (const [, childRole] of roleMap) {
      if (childRole.parentRoleId === role.id) {
        children.push(this.buildRoleHierarchy(childRole, roleMap));
      }
    }

    return { role, children };
  }

  private evaluateConditions(
    conditions: Record<string, any>,
    context: Record<string, any>
  ): boolean {
    for (const [key, expectedValue] of Object.entries(conditions)) {
      const contextValue = context[key];

      if (Array.isArray(expectedValue)) {
        if (!expectedValue.includes(contextValue)) {
          return false;
        }
      } else if (contextValue !== expectedValue) {
        return false;
      }
    }

    return true;
  }

  // Predefined system permissions
  static readonly SYSTEM_PERMISSIONS = {
    // User Management
    USER_CREATE: { resource: 'user', action: 'create' },
    USER_READ: { resource: 'user', action: 'read' },
    USER_UPDATE: { resource: 'user', action: 'update' },
    USER_DELETE: { resource: 'user', action: 'delete' },

    // Company Management
    COMPANY_CREATE: { resource: 'company', action: 'create' },
    COMPANY_READ: { resource: 'company', action: 'read' },
    COMPANY_UPDATE: { resource: 'company', action: 'update' },
    COMPANY_DELETE: { resource: 'company', action: 'delete' },

    // Financial
    ACCOUNT_CREATE: { resource: 'account', action: 'create' },
    ACCOUNT_READ: { resource: 'account', action: 'read' },
    ACCOUNT_UPDATE: { resource: 'account', action: 'update' },
    ACCOUNT_DELETE: { resource: 'account', action: 'delete' },

    JOURNAL_ENTRY_CREATE: { resource: 'journal_entry', action: 'create' },
    JOURNAL_ENTRY_READ: { resource: 'journal_entry', action: 'read' },
    JOURNAL_ENTRY_UPDATE: { resource: 'journal_entry', action: 'update' },
    JOURNAL_ENTRY_DELETE: { resource: 'journal_entry', action: 'delete' },
    JOURNAL_ENTRY_POST: { resource: 'journal_entry', action: 'post' },

    // Sales
    CUSTOMER_CREATE: { resource: 'customer', action: 'create' },
    CUSTOMER_READ: { resource: 'customer', action: 'read' },
    CUSTOMER_UPDATE: { resource: 'customer', action: 'update' },
    CUSTOMER_DELETE: { resource: 'customer', action: 'delete' },

    SALES_ORDER_CREATE: { resource: 'sales_order', action: 'create' },
    SALES_ORDER_READ: { resource: 'sales_order', action: 'read' },
    SALES_ORDER_UPDATE: { resource: 'sales_order', action: 'update' },
    SALES_ORDER_DELETE: { resource: 'sales_order', action: 'delete' },
    SALES_ORDER_APPROVE: { resource: 'sales_order', action: 'approve' },

    // Inventory
    ITEM_CREATE: { resource: 'item', action: 'create' },
    ITEM_READ: { resource: 'item', action: 'read' },
    ITEM_UPDATE: { resource: 'item', action: 'update' },
    ITEM_DELETE: { resource: 'item', action: 'delete' },

    STOCK_ENTRY_CREATE: { resource: 'stock_entry', action: 'create' },
    STOCK_ENTRY_READ: { resource: 'stock_entry', action: 'read' },
    STOCK_ENTRY_UPDATE: { resource: 'stock_entry', action: 'update' },
    STOCK_ENTRY_DELETE: { resource: 'stock_entry', action: 'delete' },
    STOCK_ENTRY_SUBMIT: { resource: 'stock_entry', action: 'submit' },

    // Reports
    FINANCIAL_REPORTS_READ: { resource: 'financial_reports', action: 'read' },
    SALES_REPORTS_READ: { resource: 'sales_reports', action: 'read' },
    INVENTORY_REPORTS_READ: { resource: 'inventory_reports', action: 'read' },

    // System Administration
    SYSTEM_SETTINGS_READ: { resource: 'system_settings', action: 'read' },
    SYSTEM_SETTINGS_UPDATE: { resource: 'system_settings', action: 'update' },
    ROLE_MANAGEMENT: { resource: 'roles', action: 'manage' },
    PERMISSION_MANAGEMENT: { resource: 'permissions', action: 'manage' },
  };
}
