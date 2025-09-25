# Design Document

## Overview

This document outlines the technical architecture for rebuilding ERPNext using modern technologies. The system will be built with NestJS, Fastify, Drizzle ORM, PostgreSQL, GraphQL, React, and TypeScript to create a high-performance, scalable ERP solution that surpasses the original in every aspect while maintaining complete feature parity.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer (Nginx/HAProxy)            │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────────┐
│                    API Gateway (GraphQL)                        │
│                   Authentication & Rate Limiting                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────────┐
│                    NestJS Application Layer                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │   Accounts  │ │    Stock    │ │Manufacturing│ │     CRM     ││
│  │   Module    │ │   Module    │ │   Module    │ │   Module    ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │   Buying    │ │   Selling   │ │   Projects  │ │     HR      ││
│  │   Module    │ │   Module    │ │   Module    │ │   Module    ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────────┐
│                    Data Access Layer                            │
│                   Drizzle ORM + TypeScript                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────────┐
│                    PostgreSQL Database                          │
│              (Primary + Read Replicas + Sharding)              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Supporting Services                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │    Redis    │ │   BullMQ    │ │   MinIO     │ │ Elasticsearch││
│  │   Cache     │ │   Queue     │ │   Storage   │ │   Search    ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Application                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │   Apollo    │ │   Zustand   │ │   React     │ │   Tailwind  ││
│  │   Client    │ │   Store     │ │   Query     │ │     CSS     ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │   React     │ │   Framer    │ │   React     │ │   Vite      ││
│  │   Router    │ │   Motion    │ │   Hook Form │ │   Build     ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Backend Technologies

| Component     | Technology       | Justification                                                                   |
| ------------- | ---------------- | ------------------------------------------------------------------------------- |
| **Framework** | NestJS + Fastify | High performance, dependency injection, decorators, enterprise-ready            |
| **Database**  | PostgreSQL       | ACID compliance, JSON support, excellent performance, mature ecosystem          |
| **ORM**       | Drizzle ORM      | Type-safe, lightweight, excellent TypeScript integration, performance           |
| **API**       | GraphQL          | Flexible queries, type safety, real-time subscriptions, efficient data fetching |
| **Language**  | TypeScript       | Type safety, better developer experience, compile-time error checking           |
| **Cache**     | Redis            | High performance, pub/sub, session storage, queue management                    |
| **Queue**     | BullMQ           | Reliable job processing, retry mechanisms, dashboard, Redis-based               |
| **Storage**   | MinIO            | S3-compatible, self-hosted, high performance, scalable                          |
| **Search**    | Elasticsearch    | Full-text search, analytics, real-time indexing, scalable                       |

### Frontend Technologies

| Component            | Technology               | Justification                                                             |
| -------------------- | ------------------------ | ------------------------------------------------------------------------- |
| **Framework**        | React 18                 | Mature ecosystem, concurrent features, excellent performance              |
| **State Management** | Zustand                  | Lightweight, TypeScript-first, simple API, excellent performance          |
| **GraphQL Client**   | Apollo Client            | Caching, optimistic updates, subscriptions, developer tools               |
| **Styling**          | Tailwind CSS             | Utility-first, consistent design, excellent performance, customizable     |
| **Forms**            | React Hook Form          | Performance, minimal re-renders, excellent validation, TypeScript support |
| **Animation**        | Framer Motion            | Declarative animations, gesture support, layout animations                |
| **Build Tool**       | Vite                     | Fast development, HMR, excellent TypeScript support, modern               |
| **Testing**          | Vitest + Testing Library | Fast, Jest-compatible, excellent TypeScript support                       |

## Database Design

### Core Schema Architecture

