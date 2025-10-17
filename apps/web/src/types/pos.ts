import { Customer } from './crm';
import { Item, ItemGroup } from './stock';

// POS Profile Configuration
export interface POSProfile {
  name: string;
  pos_profile_name: string;
  company: string;
  warehouse: string;
  cost_center?: string;
  expense_account?: string;
  income_account?: string;
  
  // Payment Settings
  payments: POSPaymentMethod[];
  
  // Pricing Settings
  selling_price_list: string;
  currency: string;
  
  // Customer Settings
  customer?: string;
  customer_group?: string;
  territory?: string;
  
  // Item Settings
  item_groups: string[];
  hide_unavailable_items: boolean;
  
  // Print Settings
  print_format?: string;
  letter_head?: string;
  
  // Other Settings
  allow_negative_stock: boolean;
  allow_user_to_edit_rate: boolean;
  allow_user_to_edit_discount: boolean;
  validate_stock_on_save: boolean;
  
  // Offline Settings
  offline_pos: boolean;
}

export interface POSPaymentMethod {
  mode_of_payment: string;
  account: string;
  type: 'Cash' | 'Bank' | 'General';
  default?: boolean;
}

// POS Cart Item
export interface POSCartItem {
  item_code: string;
  item_name: string;
  rate: number;
  qty: number;
  uom: string;
  stock_qty?: number;
  
  // Pricing
  price_list_rate?: number;
  discount_percentage?: number;
  discount_amount?: number;
  
  // Tax
  item_tax_template?: string;
  tax_rate?: number;
  
  // Serial/Batch
  serial_no?: string[];
  batch_no?: string;
  
  // Additional Info
  description?: string;
  image?: string;
}

// POS Transaction
export interface POSTransaction {
  name?: string;
  customer: string;
  customer_name: string;
  posting_date: string;
  posting_time: string;
  
  // Items
  items: POSCartItem[];
  
  // Totals
  total_qty: number;
  net_total: number;
  total_taxes_and_charges: number;
  discount_amount: number;
  grand_total: number;
  rounded_total: number;
  
  // Payments
  payments: POSPayment[];
  paid_amount: number;
  change_amount: number;
  
  // Status
  docstatus: 0 | 1 | 2; // Draft, Submitted, Cancelled
  is_pos: boolean;
  is_return: boolean;
  
  // POS Specific
  pos_profile: string;
  pos_closing_entry?: string;
  
  // Offline
  offline_pos_name?: string;
  consolidated_invoice?: string;
  timestamp?: string;
  synced?: number; // 0 for false, 1 for true
}

export interface POSPayment {
  mode_of_payment: string;
  account: string;
  amount: number;
  type: 'Cash' | 'Bank' | 'General';
  
  // Bank/Card specific
  reference_no?: string;
  reference_date?: string;
}

// POS Closing Entry
export interface POSClosingEntry {
  name?: string;
  posting_date: string;
  posting_time: string;
  pos_profile: string;
  user: string;
  company: string;
  
  // Period
  period_start_date: string;
  period_end_date: string;
  
  // Totals
  total_quantity: number;
  net_total: number;
  total_taxes_and_charges: number;
  grand_total: number;
  
  // Payment Reconciliation
  payment_reconciliation: POSClosingPayment[];
  
  // Status
  docstatus: 0 | 1 | 2;
  status: 'Draft' | 'Submitted' | 'Cancelled';
}

export interface POSClosingPayment {
  mode_of_payment: string;
  opening_amount: number;
  expected_amount: number;
  difference: number;
}

// POS Settings and Configuration
export interface POSSettings {
  // Display Settings
  show_item_code: boolean;
  show_item_stock: boolean;
  show_template_items: boolean;
  
  // Behavior Settings
  auto_add_item_to_cart: boolean;
  use_pos_in_offline_mode: boolean;
  
