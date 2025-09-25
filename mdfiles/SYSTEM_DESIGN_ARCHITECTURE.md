# KIRO ERP - System Design & Architecture

## 1. High-Level Architecture

### 1.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                       │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Web Client    │  Mobile Apps    │     Admin Dashboard         │
│   (Next.js)     │ (React Native)  │      (Next.js)             │
└─────────────────┴─────────────────┴─────────────────────────────┘
                              │
                    ┌─────────────────┐
                    │   API Gateway   │
                    │  (GraphQL)      │
                    └─────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                    NestJS Microservices                         │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│Accounts  │  Sales   │Inventory │   HR     │Projects  │   Mfg    │
│Service   │ Service  │ Service  │ Service  │ Service  │ Service  │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   PostgreSQL    │     Redis       │      Elasticsearch          │
│   (Primary DB)  │   (Cache)       │      (Search)               │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

### 1.2 Microservices Architecture

#### Core Services:

1. **Authentication Service** - User management, JWT, OAuth2
2. **Accounts Service** - Financial management, GL, AP/AR
3. **Sales Service** - CRM, sales orders, quotations
4. **Purchasing Service** - Vendor management, PO, procurement
5. **Inventory Service** - Stock management, warehouses
6. **Manufacturing Service** - BOM, work orders, production
7. **Projects Service** - Project management, tasks, time tracking
8. **HR Service** - Employee management, payroll, attendance
9. **Assets Service** - Asset tracking, depreciation, maintenance
10. **Notification Service** - Email, SMS, push notifications
11. **Reporting Service** - Report generation, analytics
12. **File Service** - Document management, file storage

## 2. Backend Architecture (NestJS + Fastify)

### 2.1 Project Structure

```
apps/api/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.resolver.ts
│   │   │   ├── guards/
│   │   │   ├── strategies/
│   │   │   └── dto/
│   │   ├── accounts/
│   │   │   ├── accounts.module.ts
│   │   │   ├── services/
│   │   │   ├── resolvers/
│   │   │   ├── entities/
│   │   │   └── dto/
│   │   └── [other modules]/
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── utils/
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── app.config.ts
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeds/
│   │   └── schema.ts
│   └── main.ts
├── test/
├── Dockerfile
└── package.json
```

### 2.2 Core Technologies Integration

#### NestJS Configuration

```typescript
// main.ts
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { GraphQLSchemaHost } from "@nestjs/graphql";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
      trustProxy: true,
    })
  );

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    credentials: true,
  });

  // Security headers
  await app.register(require("@fastify/helmet"), {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        scriptSrc: [`'self'`],
        imgSrc: [`'self'`, "data:", "validator.swagger.io"],
      },
    },
  });

  // Rate limiting
  await app.register(require("@fastify/rate-limit"), {
    max: 100,
    timeWindow: "1 minute",
  });

  await app.listen(process.env.PORT || 3001, "0.0.0.0");
}

bootstrap();
```

#### GraphQL Schema Design

