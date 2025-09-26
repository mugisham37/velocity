import { DatabaseService } from '@kiro/database';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach } from 'node:test';
import { vi } from 'vitest';
import { SerialBatchTrackingService } from './serial-batch-tracking.service';

describe('SerialBatchTrackingService', () => {
  let service: SerialBatchTrackingService;
  let mockDb: jest.Mocked<DatabaseService>;

  beforeEach(async () => {
    const mockDbService = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SerialBatchTrackingService,
        {
          provide: DatabaseService,
          useValue: mockDbService,
        },
      ],
    }).compile();

    service = module.get<SerialBatchTrackingService>(
      SerialBatchTrackingService
    );
    mockDb = module.get(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSerialNumber', () => {
    it('should create a serial number successfully', async () => {
      const createDto = {
        serialNumber: 'SN001',
        itemId: 'item-1',
        warehouseId: 'warehouse-1',
        status: 'Available',
        condition: 'Good',
      };

      const mockSerialNumber = {
        id: 'serial-1',
        ...createDto,
        companyId: 'company-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock existing check (no existing serial number)
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.limit.mockResolvedValueOnce([]);

      // Mock item check (item exists with serial tracking)
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.limit.mockResolvedValueOnce([{ id: 'item-1', hasSerialNo: true }]);

      // Mock insert
      mockDb.insert.mockReturnValueOnce(mockDb);
      mockDb.values.mockReturnValueOnce(mockDb);
      mockDb.returning.mockResolvedValueOnce([mockSerialNumber]);

      // Mock history insert
      mockDb.insert.mockReturnValueOnce(mockDb);
      mockDb.values.mockResolvedValueOnce([{}]);

      const result = await service.createSerialNumber(
        createDto as any,
        'company-1',
        'user-1'
      );

      expect(result).toEqual(mockSerialNumber);
      expect(mockDb.insert).toHaveBeenCalledTimes(2); // Serial number + history
    });

    it('should throw error if serial number already exists', async () => {
      const createDto = {
        serialNumber: 'SN001',
        itemId: 'item-1',
        warehouseId: 'warehouse-1',
        status: 'Available',
        condition: 'Good',
      };

      // Mock existing check (serial number exists)
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.limit.mockResolvedValueOnce([{ id: 'existing-serial' }]);

      await expect(
        service.createSerialNumber(createDto as any, 'company-1', 'user-1')
      ).rejects.toThrow('Serial number SN001 already exists');
    });
  });

  describe('createBatchNumber', () => {
    it('should create a batch number successfully', async () => {
      const createDto = {
        batchNumber: 'BATCH001',
        itemId: 'item-1',
        totalQty: 100,
        uom: 'PCS',
        qualityStatus: 'Approved',
      };

      const mockBatchNumber = {
        id: 'batch-1',
        ...createDto,
        availableQty: 100,
        reservedQty: 0,
        consumedQty: 0,
        isActive: true,
        companyId: 'company-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock existing check (no existing batch)
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.limit.mockResolvedValueOnce([]);

      // Mock item check (item exists with batch tracking)
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.limit.mockResolvedValueOnce([{ id: 'item-1', hasBatchNo: true }]);

      // Mock insert
      mockDb.insert.mockReturnValueOnce(mockDb);
      mockDb.values.mockReturnValueOnce(mockDb);
      mockDb.returning.mockResolvedValueOnce([mockBatchNumber]);

      // Mock history insert
      mockDb.insert.mockReturnValueOnce(mockDb);
      mockDb.values.mockResolvedValueOnce([{}]);

      const result = await service.createBatchNumber(
        createDto as any,
        'company-1',
        'user-1'
      );

      expect(result).toEqual(mockBatchNumber);
      expect(mockDb.insert).toHaveBeenCalledTimes(2); // Batch number + history
    });
  });

  describe('getSerialNumbers', () => {
    it('should return serial numbers with filters', async () => {
      const mockSerialNumbers = [
        {
          id: 'serial-1',
          serialNumber: 'SN001',
          itemId: 'item-1',
          warehouseId: 'warehouse-1',
          status: 'Available',
          condition: 'Good',
          companyId: 'company-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.orderBy.mockReturnValueOnce(mockDb);
      mockDb.limit.mockReturnValueOnce(mockDb);
      mockDb.offset.mockResolvedValueOnce(mockSerialNumbers);

      const result = await service.getSerialNumbers(
        { itemId: 'item-1' } as any,
        'company-1',
        50,
        0
      );

      expect(result).toEqual(mockSerialNumbers);
    });
  });

  describe('getExpiryAlerts', () => {
    it('should return expiring batches', async () => {
      const mockExpiringBatches = [
        {
          batchId: 'batch-1',
          batchNumber: 'BATCH001',
          itemId: 'item-1',
          itemName: 'Test Item',
          expiryDate: new Date('2024-01-15'),
          availableQty: 50,
        },
      ];

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.innerJoin.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.orderBy.mockResolvedValueOnce(mockExpiringBatches);

      const result = await service.getExpiryAlerts('company-1', 30);

      expect(result).toHaveLength(1);
      expect(result[0].batchNumber).toBe('BATCH001');
      expect(result[0].itemName).toBe('Test Item');
    });
  });

  describe('getTraceabilityReport', () => {
    it('should return traceability report', async () => {
      const query = {
        itemId: 'item-1',
        serialNumber: 'SN001',
        includeForwardTrace: true,
        includeBackwardTrace: true,
      };

      const result = await service.getTraceabilityReport(
        query as any,
        'company-1'
      );

      expect(result).toHaveProperty('itemId', 'item-1');
      expect(result).toHaveProperty('serialNumber', 'SN001');
      expect(result).toHaveProperty('forwardTrace');
      expect(result).toHaveProperty('backwardTrace');
      expect(result).toHaveProperty('affectedCustomers');
      expect(result).toHaveProperty('affectedSuppliers');
    });
  });

  describe('getRecallAnalytics', () => {
    it('should return recall analytics', async () => {
      // Mock total recalls count
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([{ count: 5 }]);

      // Mock active recalls count
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([{ count: 2 }]);

      // Mock completed recalls count
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([{ count: 3 }]);

      // Mock total affected items count
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.innerJoin.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([{ count: 100 }]);

      // Mock recovery stats
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([
        { totalRecovered: 80, totalAffected: 100 },
      ]);

      const result = await service.getRecallAnalytics('company-1');

      expect(result).toHaveProperty('totalRecalls', 5);
      expect(result).toHaveProperty('activeRecalls', 2);
      expect(result).toHaveProperty('completedRecalls', 3);
      expect(result).toHaveProperty('totalAffectedItems', 100);
      expect(result).toHaveProperty('recoveryRate', 80);
    });
  });
});
