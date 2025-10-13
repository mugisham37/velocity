import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { assets } from './assets';
import { companies } from './companies';
import { items } from './items';
import { users } from './users';

// Maintenance Schedules
export const maintenanceSchedules = pgTable(
  'maintenance_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scheduleCode: varchar('schedule_code', { length: 50 }).notNull(),
    scheduleName: varchar('schedule_name', { length: 255 }).notNull(),
    assetId: uuid('asset_id')
      .references(() => assets.id)
      .notNull(),

    // Schedule Type and Configuration
    maintenanceType: varchar('maintenance_type', { length: 50 }).notNull(), // Preventive, Predictive, Condition-based
    scheduleType: varchar('schedule_type', { length: 50 }).notNull(), // Time-based, Usage-based, Condition-based

    // Time-based Scheduling
    frequency: integer('frequency'), // Number of units
    frequencyUnit: varchar('frequency_unit', { length: 20 }), // Days, Weeks, Months, Years

    // Usage-based Scheduling
    usageThreshold: integer('usage_threshold'), // Operating hours, cycles, etc.
    usageUnit: varchar('usage_unit', { length: 50 }), // Hours, Cycles, Miles, etc.

    // Schedule Dates
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date'),
    nextDueDate: timestamp('next_due_date'),
    lastMaintenanceDate: timestamp('last_maintenance_date'),

    // Maintenance Details
    description: text('description'),
    instructions: text('instructions'),
    estimatedDuration: integer('estimated_duration'), // in minutes
    priority: varchar('priority', { length: 20 }).default('Medium'), // Low, Medium, High, Critical

    // Resource Requirements
    requiredSkills: jsonb('required_skills'),
    estimatedCost: decimal('estimated_cost', { precision: 15, scale: 2 }),

    // Status and Control
    status: varchar('status', { length: 50 }).default('Active'), // Active, Inactive, Suspended
    isActive: boolean('is_active').default(true).notNull(),

    // Notification Settings
    notificationLeadTime: integer('notification_lead_time'), // days before due date
    notifyUsers: jsonb('notify_users'), // Array of user IDs

    // Audit Fields
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
  },
  table => ({
    scheduleCodeCompanyIdx: unique().on(table.scheduleCode, table.companyId),
    assetIdx: index().on(table.assetId),
    statusIdx: index().on(table.status),
    nextDueDateIdx: index().on(table.nextDueDate),
    priorityIdx: index().on(table.priority),
  })
);

// Maintenance Work Orders
export const maintenanceWorkOrders = pgTable(
  'maintenance_work_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workOrderNumber: varchar('work_order_number', { length: 50 }).notNull(),
    assetId: uuid('asset_id')
      .references(() => assets.id)
      .notNull(),
    scheduleId: uuid('schedule_id').references(() => maintenanceSchedules.id),

    // Work Order Details
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    workOrderType: varchar('work_order_type', { length: 50 }).notNull(), // Preventive, Corrective, Emergency, Inspection
    priority: varchar('priority', { length: 20 }).default('Medium'), // Low, Medium, High, Critical

    // Scheduling
    scheduledStartDate: timestamp('scheduled_start_date'),
    scheduledEndDate: timestamp('scheduled_end_date'),
    actualStartDate: timestamp('actual_start_date'),
    actualEndDate: timestamp('actual_end_date'),
    estimatedDuration: integer('estimated_duration'), // in minutes
    actualDuration: integer('actual_duration'), // in minutes

    // Assignment
    assignedToId: uuid('assigned_to_id').references(() => users.id),
    assignedTeam: jsonb('assigned_team'), // Array of user IDs

    // Status and Workflow
    status: varchar('status', { length: 50 }).default('Open'), // Open, In Progress, On Hold, Completed, Cancelled
    completionPercentage: integer('completion_percentage').default(0),

    // Cost Tracking
    estimatedCost: decimal('estimated_cost', { precision: 15, scale: 2 }),
    actualCost: decimal('actual_cost', { precision: 15, scale: 2 }),
    laborCost: decimal('labor_cost', { precision: 15, scale: 2 }),
    materialCost: decimal('material_cost', { precision: 15, scale: 2 }),
    externalServiceCost: decimal('external_service_cost', {
      precision: 15,
      scale: 2,
    }),

    // Failure Information (for corrective maintenance)
    failureDescription: text('failure_description'),
    failureCause: text('failure_cause'),
    failureType: varchar('failure_type', { length: 100 }),

    // Completion Information
    workPerformed: text('work_performed'),
    partsUsed: jsonb('parts_used'),
    completionNotes: text('completion_notes'),
    completedBy: uuid('completed_by').references(() => users.id),
    completedAt: timestamp('completed_at'),

    // Quality and Safety
    safetyPrecautions: text('safety_precautions'),
    qualityChecks: jsonb('quality_checks'),

    // Documentation
    attachments: jsonb('attachments'),

    // Approval Workflow
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at'),

    // Audit Fields
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
  },
  table => ({
    workOrderNumberCompanyIdx: unique().on(
      table.workOrderNumber,
      table.companyId
    ),
    assetIdx: index().on(table.assetId),
    scheduleIdx: index().on(table.scheduleId),
    statusIdx: index().on(table.status),
    priorityIdx: index().on(table.priority),
    assignedToIdx: index().on(table.assignedToId),
    scheduledStartDateIdx: index().on(table.scheduledStartDate),
  })
);

