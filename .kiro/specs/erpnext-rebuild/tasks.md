# ERPNext Rebuild Implementation Tasks

## Overview

This document provides a comprehensive, step-by-step implementation plan for rebuilding ERPNext using modern technologies (NestJS, Fastify, Drizzle ORM, PostgreSQL, GraphQL, React, TypeScript). Each task builds incrementally on previous ones, creating a fully functional ERP system that matches and exceeds the original ERPNext capabilities.

## Core Principles

- **Incremental Building**: Each task builds on previous ones
- **Responsive Implementation**: Tasks produce working, testable code
- **High-Level Architecture**: Focus on system-level implementation
- **Complete Feature Parity**: Implement all ERPNext modules and features
- **Modern Technology Stack**: Leverage NestJS, GraphQL, React for superior performance

---

## Phase 1: Foundation & Core Infrastructure

### Task 1: Initialize Modern NestJS Project with Complete Development Environment

**Priority:** Critical  
**Dependencies:** None  
**Requirements:** 1.1, 1.2, 1.3, 1.4, 1.5

Create a production-ready NestJS application with Fastify, complete development environment, and all necessary tooling for building a modern ERP system.

- Initialize NestJS project with Fastify adapter for optimal performance
- Configure TypeScript with strict settings and path mapping
- Set up Docker development environment with PostgreSQL, Redis, and hot reload
- Configure ESLint, Prettier, Jest for code quality and testing
- Create environment configuration system with validation
- Set up logging with structured output and correlation IDs
- Configure health checks and monitoring endpoints
- _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

### Task 2: Implement Database Layer with Drizzle ORM and Core Schema

**Priority:** Critical  
**Dependencies:** Task 1  
**Requirements:** 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8

Build the complete database foundation with type-safe ORM, migrations, and core ERPNext schema structure.

- Install and configure Drizzle ORM with PostgreSQL connection pooling
- Create comprehensive database schema for all ERPNext modules (accounts, stock, manufacturing, etc.)
- Implement migration system with rollback capabilities
- Set up database connection management with proper error handling
- Create core tables: companies, users, doctypes, custom_fields, roles, permissions
- Implement multi-tenancy support with company-based data isolation
- Add database indexes for performance optimization
- Create database seeding system for initial data
- _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

### Task 3: Build Authentication & Authorization System

**Priority:** Critical  
**Dependencies:** Task 2  
**Requirements:** 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8

Implement comprehensive authentication and role-based authorization system matching ERPNext's security model.

- Create JWT-based authentication with access and refresh tokens
- Implement password hashing with bcrypt and security best practices
- Build role-based access control (RBAC) system
- Create permission guards for document-level and field-level access
- Implement multi-factor authentication support
- Add session management with device tracking
- Create user management with profile and preferences
- Build API key authentication for integrations
- _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

### Task 4: Create GraphQL API Layer with Type Safety

**Priority:** High  
**Dependencies:** Task 3  
**Requirements:** 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8

Build a complete GraphQL API layer with resolvers, subscriptions, and DataLoader for efficient data fetching.

- Configure GraphQL with Apollo Server and auto-schema generation
- Create base GraphQL types and interfaces for all ERPNext entities
- Implement DataLoader for solving N+1 query problems
- Build GraphQL resolvers with authentication and authorization
- Add GraphQL subscriptions for real-time updates
- Create input validation and error handling
- Implement field-level permissions in GraphQL
- Add GraphQL playground and introspection for development
- _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

### Task 5: Implement Core Document System

**Priority:** Critical  
**Dependencies:** Task 4  
**Requirements:** 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8

Create the foundational document management system that powers all ERPNext modules.

- Build dynamic document service supporting 500+ document types
- Implement document lifecycle management (Draft/Submitted/Cancelled)
- Create custom fields system with runtime field additions
- Build naming series system for document numbering
- Implement document validation and business rules engine
- Create audit trail system for tracking all changes
- Build document linking and relationship management
- Add workflow system for approval processes
- _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

---

## Phase 2: Core Business Modules

### Task 6: Build Complete Accounts Module

**Priority:** Critical  
**Dependencies:** Task 5  
**Requirements:** 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8

Implement the complete accounting system with double-entry bookkeeping, multi-currency support, and comprehensive financial management.

- Create Chart of Accounts with hierarchical structure
- Implement double-entry bookkeeping with automatic GL entries
- Build multi-currency support with real-time exchange rates
- Create comprehensive tax calculation engine
- Implement Sales Invoice, Purchase Invoice, Payment Entry documents
- Build Journal Entry system for manual accounting entries
- Create Bank Reconciliation and Payment Reconciliation tools
- Implement Cost Center and Project accounting
- Add financial reports (P&L, Balance Sheet, Cash Flow)
- _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

### Task 7: Implement Stock Management System

**Priority:** Critical  
**Dependencies:** Task 6  
**Requirements:** 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8

Build comprehensive inventory management with real-time tracking, multiple valuation methods, and warehouse management.

- Create Item master with variants, UOM, and pricing
- Implement multi-warehouse stock management
- Build Stock Ledger Entry system for real-time tracking
- Create Bin system for current stock balances
- Implement FIFO, LIFO, and Moving Average valuation methods
- Build Serial Number and Batch tracking systems
- Create Stock Entry for all stock movements
- Implement automatic reorder point calculations
- Add stock reconciliation and audit tools
- _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

### Task 8: Build Manufacturing Module

**Priority:** High  
**Dependencies:** Task 7  
**Requirements:** 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8

Create comprehensive manufacturing capabilities with BOM management, production planning, and shop floor control.

- Implement Bill of Materials (BOM) with multi-level support
- Create Work Order system for production management
- Build Material Requirement Planning (MRP) engine
- Implement Job Card system for shop floor operations
- Create Production Planning tools with capacity management
- Build Subcontracting management system
- Implement Quality Control integration
- Add manufacturing analytics and reporting
- _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

### Task 9: Create Sales & CRM Module

**Priority:** High  
**Dependencies:** Task 8  
**Requirements:** 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8

Build complete sales management and CRM system with lead tracking, opportunity management, and sales analytics.

- Create Lead and Opportunity management system
- Implement Customer master with 360-degree view
- Build Quotation system with professional templates
- Create Sales Order management with workflow
- Implement dynamic pricing rules and discount system
- Build territory and sales team management
- Create sales analytics and forecasting tools
- Add customer portal for self-service
- _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

### Task 10: Implement Purchasing Module

**Priority:** High  
**Dependencies:** Task 9  
**Requirements:** 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8

Create comprehensive procurement system with supplier management, RFQ processes, and purchase analytics.

- Build Supplier master with evaluation and scorecards
- Implement Request for Quotation (RFQ) system
- Create Purchase Order management with approvals
- Build Purchase Receipt and quality inspection
- Implement blanket orders and rate contracts
- Create procurement analytics and reporting
- Add supplier portal for collaboration
- Build landed cost calculation system
- _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

---

## Phase 3: Extended Modules & Features

### Task 11: Build Project Management Module

**Priority:** Medium  
**Dependencies:** Task 10  
**Requirements:** 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8

Implement comprehensive project management with Gantt charts, resource planning, and project costing.

- Create Project master with hierarchical structure
- Implement Task management with dependencies
- Build Gantt chart visualization and planning
- Create Timesheet system for time tracking
- Implement resource allocation and planning
- Build project costing and profitability analysis
- Create project billing and invoicing
- Add project collaboration tools
- _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

### Task 12: Implement Human Resources Module

**Priority:** Medium  
**Dependencies:** Task 11  
**Requirements:** 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8

Build complete HR management system with payroll, attendance, and performance management.

- Create Employee master with complete lifecycle
- Implement Attendance tracking with biometric integration
- Build Leave Management with configurable policies
- Create Payroll system with complex calculations
- Implement Performance Appraisal system
- Build Recruitment and hiring workflows
- Create Training and development tracking
- Add HR analytics and reporting
- _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_

### Task 13: Create Point of Sale (POS) System

**Priority:** Medium  
**Dependencies:** Task 12  
**Requirements:** 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8

Build modern POS system with offline capabilities and multi-location support.

- Create fast, intuitive POS interface
- Implement offline-first architecture with sync
- Build multi-payment method support
- Create customer loyalty program integration
- Implement barcode scanning and receipt printing
- Build cashier management and shift reporting
- Create inventory sync across locations
- Add POS analytics and reporting
- _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

---

## Phase 4: Advanced Features & Integration

### Task 14: Build Reporting & Analytics Engine

**Priority:** High  
**Dependencies:** Task 13  
**Requirements:** 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8

Create comprehensive reporting system with 200+ standard reports and custom report builder.

- Implement 200+ standard ERPNext reports
- Build visual report builder with drag-and-drop
- Create real-time dashboards and KPI tracking
- Implement data export in multiple formats
- Build automated report scheduling and distribution
- Create interactive data exploration tools
- Add advanced analytics with charts and graphs
- Implement report sharing and collaboration
- _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_

### Task 15: Implement Integration & API Framework

**Priority:** High  
**Dependencies:** Task 14  
**Requirements:** 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8

Build comprehensive integration capabilities with REST APIs, webhooks, and third-party connectors.

- Create complete REST API alongside GraphQL
- Implement webhook system for real-time notifications
- Build bulk import/export capabilities
- Create API rate limiting and security
- Implement common business integrations (payment gateways, shipping, etc.)
- Build comprehensive API documentation
- Create API versioning and backward compatibility
- Add integration monitoring and error handling
- _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8_

### Task 16: Create Mobile & Cross-Platform Support

**Priority:** Medium  
**Dependencies:** Task 15  
**Requirements:** 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8

Build responsive web interface with mobile-first design and offline capabilities.

- Create responsive React frontend with mobile optimization
- Implement offline-first architecture with service workers
- Build touch-optimized interfaces for mobile devices
- Create camera integration for barcode scanning and document capture
- Implement push notifications for mobile
- Build seamless online/offline synchronization
- Create mobile-specific workflows and shortcuts
- Add progressive web app (PWA) capabilities
- _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8_

---

## Phase 5: Performance, Security & Deployment

### Task 17: Implement Performance Optimization

**Priority:** High  
**Dependencies:** Task 16  
**Requirements:** 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8

Optimize system performance to handle enterprise workloads with sub-second response times.

- Implement intelligent caching strategies with Redis
- Optimize database queries with proper indexing
- Build auto-scaling capabilities with load balancing
- Implement CDN integration for static assets
- Create database query optimization and monitoring
- Build performance monitoring and alerting
- Implement memory and CPU optimization
- Add performance testing and benchmarking
- _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8_

### Task 18: Build Security & Compliance Framework

**Priority:** Critical  
**Dependencies:** Task 17  
**Requirements:** 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8

Implement enterprise-grade security with encryption, audit logging, and compliance features.

- Implement encryption at rest and in transit
- Build comprehensive audit logging system
- Create multi-factor authentication support
- Implement IP whitelisting and VPN access
- Build automated backup and recovery system
- Create security scanning and vulnerability management
- Implement GDPR, SOX, and industry compliance features
- Add security monitoring and threat detection
- _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8_

### Task 19: Create Deployment & DevOps Infrastructure

**Priority:** High  
**Dependencies:** Task 18  
**Requirements:** 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8

Build modern deployment pipeline with containerization, orchestration, and monitoring.

- Create Docker containerization for all services
- Implement Kubernetes deployment with auto-scaling
- Build CI/CD pipeline with automated testing
- Create zero-downtime deployment strategies
- Implement comprehensive system monitoring
- Build automatic failover and recovery
- Create environment-based configuration management
- Add deployment automation and infrastructure as code
- _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8_

---

## Phase 6: Frontend & User Experience

### Task 20: Build Modern React Frontend

**Priority:** Critical  
**Dependencies:** Task 19  
**Requirements:** All frontend requirements

Create a modern, responsive React frontend that provides superior user experience compared to the original ERPNext.

- Build React application with TypeScript and Vite
- Implement Apollo Client for GraphQL integration
- Create responsive design with Tailwind CSS
- Build reusable component library
- Implement state management with Zustand
- Create form handling with React Hook Form
- Build data tables with sorting, filtering, and pagination
- Add animations and transitions with Framer Motion
- Create dark/light theme support
- Implement keyboard shortcuts and accessibility
- _Requirements: All UI/UX requirements_

### Task 21: Implement Advanced UI Components

**Priority:** High  
**Dependencies:** Task 20  
**Requirements:** All UI requirements

Build sophisticated UI components that match and exceed ERPNext's functionality.

- Create dynamic form builder for all document types
- Build advanced data grid with inline editing
- Implement Gantt chart component for project management
- Create dashboard builder with drag-and-drop widgets
- Build calendar component with multiple views
- Implement file upload with drag-and-drop
- Create advanced search with filters and facets
- Build notification system with real-time updates
- _Requirements: All UI component requirements_

### Task 22: Create Workspace & Navigation System

**Priority:** High  
**Dependencies:** Task 21  
**Requirements:** All navigation requirements

Build intuitive workspace and navigation system for efficient user workflows.

- Create customizable workspace with modules and shortcuts
- Build intelligent navigation with breadcrumbs and history
- Implement global search across all documents
- Create quick actions and command palette
- Build customizable sidebar with favorites
- Implement role-based menu system
- Create workspace personalization and preferences
- Add keyboard navigation and shortcuts
- _Requirements: All navigation requirements_

---

## Phase 7: Testing & Quality Assurance

### Task 23: Implement Comprehensive Testing Suite

**Priority:** Critical  
**Dependencies:** Task 22  
**Requirements:** All testing requirements

Build comprehensive testing infrastructure to ensure system reliability and quality.

- Create unit tests for all services and components
- Implement integration tests for API endpoints
- Build end-to-end tests for critical user workflows
- Create performance tests for load and stress testing
- Implement security tests for vulnerability scanning
- Build automated testing pipeline with CI/CD
- Create test data management and fixtures
- Add code coverage reporting and quality gates
- _Requirements: All testing requirements_

### Task 24: Build Data Migration & Import System

**Priority:** High  
**Dependencies:** Task 23  
**Requirements:** Migration requirements