```sql
-- Core system tables
CREATE SCHEMA core;
CREATE SCHEMA accounts;
CREATE SCHEMA stock;
CREATE SCHEMA manufacturing;
CREATE SCHEMA crm;
CREATE SCHEMA buying;
CREATE SCHEMA selling;
CREATE SCHEMA projects;
CREATE SCHEMA hr;

-- Multi-tenancy support
CREATE TABLE core.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    abbr VARCHAR(10) NOT NULL UNIQUE,
    domain VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dynamic DocType system
CREATE TABLE core.doctypes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(140) NOT NULL UNIQUE,
    module VARCHAR(100) NOT NULL,
    is_submittable BOOLEAN DEFAULT FALSE,
    is_child_table BOOLEAN DEFAULT FALSE,
    track_changes BOOLEAN DEFAULT TRUE,
    allow_rename BOOLEAN DEFAULT FALSE,
    schema_definition JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom fields support
CREATE TABLE core.custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctype VARCHAR(140) NOT NULL,
    fieldname VARCHAR(140) NOT NULL,
    fieldtype VARCHAR(50) NOT NULL,
    label VARCHAR(255),
    options TEXT,
    is_required BOOLEAN DEFAULT FALSE,
    is_unique BOOLEAN DEFAULT FALSE,
    default_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(doctype, fieldname)
);

-- User management
CREATE TABLE core.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(140) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    password_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_system_user BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role-based access control
CREATE TABLE core.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(140) NOT NULL UNIQUE,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE core.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES core.roles(id) ON DELETE CASCADE,
    company_id UUID REFERENCES core.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_id, company_id)
);

-- Document permissions
CREATE TABLE core.document_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctype VARCHAR(140) NOT NULL,
    role_id UUID NOT NULL REFERENCES core.roles(id) ON DELETE CASCADE,
    can_read BOOLEAN DEFAULT FALSE,
    can_write BOOLEAN DEFAULT FALSE,
    can_create BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_submit BOOLEAN DEFAULT FALSE,
    can_cancel BOOLEAN DEFAULT FALSE,
    can_amend BOOLEAN DEFAULT FALSE,
    conditions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Accounts Module Schema

```sql
-- Chart of Accounts
CREATE TABLE accounts.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50),
    account_type VARCHAR(50) NOT NULL,
    root_type VARCHAR(50) NOT NULL,
    parent_account UUID REFERENCES accounts.accounts(id),
    company_id UUID NOT NULL REFERENCES core.companies(id),
    currency VARCHAR(3) DEFAULT 'USD',
    is_group BOOLEAN DEFAULT FALSE,
    lft INTEGER,
    rgt INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- General Ledger
CREATE TABLE accounts.gl_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    posting_date DATE NOT NULL,
    account_id UUID NOT NULL REFERENCES accounts.accounts(id),
    debit DECIMAL(18,6) DEFAULT 0,
    credit DECIMAL(18,6) DEFAULT 0,
    against_voucher_type VARCHAR(140),
    against_voucher_no VARCHAR(140),
    voucher_type VARCHAR(140) NOT NULL,
    voucher_no VARCHAR(140) NOT NULL,
    cost_center_id UUID,
    project_id UUID,
    party_type VARCHAR(140),
    party_id UUID,
    company_id UUID NOT NULL REFERENCES core.companies(id),
    remarks TEXT,
    is_cancelled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes for performance
    INDEX idx_gl_posting_date (posting_date),
    INDEX idx_gl_account (account_id),
    INDEX idx_gl_voucher (voucher_type, voucher_no),
    INDEX idx_gl_company (company_id)
);

-- Sales Invoice
CREATE TABLE accounts.sales_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    naming_series VARCHAR(50) NOT NULL,
    customer_id UUID NOT NULL,
    posting_date DATE NOT NULL,
    due_date DATE,
    currency VARCHAR(3) DEFAULT 'USD',
    conversion_rate DECIMAL(18,6) DEFAULT 1,
    total DECIMAL(18,6) DEFAULT 0,
    net_total DECIMAL(18,6) DEFAULT 0,
    total_taxes_and_charges DECIMAL(18,6) DEFAULT 0,
    grand_total DECIMAL(18,6) DEFAULT 0,
    outstanding_amount DECIMAL(18,6) DEFAULT 0,
    paid_amount DECIMAL(18,6) DEFAULT 0,
    docstatus INTEGER DEFAULT 0, -- 0=Draft, 1=Submitted, 2=Cancelled
    company_id UUID NOT NULL REFERENCES core.companies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    INDEX idx_si_customer (customer_id),
    INDEX idx_si_posting_date (posting_date),
    INDEX idx_si_company (company_id)
);

-- Sales Invoice Items
CREATE TABLE accounts.sales_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES accounts.sales_invoices(id) ON DELETE CASCADE,
    item_code VARCHAR(140) NOT NULL,
    item_name VARCHAR(255),
    description TEXT,
    qty DECIMAL(18,6) NOT NULL,
    rate DECIMAL(18,6) NOT NULL,
    amount DECIMAL(18,6) NOT NULL,
    warehouse_id UUID,
    cost_center_id UUID,
    project_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Stock Module Schema

