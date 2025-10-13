import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { users } from './users';

// Workflow Definition Schema
export const workflows = pgTable(
  'workflows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 100 }).notNull(), // 'approval', 'automation', 'notification', etc.
    version: integer('version').notNull().default(1),
    isActive: boolean('is_active').notNull().default(true),
    isTemplate: boolean('is_template').notNull().default(false),

    // Workflow Definition (JSON structure)
    definition: jsonb('definition').notNull(), // Contains nodes, edges, conditions, etc.

    // Metadata
    tags: jsonb('tags'), // Array of tags for categorization
    permissions: jsonb('permissions'), // Who can view/edit/execute

    // Audit fields
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => ({
    companyIdIdx: index('workflows_company_id_idx').on(table.companyId),
    categoryIdx: index('workflows_category_idx').on(table.category),
    activeIdx: index('workflows_active_idx').on(table.isActive),
  })
);

// Workflow Instances (Executions)
export const workflowInstances = pgTable(
  'workflow_instances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workflowId: uuid('workflow_id')
      .notNull()
      .references(() => workflows.id),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),

    // Instance metadata
    name: varchar('name', { length: 255 }),
    status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, running, completed, failed, cancelled
    priority: varchar('priority', { length: 20 }).notNull().default('normal'), // low, normal, high, urge

    // Context data
    contextData: jsonb('context_data'), // Input data for the workflow
    currentStep: varchar('current_step', { length: 100 }),

    // Timing
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    dueDate: timestamp('due_date'),

    // SLA tracking
    slaBreached: boolean('sla_breached').notNull().default(false),
    slaBreachedAt: timestamp('sla_breached_at'),

    // Audit
    initiatedBy: uuid('initiated_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => ({
    workflowIdIdx: index('workflow_instances_workflow_id_idx').on(
      table.workflowId
    ),
    statusIdx: index('workflow_instances_status_idx').on(table.status),
    dueDateIdx: index('workflow_instances_due_date_idx').on(table.dueDate),
    slaIdx: index('workflow_instances_sla_idx').on(table.slaBreached),
  })
);

// Workflow Steps/Tasks
export const workflowSteps = pgTable(
  'workflow_steps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    instanceId: uuid('instance_id')
      .notNull()
      .references(() => workflowInstances.id),
    stepId: varchar('step_id', { length: 100 }).notNull(), // Reference to step in workflow definition

    // Step details
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // approval, task, condition, parallel, etc.
    status: varchar('status', { length: 50 }).notNull().default('pending'),

    // Assignment
    assignedTo: uuid('assigned_to').references(() => users.id),
    assignedRole: varchar('assigned_role', { length: 100 }),

    // Data
    inputData: jsonb('input_data'),
    outputData: jsonb('output_data'),

    // Timing
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    dueDate: timestamp('due_date'),

    // Comments and attachments
    comments: text('comments'),
    attachments: jsonb('attachments'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => ({
    instanceIdIdx: index('workflow_steps_instance_id_idx').on(table.instanceId),
    statusIdx: index('workflow_steps_status_idx').on(table.status),
    assignedToIdx: index('workflow_steps_assigned_to_idx').on(table.assignedTo),
  })
);

// Workflow Approvals
export const workflowApprovals = pgTable(
  'workflow_approvals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    stepId: uuid('step_id')
      .notNull()
      .references(() => workflowSteps.id),
    instanceId: uuid('instance_id')
      .notNull()
      .references(() => workflowInstances.id),

    // Approval details
    approverId: uuid('approver_id')
      .notNull()
      .references(() => users.id),
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, approved, rejected, delegated
    decision: varchar('decision', { length: 20 }), // approve, reject, delegate

    // Comments and reasoning
    comments: text('comments'),
    reason: text('reason'),

    // Delegation
    delegatedTo: uuid('delegated_to').references(() => users.id),
    delegationReason: text('delegation_reason'),

    // Timing
    requestedAt: timestamp('requested_at').notNull().defaultNow(),
    respondedAt: timestamp('responded_at'),
    dueDate: timestamp('due_date'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => ({
    stepIdIdx: index('workflow_approvals_step_id_idx').on(table.stepId),
    approverIdIdx: index('workflow_approvals_approver_id_idx').on(
      table.approverId
    ),
    statusIdx: index('workflow_approvals_status_idx').on(table.status),
  })
);

// Workflow Templates
export const workflowTemplates = pgTable(
  'workflow_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 100 }).notNull(),
    industry: varchar('industry', { length: 100 }),

    // Template definition
    definition: jsonb('definition').notNull(),

    // Usage tracking
    usageCount: integer('usage_count').notNull().default(0),
    isPublic: boolean('is_public').notNull().default(false),

    // Metadata
    tags: jsonb('tags'),

    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => ({
    categoryIdx: index('workflow_templates_category_idx').on(table.category),
    publicIdx: index('workflow_templates_public_idx').on(table.isPublic),
  })
);

// Workflow Analytics
export const workflowAnalytics = pgTable(
  'workflow_analytics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workflowId: uuid('workflow_id').references(() => workflows.id),
    instanceId: uuid('instance_id').references(() => workflowInstances.id),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),

    // Metrics
    metricType: varchar('metric_type', { length: 50 }).notNull(), // duration, sla_breach, bottleneck, etc.
    metricValue: jsonb('metric_value').notNull(),

    // Dimensions
    period: varchar('period', { length: 20 }).notNull(), // daily, weekly, monthly
    date: timestamp('date').notNull(),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  table => ({
    workflowIdIdx: index('workflow_analytics_workflow_id_idx').on(
      table.workflowId
    ),
    metricTypeIdx: index('workflow_analytics_metric_type_idx').on(
      table.metricType
    ),
    dateIdx: index('workflow_analytics_date_idx').on(table.date),
  })
);

// Relations
export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  company: one(companies, {
    fields: [workflows.companyId],
    references: [companies.id],
  }),
  createdBy: one(users, {
    fields: [workflows.createdBy],
    references: [users.id],
  }),
  instances: many(workflowInstances),
}));