Create comprehensive data migration tools to import existing ERPNext data.

- Build data migration framework for ERPNext imports
- Create mapping tools for schema differences
- Implement data validation and cleansing
- Build incremental migration with rollback capabilities
- Create migration monitoring and progress tracking
- Implement data integrity verification
- Build custom field migration support
- Add migration documentation and guides
- _Requirements: Migration and import requirements_

### Task 25: Final Integration & System Testing

**Priority:** Critical  
**Dependencies:** Task 24  
**Requirements:** All requirements

Perform final integration testing and system validation to ensure complete functionality.

- Conduct comprehensive system integration testing
- Perform user acceptance testing with real scenarios
- Execute performance testing under load
- Validate security and compliance requirements
- Test disaster recovery and backup procedures
- Conduct accessibility and usability testing
- Perform cross-browser and device testing
- Create final documentation and user guides
- _Requirements: All system requirements_

**Acceptance Criteria:**

- [ ] Document CRUD operations work for any doctype
- [ ] Custom fields can be added dynamically
- [ ] Document validation works based on schema
- [ ] Naming series generates unique document names
- [ ] Workflow system processes document state changes
- [ ] Document permissions are enforced
- [ ] Audit trail is maintained for all changes

## Phase 2: Business Modules (Months 7-18)

### Task 2.1: Accounts Module Implementation

**Priority:** Critical  
**Estimated Effort:** 8 weeks  
**Dependencies:** Task 1.5

#### Subtasks:

1. **Create Chart of Accounts**

   ```typescript
   // src/modules/accounts/entities/account.entity.ts
   import { ObjectType, Field, ID } from "@nestjs/graphql";
   import { accounts } from "../../../database/schema/accounts";
   import { InferSelectModel } from "drizzle-orm";

   @ObjectType()
   export class Account {
     @Field(() => ID)
     id: string;

     @Field()
     name: string;

     @Field({ nullable: true })
     accountNumber?: string;

     @Field()
     accountType: string;

     @Field()
     rootType: string;

     @Field(() => ID, { nullable: true })
     parentAccount?: string;

     @Field()
     currency: string;

     @Field()
     isGroup: boolean;

     @Field()
     lft: number;

     @Field()
     rgt: number;
   }

   export type AccountEntity = InferSelectModel<typeof accounts>;
   ```

2. **Implement General Ledger**

   ```typescript
   // src/modules/accounts/services/general-ledger.service.ts
   import { Injectable, Inject } from "@nestjs/common";
   import { NodePgDatabase } from "drizzle-orm/node-postgres";
   import { glEntries } from "../../../database/schema/accounts";
   import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";

   @Injectable()
   export class GeneralLedgerService {
     constructor(
       @Inject("DATABASE_CONNECTION") private db: NodePgDatabase,
       private eventEmitter: EventEmitter2
     ) {}

     async createGLEntries(entries: GLEntryData[]) {
       // Validate double-entry rules
       this.validateDoubleEntry(entries);

       // Insert GL entries
       const glEntryRecords = await this.db
         .insert(glEntries)
         .values(entries)
         .returning();

       // Emit events for further processing
       this.eventEmitter.emit("gl.entries.created", glEntryRecords);

       return glEntryRecords;
     }

     @OnEvent("document.submitted")
     async handleDocumentSubmission(event: any) {
       const { document } = event;

       // Generate GL entries based on document type
       if (this.shouldCreateGLEntries(document.doctype)) {
         const entries = await this.generateGLEntries(document);
         await this.createGLEntries(entries);
       }
     }

     private validateDoubleEntry(entries: GLEntryData[]) {
       const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
       const totalCredit = entries.reduce(
         (sum, entry) => sum + entry.credit,
         0
       );

       if (Math.abs(totalDebit - totalCredit) > 0.01) {
         throw new Error("Debit and Credit amounts must be equal");
       }
     }

     private shouldCreateGLEntries(doctype: string): boolean {
       const accountingDoctypes = [
         "Sales Invoice",
         "Purchase Invoice",
         "Payment Entry",
         "Journal Entry",
         "Stock Entry",
       ];
       return accountingDoctypes.includes(doctype);
     }

     private async generateGLEntries(document: any): Promise<GLEntryData[]> {
       // Generate GL entries based on document type and data
       switch (document.doctype) {
         case "Sales Invoice":
           return this.generateSalesInvoiceGLEntries(document);
         case "Purchase Invoice":
           return this.generatePurchaseInvoiceGLEntries(document);
         case "Payment Entry":
           return this.generatePaymentEntryGLEntries(document);
         default:
           return [];
       }
     }

     private async generateSalesInvoiceGLEntries(
       invoice: any
     ): Promise<GLEntryData[]> {
       const entries: GLEntryData[] = [];

       // Debit: Accounts Receivable
       entries.push({
         postingDate: invoice.postingDate,
         accountId: invoice.debitTo,
         debit: invoice.grandTotal,
         credit: 0,
         voucherType: "Sales Invoice",
         voucherNo: invoice.name,
         partyType: "Customer",
         partyId: invoice.customer,
         companyId: invoice.company,
       });

       // Credit: Sales Account (from items)
       for (const item of invoice.items) {
         entries.push({
           postingDate: invoice.postingDate,
           accountId: item.incomeAccount,
           debit: 0,
           credit: item.amount,
           voucherType: "Sales Invoice",
           voucherNo: invoice.name,
           companyId: invoice.company,
         });
       }

       // Credit: Tax Accounts (from taxes)
       for (const tax of invoice.taxes || []) {
         if (tax.taxAmount > 0) {
           entries.push({
             postingDate: invoice.postingDate,
             accountId: tax.accountHead,
             debit: 0,
             credit: tax.taxAmount,
             voucherType: "Sales Invoice",
             voucherNo: invoice.name,
             companyId: invoice.company,
           });
         }
       }

       return entries;
     }
   }

   interface GLEntryData {
     postingDate: Date;
     accountId: string;
     debit: number;
     credit: number;
     voucherType: string;
     voucherNo: string;
     partyType?: string;
     partyId?: string;
     companyId: string;
     costCenterId?: string;
     projectId?: string;
     remarks?: string;
   }
   ```

3. **Create Sales Invoice Implementation**

   ```typescript
   // src/modules/accounts/services/sales-invoice.service.ts
   import { Injectable, Inject } from "@nestjs/common";
   import { NodePgDatabase } from "drizzle-orm/node-postgres";
   import {
     salesInvoices,
     salesInvoiceItems,
   } from "../../../database/schema/accounts";
   import { DocumentService } from "../../core/services/document.service";
   import { TaxCalculationService } from "./tax-calculation.service";
   import { EventEmitter2 } from "@nestjs/event-emitter";

   @Injectable()
   export class SalesInvoiceService extends DocumentService {
     constructor(
       @Inject("DATABASE_CONNECTION") db: NodePgDatabase,
       private taxCalculationService: TaxCalculationService,
       eventEmitter: EventEmitter2
     ) {
       super(db, eventEmitter);
     }

     async calculateTotals(invoice: any) {
       // Calculate item totals
       let total = 0;
       for (const item of invoice.items) {
         item.amount = item.qty * item.rate;
         total += item.amount;
       }
       invoice.total = total;
       invoice.netTotal = total;

       // Calculate taxes
       const taxBreakup = await this.taxCalculationService.calculateTaxes(
         invoice.items,
         invoice.taxes,
         invoice.customer
       );

       invoice.totalTaxesAndCharges = taxBreakup.reduce(
         (sum, tax) => sum + tax.taxAmount,
         0
       );

       // Calculate grand total
       invoice.grandTotal = invoice.netTotal + invoice.totalTaxesAndCharges;
       invoice.outstandingAmount = invoice.grandTotal;

       return invoice;
     }

     async beforeSave(invoice: any) {
       // Recalculate totals before saving
       return this.calculateTotals(invoice);
     }

     async afterSubmit(invoice: any) {
       // Update delivery note billing status
       if (invoice.items.some((item) => item.deliveryNote)) {
         await this.updateDeliveryNoteBillingStatus(invoice);
       }

       // Update sales order billing status
       if (invoice.items.some((item) => item.salesOrder)) {
         await this.updateSalesOrderBillingStatus(invoice);
       }

       // Create loyalty points
       if (invoice.customer && !invoice.isReturn) {
         await this.createLoyaltyPoints(invoice);
       }
     }

     private async updateDeliveryNoteBillingStatus(invoice: any) {
       // Update delivery note billing percentage
       // This would involve complex calculations
     }

     private async updateSalesOrderBillingStatus(invoice: any) {
       // Update sales order billing percentage
       // This would involve complex calculations
     }

     private async createLoyaltyPoints(invoice: any) {
       // Create loyalty points based on invoice amount
       // This would integrate with loyalty program
     }
   }
   ```

4. **Implement Tax Calculation Engine**

   ```typescript
   // src/modules/accounts/services/tax-calculation.service.ts
   import { Injectable, Inject } from "@nestjs/common";
   import { NodePgDatabase } from "drizzle-orm/node-postgres";

   @Injectable()
   export class TaxCalculationService {
     constructor(@Inject("DATABASE_CONNECTION") private db: NodePgDatabase) {}

     async calculateTaxes(
       items: any[],
       taxTemplate: any,
       customer?: any
     ): Promise<TaxBreakup[]> {
       const taxBreakup: TaxBreakup[] = [];
       let cumulativeTotal = 0;

       // Get tax template details
       const taxRules = await this.getTaxRules(taxTemplate);

       for (const taxRule of taxRules) {
         const taxableAmount = this.getTaxableAmount(
           items,
           taxRule,
           cumulativeTotal
         );

         const taxAmount = this.calculateTaxAmount(
           taxableAmount,
           taxRule,
           customer
         );

         taxBreakup.push({
           accountHead: taxRule.accountHead,
           rate: taxRule.rate,
           taxableAmount,
           taxAmount,
           total: cumulativeTotal + taxAmount,
         });

         cumulativeTotal += taxAmount;
       }

       return taxBreakup;
     }

     private async getTaxRules(taxTemplate: any) {
       // Get tax rules from tax template
       return []; // Placeholder
     }

     private getTaxableAmount(
       items: any[],
       taxRule: any,
       cumulativeTotal: number
     ): number {
       if (taxRule.chargeType === "On Net Total") {
         return items.reduce((sum, item) => sum + item.amount, 0);
       } else if (taxRule.chargeType === "On Previous Row Total") {
         return cumulativeTotal;
       }
       return 0;
     }

     private calculateTaxAmount(
       taxableAmount: number,
       taxRule: any,
       customer?: any
     ): number {
       if (taxRule.chargeType === "Actual") {
         return taxRule.taxAmount || 0;
       }

       let rate = taxRule.rate || 0;

       // Apply customer-specific tax rates
       if (customer?.taxCategory) {
         rate = this.getCustomerTaxRate(taxRule, customer.taxCategory) || rate;
       }

       return (taxableAmount * rate) / 100;
     }

     private getCustomerTaxRate(
       taxRule: any,
       taxCategory: string
     ): number | null {
       // Get customer-specific tax rate
       return null; // Placeholder
     }
   }

   interface TaxBreakup {
     accountHead: string;
     rate: number;
     taxableAmount: number;
     taxAmount: number;
     total: number;
   }
   ```

**Acceptance Criteria:**

- [ ] Chart of Accounts supports hierarchical structure
- [ ] General Ledger entries are created automatically
- [ ] Double-entry bookkeeping is enforced
- [ ] Sales Invoice calculations work correctly
- [ ] Tax calculations support multiple jurisdictions
- [ ] Multi-currency operations are supported
- [ ] Payment reconciliation works
- [ ] Financial reports generate correctly

### Task 2.2: Stock Module Implementation

**Priority:** Critical  
**Estimated Effort:** 6 weeks  
**Dependencies:** Task 2.1

#### Subtasks:

1. **Create Item Management System**

   ```typescript
   // src/modules/stock/services/item.service.ts
   import { Injectable, Inject } from "@nestjs/common";
   import { NodePgDatabase } from "drizzle-orm/node-postgres";
   import { items, itemGroups } from "../../../database/schema/stock";
   import { eq } from "drizzle-orm";

   @Injectable()
   export class ItemService {
     constructor(@Inject("DATABASE_CONNECTION") private db: NodePgDatabase) {}

     async createItem(itemData: CreateItemDto) {
       // Validate item code uniqueness
       await this.validateItemCode(itemData.itemCode);

       // Create item
       const item = await this.db
         .insert(items)
         .values({
           itemCode: itemData.itemCode,
           itemName: itemData.itemName,
           itemGroupId: itemData.itemGroupId,
           stockUom: itemData.stockUom,
           isStockItem: itemData.isStockItem,
           isSalesItem: itemData.isSalesItem,
           isPurchaseItem: itemData.isPurchaseItem,
           hasSerialNo: itemData.hasSerialNo,
           hasBatchNo: itemData.hasBatchNo,
           valuationRate: itemData.valuationRate || 0,
           standardRate: itemData.standardRate || 0,
           description: itemData.description,
         })
         .returning();

       // Create default warehouse bins
       if (itemData.isStockItem) {
         await this.createDefaultBins(item[0].itemCode);
       }

       return item[0];
     }

     async updateValuationRate(itemCode: string, newRate: number) {
       // Update item valuation rate
       await this.db
         .update(items)
         .set({ valuationRate: newRate })
         .where(eq(items.itemCode, itemCode));

       // Update all bins with new valuation
       await this.updateBinValuation(itemCode, newRate);
     }

     private async validateItemCode(itemCode: string) {
       const existing = await this.db
         .select()
         .from(items)
         .where(eq(items.itemCode, itemCode))
         .limit(1);

       if (existing.length > 0) {
         throw new Error(`Item with code ${itemCode} already exists`);
       }
     }

     private async createDefaultBins(itemCode: string) {
       // Create bins for all warehouses
       const warehouses = await this.getActiveWarehouses();

       for (const warehouse of warehouses) {
         await this.createBin(itemCode, warehouse.id);
       }
     }

     private async getActiveWarehouses() {
       // Get all active warehouses
       return []; // Placeholder
     }

     private async createBin(itemCode: string, warehouseId: string) {
       // Create bin record
       // Implementation would go here
     }

     private async updateBinValuation(itemCode: string, newRate: number) {
       // Update bin valuation rates
       // Implementation would go here
     }
   }

   interface CreateItemDto {
     itemCode: string;
     itemName: string;
     itemGroupId: string;
     stockUom: string;
     isStockItem: boolean;
     isSalesItem: boolean;
     isPurchaseItem: boolean;
     hasSerialNo: boolean;
     hasBatchNo: boolean;
     valuationRate?: number;
     standardRate?: number;
     description?: string;
   }
   ```

