import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation } from '@nestjs/graphql';
import {
  CreateTimeCategory,
  CreateTimeEntry,
  CreateTimeReport,
  CreateTimesheet,
  ProjectTimeReport,
  TimeCategory,
  TimeEntry,
  TimeLog,
  TimeReport,
  TimeTrackingSettings,
  Timer,
  Timesheet,
  UpdateTimeCategory,
  UpdateTimeEntry,
  UpdateTimeTrackingSettings,
  UpdateTimesheet,
  UtilizationReport,
} from '@packages/shared/types/timetracking';
import { TimeTrackingService } from './timetracking.service';

@Resolver('Timesheet')
@UseGuards(JwtAuthGuard)
export class TimeTrackingResolver {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  // Timesheet Queries
  @Query('timesheets')
  async getTimesheets(
    @Args('filter') filter: any,
    @Context() context: any
  ): Promise<Timesheet[]> {
    const { user } = context.req;
    return this.timeTrackingService.getTimesheets(user.companyId, filter);
  }

  @Query('timesheet')
  async getTimesheet(
    @Args('id') id: string,
    @Context() context: any
  ): Promise<Timesheet> {
    const { user } = context.req;
    return this.timeTrackingService.getTimesheet(id, user.companyId);
  }

  @Query('currentTimesheet')
  async getCurrentTimesheet(@Context() context: any): Promise<Timesheet> {
    const { user } = context.req;
    return this.timeTrackingService.getCurrentTimesheet(user.id);
  }

  // Time Entry Queries
  @Query('timeEntries')
  async getTimeEntries(@Args('filter') filter: any): Promise<TimeEntry[]> {
    return this.timeTrackingService.getTimeEntries(filter);
  }

  @Query('timeEntry')
  async getTimeEntry(@Args('id') id: string): Promise<TimeEntry> {
    return this.timeTrackingService.getTimeEntry(id);
  }

  @Query('timesheetEntries')
  async getTimesheetEntries(
    @Args('timesheetId') timesheetId: string
  ): Promise<TimeEntry[]> {
    return this.timeTrackingService.getTimesheetEntries(timesheetId);
  }

  // Time Category Queries
  @Query('timeCategories')
  async getTimeCategories(@Context() context: any): Promise<TimeCategory[]> {
    const { user } = context.req;
    return this.timeTrackingService.getTimeCategories(user.companyId);
  }

  @Query('timeCategory')
  async getTimeCategory(@Args('id') id: string): Promise<TimeCategory> {
    return this.timeTrackingService.getTimeCategory(id);
  }

  // Settings Query
  @Query('timeTrackingSettings')
  async getTimeTrackingSettings(
    @Context() context: any
  ): Promise<TimeTrackingSettings> {
    const { user } = context.req;
    return this.timeTrackingService.getTimeTrackingSettings(user.companyId);
  }

  // Timer Query
  @Query('activeTimer')
  async getActiveTimer(@Context() context: any): Promise<Timer | null> {
    const { user } = context.req;
    return this.timeTrackingService.getActiveTimer(user.id);
  }

  // Reporting Queries
  @Query('utilizationReport')
  async getUtilizationReport(
    @Args('input') input: any,
    @Context() context: any
  ): Promise<UtilizationReport[]> {
    const { user } = context.req;
    return this.timeTrackingService.generateUtilizationReport(
      user.companyId,
      input.startDate,
      input.endDate,
      input.employeeId
    );
  }

  @Query('projectTimeReport')
  async getProjectTimeReport(
    @Args('input') input: any
  ): Promise<ProjectTimeReport> {
    return this.timeTrackingService.generateProjectTimeReport(
      input.projectId,
      input.startDate,
      input.endDate
    );
  }

  @Query('timeReports')
  async getTimeReports(@Context() context: any): Promise<TimeReport[]> {
    const { user } = context.req;
    return this.timeTrackingService.getTimeReports(user.companyId);
  }

  // Timesheet Mutations
  @Mutation('createTimesheet')
  async createTimesheet(
    @Args('input') input: CreateTimesheet,
    @Context() context: any
  ): Promise<Timesheet> {
    const { user } = context.req;
    return this.timeTrackingService.createTimesheet(user.companyId, input);
  }

  @Mutation('updateTimesheet')
  async updateTimesheet(
    @Args('id') id: string,
    @Args('input') input: UpdateTimesheet,
    @Context() context: any
  ): Promise<Timesheet> {
    const { user } = context.req;
    return this.timeTrackingService.updateTimesheet(id, user.companyId, input);
  }

  @Mutation('submitTimesheet')
  async submitTimesheet(
    @Args('id') id: string,
    @Context() context: any
  ): Promise<Timesheet> {
    const { user } = context.req;
    return this.timeTrackingService.submitTimesheet(id, user.companyId);
  }