// Maintenance History
export const maintenanceHistory = pgTable(
  'maintenance_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    assetId: uuid('asset_id')
      .references(() => assets.id)
      .notNull(),
    workOrderId: uuid('work_order_id').references(
      () => maintenanceWorkOrders.id
    ),

    // Maintenance Event Details
    maintenanceDate: timestamp('maintenance_date').notNull(),
    maintenanceType: varchar('maintenance_type', { length: 50 }).notNull(),
    description: text('description').notNull(),

    // Performance Metrics
    downtime: integer('downtime'), // in minutes
    mtbf: integer('mtbf'), // Mean Time Between Failures in hours
    mttr: integer('mttr'), // Mean Time To Repair in minutes

    // Cost Information
    totalCost: decimal('total_cost', { precision: 15, scale: 2 }),
    laborHours: decimal('labor_hours', { precision: 8, scale: 2 }),
    laborCost: decimal('labor_cost', { precision: 15, scale: 2 }),
    materialCost: decimal('material_cost', { precision: 15, scale: 2 }),

    // Technician Information
    performedBy: uuid('performed_by').references(() => users.id),
    technicianNotes: text('technician_notes'),

    // Parts and Materials Used
    partsUsed: jsonb('parts_used'),

    // Quality and Effectiveness
    effectivenessRating: integer('effectiveness_rating'), // 1-5 scale
    customerSatisfaction: integer('customer_satisfaction'), // 1-5 scale

    // Follow-up Actions
    followUpRequired: boolean('follow_up_required').default(false),
    followUpDate: timestamp('follow_up_date'),
    followUpNotes: text('follow_up_notes'),

    // Audit Fields
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
  },
  table => ({
    assetIdx: index().on(table.assetId),
    workOrderIdx: index().on(table.workOrderId),
    maintenanceDateIdx: index().on(table.maintenanceDate),
    performedByIdx: index().on(table.performedBy),
  })
);

