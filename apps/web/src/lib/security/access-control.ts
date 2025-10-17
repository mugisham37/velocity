// Role-based access control system

export interface Permission {
  read: boolean;
  write: boolean;
  create: boolean;
  delete: boolean;
  submit: boolean;
  cancel: boolean;
  amend: boolean;
  print: boolean;
  email: boolean;
  report: boolean;
  import: boolean;
  export: boolean;
  share: boolean;
}

export interface Role {
  name: string;
  permissions: Record<string, Permission>;
  inherits?: string[]; // Roles this role inherits from
  isSystemRole?: boolean;
}

export interface User {
  name: string;
  email: string;
  roles: string[];
  permissions?: Record<string, Permission>; // User-specific permissions
}

export interface FieldPermission {
  fieldname: string;
  read: boolean;
  write: boolean;
  hidden?: boolean;
  mandatory?: boolean;
}

export interface DocumentPermission extends Permission {
  owner?: string;
  shared_with?: Array<{
    user: string;
    permissions: Partial<Permission>;
  }>;
  if_owner?: Partial<Permission>;
}

/**
 * Access Control Manager
 */
export class AccessControlManager {
  private roles: Map<string, Role> = new Map();
  private users: Map<string, User> = new Map();
  private documentPermissions: Map<string, Map<string, DocumentPermission>> = new Map();
  private fieldPermissions: Map<string, Map<string, FieldPermission[]>> = new Map();

  /**
   * Register a role
   */
  registerRole(role: Role): void {
    this.roles.set(role.name, role);
  }

  /**
   * Register a user
   */
  registerUser(user: User): void {
    this.users.set(user.name, user);
  }

  /**
   * Get user's effective permissions for a doctype
   */
  getUserPermissions(username: string, doctype: string): Permission {
    const user = this.users.get(username);
    if (!user) {
      return this.getDefaultPermission(false);
    }

    // Start with no permissions
    const effectivePermissions: Permission = this.getDefaultPermission(false);

    // Collect permissions from all user roles
    for (const roleName of user.roles) {
      const rolePermissions = this.getRolePermissions(roleName, doctype);
      this.mergePermissions(effectivePermissions, rolePermissions);
    }

    // Apply user-specific permissions (override role permissions)
    if (user.permissions && user.permissions[doctype]) {
      this.mergePermissions(effectivePermissions, user.permissions[doctype]);
    }

    return effectivePermissions;
  }

