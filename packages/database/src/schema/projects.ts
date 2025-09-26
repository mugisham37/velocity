import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  decimal,
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

export const projects: any = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectCode: varchar('project_code', { length: 50 }).notNull(),
  projectName: varchar('project_name', { length: 255 }).notNull(),
  description: text('description'),
  projectType: varchar('project_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('Draft'),
  priority: varchar('priority', { length: 20 }).notNull().default('Medium'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  expectedStartDate: date('expected_start_date'),
  expectedEndDate: date('expected_end_date'),
  actualStartDate: date('actual_start_date'),
  actualEndDate: date('actual_end_date'),
  percentComplete: decimal('percent_complete', {
    precision: 5,
    scale: 2,
  }).default('0'),
  projectManagerId: uuid('project_manager_id').references(() => users.id),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  customFields: jsonb('custom_fields'),
  isTemplate: boolean('is_template').default(false),
  templateId: uuid('template_id').references(() => projects.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectTasks: any = pgTable('project_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskCode: varchar('task_code', { length: 50 }).notNull(),
  taskName: varchar('task_name', { length: 255 }).notNull(),
  description: text('description'),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  parentTaskId: uuid('parent_task_id').references(() => projectTasks.id),
  assignedToId: uuid('assigned_to_id').references(() => users.id),
  status: varchar('status', { length: 50 }).notNull().default('Open'),
  priority: varchar('priority', { length: 20 }).notNull().default('Medium'),
  taskType: varchar('task_type', { length: 50 }).notNull().default('Task'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  expectedStartDate: date('expected_start_date'),
  expectedEndDate: date('expected_end_date'),
  actualStartDate: date('actual_start_date'),
  actualEndDate: date('actual_end_date'),
  duration: integer('duration'), // in hours
  estimatedHours: decimal('estimated_hours', { precision: 8, scale: 2 }),
  actualHours: decimal('actual_hours', { precision: 8, scale: 2 }).default('0'),
  percentComplete: decimal('percent_complete', {
    precision: 5,
    scale: 2,
  }).default('0'),
  isMilestone: boolean('is_milestone').default(false),
  customFields: jsonb('custom_fields'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const taskDependencies = pgTable('task_dependencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  predecessorTaskId: uuid('predecessor_task_id')
    .references(() => projectTasks.id)
    .notNull(),
  successorTaskId: uuid('successor_task_id')
    .references(() => projectTasks.id)
    .notNull(),
  dependencyType: varchar('dependency_type', { length: 20 })
    .notNull()
    .default('FS'), // FS, SS, FF, SF
  lagDays: integer('lag_days').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const projectTeamMembers = pgTable('project_team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  role: varchar('role', { length: 100 }).notNull(),
  allocationPercentage: decimal('allocation_percentage', {
    precision: 5,
    scale: 2,
  }).default('100'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const projectMilestones = pgTable('project_milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  milestoneName: varchar('milestone_name', { length: 255 }).notNull(),
  description: text('description'),
  targetDate: date('target_date').notNull(),
  actualDate: date('actual_date'),
  status: varchar('status', { length: 50 }).notNull().default('Pending'),
  isCompleted: boolean('is_completed').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectTemplates = pgTable('project_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateName: varchar('template_name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  isPublic: boolean('is_public').default(false),
  templateData: jsonb('template_data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  company: one(companies, {
    fields: [projects.companyId],
    references: [companies.id],
  }),
  projectManager: one(users, {
    fields: [projects.projectManagerId],
    references: [users.id],
  }),
  template: one(projects, {
    fields: [projects.templateId],
    references: [projects.id],
  }),
  tasks: many(projectTasks),
  teamMembers: many(projectTeamMembers),
  milestones: many(projectMilestones),
}));

export const projectTasksRelations = relations(
  projectTasks,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [projectTasks.projectId],
      references: [projects.id],
    }),
    assignedTo: one(users, {
      fields: [projectTasks.assignedToId],
      references: [users.id],
    }),
    parentTask: one(projectTasks, {
      fields: [projectTasks.parentTaskId],
      references: [projectTasks.id],
    }),
    subtasks: many(projectTasks),
    predecessorDependencies: many(taskDependencies, {
      relationName: 'predecessor',
    }),
    successorDependencies: many(taskDependencies, {
      relationName: 'successor',
    }),
  })
);

export const taskDependenciesRelations = relations(
  taskDependencies,
  ({ one }) => ({
    predecessorTask: one(projectTasks, {
      fields: [taskDependencies.predecessorTaskId],
      references: [projectTasks.id],
      relationName: 'predecessor',
    }),
    successorTask: one(projectTasks, {
      fields: [taskDependencies.successorTaskId],
      references: [projectTasks.id],
      relationName: 'successor',
    }),
  })
);

export const projectTeamMembersRelations = relations(
  projectTeamMembers,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectTeamMembers.projectId],
      references: [projects.id],
    }),
    user: one(users, {
      fields: [projectTeamMembers.userId],
      references: [users.id],
    }),
  })
);