```typescript
// GraphQL Schema Structure
type Query {
  # Authentication
  me: User

  # Accounts
  accounts(filter: AccountFilter, pagination: PaginationInput): AccountConnection
  account(id: ID!): Account

  # Sales
  customers(filter: CustomerFilter, pagination: PaginationInput): CustomerConnection
  salesOrders(filter: SalesOrderFilter, pagination: PaginationInput): SalesOrderConnection

  # Inventory
  items(filter: ItemFilter, pagination: PaginationInput): ItemConnection
  stockLevels(warehouseId: ID, itemId: ID): [StockLevel]

  # Manufacturing
  boms(filter: BOMFilter, pagination: PaginationInput): BOMConnection
  workOrders(filter: WorkOrderFilter, pagination: PaginationInput): WorkOrderConnection

  # Projects
  projects(filter: ProjectFilter, pagination: PaginationInput): ProjectConnection
  tasks(filter: TaskFilter, pagination: PaginationInput): TaskConnection

  # HR
  employees(filter: EmployeeFilter, pagination: PaginationInput): EmployeeConnection
  payrollRuns(filter: PayrollFilter, pagination: PaginationInput): PayrollConnection

  # Assets
  assets(filter: AssetFilter, pagination: PaginationInput): AssetConnection

  # Reporting
  financialReports(type: ReportType, period: DateRange): FinancialReport
  dashboardMetrics(dashboard: DashboardType): DashboardMetrics
}

type Mutation {
  # Authentication
  login(input: LoginInput!): AuthPayload
  refreshToken(token: String!): AuthPayload

  # Accounts
  createAccount(input: CreateAccountInput!): Account
  updateAccount(id: ID!, input: UpdateAccountInput!): Account
  createJournalEntry(input: CreateJournalEntryInput!): JournalEntry

  # Sales
  createCustomer(input: CreateCustomerInput!): Customer
  createSalesOrder(input: CreateSalesOrderInput!): SalesOrder
  createInvoice(input: CreateInvoiceInput!): Invoice

  # Inventory
  createItem(input: CreateItemInput!): Item
  createStockEntry(input: CreateStockEntryInput!): StockEntry
  transferStock(input: StockTransferInput!): StockTransfer

  # Manufacturing
  createBOM(input: CreateBOMInput!): BOM
  createWorkOrder(input: CreateWorkOrderInput!): WorkOrder
  startProduction(workOrderId: ID!): WorkOrder

  # Projects
  createProject(input: CreateProjectInput!): Project
  createTask(input: CreateTaskInput!): Task
  logTime(input: TimeLogInput!): TimeEntry

  # HR
  createEmployee(input: CreateEmployeeInput!): Employee
  processPayroll(input: PayrollInput!): PayrollRun
  markAttendance(input: AttendanceInput!): Attendance

  # Assets
  createAsset(input: CreateAssetInput!): Asset
  scheduleDepreciation(assetId: ID!): DepreciationSchedule
}

type Subscription {
  # Real-time updates
  stockLevelChanged(itemId: ID, warehouseId: ID): StockLevel
  orderStatusChanged(orderId: ID!): OrderStatus
  taskUpdated(projectId: ID): Task
  notificationReceived(userId: ID!): Notification
}
```

### 2.3 Database Design (PostgreSQL + DrizzleORM)

#### Schema Structure

```typescript
// database/schema.ts
import {
  pgTable,
  uuid,
  varchar,
  decimal,
  timestamp,
  boolean,
  text,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Core entities
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  abbreviation: varchar("abbreviation", { length: 10 }).notNull(),
  defaultCurrency: varchar("default_currency", { length: 3 }).notNull(),
  country: varchar("country", { length: 100 }),
  taxId: varchar("tax_id", { length: 50 }),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  mfaEnabled: boolean("mfa_enabled").default(false),
  mfaSecret: varchar("mfa_secret", { length: 32 }),
  companyId: uuid("company_id")
    .references(() => companies.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chart of Accounts
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountCode: varchar("account_code", { length: 50 }).notNull(),
  accountName: varchar("account_name", { length: 255 }).notNull(),
  accountType: varchar("account_type", { length: 50 }).notNull(),
  parentAccountId: uuid("parent_account_id").references(() => accounts.id),
  companyId: uuid("company_id")
    .references(() => companies.id)
    .notNull(),
  currency: varchar("currency", { length: 3 }),
  isGroup: boolean("is_group").default(false),
  isActive: boolean("is_active").default(true),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// General Ledger
export const glEntries = pgTable("gl_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id")
    .references(() => accounts.id)
    .notNull(),
  debit: decimal("debit", { precision: 15, scale: 2 }).default("0"),
  credit: decimal("credit", { precision: 15, scale: 2 }).default("0"),
  voucherType: varchar("voucher_type", { length: 50 }).notNull(),
  voucherNo: varchar("voucher_no", { length: 100 }).notNull(),
  postingDate: timestamp("posting_date").notNull(),
  description: text("description"),
  companyId: uuid("company_id")
    .references(() => companies.id)
    .notNull(),
  createdBy: uuid("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Customers
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerCode: varchar("customer_code", { length: 50 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerType: varchar("customer_type", { length: 50 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  creditLimit: decimal("credit_limit", { precision: 15, scale: 2 }),
  paymentTerms: varchar("payment_terms", { length: 50 }),
  companyId: uuid("company_id")
    .references(() => companies.id)
    .notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Items
export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  itemCode: varchar("item_code", { length: 50 }).notNull(),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  itemGroup: varchar("item_group", { length: 100 }),
  uom: varchar("uom", { length: 20 }),
  standardRate: decimal("standard_rate", { precision: 15, scale: 2 }),
  isStockItem: boolean("is_stock_item").default(true),
  isSalesItem: boolean("is_sales_item").default(true),
  isPurchaseItem: boolean("is_purchase_item").default(true),
  hasVariants: boolean("has_variants").default(false),
  companyId: uuid("company_id")
    .references(() => companies.id)
    .notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sales Orders
export const salesOrders = pgTable("sales_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNo: varchar("order_no", { length: 100 }).notNull(),
  customerId: uuid("customer_id")
    .references(() => customers.id)
    .notNull(),
  orderDate: timestamp("order_date").notNull(),
  deliveryDate: timestamp("delivery_date"),
  status: varchar("status", { length: 50 }).default("Draft"),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 3 }),
  companyId: uuid("company_id")
    .references(() => companies.id)
    .notNull(),
  createdBy: uuid("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations
export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  accounts: many(accounts),
  customers: many(customers),
  items: many(items),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  glEntries: many(glEntries),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  company: one(companies, {
    fields: [accounts.companyId],
    references: [companies.id],
  }),
  parentAccount: one(accounts, {
    fields: [accounts.parentAccountId],
    references: [accounts.id],
  }),
  childAccounts: many(accounts),
  glEntries: many(glEntries),
}));
```

