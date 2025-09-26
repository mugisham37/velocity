import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BOMCostCalculationDto,
  BOMExplosionDto,
  BOMFilterDto,
  CreateBOMDto,
  CreateBOMVersionDto,
  UpdateBOMDto,
} from '../dto/bom.dto';
import { BOMService } from './bom.service';

// Mock the database
jest.mock('@velocity/database', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
  },
}));

jest.mock('@velocity/database/schema', () => ({
  boms: {
    id: 'id',
    bomNo: 'bomNo',
    companyId: 'companyId',
    itemId: 'itemId',
    version: 'version',
    isActive: 'isActive',
    isDefault: 'isDefault',
    bomType: 'bomType',
    createdAt: 'createdAt',
    description: 'description',
    quantity: 'quantity',
    currency: 'currency',
  },
  bomItems: {
    id: 'id',
    bomId: 'bomId',
    itemId: 'itemId',
    idx: 'idx',
    qty: 'qty',
    amount: 'amount',
  },
  bomOperations: {
    id: 'id',
    bomId: 'bomId',
    sequenceId: 'sequenceId',
    operatingCost: 'operatingCost',
  },
  bomScrapItems: {
    id: 'id',
    bomId: 'bomId',
    idx: 'idx',
  },
  bomAlternativeItems: {
    id: 'id',
    bomItemId: 'bomItemId',
    priority: 'priority',
  },
  bomUpdateLog: {
    id: 'id',
    bomId: 'bomId',
  },
  items: {
    id: 'id',
  },
}));

import { db } from '@velocity/database';