2. **Implement Stock Ledger System**

   ```typescript
   // src/modules/stock/services/stock-ledger.service.ts
   import { Injectable, Inject } from "@nestjs/common";
   import { NodePgDatabase } from "drizzle-orm/node-postgres";
   import { stockLedgerEntries, bins } from "../../../database/schema/stock";
   import { eq, and, desc } from "drizzle-orm";
   import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";

   @Injectable()
   export class StockLedgerService {
     constructor(
       @Inject("DATABASE_CONNECTION") private db: NodePgDatabase,
       private eventEmitter: EventEmitter2
     ) {}

     async createStockLedgerEntry(entryData: StockLedgerEntryData) {
       // Get previous stock balance
       const previousBalance = await this.getPreviousStockBalance(
         entryData.itemCode,
         entryData.warehouseId,
         entryData.postingDate
       );

       // Calculate new quantities and values
       const qtyAfterTransaction = previousBalance.qty + entryData.actualQty;
       const stockValue = await this.calculateStockValue(
         entryData,
         previousBalance,
         qtyAfterTransaction
       );

       // Create stock ledger entry
       const sle = await this.db
         .insert(stockLedgerEntries)
         .values({
           postingDate: entryData.postingDate,
           postingTime: entryData.postingTime,
           itemCode: entryData.itemCode,
           warehouseId: entryData.warehouseId,
           voucherType: entryData.voucherType,
           voucherNo: entryData.voucherNo,
           actualQty: entryData.actualQty,
           qtyAfterTransaction,
           incomingRate: entryData.incomingRate || 0,
           valuationRate: stockValue.valuationRate,
           stockValue: stockValue.stockValue,
           stockValueDifference: stockValue.stockValueDifference,
           companyId: entryData.companyId,
         })
         .returning();

       // Update bin quantities
       await this.updateBinQuantities(
         entryData.itemCode,
         entryData.warehouseId,
         entryData.actualQty,
         stockValue.valuationRate
       );

       // Emit event for further processing
       this.eventEmitter.emit("stock.updated", {
         itemCode: entryData.itemCode,
         warehouseId: entryData.warehouseId,
         stockLedgerEntry: sle[0],
       });

       return sle[0];
     }

     @OnEvent("document.submitted")
     async handleDocumentSubmission(event: any) {
       const { document } = event;

       if (this.shouldUpdateStock(document.doctype)) {
         await this.processStockDocument(document);
       }
     }

     private async getPreviousStockBalance(
       itemCode: string,
       warehouseId: string,
       postingDate: Date
     ) {
       const previousEntry = await this.db
         .select()
         .from(stockLedgerEntries)
         .where(
           and(
             eq(stockLedgerEntries.itemCode, itemCode),
             eq(stockLedgerEntries.warehouseId, warehouseId)
             // Add date condition
           )
         )
         .orderBy(desc(stockLedgerEntries.postingDate))
         .limit(1);

       if (previousEntry.length === 0) {
         return { qty: 0, valuationRate: 0, stockValue: 0 };
       }

       return {
         qty: previousEntry[0].qtyAfterTransaction,
         valuationRate: previousEntry[0].valuationRate,
         stockValue: previousEntry[0].stockValue,
       };
     }

     private async calculateStockValue(
       entryData: StockLedgerEntryData,
       previousBalance: any,
       qtyAfterTransaction: number
     ) {
       let valuationRate = previousBalance.valuationRate;
       let stockValue = previousBalance.stockValue;
       let stockValueDifference = 0;

       if (entryData.actualQty > 0) {
         // Incoming stock
         if (entryData.incomingRate && entryData.incomingRate > 0) {
           // Calculate weighted average rate
           const totalValue =
             stockValue + entryData.actualQty * entryData.incomingRate;
           valuationRate =
             qtyAfterTransaction > 0 ? totalValue / qtyAfterTransaction : 0;
           stockValue = totalValue;
           stockValueDifference = entryData.actualQty * entryData.incomingRate;
         }
       } else {
         // Outgoing stock
         stockValueDifference = entryData.actualQty * valuationRate;
         stockValue += stockValueDifference;
       }

       return {
         valuationRate,
         stockValue,
         stockValueDifference,
       };
     }

     private async updateBinQuantities(
       itemCode: string,
       warehouseId: string,
       actualQty: number,
       valuationRate: number
     ) {
       // Update bin quantities
       const currentBin = await this.db
         .select()
         .from(bins)
         .where(
           and(eq(bins.itemCode, itemCode), eq(bins.warehouseId, warehouseId))
         )
         .limit(1);

       if (currentBin.length === 0) {
         // Create new bin
         await this.db.insert(bins).values({
           itemCode,
           warehouseId,
           actualQty,
           valuationRate,
           stockValue: actualQty * valuationRate,
         });
       } else {
         // Update existing bin
         const newQty = currentBin[0].actualQty + actualQty;
         await this.db
           .update(bins)
           .set({
             actualQty: newQty,
             valuationRate,
             stockValue: newQty * valuationRate,
             updatedAt: new Date(),
           })
           .where(
             and(eq(bins.itemCode, itemCode), eq(bins.warehouseId, warehouseId))
           );
       }
     }

     private shouldUpdateStock(doctype: string): boolean {
       const stockDoctypes = [
         "Stock Entry",
         "Purchase Receipt",
         "Delivery Note",
         "Sales Invoice",
         "Purchase Invoice",
       ];
       return stockDoctypes.includes(doctype);
     }

     private async processStockDocument(document: any) {
       // Process different types of stock documents
       switch (document.doctype) {
         case "Stock Entry":
           await this.processStockEntry(document);
           break;
         case "Purchase Receipt":
           await this.processPurchaseReceipt(document);
           break;
         case "Delivery Note":
           await this.processDeliveryNote(document);
           break;
         // Add more cases as needed
       }
     }

     private async processStockEntry(stockEntry: any) {
       for (const item of stockEntry.items) {
         if (item.sourceWarehouse) {
           // Outgoing entry
           await this.createStockLedgerEntry({
             postingDate: stockEntry.postingDate,
             postingTime: stockEntry.postingTime,
             itemCode: item.itemCode,
             warehouseId: item.sourceWarehouse,
             voucherType: "Stock Entry",
             voucherNo: stockEntry.name,
             actualQty: -item.qty,
             incomingRate: 0,
             companyId: stockEntry.company,
           });
         }

         if (item.targetWarehouse) {
           // Incoming entry
           await this.createStockLedgerEntry({
             postingDate: stockEntry.postingDate,
             postingTime: stockEntry.postingTime,
             itemCode: item.itemCode,
             warehouseId: item.targetWarehouse,
             voucherType: "Stock Entry",
             voucherNo: stockEntry.name,
             actualQty: item.qty,
             incomingRate: item.valuationRate,
             companyId: stockEntry.company,
           });
         }
       }
     }

     private async processPurchaseReceipt(purchaseReceipt: any) {
       for (const item of purchaseReceipt.items) {
         await this.createStockLedgerEntry({
           postingDate: purchaseReceipt.postingDate,
           postingTime: purchaseReceipt.postingTime,
           itemCode: item.itemCode,
           warehouseId: item.warehouse,
           voucherType: "Purchase Receipt",
           voucherNo: purchaseReceipt.name,
           actualQty: item.qty,
           incomingRate: item.valuationRate,
           companyId: purchaseReceipt.company,
         });
       }
     }

     private async processDeliveryNote(deliveryNote: any) {
       for (const item of deliveryNote.items) {
         await this.createStockLedgerEntry({
           postingDate: deliveryNote.postingDate,
           postingTime: deliveryNote.postingTime,
           itemCode: item.itemCode,
           warehouseId: item.warehouse,
           voucherType: "Delivery Note",
           voucherNo: deliveryNote.name,
           actualQty: -item.qty,
           incomingRate: 0,
           companyId: deliveryNote.company,
         });
       }
     }
   }

   interface StockLedgerEntryData {
     postingDate: Date;
     postingTime: Date;
     itemCode: string;
     warehouseId: string;
     voucherType: string;
     voucherNo: string;
     actualQty: number;
     incomingRate?: number;
     companyId: string;
   }
   ```

**Acceptance Criteria:**

- [ ] Item management supports all item types
- [ ] Stock ledger maintains accurate quantities
- [ ] FIFO/LIFO valuation methods work correctly
- [ ] Serial and batch number tracking works
- [ ] Warehouse management supports multi-location
- [ ] Stock reconciliation processes work
- [ ] Reorder point calculations are accurate
- [ ] Stock reports generate correctly

This completes the first major sections of the implementation tasks. The document continues with detailed implementations for all remaining modules, frontend development, testing strategies, deployment procedures, and monitoring setup. Each task includes specific code examples, acceptance criteria, and dependencies to ensure a comprehensive rebuild of ERPNext with modern technologies.

### Task 2.3: Manufacturing Module Implementation

**Priority:** High  
**Estimated Effort:** 6 weeks  
**Dependencies:** Task 2.2

#### Subtasks:

1. **Create Bill of Materials (BOM) System**

   ```typescript
   // src/modules/manufacturing/services/bom.service.ts
   import { Injectable, Inject } from "@nestjs/common";
   import { NodePgDatabase } from "drizzle-orm/node-postgres";
   import { boms, bomItems } from "../../../database/schema/manufacturing";

   @Injectable()
   export class BOMService {
     constructor(@Inject("DATABASE_CONNECTION") private db: NodePgDatabase) {}

     async createBOM(bomData: CreateBOMDto) {
       // Validate BOM data
       await this.validateBOM(bomData);

       // Calculate BOM costs
       const calculatedBOM = await this.calculateBOMCost(bomData);

       // Create BOM
       const bom = await this.db
         .insert(boms)
         .values({
           item: calculatedBOM.item,
           quantity: calculatedBOM.quantity,
           uom: calculatedBOM.uom,
           totalCost: calculatedBOM.totalCost,
           operatingCost: calculatedBOM.operatingCost,
           rawMaterialCost: calculatedBOM.rawMaterialCost,
           companyId: calculatedBOM.companyId,
         })
         .returning();

       // Create BOM items
       for (const item of calculatedBOM.items) {
         await this.db.insert(bomItems).values({
           parentId: bom[0].id,
           itemCode: item.itemCode,
           quantity: item.quantity,
           rate: item.rate,
           amount: item.amount,
           scrapPercentage: item.scrapPercentage || 0,
         });
       }

       return bom[0];
     }

     async explodeBOM(bomId: string, quantity: number): Promise<BOMExplosion> {
       const bom = await this.getBOMWithItems(bomId);
       const explosion: BOMExplosion = {
         items: [],
         operations: [],
         totalCost: 0,
       };

       // Explode BOM recursively
       await this.explodeBOMRecursive(bom, quantity, explosion, 0);

       return explosion;
     }

     private async explodeBOMRecursive(
       bom: any,
       quantity: number,
       explosion: BOMExplosion,
       level: number
     ) {
       for (const bomItem of bom.items) {
         const requiredQty =
           bomItem.quantity *
           quantity *
           (1 + (bomItem.scrapPercentage || 0) / 100);

         // Check if item has its own BOM
         const subBOM = await this.getBOMForItem(bomItem.itemCode);

         if (subBOM && level < 10) {
           // Prevent infinite recursion
           // Explode sub-BOM
           await this.explodeBOMRecursive(
             subBOM,
             requiredQty,
             explosion,
             level + 1
           );
         } else {
           // Add to explosion
           const existingItem = explosion.items.find(
             (item) => item.itemCode === bomItem.itemCode
           );

           if (existingItem) {
             existingItem.quantity += requiredQty;
             existingItem.amount += requiredQty * bomItem.rate;
           } else {
             explosion.items.push({
               itemCode: bomItem.itemCode,
               quantity: requiredQty,
               rate: bomItem.rate,
               amount: requiredQty * bomItem.rate,
               level,
             });
           }
         }
       }
     }

     private async calculateBOMCost(bomData: CreateBOMDto) {
       let rawMaterialCost = 0;
       let operatingCost = 0;

       // Calculate raw material cost
       for (const item of bomData.items) {
         const itemRate = await this.getItemRate(item.itemCode);
         item.rate = itemRate;
         item.amount = item.quantity * itemRate;
         rawMaterialCost += item.amount;
       }

       // Calculate operating cost from operations
       for (const operation of bomData.operations || []) {
         const operationCost = await this.calculateOperationCost(operation);
         operatingCost += operationCost;
       }

       return {
         ...bomData,
         rawMaterialCost,
         operatingCost,
         totalCost: rawMaterialCost + operatingCost,
       };
     }

     private async validateBOM(bomData: CreateBOMDto) {
       // Validate that item exists
       // Validate that all BOM items exist
       // Check for circular references
       // Validate quantities and rates
     }

     private async getBOMWithItems(bomId: string) {
       // Get BOM with all items
       return null; // Placeholder
     }

     private async getBOMForItem(itemCode: string) {
       // Get active BOM for item
       return null; // Placeholder
     }

     private async getItemRate(itemCode: string): Promise<number> {
       // Get current item rate
       return 0; // Placeholder
     }

     private async calculateOperationCost(operation: any): Promise<number> {
       // Calculate operation cost based on time and rates
       return 0; // Placeholder
     }
   }

   interface CreateBOMDto {
     item: string;
     quantity: number;
     uom: string;
     companyId: string;
     items: BOMItemDto[];
     operations?: BOMOperationDto[];
   }

   interface BOMItemDto {
     itemCode: string;
     quantity: number;
     rate?: number;
     amount?: number;
     scrapPercentage?: number;
   }

   interface BOMOperationDto {
     operation: string;
     workstation: string;
     timeInMins: number;
     operatingCost: number;
   }

   interface BOMExplosion {
     items: BOMExplosionItem[];
     operations: BOMExplosionOperation[];
     totalCost: number;
   }

   interface BOMExplosionItem {
     itemCode: string;
     quantity: number;
     rate: number;
     amount: number;
     level: number;
   }

   interface BOMExplosionOperation {
     operation: string;
     workstation: string;
     timeInMins: number;
     cost: number;
   }
   ```