```sql
-- Items
CREATE TABLE stock.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code VARCHAR(140) NOT NULL UNIQUE,
    item_name VARCHAR(255) NOT NULL,
    item_group_id UUID NOT NULL,
    stock_uom VARCHAR(50) NOT NULL,
    is_stock_item BOOLEAN DEFAULT TRUE,
    is_sales_item BOOLEAN DEFAULT TRUE,
    is_purchase_item BOOLEAN DEFAULT TRUE,
    has_serial_no BOOLEAN DEFAULT FALSE,
    has_batch_no BOOLEAN DEFAULT FALSE,
    valuation_rate DECIMAL(18,6) DEFAULT 0,
    standard_rate DECIMAL(18,6) DEFAULT 0,
    description TEXT,
    image VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Warehouses
CREATE TABLE stock.warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_name VARCHAR(255) NOT NULL,
    warehouse_type VARCHAR(50),
    parent_warehouse UUID REFERENCES stock.warehouses(id),
    company_id UUID NOT NULL REFERENCES core.companies(id),
    is_group BOOLEAN DEFAULT FALSE,
    lft INTEGER,
    rgt INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, warehouse_name)
);

-- Stock Ledger Entry
CREATE TABLE stock.stock_ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    posting_date DATE NOT NULL,
    posting_time TIME NOT NULL,
    item_code VARCHAR(140) NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES stock.warehouses(id),
    voucher_type VARCHAR(140) NOT NULL,
    voucher_no VARCHAR(140) NOT NULL,
    actual_qty DECIMAL(18,6) DEFAULT 0,
    qty_after_transaction DECIMAL(18,6) DEFAULT 0,
    incoming_rate DECIMAL(18,6) DEFAULT 0,
    valuation_rate DECIMAL(18,6) DEFAULT 0,
    stock_value DECIMAL(18,6) DEFAULT 0,
    stock_value_difference DECIMAL(18,6) DEFAULT 0,
    company_id UUID NOT NULL REFERENCES core.companies(id),
    is_cancelled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    INDEX idx_sle_item_warehouse (item_code, warehouse_id),
    INDEX idx_sle_posting_date (posting_date),
    INDEX idx_sle_voucher (voucher_type, voucher_no)
);

-- Bin (Current Stock)
CREATE TABLE stock.bins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code VARCHAR(140) NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES stock.warehouses(id),
    actual_qty DECIMAL(18,6) DEFAULT 0,
    planned_qty DECIMAL(18,6) DEFAULT 0,
    indented_qty DECIMAL(18,6) DEFAULT 0,
    ordered_qty DECIMAL(18,6) DEFAULT 0,
    reserved_qty DECIMAL(18,6) DEFAULT 0,
    projected_qty DECIMAL(18,6) DEFAULT 0,
    valuation_rate DECIMAL(18,6) DEFAULT 0,
    stock_value DECIMAL(18,6) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(item_code, warehouse_id)
);
```

## API Design

### GraphQL Schema

