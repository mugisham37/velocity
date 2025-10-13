import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { companies } from './companies';

// Employee Management Tables
export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: varchar('employee_id', { length: 50 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  middleName: varchar('middle_name', { length: 100 }),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 20 }),
  personalEmail: varchar('personal_email', { length: 255 }),
  dateOfBirth: date('date_of_birth'),
  gender: varchar('gender', { length: 10 }),
  maritalStatus: varchar('marital_status', { length: 20 }),
  nationality: varchar('nationality', { length: 50 }),

  // Employment Details
  dateOfJoining: date('date_of_joining').notNull(),
  dateOfLeaving: date('date_of_leaving'),
  employmentType: varchar('employment_type', { length: 50 }).notNull(), // Full-time, Part-time, Contract, Intern
  status: varchar('status', { length: 20 }).notNull().default('Active'), // Active, Inactive, Terminated

  // Organizational Structure
  departmentId: uuid('department_id').references(() => departments.id),
  designationId: uuid('designation_id').references(() => designations.id),
  reportsToId: uuid('reports_to_id').references(() => employees.id),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),

  // Address Information
  currentAddress: jsonb('current_address'),
  permanentAddress: jsonb('permanent_address'),

  // Emergency Contact
  emergencyContact: jsonb('emergency_contact'),

  // System Fields
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
});

export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  description: text('description'),
  parentDepartmentId: uuid('parent_department_id').references(
    () => departments.id
  ),
  headOfDepartmentId: uuid('head_of_department_id').references(
    () => employees.id
  ),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const designations = pgTable('designations', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  description: text('description'),
  level: integer('level').default(1),
  departmentId: uuid('department_id').references(() => departments.id),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const employeeDocuments = pgTable('employee_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id')
    .references(() => employees.id)
    .notNull(),
  documentType: varchar('document_type', { length: 100 }).notNull(),
  documentName: varchar('document_name', { length: 255 }).notNull(),
  documentNumber: varchar('document_number', { length: 100 }),
  filePath: varchar('file_path', { length: 500 }),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  expiryDate: date('expiry_date'),
  isVerified: boolean('is_verified').default(false),
  verifiedBy: uuid('verified_by').references(() => employees.id),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const employeeOnboarding = pgTable('employee_onboarding', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id')
    .references(() => employees.id)
    .notNull(),
  onboardingTemplateId: uuid('onboarding_template_id').references(
    () => onboardingTemplates.id
  ),
  status: varchar('status', { length: 50 }).notNull().default('Pending'), // Pending, In Progress, Completed
  startDate: date('start_date').notNull(),
  expectedCompletionDate: date('expected_completion_date'),
  actualCompletionDate: date('actual_completion_date'),
  assignedToId: uuid('assigned_to_id').references(() => employees.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const onboardingTemplates = pgTable('onboarding_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  departmentId: uuid('department_id').references(() => departments.id),
  designationId: uuid('designation_id').references(() => designations.id),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const onboardingTasks = pgTable('onboarding_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id')
    .references(() => onboardingTemplates.id)
    .notNull(),
  taskName: varchar('task_name', { length: 255 }).notNull(),
  description: text('description'),
  assignedRole: varchar('assigned_role', { length: 100 }), // HR, Manager, IT, etc.
  daysFromStart: integer('days_from_start').default(0),
  isRequired: boolean('is_required').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const employeeOnboardingTasks = pgTable('employee_onboarding_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  onboardingId: uuid('onboarding_id')
    .references(() => employeeOnboarding.id)
    .notNull(),
  taskId: uuid('task_id')
    .references(() => onboardingTasks.id)
    .notNull(),
  status: varchar('status', { length: 50 }).notNull().default('Pending'), // Pending, In Progress, Completed, Skipped
  assignedToId: uuid('assigned_to_id').references(() => employees.id),
  dueDate: date('due_date'),
  completedDate: date('completed_date'),
  completedBy: uuid('completed_by').references(() => employees.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Employee Relations
export const employeesRelations = relations(employees, ({ one, many }) => ({
  company: one(companies, {
    fields: [employees.companyId],
    references: [companies.id],
  }),
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  designation: one(designations, {
    fields: [employees.designationId],
    references: [designations.id],
  }),
  reportsTo: one(employees, {
    fields: [employees.reportsToId],
    references: [employees.id],
    relationName: 'manager',
  }),
  subordinates: many(employees, {
    relationName: 'manager',
  }),
  documents: many(employeeDocuments),
  onboarding: many(employeeOnboarding),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  company: one(companies, {
    fields: [departments.companyId],
    references: [companies.id],
  }),
  parentDepartment: one(departments, {
    fields: [departments.parentDepartmentId],
    references: [departments.id],
    relationName: 'parentChild',
  }),
  childDepartments: many(departments, {
    relationName: 'parentChild',
  }),
  headOfDepartment: one(employees, {
    fields: [departments.headOfDepartmentId],
    references: [employees.id],
  }),
  employees: many(employees),
  designations: many(designations),
}));

export const designationsRelations = relations(
  designations,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [designations.companyId],
      references: [companies.id],
    }),
    department: one(departments, {
      fields: [designations.departmentId],
      references: [departments.id],
    }),
    employees: many(employees),
  })
);

export const employeeDocumentsRelations = relations(
  employeeDocuments,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employeeDocuments.employeeId],
      references: [employees.id],
    }),
    verifiedBy: one(employees, {
      fields: [employeeDocuments.verifiedBy],
      references: [employees.id],
    }),
  })
);

