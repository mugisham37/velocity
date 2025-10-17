// Buying Module Types

export interface Supplier {
  name: string;
  supplier_name: string;
  supplier_type: 'Company' | 'Individual';
  supplier_group: string;
  country: string;
  default_currency: string;
  default_price_list: string;
  payment_terms?: string;
  is_frozen: boolean;
  disabled: boolean;
  
  // Contact Information
  email_id?: string;
  mobile_no?: string;
  phone?: string;
  website?: string;
  
  // Address Information
  supplier_primary_address?: string;
  primary_address?: string;
  supplier_primary_contact?: string;
  
  // Tax Information
  tax_id?: string;
  tax_category?: string;
  tax_withholding_category?: string;
  
  // Buying Settings
  is_internal_supplier: boolean;
  represents_company?: string;
  
  // Defaults
  default_buying_cost_center?: string;
  
  // Prevention of Advance
  prevent_pos: boolean;
  
  // Hold Type
  hold_type?: 'None' | 'All' | 'Invoices' | 'Payments';
  release_date?: string;
}

export interface PurchaseOrder {
  name: string;
  title?: string;
  naming_series: string;
  supplier: string;
  supplier_name: string;
  transaction_date: string;
  schedule_date?: string;
  
  // Company Information
  company: string;
  cost_center?: string;
  project?: string;
  
  // Currency and Pricing
  currency: string;
  conversion_rate: number;
  price_list_currency: string;
  plc_conversion_rate: number;
  buying_price_list: string;
  ignore_pricing_rule: boolean;
  
  // Items
  items: PurchaseOrderItem[];
  
  // Totals
  total_qty: number;
  base_total: number;
  base_net_total: number;
  total: number;
  net_total: number;
  
  // Taxes
  taxes_and_charges?: string;
  tax_category?: string;
  taxes: PurchaseOrderTax[];
  base_total_taxes_and_charges: number;
  total_taxes_and_charges: number;
  
  // Grand Total
  base_grand_total: number;
  grand_total: number;
  rounding_adjustment: number;
  rounded_total: number;
  in_words: string;
  base_in_words: string;
  
  // Payment
  advance_paid: number;
  payment_terms_template?: string;
  payment_schedule: PaymentSchedule[];
  
  // Delivery
  delivery_status: 'Not Delivered' | 'Partly Delivered' | 'Fully Delivered' | 'Closed' | 'Not Applicable';
  per_received: number;
  
  // Billing
  billing_status: 'Not Billed' | 'Partly Billed' | 'Fully Billed' | 'Closed';
  per_billed: number;
  
  // Status and Workflow
  status: 'Draft' | 'To Receive and Bill' | 'To Bill' | 'To Receive' | 'Completed' | 'Cancelled' | 'Closed';
  docstatus: 0 | 1 | 2;
  
  // Additional Information
  supplier_quotation?: string;
  is_subcontracted: boolean;
  
  // Terms and Conditions
  tc_name?: string;
  terms?: string;
  
  // Printing
  letter_head?: string;
  group_same_items: boolean;
  language?: string;
  
  // Internal
  is_internal_supplier: boolean;
  represents_company?: string;
  inter_company_order_reference?: string;
  
  // Drop Ship
  drop_ship: boolean;
  customer?: string;
  sales_order?: string;
}

export interface PurchaseOrderItem {
  name?: string;
  item_code: string;
  item_name: string;
  description?: string;
  item_group: string;
  brand?: string;
  image?: string;
  
  // Quantity and UOM
  qty: number;
  stock_uom: string;
  uom: string;
  conversion_factor: number;
  stock_qty: number;
  
  // Pricing
  rate: number;
  base_rate: number;
  price_list_rate: number;
  base_price_list_rate: number;
  discount_percentage: number;
  discount_amount: number;
  base_amount: number;
  amount: number;
  net_rate: number;
  net_amount: number;
  base_net_rate: number;
  base_net_amount: number;
  
  // Delivery
  schedule_date?: string;
  expected_delivery_date?: string;
  received_qty: number;
  returned_qty: number;
  
  // Billing
  billed_amt: number;
  
  // Warehouse
  warehouse?: string;
  
  // Manufacturing
  manufactured_qty: number;
  
  // Project
  project?: string;
  
  // Weight and Dimensions
  weight_per_unit?: number;
  total_weight?: number;
  weight_uom?: string;
  
  // Additional Information
  item_tax_template?: string;
  expense_account?: string;
  page_break: boolean;
  
  // Material Request Reference
  material_request?: string;
  material_request_item?: string;
  
  // Sales Order Reference (for drop ship)
  sales_order?: string;
  sales_order_item?: string;
  customer?: string;
  
  // Subcontracting
  bom?: string;
  include_exploded_items: boolean;
  
  // Internal
  prevdoc_doctype?: string;
  prevdoc_docname?: string;
  prevdoc_detail_docname?: string;
}