```graphql
# Core Types
scalar DateTime
scalar Decimal
scalar JSON

type Query {
  # Document queries
  document(doctype: String!, name: String!): Document
  documents(
    doctype: String!
    filters: JSON
    limit: Int
    offset: Int
  ): DocumentConnection

  # Accounts
  salesInvoices(
    filters: SalesInvoiceFilters
    pagination: PaginationInput
  ): SalesInvoiceConnection
  salesInvoice(id: ID!): SalesInvoice

  # Stock
  items(filters: ItemFilters, pagination: PaginationInput): ItemConnection
  item(id: ID!): Item
  stockLedger(filters: StockLedgerFilters): [StockLedgerEntry]

  # Reports
  report(name: String!, filters: JSON): ReportResult
}

type Mutation {
  # Document mutations
  createDocument(doctype: String!, data: JSON!): Document
  updateDocument(doctype: String!, name: String!, data: JSON!): Document
  submitDocument(doctype: String!, name: String!): Document
  cancelDocument(doctype: String!, name: String!): Document

  # Authentication
  login(email: String!, password: String!): AuthPayload
  refreshToken(token: String!): AuthPayload

  # Sales Invoice
  createSalesInvoice(input: CreateSalesInvoiceInput!): SalesInvoice
  updateSalesInvoice(id: ID!, input: UpdateSalesInvoiceInput!): SalesInvoice
  submitSalesInvoice(id: ID!): SalesInvoice
}

type Subscription {
  documentUpdated(doctype: String!, name: String!): Document
  stockUpdated(itemCode: String!, warehouse: String!): StockUpdate
}

# Document System
interface Document {
  id: ID!
  name: String!
  doctype: String!
  docstatus: Int!
  owner: User!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type SalesInvoice implements Document {
  id: ID!
  name: String!
  doctype: String!
  docstatus: Int!
  owner: User!
  createdAt: DateTime!
  updatedAt: DateTime!

  # Sales Invoice specific fields
  customer: Customer!
  postingDate: DateTime!
  dueDate: DateTime
  currency: String!
  total: Decimal!
  grandTotal: Decimal!
  outstandingAmount: Decimal!
  items: [SalesInvoiceItem!]!
  taxes: [SalesTaxesAndCharges!]!
}

type Item {
  id: ID!
  itemCode: String!
  itemName: String!
  itemGroup: ItemGroup!
  stockUom: String!
  isStockItem: Boolean!
  valuationRate: Decimal!
  currentStock: [Bin!]!
}
```

### REST API Endpoints (Fallback)

```typescript
// Core document endpoints
GET    /api/v1/:doctype                    // List documents
POST   /api/v1/:doctype                    // Create document
GET    /api/v1/:doctype/:name              // Get document
PUT    /api/v1/:doctype/:name              // Update document
DELETE /api/v1/:doctype/:name              // Delete document
POST   /api/v1/:doctype/:name/submit       // Submit document
POST   /api/v1/:doctype/:name/cancel       // Cancel document

// Authentication
POST   /api/v1/auth/login                  // Login
POST   /api/v1/auth/refresh                // Refresh token
POST   /api/v1/auth/logout                 // Logout

// Reports
GET    /api/v1/reports/:report_name        // Generate report
POST   /api/v1/reports/:report_name/export // Export report

// File uploads
POST   /api/v1/files/upload                // Upload file
GET    /api/v1/files/:file_id              // Download file

// Bulk operations
POST   /api/v1/bulk/import                 // Bulk import
POST   /api/v1/bulk/export                 // Bulk export
```

## Service Architecture

### Core Services

```typescript
// Document Service - Handles all document operations
@Injectable()
export class DocumentService {
  async create(doctype: string, data: any, user: User): Promise<Document> {
    // Validate permissions
    // Apply business rules
    // Save to database
    // Trigger workflows
    // Send notifications
  }

  async update(
    doctype: string,
    name: string,
    data: any,
    user: User
  ): Promise<Document> {
    // Check edit permissions
    // Validate changes
    // Update database
    // Maintain audit trail
  }

  async submit(doctype: string, name: string, user: User): Promise<Document> {
    // Validate submission rules
    // Update status
    // Create GL entries (if applicable)
    // Update stock (if applicable)
    // Send notifications
  }
}

// Permission Service - Handles all authorization
@Injectable()
export class PermissionService {
  async hasPermission(
    user: User,
    doctype: string,
    action: string,
    doc?: any
  ): Promise<boolean> {
    // Check role permissions
    // Apply document-level rules
    // Check field-level permissions
    // Apply custom conditions
  }

  async getPermittedDocuments(
    user: User,
    doctype: string,
    filters: any
  ): Promise<any[]> {
    // Apply user-specific filters
    // Respect sharing rules
    // Handle company restrictions
  }
}

// Workflow Service - Handles approval workflows
@Injectable()
export class WorkflowService {
  async processWorkflow(
    document: Document,
    action: string,
    user: User
  ): Promise<void> {
    // Get workflow definition
    // Validate transition
    // Update workflow state
    // Send notifications
    // Trigger next actions
  }
}
```

### Module-Specific Services

