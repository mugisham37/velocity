import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CreateTimeCategory,
  CreateTimeEntry,
  CreateTimesheet,
  UpdateTimeEntry,
  UpdateTimesheet,
} from '@packages/shared/types/timetracking';
import { vi } from 'vitest';
import { TimeTrackingService } from './timetracking.service';

// Mock the database
vi.mock('@kiro/database', () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    limit: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    between: vi.fn().mockReturnThis(),
  },
  timesheets: {},
  timeEntries: {},
  timeCategories: {},
  timeApprovals: {},
  timeTrackingSettings: {},
  timeReports: {},
}));

describe('TimeTrackingService', () => {
  let service: TimeTrackingService;
  let mockDb: any;

  const mockTimesheet = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    timesheetCode: 'TS-2024-0001',
    employeeId: '550e8400-e29b-41d4-a716-446655440002',
    startDate: '2024-01-01',
    endDate: '2024-01-07',
    status: 'Draft',
    totalHours: 0,
    billableHours: 0,
    nonBillableHours: 0,
    companyId: '550e8400-e29b-41d4-a716-446655440003',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockTimeEntry = {
    id: '550e8400-e29b-41d4-a716-446655440004',
    timesheetId: mockTimesheet.id,
    activityType: 'Development',
    description: 'Working on features',
    startTime: '2024-01-01T09:00:00Z',
    endTime: '2024-01-01T17:00:00Z',
    duration: 8.0,
    isBillable: true,
    isManualEntry: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockTimeCategory = {
    id: '550e8400-e29b-41d4-a716-446655440005',
    categoryName: 'Development',
    categoryCode: 'DEV',
    isBillable: true,
    defaultHourlyRate: 75.0,
    companyId: '550e8400-e29b-41d4-a716-446655440003',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimeTrackingService],
    }).compile();

    service = module.get<TimeTrackingService>(TimeTrackingService);

    // Get the mocked db
    const { db } = await import('@kiro/database');
    mockDb = db;

    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('Timesheet Management', () => {
    it('should create a timesheet', async () => {
      const createData: CreateTimesheet = {
        employeeId: mockTimesheet.employeeId,
        startDate: mockTimesheet.startDate,
        endDate: mockTimesheet.endDate,
      };

      // Mock the count query
      mockDb.returning.mockResolvedValueOnce([{ count: 0 }]);
      // Mock the insert query
      mockDb.returning.mockResolvedValueOnce([mockTimesheet]);

      const result = await service.createTimesheet('company-id', createData);

      expect(result).toEqual(mockTimesheet);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createData,
          companyId: 'company-id',
          status: 'Draft',
          totalHours: 0,
          billableHours: 0,
          nonBillableHours: 0,
        })
      );
    });

    it('should update a timesheet', async () => {
      const updateData: UpdateTimesheet = {
        notes: 'Updated notes',
        status: 'Submitted',
      };

      mockDb.returning.mockResolvedValueOnce([
        { ...mockTimesheet, ...updateData },
      ]);

      const result = await service.updateTimesheet(
        mockTimesheet.id,
        'company-id',
        updateData
      );

      expect(result).toEqual({ ...mockTimesheet, ...updateData });
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining(updateData)
      );
    });

    it('should throw NotFoundException when updating non-existent timesheet', async () => {
      mockDb.returning.mockResolvedValueOnce([]);

      await expect(
        service.updateTimesheet('non-existent-id', 'company-id', {})
      ).rejects.toThrow(NotFoundException);
    });

    it('should get a timesheet by id', async () => {
      mockDb.returning.mockResolvedValueOnce([mockTimesheet]);

      const result = await service.getTimesheet(mockTimesheet.id, 'company-id');

      expect(result).toEqual(mockTimesheet);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should throw NotFoundException when timesheet not found', async () => {
      mockDb.returning.mockResolvedValueOnce([]);

      await expect(
        service.getTimesheet('non-existent-id', 'company-id')
      ).rejects.toThrow(NotFoundException);
    });

    it('should get timesheets with filters', async () => {
      const timesheets = [mockTimesheet];
      mockDb.returning.mockResolvedValueOnce(timesheets);

      const result = await service.getTimesheets('company-id', {
        status: 'Draft',
        employeeId: mockTimesheet.employeeId,
      });

      expect(result).toEqual(timesheets);
      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('Time Entry Management', () => {
    it('should create a time entry', async () => {
      const createData: CreateTimeEntry = {
        timesheetId: mockTimeEntry.timesheetId,
        activityType: mockTimeEntry.activityType,
        description: mockTimeEntry.description,
        startTime: mockTimeEntry.startTime,
        endTime: mockTimeEntry.endTime,
        duration: mockTimeEntry.duration,
        isBillable: mockTimeEntry.isBillable,
        isManualEntry: mockTimeEntry.isManualEntry,
      };

      // Mock timesheet exists check
      mockDb.returning.mockResolvedValueOnce([mockTimesheet]);
      // Mock daily hours validation
      mockDb.returning.mockResolvedValueOnce([]);
      // Mock time entry creation
      mockDb.returning.mockResolvedValueOnce([mockTimeEntry]);
      // Mock timesheet entries for recalculation
      mockDb.returning.mockResolvedValueOnce([mockTimeEntry]);
      // Mock timesheet update
      mockDb.returning.mockResolvedValueOnce([mockTimesheet]);

      const result = await service.createTimeEntry(createData);

      expect(result).toEqual(mockTimeEntry);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should throw NotFoundException when timesheet not found for time entry', async () => {
      const createData: CreateTimeEntry = {
        timesheetId: 'non-existent-timesheet',
        activityType: 'Development',
        startTime: '2024-01-01T09:00:00Z',
        duration: 8.0,
        isBillable: true,
        isManualEntry: false,
      };

      mockDb.returning.mockResolvedValueOnce([]);

      await expect(service.createTimeEntry(createData)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException when adding entry to submitted timesheet', async () => {
      const createData: CreateTimeEntry = {
        timesheetId: mockTimeEntry.timesheetId,
        activityType: 'Development',
        startTime: '2024-01-01T09:00:00Z',
        duration: 8.0,
        isBillable: true,
        isManualEntry: false,
      };

      const submittedTimesheet = { ...mockTimesheet, status: 'Submitted' };
      mockDb.returning.mockResolvedValueOnce([submittedTimesheet]);

      await expect(service.createTimeEntry(createData)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should update a time entry', async () => {
      const updateData: UpdateTimeEntry = {
        description: 'Updated description',
        duration: 9.0,
      };

      mockDb.returning.mockResolvedValueOnce([
        { ...mockTimeEntry, ...updateData },
      ]);
      // Mock timesheet entries for recalculation
      mockDb.returning.mockResolvedValueOnce([mockTimeEntry]);
      // Mock timesheet update
      mockDb.returning.mockResolvedValueOnce([mockTimesheet]);

      const result = await service.updateTimeEntry(
        mockTimeEntry.id,
        updateData
      );

      expect(result).toEqual({ ...mockTimeEntry, ...updateData });
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should delete a time entry', async () => {
      mockDb.returning.mockResolvedValueOnce([mockTimeEntry]);
      mockDb.returning.mockResolvedValueOnce({ rowCount: 1 });
      // Mock timesheet entries for recalculation
      mockDb.returning.mockResolvedValueOnce([]);
      // Mock timesheet update
      mockDb.returning.mockResolvedValueOnce([mockTimesheet]);

      await service.deleteTimeEntry(mockTimeEntry.id);

      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe('Time Category Management', () => {
    it('should create a time category', async () => {
      const createData: CreateTimeCategory = {
        categoryName: mockTimeCategory.categoryName,
        categoryCode: mockTimeCategory.categoryCode,
        isBillable: mockTimeCategory.isBillable,
        defaultHourlyRate: mockTimeCategory.defaultHourlyRate,
      };

      mockDb.returning.mockResolvedValueOnce([mockTimeCategory]);

      const result = await service.createTimeCategory('company-id', createData);

      expect(result).toEqual(mockTimeCategory);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should get time categories for a company', async () => {
      const categories = [mockTimeCategory];
      mockDb.returning.mockResolvedValueOnce(categories);

      const result = await service.getTimeCategories('company-id');

      expect(result).toEqual(categories);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should soft delete a time category', async () => {
      mockDb.returning.mockResolvedValueOnce({ rowCount: 1 });

      await service.deleteTimeCategory(mockTimeCategory.id);

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
        })
      );
    });
  });

  describe('Timer Management', () => {
    it('should start a timer', async () => {
      // Mock no active timer
      vi.spyOn(service, 'getActiveTimer').mockResolvedValueOnce(null);

      const result = await service.startTimer(
        'user-id',
        'project-id',
        'task-id',
        'Development'
      );

      expect(result).toMatchObject({
        userId: 'user-id',
        projectId: 'project-id',
        taskId: 'task-id',
        activityType: 'Development',
        isRunning: true,
        elapsedTime: 0,
      });
    });

    it('should throw BadRequestException when starting timer with active timer', async () => {
      const activeTimer = {
        id: 'timer-id',
        userId: 'user-id',
        activityType: 'Development',
        startTime: new Date().toISOString(),
        isRunning: true,
        elapsedTime: 0,
      };

      vi.spyOn(service, 'getActiveTimer').mockResolvedValueOnce(activeTimer);

      await expect(
        service.startTimer('user-id', undefined, undefined, 'Development')
      ).rejects.toThrow(BadRequestException);
    });

    it('should stop timer and create time entry', async () => {
      const activeTimer = {
        id: 'timer-id',
        userId: 'user-id',
        projectId: 'project-id',
        taskId: 'task-id',
        activityType: 'Development',
        startTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        isRunning: true,
        elapsedTime: 0,
      };

      vi.spyOn(service, 'getActiveTimer').mockResolvedValueOnce(activeTimer);
      jest
        .spyOn(service, 'getCurrentTimesheet')
        .mockResolvedValueOnce(mockTimesheet);
      jest
        .spyOn(service, 'createTimeEntry')
        .mockResolvedValueOnce(mockTimeEntry);
      vi.spyOn(service, 'clearActiveTimer').mockResolvedValueOnce(undefined);

      const result = await service.stopTimer(
        'user-id',
        'Completed development task'
      );

      expect(result).toEqual(mockTimeEntry);
      expect(service.createTimeEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: activeTimer.projectId,
          taskId: activeTimer.taskId,
          activityType: activeTimer.activityType,
          description: 'Completed development task',
        })
      );
    });
  });

  describe('Approval Workflow', () => {
    it('should approve a timesheet', async () => {
      const submittedTimesheet = { ...mockTimesheet, status: 'Submitted' };
      mockDb.returning.mockResolvedValueOnce([submittedTimesheet]);
      mockDb.returning.mockResolvedValueOnce([]);
      mockDb.returning.mockResolvedValueOnce([]);

      await service.approveTimesheet(
        mockTimesheet.id,
        'approver-id',
        'Looks good'
      );

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should reject a timesheet', async () => {
      const submittedTimesheet = { ...mockTimesheet, status: 'Submitted' };
      mockDb.returning.mockResolvedValueOnce([submittedTimesheet]);
      mockDb.returning.mockResolvedValueOnce([]);
      mockDb.returning.mockResolvedValueOnce([]);

      await service.rejectTimesheet(
        mockTimesheet.id,
        'approver-id',
        'Needs more details'
      );

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException when approving non-submitted timesheet', async () => {
      mockDb.returning.mockResolvedValueOnce([mockTimesheet]); // Draft status

      await expect(
        service.approveTimesheet(mockTimesheet.id, 'approver-id', 'Approved')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Validation', () => {
    it('should validate daily hours limit', async () => {
      const createData: CreateTimeEntry = {
        timesheetId: mockTimeEntry.timesheetId,
        activityType: 'Development',
        startTime: '2024-01-01T09:00:00Z',
        duration: 25.0, // Exceeds 24 hours
        isBillable: true,
        isManualEntry: false,
      };

      // Mock timesheet exists
      mockDb.returning.mockResolvedValueOnce([mockTimesheet]);
      // Mock existing entries for the day (returning 1 hour already logged)
      mockDb.returning.mockResolvedValueOnce([
        { ...mockTimeEntry, duration: 1.0 },
      ]);

      await expect(service.createTimeEntry(createData)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('Reporting', () => {
    it('should generate utilization report', async () => {
      const reportData = [
        {
          employeeId: 'employee-1',
          totalHours: 40,
          billableHours: 35,
          nonBillableHours: 5,
        },
      ];

      mockDb.returning.mockResolvedValueOnce(reportData);

      const result = await service.generateUtilizationReport(
        'company-id',
        '2024-01-01',
        '2024-01-31'
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        employeeId: 'employee-1',
        totalHours: 40,
        billableHours: 35,
        nonBillableHours: 5,
        utilizationRate: 87.5, // 35/40 * 100
      });
    });

    it('should generate project time report', async () => {
      const projectEntries = [
        {
          time_entries: {
            duration: 8.0,
            isBillable: true,
            hourlyRate: 75.0,
          },
        },
        {
          time_entries: {
            duration: 4.0,
            isBillable: false,
            hourlyRate: 75.0,
          },
        },
      ];

      mockDb.returning.mockResolvedValueOnce(projectEntries);

      const result = await service.generateProjectTimeReport(
        'project-id',
        '2024-01-01',
        '2024-01-31'
      );

      expect(result).toMatchObject({
        projectId: 'project-id',
        totalHours: 12.0,
        billableHours: 8.0,
        totalCost: 900.0, // (8 + 4) * 75
        billableAmount: 600.0, // 8 * 75
      });
    });
  });
});