### 2.4 Service Layer Architecture

#### Base Service Pattern

```typescript
// common/base.service.ts
import { Injectable } from "@nestjs/common";
import { DrizzleService } from "../database/drizzle.service";
import { RedisService } from "../cache/redis.service";

@Injectable()
export abstract class BaseService<T> {
  constructor(
    protected readonly db: DrizzleService,
    protected readonly cache: RedisService
  ) {}

  abstract create(data: Partial<T>): Promise<T>;
  abstract findById(id: string): Promise<T | null>;
  abstract update(id: string, data: Partial<T>): Promise<T>;
  abstract delete(id: string): Promise<boolean>;
  abstract findMany(filter?: any, pagination?: any): Promise<T[]>;

  protected getCacheKey(prefix: string, id: string): string {
    return `${prefix}:${id}`;
  }

  protected async cacheSet(key: string, value: any, ttl = 3600): Promise<void> {
    await this.cache.set(key, JSON.stringify(value), ttl);
  }

  protected async cacheGet<T>(key: string): Promise<T | null> {
    const cached = await this.cache.get(key);
    return cached ? JSON.parse(cached) : null;
  }
}
```

#### Accounts Service Example

```typescript
// modules/accounts/services/accounts.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { eq, and, desc } from "drizzle-orm";
import { BaseService } from "../../../common/base.service";
import { accounts, glEntries } from "../../../database/schema";
import { CreateAccountDto, UpdateAccountDto, AccountFilter } from "../dto";
import { Account } from "../entities/account.entity";

@Injectable()
export class AccountsService extends BaseService<Account> {
  async create(data: CreateAccountDto): Promise<Account> {
    const [account] = await this.db.db
      .insert(accounts)
      .values({
        ...data,
        accountCode: await this.generateAccountCode(data.accountType),
      })
      .returning();

    await this.updateAccountHierarchy(account.id);
    await this.cacheSet(`account:${account.id}`, account);

    return account;
  }

  async findById(id: string): Promise<Account | null> {
    const cacheKey = `account:${id}`;
    const cached = await this.cacheGet<Account>(cacheKey);

    if (cached) return cached;

    const [account] = await this.db.db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id));

    if (account) {
      await this.cacheSet(cacheKey, account);
    }

    return account || null;
  }

  async update(id: string, data: UpdateAccountDto): Promise<Account> {
    const [account] = await this.db.db
      .update(accounts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();

    if (!account) {
      throw new NotFoundException("Account not found");
    }

    await this.cacheSet(`account:${id}`, account);
    return account;
  }

  async getAccountBalance(accountId: string, asOfDate?: Date): Promise<number> {
    const cacheKey = `balance:${accountId}:${
      asOfDate?.toISOString() || "current"
    }`;
    const cached = await this.cacheGet<number>(cacheKey);

    if (cached !== null) return cached;

    const query = this.db.db
      .select({
        debit: glEntries.debit,
        credit: glEntries.credit,
      })
      .from(glEntries)
      .where(eq(glEntries.accountId, accountId));

    if (asOfDate) {
      query.where(
        and(
          eq(glEntries.accountId, accountId),
          desc(glEntries.postingDate, asOfDate)
        )
      );
    }

    const entries = await query;
    const balance = entries.reduce(
      (sum, entry) => sum + Number(entry.debit) - Number(entry.credit),
      0
    );

    await this.cacheSet(cacheKey, balance, 1800); // 30 minutes cache
    return balance;
  }

  private async generateAccountCode(accountType: string): Promise<string> {
    const prefix = this.getAccountTypePrefix(accountType);
    const count = await this.db.db
      .select({ count: sql`count(*)` })
      .from(accounts)
      .where(eq(accounts.accountType, accountType));

    return `${prefix}${String(count[0].count + 1).padStart(4, "0")}`;
  }

  private getAccountTypePrefix(accountType: string): string {
    const prefixes = {
      Asset: "1",
      Liability: "2",
      Equity: "3",
      Income: "4",
      Expense: "5",
    };
    return prefixes[accountType] || "9";
  }
}
```

