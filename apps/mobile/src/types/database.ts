export interface BaseModel {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  needsSync?: boolean;
  syncStatus?: string;
  lastModified: Date;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface Customer extends BaseModel {
  name: string;
  email?: string;
  phone?: string;
  address?: Address;
  balance: number;
  creditLimit?: number;
  status: string;
  isActive: boolean;
}

export interface Product extends BaseModel {
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  cost: number;
  stockQuantity: number;
  images: string[];
  description: string;
  category: string;
  isActive: boolean;
}

export interface SalesOrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface SalesOrder extends BaseModel {
  orderNumber: string;
  customerId: string;
  customer: Customer;
  items: SalesOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  notes?: string;
  signature?: string;
  orderDate: Date;
  deliveryDate?: Date;
}