// Spare Parts Inventory
export const spareParts = pgTable(
  'spare_parts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    partCode: varchar('part_code', { length: 50 }).notNull(),
    partName: varchar('part_name', { length: 255 }).notNull(),
    itemId: uuid('item_id').references(() => items.id), // Link to inventory item if managed in inventory

    // Part Details
    description: text('description'),
    manufacturer: varchar('manufacturer', { length: 255 }),
    manufacturerPartNumber: varchar('manufacturer_part_number', {
      length: 100,
    }),
    supplierPartNumber: varchar('supplier_part_number', { length: 100 }),

    // Inventory Information
    currentStock: integer('current_stock').default(0),
    minimumStock: integer('minimum_stock').default(0),
    maximumStock: integer('maximum_stock'),
    reorderPoint: integer('reorder_point'),

    // Cost Information
    unitCost: decimal('unit_cost', { precision: 15, scale: 2 }),
    lastPurchasePrice: decimal('last_purchase_price', {
      precision: 15,
      scale: 2,
    }),
    averageCost: decimal('average_cost', { precision: 15, scale: 2 }),

    // Part Specifications
    specifications: jsonb('specifications'),
    compatibleAssets: jsonb('compatible_assets'), // Array of asset IDs

    // Storage Information
    storageLocation: varchar('storage_location', { length: 255 }),
    shelfLife: integer('shelf_life'), // in days

    // Status
    status: varchar('status', { length: 50 }).default('Active'), // Active, Inactive, Discontinued
    isActive: boolean('is_active').default(true).notNull(),

    // Audit Fields
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
  },
  table => ({
    partCodeCompanyIdx: unique().on(table.partCode, table.companyId),
    itemIdx: index().on(table.itemId),
    statusIdx: index().on(table.status),
    manufacturerPartNumberIdx: index().on(table.manufacturerPartNumber),
  })
);

// Maintenance Costs
export const maintenanceCosts = pgTable(
  'maintenance_costs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workOrderId: uuid('work_order_id')
      .references(() => maintenanceWorkOrders.id)
      .notNull(),

    // Cost Details
    costType: varchar('cost_type', { length: 50 }).notNull(), // Labor, Material, External Service, Equipment
    description: text('description'),

    // Financial Information
    quantity: decimal('quantity', { precision: 15, scale: 6 }),
    unitCost: decimal('unit_cost', { precision: 15, scale: 2 }),
    totalCost: decimal('total_cost', { precision: 15, scale: 2 }).notNull(),

    // Labor Specific
    laborHours: decimal('labor_hours', { precision: 8, scale: 2 }),
    hourlyRate: decimal('hourly_rate', { precision: 15, scale: 2 }),
    technicianId: uuid('technician_id').references(() => users.id),

    // Material Specific
    sparePartId: uuid('spare_part_id').references(() => spareParts.id),
    quantityUsed: integer('quantity_used'),

    // External Service Specific
    vendorName: varchar('vendor_name', { length: 255 }),
    serviceDescription: text('service_description'),

    // Date and Status
    costDate: timestamp('cost_date').notNull(),
    status: varchar('status', { length: 50 }).default('Pending'), // Pending, Approved, Invoiced, Paid

    // Approval
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at'),

    // Audit Fields
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
  },
  table => ({
    workOrderIdx: index().on(table.workOrderId),
    costTypeIdx: index().on(table.costType),
    costDateIdx: index().on(table.costDate),
    statusIdx: index().on(table.status),
    technicianIdx: index().on(table.technicianId),
    sparePartIdx: index().on(table.sparePartId),
  })
);

// Relations
export const maintenanceSchedulesRelations = relations(
  maintenanceSchedules,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [maintenanceSchedules.companyId],
      references: [companies.id],
    }),
    asset: one(assets, {
      fields: [maintenanceSchedules.assetId],
      references: [assets.id],
    }),
    createdByUser: one(users, {
      fields: [maintenanceSchedules.createdBy],
      references: [users.id],
    }),
    updatedByUser: one(users, {
      fields: [maintenanceSchedules.updatedBy],
      references: [users.id],
    }),
    workOrders: many(maintenanceWorkOrders),
  })
);

