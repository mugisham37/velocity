import { DatabaseService } from '../../database';
import {
  timeApprovals,
  timeCategories,
  timeEntries,
  timeReports,
  timeTrackingSettings,
  timesheets,
} from '../../database';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateTimeEntry,
  CreateTimesheet,
  ProjectTimeReport,
  TimeEntry,
  Timesheet,
  UpdateTimeEntry,
  UpdateTimesheet,
  UtilizationReport,
  CreateTimeCategory,
  UpdateTimeCategory,
  TimeCategory,
  UpdateTimeTrackingSettings,
  TimeTrackingSettings,
  CreateTimeReport,
  TimeReport,
  TimeLog,
  Timer,
} from '../../shared';
import { and, asc, between, desc, eq, gte, lte, sql } from '../../database';

@Injectable()
export class TimeTrackingService {
  constructor(private readonly db: DatabaseService) {}

  // Helper function to transform database timesheet to type-safe Timesheet
  private transformTimesheet(dbTimesheet: any): Timesheet {
    return {
      id: dbTimesheet.id,
      timesheetCode: dbTimesheet.timesheetCode,
      employeeId: dbTimesheet.employeeId,
      startDate: dbTimesheet.startDate,
      endDate: dbTimesheet.endDate,
      status: dbTimesheet.status as any,
      totalHours: parseFloat(dbTimesheet.totalHours || '0'),
      billableHours: parseFloat(dbTimesheet.billableHours || '0'),
      nonBillableHours: parseFloat(dbTimesheet.nonBillableHours || '0'),
      approvedBy: dbTimesheet.approvedBy || undefined,
      approvedAt: dbTimesheet.approvedAt?.toISOString() || undefined,
      submittedAt: dbTimesheet.submittedAt?.toISOString() || undefined,
      companyId: dbTimesheet.companyId,
      notes: dbTimesheet.notes || undefined,
      createdAt: dbTimesheet.createdAt.toISOString(),
      updatedAt: dbTimesheet.updatedAt.toISOString(),
    };
  }

  // Helper function to transform database time entry to type-safe TimeEntry
  private transformTimeEntry(dbEntry: any): TimeEntry {
    return {
      id: dbEntry.id,
      timesheetId: dbEntry.timesheetId,
      projectId: dbEntry.projectId || undefined,
      taskId: dbEntry.taskId || undefined,
      activityType: dbEntry.activityType,
      description: dbEntry.description || undefined,
      startTime: dbEntry.startTime.toISOString(),
      endTime: dbEntry.endTime?.toISOString() || undefined,
      duration: parseFloat(dbEntry.duration),
      isBillable: dbEntry.isBillable,
      hourlyRate: dbEntry.hourlyRate
        ? parseFloat(dbEntry.hourlyRate)
        : undefined,
      location: dbEntry.location || undefined,
      gpsCoordinates: dbEntry.gpsCoordinates || undefined,
      isManualEntry: dbEntry.isManualEntry,
      deviceInfo: dbEntry.deviceInfo || undefined,
      attachments: dbEntry.attachments || undefined,
      customFields: dbEntry.customFields || undefined,
      createdAt: dbEntry.createdAt.toISOString(),
      updatedAt: dbEntry.updatedAt.toISOString(),
    };
  }

  // Helper function to transform database time category to type-safe TimeCategory
  private transformTimeCategory(dbCategory: any): TimeCategory {
    return {
      id: dbCategory.id,
      categoryName: dbCategory.categoryName,
      categoryCode: dbCategory.categoryCode,
      description: dbCategory.description || undefined,
      isBillable: dbCategory.isBillable,
      defaultHourlyRate: dbCategory.defaultHourlyRate
        ? parseFloat(dbCategory.defaultHourlyRate)
        : undefined,
      color: dbCategory.color || undefined,
      companyId: dbCategory.companyId,
      isActive: dbCategory.isActive,
      createdAt: dbCategory.createdAt.toISOString(),
      updatedAt: dbCategory.updatedAt.toISOString(),
    };
  }