### 2.5 GraphQL Resolvers

```typescript
// modules/accounts/resolvers/accounts.resolver.ts
import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Subscription,
} from "@nestjs/graphql";
import { UseGuards, UseInterceptors } from "@nestjs/common";
import { PubSub } from "graphql-subscriptions";
import { AccountsService } from "../services/accounts.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { CacheInterceptor } from "../../../common/interceptors/cache.interceptor";
import { Account } from "../entities/account.entity";
import { CreateAccountDto, UpdateAccountDto, AccountFilter } from "../dto";
import { User } from "../../auth/entities/user.entity";

@Resolver(() => Account)
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountsResolver {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly pubSub: PubSub
  ) {}

  @Query(() => [Account])
  @Roles("accountant", "admin")
  @UseInterceptors(CacheInterceptor)
  async accounts(
    @Args("filter", { nullable: true }) filter?: AccountFilter,
    @Args("limit", { defaultValue: 50 }) limit?: number,
    @Args("offset", { defaultValue: 0 }) offset?: number
  ): Promise<Account[]> {
    return this.accountsService.findMany(filter, { limit, offset });
  }

  @Query(() => Account, { nullable: true })
  @Roles("accountant", "admin", "viewer")
  async account(
    @Args("id", { type: () => ID }) id: string
  ): Promise<Account | null> {
    return this.accountsService.findById(id);
  }

  @Mutation(() => Account)
  @Roles("accountant", "admin")
  async createAccount(
    @Args("input") input: CreateAccountDto,
    @CurrentUser() user: User
  ): Promise<Account> {
    const account = await this.accountsService.create({
      ...input,
      companyId: user.companyId,
    });

    await this.pubSub.publish("accountCreated", { accountCreated: account });
    return account;
  }

  @Mutation(() => Account)
  @Roles("accountant", "admin")
  async updateAccount(
    @Args("id", { type: () => ID }) id: string,
    @Args("input") input: UpdateAccountDto
  ): Promise<Account> {
    const account = await this.accountsService.update(id, input);
    await this.pubSub.publish("accountUpdated", { accountUpdated: account });
    return account;
  }

  @Subscription(() => Account)
  @Roles("accountant", "admin")
  accountCreated() {
    return this.pubSub.asyncIterator("accountCreated");
  }

  @Subscription(() => Account)
  @Roles("accountant", "admin")
  accountUpdated() {
    return this.pubSub.asyncIterator("accountUpdated");
  }
}
```

## 3. Frontend Architecture (Next.js)

