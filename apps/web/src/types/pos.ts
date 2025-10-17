// POS-related type definitions

export interface POSProfile {
  name: string;
  pos_profile_name: string;
  company: string;
  warehouse: string;
  item_groups?: string[];
  hide_unavailable_items?: boolean;
  payments?: POSPaymentMethod[];
}

export interface POSPaymentMethod {
  mode_of_payment: string;
  account: string;
  default?: boolean;
  type?: string;
}

export interface POSCartItem {
  item_code: string;
  item_name: string;
  rate: number;
  qty: number;
  uom: string;
  stock_qty?: number;
  price_list_rate?: number;
  description?: string;
  image?: string;
}

export interface POSTransaction {
  name?: string;
  customer: string;
  customer_name: string;
  posting_date: string;
  posting_time: string;
  items: POSCartItem[];
  total_qty: number;
  net_total: number;
  total_taxes_and_charges: number;
  discount_amount: number;
  grand_total: number;
  rounded_total: number;
  payments: POSPayment[];
  paid_amount: number;
  change_amount: number;
  docstatus: number;
  is_pos: boolean;
  is_return: boolean;
  pos_profile: string;
  offline_pos_name?: string;
}

export interface POSPayment {
  mode_of_payment: string;
  amount: number;
  account?: string;
  type?: string;
}

export interface POSSettings {
  show_item_code: boolean;
  show_item_stock: boolean;
  show_template_items: boolean;
  auto_add_item_to_cart: boolean;
  use_pos_in_offline_mode: boolean;
  auto_print_receipt: boolean;
  print_format_for_online: string;
  print_format_for_offline: string;
  display_items_in_stock: boolean;
  hide_images: boolean;
  hide_unavailable_items: boolean;
}

export interface ItemSearchOptions {
  searchBy?: 'name' | 'code' | 'barcode';
  limit?: number;
}

export interface OfflinePOSData {
  profile: POSProfile;
  items: any[];
  itemGroups: any[];
  customers: any[];
  transactions: POSTransaction[];
  lastSync: string;
}

export interface POSClosingEntry {
  posting_date: string;
  posting_time: string;
  pos_profile: string;
  pos_profile_name?: string;
  user: string;
  company: string;
  period_start_date: string;
  period_end_date: string;
  total_quantity: number;
  net_total: number;
  total_taxes_and_charges: number;
  grand_total: number;
  payment_reconciliation: POSClosingPayment[];
  docstatus: number;
  status: string;
  name?: string;
}

export interface POSClosingPayment {
  mode_of_payment: string;
  opening_amount: number;
  expected_amount: number;
  difference: number;
}

export interface POSState {
  // Current state
  currentProfile: POSProfile | null;
  settings: POSSettings;
  items: any[];
  itemGroups: any[];
  customers: any[];
  cartItems: POSCartItem[];
  selectedCustomer: any | null;
  cartDiscount: number;
  cartTax: number;
  cartTotal: number;
  isOffline: boolean;
  isLoading: boolean;
  currentView: string;
  currentTransaction: POSTransaction | null;
  paymentMethods: POSPaymentMethod[];

  // Actions
  initializePOS: () => Promise<void>;
  loadPOSProfile: (profileName?: string) => Promise<void>;
  loadItems: () => Promise<void>;
  loadItemGroups: () => Promise<void>;
  loadPaymentMethodsAsync: (profile: POSProfile) => Promise<void>;
  searchItems: (term: string, options?: ItemSearchOptions) => Promise<any[]>;
  searchCustomers: (term: string) => Promise<any[]>;
  selectCustomer: (customer: any) => void;
  clearCustomer: () => void;
  createQuickCustomer: (data: Partial<any>) => Promise<any>;
  addItemToCart: (item: any, quantity: number) => Promise<void>;
  updateCartItemQuantity: (itemCode: string, quantity: number) => void;
  removeCartItem: (itemCode: string) => void;
  clearCart: () => void;
  applyDiscount: (value: number, type: 'percentage' | 'amount') => void;
  proceedToPayment: () => void;
  processPayment: (payments: POSPayment[]) => Promise<POSTransaction>;
  printReceipt: (transaction: POSTransaction) => Promise<void>;
  syncData: () => Promise<void>;
  enableOfflineMode: () => void;
  disableOfflineMode: () => void;
  saveOfflineData: () => Promise<void>;
  openPOSClosing: () => void;
  createPOSClosing: () => Promise<POSClosingEntry>;
  openSettings: () => void;
  updateSettings: (newSettings: Partial<POSSettings>) => void;
  loadPaymentMethods: (profile: POSProfile) => void;
  recalculateCart: () => void;
}