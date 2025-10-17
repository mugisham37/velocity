// Stock-related type definitions

export interface Item {
  name?: string;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  uom?: string;
  standard_rate?: number;
  image?: string;
  description?: string;
  is_stock_item?: boolean;
  has_serial_no?: boolean;
  has_batch_no?: boolean;
  barcode?: string;
  stock_qty?: number;
}

export interface ItemGroup {
  name: string;
  item_group_name: string;
  parent_item_group?: string;
}

export interface ItemAttribute {
  name?: string;
  attribute_name: string;
  numeric_values?: boolean;
  from_range?: number;
  to_range?: number;
  increment?: number;
  item_attribute_values?: ItemAttributeValue[];
}

export interface ItemAttributeValue {
  attribute_value: string;
  abbr?: string;
}

export interface ItemVariant {
  name?: string;
  item_code: string;
  variant_of: string;
  attributes: ItemVariantAttribute[];
}

export interface ItemVariantAttribute {
  attribute: string;
  attribute_value: string;
}

export interface StockEntry {
  name?: string;
  naming_series: string;
  stock_entry_type: StockEntryType;
  purpose: StockEntryPurpose;
  company: string;
  posting_date: string;
  posting_time: string;
  set_posting_time?: boolean;
  from_warehouse?: string;
  to_warehouse?: string;
  items: StockEntryDetail[];
  total_outgoing_value?: number;
  total_incoming_value?: number;
  value_difference?: number;
  total_additional_costs?: number;
  remarks?: string;
  per_transferred?: number;
  docstatus: number;
  creation?: string;
  modified?: string;
}

export type StockEntryType = 
  | 'Material Issue'
  | 'Material Receipt'
  | 'Material Transfer'
  | 'Material Transfer for Manufacture'
  | 'Material Consumption for Manufacture'
  | 'Manufacture'
  | 'Repack'
  | 'Send to Subcontractor';

export type StockEntryPurpose = 
  | 'Material Issue'
  | 'Material Receipt'
  | 'Material Transfer'
  | 'Material Transfer for Manufacture'
  | 'Material Consumption for Manufacture'
  | 'Manufacture'
  | 'Repack'
  | 'Send to Subcontractor'
  | 'Send to Warehouse'
  | 'Receive at Warehouse';

export interface StockEntryDetail {
  name?: string;
  idx?: number;
  item_code: string;
  item_name?: string;
  item_group?: string;
  description?: string;
  qty: number;
  transfer_qty?: number;
  uom: string;
  stock_uom: string;
  conversion_factor: number;
  s_warehouse?: string;
  t_warehouse?: string;
  basic_rate?: number;
  basic_amount?: number;
  additional_cost?: number;
  valuation_rate?: number;
  amount?: number;
  expense_account?: string;
  cost_center?: string;
  project?: string;
  actual_qty?: number;
  transferred_qty?: number;
  bom_no?: string;
  allow_zero_valuation_rate?: boolean;
  set_basic_rate_manually?: boolean;
  allow_alternative_item?: boolean;
  material_request?: string;
  material_request_item?: string;
  original_item?: string;
  serial_no?: string;
  batch_no?: string;
}

export interface MaterialRequest {
  name?: string;
  naming_series: string;
  material_request_type: MaterialRequestType;
  status: MaterialRequestStatus;
  company: string;
  transaction_date: string;
  schedule_date?: string;
  required_date?: string;
  items: MaterialRequestItem[];
  per_ordered?: number;
  per_received?: number;
  docstatus: number;
  creation?: string;
  modified?: string;
}

export type MaterialRequestType = 
  | 'Purchase'
  | 'Material Transfer'
  | 'Material Issue'
  | 'Manufacture'
  | 'Customer Provided'
  | 'Work Order';

export type MaterialRequestStatus = 
  | 'Draft'
  | 'Submitted'
  | 'Stopped'
  | 'Cancelled'
  | 'Pending'
  | 'Partially Ordered'
  | 'Ordered'
  | 'Issued'
  | 'Transferred'
  | 'Received';

