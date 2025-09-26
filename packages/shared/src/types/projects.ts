import { z } from "zod";

// Enums
export const ProjectStatus = z.enum([
  "Draft",
  "Planning",
  "Active",
  "On Hold",
leted",
  "Cancelled",
]);

export const TaskStatus = z.enum([
  "Open",
  "Working",
  "Pending Review",
  "Overdue",
  "Template",
  "Completed",
  "Cancelled",
]);

export const Priority = z.enum(["Low", "Medium", "High", "Urgent"]);

export const TaskType = z.enum([
  "Task",
  "Milestone",
  "Summary",
  "Project Summary",
]);

export const DependencyType = z.enum([
  "FS", // Finish-to-Start
  "SS", // Start-to-Start
  "FF", // Finish-to-Finish
  "SF", // Start-to-Finish
]);

export const MilestoneStatus = z.enum([
  "Pending",
  "In Progress",
  "Completed",
  "Overdue",
]);

// Base schemas
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  projectCode: z.string().min(1).max(50),
  projectName: z.string().min(1).max(255),
  description: z.string().optional(),
  projectType: z.string().min(1).max(50),
  status: ProjectStatus,
  priority: Priority,
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  expectedStartDate: z.string().date().optional(),
  expectedEndDate: z.string().date().optional(),
  actualStartDate: z.string().date().optional(),
  actualEndDate: z.string().date().optional(),
  percentComplete: z.number().min(0).max(100),
  projectManagerId: z.string().uuid().optional(),
  companyId: z.string().uuid(),
  customFields: z.record(z.any()).optional(),
  isTemplate: z.boolean(),
  templateId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ProjectTaskSchema = z.object({
  id: z.string().uuid(),
  taskCode: z.string().min(1).max(50),
  taskName: z.string().min(1).max(255),
  description: z.string().optional(),
  projectId: z.string().uuid(),
  parentTaskId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  status: TaskStatus,
  priority: Priority,
  taskType: TaskType,
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  expectedStartDate: z.string().date().optional(),
  expectedEndDate: z.string().date().optional(),
  actualStartDate: z.string().date().optional(),
  actualEndDate: z.string().date().optional(),
  duration: z.number().int().optional(),
  estimatedHours: z.number().optional(),
  actualHours: z.number(),
  percentComplete: z.number().min(0).max(100),
  isMilestone: z.boolean(),
  customFields: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const TaskDependencySchema = z.object({
  id: z.string().uuid(),
  predecessorTaskId: z.string().uuid(),
  successorTaskId: z.string().uuid(),
  dependencyType: DependencyType,
  lagDays: z.number().int(),
  createdAt: z.string().datetime(),
});

export const ProjectTeamMemberSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.string().min(1).max(100),
  allocationPercentage: z.number().min(0).max(100),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
});

