// Manufacturing Module Types

export interface BOM {
  name: string;
  item: string;
  item_name: string;
  quantity: number;
  uom: string;
  is_active: boolean;
  is_default: boolean;
  with_operations: boolean;
  transfer_material_against: 'Work Order' | 'Job Card';
  routing?: string;
  items: BOMItem[];
  operations?: BOMOperation[];
  scrap_items?: BOMScrapItem[];
  exploded_items?: BOMExplodedItem[];
  total_cost: number;
  base_total_cost: number;
  raw_material_cost: number;
  operating_cost: number;
  total_leaf_exploded_items: number;
  creation: string;
  modified: string;
  owner: string;
  modified_by: string;
}

export interface BOMItem {
  item_code: string;
  item_name: string;
  description?: string;
  image?: string;
  qty: number;
  uom: string;
  stock_uom: string;
  conversion_factor: number;
  rate: number;
  base_rate: number;
  amount: number;
  base_amount: number;
  sourced_by_supplier: boolean;
  include_item_in_manufacturing: boolean;
  stock_qty: number;
  original_item?: string;
  bom_no?: string;
  allow_alternative_item: boolean;
  source_warehouse?: string;
  operation?: string;
}

export interface BOMOperation {
  operation: string;
  workstation: string;
  description?: string;
  time_in_mins: number;
  operating_cost: number;
  base_operating_cost: number;
  hour_rate: number;
  base_hour_rate: number;
  batch_size?: number;
  sequence_id?: number;
  fixed_time?: boolean;
}

export interface BOMScrapItem {
  item_code: string;
  item_name: string;
  stock_qty: number;
  rate: number;
  amount: number;
  stock_uom: string;
}

export interface BOMExplodedItem {
  item_code: string;
  item_name: string;
  description?: string;
  stock_qty: number;
  rate: number;
  amount: number;
  stock_uom: string;
  source_warehouse?: string;
  operation?: string;
}

export interface WorkOrder {
  name: string;
  naming_series: string;
  company: string;
  fg_warehouse: string;
  use_multi_level_bom: boolean;
  skip_transfer: boolean;
  update_consumed_material_cost_in_project: boolean;
  production_item: string;
  item_name: string;
  bom_no: string;
  qty: number;
  material_transferred_for_manufacturing: number;
  produced_qty: number;
  pending_qty: number;
  process_loss_percentage: number;
  process_loss_qty: number;
  scrap_warehouse?: string;
  wip_warehouse: string;
  source_warehouse?: string;
  fg_warehouse_name?: string;
  use_multi_level_bom_name?: string;
  sales_order?: string;
  sales_order_item?: string;
  project?: string;
  expected_delivery_date?: string;
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
  lead_time: number;
  status: WorkOrderStatus;
  required_items: WorkOrderItem[];
  operations?: WorkOrderOperation[];
  time_logs?: WorkOrderTimeLog[];
  creation: string;
  modified: string;
  owner: string;
  modified_by: string;
}

export type WorkOrderStatus = 
  | 'Draft'
  | 'Not Started'
  | 'In Process'
  | 'Completed'
  | 'Stopped'
  | 'Cancelled';

export interface WorkOrderItem {
  item_code: string;
  item_name: string;
  description?: string;
  source_warehouse?: string;
  uom: string;
  item_group: string;
  allow_alternative_item: boolean;
  include_item_in_manufacturing: boolean;
  required_qty: number;
  transferred_qty: number;
  consumed_qty: number;
  returned_qty: number;
  available_qty_at_source_warehouse: number;
  available_qty_at_wip_warehouse: number;
  projected_qty: number;
  actual_qty: number;
  rate: number;
  amount: number;
}

export interface WorkOrderOperation {
  operation: string;
  bom_operation?: string;
  workstation: string;
  description?: string;
  planned_start_time?: string;
  planned_end_time?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  planned_operating_cost: number;
  actual_operating_cost: number;
  hour_rate: number;
  time_in_mins: number;
  completed_qty: number;
  process_loss_qty: number;
  sequence_id: number;
  status: OperationStatus;
}

