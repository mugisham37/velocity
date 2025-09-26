import { DatabaseService } from '@kiro/database';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach } from 'node:test';
import { StockTransactionService } from './stock-transaction.service';

describe('StockTransactionService', () => {
  let service: StockTransactionService;
  let mockDb: jest.Mocked<DatabaseService>;

  const mockCompanyId = 'company-123';
  const mockUserId = 'user-123';
  const mockWarehouseId = 'warehouse-123';
  const mockItemId = 'item-123';

  beforeEach(async () => {
    const mockDbService = {
      query: {
        stockEntries: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
        stockReservations: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
        stockReconciliations: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
        stockLevels: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
        stockLedgerEntries: {
          findMany: jest.fn(),
        },
        warehouses: {
          findFirst: jest.fn(),
        },
        items: {
          findMany: jest.fn(),
        },
      },
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{}]),
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{}]),
          }),
        }),
      }),
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockTransactionService,
        {
          provide: DatabaseService,
          useValue: mockDbService,
        },
      ],
    }).compile();

    service = module.get<StockTransactionService>(StockTransactionService);
    mockDb = module.get(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createStockEntry', () => {
    const createStockEntryDto = {
      entryNumber: 'SE-001',
      entryType: 'Receipt' as const,
      transactionDate: '2024-01-01T00:00:00Z',
      postingDate: '2024-01-01T00:00:00Z',
      warehouseId: mockWarehouseId,
      items: [
        {
          itemId: mockItemId,
          qty: 10,
          uom: 'Nos',
          valuationRate: 100,
        },
      ],
      companyId: mockCompanyId,
    };

    it('should create a stock entry successfully', async () => {
      // Mock that entry number doesn't exist
      mockDb.query.stockEntries.findFirst.mockResolvedValue(null);

      // Mock warehouse exists
      mockDb.query.warehouses.findFirst.mockResolvedValue({
        id: mockWarehouseId,
        companyId: mockCompanyId,
      });

      // Mock items exist
      mockDb.query.items.findMany.mockResolvedValue([
        { id: mockItemId, companyId: mockCompanyId },
      ]);

      // Mock current stock level
      mockDb.query.stockLevels.findFirst.mockResolvedValue({
        actualQty: '0',
        reservedQty: '0',
      });

      const result = await service.createStockEntry(
        createStockEntryDto,
        mockUserId
      );

      expect(mockDb.query.stockEntries.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object),
        })
      );
      expect(result).toBeDefined();
    });

    it('should throw ConflictException if entry number already exists', async () => {
      // Mock that entry number exists
      mockDb.query.stockEntries.findFirst.mockResolvedValue({
        id: 'existing-entry',
        entryNumber: 'SE-001',
      });

      await expect(
        service.createStockEntry(createStockEntryDto, mockUserId)
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if warehouse not found', async () => {
      // Mock that entry number doesn't exist
      mockDb.query.stockEntries.findFirst.mockResolvedValue(null);

      // Mock warehouse doesn't exist
      mockDb.query.warehouses.findFirst.mockResolvedValue(null);

      await expect(
        service.createStockEntry(createStockEntryDto, mockUserId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createStockReservation', () => {
    const createReservationDto = {
      itemId: mockItemId,
      warehouseId: mockWarehouseId,
      reservationType: 'Sales Order' as const,
      referenceType: 'Sales Order',
      referenceNumber: 'SO-001',
      referenceId: 'so-123',
      reservedQty: 5,
      uom: 'Nos',
      reservationDate: '2024-01-01T00:00:00Z',
      companyId: mockCompanyId,
    };

    it('should create a stock reservation successfully', async () => {
      // Mock item and warehouse exist
      mockDb.query.items.findMany.mockResolvedValue([
        { id: mockItemId, companyId: mockCompanyId },
      ]);
      mockDb.query.warehouses.findFirst.mockResolvedValue({
        id: mockWarehouseId,
        companyId: mockCompanyId,
      });

      // Mock available stock
      mockDb.query.stockLevels.findFirst.mockResolvedValue({
        actualQty: '10',
        reservedQty: '0',
      });

      const result = await service.createStockReservation(
        createReservationDto,
        mockUserId
      );

      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      // Mock item and warehouse exist
      mockDb.query.items.findMany.mockResolvedValue([
        { id: mockItemId, companyId: mockCompanyId },
      ]);
      mockDb.query.warehouses.findFirst.mockResolvedValue({
        id: mockWarehouseId,
        companyId: mockCompanyId,
      });

      // Mock insufficient stock
      mockDb.query.stockLevels.findFirst.mockResolvedValue({
        actualQty: '2',
        reservedQty: '0',
      });

      await expect(
        service.createStockReservation(createReservationDto, mockUserId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStockLevels', () => {
    it('should return stock levels for given query', async () => {
      const queryDto = {
        itemId: mockItemId,
        warehouseId: mockWarehouseId,
      };

      const mockStockLevels = [
        {
          id: 'level-1',
          itemId: mockItemId,
          warehouseId: mockWarehouseId,
          actualQty: '10',
          reservedQty: '2',
        },
      ];

      mockDb.query.stockLevels.findMany.mockResolvedValue(mockStockLevels);

      const result = await service.getStockLevels(queryDto, mockCompanyId);

      expect(result).toEqual(mockStockLevels);
      expect(mockDb.query.stockLevels.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object),
          with: expect.any(Object),
          orderBy: expect.any(Array),
        })
      );
    });
  });

  describe('getAvailableStock', () => {
    it('should return available stock quantity', async () => {
      mockDb.query.stockLevels.findFirst.mockResolvedValue({
        actualQty: '10',
        reservedQty: '3',
      });

      const result = await service.getAvailableStock(
        mockItemId,
        mockWarehouseId
      );

      expect(result).toBe(7); // 10 - 3
    });

    it('should return 0 if no stock level exists', async () => {
      mockDb.query.stockLevels.findFirst.mockResolvedValue(null);

      const result = await service.getAvailableStock(
        mockItemId,
        mockWarehouseId
      );

      expect(result).toBe(0); // 0 - 0
    });
  });

  describe('getStockEntries', () => {
    it('should return paginated stock entries', async () => {
      const filterDto = {
        page: 1,
        limit: 10,
        entryType: 'Receipt' as const,
      };

      const mockEntries = [
        {
          id: 'entry-1',
          entryNumber: 'SE-001',
          entryType: 'Receipt',
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

      mockDb.query.stockEntries.findMany.mockResolvedValue(mockEntries);

      const result = await service.getStockEntries(filterDto, mockCompanyId);

      expect(result).toEqual({
        entries: mockEntries,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });
});
