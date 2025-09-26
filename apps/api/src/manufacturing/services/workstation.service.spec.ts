import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateWorkstationDto, UpdateWorkstationDto, WorkstationFilterDto } from '../dto/workstation.dto';
import { WorkstationService } from './workstation.service';

// Mock the database
jest.mock('@velocity/database', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@velocity/database/schema', () => ({
  workstations: {
d',
    workstationName: 'workstationName',
    companyId: 'companyId',
    isActive: 'isActive',
    createdAt: 'createdAt',
  },
}));

import { db } from '@velocity/database';

describe('WorkstationService', () => {
  let service: WorkstationService;
  let mockDb: jest.Mocked<typeof db>;

  const mockWorkstation = {
    id: 'workstation-1',
    workstationName: 'Assembly Line 1',
    workstationType: 'Assembly',
    companyId: 'company-1',
    warehouseId: 'warehouse-1',
    description: 'Main assembly line',
    hourRate: 50,
    hourRateElectricity: 5,
    hourRateConsumable: 3,
    hourRateRent: 2,
    hourRateLabour: 40,
    productionCapacity: 10,
    workingHoursStart: '08:00',
    workingHoursEnd: '17:00',
    holidayList: 'Standard Holidays',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkstationService],
    }).compile();

    service = module.get<WorkstationService>(WorkstationService);
    mockDb = db as jest.Mocked<typeof db>;

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createWorkstation', () => {
    const createWorkstationDto: CreateWorkstationDto = {
      workstationName: 'Assembly Line 1',
      workstationType: 'Assembly',
      companyId: 'company-1',
      warehouseId: 'warehouse-1',
      description: 'Main assembly line',
      hourRate: 50,
      productionCapacity: 10,
      workingHoursStart: '08:00',
      workingHoursEnd: '17:00',
    };

    it('should create a workstation successfully', async () => {
      // Mock no existing workstation
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      // Mock insert
      mockDb.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockWorkstation]),
        }),
      } as any);

      const result = await service.createWorkstation(createWorkstationDto);

      expect(result).toEqual(mockWorkstation);
    });

    it('should throw ConflictException if workstation name already exists', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockWorkstation]),
          }),
        }),
      } as any);

      await expect(service.createWorkstation(createWorkstationDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateWorkstation', () => {
    const updateWorkstationDto: UpdateWorkstationDto = {
      description: 'Updated assembly line',
      hourRate: 55,
      isActive: true,
    };

    it('should update a workstation successfully', async () => {
      const updatedWorkstation = { ...mockWorkstation, ...updateWorkstationDto };

      // Mock findWorkstationById
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockWorkstation]),
          }),
        }),
      } as any);

      // Mock update
      mockDb.update.mockReturnValueOnce({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedWorkstation]),
          }),
        }),
      } as any);

      const result = await service.updateWorkstation('workstation-1', updateWorkstationDto);

      expect(result).toEqual(updatedWorkstation);
    });

    it('should throw NotFoundException if workstation does not exist', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      await expect(service.updateWorkstation('non-existent-id', updateWorkstationDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findWorkstationById', () => {
    it('should return a workstation when found', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockWorkstation]),
          }),
        }),
      } as any);

      const result = await service.findWorkstationById('workstation-1');

      expect(result).toEqual(mockWorkstation);
    });

    it('should throw NotFoundException when workstation not found', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      await expect(service.findWorkstationById('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findWorkstations', () => {
    const filter: WorkstationFilterDto = {
      companyId: 'company-1',
      isActive: true,
    };

    it('should return filtered workstations', async () => {
      const mockWorkstations = [mockWorkstation];

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockWorkstations),
          }),
        }),
      } as any);

      const result = await service.findWorkstations(filter);

      expect(result).toEqual(mockWorkstations);
    });
  });

  describe('getWorkstationCapacityInfo', () => {
    it('should return capacity information', async () => {
      // Mock findWorkstationById
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockWorkstation]),
          }),
        }),
      } as any);

      const result = await service.getWorkstationCapacityInfo('workstation-1');

      expect(result).toMatchObject({
        totalCapacity: 90, // 10 * 9 hours
        availableCapacity: 90,
        utilizationPercentage: 0,
        workingHoursStart: '08:00',
        workingHoursEnd: '17:00',
        dailyWorkingHours: 9,
      });
    });
  });

  describe('getWorkstationCostBreakdown', () => {
    it('should return cost breakdown', async () => {
      // Mock findWorkstationById
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockWorkstation]),
          }),
        }),
      } as any);

      const result = await service.getWorkstationCostBreakdown('workstation-1');

      expect(result).toMatchObject({
        hourRate: 50,
        electricityCost: 5,
        consumableCost: 3,
        rentCost: 2,
        labourCost: 40,
        totalHourlyRate: 100,
        currency: 'USD',
      });
    });
  });

  describe('deleteWorkstation', () => {
    it('should delete a workstation successfully', async () => {
      // Mock findWorkstationById
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockWorkstation]),
          }),
        }),
      } as any);

      // Mock delete
      mockDb.delete.mockReturnValueOnce({
        where: jest.fn().mockResolvedValue([]),
      } as any);

      await service.deleteWorkstation('workstation-1');

      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe('getWorkstationsByCompany', () => {
    it('should return workstations for a company', async () => {
      const mockWorkstations = [mockWorkstation];

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockWorkstations),
          }),
        }),
      } as any);

      const result = await service.getWorkstationsByCompany('company-1');

      expect(result).toEqual(mockWorkstations);
    });
  });

  describe('getWorkstationsByType', () => {
    it('should return workstations by type', async () => {
      const mockWorkstations = [mockWorkstation];

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockWorkstations),
          }),
        }),
      } as any);

      const result = await service.getWorkstationsByType('company-1', 'Assembly');

      expect(result).toEqual(mockWorkstations);
    });
  });
});