  // Helper function to transform database time tracking settings to type-safe TimeTrackingSettings
  private transformTimeTrackingSettings(dbSettings: any): TimeTrackingSettings {
    return {
      id: dbSettings.id,
      companyId: dbSettings.companyId,
      requireProjectSelection: dbSettings.requireProjectSelection,
      requireTaskSelection: dbSettings.requireTaskSelection,
      allowManualTimeEntry: dbSettings.allowManualTimeEntry,
      requireGpsTracking: dbSettings.requireGpsTracking,
      maxDailyHours: parseFloat(dbSettings.maxDailyHours),
      maxWeeklyHours: parseFloat(dbSettings.maxWeeklyHours),
      timesheetPeriod: dbSettings.timesheetPeriod as any,
      autoSubmitTimesheets: dbSettings.autoSubmitTimesheets,
      requireApproval: dbSettings.requireApproval,
      approvalWorkflow: dbSettings.approvalWorkflow || undefined,
      overtimeRules: dbSettings.overtimeRules || undefined,
      roundingRules: dbSettings.roundingRules || undefined,
      createdAt: dbSettings.createdAt.toISOString(),
      updatedAt: dbSettings.updatedAt.toISOString(),
    };
  }

  // Helper function to transform database time report to type-safe TimeReport
  private transformTimeReport(dbReport: any): TimeReport {
    return {
      id: dbReport.id,
      reportName: dbReport.reportName,
      reportType: dbReport.reportType as any,
      parameters: dbReport.parameters,
      generatedBy: dbReport.generatedBy,
      companyId: dbReport.companyId,
      reportData: dbReport.reportData || undefined,
      isScheduled: dbReport.isScheduled,
      scheduleConfig: dbReport.scheduleConfig || undefined,
      createdAt: dbReport.createdAt.toISOString(),
    };
  }

  // Timesheet Management
  async createTimesheet(
    companyId: string,
    data: CreateTimesheet
  ): Promise<Timesheet> {
    // Generate timesheet code
    const timesheetCount = await this.db.db
      .select({ count: sql<number>`count(*)` })
      .from(timesheets)
      .where(eq(timesheets.companyId, companyId));

    const timesheetCode = `TS-${new Date().getFullYear()}-${String(timesheetCount[0]!.count + 1).padStart(4, '0')}`;

    const [timesheet] = await this.db.db
      .insert(timesheets)
      .values({
        employeeId: data.employeeId,
        startDate: data.startDate,
        endDate: data.endDate,
        notes: data.notes || null,
        timesheetCode,
        companyId,
        status: 'Draft',
        totalHours: '0',
        billableHours: '0',
        nonBillableHours: '0',
      })
      .returning();

    return this.transformTimesheet(timesheet);
  }