export const projectMilestonesRelations = relations(
  projectMilestones,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectMilestones.projectId],
      references: [projects.id],
    }),
  })
);

export const projectTemplatesRelations = relations(
  projectTemplates,
  ({ one }) => ({
    company: one(companies, {
      fields: [projectTemplates.companyId],
      references: [companies.id],
    }),
  })
);
// Project Accounting Tables
export const projectBudgets = pgTable('project_budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  budgetName: varchar('budget_name', { length: 255 }).notNull(),
  budgetType: varchar('budget_type', { length: 50 }).notNull(), // Original, Revised, Approved
  totalBudget: decimal('total_budget', { precision: 15, scale: 2 }).notNull(),
  laborBudget: decimal('labor_budget', { precision: 15, scale: 2 }).default(
    '0'
  ),
  materialBudget: decimal('material_budget', {
    precision: 15,
    scale: 2,
  }).default('0'),
  overheadBudget: decimal('overhead_budget', {
    precision: 15,
    scale: 2,
  }).default('0'),
  contingencyBudget: decimal('contingency_budget', {
    precision: 15,
    scale: 2,
  }).default('0'),
  status: varchar('status', { length: 50 }).notNull().default('Draft'), // Draft, Submitted, Approved, Rejected
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  budgetPeriodStart: date('budget_period_start'),
  budgetPeriodEnd: date('budget_period_end'),
  notes: text('notes'),
  createdBy: uuid('created_by')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectBudgetCategories = pgTable('project_budget_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  budgetId: uuid('budget_id')
    .references(() => projectBudgets.id)
    .notNull(),
  categoryName: varchar('category_name', { length: 255 }).notNull(),
  categoryCode: varchar('category_code', { length: 50 }).notNull(),
  budgetedAmount: decimal('budgeted_amount', {
    precision: 15,
    scale: 2,
  }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectCosts = pgTable('project_costs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  taskId: uuid('task_id').references(() => projectTasks.id),
  budgetCategoryId: uuid('budget_category_id').references(
    () => projectBudgetCategories.id
  ),
  costType: varchar('cost_type', { length: 50 }).notNull(), // Labor, Material, Overhead, Travel, Other
  costDate: date('cost_date').notNull(),
  description: text('description').notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 4 }).default('1'),
  unitCost: decimal('unit_cost', { precision: 15, scale: 2 }).notNull(),
  totalCost: decimal('total_cost', { precision: 15, scale: 2 }).notNull(),
  isBillable: boolean('is_billable').default(true),
  billingRate: decimal('billing_rate', { precision: 15, scale: 2 }),
  billableAmount: decimal('billable_amount', { precision: 15, scale: 2 }),
  invoiceId: uuid('invoice_id'), // Reference to invoice when billed
  status: varchar('status', { length: 50 }).notNull().default('Pending'), // Pending, Approved, Invoiced, Paid
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  attachments: jsonb('attachments'), // Array of file references
  customFields: jsonb('custom_fields'),
  createdBy: uuid('created_by')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectRevenue = pgTable('project_revenue', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  revenueType: varchar('revenue_type', { length: 50 }).notNull(), // Fixed, TimeAndMaterial, Milestone, Recurring
  description: text('description').notNull(),
  revenueDate: date('revenue_date').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  recognizedAmount: decimal('recognized_amount', {
    precision: 15,
    scale: 2,
  }).default('0'),
  milestoneId: uuid('milestone_id').references(() => projectMilestones.id),
  invoiceId: uuid('invoice_id'), // Reference to generated invoice
  status: varchar('status', { length: 50 }).notNull().default('Planned'), // Planned, Recognized, Invoiced, Collected
  recognitionMethod: varchar('recognition_method', { length: 50 }).default(
    'Percentage'
  ), // Percentage, Milestone, Completed
  recognitionPercentage: decimal('recognition_percentage', {
    precision: 5,
    scale: 2,
  }).default('0'),
  notes: text('notes'),
  createdBy: uuid('created_by')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectInvoices = pgTable('project_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
  invoiceDate: date('invoice_date').notNull(),
  dueDate: date('due_date').notNull(),
  billingPeriodStart: date('billing_period_start'),
  billingPeriodEnd: date('billing_period_end'),
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).default('0'),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
  paidAmount: decimal('paid_amount', { precision: 15, scale: 2 }).default('0'),
  status: varchar('status', { length: 50 }).notNull().default('Draft'), // Draft, Sent, Paid, Overdue, Cancelled
  paymentTerms: varchar('payment_terms', { length: 100 }),
  notes: text('notes'),
  customerId: uuid('customer_id').references(() => users.id), // Reference to customer
  sentAt: timestamp('sent_at'),
  paidAt: timestamp('paid_at'),
  createdBy: uuid('created_by')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectInvoiceLineItems = pgTable('project_invoice_line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id')
    .references(() => projectInvoices.id)
    .notNull(),
  taskId: uuid('task_id').references(() => projectTasks.id),
  costId: uuid('cost_id').references(() => projectCosts.id),
  description: text('description').notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 4 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 15, scale: 2 }).notNull(),
  lineTotal: decimal('line_total', { precision: 15, scale: 2 }).notNull(),
  taxRate: decimal('tax_rate', { precision: 5, scale: 4 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const projectProfitability = pgTable('project_profitability', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  analysisDate: date('analysis_date').notNull(),
  totalRevenue: decimal('total_revenue', { precision: 15, scale: 2 }).notNull(),
  totalCosts: decimal('total_costs', { precision: 15, scale: 2 }).notNull(),
  grossProfit: decimal('gross_profit', { precision: 15, scale: 2 }).notNull(),
  grossMargin: decimal('gross_margin', { precision: 5, scale: 2 }).notNull(), // Percentage
  laborCosts: decimal('labor_costs', { precision: 15, scale: 2 }).default('0'),
  materialCosts: decimal('material_costs', { precision: 15, scale: 2 }).default(
    '0'
  ),
  overheadCosts: decimal('overhead_costs', { precision: 15, scale: 2 }).default(
    '0'
  ),
  budgetVariance: decimal('budget_variance', {
    precision: 15,
    scale: 2,
  }).default('0'),
  scheduleVariance: decimal('schedule_variance', {
    precision: 5,
    scale: 2,
  }).default('0'), // Percentage
  earnedValue: decimal('earned_value', { precision: 15, scale: 2 }).default(
    '0'
  ),
  actualCost: decimal('actual_cost', { precision: 15, scale: 2 }).default('0'),
  plannedValue: decimal('planned_value', { precision: 15, scale: 2 }).default(
    '0'
  ),
  costPerformanceIndex: decimal('cost_performance_index', {
    precision: 5,
    scale: 4,
  }).default('1'),
  schedulePerformanceIndex: decimal('schedule_performance_index', {
    precision: 5,
    scale: 4,
  }).default('1'),
  estimateAtCompletion: decimal('estimate_at_completion', {
    precision: 15,
    scale: 2,
  }),
  estimateToComplete: decimal('estimate_to_complete', {
    precision: 15,
    scale: 2,
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Additional Relations for Project Accounting
export const projectBudgetsRelations = relations(
  projectBudgets,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [projectBudgets.projectId],
      references: [projects.id],
    }),
    approver: one(users, {
      fields: [projectBudgets.approvedBy],
      references: [users.id],
    }),
    creator: one(users, {
      fields: [projectBudgets.createdBy],
      references: [users.id],
    }),
    categories: many(projectBudgetCategories),
  })
);

export const projectBudgetCategoriesRelations = relations(
  projectBudgetCategories,
  ({ one, many }) => ({
    budget: one(projectBudgets, {
      fields: [projectBudgetCategories.budgetId],
      references: [projectBudgets.id],
    }),
    costs: many(projectCosts),
  })
);

export const projectCostsRelations = relations(projectCosts, ({ one }) => ({
  project: one(projects, {
    fields: [projectCosts.projectId],
    references: [projects.id],
  }),
  task: one(projectTasks, {
    fields: [projectCosts.taskId],
    references: [projectTasks.id],
  }),
  budgetCategory: one(projectBudgetCategories, {
    fields: [projectCosts.budgetCategoryId],
    references: [projectBudgetCategories.id],
  }),
  approver: one(users, {
    fields: [projectCosts.approvedBy],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [projectCosts.createdBy],
    references: [users.id],
  }),
}));

export const projectRevenueRelations = relations(projectRevenue, ({ one }) => ({
  project: one(projects, {
    fields: [projectRevenue.projectId],
    references: [projects.id],
  }),
  milestone: one(projectMilestones, {
    fields: [projectRevenue.milestoneId],
    references: [projectMilestones.id],
  }),
  creator: one(users, {
    fields: [projectRevenue.createdBy],
    references: [users.id],
  }),
}));

export const projectInvoicesRelations = relations(
  projectInvoices,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [projectInvoices.projectId],
      references: [projects.id],
    }),
    customer: one(users, {
      fields: [projectInvoices.customerId],
      references: [users.id],
    }),
    creator: one(users, {
      fields: [projectInvoices.createdBy],
      references: [users.id],
    }),
    lineItems: many(projectInvoiceLineItems),
  })
);

export const projectInvoiceLineItemsRelations = relations(
  projectInvoiceLineItems,
  ({ one }) => ({
    invoice: one(projectInvoices, {
      fields: [projectInvoiceLineItems.invoiceId],
      references: [projectInvoices.id],
    }),
    task: one(projectTasks, {
      fields: [projectInvoiceLineItems.taskId],
      references: [projectTasks.id],
    }),
    cost: one(projectCosts, {
      fields: [projectInvoiceLineItems.costId],
      references: [projectCosts.id],
    }),
  })
);

export const projectProfitabilityRelations = relations(
  projectProfitability,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectProfitability.projectId],
      references: [projects.id],
    }),
  })
);