2. **Implement Work Order Management**

   ```typescript
   // src/modules/manufacturing/services/work-order.service.ts
   import { Injectable, Inject } from "@nestjs/common";
   import { NodePgDatabase } from "drizzle-orm/node-postgres";
   import {
     workOrders,
     workOrderItems,
   } from "../../../database/schema/manufacturing";
   import { BOMService } from "./bom.service";
   import { StockLedgerService } from "../../stock/services/stock-ledger.service";

   @Injectable()
   export class WorkOrderService {
     constructor(
       @Inject("DATABASE_CONNECTION") private db: NodePgDatabase,
       private bomService: BOMService,
       private stockLedgerService: StockLedgerService
     ) {}

     async createWorkOrder(workOrderData: CreateWorkOrderDto) {
       // Get BOM explosion
       const bomExplosion = await this.bomService.explodeBOM(
         workOrderData.bomNo,
         workOrderData.qty
       );

       // Check material availability
       const materialAvailability = await this.checkMaterialAvailability(
         bomExplosion.items,
         workOrderData.sourceWarehouse
       );

       // Create work order
       const workOrder = await this.db
         .insert(workOrders)
         .values({
           productionItem: workOrderData.productionItem,
           bomNo: workOrderData.bomNo,
           qty: workOrderData.qty,
           producedQty: 0,
           sourceWarehouse: workOrderData.sourceWarehouse,
           fgWarehouse: workOrderData.fgWarehouse,
           plannedStartDate: workOrderData.plannedStartDate,
           plannedEndDate: workOrderData.plannedEndDate,
           status: "Draft",
           companyId: workOrderData.companyId,
         })
         .returning();

       // Create required items
       for (const item of bomExplosion.items) {
         await this.db.insert(workOrderItems).values({
           parentId: workOrder[0].id,
           itemCode: item.itemCode,
           requiredQty: item.quantity,
           transferredQty: 0,
           consumedQty: 0,
           rate: item.rate,
           amount: item.amount,
         });
       }

       return {
         workOrder: workOrder[0],
         materialAvailability,
       };
     }

     async startWorkOrder(workOrderId: string) {
       // Validate work order can be started
       await this.validateWorkOrderStart(workOrderId);

       // Transfer materials to WIP warehouse
       await this.transferMaterials(workOrderId);

       // Update work order status
       await this.db
         .update(workOrders)
         .set({
           status: "In Process",
           actualStartDate: new Date(),
         })
         .where(eq(workOrders.id, workOrderId));

       // Create job cards
       await this.createJobCards(workOrderId);
     }

     async completeWorkOrder(workOrderId: string, completedQty: number) {
       const workOrder = await this.getWorkOrder(workOrderId);

       // Create stock entry for finished goods
       await this.createFinishedGoodsEntry(workOrder, completedQty);

       // Update work order
       await this.db
         .update(workOrders)
         .set({
           producedQty: workOrder.producedQty + completedQty,
           status:
             workOrder.producedQty + completedQty >= workOrder.qty
               ? "Completed"
               : "In Process",
           actualEndDate: new Date(),
         })
         .where(eq(workOrders.id, workOrderId));

       // Update job card status
       await this.updateJobCardStatus(workOrderId, "Completed");
     }

     private async checkMaterialAvailability(
       requiredItems: any[],
       warehouse: string
     ) {
       const availability = [];

       for (const item of requiredItems) {
         const stockBalance = await this.getStockBalance(
           item.itemCode,
           warehouse
         );
         availability.push({
           itemCode: item.itemCode,
           requiredQty: item.quantity,
           availableQty: stockBalance.actualQty,
           shortageQty: Math.max(0, item.quantity - stockBalance.actualQty),
         });
       }

       return availability;
     }

     private async validateWorkOrderStart(workOrderId: string) {
       // Check if all materials are available
       // Check if workstations are available
       // Validate work order status
     }

     private async transferMaterials(workOrderId: string) {
       // Create stock entry to transfer materials from source to WIP warehouse
       const workOrder = await this.getWorkOrder(workOrderId);
       const requiredItems = await this.getWorkOrderItems(workOrderId);

       const stockEntryData = {
         stockEntryType: "Material Transfer for Manufacture",
         purpose: "Material Transfer for Manufacture",
         workOrder: workOrderId,
         items: requiredItems.map((item) => ({
           itemCode: item.itemCode,
           sourceWarehouse: workOrder.sourceWarehouse,
           targetWarehouse: workOrder.wipWarehouse,
           qty: item.requiredQty,
         })),
       };

       // Create stock entry (this would call stock entry service)
       // await this.stockEntryService.create(stockEntryData);
     }

     private async createJobCards(workOrderId: string) {
       // Create job cards for each operation
       const workOrder = await this.getWorkOrder(workOrderId);
       const bomOperations = await this.getBOMOperations(workOrder.bomNo);

       for (const operation of bomOperations) {
         await this.createJobCard({
           workOrder: workOrderId,
           operation: operation.operation,
           workstation: operation.workstation,
           plannedStartTime: operation.plannedStartTime,
           plannedEndTime: operation.plannedEndTime,
           timeInMins: operation.timeInMins,
         });
       }
     }

     private async createFinishedGoodsEntry(
       workOrder: any,
       completedQty: number
     ) {
       // Create stock entry for finished goods
       const stockEntryData = {
         stockEntryType: "Manufacture",
         purpose: "Manufacture",
         workOrder: workOrder.id,
         items: [
           {
             itemCode: workOrder.productionItem,
             targetWarehouse: workOrder.fgWarehouse,
             qty: completedQty,
             isFinishedItem: true,
           },
         ],
       };

       // Create stock entry
       // await this.stockEntryService.create(stockEntryData);
     }

     private async getWorkOrder(workOrderId: string) {
       // Get work order details
       return null; // Placeholder
     }

     private async getWorkOrderItems(workOrderId: string) {
       // Get work order required items
       return []; // Placeholder
     }

     private async getBOMOperations(bomNo: string) {
       // Get BOM operations
       return []; // Placeholder
     }

     private async createJobCard(jobCardData: any) {
       // Create job card
       return null; // Placeholder
     }

     private async updateJobCardStatus(workOrderId: string, status: string) {
       // Update job card status
     }

     private async getStockBalance(itemCode: string, warehouse: string) {
       // Get current stock balance
       return { actualQty: 0 }; // Placeholder
     }
   }

   interface CreateWorkOrderDto {
     productionItem: string;
     bomNo: string;
     qty: number;
     sourceWarehouse: string;
     fgWarehouse: string;
     plannedStartDate: Date;
     plannedEndDate: Date;
     companyId: string;
   }
   ```

**Acceptance Criteria:**

- [ ] BOM system supports multi-level BOMs
- [ ] BOM explosion calculates material requirements correctly
- [ ] Work order planning considers capacity constraints
- [ ] Material transfer for manufacturing works
- [ ] Job card system tracks shop floor operations
- [ ] Production planning integrates with sales orders
- [ ] Manufacturing reports provide insights
- [ ] Quality control integration works

### Task 2.4: CRM & Sales Module Implementation

**Priority:** High  
**Estimated Effort:** 5 weeks  
**Dependencies:** Task 2.1

#### Subtasks:

1. **Create Lead Management System**

   ```typescript
   // src/modules/crm/services/lead.service.ts
   import { Injectable, Inject } from "@nestjs/common";
   import { NodePgDatabase } from "drizzle-orm/node-postgres";
   import { leads, opportunities } from "../../../database/schema/crm";
   import { EventEmitter2 } from "@nestjs/event-emitter";

   @Injectable()
   export class LeadService {
     constructor(
       @Inject("DATABASE_CONNECTION") private db: NodePgDatabase,
       private eventEmitter: EventEmitter2
     ) {}

     async createLead(leadData: CreateLeadDto) {
       // Create lead
       const lead = await this.db
         .insert(leads)
         .values({
           leadName: leadData.leadName,
           companyName: leadData.companyName,
           email: leadData.email,
           phone: leadData.phone,
           source: leadData.source,
           status: "Open",
           leadOwner: leadData.leadOwner,
           companyId: leadData.companyId,
         })
         .returning();

       // Emit lead created event
       this.eventEmitter.emit("lead.created", {
         lead: lead[0],
         owner: leadData.leadOwner,
       });

       return lead[0];
     }

     async convertToOpportunity(
       leadId: string,
       conversionData: LeadConversionDto
     ) {
       const lead = await this.getLead(leadId);

       // Create opportunity
       const opportunity = await this.db
         .insert(opportunities)
         .values({
           opportunityFrom: "Lead",
           partyName: lead.leadName,
           companyName: lead.companyName,
           contactEmail: lead.email,
           contactMobile: lead.phone,
           opportunityAmount: conversionData.opportunityAmount,
           currency: conversionData.currency,
           probability: conversionData.probability || 50,
           expectedClosingDate: conversionData.expectedClosingDate,
           source: lead.source,
           status: "Open",
           companyId: lead.companyId,
         })
         .returning();

       // Update lead status
       await this.db
         .update(leads)
         .set({ status: "Converted" })
         .where(eq(leads.id, leadId));

       // Create customer if requested
       if (conversionData.createCustomer) {
         await this.createCustomerFromLead(lead, conversionData.customerGroup);
       }

       // Emit conversion event
       this.eventEmitter.emit("lead.converted", {
         lead,
         opportunity: opportunity[0],
       });

       return opportunity[0];
     }

     async updateLeadScore(leadId: string) {
       const lead = await this.getLead(leadId);
       const score = await this.calculateLeadScore(lead);

       await this.db
         .update(leads)
         .set({ leadScore: score })
         .where(eq(leads.id, leadId));

       return score;
     }

     private async calculateLeadScore(lead: any): Promise<number> {
       let score = 0;

       // Score based on source
       const sourceScores = {
         Website: 20,
         Campaign: 30,
         "Email Marketing": 25,
         "Social Media": 15,
         Referral: 40,
         "Cold Calling": 10,
       };
       score += sourceScores[lead.source] || 0;

       // Score based on engagement
       const interactions = await this.getLeadInteractions(lead.id);
       score += Math.min(interactions.length * 5, 50);

       // Score based on company size (if available)
       if (lead.noOfEmployees) {
         if (lead.noOfEmployees > 1000) score += 30;
         else if (lead.noOfEmployees > 100) score += 20;
         else if (lead.noOfEmployees > 10) score += 10;
       }

       // Score based on industry
       const industryScores = {
         Technology: 25,
         Manufacturing: 30,
         Healthcare: 20,
         Finance: 35,
       };
       score += industryScores[lead.industry] || 0;

       return Math.min(score, 100);
     }

     private async getLead(leadId: string) {
       // Get lead details
       return null; // Placeholder
     }

     private async getLeadInteractions(leadId: string) {
       // Get lead interactions (emails, calls, meetings)
       return []; // Placeholder
     }

     private async createCustomerFromLead(lead: any, customerGroup: string) {
       // Create customer from lead data
       const customerData = {
         customerName: lead.companyName || lead.leadName,
         customerType: lead.companyName ? "Company" : "Individual",
         customerGroup,
         territory: lead.territory,
         contactEmail: lead.email,
         contactMobile: lead.phone,
         companyId: lead.companyId,
       };

       // Create customer (this would call customer service)
       // return await this.customerService.create(customerData);
     }
   }

   interface CreateLeadDto {
     leadName: string;
     companyName?: string;
     email: string;
     phone?: string;
     source: string;
     leadOwner: string;
     companyId: string;
     industry?: string;
     noOfEmployees?: number;
     territory?: string;
   }

   interface LeadConversionDto {
     opportunityAmount: number;
     currency: string;
     probability?: number;
     expectedClosingDate: Date;
     createCustomer: boolean;
     customerGroup?: string;
   }
   ```

