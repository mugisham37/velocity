import { db } from '@kiro/database';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach } from 'node:test';
import {
  CapacityPlanStatus,
  CreateCapacityPlanDto,
  CreateMRPRunDto,
  CreateProductionForecastDto,
  ForecastType,
  MRPRunStatus,
  ProductionPlanStatus,
  UpdateProductionPlanDto,
} from '../dto/production-planning.dto';
import { ProductionPlanningService } from './production-planning.service';

// Mock the database
jest.mock('@kiro/database', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
  },
}));

const mockDb = db as jest.Mocked<typeof db>;

describe('ProductionPlanningService', () => {
  let service: ProductionPlanningService;
  let mockTransaction: any;

  const mockUserId = 'user-123';
  const mockCompanyId = 'company-123';
  const mockItemId = 'item-123';
  const mockBomId = 'bom-123';
  const mockWarehouseId = 'warehouse-123';
  const mockWorkstationId = 'workstation-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductionPlanningService],
    }).compile();

    service = module.get<ProductionPlanningService>(ProductionPlanningService);

    // Reset mocks
    jest.clearAllMocks();

    // Setup mock transaction
    mockTransaction = {
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      select: jest.fn(),
    };

    mockDb.transaction.mockImplementation(async callback => {
      return callback(mockTransaction);
    });
  });

  describe('Production Plan Management', () => {
    describe('createProductionPlan', () => {
      const createDto: CreateProductionPlanDto = {
        planName: 'Test Production Plan',
        companyId: mockCompanyId,
        fromDate: '2024-01-01T00:00:00Z',
        toDate: '2024-01-31T23:59:59Z',
        description: 'Test plan description',
        getItemsFromOpenSalesOrders: false,
        downloadMaterialsRequired: false,
        ignoreExistingOrderedQty: false,
        considerMinOrderQty: false,
        includeNonStockItems: false,
        includeSubcontractedItems: false,
        items: [
          {
            itemId: mockItemId,
            itemCode: 'ITEM001',
            itemName: 'Test Item',
            bomId: mockBomId,
            bomNo: 'BOM001',
            plannedQty: 100,
            uom: 'Nos',
            warehouseId: mockWarehouseId,
            plannedStartDate: '2024-01-05T00:00:00Z',
            plannedEndDate: '2024-01-25T23:59:59Z',
            description: 'Test item description',
          },
        ],
      };

      it('should create a production plan successfully', async () => {
        const mockPlan = {
          id: 'plan-123',
          ...createDto,
          status: ProductionPlanStatus.DRAFT,
          createdBy: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Mock existing plan check (no existing plan)
        mockDb.select.mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        });

        // Mock plan creation
        mockTransaction.insert.mockReturnValue({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockPlan]),
          }),
        });

        const result = await service.createProductionPlan(
          createDto,
          mockUserId
        );

        expect(result).toEqual(mockPlan);
        expect(mockDb.transaction).toHaveBeenCalled();
        expect(mockTransaction.insert).toHaveBeenCalledTimes(2); // Plan + Items
      });

      it('should throw ConflictException if plan name already exists', async () => {
        const existingPlan = {
          id: 'existing-plan',
          planName: createDto.planName,
        };

        mockDb.select.mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([existingPlan]),
            }),
          }),
        });

        await expect(
          service.createProductionPlan(createDto, mockUserId)
        ).rejects.toThrow(ConflictException);
      });

      it('should throw BadRequestException if toDate is before fromDate', async () => {
        const invalidDto = {
          ...createDto,
          fromDate: '2024-01-31T00:00:00Z',
          toDate: '2024-01-01T00:00:00Z',
        };

        await expect(
          service.createProductionPlan(invalidDto, mockUserId)
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('updateProductionPlan', () => {
      const planId = 'plan-123';
      const updateDto: UpdateProductionPlanDto = {
        planName: 'Updated Plan Name',
        status: ProductionPlanStatus.SUBMITTED,
        description: 'Updated description',
      };

      it('should update a production plan successfully', async () => {
        const existingPlan = {
          id: planId,
          planName: 'Original Plan',
          status: ProductionPlanStatus.DRAFT,
        };

        const updatedPlan = {
          ...existingPlan,
          ...updateDto,
        };

        // Mock finding existing plan
        jest
          .spyOn(service, 'findProductionPlanById')
          .mockResolvedValue(existingPlan as any);

        // Mock update
        mockTransaction.update.mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([updatedPlan]),
            }),
          }),
        });

        const result = await service.updateProductionPlan(
          planId,
          updateDto,
          mockUserId
        );

        expect(result).toEqual(updatedPlan);
        expect(mockDb.transaction).toHaveBeenCalled();
      });

      it('should throw NotFoundException if plan does not exist', async () => {
        jest
          .spyOn(service, 'findProductionPlanById')
          .mockRejectedValue(
            new NotFoundException('Production plan not found')
          );

        await expect(
          service.updateProductionPlan(planId, updateDto, mockUserId)
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('findProductionPlanById', () => {
      it('should return a production plan by ID', async () => {
        const mockPlan = {
          id: 'plan-123',
          planName: 'Test Plan',
          companyId: mockCompanyId,
        };

        mockDb.select.mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockPlan]),
            }),
          }),
        });

        const result = await service.findProductionPlanById('plan-123');

        expect(result).toEqual(mockPlan);
      });

      it('should throw NotFoundException if plan not found', async () => {
        mockDb.select.mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        });

        await expect(
          service.findProductionPlanById('nonexistent')
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('getProductionPlanSummary', () => {
      it('should return production plan summary', async () => {
        const mockSummaryData = {
          totalPlans: 10,
          draftPlans: 3,
          submittedPlans: 4,
          completedPlans: 3,
        };

        const mockItemsData = {
          totalItems: 50,
          totalPlannedQuantity: 1000,
          totalProducedQuantity: 600,
        };

        mockDb.select
          .mockReturnValueOnce({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([mockSummaryData]),
            }),
          })
          .mockReturnValueOnce({
            from: jest.fn().mockReturnValue({
              innerJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockResolvedValue([mockItemsData]),
              }),
            }),
          });

        const result = await service.getProductionPlanSummary(mockCompanyId);

        expect(result).toEqual({
          totalPlans: 10,
          draftPlans: 3,
          submittedPlans: 4,
          completedPlans: 3,
          totalItems: 50,
          totalPlannedQuantity: 1000,
          totalProducedQuantity: 600,
          completionPercentage: 60,
        });
      });
    });
  });

  describe('MRP Management', () => {
    describe('createMRPRun', () => {
      const createDto: CreateMRPRunDto = {
        runName: 'Test MRP Run',
        companyId: mockCompanyId,
        fromDate: '2024-01-01T00:00:00Z',
        toDate: '2024-01-31T23:59:59Z',
        includeNonStockItems: false,
        includeSubcontractedItems: false,
        ignoreExistingOrderedQty: false,
        considerMinOrderQty: false,
        considerSafetyStock: true,
        warehouseId: mockWarehouseId,
      };

      it('should create an MRP run successfully', async () => {
        const mockRun = {
          id: 'mrp-123',
          ...createDto,
          status: MRPRunStatus.DRAFT,
          createdBy: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockDb.insert.mockReturnValue({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockRun]),
          }),
        });

        const result = await service.createMRPRun(createDto, mockUserId);

        expect(result).toEqual(mockRun);
        expect(mockDb.insert).toHaveBeenCalled();
      });

      it('should throw BadRequestException if toDate is before fromDate', async () => {
        const invalidDto = {
          ...createDto,
          fromDate: '2024-01-31T00:00:00Z',
          toDate: '2024-01-01T00:00:00Z',
        };

        await expect(
          service.createMRPRun(invalidDto, mockUserId)
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('executeMRPRun', () => {
      const runId = 'mrp-123';

      it('should execute MRP run successfully', async () => {
        const mockRun = {
          id: runId,
          status: MRPRunStatus.DRAFT,
          companyId: mockCompanyId,
          fromDate: new Date('2024-01-01'),
          toDate: new Date('2024-01-31'),
        };

        jest.spyOn(service, 'findMRPRunById').mockResolvedValue(mockRun as any);

        // Mock production plan items query
        mockTransaction.select.mockReturnValue({
          from: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]),
            }),
          }),
        });

        // Mock update operations
        mockTransaction.update.mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(undefined),
          }),
        });

        mockTransaction.delete.mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        });

        await service.executeMRPRun(runId);

        expect(mockDb.transaction).toHaveBeenCalled();
        expect(mockTransaction.update).toHaveBeenCalledTimes(2); // Start and complete
      });

      it('should throw BadRequestException if run is not in Draft status', async () => {
        const mockRun = {
          id: runId,
          status: MRPRunStatus.COMPLETED,
        };

        jest.spyOn(service, 'findMRPRunById').mockResolvedValue(mockRun as any);

        await expect(service.executeMRPRun(runId)).rejects.toThrow(
          BadRequestException
        );
      });
    });
  });

  describe('Capacity Planning Management', () => {
    describe('createCapacityPlan', () => {
      const createDto: CreateCapacityPlanDto = {
        planName: 'Test Capacity Plan',
        companyId: mockCompanyId,
        fromDate: '2024-01-01T00:00:00Z',
        toDate: '2024-01-31T23:59:59Z',
        workstationId: mockWorkstationId,
        includeWorkOrders: true,
        includeProductionPlans: true,
        includeMaintenanceSchedule: false,
        capacityUom: 'Hours',
      };

      it('should create a capacity plan successfully', async () => {
        const mockPlan = {
          id: 'capacity-123',
          ...createDto,
          status: CapacityPlanStatus.DRAFT,
          createdBy: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockDb.insert.mockReturnValue({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockPlan]),
          }),
        });

        const result = await service.createCapacityPlan(createDto, mockUserId);

        expect(result).toEqual(mockPlan);
        expect(mockDb.insert).toHaveBeenCalled();
      });

      it('should throw BadRequestException if toDate is before fromDate', async () => {
        const invalidDto = {
          ...createDto,
          fromDate: '2024-01-31T00:00:00Z',
          toDate: '2024-01-01T00:00:00Z',
        };

        await expect(
          service.createCapacityPlan(invalidDto, mockUserId)
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('executeCapacityPlan', () => {
      const planId = 'capacity-123';

      it('should execute capacity plan successfully', async () => {
        const mockPlan = {
          id: planId,
          status: CapacityPlanStatus.DRAFT,
          companyId: mockCompanyId,
          fromDate: new Date('2024-01-01'),
          toDate: new Date('2024-01-31'),
          workstationId: mockWorkstationId,
          capacityUom: 'Hours',
        };

        jest
          .spyOn(service, 'findCapacityPlanById')
          .mockResolvedValue(mockPlan as any);

        // Mock workstations query
        mockTransaction.select.mockReturnValue({
          where: jest.fn().mockResolvedValue([
            {
              id: mockWorkstationId,
              workstationName: 'Test Workstation',
            },
          ]),
        });

        // Mock update operations
        mockTransaction.update.mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(undefined),
          }),
        });

        mockTransaction.delete.mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        });

        mockTransaction.insert.mockReturnValue({
          values: jest.fn().mockResolvedValue(undefined),
        });

        await service.executeCapacityPlan(planId);

        expect(mockDb.transaction).toHaveBeenCalled();
        expect(mockTransaction.update).toHaveBeenCalledTimes(2); // Start and complete
      });

      it('should throw BadRequestException if plan is not in Draft status', async () => {
        const mockPlan = {
          id: planId,
          status: CapacityPlanStatus.COMPLETED,
        };

        jest
          .spyOn(service, 'findCapacityPlanById')
          .mockResolvedValue(mockPlan as any);

        await expect(service.executeCapacityPlan(planId)).rejects.toThrow(
          BadRequestException
        );
      });
    });
  });

  describe('Production Forecast Management', () => {
    describe('createProductionForecast', () => {
      const createDto: CreateProductionForecastDto = {
        forecastName: 'Test Forecast',
        companyId: mockCompanyId,
        itemId: mockItemId,
        itemCode: 'ITEM001',
        itemName: 'Test Item',
        forecastDate: '2024-01-15T00:00:00Z',
        forecastQuantity: 100,
        uom: 'Nos',
        warehouseId: mockWarehouseId,
        forecastType: ForecastType.MANUAL,
        confidenceLevel: 85,
        seasonalFactor: 1.2,
        trendFactor: 1.1,
        notes: 'Test forecast notes',
      };

      it('should create a production forecast successfully', async () => {
        const mockForecast = {
          id: 'forecast-123',
          ...createDto,
          actualQuantity: 0,
          variance: 0,
          variancePercentage: 0,
          isActive: true,
          createdBy: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockDb.insert.mockReturnValue({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockForecast]),
          }),
        });

        const result = await service.createProductionForecast(
          createDto,
          mockUserId
        );

        expect(result).toEqual(mockForecast);
        expect(mockDb.insert).toHaveBeenCalled();
      });
    });

    describe('updateProductionForecast', () => {
      const forecastId = 'forecast-123';

      it('should update forecast and calculate variance when actual quantity is provided', async () => {
        const existingForecast = {
          id: forecastId,
          forecastQuantity: 100,
          actualQuantity: 0,
          variance: 0,
          variancePercentage: 0,
        };

        const updateDto = {
          actualQuantity: 90,
        };

        const updatedForecast = {
          ...existingForecast,
          actualQuantity: 90,
          variance: -10,
          variancePercentage: -10,
        };

        jest
          .spyOn(service, 'findProductionForecastById')
          .mockResolvedValue(existingForecast as any);

        mockDb.update.mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([updatedForecast]),
            }),
          }),
        });

        const result = await service.updateProductionForecast(
          forecastId,
          updateDto
        );

        expect(result).toEqual(updatedForecast);
        expect(mockDb.update).toHaveBeenCalled();
      });
    });

    describe('getForecastAccuracy', () => {
      it('should return forecast accuracy metrics', async () => {
        const mockAccuracyData = [
          {
            itemId: mockItemId,
            itemCode: 'ITEM001',
            itemName: 'Test Item',
            totalForecasts: 10,
            totalForecastedQuantity: 1000,
            totalActualQuantity: 950,
            totalVariance: -50,
            averageVariancePercentage: -5,
          },
        ];

        mockDb.select.mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              groupBy: jest.fn().mockResolvedValue(mockAccuracyData),
            }),
          }),
        });

        const result = await service.getForecastAccuracy(mockCompanyId);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          itemId: mockItemId,
          itemCode: 'ITEM001',
          itemName: 'Test Item',
          totalForecasts: 10,
          averageAccuracy: 95, // 100 - abs(-5)
          totalForecastedQuantity: 1000,
          totalActualQuantity: 950,
          totalVariance: -50,
          averageVariancePercentage: -5,
        });
      });
    });
  });

  describe('Gantt Chart Generation', () => {
    describe('generateGanttChart', () => {
      it('should generate Gantt chart items from production plans', async () => {
        const generateDto = {
          fromDate: '2024-01-01T00:00:00Z',
          toDate: '2024-01-31T23:59:59Z',
          includeProductionPlans: true,
          includeWorkOrders: false,
          includeOperations: false,
        };

        const mockPlanItems = [
          {
            production_plan_items: {
              id: 'item-123',
              itemCode: 'ITEM001',
              itemName: 'Test Item',
              plannedStartDate: new Date('2024-01-05'),
              plannedEndDate: new Date('2024-01-25'),
              plannedQty: 100,
              producedQty: 60,
            },
            production_plans: {
              id: 'plan-123',
            },
          },
        ];

        mockDb.select.mockReturnValue({
          from: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockPlanItems),
            }),
          }),
        });

        const result = await service.generateGanttChart(generateDto);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          id: 'item-123',
          name: 'ITEM001 - Test Item',
          startDate: '2024-01-05T00:00:00.000Z',
          endDate: '2024-01-25T00:00:00.000Z',
          progress: 60,
          parentId: 'plan-123',
          type: 'production_plan',
        });
      });
    });
  });

  describe('Delete Operations', () => {
    it('should delete production plan if not completed', async () => {
      const planId = 'plan-123';
      const mockPlan = {
        id: planId,
        status: ProductionPlanStatus.DRAFT,
      };

      jest
        .spyOn(service, 'findProductionPlanById')
        .mockResolvedValue(mockPlan as any);

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      await service.deleteProductionPlan(planId);

      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should throw BadRequestException when trying to delete completed production plan', async () => {
      const planId = 'plan-123';
      const mockPlan = {
        id: planId,
        status: ProductionPlanStatus.COMPLETED,
      };

      jest
        .spyOn(service, 'findProductionPlanById')
        .mockResolvedValue(mockPlan as any);

      await expect(service.deleteProductionPlan(planId)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should delete MRP run', async () => {
      const runId = 'mrp-123';

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      await service.deleteMRPRun(runId);

      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should delete capacity plan', async () => {
      const planId = 'capacity-123';

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      await service.deleteCapacityPlan(planId);

      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should delete production forecast', async () => {
      const forecastId = 'forecast-123';

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      await service.deleteProductionForecast(forecastId);

      expect(mockDb.delete).toHaveBeenCalled();
    });
  });
});
