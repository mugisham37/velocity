import { pgTable, uuid, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { companies } from './companies';
import { roles } from './users';

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  description: text('description'),
  conditions: text('conditions'), // JSON string for conditions
  isSystemPermission: boolean('is_system_permission').default(false).notNull(),
  companyId: uuid('company_id').references(() => companies.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id').references(() => roles.id).notNull(),
  permissionId: uuid('permission_id').references(() => permissions.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const permissionsRelations = relations(permissions, ({ one, many }) => ({
  company: one(companies, {
    fields: [permissions.companyId],
    references: [companies.id],
  }),
  roles: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));