  @Mutation('deleteTimesheet')
  async deleteTimesheet(
    @Args('id') id: string,
    @Context() context: any
  ): Promise<boolean> {
    const { user } = context.req;
    await this.timeTrackingService.deleteTimesheet(id, user.companyId);
    return true;
  }

  // Time Entry Mutations
  @Mutation('createTimeEntry')
  async createTimeEntry(
    @Args('input') input: CreateTimeEntry
  ): Promise<TimeEntry> {
    return this.timeTrackingService.createTimeEntry(input);
  }

  @Mutation('updateTimeEntry')
  async updateTimeEntry(
    @Args('id') id: string,
    @Args('input') input: UpdateTimeEntry
  ): Promise<TimeEntry> {
    return this.timeTrackingService.updateTimeEntry(id, input);
  }

  @Mutation('deleteTimeEntry')
  async deleteTimeEntry(@Args('id') id: string): Promise<boolean> {
    await this.timeTrackingService.deleteTimeEntry(id);
    return true;
  }

  // Time Category Mutations
  @Mutation('createTimeCategory')
  async createTimeCategory(
    @Args('input') input: CreateTimeCategory,
    @Context() context: any
  ): Promise<TimeCategory> {
    const { user } = context.req;
    return this.timeTrackingService.createTimeCategory(user.companyId, input);
  }

  @Mutation('updateTimeCategory')
  async updateTimeCategory(
    @Args('id') id: string,
    @Args('input') input: UpdateTimeCategory
  ): Promise<TimeCategory> {
    return this.timeTrackingService.updateTimeCategory(id, input);
  }

  @Mutation('deleteTimeCategory')
  async deleteTimeCategory(@Args('id') id: string): Promise<boolean> {
    await this.timeTrackingService.deleteTimeCategory(id);
    return true;
  }

  // Timer Mutations
  @Mutation('startTimer')
  async startTimer(
    @Args('projectId') projectId: string,
    @Args('taskId') taskId: string,
    @Args('activityType') activityType: string,
    @Context() context: any
  ): Promise<Timer> {
    const { user } = context.req;
    return this.timeTrackingService.startTimer(
      user.id,
      projectId,
      taskId,
      activityType
    );
  }

  @Mutation('stopTimer')
  async stopTimer(
    @Args('description') description: string,
    @Context() context: any
  ): Promise<TimeEntry | null> {
    const { user } = context.req;
    return this.timeTrackingService.stopTimer(user.id, description);
  }

  @Mutation('pauseTimer')
  async pauseTimer(@Context() context: any): Promise<Timer> {
    const { user } = context.req;
    return this.timeTrackingService.pauseTimer(user.id);
  }

  @Mutation('resumeTimer')
  async resumeTimer(@Context() context: any): Promise<Timer> {
    const { user } = context.req;
    return this.timeTrackingService.resumeTimer(user.id);
  }

  // Manual Time Logging
  @Mutation('logTime')
  async logTime(
    @Args('input') input: TimeLog,
    @Context() context: any
  ): Promise<TimeEntry> {
    const { user } = context.req;
    return this.timeTrackingService.logTime(user.id, input);
  }

  // Approval Mutations
  @Mutation('approveTimesheet')
  async approveTimesheet(
    @Args('timesheetId') timesheetId: string,
    @Args('comments') comments: string,
    @Context() context: any
  ): Promise<boolean> {
    const { user } = context.req;
    await this.timeTrackingService.approveTimesheet(
      timesheetId,
      user.id,
      comments
    );
    return true;
  }

  @Mutation('rejectTimesheet')
  async rejectTimesheet(
    @Args('timesheetId') timesheetId: string,
    @Args('comments') comments: string,
    @Context() context: any
  ): Promise<boolean> {
    const { user } = context.req;
    await this.timeTrackingService.rejectTimesheet(
      timesheetId,
      user.id,
      comments
    );
    return true;
  }

  // Settings Mutations
  @Mutation('updateTimeTrackingSettings')
  async updateTimeTrackingSettings(
    @Args('input') input: UpdateTimeTrackingSettings,
    @Context() context: any
  ): Promise<TimeTrackingSettings> {
    const { user } = context.req;
    return this.timeTrackingService.updateTimeTrackingSettings(
      user.companyId,
      input
    );
  }

  // Report Generation
  @Mutation('generateTimeReport')
  async generateTimeReport(
    @Args('input') input: CreateTimeReport,
    @Context() context: any
  ): Promise<TimeReport> {
    const { user } = context.req;
    return this.timeTrackingService.generateTimeReport(
      user.companyId,
      user.id,
      input
    );
  }
}