  // Print Settings
  auto_print_receipt: boolean;
  print_format_for_online: string;
  print_format_for_offline: string;
  
  // Customer Display
  display_items_in_stock: boolean;
  hide_images: boolean;
  hide_unavailable_items: boolean;
}

// Search and Filter Types
export interface ItemSearchOptions {
  searchBy?: 'name' | 'code' | 'barcode';
  itemGroup?: string;
  inStock?: boolean;
  limit?: number;
}

export interface POSSearchResult {
  items: Item[];
  total: number;
  hasMore: boolean;
}

// Offline Storage Types
export interface OfflinePOSData {
  profile: POSProfile;
  items: Item[];
  itemGroups: ItemGroup[];
  customers: Customer[];
  transactions: POSTransaction[];
  lastSync: string;
}

// POS Store State
export interface POSState {
  // Configuration
  currentProfile: POSProfile | null;
  settings: POSSettings;
  
  // Data
  items: Item[];
  itemGroups: ItemGroup[];
  customers: Customer[];
  
  // Cart State
  cartItems: POSCartItem[];
  selectedCustomer: Customer | null;
  cartDiscount: number;
  cartTax: number;
  cartTotal: number;
  
  // UI State
  isOffline: boolean;
  isLoading: boolean;
  currentView: 'products' | 'payment' | 'receipt';
  
  // Payment State
  currentTransaction: POSTransaction | null;
  paymentMethods: POSPaymentMethod[];
  
  // Actions
  initializePOS: () => Promise<void>;
  loadPOSProfile: (profileName?: string) => Promise<void>;
  
  // Item Management
  loadItems: () => Promise<void>;
  searchItems: (term: string, options?: ItemSearchOptions) => Promise<Item[]>;
  
  // Customer Management
  searchCustomers: (term: string) => Promise<Customer[]>;
  selectCustomer: (customer: Customer) => void;
  clearCustomer: () => void;
  createQuickCustomer: (data: Partial<Customer>) => Promise<Customer>;
  
  // Cart Management
  addItemToCart: (item: Item, quantity: number) => Promise<void>;
  updateCartItemQuantity: (itemCode: string, quantity: number) => void;
  removeCartItem: (itemCode: string) => void;
  clearCart: () => void;
  applyDiscount: (value: number, type: 'percentage' | 'amount') => void;
  
  // Transaction Management
  proceedToPayment: () => void;
  processPayment: (payments: POSPayment[]) => Promise<POSTransaction>;
  printReceipt: (transaction: POSTransaction) => Promise<void>;
  
  // Offline Management
  syncData: () => Promise<void>;
  enableOfflineMode: () => void;
  disableOfflineMode: () => void;
  
  // POS Closing
  openPOSClosing: () => void;
  createPOSClosing: () => Promise<POSClosingEntry>;
  
  // Settings
  openSettings: () => void;
  updateSettings: (settings: Partial<POSSettings>) => void;
  
  // Helper Methods
  loadItemGroups: () => Promise<void>;
  loadPaymentMethods: (profile: POSProfile) => void;
  recalculateCart: () => void;
  saveOfflineData: () => void;
}

// Receipt Template Data
export interface ReceiptData {
  transaction: POSTransaction;
  profile: POSProfile;
  company: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    tax_id?: string;
  };
  customer: Customer;
  items: POSCartItem[];
  payments: POSPayment[];
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    paid: number;
    change: number;
  };
  metadata: {
    cashier: string;
    date: string;
    time: string;
    invoice_no: string;
  };
}

// Error Types
export interface POSError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type POSErrorCode = 
  | 'PROFILE_NOT_FOUND'
  | 'ITEM_NOT_FOUND'
  | 'INSUFFICIENT_STOCK'
  | 'CUSTOMER_REQUIRED'
  | 'PAYMENT_FAILED'
  | 'OFFLINE_SYNC_FAILED'
  | 'PRINTER_ERROR'
  | 'VALIDATION_ERROR';