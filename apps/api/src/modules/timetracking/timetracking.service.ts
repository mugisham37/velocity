import {
  timeApprovals,
  timeCategories,
  timeEntries,
  timeReports,
  timeTrackingSettings,
  timesheets,
} from '@kiro/database';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateTimeEntry,
  CreateTimesheet,
  ProjectTimeReport,
  TimeEntry,
  Timesheet,
  UpdateTimeEntry,
  UpdateTimesheet,
  UtilizationReport,
} from '@packages/shared/types/timetracking';
import { and, asc, between, desc, eq, gte, lte, sql } from '@kiro/database';

@Injectable()
export class TimeTrackingService {
  // Timesheet Management
  async createTimesheet(
    companyId: string,
    data: CreateTimesheet
  ): Promise<Timesheet> {
    // Generate timesheet code
    const timesheetCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(timesheets)
      .where(eq(timesheets.companyId, companyId));

    const timesheetCode = `TS-${new Date().getFullYear()}-${String(timesheetCount[0].count + 1).padStart(4, '0')}`;

    const [timesheet] = await db
      .insert(timesheets)
      .values({
        ...data,
        timesheetCode,
        companyId,
        status: 'Draft',
        totalHours: 0,
        billableHours: 0,
        nonBillableHours: 0,
      })
      .returning();

    return timesheet as Timesheet;
  }