2. **Implement Sales Pipeline Management**

   ```typescript
   // src/modules/crm/services/opportunity.service.ts
   import { Injectable, Inject } from "@nestjs/common";
   import { NodePgDatabase } from "drizzle-orm/node-postgres";
   import { opportunities, quotations } from "../../../database/schema";
   import { EventEmitter2 } from "@nestjs/event-emitter";

   @Injectable()
   export class OpportunityService {
     constructor(
       @Inject("DATABASE_CONNECTION") private db: NodePgDatabase,
       private eventEmitter: EventEmitter2
     ) {}

     async updateOpportunityStage(
       opportunityId: string,
       newStage: string,
       probability?: number
     ) {
       const opportunity = await this.getOpportunity(opportunityId);

       // Update opportunity
       await this.db
         .update(opportunities)
         .set({
           salesStage: newStage,
           probability: probability || this.getDefaultProbability(newStage),
           lastModified: new Date(),
         })
         .where(eq(opportunities.id, opportunityId));

       // Emit stage change event
       this.eventEmitter.emit("opportunity.stage.changed", {
         opportunity,
         oldStage: opportunity.salesStage,
         newStage,
       });

       // Auto-create quotation if moved to quotation stage
       if (newStage === "Quotation" && !opportunity.quotation) {
         await this.createQuotationFromOpportunity(opportunityId);
       }
     }

     async createQuotationFromOpportunity(opportunityId: string) {
       const opportunity = await this.getOpportunity(opportunityId);

       const quotationData = {
         quotationTo: "Lead",
         partyName: opportunity.partyName,
         contactEmail: opportunity.contactEmail,
         contactMobile: opportunity.contactMobile,
         currency: opportunity.currency,
         validTill: this.calculateValidTill(),
         opportunityId: opportunityId,
         companyId: opportunity.companyId,
       };

       // Create quotation (this would call quotation service)
       // const quotation = await this.quotationService.create(quotationData);

       // Update opportunity with quotation reference
       await this.db
         .update(opportunities)
         .set({ quotation: "quotation.name" })
         .where(eq(opportunities.id, opportunityId));

       return quotationData; // Placeholder
     }

     async forecastSales(filters: SalesForecastFilters) {
       // Get opportunities in pipeline
       const pipelineOpportunities = await this.getPipelineOpportunities(
         filters
       );

       const forecast = {
         totalValue: 0,
         weightedValue: 0,
         expectedClosures: 0,
         byStage: {},
         byMonth: {},
         byOwner: {},
       };

       for (const opp of pipelineOpportunities) {
         const weightedAmount = (opp.opportunityAmount * opp.probability) / 100;

         forecast.totalValue += opp.opportunityAmount;
         forecast.weightedValue += weightedAmount;

         if (opp.probability >= 80) {
           forecast.expectedClosures += 1;
         }

         // Group by stage
         if (!forecast.byStage[opp.salesStage]) {
           forecast.byStage[opp.salesStage] = {
             count: 0,
             value: 0,
             weighted: 0,
           };
         }
         forecast.byStage[opp.salesStage].count += 1;
         forecast.byStage[opp.salesStage].value += opp.opportunityAmount;
         forecast.byStage[opp.salesStage].weighted += weightedAmount;

         // Group by month
         const month = opp.expectedClosingDate.toISOString().substring(0, 7);
         if (!forecast.byMonth[month]) {
           forecast.byMonth[month] = { count: 0, value: 0, weighted: 0 };
         }
         forecast.byMonth[month].count += 1;
         forecast.byMonth[month].value += opp.opportunityAmount;
         forecast.byMonth[month].weighted += weightedAmount;
       }

       return forecast;
     }

     private getDefaultProbability(stage: string): number {
       const stageProbabilities = {
         Prospecting: 10,
         Qualification: 25,
         "Needs Analysis": 40,
         "Value Proposition": 60,
         Quotation: 75,
         Negotiation: 90,
         "Closed Won": 100,
         "Closed Lost": 0,
       };
       return stageProbabilities[stage] || 50;
     }

     private calculateValidTill(): Date {
       const validTill = new Date();
       validTill.setDate(validTill.getDate() + 30); // 30 days validity
       return validTill;
     }

     private async getOpportunity(opportunityId: string) {
       // Get opportunity details
       return null; // Placeholder
     }

     private async getPipelineOpportunities(filters: SalesForecastFilters) {
       // Get opportunities in pipeline with filters
       return []; // Placeholder
     }
   }

   interface SalesForecastFilters {
     fromDate?: Date;
     toDate?: Date;
     salesPerson?: string;
     territory?: string;
     customerGroup?: string;
   }
   ```

**Acceptance Criteria:**

- [ ] Lead management captures and qualifies leads
- [ ] Lead scoring algorithm works accurately
- [ ] Opportunity pipeline tracks sales stages
- [ ] Sales forecasting provides accurate predictions
- [ ] Customer 360-degree view shows complete history
- [ ] Territory and sales team management works
- [ ] CRM reports provide sales insights
- [ ] Integration with marketing campaigns works

## Phase 3: Frontend Development (Months 19-30)

### Task 3.1: React Application Setup

**Priority:** Critical  
**Estimated Effort:** 3 weeks  
**Dependencies:** Task 1.4

#### Subtasks:

1. **Initialize React Application**

   ```bash
   # Create React app with Vite
   npm create vite@latest erpnext-frontend -- --template react-ts
   cd erpnext-frontend

   # Install dependencies
   npm install @apollo/client graphql
   npm install @tanstack/react-query
   npm install zustand
   npm install react-router-dom
   npm install @hookform/resolvers react-hook-form
   npm install zod
   npm install tailwindcss @tailwindcss/forms @tailwindcss/typography
   npm install framer-motion
   npm install @headlessui/react @heroicons/react
   npm install date-fns
   npm install recharts
   npm install react-hot-toast
   ```

2. **Setup Project Structure**

   ```
   src/
   ├── components/
   │   ├── ui/                 # Reusable UI components
   │   │   ├── Button/
   │   │   ├── Input/
   │   │   ├── Modal/
   │   │   ├── DataTable/
   │   │   └── index.ts
   │   ├── forms/              # Form components
   │   │   ├── DocumentForm/
   │   │   ├── FieldRenderer/
   │   │   └── index.ts
   │   └── layout/             # Layout components
   │       ├── Header/
   │       ├── Sidebar/
   │       ├── Workspace/
   │       └── index.ts
   ├── modules/                # Business modules
   │   ├── accounts/
   │   │   ├── components/
   │   │   ├── pages/
   │   │   ├── hooks/
   │   │   └── types/
   │   ├── stock/
   │   ├── manufacturing/
   │   └── crm/
   ├── shared/                 # Shared utilities
   │   ├── hooks/
   │   ├── utils/
   │   ├── types/
   │   └── constants/
   ├── store/                  # State management
   │   ├── auth/
   │   ├── documents/
   │   └── ui/
   ├── graphql/                # GraphQL operations
   │   ├── queries/
   │   ├── mutations/
   │   ├── subscriptions/
   │   └── client.ts
   └── styles/                 # Global styles
       ├── globals.css
       └── components.css
   ```

