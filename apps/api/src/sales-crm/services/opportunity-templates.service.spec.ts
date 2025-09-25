import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { beforeEach } from 'node:test';
import { OpportunityTemplatesService } from './opportunity-templates.service';
// Mock logger
const createMockLogger = () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
});

describe('OpportunityTemplatesService', () => {
  let service: OpportunityTemplatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpportunityTemplatesService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: createMockLogger(),
        },
      ],
    }).compile();

    service = module.get<OppTemplatesService>(OpportunityTemplatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTemplate', () => {
    it('should create opportunity template with stages and activities', async () => {
      const templateData = {
        name: 'Enterprise Sales Template',
        description: 'Template for enterprise sales opportunities',
        productLine: 'Software',
        industry: 'Technology',
        dealType: 'New Business' as const,
        averageDealSize: 50000,
        averageSalesCycle: 90,
        stages: [
          {
            stageName: 'Discovery',
            stageOrder: 1,
            defaultProbability: 10,
            isRequired: true,
            averageDuration: 14,
          },
          {
            stageName: 'Proposal',
            stageOrder: 2,
            defaultProbability: 60,
            isRequired: true,
            averageDuration: 21,
          },
        ],
        activities: [
          {
            activityName: 'Initial Discovery Call',
            activityType: 'Call',
            isRequired: true,
            daysFromStageStart: 1,
            estimatedDuration: 60,
          },
          {
            activityName: 'Send Proposal',
            activityType: 'Email',
            isRequired: true,
            daysFromStageStart: 0,
            estimatedDuration: 30,
          },
        ],
      };

      const companyId = 'company-123';
      const userId = 'user-123';

      // Mock the transaction
      jest.spyOn(service, 'transaction').mockImplementation(async callback => {
        const mockTx = {
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockReturnValue({
              returning: jest.fn().mockImplementation(table => {
                if (table === 'opportunity_templates') {
                  return Promise.resolve([
                    {
                      id: 'template-123',
                      name: templateData.name,
                      description: templateData.description,
                      productLine: templateData.productLine,
                      industry: templateData.industry,
                      dealType: templateData.dealType,
                      averageDealSize: templateData.averageDealSize.toString(),
                      averageSalesCycle: templateData.averageSalesCycle,
                      companyId,
                      createdBy: userId,
                    },
                  ]);
                } else {
                  return Promise.resolve([{ id: 'stage-or-activity-123' }]);
                }
              }),
            }),
          }),
        };
        return callback(mockTx as any);
      });

      const result = await service.createTemplate(
        templateData,
        companyId,
        userId
      );

      expect(result).toBeDefined();
      expect(result.template.name).toBe(templateData.name);
      expect(result.stages).toHaveLength(2);
      expect(result.activities).toHaveLength(2);
    });
  });

  describe('getTemplatesByCriteria', () => {
    it('should return templates matching criteria', async () => {
      const criteria = {
        productLine: 'Software',
        industry: 'Technology',
        dealType: 'New Business',
        dealSizeRange: { min: 10000, max: 100000 },
      };

      const companyId = 'company-123';

      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Software Sales Template',
          productLine: 'Software',
          industry: 'Technology',
          dealType: 'New Business',
          averageDealSize: '50000',
        },
        {
          id: 'template-2',
          name: 'Enterprise Software Template',
          productLine: 'Software',
          industry: 'Technology',
          dealType: 'New Business',
          averageDealSize: '75000',
        },
      ];

      jest.spyOn(service, 'database', 'get').mockReturnValue({
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue(mockTemplates),
            }),
          }),
        }),
      } as any);

      const result = await service.getTemplatesByCriteria(companyId, criteria);

      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result[0].productLine).toBe('Software');
    });
  });

  describe('getRecommendedTemplate', () => {
    it('should recommend template based on opportunity data', async () => {
      const opportunityData = {
        amount: 45000,
        industry: 'Technology',
        productLine: 'Software',
      };

      const companyId = 'company-123';

      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Small Deal Template',
          averageDealSize: '25000',
        },
        {
          id: 'template-2',
          name: 'Medium Deal Template',
          averageDealSize: '50000',
        },
        {
          id: 'template-3',
          name: 'Large Deal Template',
          averageDealSize: '100000',
        },
      ];

      // Mock the first call to getTemplatesByCriteria
      jest
        .spyOn(service, 'getTemplatesByCriteria')
        .mockResolvedValue(mockTemplates as any);

      const result = await service.getRecommendedTemplate(
        opportunityData,
        companyId
      );

      expect(result).toBeDefined();
      expect(result?.name).toBe('Medium Deal Template'); // Closest to 45000
    });

    it('should return null if no templates found', async () => {
      const opportunityData = {
        amount: 45000,
        industry: 'Technology',
        productLine: 'Software',
      };

      const companyId = 'company-123';

      // Mock both calls to return empty arrays
      jest
        .spyOn(service, 'getTemplatesByCriteria')
        .mockResolvedValueOnce([]) // First call with all criteria
        .mockResolvedValueOnce([]); // Second call with just industry

      const result = await service.getRecommendedTemplate(
        opportunityData,
        companyId
      );

      expect(result).toBeNull();
    });
  });

  describe('applyTemplateToOpportunity', () => {
    it('should apply template to opportunity', async () => {
      const templateId = 'template-123';
      const opportunityId = 'opp-123';
      const companyId = 'company-123';
      const userId = 'user-123';

      const mockTemplateDetails = {
        template: {
          id: templateId,
          name: 'Test Template',
        },
        stages: [
          {
            id: 'stage-1',
            stageName: 'Discovery',
            requiredActivities: ['Initial Call', 'Needs Assessment'],
          },
        ],
        activities: [
          {
            id: 'activity-1',
            activityName: 'Discovery Call',
            activityType: 'Call',
            isRequired: true,
            daysFromStageStart: 1,
            estimatedDuration: 60,
          },
        ],
      };

      jest
        .spyOn(service, 'getTemplateWithDetails')
        .mockResolvedValue(mockTemplateDetails as any);

      jest.spyOn(service, 'transaction').mockImplementation(async callback => {
        const mockTx = {
          update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(undefined),
            }),
          }),
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockResolvedValue(undefined),
          }),
        };
        return callback(mockTx as any);
      });

      await service.applyTemplateToOpportunity(
        templateId,
        opportunityId,
        companyId,
        userId
      );

      // Should complete without throwing
      expect(true).toBe(true);
    });
  });

  describe('getTemplatePerformance', () => {
    it('should return template performance analytics', async () => {
      const templateId = 'template-123';
      const companyId = 'company-123';

      const mockPerformance = [
        {
          totalOpportunities: 50,
          wonOpportunities: 15,
          lostOpportunities: 10,
          averageAmount: 45000,
          totalValue: 2250000,
          wonValue: 675000,
          averageSalesCycle: 85,
          winRate: 60,
        },
      ];

      const mockStagePerformance = [
        {
          stage: 'Discovery',
          count: 20,
          averageTimeInStage: 14,
        },
        {
          stage: 'Proposal',
          count: 15,
          averageTimeInStage: 21,
        },
      ];

      jest.spyOn(service, 'database', 'get').mockReturnValue({
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                groupBy: jest.fn().mockResolvedValue(mockStagePerformance),
              }),
            }),
            where: jest.fn().mockResolvedValue(mockPerformance),
          }),
        }),
      } as any);

      const result = await service.getTemplatePerformance(
        templateId,
        companyId
      );

      expect(result).toBeDefined();
      expect(result.totalOpportunities).toBe(50);
      expect(result.winRate).toBe(60);
      expect(result.stagePerformance).toHaveLength(2);
    });
  });

  describe('cloneTemplate', () => {
    it('should clone existing template', async () => {
      const templateId = 'template-123';
      const newName = 'Cloned Template';
      const companyId = 'company-123';
      const userId = 'user-123';

      const mockOriginalTemplate = {
        template: {
          id: templateId,
          name: 'Original Template',
          productLine: 'Software',
          industry: 'Technology',
          dealType: 'New Business',
          averageDealSize: '50000',
          averageSalesCycle: 90,
          customFields: { field1: 'value1' },
        },
        stages: [
          {
            stageName: 'Discovery',
            stageOrder: 1,
            defaultProbability: 10,
            isRequired: true,
            averageDuration: 14,
          },
        ],
        activities: [
          {
            activityName: 'Discovery Call',
            activityType: 'Call',
            isRequired: true,
            daysFromStageStart: 1,
            estimatedDuration: 60,
          },
        ],
      };

      jest
        .spyOn(service, 'getTemplateWithDetails')
        .mockResolvedValue(mockOriginalTemplate as any);
      jest.spyOn(service, 'createTemplate').mockResolvedValue({
        template: { id: 'new-template-123', name: newName },
        stages: mockOriginalTemplate.stages,
        activities: mockOriginalTemplate.activities,
      } as any);

      const result = await service.cloneTemplate(
        templateId,
        newName,
        companyId,
        userId
      );

      expect(result).toBeDefined();
      expect(result.template.name).toBe(newName);
      expect(service.createTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: newName,
          description: `Cloned from ${mockOriginalTemplate.template.name}`,
          productLine: mockOriginalTemplate.template.productLine,
        }),
        companyId,
        userId
      );
    });
  });

  describe('updateTemplateFromPerformance', () => {
    it('should update template based on performance data', async () => {
      const templateId = 'template-123';
      const companyId = 'company-123';

      const mockPerformance = {
        totalOpportunities: 15, // More than 10, so update should happen
        averageAmount: 55000,
        averageSalesCycle: 95,
        stagePerformance: [
          {
            stage: 'Discovery',
            averageTimeInStage: 16,
          },
          {
            stage: 'Proposal',
            averageTimeInStage: 25,
          },
        ],
      };

      jest
        .spyOn(service, 'getTemplatePerformance')
        .mockResolvedValue(mockPerformance);

      jest.spyOn(service, 'database', 'get').mockReturnValue({
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(undefined),
          }),
        }),
      } as any);

      await service.updateTemplateFromPerformance(templateId, companyId);

      // Should complete without throwing
      expect(true).toBe(true);
    });

    it('should not update template if insufficient data', async () => {
      const templateId = 'template-123';
      const companyId = 'company-123';

      const mockPerformance = {
        totalOpportunities: 5, // Less than 10, so no update
        averageAmount: 55000,
        averageSalesCycle: 95,
        stagePerformance: [],
      };

      jest
        .spyOn(service, 'getTemplatePerformance')
        .mockResolvedValue(mockPerformance);

      const updateSpy = jest.spyOn(service, 'database', 'get').mockReturnValue({
        update: jest.fn(),
      } as any);

      await service.updateTemplateFromPerformance(templateId, companyId);

      expect(updateSpy).not.toHaveBeenCalled();
    });
  });
});
