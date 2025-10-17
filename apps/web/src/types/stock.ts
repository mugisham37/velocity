// Stock Module Types for ERPNext

export interface Item {
  name: string;
  item_code: string;
  item_name: string;
  item_group: string;
  description?: string;
  image?: string;
  brand?: string;
  uom: string;
  maintain_stock: boolean;
  is_stock_item: boolean;
  include_item_in_manufacturing: boolean;
  is_fixed_asset: boolean;
  auto_create_assets: boolean;
  asset_category?: string;
  asset_naming_series?: string;
  
  // Inventory settings
  valuation_method: 'FIFO' | 'Moving Average';
  default_warehouse?: string;
  shelf_life_in_days?: number;
  end_of_life?: string;
  disabled: boolean;
  
  // Variant settings
  has_variants: boolean;
  variant_of?: string;
  variant_based_on?: string;
  attributes?: ItemAttribute[];
  
  // Serial and Batch settings
  has_serial_no: boolean;
  serial_no_series?: string;
  has_batch_no: boolean;
  create_new_batch: boolean;
  batch_number_series?: string;
  
  // Pricing
  standard_rate?: number;
  
  // Tax and accounting
  item_tax_template?: string;
  tax_code?: string;
  
  // Purchase settings
  is_purchase_item: boolean;
  purchase_uom?: string;
  min_order_qty?: number;
  
  // Additional fields for POS
  stock_uom?: string;
  stock_qty?: number;
  barcode?: string;
  safety_stock?: number;
  lead_time_days?: number;
  last_purchase_rate?: number;
  
  // Sales settings
  is_sales_item: boolean;
  sales_uom?: string;
  max_discount?: number;
  
  // Manufacturing settings
  default_bom?: string;
  
  // Quality settings
  inspection_required_before_purchase: boolean;
  inspection_required_before_delivery: boolean;
  quality_inspection_template?: string;
  
  // Website settings
  show_in_website: boolean;
  route?: string;
  weightage?: number;
  
  // Timestamps
  creation: string;
  modified: string;
  owner: string;
  modified_by: string;
  docstatus: number;
}

export interface ItemAttribute {
  attribute: string;
  attribute_value: string;
}

export interface ItemVariant {
  name: string;
  item_code: string;
  item_name: string;
  variant_of: string;
  attributes: ItemAttribute[];
}

export interface StockEntry {
  name: string;
  naming_series: string;
  stock_entry_type: StockEntryType;
  purpose: StockEntryPurpose;
  company: string;
  posting_date: string;
  posting_time: string;
  set_posting_time: boolean;
  
  // Source and target
  from_warehouse?: string;
  to_warehouse?: string;
  from_bom?: string;
  bom_no?: string;
  use_multi_level_bom: boolean;
  fg_completed_qty?: number;
  
  // Additional info
  project?: string;
  cost_center?: string;
  remarks?: string;
  per_transferred?: number;
  total_outgoing_value?: number;
  total_incoming_value?: number;
  value_difference?: number;
  total_additional_costs?: number;
  
  // Items
  items: StockEntryDetail[];
  additional_costs?: AdditionalCost[];
  
  // Timestamps
  creation: string;
  modified: string;
  owner: string;
  modified_by: string;
  docstatus: number;
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
  idx: number;
  item_code: string;
  item_name: string;
  description?: string;
  item_group: string;
  image?: string;
  qty: number;
  transfer_qty: number;
  uom: string;
  stock_uom: string;
  conversion_factor: number;
  
  // Warehouse info
  s_warehouse?: string;
  t_warehouse?: string;
  
  // Valuation
  basic_rate: number;
  valuation_rate: number;
  basic_amount: number;
  amount: number;
  additional_cost: number;
  
  // Serial and Batch
  serial_no?: string;
  batch_no?: string;
  
  // BOM related
  bom_no?: string;
  original_item?: string;
  
  // Quality
  sample_quantity?: number;
  
  // Cost center and project
  cost_center?: string;
  project?: string;
  
  // Reference
  material_request?: string;
  material_request_item?: string;
  
  // Actual qty and rate
  actual_qty?: number;
  transferred_qty?: number;
}

export interface AdditionalCost {
  idx: number;
  expense_account: string;
  description: string;
  amount: number;
}

export interface MaterialRequest {
  name: string;
  naming_series: string;
  material_request_type: MaterialRequestType;
  company: string;
  transaction_date: string;
  schedule_date: string;
  
  // Request details
  set_warehouse?: string;
  set_from_warehouse?: string;
  customer?: string;
  cost_center?: string;
  project?: string;
  
  // Status
  status: MaterialRequestStatus;
  per_ordered?: number;
  per_received?: number;
  
  // Items
  items: MaterialRequestItem[];
  
  // Timestamps
  creation: string;
  modified: string;
  owner: string;
  modified_by: string;
  docstatus: number;
}

export type MaterialRequestType = 
  | 'Purchase'
  | 'Material Transfer'
  | 'Material Issue'
  | 'Manufacture'
  | 'Customer Provided';

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
  idx: number;
  item_code: string;
  item_name: string;
  description?: string;
  item_group: string;
  brand?: string;
  image?: string;
  
  // Quantity
  qty: number;
  stock_qty: number;
  uom: string;
  stock_uom: string;
  conversion_factor: number;
  
  // Warehouse
  warehouse?: string;
  from_warehouse?: string;
  
  // Dates
  schedule_date: string;
  
  // Rates
  rate?: number;
  amount?: number;
  
  // Project and cost center
  project?: string;
  cost_center?: string;
  
  // Reference
  sales_order?: string;
  sales_order_item?: string;
  
  // Status
  ordered_qty?: number;
  received_qty?: number;
  stock_balance?: number;
}