```typescript
// Accounting Service
@Injectable()
export class AccountingService {
  async createGLEntries(document: any): Promise<GLEntry[]> {
    // Generate accounting entries
    // Handle multi-currency
    // Apply cost center allocation
    // Validate double-entry rules
  }

  async calculateTaxes(document: any): Promise<TaxBreakup[]> {
    // Apply tax rules
    // Handle inclusive/exclusive taxes
    // Calculate withholding taxes
    // Support multi-jurisdiction
  }
}

// Stock Service
@Injectable()
export class StockService {
  async updateStock(stockEntry: StockEntry): Promise<void> {
    // Update stock ledger
    // Recalculate valuation
    // Update bin quantities
    // Handle serial/batch numbers
  }

  async getStockBalance(
    itemCode: string,
    warehouse?: string
  ): Promise<StockBalance[]> {
    // Calculate current stock
    // Apply FIFO/LIFO rules
    // Include reserved quantities
  }
}

// Manufacturing Service
@Injectable()
export class ManufacturingService {
  async explodeBOM(bomNo: string, qty: number): Promise<BOMExplosion> {
    // Calculate material requirements
    // Handle multi-level BOMs
    // Apply scrap percentages
    // Calculate costs
  }

  async planProduction(items: ProductionItem[]): Promise<ProductionPlan> {
    // Check capacity
    // Schedule work orders
    // Allocate resources
    // Generate material requests
  }
}
```

## Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── ui/                     # Reusable UI components
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── DataTable/
│   ├── forms/                  # Form components
│   │   ├── DocumentForm/
│   │   ├── FieldRenderer/
│   │   └── ValidationProvider/
│   └── layout/                 # Layout components
│       ├── Header/
│       ├── Sidebar/
│       └── Workspace/
├── modules/                    # Business modules
│   ├── accounts/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── types/
│   ├── stock/
│   └── manufacturing/
├── shared/                     # Shared utilities
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   └── constants/
├── store/                      # State management
│   ├── auth/
│   ├── documents/
│   └── ui/
└── graphql/                    # GraphQL operations
    ├── queries/
    ├── mutations/
    └── subscriptions/
```

### State Management

```typescript
// Zustand store for global state
interface AppState {
  // Authentication
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;

  // UI State
  sidebarOpen: boolean;
  theme: "light" | "dark";
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark") => void;

  // Document State
  currentDocument: Document | null;
  setCurrentDocument: (doc: Document) => void;

  // Company Context
  currentCompany: Company | null;
  setCurrentCompany: (company: Company) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Implementation
}));

// Apollo Client setup
const client = new ApolloClient({
  uri: "/graphql",
  cache: new InMemoryCache({
    typePolicies: {
      Document: {
        keyFields: ["doctype", "name"],
      },
    },
  }),
  link: from([authLink, errorLink, httpLink]),
});
```

### Key Components

```typescript
// Document Form Component
interface DocumentFormProps {
  doctype: string;
  name?: string;
  onSave?: (document: Document) => void;
  onSubmit?: (document: Document) => void;
}

export const DocumentForm: React.FC<DocumentFormProps> = ({
  doctype,
  name,
  onSave,
  onSubmit,
}) => {
  const { data: document, loading } = useDocumentQuery({
    variables: { doctype, name },
    skip: !name,
  });

  const [updateDocument] = useUpdateDocumentMutation();
  const [submitDocument] = useSubmitDocumentMutation();

  const form = useForm({
    defaultValues: document,
    resolver: zodResolver(getDocumentSchema(doctype)),
  });

  // Implementation
};

// Data Table Component
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  pagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  onRowClick?: (row: T) => void;
}

export const DataTable = <T>({
  data,
  columns,
  loading,
  pagination,
  onPaginationChange,
  onRowClick,
}: DataTableProps<T>) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // Implementation
  });

  // Render implementation
};
```

## Security Architecture

### Authentication Flow

```typescript
// JWT-based authentication
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  async login(email: string, password: string): Promise<AuthTokens> {
    // Validate credentials
    // Generate JWT tokens
    // Store refresh token
    // Return tokens
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // Validate refresh token
    // Generate new access token
    // Rotate refresh token
    // Return new tokens
  }

  async validateToken(token: string): Promise<User> {
    // Verify JWT signature
    // Check expiration
    // Load user data
    // Return user
  }
}

