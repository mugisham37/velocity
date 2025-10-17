// Sales Module Types

export interface Customer {
  name: string;
  customer_name: string;
  customer_type: 'Company' | 'Individual';
  customer_group: string;
  territory: string;
  default_currency: string;
  default_price_list: string;
  payment_terms?: string;
  credit_limit?: number;
  credit_days?: number;
  is_frozen: boolean;
  disabled: boolean;
  
  // Contact Information
  email_id?: string;
  mobile_no?: string;
  phone?: string;
  website?: string;
  
  // Address Information
  customer_primary_address?: string;
  primary_address?: string;
  customer_primary_contact?: string;
  
  // Tax Information
  tax_id?: string;
  tax_category?: string;
  tax_withholding_category?: string;
  
  // Sales Settings
  so_required: boolean;
  dn_required: boolean;
  is_internal_customer: boolean;
  represents_company?: string;
  
  // Defaults
  default_sales_partner?: string;
  default_commission_rate?: number;
}

export interface SalesOrder {
  name: string;
  title?: string;
  naming_series: string;
  customer: string;
  customer_name: string;
  order_type: 'Sales' | 'Maintenance' | 'Shopping Cart';
  transaction_date: string;
  delivery_date?: string;
  
  // Company Information
  company: string;
  cost_center?: string;
  project?: string;
  
  // Currency and Pricing
  currency: string;
  conversion_rate: number;
  price_list_currency: string;
  plc_conversion_rate: number;
  selling_price_list: string;
  ignore_pricing_rule: boolean;
  
  // Items
  items: SalesOrderItem[];
  
  // Totals
  total_qty: number;
  base_total: number;
  base_net_total: number;
  total: number;
  net_total: number;
  
  // Taxes
  taxes_and_charges?: string;
  tax_category?: string;
  taxes: SalesOrderTax[];
  base_total_taxes_and_charges: number;
  total_taxes_and_charges: number;
  
  // Grand Total
  base_grand_total: number;
  grand_total: number;
  rounding_adjustment: number;
  rounded_total: number;
  
  // Payment
  advance_paid: number;
  payment_terms_template?: string;
  payment_schedule: PaymentSchedule[];
  
  // Delivery
  delivery_status: 'Not Delivered' | 'Partly Delivered' | 'Fully Delivered' | 'Closed' | 'Not Applicable';
  per_delivered: number;
  
  // Billing
  billing_status: 'Not Billed' | 'Partly Billed' | 'Fully Billed' | 'Closed';
  per_billed: number;
  
  // Status and Workflow
  status: 'Draft' | 'To Deliver and Bill' | 'To Bill' | 'To Deliver' | 'Completed' | 'Cancelled' | 'Closed';
  docstatus: 0 | 1 | 2;
  
  // Additional Information
  customer_po?: string;
  po_date?: string;
  source?: string;
  campaign?: string;
  sales_partner?: string;
  commission_rate?: number;
  total_commission?: number;
  
  // Terms and Conditions
  tc_name?: string;
  terms?: string;
  
  // Printing
  letter_head?: string;
  group_same_items: boolean;
  language?: string;
  
  // Internal
  is_internal_customer: boolean;
  represents_company?: string;
  inter_company_order_reference?: string;
}

export interface SalesOrderItem {
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
  margin_type?: 'Percentage' | 'Amount';
  margin_rate_or_amount?: number;
  rate_with_margin: number;
  discount_percentage: number;
  discount_amount: number;
  base_amount: number;
  amount: number;
  net_rate: number;
  net_amount: number;
  base_net_rate: number;
  base_net_amount: number;
  
  // Delivery
  delivery_date?: string;
  delivered_qty: number;
  returned_qty: number;
  
  // Billing
  billed_amt: number;
  
  // Warehouse and Planning
  warehouse?: string;
  target_warehouse?: string;
  reserve_stock: boolean;
  
  // Production
  planned_qty: number;
  produced_qty: number;
  
  // Project
  project?: string;
  