describe('BOMService', () => {
  let service: BOMService;
  let mockDb: jest.Mocked<typeof db>;

  const mockUser = { id: 'user-1' };
  const mockCompany = { id: 'company-1' };
  const mockItem = { id: 'item-1', itemCode: 'ITEM001', itemName: 'Test Item' };

  const mockBOM = {
    id: 'bom-1',
    bomNo: 'BOM001',
    itemId: 'item-1',
    companyId: 'company-1',
    version: '1.0',
    isActive: true,
    isDefault: true,
    description: 'Test BOM',
    quantity: 1,
    uom: 'Each',
    bomType: 'Manufacturing',
    withOperations: false,
    transferMaterialAgainst: 'Work Order',
    allowAlternativeItem: false,
    allowSameItemMultipleTimes: false,
    setRateOfSubAssemblyItemBasedOnBom: true,
    currency: 'USD',
    inspectionRequired: false,
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    rawMaterialCost: 100,
    operatingCost: 50,
    totalCost: 150,
  };

  const mockBOMItem = {
    id: 'bom-item-1',
    bomId: 'bom-1',
    itemId: 'item-2',
    itemCode: 'ITEM002',
    itemName: 'Component Item',
    qty: 2,
    uom: 'Pcs',
    rate: 25,
    amount: 50,
    idx: 0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BOMService],
    }).compile();

    service = module.get<BOMService>(BOMService);
    mockDb = db as jest.Mocked<typeof db>;

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createBOM', () => {
    const createBOMDto: CreateBOMDto = {
      bomNo: 'BOM001',
      itemId: 'item-1',
      companyId: 'company-1',
      uom: 'Each',
      items: [
        {
          itemId: 'item-2',
          itemCode: 'ITEM002',
          itemName: 'Component Item',
          qty: 2,
          uom: 'Pcs',
          rate: 25,
        },
      ],
    };

    it('should create a BOM successfully', async () => {
      // Mock database responses
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]), // No existing BOM
          }),
        }),
      } as any);

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockItem]), // Item exists
          }),
        }),
      } as any);

      mockDb.transaction.mockImplementation(async callback => {
        const mockTx = {
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([mockBOM]),
            }),
          }),
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]),
            }),
          }),
          update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]),
            }),
          }),
        };
        return callback(mockTx);
      });

      const result = await service.createBOM(createBOMDto, mockUser.id);

      expect(result).toEqual(mockBOM);
      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('should throw ConflictException if BOM number already exists', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockBOM]), // Existing BOM found
          }),
        }),
      } as any);

      await expect(
        service.createBOM(createBOMDto, mockUser.id)
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if item does not exist', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]), // No existing BOM
          }),
        }),
      } as any);

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]), // Item not found
          }),
        }),
      } as any);

      await expect(
        service.createBOM(createBOMDto, mockUser.id)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateBOM', () => {
    const updateBOMDto: UpdateBOMDto = {
      description: 'Updated BOM description',
      quantity: 2,
      isActive: true,
    };

    it('should update a BOM successfully', async () => {
      const updatedBOM = { ...mockBOM, ...updateBOMDto };

      // Mock findBOMById
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockBOM]),
          }),
        }),
      } as any);

      mockDb.transaction.mockImplementation(async callback => {
        const mockTx = {
          update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([updatedBOM]),
              }),
            }),
          }),
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockResolvedValue([]),
          }),
          delete: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]),
            }),
          }),
        };
        return callback(mockTx);
      });

      const result = await service.updateBOM(
        'bom-1',
        updateBOMDto,
        mockUser.id
      );

      expect(result).toEqual(updatedBOM);
      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if BOM does not exist', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]), // BOM not found
          }),
        }),
      } as any);

      await expect(
        service.updateBOM('non-existent-id', updateBOMDto, mockUser.id)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBOMById', () => {
    it('should return a BOM when found', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockBOM]),
          }),
        }),
      } as any);

      const result = await service.findBOMById('bom-1');

      expect(result).toEqual(mockBOM);
    });

    it('should throw NotFoundException when BOM not found', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      await expect(service.findBOMById('non-existent-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('findBOMs', () => {
    const filter: BOMFilterDto = {
      companyId: 'company-1',
      isActive: true,
    };

    it('should return filtered BOMs', async () => {
      const mockBOMs = [mockBOM];

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockBOMs),
          }),
        }),
      } as any);

      const result = await service.findBOMs(filter);

      expect(result).toEqual(mockBOMs);
    });

    it('should return all BOMs when no filter is provided', async () => {
      const mockBOMs = [mockBOM];

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockBOMs),
        }),
      } as any);

      const result = await service.findBOMs({});

      expect(result).toEqual(mockBOMs);
    });
  });

  describe('createBOMVersion', () => {
    const createVersionDto: CreateBOMVersionDto = {
      bomId: 'bom-1',
      newVersion: '2.0',
      changeDescription: 'Version 2.0 with improvements',
      makeDefault: true,
    };

    it('should create a new BOM version successfully', async () => {
      const newVersionBOM = { ...mockBOM, id: 'bom-2', version: '2.0' };

      // Mock findBOMById
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockBOM]),
          }),
        }),
      } as any);

      // Mock version check
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]), // No existing version
          }),
        }),
      } as any);

      mockDb.transaction.mockImplementation(async callback => {
        const mockTx = {
          update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]),
            }),
          }),
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([newVersionBOM]),
            }),
          }),
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]),
            }),
          }),
        };
        return callback(mockTx);
      });

      const result = await service.createBOMVersion(
        createVersionDto,
        mockUser.id
      );

      expect(result).toEqual(newVersionBOM);
      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('should throw ConflictException if version already exists', async () => {
      // Mock findBOMById
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockBOM]),
          }),
        }),
      } as any);

      // Mock existing version
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockResolvedValue([{ ...mockBOM, version: '2.0' }]),
          }),
        }),
      } as any);

      await expect(
        service.createBOMVersion(createVersionDto, mockUser.id)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('calculateBOMCost', () => {
    const calculationDto: BOMCostCalculationDto = {
      bomId: 'bom-1',
      includeOperations: true,
      includeScrap: true,
      quantity: 2,
    };

    it('should calculate BOM cost correctly', async () => {
      // Mock findBOMById
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockBOM]),
          }),
        }),
      } as any);

      // Mock BOM items
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([mockBOMItem]),
          }),
        }),
      } as any);

      // Mock operations
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([
              {
                timeInMins: 60,
                hourRate: 50,
              },
            ]),
          }),
        }),
      } as any);

      // Mock scrap items
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            {
              rate: 5,
              stockQty: 1,
            },
          ]),
        }),
      } as any);

      const result = await service.calculateBOMCost(calculationDto);

      expect(result).toEqual({
        materialCost: 200, // (25 * 2 * 2) * 2 quantity
        operatingCost: 100, // (60/60) * 50 * 2 quantity
        scrapCost: 10, // 5 * 1 * 2 quantity
        totalCost: 310,
        currency: 'USD',
      });
    });
  });

  describe('explodeBOM', () => {
    const explosionDto: BOMExplosionDto = {
      bomId: 'bom-1',
      quantity: 2,
      includeSubAssemblies: false,
      includeOperations: true,
      includeScrap: true,
    };

    it('should explode BOM correctly', async () => {
      // Mock BOM items
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([mockBOMItem]),
          }),
        }),
      } as any);

      // Mock cost calculation
      jest.spyOn(service, 'calculateBOMCost').mockResolvedValue({
        materialCost: 200,
        operatingCost: 100,
        scrapCost: 10,
        totalCost: 310,
        currency: 'USD',
      });

      const result = await service.explodeBOM(explosionDto);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        itemId: 'item-2',
        itemCode: 'ITEM002',
        itemName: 'Component Item',
        requiredQty: 4, // 2 * 2 (BOM qty * explosion qty)
        level: 0,
      });
      expect(result.totalQuantity).toBe(2);
      expect(result.costBreakdown.totalCost).toBe(310);
    });
  });

  describe('deleteBOM', () => {
    it('should delete a BOM successfully', async () => {
      // Mock findBOMById
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockBOM]),
          }),
        }),
      } as any);

      mockDb.transaction.mockImplementation(async callback => {
        const mockTx = {
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockResolvedValue([]),
          }),
          delete: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        };
        return callback(mockTx);
      });

      await service.deleteBOM('bom-1', mockUser.id);

      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if BOM does not exist', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      await expect(
        service.deleteBOM('non-existent-id', mockUser.id)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBOMItems', () => {
    it('should return BOM items', async () => {
      const mockItems = [mockBOMItem];

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockItems),
          }),
        }),
      } as any);

      const result = await service.getBOMItems('bom-1');

      expect(result).toEqual(mockItems);
    });
  });

  describe('getBOMOperations', () => {
    it('should return BOM operations', async () => {
      const mockOperations = [
        {
          id: 'op-1',
          bomId: 'bom-1',
          operationNo: 'OP001',
          operationName: 'Cutting',
          sequenceId: 1,
        },
      ];

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockOperations),
          }),
        }),
      } as any);

      const result = await service.getBOMOperations('bom-1');

      expect(result).toEqual(mockOperations);
    });
  });

  describe('getBOMScrapItems', () => {
    it('should return BOM scrap items', async () => {
      const mockScrapItems = [
        {
          id: 'scrap-1',
          bomId: 'bom-1',
          itemId: 'item-3',
          itemCode: 'SCRAP001',
          itemName: 'Scrap Material',
        },
      ];

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockScrapItems),
          }),
        }),
      } as any);

      const result = await service.getBOMScrapItems('bom-1');

      expect(result).toEqual(mockScrapItems);
    });
  });

  describe('getBOMAlternativeItems', () => {
    it('should return BOM alternative items', async () => {
      const mockAlternativeItems = [
        {
          id: 'alt-1',
          bomItemId: 'bom-item-1',
          alternativeItemId: 'item-4',
          alternativeItemCode: 'ALT001',
          alternativeItemName: 'Alternative Item',
          priority: 1,
        },
      ];

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockAlternativeItems),
          }),
        }),
      } as any);

      const result = await service.getBOMAlternativeItems('bom-item-1');

      expect(result).toEqual(mockAlternativeItems);
    });
  });
});
