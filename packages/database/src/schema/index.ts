// Export all schema tables and relations
export * from './companies';
export * from './users';
export * from './accounts';
export * from './customers';
export * from './vendors';
export * from './items';
export * from './warehouses';

// Export types for better TypeScript support
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { 
  companies, 
  users, 
  roles, 
  userRoles, 
  userSessions, 
  oauthAccounts,
  accounts,
  journalEntries,
  glEntries,
  customers,
  customerContacts,
  vendors,
  vendorContacts,
  items,
  itemPrices,
  stockLevels,
  warehouses,
  warehouseLocations
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