3. **Configure Apollo Client**

   ```typescript
   // src/graphql/client.ts
   import {
     ApolloClient,
     InMemoryCache,
     createHttpLink,
     from,
   } from "@apollo/client";
   import { setContext } from "@apollo/client/link/context";
   import { onError } from "@apollo/client/link/error";
   import { createClient } from "graphql-ws";
   import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
   import { split } from "@apollo/client/link/core";
   import { getMainDefinition } from "@apollo/client/utilities";
   import { useAuthStore } from "../store/auth";

   const httpLink = createHttpLink({
     uri:
       import.meta.env.VITE_GRAPHQL_HTTP_URL || "http://localhost:3000/graphql",
   });

   const wsLink = new GraphQLWsLink(
     createClient({
       url:
         import.meta.env.VITE_GRAPHQL_WS_URL || "ws://localhost:3000/graphql",
       connectionParams: () => {
         const token = useAuthStore.getState().token;
         return {
           authorization: token ? `Bearer ${token}` : "",
         };
       },
     })
   );

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
             `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
           );

           if (message.includes("Unauthorized")) {
             useAuthStore.getState().logout();
           }
         });
       }

       if (networkError) {
         console.error(`Network error: ${networkError}`);
       }
     }
   );

   const splitLink = split(
     ({ query }) => {
       const definition = getMainDefinition(query);
       return (
         definition.kind === "OperationDefinition" &&
         definition.operation === "subscription"
       );
     },
     wsLink,
     from([errorLink, authLink, httpLink])
   );

   export const apolloClient = new ApolloClient({
     link: splitLink,
     cache: new InMemoryCache({
       typePolicies: {
         Document: {
           keyFields: ["doctype", "name"],
         },
         Query: {
           fields: {
             documents: {
               keyArgs: ["doctype", "filters"],
               merge(existing = { items: [] }, incoming) {
                 return {
                   ...incoming,
                   items: [...existing.items, ...incoming.items],
                 };
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

4. **Setup Zustand Store**

   ```typescript
   // src/store/auth.ts
   import { create } from "zustand";
   import { persist } from "zustand/middleware";
   import { apolloClient } from "../graphql/client";

   interface User {
     id: string;
     email: string;
     firstName: string;
     lastName: string;
     roles: string[];
     currentCompany?: Company;
   }

   interface Company {
     id: string;
     name: string;
     abbr: string;
   }

   interface AuthState {
     user: User | null;
     token: string | null;
     isAuthenticated: boolean;
     isLoading: boolean;
     login: (email: string, password: string) => Promise<void>;
     logout: () => void;
     setCurrentCompany: (company: Company) => void;
     refreshToken: () => Promise<void>;
   }

   export const useAuthStore = create<AuthState>()(
     persist(
       (set, get) => ({
         user: null,
         token: null,
         isAuthenticated: false,
         isLoading: false,

         login: async (email: string, password: string) => {
           set({ isLoading: true });
           try {
             const response = await apolloClient.mutate({
               mutation: LOGIN_MUTATION,
               variables: { email, password },
             });

             const { accessToken, user } = response.data.login;

             set({
               user,
               token: accessToken,
               isAuthenticated: true,
               isLoading: false,
             });
           } catch (error) {
             set({ isLoading: false });
             throw error;
           }
         },

         logout: () => {
           set({
             user: null,
             token: null,
             isAuthenticated: false,
           });
           apolloClient.clearStore();
         },

         setCurrentCompany: (company: Company) => {
           set((state) => ({
             user: state.user
               ? { ...state.user, currentCompany: company }
               : null,
           }));
         },

         refreshToken: async () => {
           const { token } = get();
           if (!token) return;

           try {
             const response = await apolloClient.mutate({
               mutation: REFRESH_TOKEN_MUTATION,
               variables: { token },
             });

             const { accessToken } = response.data.refreshToken;
             set({ token: accessToken });
           } catch (error) {
             get().logout();
           }
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

   // GraphQL mutations
   const LOGIN_MUTATION = gql`
     mutation Login($email: String!, $password: String!) {
       login(email: $email, password: $password) {
         accessToken
         refreshToken
         user {
           id
           email
           firstName
           lastName
           roles
           currentCompany {
             id
             name
             abbr
           }
         }
       }
     }
   `;

   const REFRESH_TOKEN_MUTATION = gql`
     mutation RefreshToken($token: String!) {
       refreshToken(token: $token) {
         accessToken
       }
     }
   `;
   ```

**Acceptance Criteria:**

- [ ] React application builds and runs successfully
- [ ] Apollo Client connects to GraphQL API
- [ ] Authentication state management works
- [ ] Routing is configured properly
- [ ] Tailwind CSS styling is applied
- [ ] TypeScript compilation works without errors
- [ ] Hot reload works in development

### Task 3.2: Core UI Components

**Priority:** Critical  
**Estimated Effort:** 4 weeks  
**Dependencies:** Task 3.1

#### Subtasks:

1. **Create Base UI Components**

   ```typescript
   // src/components/ui/Button/Button.tsx
   import React from "react";
   import { cva, type VariantProps } from "class-variance-authority";
   import { cn } from "../../../shared/utils/cn";

   const buttonVariants = cva(
     "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
     {
       variants: {
         variant: {
           default: "bg-primary text-primary-foreground hover:bg-primary/90",
           destructive:
             "bg-destructive text-destructive-foreground hover:bg-destructive/90",
           outline:
             "border border-input hover:bg-accent hover:text-accent-foreground",
           secondary:
             "bg-secondary text-secondary-foreground hover:bg-secondary/80",
           ghost: "hover:bg-accent hover:text-accent-foreground",
           link: "underline-offset-4 hover:underline text-primary",
         },
         size: {
           default: "h-10 py-2 px-4",
           sm: "h-9 px-3 rounded-md",
           lg: "h-11 px-8 rounded-md",
           icon: "h-10 w-10",
         },
       },
       defaultVariants: {
         variant: "default",
         size: "default",
       },
     }
   );

   export interface ButtonProps
     extends React.ButtonHTMLAttributes<HTMLButtonElement>,
       VariantProps<typeof buttonVariants> {
     asChild?: boolean;
     loading?: boolean;
   }

   const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
     (
       { className, variant, size, loading, children, disabled, ...props },
       ref
     ) => {
       return (
         <button
           className={cn(buttonVariants({ variant, size, className }))}
           ref={ref}
           disabled={disabled || loading}
           {...props}
         >
           {loading && (
             <svg
               className="animate-spin -ml-1 mr-3 h-5 w-5 text-current"
               xmlns="http://www.w3.org/2000/svg"
               fill="none"
               viewBox="0 0 24 24"
             >
               <circle
                 className="opacity-25"
                 cx="12"
                 cy="12"
                 r="10"
                 stroke="currentColor"
                 strokeWidth="4"
               />
               <path
                 className="opacity-75"
                 fill="currentColor"
                 d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
               />
             </svg>
           )}
           {children}
         </button>
       );
     }
   );
   Button.displayName = "Button";

   export { Button, buttonVariants };
   ```

2. **Create Data Table Component**

   ```typescript
   // src/components/ui/DataTable/DataTable.tsx
   import React, { useState } from "react";
   import {
     useReactTable,
     getCoreRowModel,
     getPaginationRowModel,
     getSortedRowModel,
     getFilteredRowModel,
     flexRender,
     type ColumnDef,
     type SortingState,
     type ColumnFiltersState,
   } from "@tanstack/react-table";
   import { Button } from "../Button";
   import { Input } from "../Input";
   import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

   interface DataTableProps<TData, TValue> {
     columns: ColumnDef<TData, TValue>[];
     data: TData[];
     loading?: boolean;
     onRowClick?: (row: TData) => void;
     searchable?: boolean;
     searchPlaceholder?: string;
   }

   export function DataTable<TData, TValue>({
     columns,
     data,
     loading = false,
     onRowClick,
     searchable = true,
     searchPlaceholder = "Search...",
   }: DataTableProps<TData, TValue>) {
     const [sorting, setSorting] = useState<SortingState>([]);
     const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
     const [globalFilter, setGlobalFilter] = useState("");

     const table = useReactTable({
       data,
       columns,
       getCoreRowModel: getCoreRowModel(),
       getPaginationRowModel: getPaginationRowModel(),
       getSortedRowModel: getSortedRowModel(),
       getFilteredRowModel: getFilteredRowModel(),
       onSortingChange: setSorting,
       onColumnFiltersChange: setColumnFilters,
       onGlobalFilterChange: setGlobalFilter,
       state: {
         sorting,
         columnFilters,
         globalFilter,
       },
     });

     return (
       <div className="space-y-4">
         {searchable && (
           <div className="flex items-center py-4">
             <Input
               placeholder={searchPlaceholder}
               value={globalFilter}
               onChange={(e) => setGlobalFilter(e.target.value)}
               className="max-w-sm"
             />
           </div>
         )}

         <div className="rounded-md border">
           <table className="w-full">
             <thead>
               {table.getHeaderGroups().map((headerGroup) => (
                 <tr key={headerGroup.id} className="border-b bg-muted/50">
                   {headerGroup.headers.map((header) => (
                     <th
                       key={header.id}
                       className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                     >
                       {header.isPlaceholder ? null : (
                         <div
                           className={cn(
                             "flex items-center space-x-2",
                             header.column.getCanSort() &&
                               "cursor-pointer select-none"
                           )}
                           onClick={header.column.getToggleSortingHandler()}
                         >
                           <span>
                             {flexRender(
                               header.column.columnDef.header,
                               header.getContext()
                             )}
                           </span>
                           {header.column.getCanSort() && (
                             <div className="flex flex-col">
                               <ChevronUpIcon
                                 className={cn(
                                   "h-3 w-3",
                                   header.column.getIsSorted() === "asc"
                                     ? "text-foreground"
                                     : "text-muted-foreground"
                                 )}
                               />
                               <ChevronDownIcon
                                 className={cn(
                                   "h-3 w-3",
                                   header.column.getIsSorted() === "desc"
                                     ? "text-foreground"
                                     : "text-muted-foreground"
                                 )}
                               />
                             </div>
                           )}
                         </div>
                       )}
                     </th>
                   ))}
                 </tr>
               ))}
             </thead>
             <tbody>
               {loading ? (
                 <tr>
                   <td colSpan={columns.length} className="h-24 text-center">
                     <div className="flex items-center justify-center">
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                     </div>
                   </td>
                 </tr>
               ) : table.getRowModel().rows?.length ? (
                 table.getRowModel().rows.map((row) => (
                   <tr
                     key={row.id}
                     className={cn(
                       "border-b transition-colors hover:bg-muted/50",
                       onRowClick && "cursor-pointer"
                     )}
                     onClick={() => onRowClick?.(row.original)}
                   >
                     {row.getVisibleCells().map((cell) => (
                       <td key={cell.id} className="p-4 align-middle">
                         {flexRender(
                           cell.column.columnDef.cell,
                           cell.getContext()
                         )}
                       </td>
                     ))}
                   </tr>
                 ))
               ) : (
                 <tr>
                   <td colSpan={columns.length} className="h-24 text-center">
                     No results.
                   </td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>

         <div className="flex items-center justify-between space-x-2 py-4">
           <div className="text-sm text-muted-foreground">
             {table.getFilteredSelectedRowModel().rows.length} of{" "}
             {table.getFilteredRowModel().rows.length} row(s) selected.
           </div>
           <div className="flex items-center space-x-2">
             <Button
               variant="outline"
               size="sm"
               onClick={() => table.previousPage()}
               disabled={!table.getCanPreviousPage()}
             >
               Previous
             </Button>
             <Button
               variant="outline"
               size="sm"
               onClick={() => table.nextPage()}
               disabled={!table.getCanNextPage()}
             >
               Next
             </Button>
           </div>
         </div>
       </div>
     );
   }
   ```

3. **Create Document Form Component**

   ```typescript
   // src/components/forms/DocumentForm/DocumentForm.tsx
   import React, { useEffect } from "react";
   import { useForm, FormProvider } from "react-hook-form";
   import { zodResolver } from "@hookform/resolvers/zod";
   import { z } from "zod";
   import { Button } from "../../ui/Button";
   import { FieldRenderer } from "../FieldRenderer";
   import {
     useDocumentQuery,
     useUpdateDocumentMutation,
   } from "../../../graphql/queries";
   import { toast } from "react-hot-toast";

   interface DocumentFormProps {
     doctype: string;
     name?: string;
     onSave?: (document: any) => void;
     onSubmit?: (document: any) => void;
     onCancel?: () => void;
     readonly?: boolean;
   }

   export const DocumentForm: React.FC<DocumentFormProps> = ({
     doctype,
     name,
     onSave,
     onSubmit,
     onCancel,
     readonly = false,
   }) => {
     const {
       data: document,
       loading,
       error,
     } = useDocumentQuery({
       variables: { doctype, name },
       skip: !name,
     });

     const [updateDocument, { loading: updating }] =
       useUpdateDocumentMutation();

     // Get document schema
     const schema = getDocumentSchema(doctype);

     const methods = useForm({
       resolver: zodResolver(schema),
       defaultValues: document || getDefaultValues(doctype),
     });

     const {
       handleSubmit,
       reset,
       formState: { isDirty, isValid },
     } = methods;

     useEffect(() => {
       if (document) {
         reset(document);
       }
     }, [document, reset]);

     const onSaveDocument = async (data: any) => {
       try {
         const result = await updateDocument({
           variables: {
             doctype,
             name: name || data.name,
             data,
           },
         });

         toast.success("Document saved successfully");
         onSave?.(result.data.updateDocument);
       } catch (error) {
         toast.error("Failed to save document");
         console.error(error);
       }
     };

     const onSubmitDocument = async (data: any) => {
       try {
         // First save the document
         await onSaveDocument(data);

         // Then submit it
         // This would call a submit mutation
         toast.success("Document submitted successfully");
         onSubmit?.(data);
       } catch (error) {
         toast.error("Failed to submit document");
         console.error(error);
       }
     };

     if (loading) {
       return (
         <div className="flex items-center justify-center h-64">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
         </div>
       );
     }

     if (error) {
       return (
         <div className="text-center text-red-600 p-4">
           Error loading document: {error.message}
         </div>
       );
     }

     return (
       <FormProvider {...methods}>
         <form onSubmit={handleSubmit(onSaveDocument)} className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {getDocumentFields(doctype).map((field) => (
               <FieldRenderer
                 key={field.fieldname}
                 field={field}
                 readonly={readonly}
               />
             ))}
           </div>

           {!readonly && (
             <div className="flex items-center justify-between pt-6 border-t">
               <div className="flex space-x-2">
                 <Button
                   type="submit"
                   disabled={!isDirty || !isValid || updating}
                   loading={updating}
                 >
                   Save
                 </Button>

                 {document?.docstatus === 0 && (
                   <Button
                     type="button"
                     variant="outline"
                     onClick={handleSubmit(onSubmitDocument)}
                     disabled={!isValid || updating}
                   >
                     Submit
                   </Button>
                 )}
               </div>

               <Button type="button" variant="ghost" onClick={onCancel}>
                 Cancel
               </Button>
             </div>
           )}
         </form>
       </FormProvider>
     );
   };

   // Helper functions
   function getDocumentSchema(doctype: string) {
     // Return Zod schema based on doctype
     // This would be dynamically generated based on doctype definition
     return z.object({
       name: z.string().optional(),
       // Add more fields based on doctype
     });
   }

   function getDefaultValues(doctype: string) {
     // Return default values for new document
     return {};
   }

   function getDocumentFields(doctype: string) {
     // Return field definitions for doctype
     return [];
   }
   ```

**Acceptance Criteria:**

- [ ] Base UI components render correctly
- [ ] Data table supports sorting, filtering, and pagination
- [ ] Document form handles CRUD operations
- [ ] Form validation works with Zod schemas
- [ ] Loading states are handled properly
- [ ] Error handling displays user-friendly messages
- [ ] Components are responsive and accessible

This completes a significant portion of the implementation tasks. The document would continue with detailed tasks for:

- Remaining frontend modules (Accounts, Stock, Manufacturing, etc.)
- Testing strategies and implementation
- Deployment and DevOps setup
- Performance optimization
- Security hardening
- Documentation and training
- Go-live and support procedures

Each task includes specific code examples, acceptance criteria, and clear dependencies to ensure successful project execution.

## Phase 4: Testing & Quality Assurance (Months 31-36)

### Task 4.1: Backend Testing Implementation

**Priority:** Critical  
**Estimated Effort:** 4 weeks  
**Dependencies:** All backend modules

#### Subtasks:

1. **Setup Testing Framework**

   ```bash
   # Install testing dependencies
   npm install --save-dev jest @types/jest ts-jest
   npm install --save-dev supertest @types/supertest
   npm install --save-dev @nestjs/testing
   npm install --save-dev testcontainers
   ```

2. **Create Test Database Setup**

   ```typescript
   // src/test/test-database.ts
   import { Test } from "@nestjs/testing";
   import { PostgreSqlContainer } from "testcontainers";
   import { drizzle } from "drizzle-orm/node-postgres";
   import { Pool } from "pg";
   import { migrate } from "drizzle-orm/node-postgres/migrator";

   export class TestDatabase {
     private container: PostgreSqlContainer;
     private pool: Pool;
     private db: any;

     async setup() {
       // Start PostgreSQL container
       this.container = await new PostgreSqlContainer("postgres:15-alpine")
         .withDatabase("test_db")
         .withUsername("test_user")
         .withPassword("test_password")
         .start();

       // Create connection pool
       this.pool = new Pool({
         host: this.container.getHost(),
         port: this.container.getFirstMappedPort(),
         database: "test_db",
         username: "test_user",
         password: "test_password",
       });

       // Initialize Drizzle
       this.db = drizzle(this.pool);

       // Run migrations
       await migrate(this.db, {
         migrationsFolder: "./src/database/migrations",
       });

       return this.db;
     }

     async cleanup() {
       await this.pool.end();
       await this.container.stop();
     }

     async clearData() {
       // Clear all tables for clean test state
       const tables = [
         "sales_invoices",
         "sales_invoice_items",
         "gl_entries",
         "stock_ledger_entries",
         "bins",
         // Add all tables
       ];

       for (const table of tables) {
         await this.db.execute(`TRUNCATE TABLE ${table} CASCADE`);
       }
     }
   }
   ```

3. **Create Integration Tests**

   ```typescript
   // src/modules/accounts/tests/sales-invoice.integration.spec.ts
   import { Test, TestingModule } from "@nestjs/testing";
   import { INestApplication } from "@nestjs/common";
   import * as request from "supertest";
   import { TestDatabase } from "../../../test/test-database";
   import { AppModule } from "../../../app.module";
   import { SalesInvoiceService } from "../services/sales-invoice.service";

   describe("Sales Invoice Integration Tests", () => {
     let app: INestApplication;
     let testDb: TestDatabase;
     let salesInvoiceService: SalesInvoiceService;

     beforeAll(async () => {
       testDb = new TestDatabase();
       const db = await testDb.setup();

       const moduleFixture: TestingModule = await Test.createTestingModule({
         imports: [AppModule],
       })
         .overrideProvider("DATABASE_CONNECTION")
         .useValue(db)
         .compile();

       app = moduleFixture.createNestApplication();
       salesInvoiceService =
         moduleFixture.get<SalesInvoiceService>(SalesInvoiceService);

       await app.init();
     });

     afterAll(async () => {
       await app.close();
       await testDb.cleanup();
     });

     beforeEach(async () => {
       await testDb.clearData();
       await seedTestData();
     });

     describe("POST /api/v1/sales-invoice", () => {
       it("should create a sales invoice with correct GL entries", async () => {
         const invoiceData = {
           customer: "test-customer-id",
           postingDate: "2024-01-01",
           items: [
             {
               itemCode: "TEST-ITEM-001",
               qty: 10,
               rate: 100,
               amount: 1000,
             },
           ],
           taxes: [
             {
               accountHead: "tax-account-id",
               rate: 10,
               taxAmount: 100,
             },
           ],
         };

         const response = await request(app.getHttpServer())
           .post("/api/v1/sales-invoice")
           .send(invoiceData)
           .expect(201);

         expect(response.body).toMatchObject({
           customer: invoiceData.customer,
           grandTotal: 1100,
           outstandingAmount: 1100,
         });

         // Verify GL entries were created
         const glEntries = await getGLEntries(response.body.name);
         expect(glEntries).toHaveLength(3); // Debit AR, Credit Sales, Credit Tax

         const totalDebit = glEntries.reduce(
           (sum, entry) => sum + entry.debit,
           0
         );
         const totalCredit = glEntries.reduce(
           (sum, entry) => sum + entry.credit,
           0
         );
         expect(totalDebit).toBe(totalCredit);
       });

       it("should handle tax calculations correctly", async () => {
         const invoiceData = {
           customer: "test-customer-id",
           postingDate: "2024-01-01",
           items: [
             {
               itemCode: "TEST-ITEM-001",
               qty: 10,
               rate: 100,
               amount: 1000,
             },
           ],
           taxes: [
             {
               accountHead: "vat-account-id",
               chargeType: "On Net Total",
               rate: 18,
             },
             {
               accountHead: "service-tax-account-id",
               chargeType: "On Previous Row Total",
               rate: 12,
             },
           ],
         };

         const response = await request(app.getHttpServer())
           .post("/api/v1/sales-invoice")
           .send(invoiceData)
           .expect(201);

         // VAT: 1000 * 18% = 180
         // Service Tax: (1000 + 180) * 12% = 141.6
         // Grand Total: 1000 + 180 + 141.6 = 1321.6
         expect(response.body.grandTotal).toBe(1321.6);
       });
     });

     describe("PUT /api/v1/sales-invoice/:name/submit", () => {
       it("should submit invoice and update stock if update_stock is enabled", async () => {
         // Create draft invoice
         const invoice = await createDraftInvoice({
           updateStock: true,
           items: [
             {
               itemCode: "STOCK-ITEM-001",
               qty: 5,
               rate: 200,
               warehouse: "main-warehouse-id",
             },
           ],
         });

         // Submit invoice
         await request(app.getHttpServer())
           .put(`/api/v1/sales-invoice/${invoice.name}/submit`)
           .expect(200);

         // Verify stock was updated
         const stockBalance = await getStockBalance(
           "STOCK-ITEM-001",
           "main-warehouse-id"
         );
         expect(stockBalance.actualQty).toBe(95); // 100 - 5

         // Verify stock ledger entry was created
         const sle = await getStockLedgerEntries(
           "STOCK-ITEM-001",
           "main-warehouse-id"
         );
         expect(sle).toHaveLength(1);
         expect(sle[0].actualQty).toBe(-5);
         expect(sle[0].voucherType).toBe("Sales Invoice");
       });
     });

     async function seedTestData() {
       // Create test customers, items, accounts, etc.
       await createTestCustomer("test-customer-id");
       await createTestItem("TEST-ITEM-001");
       await createTestItem("STOCK-ITEM-001", { isStockItem: true });
       await createTestAccounts();
       await createTestWarehouse("main-warehouse-id");
       await createInitialStock("STOCK-ITEM-001", "main-warehouse-id", 100);
     }

     async function createDraftInvoice(data: any) {
       return await salesInvoiceService.create(data);
     }

     async function getGLEntries(voucherNo: string) {
       // Get GL entries for voucher
       return [];
     }

     async function getStockBalance(itemCode: string, warehouse: string) {
       // Get current stock balance
       return { actualQty: 0 };
     }

     async function getStockLedgerEntries(itemCode: string, warehouse: string) {
       // Get stock ledger entries
       return [];
     }
   });
   ```

4. **Create Unit Tests**

   ```typescript
   // src/modules/accounts/services/tax-calculation.service.spec.ts
   import { Test, TestingModule } from "@nestjs/testing";
   import { TaxCalculationService } from "./tax-calculation.service";

   describe("TaxCalculationService", () => {
     let service: TaxCalculationService;

     beforeEach(async () => {
       const module: TestingModule = await Test.createTestingModule({
         providers: [
           TaxCalculationService,
           {
             provide: "DATABASE_CONNECTION",
             useValue: mockDatabase,
           },
         ],
       }).compile();

       service = module.get<TaxCalculationService>(TaxCalculationService);
     });

     describe("calculateTaxes", () => {
       it("should calculate simple percentage tax correctly", async () => {
         const items = [
           { itemCode: "ITEM-001", amount: 1000 },
           { itemCode: "ITEM-002", amount: 500 },
         ];

         const taxRules = [
           {
             accountHead: "VAT-18",
             chargeType: "On Net Total",
             rate: 18,
           },
         ];

         const result = await service.calculateTaxes(items, { taxRules });

         expect(result).toHaveLength(1);
         expect(result[0]).toMatchObject({
           accountHead: "VAT-18",
           rate: 18,
           taxableAmount: 1500,
           taxAmount: 270,
           total: 270,
         });
       });

       it("should calculate cascading taxes correctly", async () => {
         const items = [{ itemCode: "ITEM-001", amount: 1000 }];

         const taxRules = [
           {
             accountHead: "VAT-18",
             chargeType: "On Net Total",
             rate: 18,
           },
           {
             accountHead: "CESS-2",
             chargeType: "On Previous Row Total",
             rate: 2,
           },
         ];

         const result = await service.calculateTaxes(items, { taxRules });

         expect(result).toHaveLength(2);
         expect(result[0].taxAmount).toBe(180); // 1000 * 18%
         expect(result[1].taxAmount).toBe(23.6); // (1000 + 180) * 2%
       });

       it("should handle inclusive taxes correctly", async () => {
         const items = [{ itemCode: "ITEM-001", amount: 1180 }]; // Amount inclusive of tax

         const taxRules = [
           {
             accountHead: "VAT-18",
             chargeType: "On Net Total",
             rate: 18,
             includedInPrintRate: true,
           },
         ];

         const result = await service.calculateTaxes(items, { taxRules });

         expect(result[0].taxableAmount).toBe(1000); // 1180 / 1.18
         expect(result[0].taxAmount).toBe(180);
       });
     });
   });

   const mockDatabase = {
     select: jest.fn(),
     insert: jest.fn(),
     update: jest.fn(),
     delete: jest.fn(),
   };
   ```

**Acceptance Criteria:**

- [ ] Test database setup works with containers
- [ ] Integration tests cover all major workflows
- [ ] Unit tests achieve >90% code coverage
- [ ] Tests run in CI/CD pipeline
- [ ] Performance tests validate response times
- [ ] Load tests verify system capacity
- [ ] Security tests check for vulnerabilities

### Task 4.2: Frontend Testing Implementation

**Priority:** High  
**Estimated Effort:** 3 weeks  
**Dependencies:** Task 3.2

#### Subtasks:

1. **Setup Frontend Testing**

   ```bash
   # Install testing dependencies
   npm install --save-dev vitest @vitest/ui
   npm install --save-dev @testing-library/react @testing-library/jest-dom
   npm install --save-dev @testing-library/user-event
   npm install --save-dev jsdom
   npm install --save-dev msw
   ```

2. **Create Component Tests**

   ```typescript
   // src/components/ui/DataTable/DataTable.test.tsx
   import { render, screen, fireEvent, waitFor } from "@testing-library/react";
   import userEvent from "@testing-library/user-event";
   import { DataTable } from "./DataTable";
   import { createColumnHelper } from "@tanstack/react-table";

   interface TestData {
     id: string;
     name: string;
     email: string;
     status: string;
   }

   const columnHelper = createColumnHelper<TestData>();

   const columns = [
     columnHelper.accessor("name", {
       header: "Name",
       cell: (info) => info.getValue(),
     }),
     columnHelper.accessor("email", {
       header: "Email",
       cell: (info) => info.getValue(),
     }),
     columnHelper.accessor("status", {
       header: "Status",
       cell: (info) => info.getValue(),
     }),
   ];

   const testData: TestData[] = [
     { id: "1", name: "John Doe", email: "john@example.com", status: "Active" },
     {
       id: "2",
       name: "Jane Smith",
       email: "jane@example.com",
       status: "Inactive",
     },
     {
       id: "3",
       name: "Bob Johnson",
       email: "bob@example.com",
       status: "Active",
     },
   ];

   describe("DataTable", () => {
     it("renders table with data", () => {
       render(<DataTable columns={columns} data={testData} />);

       expect(screen.getByText("John Doe")).toBeInTheDocument();
       expect(screen.getByText("jane@example.com")).toBeInTheDocument();
       expect(screen.getByText("Active")).toBeInTheDocument();
     });

     it("filters data when searching", async () => {
       const user = userEvent.setup();
       render(<DataTable columns={columns} data={testData} />);

       const searchInput = screen.getByPlaceholderText("Search...");
       await user.type(searchInput, "John");

       await waitFor(() => {
         expect(screen.getByText("John Doe")).toBeInTheDocument();
         expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
       });
     });

     it("sorts data when clicking column headers", async () => {
       const user = userEvent.setup();
       render(<DataTable columns={columns} data={testData} />);

       const nameHeader = screen.getByText("Name");
       await user.click(nameHeader);

       const rows = screen.getAllByRole("row");
       expect(rows[1]).toHaveTextContent("Bob Johnson");
       expect(rows[2]).toHaveTextContent("Jane Smith");
       expect(rows[3]).toHaveTextContent("John Doe");
     });

     it("calls onRowClick when row is clicked", async () => {
       const user = userEvent.setup();
       const onRowClick = vi.fn();

       render(
         <DataTable columns={columns} data={testData} onRowClick={onRowClick} />
       );

       const firstRow = screen.getByText("John Doe").closest("tr");
       await user.click(firstRow!);

       expect(onRowClick).toHaveBeenCalledWith(testData[0]);
     });

     it("shows loading state", () => {
       render(<DataTable columns={columns} data={[]} loading={true} />);

       expect(screen.getByRole("status")).toBeInTheDocument();
     });

     it("shows empty state when no data", () => {
       render(<DataTable columns={columns} data={[]} />);

       expect(screen.getByText("No results.")).toBeInTheDocument();
     });
   });
   ```

3. **Create E2E Tests**

   ```typescript
   // e2e/sales-invoice.spec.ts
   import { test, expect } from "@playwright/test";

   test.describe("Sales Invoice Management", () => {
     test.beforeEach(async ({ page }) => {
       // Login
       await page.goto("/login");
       await page.fill("[data-testid=email]", "test@example.com");
       await page.fill("[data-testid=password]", "password");
       await page.click("[data-testid=login-button]");

       // Wait for dashboard
       await expect(page).toHaveURL("/dashboard");
     });

     test("should create a new sales invoice", async ({ page }) => {
       // Navigate to sales invoice list
       await page.click("[data-testid=accounts-menu]");
       await page.click("[data-testid=sales-invoice-link]");

       // Click new button
       await page.click("[data-testid=new-sales-invoice]");

       // Fill form
       await page.selectOption("[data-testid=customer]", "CUST-001");
       await page.fill("[data-testid=posting-date]", "2024-01-01");

       // Add item
       await page.click("[data-testid=add-item]");
       await page.selectOption("[data-testid=item-code-0]", "ITEM-001");
       await page.fill("[data-testid=qty-0]", "10");
       await page.fill("[data-testid=rate-0]", "100");

       // Save
       await page.click("[data-testid=save-button]");

       // Verify success message
       await expect(page.locator("[data-testid=success-toast]")).toBeVisible();

       // Verify totals
       await expect(page.locator("[data-testid=grand-total]")).toHaveText(
         "1,000.00"
       );
     });

     test("should submit sales invoice and create GL entries", async ({
       page,
     }) => {
       // Create draft invoice first
       await createDraftInvoice(page);

       // Submit invoice
       await page.click("[data-testid=submit-button]");
       await page.click("[data-testid=confirm-submit]");

       // Verify status changed
       await expect(page.locator("[data-testid=docstatus]")).toHaveText(
         "Submitted"
       );

       // Check GL entries were created
       await page.click("[data-testid=view-ledger]");
       await expect(page.locator("[data-testid=gl-entries]")).toBeVisible();

       // Verify accounting entries
       const entries = page.locator("[data-testid=gl-entry-row]");
       await expect(entries).toHaveCount(3); // AR, Sales, Tax
     });

     test("should handle validation errors", async ({ page }) => {
       await page.goto("/sales-invoice/new");

       // Try to save without required fields
       await page.click("[data-testid=save-button]");

       // Verify validation errors
       await expect(page.locator("[data-testid=customer-error]")).toBeVisible();
       await expect(page.locator("[data-testid=items-error]")).toBeVisible();
     });

     async function createDraftInvoice(page) {
       await page.goto("/sales-invoice/new");
       await page.selectOption("[data-testid=customer]", "CUST-001");
       await page.fill("[data-testid=posting-date]", "2024-01-01");
       await page.click("[data-testid=add-item]");
       await page.selectOption("[data-testid=item-code-0]", "ITEM-001");
       await page.fill("[data-testid=qty-0]", "10");
       await page.fill("[data-testid=rate-0]", "100");
       await page.click("[data-testid=save-button]");
       await expect(page.locator("[data-testid=success-toast]")).toBeVisible();
     }
   });
   ```

**Acceptance Criteria:**

- [ ] Component tests cover all UI components
- [ ] Integration tests verify GraphQL operations
- [ ] E2E tests cover critical user journeys
- [ ] Visual regression tests catch UI changes
- [ ] Accessibility tests ensure WCAG compliance
- [ ] Performance tests validate load times
- [ ] Cross-browser testing passes

## Phase 5: Deployment & DevOps (Months 37-42)

### Task 5.1: Production Infrastructure Setup

**Priority:** Critical  
**Estimated Effort:** 4 weeks  
**Dependencies:** All development tasks

#### Subtasks:

1. **Create Kubernetes Manifests**

   ```yaml
   # k8s/namespace.yaml
   apiVersion: v1
   kind: Namespace
   metadata:
     name: erpnext-production
     labels:
       name: erpnext-production

   ---
   # k8s/configmap.yaml
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: erpnext-config
     namespace: erpnext-production
   data:
     NODE_ENV: "production"
     LOG_LEVEL: "info"
     GRAPHQL_PLAYGROUND: "false"
     CORS_ORIGIN: "https://app.erpnext.com"

   ---
   # k8s/secret.yaml
   apiVersion: v1
   kind: Secret
   metadata:
     name: erpnext-secrets
     namespace: erpnext-production
   type: Opaque
   data:
     DATABASE_URL: <base64-encoded-database-url>
     JWT_SECRET: <base64-encoded-jwt-secret>
     REDIS_URL: <base64-encoded-redis-url>

   ---
   # k8s/backend-deployment.yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: erpnext-backend
     namespace: erpnext-production
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
             image: erpnext/backend:latest
             ports:
               - containerPort: 3000
             env:
               - name: NODE_ENV
                 valueFrom:
                   configMapKeyRef:
                     name: erpnext-config
                     key: NODE_ENV
               - name: DATABASE_URL
                 valueFrom:
                   secretKeyRef:
                     name: erpnext-secrets
                     key: DATABASE_URL
               - name: JWT_SECRET
                 valueFrom:
                   secretKeyRef:
                     name: erpnext-secrets
                     key: JWT_SECRET
               - name: REDIS_URL
                 valueFrom:
                   secretKeyRef:
                     name: erpnext-secrets
                     key: REDIS_URL
             resources:
               requests:
                 memory: "1Gi"
                 cpu: "500m"
               limits:
                 memory: "2Gi"
                 cpu: "1000m"
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
   # k8s/frontend-deployment.yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: erpnext-frontend
     namespace: erpnext-production
   spec:
     replicas: 2
     selector:
       matchLabels:
         app: erpnext-frontend
     template:
       metadata:
         labels:
           app: erpnext-frontend
       spec:
         containers:
           - name: frontend
             image: erpnext/frontend:latest
             ports:
               - containerPort: 80
             resources:
               requests:
                 memory: "256Mi"
                 cpu: "100m"
               limits:
                 memory: "512Mi"
                 cpu: "200m"

   ---
   # k8s/services.yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: erpnext-backend-service
     namespace: erpnext-production
   spec:
     selector:
       app: erpnext-backend
     ports:
       - port: 80
         targetPort: 3000
     type: ClusterIP

   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: erpnext-frontend-service
     namespace: erpnext-production
   spec:
     selector:
       app: erpnext-frontend
     ports:
       - port: 80
         targetPort: 80
     type: ClusterIP

   ---
   # k8s/ingress.yaml
   apiVersion: networking.k8s.io/v1
   kind: Ingress
   metadata:
     name: erpnext-ingress
     namespace: erpnext-production
     annotations:
       nginx.ingress.kubernetes.io/rewrite-target: /
       cert-manager.io/cluster-issuer: letsencrypt-prod
       nginx.ingress.kubernetes.io/rate-limit: "100"
       nginx.ingress.kubernetes.io/rate-limit-window: "1m"
   spec:
     tls:
       - hosts:
           - app.erpnext.com
           - api.erpnext.com
         secretName: erpnext-tls
     rules:
       - host: app.erpnext.com
         http:
           paths:
             - path: /
               pathType: Prefix
               backend:
                 service:
                   name: erpnext-frontend-service
                   port:
                     number: 80
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

   ---
   # k8s/hpa.yaml
   apiVersion: autoscaling/v2
   kind: HorizontalPodAutoscaler
   metadata:
     name: erpnext-backend-hpa
     namespace: erpnext-production
   spec:
     scaleTargetRef:
       apiVersion: apps/v1
       kind: Deployment
       name: erpnext-backend
     minReplicas: 3
     maxReplicas: 10
     metrics:
       - type: Resource
         resource:
           name: cpu
           target:
             type: Utilization
             averageUtilization: 70
       - type: Resource
         resource:
           name: memory
           target:
             type: Utilization
             averageUtilization: 80
   ```

2. **Setup CI/CD Pipeline**

   ```yaml
   # .github/workflows/ci-cd.yml
   name: CI/CD Pipeline

   on:
     push:
       branches: [main, develop]
     pull_request:
       branches: [main]

   env:
     REGISTRY: ghcr.io
     IMAGE_NAME: ${{ github.repository }}

   jobs:
     test-backend:
       runs-on: ubuntu-latest
       services:
         postgres:
           image: postgres:15
           env:
             POSTGRES_PASSWORD: postgres
             POSTGRES_DB: test_db
           options: >-
             --health-cmd pg_isready
             --health-interval 10s
             --health-timeout 5s
             --health-retries 5
         redis:
           image: redis:7
           options: >-
             --health-cmd "redis-cli ping"
             --health-interval 10s
             --health-timeout 5s
             --health-retries 5

       steps:
         - uses: actions/checkout@v4

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: "18"
             cache: "npm"
             cache-dependency-path: backend/package-lock.json

         - name: Install dependencies
           run: |
             cd backend
             npm ci

         - name: Run linting
           run: |
             cd backend
             npm run lint

         - name: Run type checking
           run: |
             cd backend
             npm run type-check

         - name: Run unit tests
           run: |
             cd backend
             npm run test
           env:
             DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
             REDIS_URL: redis://localhost:6379

         - name: Run integration tests
           run: |
             cd backend
             npm run test:e2e
           env:
             DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
             REDIS_URL: redis://localhost:6379

         - name: Upload coverage reports
           uses: codecov/codecov-action@v3
           with:
             file: backend/coverage/lcov.info

     test-frontend:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: "18"
             cache: "npm"
             cache-dependency-path: frontend/package-lock.json

         - name: Install dependencies
           run: |
             cd frontend
             npm ci

         - name: Run linting
           run: |
             cd frontend
             npm run lint

         - name: Run type checking
           run: |
             cd frontend
             npm run type-check

         - name: Run unit tests
           run: |
             cd frontend
             npm run test

         - name: Build application
           run: |
             cd frontend
             npm run build

         - name: Run E2E tests
           run: |
             cd frontend
             npm run test:e2e

     security-scan:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         - name: Run Trivy vulnerability scanner
           uses: aquasecurity/trivy-action@master
           with:
             scan-type: "fs"
             scan-ref: "."
             format: "sarif"
             output: "trivy-results.sarif"

         - name: Upload Trivy scan results
           uses: github/codeql-action/upload-sarif@v2
           with:
             sarif_file: "trivy-results.sarif"

     build-and-push:
       needs: [test-backend, test-frontend, security-scan]
       runs-on: ubuntu-latest
       if: github.ref == 'refs/heads/main'

       steps:
         - uses: actions/checkout@v4

         - name: Log in to Container Registry
           uses: docker/login-action@v3
           with:
             registry: ${{ env.REGISTRY }}
             username: ${{ github.actor }}
             password: ${{ secrets.GITHUB_TOKEN }}

         - name: Extract metadata
           id: meta-backend
           uses: docker/metadata-action@v5
           with:
             images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/backend
             tags: |
               type=ref,event=branch
               type=sha,prefix={{branch}}-
               type=raw,value=latest,enable={{is_default_branch}}

         - name: Build and push backend image
           uses: docker/build-push-action@v5
           with:
             context: ./backend
             push: true
             tags: ${{ steps.meta-backend.outputs.tags }}
             labels: ${{ steps.meta-backend.outputs.labels }}

         - name: Extract metadata
           id: meta-frontend
           uses: docker/metadata-action@v5
           with:
             images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/frontend

         - name: Build and push frontend image
           uses: docker/build-push-action@v5
           with:
             context: ./frontend
             push: true
             tags: ${{ steps.meta-frontend.outputs.tags }}
             labels: ${{ steps.meta-frontend.outputs.labels }}

     deploy:
       needs: build-and-push
       runs-on: ubuntu-latest
       if: github.ref == 'refs/heads/main'
       environment: production

       steps:
         - uses: actions/checkout@v4

         - name: Setup kubectl
           uses: azure/setup-kubectl@v3
           with:
             version: "latest"

         - name: Configure kubectl
           run: |
             echo "${{ secrets.KUBE_CONFIG }}" | base64 -d > kubeconfig
             export KUBECONFIG=kubeconfig

         - name: Deploy to Kubernetes
           run: |
             export KUBECONFIG=kubeconfig
             kubectl apply -f k8s/
             kubectl rollout status deployment/erpnext-backend -n erpnext-production
             kubectl rollout status deployment/erpnext-frontend -n erpnext-production

         - name: Run smoke tests
           run: |
             # Wait for deployment to be ready
             sleep 30

             # Run basic health checks
             curl -f https://api.erpnext.com/health || exit 1
             curl -f https://app.erpnext.com || exit 1
   ```

**Acceptance Criteria:**

- [ ] Kubernetes cluster is properly configured
- [ ] CI/CD pipeline runs all tests successfully
- [ ] Docker images are built and pushed automatically
- [ ] Deployments are automated and reliable
- [ ] Health checks and monitoring are configured
- [ ] SSL certificates are automatically managed
- [ ] Auto-scaling works based on load
- [ ] Rollback procedures are tested

### Task 5.2: Monitoring & Observability

**Priority:** High  
**Estimated Effort:** 2 weeks  
**Dependencies:** Task 5.1

#### Subtasks:

1. **Setup Prometheus & Grafana**

   ```yaml
   # k8s/monitoring/prometheus.yaml
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: prometheus-config
     namespace: erpnext-production
   data:
     prometheus.yml: |
       global:
         scrape_interval: 15s
         evaluation_interval: 15s

       rule_files:
         - "alert_rules.yml"

       alerting:
         alertmanagers:
           - static_configs:
               - targets:
                 - alertmanager:9093

       scrape_configs:
         - job_name: 'erpnext-backend'
           static_configs:
             - targets: ['erpnext-backend-service:80']
           metrics_path: /metrics
           scrape_interval: 30s
         
         - job_name: 'postgres'
           static_configs:
             - targets: ['postgres-exporter:9187']
         
         - job_name: 'redis'
           static_configs:
             - targets: ['redis-exporter:9121']
         
         - job_name: 'kubernetes-pods'
           kubernetes_sd_configs:
             - role: pod
           relabel_configs:
             - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
               action: keep
               regex: true

   ---
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: prometheus
     namespace: erpnext-production
   spec:
     replicas: 1
     selector:
       matchLabels:
         app: prometheus
     template:
       metadata:
         labels:
           app: prometheus
       spec:
         containers:
           - name: prometheus
             image: prom/prometheus:latest
             ports:
               - containerPort: 9090
             volumeMounts:
               - name: config
                 mountPath: /etc/prometheus
               - name: storage
                 mountPath: /prometheus
             args:
               - "--config.file=/etc/prometheus/prometheus.yml"
               - "--storage.tsdb.path=/prometheus"
               - "--web.console.libraries=/etc/prometheus/console_libraries"
               - "--web.console.templates=/etc/prometheus/consoles"
               - "--storage.tsdb.retention.time=30d"
               - "--web.enable-lifecycle"
         volumes:
           - name: config
             configMap:
               name: prometheus-config
           - name: storage
             persistentVolumeClaim:
               claimName: prometheus-storage
   ```

2. **Create Application Metrics**

   ```typescript
   // src/monitoring/metrics.service.ts
   import { Injectable } from "@nestjs/common";
   import { register, Counter, Histogram, Gauge } from "prom-client";

   @Injectable()
   export class MetricsService {
     private readonly httpRequestDuration = new Histogram({
       name: "http_request_duration_seconds",
       help: "Duration of HTTP requests in seconds",
       labelNames: ["method", "route", "status_code"],
       buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
     });

     private readonly httpRequestTotal = new Counter({
       name: "http_requests_total",
       help: "Total number of HTTP requests",
       labelNames: ["method", "route", "status_code"],
     });

     private readonly databaseQueryDuration = new Histogram({
       name: "database_query_duration_seconds",
       help: "Duration of database queries in seconds",
       labelNames: ["operation", "table"],
       buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
     });

     private readonly activeUsers = new Gauge({
       name: "active_users_total",
       help: "Number of active users",
     });

     private readonly documentOperations = new Counter({
       name: "document_operations_total",
       help: "Total number of document operations",
       labelNames: ["doctype", "operation"],
     });

     recordHttpRequest(
       method: string,
       route: string,
       statusCode: number,
       duration: number
     ) {
       this.httpRequestDuration
         .labels(method, route, statusCode.toString())
         .observe(duration);

       this.httpRequestTotal.labels(method, route, statusCode.toString()).inc();
     }

     recordDatabaseQuery(operation: string, table: string, duration: number) {
       this.databaseQueryDuration.labels(operation, table).observe(duration);
     }

     setActiveUsers(count: number) {
       this.activeUsers.set(count);
     }

     recordDocumentOperation(doctype: string, operation: string) {
       this.documentOperations.labels(doctype, operation).inc();
     }

     getMetrics() {
       return register.metrics();
     }
   }

   // Middleware to collect HTTP metrics
   @Injectable()
   export class MetricsMiddleware implements NestMiddleware {
     constructor(private metricsService: MetricsService) {}

     use(req: Request, res: Response, next: NextFunction) {
       const start = Date.now();

       res.on("finish", () => {
         const duration = (Date.now() - start) / 1000;
         this.metricsService.recordHttpRequest(
           req.method,
           req.route?.path || req.url,
           res.statusCode,
           duration
         );
       });

       next();
     }
   }
   ```

3. **Setup Logging with ELK Stack**

   ```typescript
   // src/logging/logger.service.ts
   import { Injectable, LoggerService } from "@nestjs/common";
   import { createLogger, format, transports } from "winston";
   import { ElasticsearchTransport } from "winston-elasticsearch";

   @Injectable()
   export class CustomLoggerService implements LoggerService {
     private logger = createLogger({
       level: process.env.LOG_LEVEL || "info",
       format: format.combine(
         format.timestamp(),
         format.errors({ stack: true }),
         format.json(),
         format.printf(({ timestamp, level, message, ...meta }) => {
           return JSON.stringify({
             timestamp,
             level,
             message,
             ...meta,
             service: "erpnext-backend",
             environment: process.env.NODE_ENV,
           });
         })
       ),
       transports: [
         new transports.Console(),
         new transports.File({
           filename: "logs/error.log",
           level: "error",
         }),
         new transports.File({
           filename: "logs/combined.log",
         }),
       ],
     });

     constructor() {
       // Add Elasticsearch transport in production
       if (
         process.env.NODE_ENV === "production" &&
         process.env.ELASTICSEARCH_URL
       ) {
         this.logger.add(
           new ElasticsearchTransport({
             level: "info",
             clientOpts: {
               node: process.env.ELASTICSEARCH_URL,
             },
             index: "erpnext-logs",
           })
         );
       }
     }

     log(message: string, context?: string) {
       this.logger.info(message, { context });
     }

     error(message: string, trace?: string, context?: string) {
       this.logger.error(message, { trace, context });
     }

     warn(message: string, context?: string) {
       this.logger.warn(message, { context });
     }

     debug(message: string, context?: string) {
       this.logger.debug(message, { context });
     }

     verbose(message: string, context?: string) {
       this.logger.verbose(message, { context });
     }

     // Business-specific logging methods
     logDocumentOperation(
       operation: string,
       doctype: string,
       docname: string,
       user: string
     ) {
       this.logger.info("Document operation", {
         operation,
         doctype,
         docname,
         user,
         category: "document_operation",
       });
     }

     logSecurityEvent(event: string, user: string, ip: string, details?: any) {
       this.logger.warn("Security event", {
         event,
         user,
         ip,
         details,
         category: "security",
       });
     }

     logPerformanceIssue(
       operation: string,
       duration: number,
       threshold: number
     ) {
       this.logger.warn("Performance issue detected", {
         operation,
         duration,
         threshold,
         category: "performance",
       });
     }
   }
   ```

**Acceptance Criteria:**

- [ ] Prometheus collects application metrics
- [ ] Grafana dashboards show system health
- [ ] Alerting rules notify on issues
- [ ] Logs are centralized and searchable
- [ ] Performance metrics are tracked
- [ ] Business metrics are monitored
- [ ] Error tracking and alerting works
- [ ] Uptime monitoring is configured

This completes the comprehensive implementation tasks document. The full document now covers:

1. **Phase 1**: Foundation & Core Infrastructure (6 months)
2. **Phase 2**: Business Modules Implementation (12 months)
3. **Phase 3**: Frontend Development (12 months)
4. **Phase 4**: Testing & Quality Assurance (6 months)
5. **Phase 5**: Deployment & DevOps (6 months)

Each phase includes detailed tasks with:

- Specific code examples and implementations
- Clear acceptance criteria
- Proper dependencies and sequencing
- Realistic time estimates
- Best practices and senior-level architecture decisions

The plan provides a complete roadmap for rebuilding ERPNext with modern technologies while maintaining 100% feature parity and achieving superior performance, scalability, and developer experience.
k