export const workflowInstancesRelations = relations(
  workflowInstances,
  ({ one, many }) => ({
    workflow: one(workflows, {
      fields: [workflowInstances.workflowId],
      references: [workflows.id],
    }),
    company: one(companies, {
      fields: [workflowInstances.companyId],
      references: [companies.id],
    }),
    initiatedBy: one(users, {
      fields: [workflowInstances.initiatedBy],
      references: [users.id],
    }),
    steps: many(workflowSteps),
  })
);

export const workflowStepsRelations = relations(
  workflowSteps,
  ({ one, many }) => ({
    instance: one(workflowInstances, {
      fields: [workflowSteps.instanceId],
      references: [workflowInstances.id],
    }),
    assignedTo: one(users, {
      fields: [workflowSteps.assignedTo],
      references: [users.id],
    }),
    approvals: many(workflowApprovals),
  })
);

export const workflowApprovalsRelations = relations(
  workflowApprovals,
  ({ one }) => ({
    step: one(workflowSteps, {
      fields: [workflowApprovals.stepId],
      references: [workflowSteps.id],
    }),
    instance: one(workflowInstances, {
      fields: [workflowApprovals.instanceId],
      references: [workflowInstances.id],
    }),
    approver: one(users, {
      fields: [workflowApprovals.approverId],
      references: [users.id],
    }),
    delegatedTo: one(users, {
      fields: [workflowApprovals.delegatedTo],
      references: [users.id],
    }),
  })
);

export const workflowTemplatesRelations = relations(
  workflowTemplates,
  ({ one }) => ({
    createdBy: one(users, {
      fields: [workflowTemplates.createdBy],
      references: [users.id],
    }),
  })
);

export const workflowAnalyticsRelations = relations(
  workflowAnalytics,
  ({ one }) => ({
    workflow: one(workflows, {
      fields: [workflowAnalytics.workflowId],
      references: [workflows.id],
    }),
    instance: one(workflowInstances, {
      fields: [workflowAnalytics.instanceId],
      references: [workflowInstances.id],
    }),
    company: one(companies, {
      fields: [workflowAnalytics.companyId],
      references: [companies.id],
    }),
  })
);