  // Weight and Dimensions
  weight_per_unit?: number;
  total_weight?: number;
  weight_uom?: string;
  
  // Additional Information
  item_tax_template?: string;
  page_break: boolean;
  
  // Internal
  prevdoc_doctype?: string;
  prevdoc_docname?: string;
  prevdoc_detail_docname?: string;
}

export interface SalesOrderTax {
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

export interface PricingRule {
  name: string;
  title?: string;
  apply_on: 'Item Code' | 'Item Group' | 'Brand' | 'Transaction';
  applicable_for?: 'Customer' | 'Customer Group' | 'Territory' | 'Sales Partner' | 'Campaign';
  
  // Conditions
  item_code?: string;
  item_group?: string;
  brand?: string;
  customer?: string;
  customer_group?: string;
  territory?: string;
  sales_partner?: string;
  campaign?: string;
  
  // Quantity/Amount Conditions
  min_qty?: number;
  max_qty?: number;
  min_amount?: number;
  max_amount?: number;
  
  // Pricing
  rate_or_discount: 'Rate' | 'Discount Percentage' | 'Discount Amount';
  rate?: number;
  discount_percentage?: number;
  discount_amount?: number;
  
  // Validity
  valid_from?: string;
  valid_upto?: string;
  
  // Priority and Application
  priority: number;
  apply_multiple_pricing_rules: boolean;
  
  // Conditions
  company?: string;
  currency?: string;
  for_price_list?: string;
  
  // Status
  disable: boolean;
}

export interface SalesInvoice {
  name: string;
  title?: string;
  naming_series: string;
  customer: string;
  customer_name: string;
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
  selling_price_list: string;
  ignore_pricing_rule: boolean;
  
  // Items
  items: SalesInvoiceItem[];
  
  // Totals
  total_qty: number;
  base_total: number;
  base_net_total: number;
  total: number;
  net_total: number;
  
  // Taxes
  taxes_and_charges?: string;
  tax_category?: string;
  taxes: SalesOrderTax[];
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
  is_pos: boolean;
  is_return: boolean;
  update_stock: boolean;
  outstanding_amount: number;
  paid_amount: number;
  base_paid_amount: number;
  write_off_amount: number;
  base_write_off_amount: number;
  
  // Status
  status: 'Draft' | 'Unpaid' | 'Paid' | 'Return' | 'Credit Note Issued' | 'Unpaid and Discounted' | 'Overdue and Discounted' | 'Overdue' | 'Cancelled';
  docstatus: 0 | 1 | 2;
  
  // References
  customer_po?: string;
  po_date?: string;
  
  // Terms and Conditions
  tc_name?: string;
  terms?: string;
  
  // Internal
  is_internal_customer: boolean;
  represents_company?: string;
}

export interface SalesInvoiceItem extends Omit<SalesOrderItem, 'delivery_date' | 'delivered_qty' | 'planned_qty' | 'produced_qty'> {
  // Additional fields specific to Sales Invoice
  income_account: string;
  expense_account?: string;
  enable_deferred_revenue: boolean;
  deferred_revenue_account?: string;
  service_start_date?: string;
  service_end_date?: string;
  service_stop_date?: string;
  
  // Serial/Batch
  serial_no?: string;
  batch_no?: string;
  
  // Quality
  quality_inspection?: string;
  allow_zero_valuation_rate: boolean;
  
  // Delivery Note Reference
  delivery_note?: string;
  dn_detail?: string;
  delivered_by_supplier: boolean;
}

export interface DeliveryNote {
  name: string;
  title?: string;
  naming_series: string;
  customer: string;
  customer_name: string;
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
  items: DeliveryNoteItem[];
  
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
  
  // Delivery Information
  shipping_address_name?: string;
  shipping_address?: string;
  dispatch_address_name?: string;
  dispatch_address?: string;
  
  // Transport
  transporter?: string;
  transporter_name?: string;
  lr_no?: string;
  lr_date?: string;
  vehicle_no?: string;
  
  // Installation
  installation_status: 'Not Installed' | 'Partly Installed' | 'Fully Installed';
  per_installed: number;
  
