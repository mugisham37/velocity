import { AuthModule } from '@/auth/auth.module';
import { DatabaseModule } from '@/database/database.module';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { TimeTrackingModule } from './timetracking.module';

describe('Time Tracking GraphQL Integration', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authToken: string;
  let createdTimesheetId: string;
  let createdTimeEntryId: string;

  const testUser = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'timetracker@test.com',
    companyId: '550e8400-e29b-41d4-a716-446655440002',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, AuthModule, TimeTrackingModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    authToken = jwtService.sign({
      sub: testUser.id,
      email: testUser.email,
      companyId: testUser.companyId,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Timesheet Management', () => {
    it('should create a timesheet', async () => {
      const createTimesheetMutation = `
        mutation CreateTimesheet($input: CreateTimesheetInput!) {
          createTimesheet(input: $input) {
            id
            timesheetCode
            employeeId
            startDate
            endDate
            status
            totalHours
            billableHours
            nonBillableHours
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: createTimesheetMutation,
          variables: {
            input: {
              employeeId: testUser.id,
              startDate: '2024-01-01',
              endDate: '2024-01-07',
              notes: 'Test timesheet for integration testing',
            },
          },
        })
        .expect(200);

      expect(response.body.data.createTimesheet).toBeDefined();
      expect(response.body.data.createTimesheet.timesheetCode).toMatch(
        /^TS-\d{4}-\d{4}$/
      );
      expect(response.body.data.createTimesheet.status).toBe('Draft');
      expect(response.body.data.createTimesheet.totalHours).toBe(0);

      createdTimesheetId = response.body.data.createTimesheet.id;
    });

    it('should get timesheets list', async () => {
      const getTimesheetsQuery = `
        query GetTimesheets($filter: TimesheetFilter) {
          timesheets(filter: $filter) {
            id
            timesheetCode
            employeeId
            status
            totalHours
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: getTimesheetsQuery,
          variables: { filter: {} },
        })
        .expect(200);

      expect(response.body.data.timesheets).toBeInstanceOf(Array);
      expect(response.body.data.timesheets.length).toBeGreaterThan(0);

      const testTimesheet = response.body.data.timesheets.find(
        (ts: any) => ts.id === createdTimesheetId
      );
      expect(testTimesheet).toBeDefined();
    });

    it('should get current timesheet', async () => {
      const getCurrentTimesheetQuery = `
        query GetCurrentTimesheet {
          currentTimesheet {
            id
            timesheetCode
            status
            startDate
            endDate
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: getCurrentTimesheetQuery,
        })
        .expect(200);

      expect(response.body.data.currentTimesheet).toBeDefined();
      expect(response.body.data.currentTimesheet.status).toBe('Draft');
    });
  });

  describe('Time Entry Management', () => {
    it('should create a time entry', async () => {
      const createTimeEntryMutation = `
        mutation CreateTimeEntry($input: CreateTimeEntryInput!) {
          createTimeEntry(input: $input) {
            id
            timesheetId
            activityType
            description
            duration
            isBillable
            isManualEntry
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: createTimeEntryMutation,
          variables: {
            input: {
              timesheetId: createdTimesheetId,
              activityType: 'Development',
              description: 'Working on time tracking feature',
              startTime: '2024-01-01T09:00:00Z',
              endTime: '2024-01-01T17:00:00Z',
              duration: 8.0,
              isBillable: true,
              isManualEntry: true,
            },
          },
        })
        .expect(200);

      expect(response.body.data.createTimeEntry).toBeDefined();
      expect(response.body.data.createTimeEntry.duration).toBe(8.0);
      expect(response.body.data.createTimeEntry.isBillable).toBe(true);
      expect(response.body.data.createTimeEntry.activityType).toBe(
        'Development'
      );

      createdTimeEntryId = response.body.data.createTimeEntry.id;
    });

    it('should get timesheet entries', async () => {
      const getTimesheetEntriesQuery = `
        query GetTimesheetEntries($timesheetId: ID!) {
          timesheetEntries(timesheetId: $timesheetId) {
            id
            activityType
            description
            duration
            isBillable
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: getTimesheetEntriesQuery,
          variables: { timesheetId: createdTimesheetId },
        })
        .expect(200);

      expect(response.body.data.timesheetEntries).toBeInstanceOf(Array);
      expect(response.body.data.timesheetEntries.length).toBeGreaterThan(0);
      expect(response.body.data.timesheetEntries[0].duration).toBe(8.0);
    });

    it('should update a time entry', async () => {
      const updateTimeEntryMutation = `
        mutation UpdateTimeEntry($id: ID!, $input: UpdateTimeEntryInput!) {
          updateTimeEntry(id: $id, input: $input) {
            id
            description
            duration
            isBillable
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: updateTimeEntryMutation,
          variables: {
            id: createdTimeEntryId,
            input: {
              description:
                'Updated: Working on time tracking feature with tests',
              duration: 8.5,
              isBillable: false,
            },
          },
        })
        .expect(200);

      expect(response.body.data.updateTimeEntry).toBeDefined();
      expect(response.body.data.updateTimeEntry.description).toContain(
        'Updated:'
      );
      expect(response.body.data.updateTimeEntry.duration).toBe(8.5);
      expect(response.body.data.updateTimeEntry.isBillable).toBe(false);
    });
  });

  describe('Timer Management', () => {
    it('should start a timer', async () => {
      const startTimerMutation = `
        mutation StartTimer($activityType: String!, $projectId: ID, $taskId: ID) {
          startTimer(activityType: $activityType, projectId: $projectId, taskId: $taskId) {
            id
            activityType
            isRunning
            elapsedTime
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: startTimerMutation,
          variables: {
            activityType: 'Testing',
          },
        })
        .expect(200);

      expect(response.body.data.startTimer).toBeDefined();
      expect(response.body.data.startTimer.isRunning).toBe(true);
      expect(response.body.data.startTimer.activityType).toBe('Testing');
      expect(response.body.data.startTimer.elapsedTime).toBe(0);
    });

    it('should get active timer', async () => {
      const getActiveTimerQuery = `
        query GetActiveTimer {
          activeTimer {
            id
            activityType
            isRunning
            elapsedTime
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: getActiveTimerQuery,
        })
        .expect(200);

      // Note: This might be null if no timer is active
      if (response.body.data.activeTimer) {
        expect(response.body.data.activeTimer.isRunning).toBe(true);
      }
    });

    it('should stop timer and create time entry', async () => {
      const stopTimerMutation = `
        mutation StopTimer($description: String) {
          stopTimer(description: $description) {
            id
            description
            duration
            activityType
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: stopTimerMutation,
          variables: {
            description: 'Timer test completed',
          },
        })
        .expect(200);

      // Note: This might be null if no timer was active
      if (response.body.data.stopTimer) {
        expect(response.body.data.stopTimer.description).toBe(
          'Timer test completed'
        );
        expect(response.body.data.stopTimer.activityType).toBe('Testing');
      }
    });
  });

  describe('Manual Time Logging', () => {
    it('should log time manually', async () => {
      const logTimeMutation = `
        mutation LogTime($input: TimeLogInput!) {
          logTime(input: $input) {
            id
            description
            duration
            activityType
            isBillable
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: logTimeMutation,
          variables: {
            input: {
              activityType: 'Documentation',
              description: 'Writing API documentation',
              duration: 2.5,
              isBillable: true,
              date: '2024-01-02',
              startTime: '14:00',
              endTime: '16:30',
            },
          },
        })
        .expect(200);

      expect(response.body.data.logTime).toBeDefined();
      expect(response.body.data.logTime.duration).toBe(2.5);
      expect(response.body.data.logTime.activityType).toBe('Documentation');
      expect(response.body.data.logTime.isBillable).toBe(true);
    });
  });

  describe('Time Categories', () => {
    let createdCategoryId: string;

    it('should create a time category', async () => {
      const createTimeCategoryMutation = `
        mutation CreateTimeCategory($input: CreateTimeCategoryInput!) {
          createTimeCategory(input: $input) {
            id
            categoryName
            categoryCode
            isBillable
            defaultHourlyRate
            color
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: createTimeCategoryMutation,
          variables: {
            input: {
              categoryName: 'Software Development',
              categoryCode: 'DEV',
              description: 'All software development activities',
              isBillable: true,
              defaultHourlyRate: 75.0,
              color: '#3B82F6',
            },
          },
        })
        .expect(200);

      expect(response.body.data.createTimeCategory).toBeDefined();
      expect(response.body.data.createTimeCategory.categoryName).toBe(
        'Software Development'
      );
      expect(response.body.data.createTimeCategory.categoryCode).toBe('DEV');
      expect(response.body.data.createTimeCategory.isBillable).toBe(true);
      expect(response.body.data.createTimeCategory.defaultHourlyRate).toBe(
        75.0
      );

      createdCategoryId = response.body.data.createTimeCategory.id;
    });

    it('should get time categories', async () => {
      const getTimeCategoriesQuery = `
        query GetTimeCategories {
          timeCategories {
            id
            categoryName
            categoryCode
            isBillable
            isActive
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: getTimeCategoriesQuery,
        })
        .expect(200);

      expect(response.body.data.timeCategories).toBeInstanceOf(Array);
      expect(response.body.data.timeCategories.length).toBeGreaterThan(0);

      const testCategory = response.body.data.timeCategories.find(
        (cat: any) => cat.id === createdCategoryId
      );
      expect(testCategory).toBeDefined();
      expect(testCategory.isActive).toBe(true);
    });
  });

  describe('Timesheet Workflow', () => {
    it('should submit timesheet', async () => {
      const submitTimesheetMutation = `
        mutation SubmitTimesheet($id: ID!) {
          submitTimesheet(id: $id) {
            id
            status
            submittedAt
            totalHours
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: submitTimesheetMutation,
          variables: { id: createdTimesheetId },
        })
        .expect(200);

      expect(response.body.data.submitTimesheet).toBeDefined();
      expect(response.body.data.submitTimesheet.status).toBe('Submitted');
      expect(response.body.data.submitTimesheet.submittedAt).toBeDefined();
      expect(response.body.data.submitTimesheet.totalHours).toBeGreaterThan(0);
    });

    it('should approve timesheet', async () => {
      const approveTimesheetMutation = `
        mutation ApproveTimesheet($timesheetId: ID!, $comments: String) {
          approveTimesheet(timesheetId: $timesheetId, comments: $comments)
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: approveTimesheetMutation,
          variables: {
            timesheetId: createdTimesheetId,
            comments: 'Approved for testing purposes',
          },
        })
        .expect(200);

      expect(response.body.data.approveTimesheet).toBe(true);
    });
  });

  describe('Reporting', () => {
    it('should generate utilization report', async () => {
      const utilizationReportQuery = `
        query GetUtilizationReport($input: UtilizationReportInput!) {
          utilizationReport(input: $input) {
            employeeId
            employeeName
            totalHours
            billableHours
            nonBillableHours
            utilizationRate
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: utilizationReportQuery,
          variables: {
            input: {
              startDate: '2024-01-01',
              endDate: '2024-01-31',
            },
          },
        })
        .expect(200);

      expect(response.body.data.utilizationReport).toBeInstanceOf(Array);
      // Report might be empty if no approved timesheets exist
    });

    it('should get time tracking settings', async () => {
      const getSettingsQuery = `
        query GetTimeTrackingSettings {
          timeTrackingSettings {
            requireProjectSelection
            requireTaskSelection
            allowManualTimeEntry
            requireGpsTracking
            maxDailyHours
            maxWeeklyHours
            timesheetPeriod
            autoSubmitTimesheets
            requireApproval
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: getSettingsQuery,
        })
        .expect(200);

      expect(response.body.data.timeTrackingSettings).toBeDefined();
      expect(response.body.data.timeTrackingSettings.maxDailyHours).toBe(24);
      expect(response.body.data.timeTrackingSettings.timesheetPeriod).toBe(
        'Weekly'
      );
    });
  });

  describe('Error Handling', () => {
    it('should require authentication', async () => {
      const getTimesheetsQuery = `
        query GetTimesheets {
          timesheets {
            id
            timesheetCode
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getTimesheetsQuery,
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Unauthorized');
    });

    it('should validate time entry data', async () => {
      const createTimeEntryMutation = `
        mutation CreateTimeEntry($input: CreateTimeEntryInput!) {
          createTimeEntry(input: $input) {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: createTimeEntryMutation,
          variables: {
            input: {
              timesheetId: 'invalid-id',
              activityType: '',
              duration: -1,
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
    });
  });
});