export interface MaterialRequestItem {
  name?: string;
  idx?: number;
  item_code: string;
  item_name?: string;
  description?: string;
  item_group?: string;
  qty: number;
  stock_qty?: number;
  uom: string;
  stock_uom: string;
  conversion_factor: number;
  schedule_date?: string;
  warehouse?: string;
  from_warehouse?: string;
  project?: string;
  expense_account?: string;
  cost_center?: string;
  ordered_qty?: number;
  received_qty?: number;
  rate?: number;
  amount?: number;
  sales_order?: string;
  sales_order_item?: string;
  material_request_plan_item?: string;
  page_break?: boolean;
}

export interface StockLedgerEntry {
  name?: string;
  item_code: string;
  warehouse: string;
  posting_date: string;
  posting_time: string;
  voucher_type: string;
  voucher_no: string;
  voucher_detail_no?: string;
  actual_qty: number;
  qty_after_transaction: number;
  incoming_rate: number;
  outgoing_rate: number;
  stock_value: number;
  stock_value_difference: number;
  valuation_rate: number;
  company: string;
  fiscal_year?: string;
  serial_no?: string;
  batch_no?: string;
  project?: string;
  is_cancelled?: boolean;
}

export interface StockBalance {
  item_code: string;
  item_name?: string;
  item_group?: string;
  warehouse: string;
  company?: string;
  actual_qty: number;
  reserved_qty: number;
  reserved_qty_for_production: number;
  reserved_qty_for_sub_contract: number;
  projected_qty: number;
  valuation_rate: number;
  stock_value: number;
  stock_uom: string;
  bal_qty?: number;
  bal_val?: number;
  opening_qty?: number;
  opening_val?: number;
  in_qty?: number;
  in_val?: number;
  out_qty?: number;
  out_val?: number;
}

export interface Warehouse {
  name?: string;
  warehouse_name: string;
  warehouse_type?: string;
  parent_warehouse?: string;
  is_group?: boolean;
  company: string;
  disabled?: boolean;
  account?: string;
  email_id?: string;
  phone_no?: string;
  mobile_no?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  pin?: string;
  country?: string;
}

export interface SerialNo {
  name?: string;
  serial_no: string;
  item_code: string;
  item_name?: string;
  warehouse?: string;
  company: string;
  status: 'Active' | 'Inactive' | 'Delivered' | 'Expired';
  purchase_document_type?: string;
  purchase_document_no?: string;
  purchase_date?: string;
  purchase_rate?: number;
  supplier?: string;
  delivery_document_type?: string;
  delivery_document_no?: string;
  delivery_date?: string;
  customer?: string;
  warranty_period?: number;
  warranty_expiry_date?: string;
  amc_expiry_date?: string;
  maintenance_status?: string;
}

export interface Batch {
  name?: string;
  batch_id: string;
  item: string;
  item_name?: string;
  supplier?: string;
  reference_doctype?: string;
  reference_name?: string;
  batch_qty?: number;
  stock_uom?: string;
  manufacturing_date?: string;
  expiry_date?: string;
  description?: string;
  disabled?: boolean;
}

export interface StockAgeingItem {
  item_code: string;
  item_name?: string;
  item_group?: string;
  warehouse: string;
  range1?: number;
  range2?: number;
  range3?: number;
  range4?: number;
  range5?: number;
  total_qty?: number;
  total_value?: number;
  average_age?: number;
  earliest_age?: number;
  latest_age?: number;
  actual_qty: number;
  valuation_rate: number;
  stock_value: number;
  age_0_30: number;
  age_30_60: number;
  age_60_90: number;
  age_90_120: number;
  age_120_above: number;
}

export interface ABCAnalysisItem {
  item_code: string;
  item_name?: string;
  item_group?: string;
  total_outgoing: number;
  outgoing_value: number;
  consumption_value?: number;
  percentage_value: number;
  cumulative_percentage: number;
  classification: 'A' | 'B' | 'C';
}

export interface StockEntryValidation {
  item_code: string;
  warehouse?: string;
  actual_qty: number;
  requested_qty: number;
  available_qty: number;
  shortage_qty: number;
  can_proceed: boolean;
  message?: string;
}