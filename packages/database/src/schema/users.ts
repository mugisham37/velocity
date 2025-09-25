import { pgTable, uuid, varchar, timestamp, boolean, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { companies } from './companies';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  avatar: text('avatar'),
  isActive: boolean('is_active').default(true).notNull(),
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  mfaEnabled: boolean('mfa_enabled').default(false).notNull(),
  mfaSecret: varchar('mfa_secret', { length: 32 }),
  lastLoginAt: timestamp('last_login_at'),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  roles: many(userRoles),
  sessions: many(userSessions),
  oauthAccounts: many(oauthAccounts),
}));

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  permissions: text('permissions').array(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const rolesRelations = relations(roles, ({ one, many }) => ({
  company: one(companies, {
    fields: [roles.companyId],
    references: [companies.id],
  }),
  users: many(userRoles),
}));

export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  roleId: uuid('role_id').references(() => roles.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  refreshToken: varchar('refresh_token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  refreshExpiresAt: timestamp('refresh_expires_at').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

export const oauthAccounts = pgTable('oauth_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  tokenType: varchar('token_type', { length: 50 }),
  scope: text('scope'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, {
    fields: [oauthAccounts.userId],
    references: [users.id],
  }),
}));