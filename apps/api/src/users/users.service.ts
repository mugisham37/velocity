import { Injectable } from '@nestjs/common';
import {
  db,
  eq,
  and,
  type User,
  type Role,
  type Permission,
  type UserSession,
  users,
  roles,
  permissions,
  userRoles,
  rolePermissions,
  userSessions,
} from '@kiro/database';

interface RoleWithPermissions extends Role {
  permissions: Array<Permission & { conditions?: Record<string, any> | null }>;
}

@Injectable()
export class UsersService {
  async findByEmail(email: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result[0] || null;
  }

  async findById(id: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return result[0] || null;
  }

  async getUserRoles(userId: string): Promise<RoleWithPermissions[]> {
    const userRoleResults = await db
      .select({
        role: roles,
        permission: permissions,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, userId));

    // Group permissions by role
    const roleMap = new Map<string, RoleWithPermissions>();

    for (const result of userRoleResults) {
      const role = result.role;
      const permission = result.permission;

      if (!roleMap.has(role.id)) {
        roleMap.set(role.id, {
          ...role,
          permissions: [],
        });
      }

      if (permission) {
        roleMap.get(role.id)!.permissions.push({
          ...permission,
          conditions: permission.conditions
            ? JSON.parse(permission.conditions)
            : null,
        });
      }
    }

    return Array.from(roleMap.values());
  }

  async createSession(
    userId: string,
    accessToken: string,
    refreshToken: string
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(userSessions).values({
      userId,
      token: accessToken,
      refreshToken,
      expiresAt,
      refreshExpiresAt,
      isActive: true,
    });
  }

