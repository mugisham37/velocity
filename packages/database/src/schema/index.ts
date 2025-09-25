// Export all schema tables and relations
export * from './accounts';
export * from './accounts-payable';
export * from './accounts-receivable';
export * from './audit';
export * from './banking';
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
  billLineItems,
  expenseItems,
  expenseReports,
  threeWayMatching,
  vendorBills,
  vendorPaymentAllocations,
  vendorPayments,
} from './accounts-payable';
import {
  customerCreditLimits,
  customerPayments,
  dunningRecords,
  invoiceLineItems,
  invoices,
  paymentAllocations,
} from './accounts-receivable';
import {
  bankAccounts,
  bankReconciliations,
  bankTransactions,
  bankTransfers,
  cashFlowForecasts,
  onlinePayments,
  paymentGateways,
} from './banking';
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

// Accounts Receivable types
export type Invoice = InferSelectModel<typeof invoices>;
export type NewInvoice = InferInsertModel<typeof invoices>;
export type InvoiceLineItem = InferSelectModel<typeof invoiceLineItems>;
export type NewInvoiceLineItem = InferInsertModel<typeof invoiceLineItems>;
export type CustomerPayment = InferSelectModel<typeof customerPayments>;
export type NewCustomerPayment = InferInsertModel<typeof customerPayments>;
export type PaymentAllocation = InferSelectModel<typeof paymentAllocations>;
export type NewPaymentAllocation = InferInsertModel<typeof paymentAllocations>;
export type CustomerCreditLimit = InferSelectModel<typeof customerCreditLimits>;
export type NewCustomerCreditLimit = InferInsertModel<
  typeof customerCreditLimits
>;
export type DunningRecord = InferSelectModel<typeof dunningRecords>;
export type NewDunningRecord = InferInsertModel<typeof dunningRecords>;
// Accounts Payable types
export type VendorBill = InferSelectModel<typeof vendorBills>;
export type NewVendorBill = InferInsertModel<typeof vendorBills>;
export type BillLineItem = InferSelectModel<typeof billLineItems>;
export type NewBillLineItem = InferInsertModel<typeof billLineItems>;
export type VendorPayment = InferSelectModel<typeof vendorPayments>;
export type NewVendorPayment = InferInsertModel<typeof vendorPayments>;
export type VendorPaymentAllocation = InferSelectModel<
  typeof vendorPaymentAllocations
>;
export type NewVendorPaymentAllocation = InferInsertModel<
  typeof vendorPaymentAllocations
>;
export type ThreeWayMatching = InferSelectModel<typeof threeWayMatching>;
export type NewThreeWayMatching = InferInsertModel<typeof threeWayMatching>;
export type ExpenseReport = InferSelectModel<typeof expenseReports>;
export type NewExpenseReport = InferInsertModel<typeof expenseReports>;
export type ExpenseItem = InferSelectModel<typeof expenseItems>;
export type NewExpenseItem = InferInsertModel<typeof expenseItems>;
// Banking types
export type BankAccount = InferSelectModel<typeof bankAccounts>;
export type NewBankAccount = InferInsertModel<typeof bankAccounts>;
export type BankTransaction = InferSelectModel<typeof bankTransactions>;
export type NewBankTransaction = InferInsertModel<typeof bankTransactions>;
export type BankReconciliation = InferSelectModel<typeof bankReconciliations>;
export type NewBankReconciliation = InferInsertModel<
  typeof bankReconciliations
>;
export type CashFlowForecast = InferSelectModel<typeof cashFlowForecasts>;
export type NewCashFlowForecast = InferInsertModel<typeof cashFlowForecasts>;
export type PaymentGateway = InferSelectModel<typeof paymentGateways>;
export type NewPaymentGateway = InferInsertModel<typeof paymentGateways>;
export type OnlinePayment = InferSelectModel<typeof onlinePayments>;
export type NewOnlinePayment = InferInsertModel<typeof onlinePayments>;
export type BankTransfer = InferSelectModel<typeof bankTransfers>;
export type NewBankTransfer = InferInsertModel<typeof bankTransfers>;
