import { z } from 'zod';

// Enums
export const TimesheetStatus = z.enum([
  'Draft',
  'Submitted',
  'Approved',
  'Rejected',
  'Paid',
]);

export const ApprovalStatus = z.enum(['Pending', 'Approved', 'Rejected']);

export const TimesheetPeriod = z.enum(['Weekly', 'Bi-weekly', 'Monthly']);

export const ReportType = z.enum([
  'Summary',
  'Detailed',
  'Utilization',
  'Project',
  'Employee',
  'Billable',
]);

// Base schemas
export const TimesheetSchema = z.object({
  id: z.string().uuid(),
  timesheetCode: z.string().min(1).max(50),
  employeeId: z.string().uuid(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  status: TimesheetStatus,
  totalHours: z.number(),
  billableHours: z.number(),
  nonBillableHours: z.number(),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.string().datetime().optional(),
  submittedAt: z.string().datetime().optional(),
  companyId: z.string().uuid(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const TimeEntrySchema = z.object({
  id: z.string().uuid(),
  timesheetId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  activityType: z.string().min(1).max(100),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  duration: z.number(),
  isBillable: z.boolean(),
  hourlyRate: z.number().optional(),
  location: z.string().max(255).optional(),
  gpsCoordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
      accuracy: z.number().optional(),
    })
    .optional(),
  isManualEntry: z.boolean(),
  deviceInfo: z.record(z.any()).optional(),
  attachments: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const TimeCategorySchema = z.object({
  id: z.string().uuid(),
  categoryName: z.string().min(1).max(100),
  categoryCode: z.string().min(1).max(20),
  description: z.string().optional(),
  isBillable: z.boolean(),
  defaultHourlyRate: z.number().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  companyId: z.string().uuid(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const TimeApprovalSchema = z.object({
  id: z.string().uuid(),
  timesheetId: z.string().uuid(),
  approverId: z.string().uuid(),
  status: ApprovalStatus,
  comments: z.string().optional(),
  approvedHours: z.number().optional(),
  rejectedHours: z.number().optional(),
  approvalLevel: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const TimeTrackingSettingsSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  requireProjectSelection: z.boolean(),
  requireTaskSelection: z.boolean(),
  allowManualTimeEntry: z.boolean(),
  requireGpsTracking: z.boolean(),
  maxDailyHours: z.number(),
  maxWeeklyHours: z.number(),
  timesheetPeriod: TimesheetPeriod,
  autoSubmitTimesheets: z.boolean(),
  requireApproval: z.boolean(),
  approvalWorkflow: z.record(z.any()).optional(),
  overtimeRules: z.record(z.any()).optional(),
  roundingRules: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const TimeReportSchema = z.object({
  id: z.string().uuid(),
  reportName: z.string().min(1).max(255),
  reportType: ReportType,
  parameters: z.record(z.any()),
  generatedBy: z.string().uuid(),
  companyId: z.string().uuid(),
  reportData: z.record(z.any()).optional(),
  isScheduled: z.boolean(),
  scheduleConfig: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
});

// Input schemas for creation
export const CreateTimesheetSchema = z.object({
  employeeId: z.string().uuid(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  notes: z.string().optional(),
});

export const UpdateTimesheetSchema = CreateTimesheetSchema.partial().extend({
  status: TimesheetStatus.optional(),
  totalHours: z.number().optional(),
  billableHours: z.number().optional(),
  nonBillableHours: z.number().optional(),
});

export const CreateTimeEntrySchema = z.object({
  timesheetId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  activityType: z.string().min(1).max(100),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  duration: z.number().positive(),
  isBillable: z.boolean().default(true),
  hourlyRate: z.number().optional(),
  location: z.string().max(255).optional(),
  gpsCoordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
      accuracy: z.number().optional(),
    })
    .optional(),
  isManualEntry: z.boolean().default(false),
  deviceInfo: z.record(z.any()).optional(),
  attachments: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
});

export const UpdateTimeEntrySchema = CreateTimeEntrySchema.partial();

export const CreateTimeCategorySchema = z.object({
  categoryName: z.string().min(1).max(100),
  categoryCode: z.string().min(1).max(20),
  description: z.string().optional(),
  isBillable: z.boolean().default(true),
  defaultHourlyRate: z.number().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
});

export const UpdateTimeCategorySchema =
  CreateTimeCategorySchema.partial().extend({
    isActive: z.boolean().optional(),
  });

export const CreateTimeApprovalSchema = z.object({
  timesheetId: z.string().uuid(),
  status: ApprovalStatus,
  comments: z.string().optional(),
  approvedHours: z.number().optional(),
  rejectedHours: z.number().optional(),
});

export const UpdateTimeTrackingSettingsSchema = z.object({
  requireProjectSelection: z.boolean().optional(),
  requireTaskSelection: z.boolean().optional(),
  allowManualTimeEntry: z.boolean().optional(),
  requireGpsTracking: z.boolean().optional(),
  maxDailyHours: z.number().optional(),
  maxWeeklyHours: z.number().optional(),
  timesheetPeriod: TimesheetPeriod.optional(),
  autoSubmitTimesheets: z.boolean().optional(),
  requireApproval: z.boolean().optional(),
  approvalWorkflow: z.record(z.any()).optional(),
  overtimeRules: z.record(z.any()).optional(),
  roundingRules: z.record(z.any()).optional(),
});

export const CreateTimeReportSchema = z.object({
  reportName: z.string().min(1).max(255),
  reportType: ReportType,
  parameters: z.record(z.any()),
  isScheduled: z.boolean().default(false),
  scheduleConfig: z.record(z.any()).optional(),
});

// Time tracking specific schemas
export const TimeLogSchema = z.object({
  projectId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  activityType: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().positive(),
  isBillable: z.boolean().default(true),
  date: z.string().date(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export const TimerSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  activityType: z.string(),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  isRunning: z.boolean(),
  elapsedTime: z.number(), // in seconds
});

export const UtilizationReportSchema = z.object({
  employeeId: z.string().uuid(),
  employeeName: z.string(),
  period: z.object({
    startDate: z.string().date(),
    endDate: z.string().date(),
  }),
  totalHours: z.number(),
  billableHours: z.number(),
  nonBillableHours: z.number(),
  utilizationRate: z.number(), // percentage
  projectBreakdown: z.array(
    z.object({
      projectId: z.string().uuid(),
      projectName: z.string(),
      hours: z.number(),
      percentage: z.number(),
    })
  ),
});

export const ProjectTimeReportSchema = z.object({
  projectId: z.string().uuid(),
  projectName: z.string(),
  period: z.object({
    startDate: z.string().date(),
    endDate: z.string().date(),
  }),
  totalHours: z.number(),
  billableHours: z.number(),
  totalCost: z.number(),
  billableAmount: z.number(),
  teamMembers: z.array(
    z.object({
      employeeId: z.string().uuid(),
      employeeName: z.string(),
      hours: z.number(),
      cost: z.number(),
    })
  ),
  taskBreakdown: z.array(
    z.object({
      taskId: z.string().uuid(),
      taskName: z.string(),
      hours: z.number(),
      percentage: z.number(),
    })
  ),
});

// Type exports
export type Timesheet = z.infer<typeof TimesheetSchema>;
export type TimeEntry = z.infer<typeof TimeEntrySchema>;
export type TimeCategory = z.infer<typeof TimeCategorySchema>;
export type TimeApproval = z.infer<typeof TimeApprovalSchema>;
export type TimeTrackingSettings = z.infer<typeof TimeTrackingSettingsSchema>;
export type TimeReport = z.infer<typeof TimeReportSchema>;

export type CreateTimesheet = z.infer<typeof CreateTimesheetSchema>;
export type UpdateTimesheet = z.infer<typeof UpdateTimesheetSchema>;
export type CreateTimeEntry = z.infer<typeof CreateTimeEntrySchema>;
export type UpdateTimeEntry = z.infer<typeof UpdateTimeEntrySchema>;
export type CreateTimeCategory = z.infer<typeof CreateTimeCategorySchema>;
export type UpdateTimeCategory = z.infer<typeof UpdateTimeCategorySchema>;
export type CreateTimeApproval = z.infer<typeof CreateTimeApprovalSchema>;
export type UpdateTimeTrackingSettings = z.infer<
  typeof UpdateTimeTrackingSettingsSchema
>;
export type CreateTimeReport = z.infer<typeof CreateTimeReportSchema>;

export type TimeLog = z.infer<typeof TimeLogSchema>;
export type Timer = z.infer<typeof TimerSchema>;
export type UtilizationReport = z.infer<typeof UtilizationReportSchema>;
export type ProjectTimeReport = z.infer<typeof ProjectTimeReportSchema>;

export type TimesheetStatusType = z.infer<typeof TimesheetStatus>;
export type ApprovalStatusType = z.infer<typeof ApprovalStatus>;
export type TimesheetPeriodType = z.infer<typeof TimesheetPeriod>;
export type ReportTypeType = z.infer<typeof ReportType>;