// Permission-based guards
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      "permissions",
      context.getHandler()
    );

    if (!requiredPermissions) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return this.permissionService.hasPermissions(user, requiredPermissions);
  }
}
```

### Data Security

```typescript
// Row-level security
@Injectable()
export class TenancyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Add company filter to all queries
    if (user?.currentCompany) {
      request.companyFilter = { company_id: user.currentCompany.id };
    }

    return next.handle();
  }
}

// Field-level encryption
@Injectable()
export class EncryptionService {
  async encrypt(data: string): Promise<string> {
    // Encrypt sensitive data
  }

  async decrypt(encryptedData: string): Promise<string> {
    // Decrypt sensitive data
  }
}
```

## Performance Optimization

### Database Optimization

```sql
-- Strategic indexes for performance
CREATE INDEX CONCURRENTLY idx_gl_entries_performance
ON accounts.gl_entries (company_id, posting_date, account_id);

CREATE INDEX CONCURRENTLY idx_stock_ledger_performance
ON stock.stock_ledger_entries (item_code, warehouse_id, posting_date);

CREATE INDEX CONCURRENTLY idx_sales_invoice_customer_date
ON accounts.sales_invoices (customer_id, posting_date)
WHERE docstatus = 1;

-- Partitioning for large tables
CREATE TABLE accounts.gl_entries_y2024 PARTITION OF accounts.gl_entries
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### Caching Strategy

```typescript
// Redis caching service
@Injectable()
export class CacheService {
  constructor(@Inject("REDIS_CLIENT") private redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Cache decorator
export const Cacheable = (ttl: number = 3600) => {
  return (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) => {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${
        target.constructor.name
      }:${propertyName}:${JSON.stringify(args)}`;

      let result = await this.cacheService.get(cacheKey);
      if (!result) {
        result = await method.apply(this, args);
        await this.cacheService.set(cacheKey, result, ttl);
      }

      return result;
    };
  };
};
```

### Query Optimization

```typescript
// DataLoader for N+1 problem resolution
@Injectable()
export class DataLoaderService {
  private customerLoader = new DataLoader(async (ids: string[]) => {
    const customers = await this.customerRepository.findByIds(ids);
    return ids.map((id) => customers.find((c) => c.id === id));
  });

  async loadCustomer(id: string): Promise<Customer> {
    return this.customerLoader.load(id);
  }
}

// Efficient pagination
@Injectable()
export class PaginationService {
  async paginate<T>(
    query: SelectQueryBuilder<T>,
    options: PaginationOptions
  ): Promise<PaginationResult<T>> {
    const [items, total] = await Promise.all([
      query.limit(options.limit).offset(options.offset).getMany(),
      query.getCount(),
    ]);

    return {
      items,
      total,
      page: Math.floor(options.offset / options.limit) + 1,
      pages: Math.ceil(total / options.limit),
    };
  }
}
```

## Deployment Architecture

### Docker Configuration

```dockerfile
# Backend Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]

# Frontend Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Kubernetes Configuration

```yaml
# Backend deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: erpnext-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: erpnext-backend
  template:
    metadata:
      labels:
        app: erpnext-backend
    spec:
      containers:
        - name: backend
          image: erpnext-backend:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: database-secret
                  key: url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: redis-secret
                  key: url
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5

---
# Service
apiVersion: v1
kind: Service
metadata:
  name: erpnext-backend-service
spec:
  selector:
    app: erpnext-backend
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP

---
# Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: erpnext-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - api.erpnext.com
      secretName: erpnext-tls
  rules:
    - host: api.erpnext.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: erpnext-backend-service
                port:
                  number: 80
```

### Monitoring & Observability

```typescript
// Health check endpoints
@Controller("health")
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly databaseHealthIndicator: DatabaseHealthIndicator,
    private readonly redisHealthIndicator: RedisHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.healthCheckService.check([
      () => this.databaseHealthIndicator.pingCheck("database"),
      () => this.redisHealthIndicator.pingCheck("redis"),
    ]);
  }
}

// Metrics collection
@Injectable()
export class MetricsService {
  private readonly httpRequestDuration = new Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status"],
  });

  recordHttpRequest(
    method: string,
    route: string,
    status: number,
    duration: number
  ) {
    this.httpRequestDuration
      .labels(method, route, status.toString())
      .observe(duration);
  }
}
```

This completes the comprehensive design document. The architecture provides a solid foundation for building a high-performance, scalable ERP system that surpasses ERPNext while maintaining complete feature parity.