export type OperationStatus = 
  | 'Pending'
  | 'Work in Progress'
  | 'Completed'
  | 'On Hold';

export interface WorkOrderTimeLog {
  from_time: string;
  to_time: string;
  time_in_mins: number;
  completed_qty: number;
  operation?: string;
  workstation?: string;
  employee?: string;
}

export interface JobCard {
  name: string;
  naming_series: string;
  work_order: string;
  production_item: string;
  item_name: string;
  bom_no?: string;
  operation: string;
  workstation: string;
  posting_date: string;
  expected_start_date?: string;
  expected_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  total_completed_qty: number;
  total_time_in_mins: number;
  employee?: string;
  employee_name?: string;
  for_quantity: number;
  operation_id?: string;
  sequence_id?: number;
  wip_warehouse?: string;
  hour_rate: number;
  total_completed_qty_against_wo: number;
  process_loss_qty: number;
  transferred_qty: number;
  job_started: boolean;
  status: JobCardStatus;
  time_logs: JobCardTimeLog[];
  scrap_items?: JobCardScrapItem[];
  quality_inspection_template?: string;
  quality_inspections?: JobCardQualityInspection[];
  creation: string;
  modified: string;
  owner: string;
  modified_by: string;
}

export type JobCardStatus = 
  | 'Open'
  | 'Work in Progress'
  | 'Material Transferred'
  | 'On Hold'
  | 'Completed'
  | 'Cancelled';

export interface JobCardTimeLog {
  from_time: string;
  to_time: string;
  time_in_mins: number;
  completed_qty: number;
  employee?: string;
  employee_name?: string;
}

export interface JobCardScrapItem {
  item_code: string;
  item_name: string;
  stock_qty: number;
  stock_uom: string;
}

export interface JobCardQualityInspection {
  quality_inspection: string;
  inspection_type: string;
  reference_type: string;
  reference_name: string;
  status: string;
}

export interface Workstation {
  name: string;
  workstation_name: string;
  status: 'Active' | 'Inactive';
  warehouse?: string;
  production_capacity: number;
  hour_rate_labour: number;
  hour_rate_electricity: number;
  hour_rate_consumable: number;
  hour_rate_rent: number;
  hour_rate: number;
  holiday_list?: string;
  working_hours: WorkstationWorkingHour[];
  creation: string;
  modified: string;
}

export interface WorkstationWorkingHour {
  start_time: string;
  end_time: string;
  enabled: boolean;
}

export interface Operation {
  name: string;
  operation: string;
  description?: string;
  workstation?: string;
  is_corrective_operation: boolean;
  creation: string;
  modified: string;
}

export interface Routing {
  name: string;
  routing_name: string;
  operations: RoutingOperation[];
  creation: string;
  modified: string;
}

export interface RoutingOperation {
  operation: string;
  workstation: string;
  description?: string;
  time_in_mins: number;
  operating_cost: number;
  hour_rate: number;
  batch_size?: number;
  sequence_id: number;
  fixed_time?: boolean;
}

// Manufacturing Reports Types
export interface ProductionPlanningReport {
  item_code: string;
  item_name: string;
  planned_qty: number;
  produced_qty: number;
  pending_qty: number;
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
  status: string;
  delay_days?: number;
}

export interface WorkOrderStatusReport {
  work_order: string;
  production_item: string;
  qty: number;
  produced_qty: number;
  pending_qty: number;
  status: WorkOrderStatus;
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
  delay_days?: number;
}

export interface BOMCostReport {
  item_code: string;
  item_name: string;
  bom: string;
  raw_material_cost: number;
  operating_cost: number;
  total_cost: number;
  qty: number;
  rate: number;
}

export interface CapacityPlanningReport {
  workstation: string;
  planned_hours: number;
  actual_hours: number;
  capacity_utilization: number;
  efficiency: number;
  date: string;
}

export interface ManufacturingAnalytics {
  production_efficiency: number;
  capacity_utilization: number;
  on_time_delivery: number;
  quality_rate: number;
  cost_variance: number;
  total_production: number;
  total_work_orders: number;
  completed_work_orders: number;
  pending_work_orders: number;
}