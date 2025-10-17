// Accounts Module Types

export interface Account {
  name: string;
  account_name: string;
  account_number?: string;
  account_type: AccountType;
  root_type: RootType;
  parent_account?: string;
  is_group: boolean;
  company: string;
  account_currency?: string;
  balance?: number;
  balance_in_account_currency?: number;
  lft: number;
  rgt: number;
  old_parent?: string;
  freeze_account?: boolean;
  disabled?: boolean;
  report_type?: ReportType;
  include_in_gross?: boolean;
  tax_rate?: number;
  inter_company_account?: string;
}

export type AccountType =
  | 'Accumulated Depreciation'
  | 'Asset Received But Not Billed'
  | 'Bank'
  | 'Cash'
  | 'Chargeable'
  | 'Cost of Goods Sold'
  | 'Depreciation'
  | 'Equity'
  | 'Expense Account'
  | 'Expenses Included In Asset Valuation'
  | 'Expenses Included In Valuation'
  | 'Fixed Asset'
  | 'Income Account'
  | 'Payable'
  | 'Receivable'
  | 'Round Off'
  | 'Stock'
  | 'Stock Adjustment'
  | 'Stock Received But Not Billed'
  | 'Service Received But Not Billed'
  | 'Tax'
  | 'Temporary';

export type RootType = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';

export type ReportType = 'Balance Sheet' | 'Profit and Loss';

export interface AccountTreeNode extends Account {
  children: AccountTreeNode[];
  level: number;
  expanded?: boolean;
  hasChildren: boolean;
}

export interface ChartOfAccountsState {
  accounts: AccountTreeNode[];
  selectedAccount?: Account;
  expandedNodes: Set<string>;
  searchQuery: string;
  filters: AccountFilters;
  isLoading: boolean;
  isDragging: boolean;
  draggedAccount?: Account;
}

export interface AccountFilters {
  company?: string;
  rootType?: RootType;
  accountType?: AccountType;
  isGroup?: boolean;
  disabled?: boolean;
  showZeroBalance?: boolean;
}

export interface AccountBalance {
  account: string;
  balance: number;
  balance_in_account_currency: number;
  account_currency: string;
  from_date: string;
  to_date: string;
}

export interface JournalEntry {
  name?: string;
  title?: string;
  voucher_type: JournalEntryType;
  posting_date: string;
  company: string;
  accounts: JournalEntryAccount[];
  user_remark?: string;
  cheque_no?: string;
  cheque_date?: string;
  reference_number?: string;
  reference_date?: string;
  pay_to_recd_from?: string;
  total_debit: number;
  total_credit: number;
  difference: number;
  multi_currency?: boolean;
  docstatus: number;
}

export type JournalEntryType =
  | 'Journal Entry'
  | 'Inter Company Journal Entry'
  | 'Bank Entry'
  | 'Cash Entry'
  | 'Credit Card Entry'
  | 'Debit Note'
  | 'Credit Note'
  | 'Contra Entry'
  | 'Excise Entry'
  | 'Write Off Entry'
  | 'Opening Entry'
  | 'Depreciation Entry'
  | 'Exchange Rate Revaluation'
  | 'Deferred Revenue'
  | 'Deferred Expense';

export interface JournalEntryAccount {
  account: string;
  party_type?: string;
  party?: string;
  debit: number;
  credit: number;
  debit_in_account_currency: number;
  credit_in_account_currency: number;
  account_currency: string;
  exchange_rate: number;
  cost_center?: string;
  project?: string;
  reference_type?: string;
  reference_name?: string;
  against_account?: string;
  user_remark?: string;
}

export interface PaymentEntry {
  name?: string;
  payment_type: PaymentType;
  party_type: PartyType;
  party: string;
  party_name?: string;
  posting_date: string;
  company: string;
  mode_of_payment: string;
  paid_from?: string;
  paid_to?: string;
  paid_from_account_currency?: string;
  paid_to_account_currency?: string;
  paid_amount: number;
  received_amount: number;
  source_exchange_rate: number;
  target_exchange_rate: number;
  reference_no?: string;
  reference_date?: string;
  references: PaymentReference[];
  deductions: PaymentDeduction[];
  taxes: PaymentTax[];
  total_allocated_amount: number;
  unallocated_amount: number;
  difference_amount: number;
  docstatus: number;
}

export type PaymentType = 'Receive' | 'Pay' | 'Internal Transfer';

export type PartyType = 'Customer' | 'Supplier' | 'Employee' | 'Shareholder' | 'Student';

export interface PaymentReference {
  reference_doctype: string;
  reference_name: string;
  due_date?: string;
  total_amount: number;
  outstanding_amount: number;
  allocated_amount: number;
  exchange_rate: number;
}

export interface PaymentDeduction {
  account: string;
  cost_center?: string;
  amount: number;
}

export interface PaymentTax {
  account_head: string;
  charge_type: string;
  rate?: number;
  tax_amount: number;
  total: number;
  cost_center?: string;
}

export interface BankReconciliation {
  name?: string;
  bank_account: string;
  from_date: string;
  to_date: string;
  bank_statement_from_date: string;
  bank_statement_to_date: string;
  bank_statement_closing_balance: number;
  total_amount: number;
  new_transactions: BankTransaction[];
  payment_entries: PaymentEntry[];
}

export interface BankTransaction {
  date: string;
  description: string;
  withdrawal: number;
  deposit: number;
  balance: number;
  reference_number?: string;
  matched?: boolean;
  payment_entry?: string;
}

// Report types
export interface GeneralLedgerEntry {
  posting_date: string;
  account: string;
  debit: number;
  credit: number;
  balance: number;
  voucher_type: string;
  voucher_no: string;
  against: string;
  party_type?: string;
  party?: string;
  cost_center?: string;
  project?: string;
  against_voucher_type?: string;
  against_voucher?: string;
  remarks?: string;
}

export interface TrialBalanceEntry {
  account: string;
  opening_debit: number;
  opening_credit: number;
  debit: number;
  credit: number;
  closing_debit: number;
  closing_credit: number;
}

export interface ProfitLossEntry {
  account: string;
  account_name: string;
  parent_account?: string;
  indent: number;
  account_type: string;
  is_group: boolean;
  opening_balance: number;
  debit: number;
  credit: number;
  closing_balance: number;
}

export interface BalanceSheetEntry {
  account: string;
  account_name: string;
  parent_account?: string;
  indent: number;
  account_type: string;
  is_group: boolean;
  opening_balance: number;
  closing_balance: number;
}

export interface CashFlowEntry {
  account: string;
  label: string;
  amount: number;
  account_type: string;
  indent: number;
  parent_account?: string;
}