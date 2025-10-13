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
import { projectTasks, projects } from './projects';
import { users } from './users';

export const timesheets = pgTable('timesheets', {
  id: uuid('id').primaryKey().defaultRandom(),
  timesheetCode: varchar('timesheet_code', { length: 50 }).notNull(),
  employeeId: uuid('employee_id')
    .references(() => users.id)
    .notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('Draft'),
  totalHours: decimal('total_hours', { precision: 8, scale: 2 }).default('0'),
  billableHours: decimal('billable_hours', { precision: 8, scale: 2 }).default(
    '0'
  ),
  nonBillableHours: decimal('non_billable_hours', {
    precision: 8,
    scale: 2,
  }).default('0'),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  submittedAt: timestamp('submitted_at'),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const timeEntries = pgTable('time_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  timesheetId: uuid('timesheet_id')
    .references(() => timesheets.id)
    .notNull(),
  projectId: uuid('project_id').references(() => projects.id),
  taskId: uuid('task_id').references(() => projectTasks.id),
  activityType: varchar('activity_type', { length: 100 }).notNull(),
  description: text('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  duration: decimal('duration', { precision: 8, scale: 2 }).notNull(), // in hours
  isBillable: boolean('is_billable').default(true),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }),
  location: varchar('location', { length: 255 }),
  gpsCoordinates: jsonb('gps_coordinates'), // {lat, lng, accuracy}
  isManualEntry: boolean('is_manual_entry').default(false),
  deviceInfo: jsonb('device_info'),
  attachments: jsonb('attachments'), // Array of file references
  customFields: jsonb('custom_fields'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const timeCategories = pgTable('time_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryName: varchar('category_name', { length: 100 }).notNull(),
  categoryCode: varchar('category_code', { length: 20 }).notNull(),
  description: text('description'),
  isBillable: boolean('is_billable').default(true),
  defaultHourlyRate: decimal('default_hourly_rate', {
    precision: 10,
    scale: 2,
  }),
  color: varchar('color', { length: 7 }), // Hex color code
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const timeApprovals = pgTable('time_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  timesheetId: uuid('timesheet_id')
    .references(() => timesheets.id)
    .notNull(),
  approverId: uuid('approver_id')
    .references(() => users.id)
    .notNull(),
  status: varchar('status', { length: 50 }).notNull(), // Pending, Approved, Rejected
  comments: text('comments'),
  approvedHours: decimal('approved_hours', { precision: 8, scale: 2 }),
  rejectedHours: decimal('rejected_hours', { precision: 8, scale: 2 }),
  approvalLevel: integer('approval_level').default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const timeTrackingSettings = pgTable('time_tracking_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  requireProjectSelection: boolean('require_project_selection').default(true),
  requireTaskSelection: boolean('require_task_selection').default(false),
  allowManualTimeEntry: boolean('allow_manual_time_entry').default(true),
  requireGpsTracking: boolean('require_gps_tracking').default(false),
  maxDailyHours: decimal('max_daily_hours', { precision: 4, scale: 2 }).default(
    '24'
  ),
  maxWeeklyHours: decimal('max_weekly_hours', {
    precision: 5,
    scale: 2,
  }).default('168'),
  timesheetPeriod: varchar('timesheet_period', { length: 20 }).default(
    'Weekly'
  ), // Weekly, Bi-weekly, Monthly
  autoSubmitTimesheets: boolean('auto_submit_timesheets').default(false),
  requireApproval: boolean('require_approval').default(true),
  approvalWorkflow: jsonb('approval_workflow'), // Multi-level approval configuration
  overtimeRules: jsonb('overtime_rules'),
  roundingRules: jsonb('rounding_rules'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const timeReports = pgTable('time_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportName: varchar('report_name', { length: 255 }).notNull(),
  reportType: varchar('report_type', { length: 50 }).notNull(), // Summary, Detailed, Utilization, etc.
  parameters: jsonb('parameters').notNull(),
  generatedBy: uuid('generated_by')
    .references(() => users.id)
    .notNull(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  reportData: jsonb('report_data'),
  isScheduled: boolean('is_scheduled').default(false),
  scheduleConfig: jsonb('schedule_config'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const timesheetsRelations = relations(timesheets, ({ one, many }) => ({
  employee: one(users, {
    fields: [timesheets.employeeId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [timesheets.approvedBy],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [timesheets.companyId],
    references: [companies.id],
  }),
  timeEntries: many(timeEntries),
  approvals: many(timeApprovals),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  timesheet: one(timesheets, {
    fields: [timeEntries.timesheetId],
    references: [timesheets.id],
  }),
  project: one(projects, {
    fields: [timeEntries.projectId],
    references: [projects.id],
  }),
  task: one(projectTasks, {
    fields: [timeEntries.taskId],
    references: [projectTasks.id],
  }),
}));

export const timeCategoriesRelations = relations(timeCategories, ({ one }) => ({
  company: one(companies, {
    fields: [timeCategories.companyId],
    references: [companies.id],
  }),
}));

export const timeApprovalsRelations = relations(timeApprovals, ({ one }) => ({
  timesheet: one(timesheets, {
    fields: [timeApprovals.timesheetId],
    references: [timesheets.id],
  }),
  approver: one(users, {
    fields: [timeApprovals.approverId],
    references: [users.id],
  }),
}));

export const timeTrackingSettingsRelations = relations(
  timeTrackingSettings,
  ({ one }) => ({
    company: one(companies, {
      fields: [timeTrackingSettings.companyId],
      references: [companies.id],
    }),
  })
);

export const timeReportsRelations = relations(timeReports, ({ one }) => ({
  generatedBy: one(users, {
    fields: [timeReports.generatedBy],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [timeReports.companyId],
    references: [companies.id],
  }),
}));