### 3.1 Project Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   ├── accounts/
│   │   │   ├── sales/
│   │   │   ├── inventory/
│   │   │   ├── manufacturing/
│   │   │   ├── projects/
│   │   │   ├── hr/
│   │   │   └── assets/
│   │   ├── api/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   ├── charts/
│   │   ├── tables/
│   │   └── layouts/
│   ├── lib/
│   │   ├── apollo/
│   │   ├── auth/
│   │   ├── utils/
│   │   └── validations/
│   ├── hooks/
│   ├── stores/
│   ├── types/
│   └── constants/
├── public/
├── next.config.js
└── package.json
```

### 3.2 State Management with Zustand

```typescript
// stores/auth.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, LoginCredentials } from "../types/auth";
import { authService } from "../lib/auth/auth.service";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const { user, token } = await authService.login(credentials);
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        authService.logout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      refreshToken: async () => {
        try {
          const { token } = await authService.refreshToken();
          set({ token });
        } catch (error) {
          get().logout();
          throw error;
        }
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### 3.3 GraphQL Client Setup

```typescript
// lib/apollo/client.ts
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { createUploadLink } from "apollo-upload-client";
import { useAuthStore } from "../../stores/auth.store";

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:3001/graphql",
});

const uploadLink = createUploadLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:3001/graphql",
});

const authLink = setContext((_, { headers }) => {
  const token = useAuthStore.getState().token;

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const errorLink = onError(
  ({ graphQLErrors, networkError, operation, forward }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) => {
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
        );
      });
    }

    if (networkError) {
      console.error(`[Network error]: ${networkError}`);

      if (networkError.statusCode === 401) {
        useAuthStore.getState().logout();
      }
    }
  }
);

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, uploadLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          accounts: {
            keyArgs: ["filter"],
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "all",
    },
    query: {
      errorPolicy: "all",
    },
  },
});
```

### 3.4 Component Architecture

```typescript
// components/accounts/AccountsList.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { useDebounce } from "../../hooks/useDebounce";
import { DataTable } from "../ui/DataTable";
import { SearchInput } from "../ui/SearchInput";
import { Button } from "../ui/Button";
import { CreateAccountModal } from "./CreateAccountModal";
import { GET_ACCOUNTS } from "../../lib/graphql/accounts.queries";
import { Account, AccountFilter } from "../../types/accounts";

interface AccountsListProps {
  companyId: string;
}

export function AccountsList({ companyId }: AccountsListProps) {
  const [filter, setFilter] = useState<AccountFilter>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data, loading, error, refetch } = useQuery(GET_ACCOUNTS, {
    variables: {
      filter: {
        ...filter,
        companyId,
        search: debouncedSearch,
      },
    },
    errorPolicy: "all",
  });

  const columns = [
    {
      key: "accountCode",
      header: "Account Code",
      sortable: true,
    },
    {
      key: "accountName",
      header: "Account Name",
      sortable: true,
    },
    {
      key: "accountType",
      header: "Type",
      sortable: true,
    },
    {
      key: "balance",
      header: "Balance",
      sortable: true,
      render: (value: number) =>
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(value),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, account: Account) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(account.id)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleView(account.id)}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  const handleEdit = (accountId: string) => {
    // Navigate to edit page or open edit modal
  };

  const handleView = (accountId: string) => {
    // Navigate to account details page
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    refetch();
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-800">Error loading accounts: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Chart of Accounts</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Create Account
        </Button>
      </div>

      <div className="flex space-x-4">
        <SearchInput
          placeholder="Search accounts..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
        {/* Additional filters */}
      </div>

      <DataTable
        data={data?.accounts || []}
        columns={columns}
        loading={loading}
        pagination={{
          page: 1,
          pageSize: 50,
          total: data?.accountsCount || 0,
        }}
      />

      <CreateAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
```

## 4. Mobile Architecture (React Native)

### 4.1 Project Structure

```
apps/mobile/
├── src/
│   ├── components/
│   ├── screens/
│   ├── navigation/
│   ├── services/
│   ├── stores/
│   ├── utils/
│   └── types/
├── assets/
├── app.json
└── package.json
```

### 4.2 Navigation Setup

```typescript
// navigation/AppNavigator.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuthStore } from "../stores/auth.store";
import { AuthNavigator } from "./AuthNavigator";
import { DashboardScreen } from "../screens/DashboardScreen";
import { AccountsScreen } from "../screens/AccountsScreen";
import { SalesScreen } from "../screens/SalesScreen";
import { InventoryScreen } from "../screens/InventoryScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Accounts" component={AccountsScreen} />
      <Tab.Screen name="Sales" component={SalesScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## 5. DevOps & Infrastructure

### 5.1 Docker Configuration

```dockerfile
# apps/api/Dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runtime
COPY --from=build /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

### 5.2 Kubernetes Deployment

```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kiro-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kiro-api
  template:
    metadata:
      labels:
        app: kiro-api
    spec:
      containers:
        - name: api
          image: kiro/api:latest
          ports:
            - containerPort: 3001
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: kiro-secrets
                  key: database-url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: kiro-secrets
                  key: redis-url
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 5
```

This architecture provides a solid foundation for building a modern, scalable ERP system that can handle enterprise-level requirements while maintaining high performance and reliability.