  async updateTimesheet(
    id: string,
    companyId: string,
    data: UpdateTimesheet
  ): Promise<Timesheet> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.employeeId !== undefined) updateData.employeeId = data.employeeId;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.totalHours !== undefined)
      updateData.totalHours = data.totalHours.toString();
    if (data.billableHours !== undefined)
      updateData.billableHours = data.billableHours.toString();
    if (data.nonBillableHours !== undefined)
      updateData.nonBillableHours = data.nonBillableHours.toString();

    const [timesheet] = await this.db.db
      .update(timesheets)
      .set(updateData)
      .where(and(eq(timesheets.id, id), eq(timesheets.companyId, companyId)))
      .returning();

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    return this.transformTimesheet(timesheet);
  }

  async getTimesheet(id: string, companyId: string): Promise<Timesheet> {
    const [timesheet] = await this.db.db
      .select()
      .from(timesheets)
      .where(and(eq(timesheets.id, id), eq(timesheets.companyId, companyId)));

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    return this.transformTimesheet(timesheet);
  }

  async getTimesheets(companyId: string, filters?: any): Promise<Timesheet[]> {
    const conditions = [eq(timesheets.companyId, companyId)];

    if (filters?.employeeId) {
      conditions.push(eq(timesheets.employeeId, filters.employeeId));
    }

    if (filters?.status) {
      conditions.push(eq(timesheets.status, filters.status));
    }

    if (filters?.startDate && filters?.endDate) {
      conditions.push(gte(timesheets.startDate, filters.startDate));
      conditions.push(lte(timesheets.endDate, filters.endDate));
    }

    const result = await this.db.db
      .select()
      .from(timesheets)
      .where(and(...conditions))
      .orderBy(desc(timesheets.createdAt));
    return result.map(timesheet => this.transformTimesheet(timesheet));
  }

  async submitTimesheet(id: string, companyId: string): Promise<Timesheet> {
    // Validate timesheet has entries
    const entries = await this.getTimesheetEntries(id);
    if (entries.length === 0) {
      throw new BadRequestException(
        'Cannot submit timesheet without time entries'
      );
    }

    // Calculate totals
    await this.recalculateTimesheetTotals(id);

    const [timesheet] = await this.db.db
      .update(timesheets)
      .set({
        status: 'Submitted',
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(timesheets.id, id), eq(timesheets.companyId, companyId)))
      .returning();

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    return this.transformTimesheet(timesheet);
  }

  // Time Entry Management
  async createTimeEntry(data: CreateTimeEntry): Promise<TimeEntry> {
    // Validate timesheet exists and is editable
    const timesheet = await this.db.db
      .select()
      .from(timesheets)
      .where(eq(timesheets.id, data.timesheetId))
      .limit(1);

    if (!timesheet.length) {
      throw new NotFoundException('Timesheet not found');
    }

    if (timesheet[0]!.status !== 'Draft') {
      throw new BadRequestException(
        'Cannot add entries to submitted timesheet'
      );
    }

    // Validate daily hours limit
    await this.validateDailyHours(
      data.timesheetId,
      data.startTime,
      data.duration
    );

    const [entry] = await this.db.db
      .insert(timeEntries)
      .values({
        timesheetId: data.timesheetId,
        projectId: data.projectId || null,
        taskId: data.taskId || null,
        activityType: data.activityType,
        description: data.description || null,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        duration: data.duration.toString(),
        isBillable: data.isBillable,
        hourlyRate: data.hourlyRate?.toString() || null,
        location: data.location || null,
        gpsCoordinates: data.gpsCoordinates || null,
        isManualEntry: data.isManualEntry,
        deviceInfo: data.deviceInfo || null,
        attachments: data.attachments || null,
        customFields: data.customFields || null,
      })
      .returning();

    // Recalculate timesheet totals
    await this.recalculateTimesheetTotals(data.timesheetId);

    return this.transformTimeEntry(entry);
  }

  async updateTimeEntry(id: string, data: UpdateTimeEntry): Promise<TimeEntry> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.timesheetId !== undefined)
      updateData.timesheetId = data.timesheetId;
    if (data.projectId !== undefined)
      updateData.projectId = data.projectId || null;
    if (data.taskId !== undefined) updateData.taskId = data.taskId || null;
    if (data.activityType !== undefined)
      updateData.activityType = data.activityType;
    if (data.description !== undefined)
      updateData.description = data.description || null;
    if (data.startTime !== undefined)
      updateData.startTime = new Date(data.startTime);
    if (data.endTime !== undefined)
      updateData.endTime = data.endTime ? new Date(data.endTime) : null;
    if (data.duration !== undefined)
      updateData.duration = data.duration.toString();
    if (data.isBillable !== undefined) updateData.isBillable = data.isBillable;
    if (data.hourlyRate !== undefined)
      updateData.hourlyRate = data.hourlyRate?.toString() || null;
    if (data.location !== undefined)
      updateData.location = data.location || null;
    if (data.gpsCoordinates !== undefined)
      updateData.gpsCoordinates = data.gpsCoordinates || null;
    if (data.isManualEntry !== undefined)
      updateData.isManualEntry = data.isManualEntry;
    if (data.deviceInfo !== undefined)
      updateData.deviceInfo = data.deviceInfo || null;
    if (data.attachments !== undefined)
      updateData.attachments = data.attachments || null;
    if (data.customFields !== undefined)
      updateData.customFields = data.customFields || null;

    const [entry] = await this.db.db
      .update(timeEntries)
      .set(updateData)
      .where(eq(timeEntries.id, id))
      .returning();

    if (!entry) {
      throw new NotFoundException('Time entry not found');
    }

    // Recalculate timesheet totals
    await this.recalculateTimesheetTotals(entry.timesheetId);

    return this.transformTimeEntry(entry);
  }

  async deleteTimeEntry(id: string): Promise<void> {
    const [entry] = await this.db.db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.id, id));

    if (!entry) {
      throw new NotFoundException('Time entry not found');
    }

    await this.db.db.delete(timeEntries).where(eq(timeEntries.id, id));

    // Recalculate timesheet totals
    await this.recalculateTimesheetTotals(entry.timesheetId);
  }

  async getTimesheetEntries(timesheetId: string): Promise<TimeEntry[]> {
    const entries = await this.db.db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.timesheetId, timesheetId))
      .orderBy(asc(timeEntries.startTime));

    return entries.map(entry => this.transformTimeEntry(entry));
  }

  // Time Tracking with Mobile Support
  async startTimer(
    userId: string,
    projectId?: string,
    taskId?: string,
    activityType?: string
  ): Promise<Timer> {
    // Check if user has active timer
    const activeTimer = await this.getActiveTimer(userId);
    if (activeTimer) {
      throw new BadRequestException(
        'Please stop the current timer before starting a new one'
      );
    }

    const timer: Timer = {
      id: crypto.randomUUID(),
      projectId,
      taskId,
      activityType: activityType || 'General',
      startTime: new Date().toISOString(),
      isRunning: true,
      elapsedTime: 0,
    };

    // Store in cache/session (implementation depends on your caching strategy)
    await this.updateActiveTimer(userId, timer);
    return timer;
  }

  async stopTimer(
    userId: string,
    description?: string
  ): Promise<TimeEntry | null> {
    const activeTimer = await this.getActiveTimer(userId);
    if (!activeTimer) {
      throw new NotFoundException('No active timer found');
    }

    const endTime = new Date();
    const startTime = new Date(activeTimer.startTime);
    const duration =
      (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // Convert to hours

    // Find or create current timesheet
    const currentTimesheet = await this.getCurrentTimesheet(userId);

    const timeEntryData: CreateTimeEntry = {
      timesheetId: currentTimesheet.id,
      projectId: activeTimer.projectId,
      taskId: activeTimer.taskId,
      activityType: activeTimer.activityType,
      description,
      startTime: activeTimer.startTime,
      endTime: endTime.toISOString(),
      duration,
      isBillable: true,
      isManualEntry: false,
    };

    const timeEntry = await this.createTimeEntry(timeEntryData);

    // Clear active timer
    await this.clearActiveTimer(userId);

    return timeEntry;
  }

  async logTime(userId: string, timeLog: TimeLog): Promise<TimeEntry> {
    // Find or create current timesheet
    const currentTimesheet = await this.getCurrentTimesheet(userId);

    const timeEntryData: CreateTimeEntry = {
      timesheetId: currentTimesheet.id,
      projectId: timeLog.projectId,
      taskId: timeLog.taskId,
      activityType: timeLog.activityType,
      description: timeLog.description,
      startTime: timeLog.startTime || new Date().toISOString(),
      endTime: timeLog.endTime,
      duration: timeLog.duration,
      isBillable: timeLog.isBillable ?? true,
      isManualEntry: true,
    };

    return this.createTimeEntry(timeEntryData);
  }

  // Approval Workflow
  async approveTimesheet(
    timesheetId: string,
    approverId: string,
    comments?: string
  ): Promise<void> {
    const timesheet = await this.db.db
      .select()
      .from(timesheets)
      .where(eq(timesheets.id, timesheetId))
      .limit(1);

    if (!timesheet.length) {
      throw new NotFoundException('Timesheet not found');
    }

    if (timesheet[0]!.status !== 'Submitted') {
      throw new BadRequestException(
        'Only submitted timesheets can be approved'
      );
    }

    // Create approval record
    await this.db.db.insert(timeApprovals).values({
      timesheetId,
      approverId,
      status: 'Approved',
      comments: comments || null,
      approvedHours: timesheet[0]!.totalHours,
      approvalLevel: 1,
    });

    // Update timesheet status
    await this.db.db
      .update(timesheets)
      .set({
        status: 'Approved',
        approvedBy: approverId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(timesheets.id, timesheetId));
  }

  async rejectTimesheet(
    timesheetId: string,
    approverId: string,
    comments: string
  ): Promise<void> {
    const timesheet = await this.db.db
      .select()
      .from(timesheets)
      .where(eq(timesheets.id, timesheetId))
      .limit(1);

    if (!timesheet.length) {
      throw new NotFoundException('Timesheet not found');
    }

    if (timesheet[0]!.status !== 'Submitted') {
      throw new BadRequestException(
        'Only submitted timesheets can be rejected'
      );
    }

    // Create approval record
    await this.db.db.insert(timeApprovals).values({
      timesheetId,
      approverId,
      status: 'Rejected',
      comments: comments || null,
      rejectedHours: timesheet[0]!.totalHours,
      approvalLevel: 1,
    });

    // Update timesheet status
    await this.db.db
      .update(timesheets)
      .set({
        status: 'Rejected',
        updatedAt: new Date(),
      })
      .where(eq(timesheets.id, timesheetId));
  }

  // Reporting and Analytics
  async generateUtilizationReport(
    companyId: string,
    startDate: string,
    endDate: string,
    employeeId?: string
  ): Promise<UtilizationReport[]> {
    const conditions = [
      eq(timesheets.companyId, companyId),
      eq(timesheets.status, 'Approved'),
      between(timesheets.startDate, startDate, endDate)
    ];

    if (employeeId) {
      conditions.push(eq(timesheets.employeeId, employeeId));
    }

    const results = await this.db.db
      .select({
        employeeId: timesheets.employeeId,
        totalHours: sql<number>`SUM(${timesheets.totalHours})`,
        billableHours: sql<number>`SUM(${timesheets.billableHours})`,
        nonBillableHours: sql<number>`SUM(${timesheets.nonBillableHours})`,
      })
      .from(timesheets)
      .where(and(...conditions))
      .groupBy(timesheets.employeeId);

    return results.map(result => ({
      employeeId: result.employeeId,
      employeeName: `Employee ${result.employeeId.slice(-4)}`, // TODO: Get actual name
      period: { startDate, endDate },
      totalHours: result.totalHours,
      billableHours: result.billableHours,
      nonBillableHours: result.nonBillableHours,
      utilizationRate:
        result.totalHours > 0
          ? (result.billableHours / result.totalHours) * 100
          : 0,
      projectBreakdown: [], // TODO: Implement project breakdown
    }));
  }

  async generateProjectTimeReport(
    projectId: string,
    startDate: string,
    endDate: string
  ): Promise<ProjectTimeReport> {
    const projectEntries = await this.db.db
      .select()
      .from(timeEntries)
      .innerJoin(timesheets, eq(timeEntries.timesheetId, timesheets.id))
      .where(
        and(
          eq(timeEntries.projectId, projectId),
          eq(timesheets.status, 'Approved'),
          between(timesheets.startDate, startDate, endDate)
        )
      );

    const totalHours = projectEntries.reduce(
      (sum, entry) => sum + parseFloat(entry.time_entries.duration),
      0
    );
    const billableHours = projectEntries
      .filter(entry => entry.time_entries.isBillable)
      .reduce((sum, entry) => sum + parseFloat(entry.time_entries.duration), 0);

    const totalCost = projectEntries.reduce(
      (sum, entry) =>
        sum +
        parseFloat(entry.time_entries.duration) *
          parseFloat(entry.time_entries.hourlyRate || '0'),
      0
    );

    const billableAmount = projectEntries
      .filter(entry => entry.time_entries.isBillable)
      .reduce(
        (sum, entry) =>
          sum +
          parseFloat(entry.time_entries.duration) *
            parseFloat(entry.time_entries.hourlyRate || '0'),
        0
      );

    return {
      projectId,
      projectName: `Project ${projectId.slice(-4)}`, // TODO: Get actual name
      period: { startDate, endDate },
      totalHours,
      billableHours,
      totalCost,
      billableAmount,
      teamMembers: [], // TODO: Implement team member breakdown
      taskBreakdown: [], // TODO: Implement task breakdown
    };
  }

  // Helper Methods
  async getCurrentTimesheet(userId: string): Promise<Timesheet> {
    const currentWeekStart = this.getCurrentWeekStart();
    const currentWeekEnd = this.getCurrentWeekEnd();

    let [timesheet] = await this.db.db
      .select()
      .from(timesheets)
      .where(
        and(
          eq(timesheets.employeeId, userId),
          eq(timesheets.startDate, currentWeekStart),
          eq(timesheets.endDate, currentWeekEnd)
        )
      );

    if (!timesheet) {
      // Create new timesheet for current week
      const newTimesheet = await this.createTimesheet('default-company', {
        employeeId: userId,
        startDate: currentWeekStart,
        endDate: currentWeekEnd,
      });
      return newTimesheet;
    }

    return this.transformTimesheet(timesheet);
  }

  private async recalculateTimesheetTotals(timesheetId: string): Promise<void> {
    const entries = await this.getTimesheetEntries(timesheetId);

    const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0);
    const billableHours = entries
      .filter(entry => entry.isBillable)
      .reduce((sum, entry) => sum + entry.duration, 0);
    const nonBillableHours = totalHours - billableHours;

    await this.db.db
      .update(timesheets)
      .set({
        totalHours: totalHours.toString(),
        billableHours: billableHours.toString(),
        nonBillableHours: nonBillableHours.toString(),
        updatedAt: new Date(),
      })
      .where(eq(timesheets.id, timesheetId));
  }

  private async validateDailyHours(
    timesheetId: string,
    date: string,
    additionalHours: number
  ): Promise<void> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayEntries = await this.db.db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.timesheetId, timesheetId),
          gte(timeEntries.startTime, dayStart),
          lte(timeEntries.startTime, dayEnd)
        )
      );

    const currentDayHours = dayEntries.reduce(
      (sum, entry) => sum + parseFloat(entry.duration),
      0
    );
    const totalDayHours = currentDayHours + additionalHours;

    if (totalDayHours > 24) {
      throw new BadRequestException('Daily hours cannot exceed 24 hours');
    }
  }

  private getCurrentWeekStart(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek;
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart.toISOString().split('T')[0]!;
  }

  private getCurrentWeekEnd(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + 6;
    const weekEnd = new Date(now.setDate(diff));
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd.toISOString().split('T')[0]!;
  }

  async getActiveTimer(_userId: string): Promise<Timer | null> {
    // Implementation depends on your caching strategy
    // This could be stored in Redis, database, or memory
    return null; // Placeholder
  }

  private async clearActiveTimer(_userId: string): Promise<void> {
    // Implementation depends on your caching strategy
    // Clear the active timer for the user
  }

  private async updateActiveTimer(
    _userId: string,
    _timer: Timer
  ): Promise<void> {
    // Implementation depends on your caching strategy
    // Store the updated timer for the user
  }

  // Additional methods for complete time tracking implementation

  // Time Entry Management
  async getTimeEntries(filters?: any): Promise<TimeEntry[]> {
    const conditions = [];

    if (filters?.timesheetId) {
      conditions.push(eq(timeEntries.timesheetId, filters.timesheetId));
    }

    if (filters?.projectId) {
      conditions.push(eq(timeEntries.projectId, filters.projectId));
    }

    if (filters?.taskId) {
      conditions.push(eq(timeEntries.taskId, filters.taskId));
    }

    if (filters?.isBillable !== undefined) {
      conditions.push(eq(timeEntries.isBillable, filters.isBillable));
    }

    if (filters?.startDate && filters?.endDate) {
      conditions.push(
        between(timeEntries.startTime, filters.startDate, filters.endDate)
      );
    }

    const queryBuilder = this.db.db.select().from(timeEntries);
    
    const result = await (conditions.length > 0 
      ? queryBuilder.where(and(...conditions)) 
      : queryBuilder
    ).orderBy(desc(timeEntries.startTime));
    
    return result.map(entry => this.transformTimeEntry(entry));
  }

  async getTimeEntry(id: string): Promise<TimeEntry> {
    const [entry] = await this.db.db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.id, id));

    if (!entry) {
      throw new NotFoundException('Time entry not found');
    }

    return this.transformTimeEntry(entry);
  }

  // Time Category Management
  async createTimeCategory(
    companyId: string,
    data: CreateTimeCategory
  ): Promise<TimeCategory> {
    const [category] = await this.db.db
      .insert(timeCategories)
      .values({
        categoryName: data.categoryName,
        categoryCode: data.categoryCode,
        description: data.description || null,
        isBillable: data.isBillable,
        defaultHourlyRate: data.defaultHourlyRate?.toString() || null,
        color: data.color || null,
        companyId,
        isActive: true,
      })
      .returning();

    return this.transformTimeCategory(category);
  }

  async updateTimeCategory(
    id: string,
    data: UpdateTimeCategory
  ): Promise<TimeCategory> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.categoryName !== undefined)
      updateData.categoryName = data.categoryName;
    if (data.categoryCode !== undefined)
      updateData.categoryCode = data.categoryCode;
    if (data.description !== undefined)
      updateData.description = data.description || null;
    if (data.isBillable !== undefined) updateData.isBillable = data.isBillable;
    if (data.defaultHourlyRate !== undefined)
      updateData.defaultHourlyRate = data.defaultHourlyRate?.toString() || null;
    if (data.color !== undefined) updateData.color = data.color || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [category] = await this.db.db
      .update(timeCategories)
      .set(updateData)
      .where(eq(timeCategories.id, id))
      .returning();

    if (!category) {
      throw new NotFoundException('Time category not found');
    }

    return this.transformTimeCategory(category);
  }

  async getTimeCategory(id: string): Promise<TimeCategory> {
    const [category] = await this.db.db
      .select()
      .from(timeCategories)
      .where(eq(timeCategories.id, id));

    if (!category) {
      throw new NotFoundException('Time category not found');
    }

    return this.transformTimeCategory(category);
  }

  async getTimeCategories(companyId: string): Promise<TimeCategory[]> {
    const categories = await this.db.db
      .select()
      .from(timeCategories)
      .where(
        and(
          eq(timeCategories.companyId, companyId),
          eq(timeCategories.isActive, true)
        )
      )
      .orderBy(asc(timeCategories.categoryName));

    return categories.map(category => this.transformTimeCategory(category));
  }

  async deleteTimeCategory(id: string): Promise<void> {
    // Soft delete by setting isActive to false
    await this.db.db
      .update(timeCategories)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(timeCategories.id, id));
  }

  // Time Tracking Settings
  async getTimeTrackingSettings(
    companyId: string
  ): Promise<TimeTrackingSettings> {
    let [settings] = await this.db.db
      .select()
      .from(timeTrackingSettings)
      .where(eq(timeTrackingSettings.companyId, companyId));

    if (!settings) {
      // Create default settings
      [settings] = await this.db.db
        .insert(timeTrackingSettings)
        .values({
          companyId,
          requireProjectSelection: true,
          requireTaskSelection: false,
          allowManualTimeEntry: true,
          requireGpsTracking: false,
          maxDailyHours: '24',
          maxWeeklyHours: '168',
          timesheetPeriod: 'Weekly',
          autoSubmitTimesheets: false,
          requireApproval: true,
        })
        .returning();
    }

    return this.transformTimeTrackingSettings(settings);
  }

  async updateTimeTrackingSettings(
    companyId: string,
    data: UpdateTimeTrackingSettings
  ): Promise<TimeTrackingSettings> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.requireProjectSelection !== undefined)
      updateData.requireProjectSelection = data.requireProjectSelection;
    if (data.requireTaskSelection !== undefined)
      updateData.requireTaskSelection = data.requireTaskSelection;
    if (data.allowManualTimeEntry !== undefined)
      updateData.allowManualTimeEntry = data.allowManualTimeEntry;
    if (data.requireGpsTracking !== undefined)
      updateData.requireGpsTracking = data.requireGpsTracking;
    if (data.maxDailyHours !== undefined)
      updateData.maxDailyHours = data.maxDailyHours.toString();
    if (data.maxWeeklyHours !== undefined)
      updateData.maxWeeklyHours = data.maxWeeklyHours.toString();
    if (data.timesheetPeriod !== undefined)
      updateData.timesheetPeriod = data.timesheetPeriod;
    if (data.autoSubmitTimesheets !== undefined)
      updateData.autoSubmitTimesheets = data.autoSubmitTimesheets;
    if (data.requireApproval !== undefined)
      updateData.requireApproval = data.requireApproval;
    if (data.approvalWorkflow !== undefined)
      updateData.approvalWorkflow = data.approvalWorkflow || null;
    if (data.overtimeRules !== undefined)
      updateData.overtimeRules = data.overtimeRules || null;
    if (data.roundingRules !== undefined)
      updateData.roundingRules = data.roundingRules || null;

    const [settings] = await this.db.db
      .update(timeTrackingSettings)
      .set(updateData)
      .where(eq(timeTrackingSettings.companyId, companyId))
      .returning();

    if (!settings) {
      throw new NotFoundException('Time tracking settings not found');
    }

    return this.transformTimeTrackingSettings(settings);
  }

  // Enhanced Timer Management with Mobile Support
  async pauseTimer(userId: string): Promise<Timer> {
    const activeTimer = await this.getActiveTimer(userId);
    if (!activeTimer) {
      throw new NotFoundException('No active timer found');
    }

    if (!activeTimer.isRunning) {
      throw new BadRequestException('Timer is already paused');
    }

    // Calculate elapsed time and pause
    const now = new Date();
    const startTime = new Date(activeTimer.startTime);
    const additionalElapsed = Math.floor(
      (now.getTime() - startTime.getTime()) / 1000
    );

    const pausedTimer = {
      ...activeTimer,
      isRunning: false,
      elapsedTime: activeTimer.elapsedTime + additionalElapsed,
    };

    // Update timer in cache/storage
    await this.updateActiveTimer(userId, pausedTimer);

    return pausedTimer;
  }

  async resumeTimer(userId: string): Promise<Timer> {
    const activeTimer = await this.getActiveTimer(userId);
    if (!activeTimer) {
      throw new NotFoundException('No active timer found');
    }

    if (activeTimer.isRunning) {
      throw new BadRequestException('Timer is already running');
    }

    const resumedTimer = {
      ...activeTimer,
      isRunning: true,
      startTime: new Date().toISOString(),
    };

    // Update timer in cache/storage
    await this.updateActiveTimer(userId, resumedTimer);

    return resumedTimer;
  }

  // Report Generation
  async generateTimeReport(
    companyId: string,
    userId: string,
    data: CreateTimeReport
  ): Promise<TimeReport> {
    // Generate report data based on type and parameters
    let reportData: any = {};

    switch (data.reportType) {
      case 'Utilization':
        reportData = await this.generateUtilizationReport(
          companyId,
          data.parameters['startDate'],
          data.parameters['endDate'],
          data.parameters['employeeId']
        );
        break;
      case 'Project':
        reportData = await this.generateProjectTimeReport(
          data.parameters['projectId'],
          data.parameters['startDate'],
          data.parameters['endDate']
        );
        break;
      // Add more report types as needed
    }

    const [report] = await this.db.db
      .insert(timeReports)
      .values({
        ...data,
        generatedBy: userId,
        companyId,
        reportData,
      })
      .returning();

    return this.transformTimeReport(report);
  }

  async getTimeReports(companyId: string): Promise<TimeReport[]> {
    const reports = await this.db.db
      .select()
      .from(timeReports)
      .where(eq(timeReports.companyId, companyId))
      .orderBy(desc(timeReports.createdAt));

    return reports.map(report => this.transformTimeReport(report));
  }

  // Timesheet Management
  async deleteTimesheet(id: string, companyId: string): Promise<void> {
    // Check if timesheet has entries
    const entries = await this.getTimesheetEntries(id);
    if (entries.length > 0) {
      throw new BadRequestException(
        'Cannot delete timesheet with time entries. Delete entries first.'
      );
    }

    await this.db.db
      .delete(timesheets)
      .where(and(eq(timesheets.id, id), eq(timesheets.companyId, companyId)));
  }
}