export interface PurchaseOrderTax {
  name?: string;
  charge_type: 'On Net Total' | 'On Previous Row Amount' | 'On Previous Row Total' | 'Actual';
  account_head: string;
  description: string;
  included_in_print_rate: boolean;
  included_in_paid_amount: boolean;
  cost_center?: string;
  rate?: number;
  account_currency: string;
  tax_amount: number;
  total: number;
  tax_amount_after_discount_amount: number;
  base_tax_amount: number;
  base_total: number;
  base_tax_amount_after_discount_amount: number;
  item_wise_tax_detail?: string;
  dont_recompute_tax: boolean;
}

export interface PaymentSchedule {
  name?: string;
  due_date: string;
  invoice_portion: number;
  payment_amount: number;
  base_payment_amount: number;
  outstanding: number;
  paid_amount: number;
  discounted_amount: number;
  description?: string;
}

export interface SupplierQuotation {
  name: string;
  title?: string;
  naming_series: string;
  supplier: string;
  supplier_name: string;
  transaction_date: string;
  valid_till?: string;
  
  // Company Information
  company: string;
  
  // Currency and Pricing
  currency: string;
  conversion_rate: number;
  price_list_currency: string;
  plc_conversion_rate: number;
  buying_price_list: string;
  
  // Items
  items: SupplierQuotationItem[];
  
  // Totals
  total_qty: number;
  base_total: number;
  base_net_total: number;
  total: number;
  net_total: number;
  
  // Taxes
  taxes_and_charges?: string;
  tax_category?: string;
  taxes: PurchaseOrderTax[];
  base_total_taxes_and_charges: number;
  total_taxes_and_charges: number;
  
  // Grand Total
  base_grand_total: number;
  grand_total: number;
  
  // Status
  status: 'Draft' | 'Submitted' | 'Cancelled';
  docstatus: 0 | 1 | 2;
  
  // Terms and Conditions
  tc_name?: string;
  terms?: string;
}

export interface SupplierQuotationItem {
  name?: string;
  item_code: string;
  item_name: string;
  description?: string;
  
  // Quantity and UOM
  qty: number;
  stock_uom: string;
  uom: string;
  conversion_factor: number;
  
  // Pricing
  rate: number;
  base_rate: number;
  amount: number;
  base_amount: number;
  
  // Material Request Reference
  material_request?: string;
  material_request_item?: string;
  
  // Request for Quotation Reference
  request_for_quotation?: string;
  request_for_quotation_item?: string;
  
  // Lead Time
  lead_time_days?: number;
  expected_delivery_date?: string;
  
  // Project
  project?: string;
  
  // Additional
  page_break: boolean;
}

export interface PurchaseInvoice {
  name: string;
  title?: string;
  naming_series: string;
  supplier: string;
  supplier_name: string;
  posting_date: string;
  posting_time: string;
  set_posting_time: boolean;
  due_date: string;
  
  // Company Information
  company: string;
  cost_center?: string;
  project?: string;
  
  // Currency and Pricing
  currency: string;
  conversion_rate: number;
  price_list_currency: string;
  plc_conversion_rate: number;
  buying_price_list: string;
  ignore_pricing_rule: boolean;
  
  // Items
  items: PurchaseInvoiceItem[];
  
  // Totals
  total_qty: number;
  base_total: number;
  base_net_total: number;
  total: number;
  net_total: number;
  
  // Taxes
  taxes_and_charges?: string;
  tax_category?: string;
  taxes: PurchaseOrderTax[];
  base_total_taxes_and_charges: number;
  total_taxes_and_charges: number;
  
  // Grand Total
  base_grand_total: number;
  grand_total: number;
  rounding_adjustment: number;
  rounded_total: number;
  in_words: string;
  base_in_words: string;
  
  // Payment
  is_return: boolean;
  update_stock: boolean;
  outstanding_amount: number;
  paid_amount: number;
  base_paid_amount: number;
  write_off_amount: number;
  base_write_off_amount: number;
  
  // Status
  status: 'Draft' | 'Unpaid' | 'Paid' | 'Return' | 'Debit Note Issued' | 'Cancelled';
  docstatus: 0 | 1 | 2;
  
  // References
  supplier_invoice_no?: string;
  supplier_invoice_date?: string;
  bill_no?: string;
  bill_date?: string;
  
  // Terms and Conditions
  tc_name?: string;
  terms?: string;
  
  // Internal
  is_internal_supplier: boolean;
  represents_company?: string;
}

export interface PurchaseInvoiceItem extends Omit<PurchaseOrderItem, 'schedule_date' | 'expected_delivery_date' | 'received_qty' | 'manufactured_qty'> {
  // Additional fields specific to Purchase Invoice
  expense_account: string;
  enable_deferred_expense: boolean;
  deferred_expense_account?: string;
  service_start_date?: string;
  service_end_date?: string;
  service_stop_date?: string;
  
  // Serial/Batch
  serial_no?: string;
  batch_no?: string;
  
  // Quality
  quality_inspection?: string;
  rejected_qty: number;
  received_qty: number;
  
  // Purchase Receipt Reference
  purchase_receipt?: string;
  pr_detail?: string;
  
  // Asset
  is_fixed_asset: boolean;
  asset?: string;
  asset_location?: string;
  asset_category?: string;
}

