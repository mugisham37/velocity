import { db, permissions } from '@kiro/database';

export const SYSTEM_PERMISSIONS = [
  // User Management
  { name: 'Create User', resource: 'user', action: 'create' },
  { name: 'Read User', resource: 'user', action: 'read' },
  { name: 'Update User', resource: 'user', action: 'update' },
  { name: 'Delete User', resource: 'user', action: 'delete' },

  // Company Management
  { name: 'Create Company', resource: 'company', action: 'create' },
  { name: 'Read Company', resource: 'company', action: 'read' },
  { name: 'Update Company', resource: 'company', action: 'update' },
  { name: 'Delete Company', resource: 'company', action: 'delete' },

  // Financial
  { name: 'Create Account', resource: 'account', action: 'create' },
  { name: 'Read Account', resource: 'account', action: 'read' },
  { name: 'Update Account', resource: 'account', action: 'update' },
  { name: 'Delete Account', resource: 'account', action: 'delete' },

  { name: 'Create Journal Entry', resource: 'journal_entry', action: 'create' },
  { name: 'Read Journal Entry', resource: 'journal_entry', action: 'read' },
  { name: 'Update Journal Entry', resource: 'journal_entry', action: 'update' },
  { name: 'Delete Journal Entry', resource: 'journal_entry', action: 'delete' },
  { name: 'Post Journal Entry', resource: 'journal_entry', action: 'post' },

  // Sales
  { name: 'Create Customer', resource: 'customer', action: 'create' },
  { name: 'Read Customer', resource: 'customer', action: 'read' },
  { name: 'Update Customer', resource: 'customer', action: 'update' },
  { name: 'Delete Customer', resource: 'customer', action: 'delete' },

  { name: 'Create Sales Order', resource: 'sales_order', action: 'create' },
  { name: 'Read Sales Order', resource: 'sales_order', action: 'read' },
  { name: 'Update Sales Order', resource: 'sales_order', action: 'update' },
  { name: 'Delete Sales Order', resource: 'sales_order', action: 'delete' },
  { name: 'Approve Sales Order', resource: 'sales_order', action: 'approve' },

  // Inventory
  { name: 'Create Item', resource: 'item', action: 'create' },
  { name: 'Read Item', resource: 'item', action: 'read' },
  { name: 'Update Item', resource: 'item', action: 'update' },
  { name: 'Delete Item', resource: 'item', action: 'delete' },

  { name: 'Create Stock Entry', resource: 'stock_entry', action: 'create' },
  { name: 'Read Stock Entry', resource: 'stock_entry', action: 'read' },
  { name: 'Update Stock Entry', resource: 'stock_entry', action: 'update' },
  { name: 'Delete Stock Entry', resource: 'stock_entry', action: 'delete' },
  { name: 'Submit Stock Entry', resource: 'stock_entry', action: 'submit' },

  // Reports
  { name: 'Read Financial Reports', resource: 'financial_reports', action: 'read' },
  { name: 'Read Sales Reports', resource: 'sales_reports', action: 'read' },
  { name: 'Read Inventory Reports', resource: 'inventory_reports', action: 'read' },

  // System Administration
  { name: 'Read System Settings', resource: 'system_settings', action: 'read' },
  { name: 'Update System Settings', resource: 'system_settings', action: 'update' },
  { name: 'Manage Roles', resource: 'roles', action: 'manage' },
  { name: 'Manage Permissions', resource: 'permissions', action: 'manage' },
];

export async function seedSystemPermissions(): Promise<void> {
  try {
    for (const permission of SYSTEM_PERMISSIONS) {
      await db.insert(permissions).values({
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
        description: `${permission.action} permission for ${permission.resource}`,
        isSystemPermission: true,
        companyId: null, // System permissions are global
      }).onConflictDoNothing();
    }
    
    console.log('System permissions seeded successfully');
  } catch (error) {
    console.error('Error seeding system permissions:', error);
    throw error;
  }
}