  async findSessionByRefreshToken(
    refreshToken: string
  ): Promise<UserSession | null> {
    const result = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.refreshToken, refreshToken),
          eq(userSessions.isActive, true)
        )
      )
      .limit(1);

    return result[0] || null;
  }

  async revokeSession(accessToken: string): Promise<void> {
    await db
      .update(userSessions)
      .set({ isActive: false })
      .where(eq(userSessions.token, accessToken));
  }

  async storeMfaSecret(
    userId: string,
    secret: string,
    backupCodes: string[]
  ): Promise<void> {
    await db
      .update(users)
      .set({
        mfaSecret: secret,
        mfaBackupCodes: JSON.stringify(backupCodes),
      })
      .where(eq(users.id, userId));
  }

  async enableMfa(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ mfaEnabled: true })
      .where(eq(users.id, userId));
  }

  async disableMfa(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null,
      })
      .where(eq(users.id, userId));
  }

  async updateBackupCodes(
    userId: string,
    backupCodes: string[]
  ): Promise<void> {
    await db
      .update(users)
      .set({ mfaBackupCodes: JSON.stringify(backupCodes) })
      .where(eq(users.id, userId));
  }

  async findRoleById(roleId: string): Promise<Role | null> {
    const result = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    return (result[0] as Role) || null;
  }

  async getRolePermissions(
    roleId: string
  ): Promise<Array<Permission & { conditions?: Record<string, any> | null }>> {
    const result = await db
      .select({ permission: permissions })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));

    return result.map(r => ({
      ...r.permission,
      conditions: r.permission.conditions
        ? JSON.parse(r.permission.conditions)
        : null,
    }));
  }

  async assignUserRole(userId: string, roleId: string): Promise<void> {
    // Check if assignment already exists
    const existing = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(userRoles).values({
        userId,
        roleId,
      });
    }
  }

  async removeUserRole(userId: string, roleId: string): Promise<void> {
    await db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
  }

  async createRole(roleData: {
    name: string;
    description: string;
    permissionIds: string[];
    parentRoleId?: string | undefined;
    isSystemRole: boolean;
  }): Promise<RoleWithPermissions> {
    // Get user's company ID (this would typically come from context)
    // For now, we'll need to pass it or get it from the first user
    const firstUser = await db.select().from(users).limit(1);
    const companyId = firstUser[0]?.companyId;

    if (!companyId) {
      throw new Error('No company found');
    }

    const [newRole] = await db
      .insert(roles)
      .values({
        name: roleData.name,
        description: roleData.description,
        parentRoleId: roleData.parentRoleId,
        isSystemRole: roleData.isSystemRole,
        companyId,
      })
      .returning();

    if (!newRole) {
      throw new Error('Failed to create role');
    }

    // Assign permissions to the role
    if (roleData.permissionIds.length > 0) {
      const rolePermissionValues = roleData.permissionIds.map(permissionId => ({
        roleId: (newRole as any).id,
        permissionId,
      }));

      await db.insert(rolePermissions).values(rolePermissionValues);
    }

    // Fetch the role with permissions
    const roleWithPermissions = await this.getRoleWithPermissions(
      (newRole as any).id
    );
    if (!roleWithPermissions) {
      throw new Error('Failed to fetch created role');
    }
    return roleWithPermissions;
  }

  async updateRole(
    roleId: string,
    updates: Partial<{
      name: string;
      description: string;
      permissionIds: string[];
      parentRoleId: string | undefined;
    }>
  ): Promise<RoleWithPermissions> {
    // Update role basic info
    const roleUpdates: any = {};
    if (updates.name) roleUpdates.name = updates.name;
    if (updates.description !== undefined)
      roleUpdates.description = updates.description;
    if (updates.parentRoleId !== undefined)
      roleUpdates.parentRoleId = updates.parentRoleId;

    if (Object.keys(roleUpdates).length > 0) {
      await db.update(roles).set(roleUpdates).where(eq(roles.id, roleId));
    }

    // Update permissions if provided
    if (updates.permissionIds) {
      // Remove existing permissions
      await db
        .delete(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId));

      // Add new permissions
      if (updates.permissionIds.length > 0) {
        const rolePermissionValues = updates.permissionIds.map(
          permissionId => ({
            roleId,
            permissionId,
          })
        );

        await db.insert(rolePermissions).values(rolePermissionValues);
      }
    }

    // Return updated role with permissions
    const roleWithPermissions = await this.getRoleWithPermissions(roleId);
    return roleWithPermissions!;
  }

  async deleteRole(roleId: string): Promise<void> {
    // Remove role permissions first
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

    // Remove user role assignments
    await db.delete(userRoles).where(eq(userRoles.roleId, roleId));

    // Delete the role
    await db.delete(roles).where(eq(roles.id, roleId));
  }

  async getCompanyRoles(companyId: string): Promise<RoleWithPermissions[]> {
    const roleResults = await db
      .select({
        role: roles,
        permission: permissions,
      })
      .from(roles)
      .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(roles.companyId, companyId));

    // Group permissions by role
    const roleMap = new Map<string, RoleWithPermissions>();

    for (const result of roleResults) {
      const role = result.role;
      const permission = result.permission;

      if (!roleMap.has(role.id)) {
        roleMap.set(role.id, {
          ...role,
          permissions: [],
        });
      }

      if (permission) {
        roleMap.get(role.id)!.permissions.push({
          ...permission,
          conditions: permission.conditions
            ? JSON.parse(permission.conditions)
            : null,
        });
      }
    }

    return Array.from(roleMap.values());
  }

  private async getRoleWithPermissions(
    roleId: string
  ): Promise<RoleWithPermissions | null> {
    const roleResults = await db
      .select({
        role: roles,
        permission: permissions,
      })
      .from(roles)
      .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(roles.id, roleId));

    if (roleResults.length === 0) {
      return null;
    }

    const role = roleResults[0]!.role;
    const permissionsList = roleResults
      .map(r => r.permission)
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .map(p => ({
        ...p,
        conditions: p.conditions ? JSON.parse(p.conditions) : null,
      }));

    return {
      ...role,
      permissions: permissionsList,
    };
  }
}
