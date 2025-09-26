// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  BiometricSetup: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Sales: undefined;
  Inventory: undefined;
  Finance: undefined;
  Profile: undefined;
};

export type SalesStackParamList = {
  SalesList: undefined;
  SalesDetail: { id: string };
  CreateSale: undefined;
  CustomerList: undefined;
  CustomerDetail: { id: string };
  BarcodeScanner: { onScan: (data: string) => void };
};

// Auth types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
  permissions: string[];
  companyId: string;
  lastLoginAt?: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  biometricEnabled: boolean;
}

// Sync types
export interface SyncState {
  isOnline: boolean;
  lastSyncAt?: Date;
  pendingChanges: number;
  isSyncing: boolean;
  syncProgress: number;
}

export interface SyncableEntity {
  id: string;
  localId?: string;
  lastModified: Date;
  isDeleted: boolean;
  needsSync: boolean;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
}

// Business entities
export interface Customer extends SyncableEntity {
  name: string;
  email?: string;
  phone?: string;
  address?: Address;
  creditLimit?: number;
  balance: number;
  status: 'active' | 'inactive';
}

export interface Product extends SyncableEntity {
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  price: number;
  cost: number;
  stockQuantity: number;
  category?: string;
  images: string[];
  isActive: boolean;
}

export interface SalesOrder extends SyncableEntity {
  orderNumber: string;
  customerId: string;
  customer?: Customer;
  items: SalesOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: Date;
  deliveryDate?: Date;
  notes?: string;
  signature?: string;
}

export interface SalesOrderItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Device features
export interface BarcodeResult {
  type: string;
  data: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

export interface VoiceRecording {
  id: string;
  uri: string;
  duration: number;
  createdAt: Date;
  transcription?: string;
}

export interface DocumentCapture {
  id: string;
  uri: string;
  type: 'image' | 'pdf';
  name: string;
  size: number;
  createdAt: Date;
  metadata?: Record<string, any>;
}

// Notification types
export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  type: 'info' | 'warning' | 'error' | 'success';
  createdAt: Date;
  isRead: boolean;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'select'
    | 'multiselect'
    | 'date'
    | 'time'
    | 'datetime'
    | 'textarea'
    | 'checkbox'
    | 'radio'
    | 'file'
    | 'signature'
    | 'barcode'
    | 'location';
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: any }[];
  validation?: any;
  defaultValue?: any;
}

export interface DynamicForm {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  submitUrl: string;
  method: 'POST' | 'PUT' | 'PATCH';
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};