  // References
  customer_po?: string;
  po_date?: string;
  
  // Internal
  is_internal_customer: boolean;
  represents_company?: string;
}

export interface DeliveryNoteItem {
  name?: string;
  item_code: string;
  item_name: string;
  description?: string;
  
  // Quantity and UOM
  qty: number;
  stock_uom: string;
  uom: string;
  conversion_factor: number;
  stock_qty: number;
  
  // Pricing
  rate: number;
  base_rate: number;
  amount: number;
  base_amount: number;
  
  // Warehouse
  warehouse?: string;
  target_warehouse?: string;
  
  // Serial/Batch
  serial_no?: string;
  batch_no?: string;
  
  // Quality
  quality_inspection?: string;
  use_serial_batch_fields: boolean;
  
  // References
  against_sales_order?: string;
  so_detail?: string;
  against_sales_invoice?: string;
  si_detail?: string;
  
  // Installation
  installed_qty: number;
  
  // Project
  project?: string;
  
  // Additional
  page_break: boolean;
}

// Form State Types
export interface SalesOrderFormData {
  // Required fields
  customer: string;
  customer_name: string;
  company: string;
  
  // Optional fields that can be auto-generated or user-provided
  naming_series?: string;
  transaction_date?: string;
  delivery_date?: string;
  order_type?: 'Sales' | 'Maintenance' | 'Shopping Cart';
  currency?: string;
  conversion_rate?: number;
  price_list_currency?: string;
  plc_conversion_rate?: number;
  selling_price_list?: string;
  cost_center?: string;
  project?: string;
  
  // Items and other complex fields
  items?: SalesOrderItem[];
  taxes?: SalesOrderTax[];
  payment_schedule?: PaymentSchedule[];
  
  // Additional optional fields
  customer_po?: string;
  po_date?: string;
  source?: string;
  campaign?: string;
  sales_partner?: string;
  commission_rate?: number;
  tc_name?: string;
  terms?: string;
  letter_head?: string;
  group_same_items?: boolean;
  language?: string;
}

export interface SalesCustomerFormData {
  // Optional fields for form
  customer_name?: string;
  customer_type?: 'Company' | 'Individual';
  customer_group?: string;
  territory?: string;
  default_currency?: string;
  default_price_list?: string;
  payment_terms?: string;
  credit_limit?: number;
  credit_days?: number;
  is_frozen?: boolean;
  disabled?: boolean;
  
  // Contact Information
  email_id?: string;
  mobile_no?: string;
  phone?: string;
  website?: string;
  
  // Address Information
  customer_primary_address?: string;
  primary_address?: string;
  customer_primary_contact?: string;
  
  // Tax Information
  tax_id?: string;
  tax_category?: string;
  tax_withholding_category?: string;
  
  // Sales Settings
  so_required?: boolean;
  dn_required?: boolean;
  is_internal_customer?: boolean;
  represents_company?: string;
  
  // Defaults
  default_sales_partner?: string;
  default_commission_rate?: number;
}

// API Response Types
export interface SalesOrderListResponse {
  data: SalesOrder[];
  total_count: number;
}

export interface SalesCustomerListResponse {
  data: Customer[];
  total_count: number;
}

// Dashboard and Analytics Types
export interface SalesAnalytics {
  total_sales: number;
  total_orders: number;
  average_order_value: number;
  top_customers: Array<{
    customer: string;
    customer_name: string;
    total_sales: number;
    order_count: number;
  }>;
  sales_trend: Array<{
    period: string;
    sales: number;
    orders: number;
  }>;
  territory_wise_sales: Array<{
    territory: string;
    sales: number;
    percentage: number;
  }>;
}

export interface SalesFunnel {
  leads: number;
  opportunities: number;
  quotations: number;
  orders: number;
  invoices: number;
  conversion_rates: {
    lead_to_opportunity: number;
    opportunity_to_quotation: number;
    quotation_to_order: number;
    order_to_invoice: number;
  };
}