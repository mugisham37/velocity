import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { beforeEach } from 'node:test';
import { AuditService } from '../../common/services/audit.service';
import { NotificationService } from '../../common/services/notification.service';
import { OpportunitiesService } from './opportunities.service';
// Mock logger
const createMockLogger = () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
});

describe('OpportunitiesService', () => {
  let service: OpportunitiesService;
  let mockAuditService: jest.Mocked<AuditService>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  beforeEach(async () => {
    mockAuditService = {
      logAudit: jest.fn(),
    } as any;

    mockNotificationService = {
      sendNotification: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpportunitiesService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: createMockLogger(),
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    service = module.get<OpportunitiesService>(OpportunitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOpportunity', () => {
    it('should create opportunity with auto-generated code', async () => {
      const mockOpportunityData = {
        name: 'Test Opportunity',
        amount: 10000,
        stage: 'Prospecting' as const,
        customerId: 'customer-123',
      };

      const companyId = 'company-123';
      const userId = 'user-123';

      // Mock the database transaction
      jest.spyOn(service, 'transaction').mockImplementation(async callback => {
        return callback({
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([
                {
                  id: 'opp-123',
                  opportunityCode: 'OPP000001',
                  name: mockOpportunityData.name,
                  amount: mockOpportunityData.amount.toString(),
                  stage: mockOpportunityData.stage,
                  probability: 10,
                  companyId,
                },
              ]),
            }),
          }),
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([
                  {
                    id: mockOpportunityData.customerId,
                    name: 'Test Customer',
                  },
                ]),
              }),
            }),
          }),
        } as any);
      });

      const result = await service.createOpportunity(
        mockOpportunityData,
        companyId,
        userId
      );

      expect(result).toBeDefined();
      expect(result.name).toBe(mockOpportunityData.name);
      expect(mockAuditService.logAudit).toHaveBeenCalled();
    });

    it('should throw error for invalid customer', async () => {
      const mockOpportunityData = {
        name: 'Test Opportunity',
        amount: 10000,
        customerId: 'invalid-customer',
      };

      const companyId = 'company-123';
      const userId = 'user-123';

      jest.spyOn(service, 'transaction').mockImplementation(async callback => {
        return callback({
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]), // No customer found
              }),
            }),
          }),
        } as any);
      });

      await expect(
        service.createOpportunity(mockOpportunityData, companyId, userId)
      ).rejects.toThrow('Customer not found');
    });
  });

  describe('updateOpportunity', () => {
    it('should update opportunity and track stage changes', async () => {
      const opportunityId = 'opp-123';
      const companyId = 'company-123';
      const userId = 'user-123';

      const oldOpportunity = {
        id: opportunityId,
        stage: 'Prospecting',
        amount: '10000',
        probability: 10,
      };

      const updateData = {
        stage: 'Qualification' as const,
        probability: 20,
      };

      jest
        .spyOn(service, 'findByIdOrFail')
        .mockResolvedValue(oldOpportunity as any);
      jest.spyOn(service, 'transaction').mockImplementation(async callback => {
        return callback({
          update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([
                  {
                    ...oldOpportunity,
                    ...updateData,
                  },
                ]),
              }),
            }),
          }),
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockResolvedValue(undefined),
          }),
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]),
            }),
          }),
        } as any);
      });

      const result = await service.updateOpportunity(
        opportunityId,
        updateData,
        companyId,
        userId
      );

      expect(result).toBeDefined();
      expect(result.stage).toBe(updateData.stage);
      expect(mockAuditService.logAudit).toHaveBeenCalled();
    });
  });

  describe('getSalesForecast', () => {
    it('should generate sales forecast', async () => {
      const companyId = 'company-123';
      const period = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
      };

      // Mock database queries
      jest.spyOn(service, 'database', 'get').mockReturnValue({
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              groupBy: jest.fn().mockResolvedValue([
                {
                  stage: 'Prospecting',
                  totalAmount: 50000,
                  weightedAmount: 5000,
                  count: 5,
                  averageProbability: 10,
                },
                {
                  stage: 'Qualification',
                  totalAmount: 30000,
                  weightedAmount: 6000,
                  count: 3,
                  averageProbability: 20,
                },
              ]),
            }),
          }),
        }),
      } as any);

      const result = await service.getSalesForecast(companyId, period);

      expect(result).toBeDefined();
      expect(result.forecastByStage).toHaveLength(2);
      expect(result.totalPipeline).toBe(80000);
      expect(result.totalWeighted).toBe(11000);
    });
  });

  describe('getOpportunityAnalytics', () => {
    it('should return comprehensive analytics', async () => {
      const companyId = 'company-123';

      // Mock database queries
      jest.spyOn(service, 'database', 'get').mockReturnValue({
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              groupBy: jest.fn().mockResolvedValue([
                {
                  totalOpportunities: 100,
                  openOpportunities: 60,
                  wonOpportunities: 30,
                  lostOpportunities: 10,
                  totalValue: 1000000,
                  wonValue: 500000,
                  averageDealSize: 10000,
                  averageProbability: 45,
                  winRate: 75,
                },
              ]),
            }),
          }),
        }),
      } as any);

      const result = await service.getOpportunityAnalytics(companyId);

      expect(result).toBeDefined();
      expect(result.totalOpportunities).toBe(100);
      expect(result.winRate).toBe(75);
      expect(result.averageDealSize).toBe(10000);
    });
  });

  describe('createActivity', () => {
    it('should create opportunity activity', async () => {
      const activityData = {
        opportunityId: 'opp-123',
        activityType: 'Call',
        subject: 'Follow-up call',
        activityDate: new Date(),
      };

      const companyId = 'company-123';
      const userId = 'user-123';

      jest.spyOn(service, 'findByIdOrFail').mockResolvedValue({
        id: activityData.opportunityId,
        name: 'Test Opportunity',
      } as any);

      jest.spyOn(service, 'database', 'get').mockReturnValue({
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                id: 'activity-123',
                ...activityData,
                createdBy: userId,
                companyId,
              },
            ]),
          }),
        }),
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(undefined),
          }),
        }),
      } as any);

      const result = await service.createActivity(
        activityData,
        companyId,
        userId
      );

      expect(result).toBeDefined();
      expect(result.subject).toBe(activityData.subject);
      expect(mockAuditService.logAudit).toHaveBeenCalled();
    });
  });

  describe('addCompetitor', () => {
    it('should add competitor to opportunity', async () => {
      const competitorData = {
        opportunityId: 'opp-123',
        competitorName: 'Competitor Inc',
        strengths: 'Lower price',
        weaknesses: 'Poor support',
        winProbability: 30,
      };

      const companyId = 'company-123';
      const userId = 'user-123';

      jest.spyOn(service, 'findByIdOrFail').mockResolvedValue({
        id: competitorData.opportunityId,
        name: 'Test Opportunity',
      } as any);

      jest.spyOn(service, 'database', 'get').mockReturnValue({
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                id: 'competitor-123',
                ...competitorData,
                companyId,
              },
            ]),
          }),
        }),
      } as any);

      const result = await service.addCompetitor(
        competitorData,
        companyId,
        userId
      );

      expect(result).toBeDefined();
      expect(result.competitorName).toBe(competitorData.competitorName);
      expect(mockAuditService.logAudit).toHaveBeenCalled();
    });
  });

  describe('addTeamMember', () => {
    it('should add team member to opportunity', async () => {
      const teamMemberData = {
        opportunityId: 'opp-123',
        userId: 'user-456',
        role: 'Sales Engineer',
        accessLevel: 'Write' as const,
      };

      const companyId = 'company-123';
      const userId = 'user-123';

      jest.spyOn(service, 'findByIdOrFail').mockResolvedValue({
        id: teamMemberData.opportunityId,
        name: 'Test Opportunity',
      } as any);

      jest.spyOn(service, 'database', 'get').mockReturnValue({
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]), // No existing member
            }),
          }),
        }),
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockResolvedValue(undefined),
        }),
      } as any);

      jest.spyOn(service, 'findById').mockResolvedValue({
        id: teamMemberData.opportunityId,
        name: 'Test Opportunity',
      } as any);

      await service.addTeamMember(teamMemberData, companyId, userId);

      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Added to Opportunity Team',
          recipientId: teamMemberData.userId,
        }),
        companyId,
        ['IN_APP']
      );
    });

    it('should throw error if user is already a team member', async () => {
      const teamMemberData = {
        opportunityId: 'opp-123',
        userId: 'user-456',
        role: 'Sales Engineer',
      };

      const companyId = 'company-123';
      const userId = 'user-123';

      jest.spyOn(service, 'findByIdOrFail').mockResolvedValue({
        id: teamMemberData.opportunityId,
        name: 'Test Opportunity',
      } as any);

      jest.spyOn(service, 'database', 'get').mockReturnValue({
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([
                {
                  id: 'existing-member',
                  userId: teamMemberData.userId,
                },
              ]), // Existing member found
            }),
          }),
        }),
      } as any);

      await expect(
        service.addTeamMember(teamMemberData, companyId, userId)
      ).rejects.toThrow('User is already a team member');
    });
  });

  describe('getOpportunities', () => {
    it('should return filtered and paginated opportunities', async () => {
      const filter = {
        stage: ['Prospecting', 'Qualification'],
        minAmount: 5000,
        maxAmount: 50000,
      };

      const companyId = 'company-123';
      const limit = 10;
      const offset = 0;

      const mockOpportunities = [
        {
          id: 'opp-1',
          name: 'Opportunity 1',
          stage: 'Prospecting',
          amount: '10000',
        },
        {
          id: 'opp-2',
          name: 'Opportunity 2',
          stage: 'Qualification',
          amount: '25000',
        },
      ];

      jest.spyOn(service, 'database', 'get').mockReturnValue({
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue(mockOpportunities),
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Mock count query
      jest.spyOn(service, 'database', 'get').mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 2 }]),
          }),
        }),
      } as any);

      const result = await service.getOpportunities(
        filter,
        companyId,
        limit,
        offset
      );

      expect(result).toBeDefined();
      expect(result.opportunities).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });
});
