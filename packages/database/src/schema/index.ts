// Export all schema tables and relations
export * from './accounts';
export * from './accounts-payable';
export * from './accounts-receivable';
export * from './audit';
export * from './banking';
export * from './companies';
export * from './customers';
export * from './hr';
export * from './items';
export * from './manufacturing';
export * from './notifications';
export * from './sales-crm';
export * from './serial-batch-tracking';
export * from './stock-transactions';
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
import {
  itemAttributeValues,
  itemAttributes,
  itemCategories,
  itemCrossReferences,
  itemDocuments,
  itemLifecycle,
  itemPricingTiers,
  itemVariants,
} from './items';
import {
  stockEntries,
  stockEntryItems,
  stockLedgerEntries,
  stockReconciliationItems,
  stockReconciliations,
  stockReservations,
} from './stock-transactions';

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
export type ItemCategory = InferSelectModel<typeof itemCategories>;
export type NewItemCategory = InferInsertModel<typeof itemCategories>;
export type ItemAttribute = InferSelectModel<typeof itemAttributes>;
export type NewItemAttribute = InferInsertModel<typeof itemAttributes>;
export type ItemAttributeValue = InferSelectModel<typeof itemAttributeValues>;
export type NewItemAttributeValue = InferInsertModel<
  typeof itemAttributeValues
>;
export type ItemVariant = InferSelectModel<typeof itemVariants>;
export type NewItemVariant = InferInsertModel<typeof itemVariants>;
export type ItemCrossReference = InferSelectModel<typeof itemCrossReferences>;
export type NewItemCrossReference = InferInsertModel<
  typeof itemCrossReferences
>;
export type ItemDocument = InferSelectModel<typeof itemDocuments>;
export type NewItemDocument = InferInsertModel<typeof itemDocuments>;
export type ItemLifecycle = InferSelectModel<typeof itemLifecycle>;
export type NewItemLifecycle = InferInsertModel<typeof itemLifecycle>;
export type ItemPricingTier = InferSelectModel<typeof itemPricingTiers>;
export type NewItemPricingTier = InferInsertModel<typeof itemPricingTiers>;
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

// Stock Transaction types
export type StockEntry = InferSelectModel<typeof stockEntries>;
export type NewStockEntry = InferInsertModel<typeof stockEntries>;
export type StockEntryItem = InferSelectModel<typeof stockEntryItems>;
export type NewStockEntryItem = InferInsertModel<typeof stockEntryItems>;
export type StockLedgerEntry = InferSelectModel<typeof stockLedgerEntries>;
export type NewStockLedgerEntry = InferInsertModel<typeof stockLedgerEntries>;
export type StockReservation = InferSelectModel<typeof stockReservations>;
export type NewStockReservation = InferInsertModel<typeof stockReservations>;
export type StockReconciliation = InferSelectModel<typeof stockReconciliations>;
export type NewStockReconciliation = InferInsertModel<
  typeof stockReconciliations
>;
export type StockReconciliationItem = InferSelectModel<
  typeof stockReconciliationItems
>;
export type NewStockReconciliationItem = InferInsertModel<
  typeof stockReconciliationItems
>;

// Serial and Batch Tracking types
import {
  batchHistory,
  batchLocations,
  batchNumbers,
  complianceReports,
  productRecalls,
  qualityInspections,
  recallItems,
  serialNumberHistory,
  serialNumbers,
} from './serial-batch-tracking';

export type SerialNumber = InferSelectModel<typeof serialNumbers>;
export type NewSerialNumber = InferInsertModel<typeof serialNumbers>;
export type BatchNumber = InferSelectModel<typeof batchNumbers>;
export type NewBatchNumber = InferInsertModel<typeof batchNumbers>;
export type BatchLocation = InferSelectModel<typeof batchLocations>;
export type NewBatchLocation = InferInsertModel<typeof batchLocations>;
export type SerialNumberHistory = InferSelectModel<typeof serialNumberHistory>;
export type NewSerialNumberHistory = InferInsertModel<
  typeof serialNumberHistory
>;
export type BatchHistory = InferSelectModel<typeof batchHistory>;
export type NewBatchHistory = InferInsertModel<typeof batchHistory>;
export type ProductRecall = InferSelectModel<typeof productRecalls>;
export type NewProductRecall = InferInsertModel<typeof productRecalls>;
export type RecallItem = InferSelectModel<typeof recallItems>;
export type NewRecallItem = InferInsertModel<typeof recallItems>;
export type QualityInspection = InferSelectModel<typeof qualityInspections>;
export type NewQualityInspection = InferInsertModel<typeof qualityInspections>;
export type ComplianceReport = InferSelectModel<typeof complianceReports>;
export type NewComplianceReport = InferInsertModel<typeof complianceReports>;

