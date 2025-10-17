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