  /**
   * Get role permissions for a doctype
   */
  getRolePermissions(roleName: string, doctype: string): Permission {
    const role = this.roles.get(roleName);
    if (!role) {
      return this.getDefaultPermission(false);
    }

    let permissions = role.permissions[doctype] || this.getDefaultPermission(false);

    // Apply inherited permissions
    if (role.inherits) {
      for (const inheritedRoleName of role.inherits) {
        const inheritedPermissions = this.getRolePermissions(inheritedRoleName, doctype);
        permissions = this.mergePermissions({ ...permissions }, inheritedPermissions);
      }
    }

    return permissions;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(
    username: string,
    doctype: string,
    permission: keyof Permission,
    docname?: string
  ): boolean {
    // Check document-level permissions first
    if (docname) {
      const docPermission = this.getDocumentPermission(doctype, docname);
      if (docPermission) {
        // Check if user is owner
        if (docPermission.owner === username && docPermission.if_owner?.[permission]) {
          return true;
        }

        // Check if document is shared with user
        const sharedPermission = docPermission.shared_with?.find(share => share.user === username);
        if (sharedPermission && sharedPermission.permissions[permission]) {
          return true;
        }

        // Use document-specific permission if available
        if (docPermission[permission] !== undefined) {
          return docPermission[permission];
        }
      }
    }

    // Fall back to user's general permissions
    const userPermissions = this.getUserPermissions(username, doctype);
    return userPermissions[permission];
  }

  /**
   * Check field-level permissions
   */
  hasFieldPermission(
    username: string,
    doctype: string,
    fieldname: string,
    permission: 'read' | 'write'
  ): boolean {
    const fieldPerms = this.getFieldPermissions(doctype, fieldname);
    
    for (const fieldPerm of fieldPerms) {
      if (fieldPerm.fieldname === fieldname) {
        return fieldPerm[permission];
      }
    }

    // Fall back to document-level permissions
    return this.hasPermission(username, doctype, permission);
  }

  /**
   * Get field permissions for a doctype
   */
  getFieldPermissions(doctype: string, fieldname: string): FieldPermission[] {
    const doctypeFields = this.fieldPermissions.get(doctype);
    if (!doctypeFields) {
      return [];
    }

    return doctypeFields.get(fieldname) || [];
  }

  /**
   * Set field permissions
   */
  setFieldPermissions(doctype: string, fieldname: string, permissions: FieldPermission[]): void {
    if (!this.fieldPermissions.has(doctype)) {
      this.fieldPermissions.set(doctype, new Map());
    }

    const doctypeFields = this.fieldPermissions.get(doctype)!;
    doctypeFields.set(fieldname, permissions);
  }

  /**
   * Get document-specific permissions
   */
  getDocumentPermission(doctype: string, docname: string): DocumentPermission | null {
    const doctypePerms = this.documentPermissions.get(doctype);
    if (!doctypePerms) {
      return null;
    }

    return doctypePerms.get(docname) || null;
  }

  /**
   * Set document-specific permissions
   */
  setDocumentPermission(doctype: string, docname: string, permission: DocumentPermission): void {
    if (!this.documentPermissions.has(doctype)) {
      this.documentPermissions.set(doctype, new Map());
    }

    const doctypePerms = this.documentPermissions.get(doctype)!;
    doctypePerms.set(docname, permission);
  }

  /**
   * Share document with user
   */
  shareDocument(
    doctype: string,
    docname: string,
    shareWith: string,
    permissions: Partial<Permission>
  ): void {
    let docPermission = this.getDocumentPermission(doctype, docname);
    
    if (!docPermission) {
      docPermission = {
        ...this.getDefaultPermission(false),
        shared_with: [],
      };
    }

    if (!docPermission.shared_with) {
      docPermission.shared_with = [];
    }

    // Remove existing share for this user
    docPermission.shared_with = docPermission.shared_with.filter(
      share => share.user !== shareWith
    );

    // Add new share
    docPermission.shared_with.push({
      user: shareWith,
      permissions,
    });

    this.setDocumentPermission(doctype, docname, docPermission);
  }

  /**
   * Remove document share
   */
  unshareDocument(doctype: string, docname: string, user: string): void {
    const docPermission = this.getDocumentPermission(doctype, docname);
    
    if (docPermission && docPermission.shared_with) {
      docPermission.shared_with = docPermission.shared_with.filter(
        share => share.user !== user
      );
      
      this.setDocumentPermission(doctype, docname, docPermission);
    }
  }

  /**
   * Get users who have access to a document
   */
  getDocumentUsers(doctype: string, docname: string): Array<{
    user: string;
    permissions: Permission;
    source: 'owner' | 'shared' | 'role';
  }> {
    const users: Array<{
      user: string;
      permissions: Permission;
      source: 'owner' | 'shared' | 'role';
    }> = [];

    const docPermission = this.getDocumentPermission(doctype, docname);

    // Add owner
    if (docPermission?.owner) {
      const ownerPermissions = docPermission.if_owner || this.getDefaultPermission(true);
      users.push({
        user: docPermission.owner,
        permissions: ownerPermissions,
        source: 'owner',
      });
    }

    // Add shared users
    if (docPermission?.shared_with) {
      for (const share of docPermission.shared_with) {
        users.push({
          user: share.user,
          permissions: { ...this.getDefaultPermission(false), ...share.permissions },
          source: 'shared',
        });
      }
    }

    // Add users with role-based access
    for (const [username, user] of this.users.entries()) {
      const rolePermissions = this.getUserPermissions(username, doctype);
      const hasAnyPermission = Object.values(rolePermissions).some(perm => perm);
      
      if (hasAnyPermission && !users.find(u => u.user === username)) {
        users.push({
          user: username,
          permissions: rolePermissions,
          source: 'role',
        });
      }
    }

    return users;
  }

  /**
   * Filter documents based on user permissions
   */
  filterDocuments<T extends { name: string; owner?: string }>(
    username: string,
    doctype: string,
    documents: T[],
    permission: keyof Permission = 'read'
  ): T[] {
    return documents.filter(doc => 
      this.hasPermission(username, doctype, permission, doc.name)
    );
  }

  /**
   * Filter fields based on user permissions
   */
  filterFields(
    username: string,
    doctype: string,
    fields: Array<{ fieldname: string; [key: string]: unknown }>,
    permission: 'read' | 'write' = 'read'
  ): Array<{ fieldname: string; [key: string]: unknown }> {
    return fields.filter(field => 
      this.hasFieldPermission(username, doctype, field.fieldname, permission)
    );
  }

  /**
   * Get default permission object
   */
  private getDefaultPermission(allTrue: boolean = false): Permission {
    return {
      read: allTrue,
      write: allTrue,
      create: allTrue,
      delete: allTrue,
      submit: allTrue,
      cancel: allTrue,
      amend: allTrue,
      print: allTrue,
      email: allTrue,
      report: allTrue,
      import: allTrue,
      export: allTrue,
      share: allTrue,
    };
  }

  /**
   * Merge permissions (OR operation)
   */
  private mergePermissions(target: Permission, source: Permission): Permission {
    for (const key of Object.keys(target) as Array<keyof Permission>) {
      target[key] = target[key] || source[key];
    }
    return target;
  }

  /**
   * Initialize with default ERPNext roles
   */
  initializeDefaultRoles(): void {
    // System Manager - full access
    this.registerRole({
      name: 'System Manager',
      isSystemRole: true,
      permissions: {
        '*': this.getDefaultPermission(true), // All permissions for all doctypes
      },
    });

    // Administrator - full access
    this.registerRole({
      name: 'Administrator',
      isSystemRole: true,
      permissions: {
        '*': this.getDefaultPermission(true),
      },
    });

    // Sales User
    this.registerRole({
      name: 'Sales User',
      permissions: {
        'Customer': { ...this.getDefaultPermission(false), read: true, write: true, create: true },
        'Sales Order': { ...this.getDefaultPermission(false), read: true, write: true, create: true, submit: true },
        'Quotation': { ...this.getDefaultPermission(false), read: true, write: true, create: true, submit: true },
        'Item': { ...this.getDefaultPermission(false), read: true },
      },
    });

    // Purchase User
    this.registerRole({
      name: 'Purchase User',
      permissions: {
        'Supplier': { ...this.getDefaultPermission(false), read: true, write: true, create: true },
        'Purchase Order': { ...this.getDefaultPermission(false), read: true, write: true, create: true, submit: true },
        'Purchase Receipt': { ...this.getDefaultPermission(false), read: true, write: true, create: true, submit: true },
        'Item': { ...this.getDefaultPermission(false), read: true },
      },
    });

    // Stock User
    this.registerRole({
      name: 'Stock User',
      permissions: {
        'Item': { ...this.getDefaultPermission(false), read: true, write: true, create: true },
        'Stock Entry': { ...this.getDefaultPermission(false), read: true, write: true, create: true, submit: true },
        'Material Request': { ...this.getDefaultPermission(false), read: true, write: true, create: true, submit: true },
      },
    });

    // Accounts User
    this.registerRole({
      name: 'Accounts User',
      permissions: {
        'Journal Entry': { ...this.getDefaultPermission(false), read: true, write: true, create: true, submit: true },
        'Payment Entry': { ...this.getDefaultPermission(false), read: true, write: true, create: true, submit: true },
        'Sales Invoice': { ...this.getDefaultPermission(false), read: true, write: true, create: true, submit: true },
        'Purchase Invoice': { ...this.getDefaultPermission(false), read: true, write: true, create: true, submit: true },
      },
    });

    // Guest - read-only access to public documents
    this.registerRole({
      name: 'Guest',
      permissions: {
        'Item': { ...this.getDefaultPermission(false), read: true },
      },
    });
  }
}

// Create singleton instance
export const accessControlManager = new AccessControlManager();

// Initialize with default roles
accessControlManager.initializeDefaultRoles();

/**
 * React hook for checking permissions
 */
export function usePermissions(username: string) {
  return {
    hasPermission: (doctype: string, permission: keyof Permission, docname?: string) =>
      accessControlManager.hasPermission(username, doctype, permission, docname),
    
    hasFieldPermission: (doctype: string, fieldname: string, permission: 'read' | 'write') =>
      accessControlManager.hasFieldPermission(username, doctype, fieldname, permission),
    
    getUserPermissions: (doctype: string) =>
      accessControlManager.getUserPermissions(username, doctype),
    
    filterDocuments: <T extends { name: string; owner?: string }>(
      doctype: string,
      documents: T[],
      permission: keyof Permission = 'read'
    ) => accessControlManager.filterDocuments(username, doctype, documents, permission),
    
    filterFields: (
      doctype: string,
      fields: Array<{ fieldname: string; [key: string]: unknown }>,
      permission: 'read' | 'write' = 'read'
    ) => accessControlManager.filterFields(username, doctype, fields, permission),
  };
}

/**
 * Permission-based component wrapper
 */
export interface PermissionWrapperProps {
  children: React.ReactNode;
  username: string;
  doctype: string;
  permission: keyof Permission;
  docname?: string;
  fallback?: React.ReactNode;
}

export function PermissionWrapper({
  children,
  username,
  doctype,
  permission,
  docname,
  fallback = null,
}: PermissionWrapperProps) {
  const hasAccess = accessControlManager.hasPermission(username, doctype, permission, docname);
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Field permission wrapper
 */
export interface FieldPermissionWrapperProps {
  children: React.ReactNode;
  username: string;
  doctype: string;
  fieldname: string;
  permission: 'read' | 'write';
  fallback?: React.ReactNode;
}

export function FieldPermissionWrapper({
  children,
  username,
  doctype,
  fieldname,
  permission,
  fallback = null,
}: FieldPermissionWrapperProps) {
  const hasAccess = accessControlManager.hasFieldPermission(username, doctype, fieldname, permission);
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}