// Manufacturing types
import {
  bomAlternativeItems,
  bomItems,
  bomOperations,
  bomScrapItems,
  bomUpdateLog,
  boms,
  capacityPlanResults,
  capacityPlans,
  mrpResults,
  mrpRuns,
  productionForecasts,
  productionPlanItems,
  productionPlans,
  workOrderItems,
  workOrderOperations,
  workOrderStockEntries,
  workOrderTimeLogs,
  workOrders,
  workstations,
} from './manufacturing';

export type BOM = InferSelectModel<typeof boms>;
export type NewBOM = InferInsertModel<typeof boms>;
export type BOMItem = InferSelectModel<typeof bomItems>;
export type NewBOMItem = InferInsertModel<typeof bomItems>;
export type BOMOperation = InferSelectModel<typeof bomOperations>;
export type NewBOMOperation = InferInsertModel<typeof bomOperations>;
export type BOMScrapItem = InferSelectModel<typeof bomScrapItems>;
export type NewBOMScrapItem = InferInsertModel<typeof bomScrapItems>;
export type BOMAlternativeItem = InferSelectModel<typeof bomAlternativeItems>;
export type NewBOMAlternativeItem = InferInsertModel<
  typeof bomAlternativeItems
>;
export type BOMUpdateLog = InferSelectModel<typeof bomUpdateLog>;
export type NewBOMUpdateLog = InferInsertModel<typeof bomUpdateLog>;
export type Workstation = InferSelectModel<typeof workstations>;
export type NewWorkstation = InferInsertModel<typeof workstations>;

// Production Planning types
export type ProductionPlan = InferSelectModel<typeof productionPlans>;
export type NewProductionPlan = InferInsertModel<typeof productionPlans>;
export type ProductionPlanItem = InferSelectModel<typeof productionPlanItems>;
export type NewProductionPlanItem = InferInsertModel<
  typeof productionPlanItems
>;
export type MRPRun = InferSelectModel<typeof mrpRuns>;
export type NewMRPRun = InferInsertModel<typeof mrpRuns>;
export type MRPResult = InferSelectModel<typeof mrpResults>;
export type NewMRPResult = InferInsertModel<typeof mrpResults>;
export type CapacityPlan = InferSelectModel<typeof capacityPlans>;
export type NewCapacityPlan = InferInsertModel<typeof capacityPlans>;
export type CapacityPlanResult = InferSelectModel<typeof capacityPlanResults>;
export type NewCapacityPlanResult = InferInsertModel<
  typeof capacityPlanResults
>;
export type ProductionForecast = InferSelectModel<typeof productionForecasts>;
export type NewProductionForecast = InferInsertModel<
  typeof productionForecasts
>;

// Work Order types
export type WorkOrder = InferSelectModel<typeof workOrders>;
export type NewWorkOrder = InferInsertModel<typeof workOrders>;
export type WorkOrderOperation = InferSelectModel<typeof workOrderOperations>;
export type NewWorkOrderOperation = InferInsertModel<
  typeof workOrderOperations
>;
export type WorkOrderItem = InferSelectModel<typeof workOrderItems>;
export type NewWorkOrderItem = InferInsertModel<typeof workOrderItems>;
export type WorkOrderStockEntry = InferSelectModel<
  typeof workOrderStockEntries
>;
export type NewWorkOrderStockEntry = InferInsertModel<
  typeof workOrderStockEntries
>;
export type WorkOrderTimeLog = InferSelectModel<typeof workOrderTimeLogs>;
export type NewWorkOrderTimeLog = InferInsertModel<typeof workOrderTimeLogs>;
// HR types
import {
  departments,
  designations,
  employeeDocuments,
  employeeOnboarding,
  employeeOnboardingTasks,
  employees,
  onboardingTasks,
  onboardingTemplates,
} from './hr';

export type Employee = InferSelectModel<typeof employees>;
export type NewEmployee = InferInsertModel<typeof employees>;
export type Department = InferSelectModel<typeof departments>;
export type NewDepartment = InferInsertModel<typeof departments>;
export type Designation = InferSelectModel<typeof designations>;
export type NewDesignation = InferInsertModel<typeof designations>;
export type EmployeeDocument = InferSelectModel<typeof employeeDocuments>;
export type NewEmployeeDocument = InferInsertModel<typeof employeeDocuments>;
export type OnboardingTemplate = InferSelectModel<typeof onboardingTemplates>;
export type NewOnboardingTemplate = InferInsertModel<
  typeof onboardingTemplates
>;
export type OnboardingTask = InferSelectModel<typeof onboardingTasks>;
export type NewOnboardingTask = InferInsertModel<typeof onboardingTasks>;
export type EmployeeOnboarding = InferSelectModel<typeof employeeOnboarding>;
export type NewEmployeeOnboarding = InferInsertModel<typeof employeeOnboarding>;
export type EmployeeOnboardingTask = InferSelectModel<
  typeof employeeOnboardingTasks
>;
export type NewEmployeeOnboardingTask = InferInsertModel<
  typeof employeeOnboardingTasks
>;