export interface StockLedgerEntry {
  name: string;
  item_code: string;
  warehouse: string;
  posting_date: string;
  posting_time: string;
  voucher_type: string;
  voucher_no: string;
  voucher_detail_no?: string;
  
  // Quantity
  actual_qty: number;
  qty_after_transaction: number;
  
  // Valuation
  incoming_rate: number;
  outgoing_rate: number;
  stock_value: number;
  stock_value_difference: number;
  valuation_rate: number;
  
  // Serial and Batch
  serial_no?: string;
  batch_no?: string;
  
  // Project
  project?: string;
  
  // Company
  company: string;
  
  // Timestamps
  creation: string;
  modified: string;
}

export interface StockBalance {
  item_code: string;
  item_name: string;
  item_group: string;
  warehouse: string;
  warehouse_type?: string;
  company: string;
  
  // Quantities
  bal_qty: number;
  bal_val: number;
  opening_qty: number;
  opening_val: number;
  in_qty: number;
  in_val: number;
  out_qty: number;
  out_val: number;
  
  // Valuation
  val_rate: number;
  uom: string;
  
  // Additional info
  brand?: string;
  description?: string;
}

export interface Warehouse {
  name: string;
  warehouse_name: string;
  warehouse_type?: string;
  parent_warehouse?: string;
  company: string;
  disabled: boolean;
  is_group: boolean;
  
  // Address
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  pin?: string;
  country?: string;
  
  // Contact
  phone_no?: string;
  mobile_no?: string;
  email_id?: string;
  
  // Account settings
  account?: string;
  
  // Timestamps
  creation: string;
  modified: string;
  owner: string;
  modified_by: string;
  docstatus: number;
}

export interface SerialNo {
  name: string;
  serial_no: string;
  item_code: string;
  item_name: string;
  item_group: string;
  brand?: string;
  description?: string;
  
  // Status
  status: SerialNoStatus;
  warehouse?: string;
  company: string;
  
  // Purchase details
  purchase_document_type?: string;
  purchase_document_no?: string;
  purchase_date?: string;
  purchase_rate?: number;
  supplier?: string;
  
  // Delivery details
  delivery_document_type?: string;
  delivery_document_no?: string;
  delivery_date?: string;
  delivery_time?: string;
  customer?: string;
  
  // Asset details
  asset?: string;
  asset_status?: string;
  
  // Warranty
  warranty_period?: number;
  warranty_expiry_date?: string;
  amc_expiry_date?: string;
  
  // Timestamps
  creation: string;
  modified: string;
  owner: string;
  modified_by: string;
  docstatus: number;
}

export type SerialNoStatus = 
  | 'Active'
  | 'Inactive'
  | 'Delivered'
  | 'Expired';

export interface Batch {
  name: string;
  batch_id: string;
  item: string;
  item_name: string;
  
  // Dates
  manufacturing_date?: string;
  expiry_date?: string;
  
  // Status
  disabled: boolean;
  
  // Reference
  reference_doctype?: string;
  reference_name?: string;
  
  // Supplier batch
  supplier_batch_id?: string;
  
  // Timestamps
  creation: string;
  modified: string;
  owner: string;
  modified_by: string;
  docstatus: number;
}

// Stock Reports
export interface StockAgeingItem {
  item_code: string;
  item_name: string;
  item_group: string;
  brand?: string;
  description?: string;
  warehouse: string;
  uom: string;
  
  // Ageing buckets
  range1: number;
  range2: number;
  range3: number;
  range4: number;
  range5: number;
  
  // Totals
  total_qty: number;
  total_value: number;
  
  // Average age
  average_age: number;
  earliest_age: number;
  latest_age: number;
}

export interface ABCAnalysisItem {
  item_code: string;
  item_name: string;
  item_group: string;
  
  // Consumption
  consumption_qty: number;
  consumption_value: number;
  
  // Classification
  abc_classification: 'A' | 'B' | 'C';
  
  // Percentage
  qty_percentage: number;
  value_percentage: number;
  cumulative_qty_percentage: number;
  cumulative_value_percentage: number;
}

// Stock Entry validation and business rules
export interface StockEntryValidation {
  validateWarehouse: (fromWarehouse?: string, toWarehouse?: string, purpose?: StockEntryPurpose) => boolean;
  validateQuantity: (qty: number, stockQty: number) => boolean;
  validateSerialNo: (serialNo: string, itemCode: string) => boolean;
  validateBatchNo: (batchNo: string, itemCode: string) => boolean;
  calculateValuation: (items: StockEntryDetail[]) => number;
}
// Item Gr
oup
export interface ItemGroup {
  name: string;
  item_group_name: string;
  parent_item_group?: string;
  is_group: boolean;
  image?: string;
  description?: string;
  disabled: boolean;
  
  // Defaults
  default_income_account?: string;
  default_expense_account?: string;
  default_cost_center?: string;
  
  // Tax
  taxes?: ItemGroupTax[];
}

export interface ItemGroupTax {
  item_tax_template: string;
  tax_category?: string;
  valid_from?: string;
}