  async updateTimesheet(
    id: string,
    companyId: string,
    data: UpdateTimesheet
  ): Promise<Timesheet> {
    const [timesheet] = await db
      .update(timesheets)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(timesheets.id, id), eq(timesheets.companyId, companyId)))
      .returning();

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    return timesheet as Timesheet;
  }
  async getTimesheet(id: string, companyId: string): Promise<Timesheet> {
    const [timesheet] = await db
      .select()
      .from(timesheets)
      .where(and(eq(timesheets.id, id), eq(timesheets.companyId, companyId)));

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    return timesheet as Timesheet;
  }

  async getTimesheets(companyId: string, filters?: any): Promise<Timesheet[]> {
    let query = db
      .select()
      .from(timesheets)
      .where(eq(timesheets.companyId, companyId));

    if (filters?.employeeId) {
      query = query.where(eq(timesheets.employeeId, filters.employeeId));
    }

    if (filters?.status) {
      query = query.where(eq(timesheets.status, filters.status));
    }

    if (filters?.startDate && filters?.endDate) {
      query = query.where(
        and(
          gte(timesheets.startDate, filters.startDate),
          lte(timesheets.endDate, filters.endDate)
        )
      );
    }

    const result = await query.orderBy(desc(timesheets.createdAt));
    return result as Timesheet[];
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

    const [timesheet] = await db
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

    return timesheet as Timesheet;
  }

  // Time Entry Management
  async createTimeEntry(data: CreateTimeEntry): Promise<TimeEntry> {
    // Validate timesheet exists and is editable
    const timesheet = await db
      .select()
      .from(timesheets)
      .where(eq(timesheets.id, data.timesheetId))
      .limit(1);

    if (!timesheet.length) {
      throw new NotFoundException('Timesheet not found');
    }

    if (timesheet[0].status !== 'Draft') {
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

    const [entry] = await db
      .insert(timeEntries)
      .values(data)
      .returning();

    // Recalculate timesheet totals
    await this.recalculateTimesheetTotals(data.timesheetId);

    return entry as TimeEntry;
  }

  async updateTimeEntry(id: string, data: UpdateTimeEntry): Promise<TimeEntry> {
    const [entry] = await db
      .update(timeEntries)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(timeEntries.id, id))
      .returning();

    if (!entry) {
      throw new NotFoundException('Time entry not found');
    }

    // Recalculate timesheet totals
    await this.recalculateTimesheetTotals(entry.timesheetId);

    return entry as TimeEntry;
  }

  async deleteTimeEntry(id: string): Promise<void> {
    const [entry] = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.id, id));

    if (!entry) {
      throw new NotFoundException('Time entry not found');
    }

    await db.delete(timeEntries).where(eq(timeEntries.id, id));

    // Recalculate timesheet totals
    await this.recalculateTimesheetTotals(entry.timesheetId);
  }

  async getTimesheetEntries(timesheetId: string): Promise<TimeEntry[]> {
    const entries = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.timesheetId, timesheetId))
      .orderBy(asc(timeEntries.startTime));

    return entries as TimeEntry[];
  }

  // Time Tracking with Mobile Support
  async startTimer(
    userId: string,
    projectId?: string,
    taskId?: string,
    activityType?: string
  ): Promise<any> {
    // Check if user has active timer
    const activeTimer = await this.getActiveTimer(userId);
    if (activeTimer) {
      throw new BadRequestException(
        'Please stop the current timer before starting a new one'
      );
    }

    const timer = {
      id: crypto.randomUUID(),
      userId,
      projectId,
      taskId,
      activityType: activityType || 'General',
      startTime: new Date().toISOString(),
      isRunning: true,
      elapsedTime: 0,
    };

    // Store in cache/session (implementation depends on your caching strategy)
    // For now, we'll return the timer object
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

  async logTime(userId: string, timeLog: any): Promise<TimeEntry> {
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
    const timesheet = await db
      .select()
      .from(timesheets)
      .where(eq(timesheets.id, timesheetId))
      .limit(1);

    if (!timesheet.length) {
      throw new NotFoundException('Timesheet not found');
    }

    if (timesheet[0].status !== 'Submitted') {
      throw new BadRequestException(
        'Only submitted timesheets can be approved'
      );
    }

    // Create approval record
    await db.insert(timeApprovals).values({
      timesheetId,
      approverId,
      status: 'Approved',
      comments,
      approvedHours: timesheet[0].totalHours,
      approvalLevel: 1,
    });

    // Update timesheet status
    await db
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
    const timesheet = await db
      .select()
      .from(timesheets)
      .where(eq(timesheets.id, timesheetId))
      .limit(1);

    if (!timesheet.length) {
      throw new NotFoundException('Timesheet not found');
    }

    if (timesheet[0].status !== 'Submitted') {
      throw new BadRequestException(
        'Only submitted timesheets can be rejected'
      );
    }

    // Create approval record
    await db.insert(timeApprovals).values({
      timesheetId,
      approverId,
      status: 'Rejected',
      comments,
      rejectedHours: timesheet[0].totalHours,
      approvalLevel: 1,
    });

    // Update timesheet status
    await db
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
    let query = db
      .select({
        employeeId: timesheets.employeeId,
        totalHours: sql<number>`SUM(${timesheets.totalHours})`,
        billableHours: sql<number>`SUM(${timesheets.billableHours})`,
        nonBillableHours: sql<number>`SUM(${timesheets.nonBillableHours})`,
      })
      .from(timesheets)
      .where(
        and(
          eq(timesheets.companyId, companyId),
          eq(timesheets.status, 'Approved'),
          between(timesheets.startDate, startDate, endDate)
        )
      )
      .groupBy(timesheets.employeeId);

    if (employeeId) {
      query = query.where(eq(timesheets.employeeId, employeeId));
    }

    const results = await query;

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
    const projectEntries = await db
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
      (sum, entry) => sum + entry.time_entries.duration,
      0
    );
    const billableHours = projectEntries
      .filter(entry => entry.time_entries.isBillable)
      .reduce((sum, entry) => sum + entry.time_entries.duration, 0);

    const totalCost = projectEntries.reduce(
      (sum, entry) =>
        sum +
        entry.time_entries.duration * (entry.time_entries.hourlyRate || 0),
      0
    );

    const billableAmount = projectEntries
      .filter(entry => entry.time_entries.isBillable)
      .reduce(
        (sum, entry) =>
          sum +
          entry.time_entries.duration * (entry.time_entries.hourlyRate || 0),
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
  private async getCurrentTimesheet(userId: string): Promise<Timesheet> {
    const currentWeekStart = this.getCurrentWeekStart();
    const currentWeekEnd = this.getCurrentWeekEnd();

    let [timesheet] = await db
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

    return timesheet as Timesheet;
  }

  private async recalculateTimesheetTotals(timesheetId: string): Promise<void> {
    const entries = await this.getTimesheetEntries(timesheetId);

    const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0);
    const billableHours = entries
      .filter(entry => entry.isBillable)
      .reduce((sum, entry) => sum + entry.duration, 0);
    const nonBillableHours = totalHours - billableHours;

    await db
      .update(timesheets)
      .set({
        totalHours,
        billableHours,
        nonBillableHours,
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

    const dayEntries = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.timesheetId, timesheetId),
          between(
            timeEntries.startTime,
            dayStart.toISOString(),
            dayEnd.toISOString()
          )
        )
      );

    const currentDayHours = dayEntries.reduce(
      (sum, entry) => sum + entry.duration,
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
    return weekStart.toISOString().split('T')[0];
  }

  private getCurrentWeekEnd(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + 6;
    const weekEnd = new Date(now.setDate(diff));
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd.toISOString().split('T')[0];
  }

  private async getActiveTimer(userId: string): Promise<any> {
    // Implementation depends on your caching strategy
    // This could be stored in Redis, database, or memory
    return null; // Placeholder
  }

  private async clearActiveTimer(userId: string): Promise<void> {
    // Implementation depends on your caching strategy
    // Clear the active timer for the user
  }

  // Additional methods for complete time tracking implementation

  // Time Entry Management
  async getTimeEntries(filters?: any): Promise<TimeEntry[]> {
    let query = db.select().from(timeEntries);

    if (filters?.timesheetId) {
      query = query.where(eq(timeEntries.timesheetId, filters.timesheetId));
    }

    if (filters?.projectId) {
      query = query.where(eq(timeEntries.projectId, filters.projectId));
    }

    if (filters?.taskId) {
      query = query.where(eq(timeEntries.taskId, filters.taskId));
    }

    if (filters?.isBillable !== undefined) {
      query = query.where(eq(timeEntries.isBillable, filters.isBillable));
    }

    if (filters?.startDate && filters?.endDate) {
      query = query.where(
        between(timeEntries.startTime, filters.startDate, filters.endDate)
      );
    }

    const result = await query.orderBy(desc(timeEntries.startTime));
    return result as TimeEntry[];
  }

  async getTimeEntry(id: string): Promise<TimeEntry> {
    const [entry] = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.id, id));

    if (!entry) {
      throw new NotFoundException('Time entry not found');
    }

    return entry as TimeEntry;
  }

  // Time Category Management
  async createTimeCategory(
    companyId: string,
    data: CreateTimeCategory
  ): Promise<TimeCategory> {
    const [category] = await db
      .insert(timeCategories)
      .values({
        ...data,
        companyId,
      })
      .returning();

    return category as TimeCategory;
  }

  async updateTimeCategory(
    id: string,
    data: UpdateTimeCategory
  ): Promise<TimeCategory> {
    const [category] = await db
      .update(timeCategories)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(timeCategories.id, id))
      .returning();

    if (!category) {
      throw new NotFoundException('Time category not found');
    }

    return category as TimeCategory;
  }

  async getTimeCategory(id: string): Promise<TimeCategory> {
    const [category] = await db
      .select()
      .from(timeCategories)
      .where(eq(timeCategories.id, id));

    if (!category) {
      throw new NotFoundException('Time category not found');
    }

    return category as TimeCategory;
  }

  async getTimeCategories(companyId: string): Promise<TimeCategory[]> {
    const categories = await db
      .select()
      .from(timeCategories)
      .where(
        and(
          eq(timeCategories.companyId, companyId),
          eq(timeCategories.isActive, true)
        )
      )
      .orderBy(asc(timeCategories.categoryName));

    return categories as TimeCategory[];
  }

  async deleteTimeCategory(id: string): Promise<void> {
    // Soft delete by setting isActive to false
    const result = await db
      .update(timeCategories)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(timeCategories.id, id));

    if (result.rowCount === 0) {
      throw new NotFoundException('Time category not found');
    }
  }

  // Time Tracking Settings
  async getTimeTrackingSettings(
    companyId: string
  ): Promise<TimeTrackingSettings> {
    let [settings] = await db
      .select()
      .from(timeTrackingSettings)
      .where(eq(timeTrackingSettings.companyId, companyId));

    if (!settings) {
      // Create default settings
      [settings] = await db
        .insert(timeTrackingSettings)
        .values({
          companyId,
          requireProjectSelection: true,
          requireTaskSelection: false,
          allowManualTimeEntry: true,
          requireGpsTracking: false,
          maxDailyHours: 24,
          maxWeeklyHours: 168,
          timesheetPeriod: 'Weekly',
          autoSubmitTimesheets: false,
          requireApproval: true,
        })
        .returning();
    }

    return settings as TimeTrackingSettings;
  }

  async updateTimeTrackingSettings(
    companyId: string,
    data: UpdateTimeTrackingSettings
  ): Promise<TimeTrackingSettings> {
    const [settings] = await db
      .update(timeTrackingSettings)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(timeTrackingSettings.companyId, companyId))
      .returning();

    if (!settings) {
      throw new NotFoundException('Time tracking settings not found');
    }

    return settings as TimeTrackingSettings;
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

  // GPS and Mobile Integration
  async logTimeWithGPS(
    userId: string,
    timeLog: TimeLog & { gpsCoordinates?: any }
  ): Promise<TimeEntry> {
    // Validate GPS coordinates if required
    const settings = await this.getTimeTrackingSettings('default-company'); // TODO: Get actual company

    if (settings.requireGpsTracking && !timeLog.gpsCoordinates) {
      throw new BadRequestException(
        'GPS coordinates are required for time tracking'
      );
    }

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
      gpsCoordinates: timeLog.gpsCoordinates,
      isManualEntry: true,
    };

    return this.createTimeEntry(timeEntryData);
  }

  // Time Entry Validation
  async validateTimeEntry(data: CreateTimeEntry): Promise<void> {
    // Validate project and task selection requirements
    const settings = await this.getTimeTrackingSettings('default-company'); // TODO: Get actual company

    if (settings.requireProjectSelection && !data.projectId) {
      throw new BadRequestException('Project selection is required');
    }

    if (settings.requireTaskSelection && !data.taskId) {
      throw new BadRequestException('Task selection is required');
    }

    // Validate daily and weekly hour limits
    await this.validateHourLimits(data.timesheetId, data.duration);
  }

  private async validateHourLimits(
    timesheetId: string,
    additionalHours: number
  ): Promise<void> {
    const settings = await this.getTimeTrackingSettings('default-company'); // TODO: Get actual company
    const timesheet = await this.getTimesheet(timesheetId, 'default-company'); // TODO: Get actual company

    // Check daily limits
    const currentDayHours = await this.getDailyHours(timesheetId, new Date());
    if (currentDayHours + additionalHours > settings.maxDailyHours) {
      throw new BadRequestException(
        `Daily hour limit of ${settings.maxDailyHours} hours exceeded`
      );
    }

    // Check weekly limits
    const currentWeekHours = timesheet.totalHours;
    if (currentWeekHours + additionalHours > settings.maxWeeklyHours) {
      throw new BadRequestException(
        `Weekly hour limit of ${settings.maxWeeklyHours} hours exceeded`
      );
    }
  }

  private async getDailyHours(
    timesheetId: string,
    date: Date
  ): Promise<number> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayEntries = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.timesheetId, timesheetId),
          between(
            timeEntries.startTime,
            dayStart.toISOString(),
            dayEnd.toISOString()
          )
        )
      );

    return dayEntries.reduce((sum, entry) => sum + entry.duration, 0);
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
          data.parameters.startDate,
          data.parameters.endDate,
          data.parameters.employeeId
        );
        break;
      case 'Project':
        reportData = await this.generateProjectTimeReport(
          data.parameters.projectId,
          data.parameters.startDate,
          data.parameters.endDate
        );
        break;
      // Add more report types as needed
    }

    const [report] = await db
      .insert(timeReports)
      .values({
        ...data,
        generatedBy: userId,
        companyId,
        reportData,
      })
      .returning();

    return report as TimeReport;
  }

  async getTimeReports(companyId: string): Promise<TimeReport[]> {
    const reports = await db
      .select()
      .from(timeReports)
      .where(eq(timeReports.companyId, companyId))
      .orderBy(desc(timeReports.createdAt));

    return reports as TimeReport[];
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

    const result = await db
      .delete(timesheets)
      .where(and(eq(timesheets.id, id), eq(timesheets.companyId, companyId)));

    if (result.rowCount === 0) {
      throw new NotFoundException('Timesheet not found');
    }
  }

  // Helper methods for timer management
  private async updateActiveTimer(userId: string, timer: Timer): Promise<void> {
    // Implementation depends on your caching strategy
    // Store the updated timer for the user
  }

  // Integration with Payroll
  async getPayrollTimeData(
    companyId: string,
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<any> {
    const approvedTimesheets = await db
      .select()
      .from(timesheets)
      .where(
        and(
          eq(timesheets.companyId, companyId),
          eq(timesheets.employeeId, employeeId),
          eq(timesheets.status, 'Approved'),
          between(timesheets.startDate, startDate, endDate)
        )
      );

    const totalRegularHours = approvedTimesheets.reduce(
      (sum, ts) => sum + ts.totalHours,
      0
    );

    // Calculate overtime based on company rules
    const settings = await this.getTimeTrackingSettings(companyId);
    const overtimeRules = settings.overtimeRules as any;

    let overtimeHours = 0;
    if (overtimeRules?.enabled) {
      const weeklyLimit = overtimeRules.weeklyLimit || 40;
      overtimeHours = Math.max(0, totalRegularHours - weeklyLimit);
    }

    return {
      employeeId,
      period: { startDate, endDate },
      regularHours: totalRegularHours - overtimeHours,
      overtimeHours,
      totalHours: totalRegularHours,
      timesheets: approvedTimesheets.map(ts => ({
        id: ts.id,
        timesheetCode: ts.timesheetCode,
        totalHours: ts.totalHours,
        billableHours: ts.billableHours,
      })),
    };
  }
}
