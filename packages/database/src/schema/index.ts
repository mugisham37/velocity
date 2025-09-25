// Export all schema tables and relations
export * from './accounts';
export * from './audit';
export * from './companies';
export * from './customers';
export * from './items';
export * from './notifications';
export * from './users';
export * from './vendors';
export * from './warehouses';

// Export types for better TypeScript support
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  accounts,
  companies,
  customerContacts,
  customers,
  glEntries,
  itemPrices,
  items,
  journalEntries,
  oauthAccounts,
  roles,
  stockLevels,
  userRoles,
  userSessions,
  users,
  vendorContacts,
  vendors,
  warehouseLocations,
  warehouses,
} from './index';

// Company types
export type Company = InferSelectModel<typeof companies>;
export type NewCompany = InferInsertModel<typeof companies>;

// User types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type Role = InferSelectModel<typeof roles>;
export type NewRole = InferInsertModel<typeof roles>;
export type UserRole = InferSelectModel<typeof userRoles>;
export type NewUserRole = InferInsertModel<typeof userRoles>;
export type UserSession = InferSelectModel<typeof userSessions>;
export type NewUserSession = InferInsertModel<typeof userSessions>;
export type OAuthAccount = InferSelectModel<typeof oauthAccounts>;
export type NewOAuthAccount = InferInsertModel<typeof oauthAccounts>;

// Account types
export type Account = InferSelectModel<typeof accounts>;
export type NewAccount = InferInsertModel<typeof accounts>;
export type JournalEntry = InferSelectModel<typeof journalEntries>;
export type NewJournalEntry = InferInsertModel<typeof journalEntries>;
export type GLEntry = InferSelectModel<typeof glEntries>;
export type NewGLEntry = InferInsertModel<typeof glEntries>;

// Customer types
export type Customer = InferSelectModel<typeof customers>;
export type NewCustomer = InferInsertModel<typeof customers>;
export type CustomerContact = InferSelectModel<typeof customerContacts>;
export type NewCustomerContact = InferInsertModel<typeof customerContacts>;

// Vendor types
export type Vendor = InferSelectModel<typeof vendors>;
export type NewVendor = InferInsertModel<typeof vendors>;
export type VendorContact = InferSelectModel<typeof vendorContacts>;
export type NewVendorContact = InferInsertModel<typeof vendorContacts>;

// Item types
export type Item = InferSelectModel<typeof items>;
export type NewItem = InferInsertModel<typeof items>;
export type ItemPrice = InferSelectModel<typeof itemPrices>;
export type NewItemPrice = InferInsertModel<typeof itemPrices>;
export type StockLevel = InferSelectModel<typeof stockLevels>;
export type NewStockLevel = InferInsertModel<typeof stockLevels>;

// Warehouse types
export type Warehouse = InferSelectModel<typeof warehouses>;
export type NewWarehouse = InferInsertModel<typeof warehouses>;
export type WarehouseLocation = InferSelectModel<typeof warehouseLocations>;
export type NewWarehouseLocation = InferInsertModel<typeof warehouseLocations>;
