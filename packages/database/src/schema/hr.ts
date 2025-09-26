import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core";
import { companies } from "./companies";

// Employee Management Tables
export const employees = pgTable("employees", {
  id: uuid("idrimaryKey().defaultRandom(),
  employeeId: varchar("employee_id", { length: 50 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 20 }),
  personalEmail: varchar("personal_email", { length: 255 }),
  dateOfBirth: date("date_of_birth"),
  gender: varchar("gender", { length: 10 }),
  maritalStatus: varchar("marital_status", { length: 20 }),
  nationality: varchar("nationality", { length: 50 }),

  // Employment Details
  dateOfJoining: date("date_of_joining").notNull(),
  dateOfLeaving: date("date_of_leaving"),
  employmentType: varchar("employment_type", { length: 50 }).notNull(), // Full-time, Part-time, Contract, Intern
  status: varchar("status", { length: 20 }).notNull().default("Active"), // Active, Inactive, Terminated

  // Organizational Structure
  departmentId: uuid("department_id").references(() => departments.id),
  designationId: uuid("designation_id").references(() => designations.id),
  reportsToId: uuid("reports_to_id").references(() => employees.id),
  companyId: uuid("company_id").references(() => companies.id).notNull(),

  // Address Information
  currentAddress: jsonb("current_address"),
  permanentAddress: jsonb("permanent_address"),

  // Emergency Contact
  emergencyContact: jsonb("emergency_contact"),

  // System Fields
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
});

export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  description: text("description"),
  parentDepartmentId: uuid("parent_department_id").references(() => departments.id),
  headOfDepartmentId: uuid("head_of_department_id").references(() => employees.id),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const designations = pgTable("designations", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  description: text("description"),
  level: integer("level").default(1),
  departmentId: uuid("department_id").references(() => departments.id),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const employeeDocuments = pgTable("employee_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  documentType: varchar("document_type", { length: 100 }).notNull(),
  documentName: varchar("document_name", { length: 255 }).notNull(),
  documentNumber: varchar("document_number", { length: 100 }),
  filePath: varchar("file_path", { length: 500 }),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  expiryDate: date("expiry_date"),
  isVerified: boolean("is_verified").default(false),
  verifiedBy: uuid("verified_by").references(() => employees.id),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const employeeOnboarding = pgTable("employee_onboarding", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  onboardingTemplateId: uuid("onboarding_template_id").references(() => onboardingTemplates.id),
  status: varchar("status", { length: 50 }).notNull().default("Pending"), // Pending, In Progress, Completed
  startDate: date("start_date").notNull(),
  expectedCompletionDate: date("expected_completion_date"),
  actualCompletionDate: date("actual_completion_date"),
  assignedToId: uuid("assigned_to_id").references(() => employees.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const onboardingTemplates = pgTable("onboarding_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  departmentId: uuid("department_id").references(() => departments.id),
  designationId: uuid("designation_id").references(() => designations.id),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const onboardingTasks = pgTable("onboarding_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id").references(() => onboardingTemplates.id).notNull(),
  taskName: varchar("task_name", { length: 255 }).notNull(),
  description: text("description"),
  assignedRole: varchar("assigned_role", { length: 100 }), // HR, Manager, IT, etc.
  daysFromStart: integer("days_from_start").default(0),
  isRequired: boolean("is_required").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const employeeOnboardingTasks = pgTable("employee_onboarding_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  onboardingId: uuid("onboarding_id").references(() => employeeOnboarding.id).notNull(),
  taskId: uuid("task_id").references(() => onboardingTasks.id).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("Pending"), // Pending, In Progress, Completed, Skipped
  assignedToId: uuid("assigned_to_id").references(() => employees.id),
  dueDate: date("due_date"),
  completedDate: date("completed_date"),
  completedBy: uuid("completed_by").references(() => employees.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
    relationName: "manager",
  }),
  subordinates: many(employees, {
    relationName: "manager",
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
    relationName: "parentChild",
  }),
  childDepartments: many(departments, {
    relationName: "parentChild",
  }),
  headOfDepartment: one(employees, {
    fields: [departments.headOfDepartmentId],
    references: [employees.id],
  }),
  employees: many(employees),
  designations: many(designations),
}));

export const designationsRelations = relations(designations, ({ one, many }) => ({
  company: one(companies, {
    fields: [designations.companyId],
    references: [companies.id],
  }),
  department: one(departments, {
    fields: [designations.departmentId],
    references: [departments.id],
  }),
  employees: many(employees),
}));

export const employeeDocumentsRelations = relations(employeeDocuments, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeDocuments.employeeId],
    references: [employees.id],
  }),
  verifiedBy: one(employees, {
    fields: [employeeDocuments.verifiedBy],
    references: [employees.id],
  }),
}));

export const onboardingTemplatesRelations = relations(onboardingTemplates, ({ one, many }) => ({
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
}));

export const employeeOnboardingRelations = relations(employeeOnboarding, ({ one, many }) => ({
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
}));