export const maintenanceWorkOrdersRelations = relations(
  maintenanceWorkOrders,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [maintenanceWorkOrders.companyId],
      references: [companies.id],
    }),
    asset: one(assets, {
      fields: [maintenanceWorkOrders.assetId],
      references: [assets.id],
    }),
    schedule: one(maintenanceSchedules, {
      fields: [maintenanceWorkOrders.scheduleId],
      references: [maintenanceSchedules.id],
    }),
    assignedTo: one(users, {
      fields: [maintenanceWorkOrders.assignedToId],
      references: [users.id],
    }),
    completedByUser: one(users, {
      fields: [maintenanceWorkOrders.completedBy],
      references: [users.id],
    }),
    approvedByUser: one(users, {
      fields: [maintenanceWorkOrders.approvedBy],
      references: [users.id],
    }),
    createdByUser: one(users, {
      fields: [maintenanceWorkOrders.createdBy],
      references: [users.id],
    }),
    updatedByUser: one(users, {
      fields: [maintenanceWorkOrders.updatedBy],
      references: [users.id],
    }),
    history: many(maintenanceHistory),
    costs: many(maintenanceCosts),
  })
);

export const maintenanceHistoryRelations = relations(
  maintenanceHistory,
  ({ one }) => ({
    company: one(companies, {
      fields: [maintenanceHistory.companyId],
      references: [companies.id],
    }),
    asset: one(assets, {
      fields: [maintenanceHistory.assetId],
      references: [assets.id],
    }),
    workOrder: one(maintenanceWorkOrders, {
      fields: [maintenanceHistory.workOrderId],
      references: [maintenanceWorkOrders.id],
    }),
    performedByUser: one(users, {
      fields: [maintenanceHistory.performedBy],
      references: [users.id],
    }),
    createdByUser: one(users, {
      fields: [maintenanceHistory.createdBy],
      references: [users.id],
    }),
    updatedByUser: one(users, {
      fields: [maintenanceHistory.updatedBy],
      references: [users.id],
    }),
  })
);

export const sparePartsRelations = relations(spareParts, ({ one, many }) => ({
  company: one(companies, {
    fields: [spareParts.companyId],
    references: [companies.id],
  }),
  item: one(items, {
    fields: [spareParts.itemId],
    references: [items.id],
  }),
  createdByUser: one(users, {
    fields: [spareParts.createdBy],
    references: [users.id],
  }),
  updatedByUser: one(users, {
    fields: [spareParts.updatedBy],
    references: [users.id],
  }),
  costs: many(maintenanceCosts),
}));

export const maintenanceCostsRelations = relations(
  maintenanceCosts,
  ({ one }) => ({
    company: one(companies, {
      fields: [maintenanceCosts.companyId],
      references: [companies.id],
    }),
    workOrder: one(maintenanceWorkOrders, {
      fields: [maintenanceCosts.workOrderId],
      references: [maintenanceWorkOrders.id],
    }),
    technician: one(users, {
      fields: [maintenanceCosts.technicianId],
      references: [users.id],
    }),
    sparePart: one(spareParts, {
      fields: [maintenanceCosts.sparePartId],
      references: [spareParts.id],
    }),
    approvedByUser: one(users, {
      fields: [maintenanceCosts.approvedBy],
      references: [users.id],
    }),
    createdByUser: one(users, {
      fields: [maintenanceCosts.createdBy],
      references: [users.id],
    }),
    updatedByUser: one(users, {
      fields: [maintenanceCosts.updatedBy],
      references: [users.id],
    }),
  })
);

// Export types
export type MaintenanceSchedule = typeof maintenanceSchedules.$inferSelect;
export type NewMaintenanceSchedule = typeof maintenanceSchedules.$inferInsert;
export type MaintenanceWorkOrder = typeof maintenanceWorkOrders.$inferSelect;
export type NewMaintenanceWorkOrder = typeof maintenanceWorkOrders.$inferInsert;
export type MaintenanceHistory = typeof maintenanceHistory.$inferSelect;
export type NewMaintenanceHistory = typeof maintenanceHistory.$inferInsert;
export type SparePart = typeof spareParts.$inferSelect;
export type NewSparePart = typeof spareParts.$inferInsert;
export type MaintenanceCost = typeof maintenanceCosts.$inferSelect;
export type NewMaintenanceCost = typeof maintenanceCosts.$inferInsert;