export interface PurchaseReceipt {
  name: string;
  title?: string;
  naming_series: string;
  supplier: string;
  supplier_name: string;
  posting_date: string;
  posting_time: string;
  set_posting_time: boolean;
  
  // Company Information
  company: string;
  cost_center?: string;
  project?: string;
  
  // Currency
  currency: string;
  conversion_rate: number;
  
  // Items
  items: PurchaseReceiptItem[];
  
  // Totals
  total_qty: number;
  base_total: number;
  total: number;
  net_total: number;
  base_net_total: number;
  
  // Status
  status: 'Draft' | 'To Bill' | 'Completed' | 'Cancelled' | 'Closed';
  per_billed: number;
  docstatus: 0 | 1 | 2;
  
  // Supplier Information
  supplier_address?: string;
  contact_person?: string;
  contact_display?: string;
  contact_mobile?: string;
  contact_email?: string;
  
  // References
  supplier_delivery_note?: string;
  lr_no?: string;
  lr_date?: string;
  transporter_name?: string;
  
  // Internal
  is_internal_supplier: boolean;
  represents_company?: string;
  inter_company_reference?: string;
  
  // Subcontracting
  is_subcontracted: boolean;
  supplier_warehouse?: string;
}

export interface PurchaseReceiptItem {
  name?: string;
  item_code: string;
  item_name: string;
  description?: string;
  
  // Quantity and UOM
  qty: number;
  received_qty: number;
  rejected_qty: number;
  stock_uom: string;
  uom: string;
  conversion_factor: number;
  stock_qty: number;
  received_stock_qty: number;
  
  // Pricing
  rate: number;
  base_rate: number;
  amount: number;
  base_amount: number;
  
  // Warehouse
  warehouse?: string;
  rejected_warehouse?: string;
  
  // Serial/Batch
  serial_no?: string;
  batch_no?: string;
  use_serial_batch_fields: boolean;
  
  // Quality
  quality_inspection?: string;
  
  // References
  purchase_order?: string;
  purchase_order_item?: string;
  material_request?: string;
  material_request_item?: string;
  
  // Project
  project?: string;
  
  // Asset
  is_fixed_asset: boolean;
  asset_location?: string;
  asset_category?: string;
  
  // Subcontracting
  bom?: string;
  
  // Additional
  page_break: boolean;
}

// Form State Types
export interface PurchaseOrderFormData extends Omit<PurchaseOrder, 'name' | 'docstatus' | 'status'> {
  // Make optional fields that are auto-generated
  naming_series?: string;
  transaction_date?: string;
  currency?: string;
  conversion_rate?: number;
  price_list_currency?: string;
  plc_conversion_rate?: number;
}

export interface SupplierFormData extends Omit<Supplier, 'name'> {
  supplier_name?: string;
  supplier_type?: 'Company' | 'Individual';
  supplier_group?: string;
  country?: string;
  default_currency?: string;
}

// API Response Types
export interface PurchaseOrderListResponse {
  data: PurchaseOrder[];
  total_count: number;
}

export interface SupplierListResponse {
  data: Supplier[];
  total_count: number;
}

export interface SupplierQuotationListResponse {
  data: SupplierQuotation[];
  total_count: number;
}

// Dashboard and Analytics Types
export interface PurchaseAnalytics {
  total_purchases: number;
  total_orders: number;
  average_order_value: number;
  top_suppliers: Array<{
    supplier: string;
    supplier_name: string;
    total_purchases: number;
    order_count: number;
  }>;
  purchase_trend: Array<{
    period: string;
    purchases: number;
    orders: number;
  }>;
  category_wise_purchases: Array<{
    category: string;
    purchases: number;
    percentage: number;
  }>;
}

export interface SupplierPerformance {
  supplier: string;
  supplier_name: string;
  total_orders: number;
  total_amount: number;
  on_time_delivery_rate: number;
  quality_rating: number;
  average_lead_time: number;
  last_purchase_date: string;
}

// Request for Quotation Types
export interface RequestForQuotation {
  name: string;
  title?: string;
  naming_series: string;
  transaction_date: string;
  
  // Company Information
  company: string;
  
  // Suppliers
  suppliers: RFQSupplier[];
  
  // Items
  items: RFQItem[];
  
  // Message
  message_for_supplier?: string;
  
  // Terms and Conditions
  tc_name?: string;
  terms?: string;
  
  // Status
  status: 'Draft' | 'Submitted' | 'Cancelled';
  docstatus: 0 | 1 | 2;
}

export interface RFQSupplier {
  name?: string;
  supplier: string;
  supplier_name: string;
  contact?: string;
  email_id?: string;
  send_email: boolean;
  email_sent: boolean;
  quote_status?: 'Pending' | 'Received' | 'No Quote';
  supplier_quotation?: string;
}

export interface RFQItem {
  name?: string;
  item_code: string;
  item_name: string;
  description?: string;
  qty: number;
  stock_uom: string;
  schedule_date?: string;
  expected_delivery_date?: string;
  
  // Material Request Reference
  material_request?: string;
  material_request_item?: string;
  
  // Project
  project?: string;
  
  // Warehouse
  warehouse?: string;
}