export const ProjectMilestoneSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  milestoneName: z.string().min(1).max(255),
  description: z.string().optional(),
  targetDate: z.string().date(),
  actualDate: z.string().date().optional(),
  status: MilestoneStatus,
  isCompleted: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ProjectTemplateSchema = z.object({
  id: z.string().uuid(),
  templateName: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.string().max(100).optional(),
  companyId: z.string().uuid(),
  isPublic: z.boolean(),
  templateData: z.record(z.any()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Input schemas for creation
export const CreateProjectSchema = z.object({
  projectCode: z.string().min(1).max(50),
  projectName: z.string().min(1).max(255),
  description: z.string().optional(),
  projectType: z.string().min(1).max(50),
  priority: Priority.default("Medium"),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  expectedStartDate: z.string().date().optional(),
  expectedEndDate: z.string().date().optional(),
  projectManagerId: z.string().uuid().optional(),
  customFields: z.record(z.any()).optional(),
  templateId: z.string().uuid().optional(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial().extend({
  status: ProjectStatus.optional(),
  actualStartDate: z.string().date().optional(),
  actualEndDate: z.string().date().optional(),
  percentComplete: z.number().min(0).max(100).optional(),
});

export const CreateProjectTaskSchema = z.object({
  taskCode: z.string().min(1).max(50),
  taskName: z.string().min(1).max(255),
  description: z.string().optional(),
  projectId: z.string().uuid(),
  parentTaskId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  priority: Priority.default("Medium"),
  taskType: TaskType.default("Task"),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  expectedStartDate: z.string().date().optional(),
  expectedEndDate: z.string().date().optional(),
  duration: z.number().int().optional(),
  estimatedHours: z.number().optional(),
  isMilestone: z.boolean().default(false),
  customFields: z.record(z.any()).optional(),
});

export const UpdateProjectTaskSchema = CreateProjectTaskSchema.partial().extend({
  status: TaskStatus.optional(),
  actualStartDate: z.string().date().optional(),
  actualEndDate: z.string().date().optional(),
  actualHours: z.number().optional(),
  percentComplete: z.number().min(0).max(100).optional(),
});

export const CreateTaskDependencySchema = z.object({
  predecessorTaskId: z.string().uuid(),
  successorTaskId: z.string().uuid(),
  dependencyType: DependencyType.default("FS"),
  lagDays: z.number().int().default(0),
});

export const CreateProjectTeamMemberSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.string().min(1).max(100),
  allocationPercentage: z.number().min(0).max(100).default(100),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
});

export const CreateProjectMilestoneSchema = z.object({
  projectId: z.string().uuid(),
  milestoneName: z.string().min(1).max(255),
  description: z.string().optional(),
  targetDate: z.string().date(),
});

export const UpdateProjectMilestoneSchema = CreateProjectMilestoneSchema.partial().extend({
  actualDate: z.string().date().optional(),
  status: MilestoneStatus.optional(),
  isCompleted: z.boolean().optional(),
});

export const CreateProjectTemplateSchema = z.object({
  templateName: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.string().max(100).optional(),
  isPublic: z.boolean().default(false),
  templateData: z.record(z.any()),
});

// Gantt chart specific schemas
export const GanttTaskSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  start_date: z.string().date(),
  end_date: z.string().date(),
  duration: z.number(),
  progress: z.number().min(0).max(1),
  parent: z.string().uuid().optional(),
  type: z.enum(["task", "project", "milestone"]),
  open: z.boolean().optional(),
});

export const GanttLinkSchema = z.object({
  id: z.string().uuid(),
  source: z.string().uuid(),
  target: z.string().uuid(),
  type: z.enum(["0", "1", "2", "3"]), // 0=FS, 1=SS, 2=FF, 3=SF
  lag: z.number().optional(),
});

export const GanttDataSchema = z.object({
  tasks: z.array(GanttTaskSchema),
  links: z.array(GanttLinkSchema),
});

// Critical path analysis
export const CriticalPathTaskSchema = z.object({
  taskId: z.string().uuid(),
  taskName: z.string(),
  duration: z.number(),
  earlyStart: z.string().date(),
  earlyFinish: z.string().date(),
  lateStart: z.string().date(),
  lateFinish: z.string().date(),
  totalFloat: z.number(),
  isCritical: z.boolean(),
});

export const CriticalPathAnalysisSchema = z.object({
  projectId: z.string().uuid(),
  criticalPath: z.array(CriticalPathTaskSchema),
  projectDuration: z.number(),
  analysisDate: z.string().datetime(),
});

// Type exports
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectTask = z.infer<typeof ProjectTaskSchema>;
export type TaskDependency = z.infer<typeof TaskDependencySchema>;
export type ProjectTeamMember = z.infer<typeof ProjectTeamMemberSchema>;
export type ProjectMilestone = z.infer<typeof ProjectMilestoneSchema>;
export type ProjectTemplate = z.infer<typeof ProjectTemplateSchema>;

export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;
export type CreateProjectTask = z.infer<typeof CreateProjectTaskSchema>;
export type UpdateProjectTask = z.infer<typeof UpdateProjectTaskSchema>;
export type CreateTaskDependency = z.infer<typeof CreateTaskDependencySchema>;
export type CreateProjectTeamMember = z.infer<typeof CreateProjectTeamMemberSchema>;
export type CreateProjectMilestone = z.infer<typeof CreateProjectMilestoneSchema>;
export type UpdateProjectMilestone = z.infer<typeof UpdateProjectMilestoneSchema>;
export type CreateProjectTemplate = z.infer<typeof CreateProjectTemplateSchema>;

export type GanttTask = z.infer<typeof GanttTaskSchema>;
export type GanttLink = z.infer<typeof GanttLinkSchema>;
export type GanttData = z.infer<typeof GanttDataSchema>;
export type CriticalPathTask = z.infer<typeof CriticalPathTaskSchema>;
export type CriticalPathAnalysis = z.infer<typeof CriticalPathAnalysisSchema>;

export type ProjectStatusType = z.infer<typeof ProjectStatus>;
export type TaskStatusType = z.infer<typeof TaskStatus>;
export type PriorityType = z.infer<typeof Priority>;
export type TaskTypeType = z.infer<typeof TaskType>;
export type DependencyTypeType = z.infer<typeof DependencyType>;
export type MilestoneStatusType = z.infer<typeof MilestoneStatus>;
// Project Accounting Schemas
export const ProjectBudgetSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  budgetName: z.string().min(1).max(255),
  budgetType: z.enum(["Original", "Revised", "Approved"]),
  totalBudget: z.number(),
  laborBudget: z.number(),
  materialBudget: z.number(),
  overheadBudget: z.number(),
  contingencyBudget: z.number(),
  status: z.enum(["Draft", "Submitted", "Approved", "Rejected"]),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.string().datetime().optional(),
  budgetPeriodStart: z.string().date().optional(),
  budgetPeriodEnd: z.string().date().optional(),
  notes: z.string().optional(),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ProjectBudgetCategorySchema = z.object({
  id: z.string().uuid(),
  budgetId: z.string().uuid(),
  categoryName: z.string().min(1).max(255),
  categoryCode: z.string().min(1).max(50),
  budgetedAmount: z.number(),
  description: z.string().optional(),
  isAcve: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ProjectCostSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  taskId: z.string().uuid().optional(),
  budgetCategoryId: z.string().uuid().optional(),
  costType: z.enum(["Labor", "Material", "Overhead", "Travel", "Other"]),
  costDate: z.string().date(),
  description: z.string().min(1),
  quantity: z.number(),
  unitCost: z.number(),
  totalCost: z.number(),
  isBillable: z.boolean(),
  billingRate: z.number().optional(),
  billableAmount: z.number().optional(),
  invoiceId: z.string().uuid().optional(),
  status: z.enum(["Pending", "Approved", "Invoiced", "Paid"]),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.string().datetime().optional(),
  attachments: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ProjectRevenueSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  revenueType: z.enum(["Fixed", "TimeAndMaterial", "Milestone", "Recurring"]),
  description: z.string().min(1),
  revenueDate: z.string().date(),
  amount: z.number(),
  recognizedAmount: z.number(),
  milestoneId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  status: z.enum(["Planned", "Recognized", "Invoiced", "Collected"]),
  recognitionMethod: z.enum(["Percentage", "Milestone", "Completed"]),
  recognitionPercentage: z.number().min(0).max(100),
  notes: z.string().optional(),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ProjectInvoiceSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  invoiceNumber: z.string().min(1).max(50),
  invoiceDate: z.string().date(),
  dueDate: z.string().date(),
  billingPeriodStart: z.string().date().optional(),
  billingPeriodEnd: z.string().date().optional(),
  subtotal: z.number(),
  taxAmount: z.number(),
  totalAmount: z.number(),
  paidAmount: z.number(),
  status: z.enum(["Draft", "Sent", "Paid", "Overdue", "Cancelled"]),
  paymentTerms: z.string().max(100).optional(),
  notes: z.string().optional(),
  customerId: z.string().uuid().optional(),
  sentAt: z.string().datetime().optional(),
  paidAt: z.string().datetime().optional(),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ProjectInvoiceLineItemSchema = z.object({
  id: z.string().uuid(),
  invoiceId: z.string().uuid(),
  taskId: z.string().uuid().optional(),
  costId: z.string().uuid().optional(),
  description: z.string().min(1),
  quantity: z.number(),
  unitPrice: z.number(),
  lineTotal: z.number(),
  taxRate: z.number().min(0).max(1),
  taxAmount: z.number(),
  createdAt: z.string().datetime(),
});

export const ProjectProfitabilitySchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  analysisDate: z.string().date(),
  totalRevenue: z.number(),
  totalCosts: z.number(),
  grossProfit: z.number(),
  grossMargin: z.number(),
  laborCosts: z.number(),
  materialCosts: z.number(),
  overheadCosts: z.number(),
  budgetVariance: z.number(),
  scheduleVariance: z.number(),
  earnedValue: z.number(),
  actualCost: z.number(),
  plannedValue: z.number(),
  costPerformanceIndex: z.number(),
  schedulePerformanceIndex: z.number(),
  estimateAtCompletion: z.number().optional(),
  estimateToComplete: z.number().optional(),
  createdAt: z.string().datetime(),
});

// Input schemas for creation
export const CreateProjectBudgetSchema = z.object({
  projectId: z.string().uuid(),
  budgetName: z.string().min(1).max(255),
  budgetType: z.enum(["Original", "Revised", "Approved"]).default("Original"),
  totalBudget: z.number().positive(),
  laborBudget: z.number().default(0),
  materialBudget: z.number().default(0),
  overheadBudget: z.number().default(0),
  contingencyBudget: z.number().default(0),
  budgetPeriodStart: z.string().date().optional(),
  budgetPeriodEnd: z.string().date().optional(),
  notes: z.string().optional(),
});

export const UpdateProjectBudgetSchema = CreateProjectBudgetSchema.partial().extend({
  status: z.enum(["Draft", "Submitted", "Approved", "Rejected"]).optional(),
});

export const CreateProjectBudgetCategorySchema = z.object({
  budgetId: z.string().uuid(),
  categoryName: z.string().min(1).max(255),
  categoryCode: z.string().min(1).max(50),
  budgetedAmount: z.number().positive(),
  description: z.string().optional(),
});

export const UpdateProjectBudgetCategorySchema = CreateProjectBudgetCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const CreateProjectCostSchema = z.object({
  projectId: z.string().uuid(),
  taskId: z.string().uuid().optional(),
  budgetCategoryId: z.string().uuid().optional(),
  costType: z.enum(["Labor", "Material", "Overhead", "Travel", "Other"]),
  costDate: z.string().date(),
  description: z.string().min(1),
  quantity: z.number().positive().default(1),
  unitCost: z.number().positive(),
  totalCost: z.number().positive(),
  isBillable: z.boolean().default(true),
  billingRate: z.number().optional(),
  billableAmount: z.number().optional(),
  attachments: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
});

export const UpdateProjectCostSchema = CreateProjectCostSchema.partial().extend({
  status: z.enum(["Pending", "Approved", "Invoiced", "Paid"]).optional(),
});

export const CreateProjectRevenueSchema = z.object({
  projectId: z.string().uuid(),
  revenueType: z.enum(["Fixed", "TimeAndMaterial", "Milestone", "Recurring"]),
  description: z.string().min(1),
  revenueDate: z.string().date(),
  amount: z.number().positive(),
  milestoneId: z.string().uuid().optional(),
  recognitionMethod: z.enum(["Percentage", "Milestone", "Completed"]).default("Percentage"),
  recognitionPercentage: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
});

export const UpdateProjectRevenueSchema = CreateProjectRevenueSchema.partial().extend({
  recognizedAmount: z.number().optional(),
  status: z.enum(["Planned", "Recognized", "Invoiced", "Collected"]).optional(),
});

export const CreateProjectInvoiceSchema = z.object({
  projectId: z.string().uuid(),
  invoiceNumber: z.string().min(1).max(50),
  invoiceDate: z.string().date(),
  dueDate: z.string().date(),
  billingPeriodStart: z.string().date().optional(),
  billingPeriodEnd: z.string().date().optional(),
  customerId: z.string().uuid().optional(),
  paymentTerms: z.string().max(100).optional(),
  notes: z.string().optional(),
  lineItems: z.array(z.object({
    taskId: z.string().uuid().optional(),
    costId: z.string().uuid().optional(),
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    taxRate: z.number().min(0).max(1).default(0),
  })),
});

export const UpdateProjectInvoiceSchema = CreateProjectInvoiceSchema.partial().extend({
  status: z.enum(["Draft", "Sent", "Paid", "Overdue", "Cancelled"]).optional(),
  paidAmount: z.number().optional(),
  sentAt: z.string().datetime().optional(),
  paidAt: z.string().datetime().optional(),
});

// Type exports
export type ProjectBudget = z.infer<typeof ProjectBudgetSchema>;
export type ProjectBudgetCategory = z.infer<typeof ProjectBudgetCategorySchema>;
export type ProjectCost = z.infer<typeof ProjectCostSchema>;
export type ProjectRevenue = z.infer<typeof ProjectRevenueSchema>;
export type ProjectInvoice = z.infer<typeof ProjectInvoiceSchema>;
export type ProjectInvoiceLineItem = z.infer<typeof ProjectInvoiceLineItemSchema>;
export type ProjectProfitability = z.infer<typeof ProjectProfitabilitySchema>;

export type CreateProjectBudget = z.infer<typeof CreateProjectBudgetSchema>;
export type UpdateProjectBudget = z.infer<typeof UpdateProjectBudgetSchema>;
export type CreateProjectBudgetCategory = z.infer<typeof CreateProjectBudgetCategorySchema>;
export type UpdateProjectBudgetCategory = z.infer<typeof UpdateProjectBudgetCategorySchema>;
export type CreateProjectCost = z.infer<typeof CreateProjectCostSchema>;
export type UpdateProjectCost = z.infer<typeof UpdateProjectCostSchema>;
export type CreateProjectRevenue = z.infer<typeof CreateProjectRevenueSchema>;
export type UpdateProjectRevenue = z.infer<typeof UpdateProjectRevenueSchema>;
export type CreateProjectInvoice = z.infer<typeof CreateProjectInvoiceSchema>;
export type UpdateProjectInvoice = z.infer<typeof UpdateProjectInvoiceSchema>;

// Project Accounting specific types
export type BudgetStatus = "Draft" | "Submitted" | "Approved" | "Rejected";
export type CostType = "Labor" | "Material" | "Overhead" | "Travel" | "Other";
export type CostStatus = "Pending" | "Approved" | "Invoiced" | "Paid";
export type RevenueType = "Fixed" | "TimeAndMaterial" | "Milestone" | "Recurring";
export type RevenueStatus = "Planned" | "Recognized" | "Invoiced" | "Collected";
export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue" | "Cancelled";
export type RecognitionMethod = "Percentage" | "Milestone" | "Completed";

// Project Financial Summary
export type ProjectFinancialSummary = {
  projectId: string;
  projectName: string;
  totalBudget: number;
  totalCosts: number;
  totalRevenue: number;
  grossProfit: number;
  grossMargin: number;
  budgetVariance: number;
  costsByCategory: {
    labor: number;
    material: number;
    overhead: number;
    travel: number;
    other: number;
  };
  invoicesSummary: {
    totalInvoiced: number;
    totalPaid: number;
    outstanding: number;
    overdue: number;
  };
  profitabilityMetrics: {
    costPerformanceIndex: number;
    schedulePerformanceIndex: number;
    earnedValue: number;
    estimateAtCompletion: number;
  };
};