export const onboardingTemplatesRelations = relations(
  onboardingTemplates,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [onboardingTemplates.companyId],
      references: [companies.id],
    }),
    department: one(departments, {
      fields: [onboardingTemplates.departmentId],
      references: [departments.id],
    }),
    designation: one(designations, {
      fields: [onboardingTemplates.designationId],
      references: [designations.id],
    }),
    tasks: many(onboardingTasks),
    onboardings: many(employeeOnboarding),
  })
);

export const employeeOnboardingRelations = relations(
  employeeOnboarding,
  ({ one, many }) => ({
    employee: one(employees, {
      fields: [employeeOnboarding.employeeId],
      references: [employees.id],
    }),
    template: one(onboardingTemplates, {
      fields: [employeeOnboarding.onboardingTemplateId],
      references: [onboardingTemplates.id],
    }),
    assignedTo: one(employees, {
      fields: [employeeOnboarding.assignedToId],
      references: [employees.id],
    }),
    tasks: many(employeeOnboardingTasks),
  })
);

// Attendance Management Tables
export const attendanceShifts = pgTable('attendance_shifts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(), // HH:MM format
  endTime: varchar('end_time', { length: 10 }).notNull(), // HH:MM format
  type: varchar('type', { length: 50 }).notNull().default('Regular'), // Regular, Night, Weekend
  isActive: boolean('is_active').default(true),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const attendance = pgTable('attendance', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  date: date('date').notNull(),
  status: varchar('status', { length: 50 }).notNull(), // Present, Absent, Late, Half Day, Holiday, Leave
  checkInTime: timestamp('check_in_time'),
  checkOutTime: timestamp('check_out_time'),
  workingHours: integer('working_hours').default(0), // in minutes
  overtimeHours: integer('overtime_hours').default(0), // in minutes
  lateMinutes: integer('late_minutes').default(0),
  earlyLeaveMinutes: integer('early_leave_minutes').default(0),
  shiftId: uuid('shift_id').references(() => attendanceShifts.id),
  location: jsonb('location'), // GPS coordinates if applicable
  notes: text('notes'),
  approvedBy: uuid('approved_by').references(() => employees.id),
  approvedAt: timestamp('approved_at'),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Leave Management Tables
export const leavePolicies = pgTable('leave_policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  leaveType: varchar('leave_type', { length: 100 }).notNull(), // Annual, Sick, Maternity, etc.
  annualAllocation: integer('annual_allocation').notNull(),
  accrualType: varchar('accrual_type', { length: 50 }).notNull().default('Annual'), // Annual, Monthly, Per Pay Period
  maxCarryForward: integer('max_carry_forward').default(0),
  maxAccumulation: integer('max_accumulation').default(0),
  requiresApproval: boolean('requires_approval').default(true),
  minNoticeDays: integer('min_notice_days').default(0),
  maxConsecutiveDays: integer('max_consecutive_days').default(0),
  isActive: boolean('is_active').default(true),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const leaveRequests = pgTable('leave_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  leavePolicyId: uuid('leave_policy_id').references(() => leavePolicies.id).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  daysRequested: integer('days_requested').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('Pending'), // Pending, Approved, Rejected, Cancelled
  reason: text('reason').notNull(),
  isHalfDay: boolean('is_half_day').default(false),
  halfDayPeriod: varchar('half_day_period', { length: 20 }), // Morning, Afternoon
  appliedDate: date('applied_date').defaultNow().notNull(),
  approvedBy: uuid('approved_by').references(() => employees.id),
  approvedAt: timestamp('approved_at'),
  rejectionReason: text('rejection_reason'),
  attachments: jsonb('attachments'), // File paths/URLs
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const leaveBalances = pgTable('leave_balances', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  leavePolicyId: uuid('leave_policy_id').references(() => leavePolicies.id).notNull(),
  allocated: integer('allocated').notNull(),
  used: integer('used').default(0),
  pending: integer('pending').default(0),
  carriedForward: integer('carried_forward').default(0),
  year: integer('year').notNull(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Payroll Management Tables
export const payrollComponents = pgTable('payroll_components', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  type: varchar('type', { length: 50 }).notNull(), // Earning, Deduction
  isStatutory: boolean('is_statutory').default(false),
  isTaxable: boolean('is_taxable').default(true),
  isVariable: boolean('is_variable').default(false),
  formula: text('formula'), // Calculation formula
  defaultAmount: integer('default_amount').default(0), // in cents
  percentage: integer('percentage'), // for percentage-based components
  maxAmount: integer('max_amount'), // maximum amount limit
  minAmount: integer('min_amount'), // minimum amount limit
  isActive: boolean('is_active').default(true),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const salaryStructures = pgTable('salary_structures', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  baseSalary: integer('base_salary').notNull(), // in cents
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  frequency: varchar('frequency', { length: 20 }).notNull().default('Monthly'), // Monthly, Bi-weekly, Weekly
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo: date('effective_to'),
  isActive: boolean('is_active').default(true),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const salaryStructureComponents = pgTable('salary_structure_components', {
  id: uuid('id').primaryKey().defaultRandom(),
  salaryStructureId: uuid('salary_structure_id').references(() => salaryStructures.id).notNull(),
  componentId: uuid('component_id').references(() => payrollComponents.id).notNull(),
  amount: integer('amount'), // in cents
  percentage: integer('percentage'), // for percentage-based components
  isActive: boolean('is_active').default(true),
});

export const payrollRuns = pgTable('payroll_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  payrollDate: date('payroll_date').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  frequency: varchar('frequency', { length: 20 }).notNull(), // Monthly, Bi-weekly, Weekly
  status: varchar('status', { length: 50 }).notNull().default('Draft'), // Draft, Processing, Completed, Cancelled
  totalGrossPay: integer('total_gross_pay').default(0), // in cents
  totalDeductions: integer('total_deductions').default(0), // in cents
  totalNetPay: integer('total_net_pay').default(0), // in cents
  employeeCount: integer('employee_count').default(0),
  processedBy: uuid('processed_by').references(() => employees.id),
  processedAt: timestamp('processed_at'),
  approvedBy: uuid('approved_by').references(() => employees.id),
  approvedAt: timestamp('approved_at'),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const payrollEntries = pgTable('payroll_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  payrollRunId: uuid('payroll_run_id').references(() => payrollRuns.id).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  baseSalary: integer('base_salary').notNull(), // in cents
  totalEarnings: integer('total_earnings').notNull(), // in cents
  totalDeductions: integer('total_deductions').notNull(), // in cents
  grossPay: integer('gross_pay').notNull(), // in cents
  netPay: integer('net_pay').notNull(), // in cents
  workedDays: integer('worked_days').default(0),
  paidDays: integer('paid_days').default(0),
  overtimeHours: integer('overtime_hours').default(0), // in minutes
  status: varchar('status', { length: 50 }).notNull().default('Draft'), // Draft, Processed, Paid
  paymentDate: date('payment_date'),
  paymentMethod: varchar('payment_method', { length: 50 }), // Bank Transfer, Cash, Cheque
  paymentReference: varchar('payment_reference', { length: 255 }),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const payrollEntryComponents = pgTable('payroll_entry_components', {
  id: uuid('id').primaryKey().defaultRandom(),
  payrollEntryId: uuid('payroll_entry_id').references(() => payrollEntries.id).notNull(),
  componentId: uuid('component_id').references(() => payrollComponents.id).notNull(),
  amount: integer('amount').notNull(), // in cents
});

// Relations for new tables
export const attendanceShiftsRelations = relations(attendanceShifts, ({ one, many }) => ({
  company: one(companies, {
    fields: [attendanceShifts.companyId],
    references: [companies.id],
  }),
  attendanceRecords: many(attendance),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  employee: one(employees, {
    fields: [attendance.employeeId],
    references: [employees.id],
  }),
  shift: one(attendanceShifts, {
    fields: [attendance.shiftId],
    references: [attendanceShifts.id],
  }),
  approvedBy: one(employees, {
    fields: [attendance.approvedBy],
    references: [employees.id],
  }),
  company: one(companies, {
    fields: [attendance.companyId],
    references: [companies.id],
  }),
}));

export const leavePoliciesRelations = relations(leavePolicies, ({ one, many }) => ({
  company: one(companies, {
    fields: [leavePolicies.companyId],
    references: [companies.id],
  }),
  leaveRequests: many(leaveRequests),
  leaveBalances: many(leaveBalances),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  employee: one(employees, {
    fields: [leaveRequests.employeeId],
    references: [employees.id],
  }),
  leavePolicy: one(leavePolicies, {
    fields: [leaveRequests.leavePolicyId],
    references: [leavePolicies.id],
  }),
  approvedBy: one(employees, {
    fields: [leaveRequests.approvedBy],
    references: [employees.id],
  }),
  company: one(companies, {
    fields: [leaveRequests.companyId],
    references: [companies.id],
  }),
}));

export const leaveBalancesRelations = relations(leaveBalances, ({ one }) => ({
  employee: one(employees, {
    fields: [leaveBalances.employeeId],
    references: [employees.id],
  }),
  leavePolicy: one(leavePolicies, {
    fields: [leaveBalances.leavePolicyId],
    references: [leavePolicies.id],
  }),
  company: one(companies, {
    fields: [leaveBalances.companyId],
    references: [companies.id],
  }),
}));

export const payrollComponentsRelations = relations(payrollComponents, ({ one, many }) => ({
  company: one(companies, {
    fields: [payrollComponents.companyId],
    references: [companies.id],
  }),
  salaryStructureComponents: many(salaryStructureComponents),
  payrollEntryComponents: many(payrollEntryComponents),
}));

export const salaryStructuresRelations = relations(salaryStructures, ({ one, many }) => ({
  employee: one(employees, {
    fields: [salaryStructures.employeeId],
    references: [employees.id],
  }),
  company: one(companies, {
    fields: [salaryStructures.companyId],
    references: [companies.id],
  }),
  components: many(salaryStructureComponents),
}));

export const salaryStructureComponentsRelations = relations(salaryStructureComponents, ({ one }) => ({
  salaryStructure: one(salaryStructures, {
    fields: [salaryStructureComponents.salaryStructureId],
    references: [salaryStructures.id],
  }),
  component: one(payrollComponents, {
    fields: [salaryStructureComponents.componentId],
    references: [payrollComponents.id],
  }),
}));

export const payrollRunsRelations = relations(payrollRuns, ({ one, many }) => ({
  company: one(companies, {
    fields: [payrollRuns.companyId],
    references: [companies.id],
  }),
  processedBy: one(employees, {
    fields: [payrollRuns.processedBy],
    references: [employees.id],
  }),
  approvedBy: one(employees, {
    fields: [payrollRuns.approvedBy],
    references: [employees.id],
  }),
  entries: many(payrollEntries),
}));

export const payrollEntriesRelations = relations(payrollEntries, ({ one, many }) => ({
  payrollRun: one(payrollRuns, {
    fields: [payrollEntries.payrollRunId],
    references: [payrollRuns.id],
  }),
  employee: one(employees, {
    fields: [payrollEntries.employeeId],
    references: [employees.id],
  }),
  company: one(companies, {
    fields: [payrollEntries.companyId],
    references: [companies.id],
  }),
  components: many(payrollEntryComponents),
}));

export const payrollEntryComponentsRelations = relations(payrollEntryComponents, ({ one }) => ({
  payrollEntry: one(payrollEntries, {
    fields: [payrollEntryComponents.payrollEntryId],
    references: [payrollEntries.id],
  }),
  component: one(payrollComponents, {
    fields: [payrollEntryComponents.componentId],
    references: [payrollComponents.id],
  }),
}));

