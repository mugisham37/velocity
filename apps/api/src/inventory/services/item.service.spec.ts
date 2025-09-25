import { DatabaseService } from '@kiro/database';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateItemDto, UpdateItemDto } from '../dto/item.dto';
import { ItemService } from './item.service';

describe('ItemService', () => {
  let service: ItemService;
  let mockDb: any;

  const mockCompanyId = 'company-123';
  const mockUserId = 'user-123';
  const mockItemId = 'item-123';

  beforeEach(async () => {
    const mockDbService = {
      query: {
        items: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        itemCategories: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        itemAttributes: {
          findMany: vi.fn(),
        },
        itemAttributeValues: {
          findFirst: vi.fn(),
        },
        itemVariants: {
          findMany: vi.fn(),
        },
        itemCrossReferences: {
          findMany: vi.fn(),
        },
        itemDocuments: {
          findMany: vi.fn(),
        },
        itemLifecycle: {
          findMany: vi.fn(),
        },
        itemPricingTiers: {
          findMany: vi.fn(),
        },
      },
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn(),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn(),
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn(),
      }),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemService,
        {
          provide: DatabaseService,
          useValue: mockDbService,
        },
      ],
    }).compile();

    service = module.get<ItemService>(ItemService);
    mockDb = module.get(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createItem', () => {
    const createItemDto: CreateItemDto = {
      itemCode: 'ITEM001',
      itemName: 'Test Item',
      stockUom: 'Nos',
      companyId: mockCompanyId,
    };

    it('should create an item successfully', async () => {
      const expectedItem = {
        id: mockItemId,
        ...createItemDto,
        createdBy: mockUserId,
        updatedBy: mockUserId,
      };

      mockDb.query.items.findFirst.mockResolvedValue(null); // No existing item
      mockDb.insert().values().returning.mockResolvedValue([expectedItem]);

      const result = await service.createItem(createItemDto, mockUserId);

      expect(result).toEqual(expectedItem);
      expect(mockDb.query.items.findFirst).toHaveBeenCalledWith({
        where: expect.any(Object),
      });
    });

    it('should throw ConflictException if item code already exists', async () => {
      const existingItem = { id: 'existing-item', itemCode: 'ITEM001' };
      mockDb.query.items.findFirst.mockResolvedValue(existingItem);

      await expect(
        service.createItem(createItemDto, mockUserId)
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if category does not exist', async () => {
      const createItemWithCategoryDto = {
        ...createItemDto,
        categoryId: 'non-existent-category',
      };

      mockDb.query.items.findFirst.mockResolvedValue(null);
      mockDb.query.itemCategories.findFirst.mockResolvedValue(null);

      await expect(
        service.createItem(createItemWithCategoryDto, mockUserId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateItem', () => {
    const updateItemDto: UpdateItemDto = {
      itemName: 'Updated Item Name',
      standardRate: 100,
    };

    it('should update an item successfully', async () => {
      const existingItem = {
        id: mockItemId,
        itemCode: 'ITEM001',
        companyId: mockCompanyId,
      };
      const updatedItem = { ...existingItem, ...updateItemDto };

      mockDb.query.items.findFirst.mockResolvedValue(existingItem);
      mockDb.update().set().where().returning.mockResolvedValue([updatedItem]);

      const result = await service.updateItem(
        mockItemId,
        updateItemDto,
        mockUserId
      );

      expect(result).toEqual(updatedItem);
    });

    it('should throw NotFoundException if item does not exist', async () => {
      mockDb.query.items.findFirst.mockResolvedValue(null);

      await expect(
        service.updateItem(mockItemId, updateItemDto, mockUserId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getItem', () => {
    it('should return an item with relations', async () => {
      const mockItem = {
        id: mockItemId,
        itemCode: 'ITEM001',
        itemName: 'Test Item',
        category: { id: 'cat-1', categoryName: 'Category 1' },
        attributeValues: [],
        documents: [],
        lifecycle: [],
        crossReferences: [],
        pricingTiers: [],
      };

      mockDb.query.items.findFirst.mockResolvedValue(mockItem);

      const result = await service.getItem(mockItemId);

      expect(result).toEqual(mockItem);
      expect(mockDb.query.items.findFirst).toHaveBeenCalledWith({
        where: expect.any(Object),
        with: expect.any(Object),
      });
    });

    it('should throw NotFoundException if item does not exist', async () => {
      mockDb.query.items.findFirst.mockResolvedValue(null);

      await expect(service.getItem(mockItemId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getItems', () => {
    it('should return paginated items', async () => {
      const mockItems = [
        { id: 'item-1', itemName: 'Item 1' },
        { id: 'item-2', itemName: 'Item 2' },
      ];

      mockDb
        .select()
        .from()
        .where.mockResolvedValue([{ count: 2 }]);
      mockDb.query.items.findMany.mockResolvedValue(mockItems);

      const result = await service.getItems(
        { page: 1, limit: 20 },
        mockCompanyId
      );

      expect(result).toEqual({
        items: mockItems,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });
  });

  describe('searchItems', () => {
    it('should return items matching search term', async () => {
      const mockItems = [
        { id: 'item-1', itemName: 'Test Item 1', itemCode: 'TEST001' },
      ];

      mockDb.query.items.findMany.mockResolvedValue(mockItems);

      const result = await service.searchItems('test', mockCompanyId, 10);

      expect(result).toEqual(mockItems);
      expect(mockDb.query.items.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        limit: 10,
        orderBy: expect.any(Object),
      });
    });
  });

  describe('createItemCategory', () => {
    const createCategoryDto = {
      categoryCode: 'CAT001',
      categoryName: 'Test Category',
      companyId: mockCompanyId,
    };

    it('should create a category successfully', async () => {
      const expectedCategory = { id: 'cat-1', ...createCategoryDto };

      mockDb.query.itemCategories.findFirst.mockResolvedValue(null);
      mockDb.insert().values().returning.mockResolvedValue([expectedCategory]);

      const result = await service.createItemCategory(createCategoryDto);

      expect(result).toEqual(expectedCategory);
    });

    it('should throw ConflictException if category code already exists', async () => {
      const existingCategory = { id: 'cat-1', categoryCode: 'CAT001' };
      mockDb.query.itemCategories.findFirst.mockResolvedValue(existingCategory);

      await expect(
        service.createItemCategory(createCategoryDto)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('createItemCrossReference', () => {
    const createCrossRefDto = {
      itemId: 'item-1',
      referenceItemId: 'item-2',
      referenceType: 'Substitute' as any,
    };

    it('should create cross reference successfully', async () => {
      const mockItem1 = { id: 'item-1', itemName: 'Item 1' };
      const mockItem2 = { id: 'item-2', itemName: 'Item 2' };
      const expectedCrossRef = { id: 'ref-1', ...createCrossRefDto };

      mockDb.query.items.findFirst
        .mockResolvedValueOnce(mockItem1)
        .mockResolvedValueOnce(mockItem2);
      mockDb.insert().values().returning.mockResolvedValue([expectedCrossRef]);

      const result = await service.createItemCrossReference(createCrossRefDto);

      expect(result).toEqual(expectedCrossRef);
    });

    it('should throw BadRequestException if item references itself', async () => {
      const selfReferenceDto = {
        ...createCrossRefDto,
        referenceItemId: 'item-1',
      };

      const mockItem = { id: 'item-1', itemName: 'Item 1' };
      mockDb.query.items.findFirst.mockResolvedValue(mockItem);

      await expect(
        service.createItemCrossReference(selfReferenceDto)
      ).rejects.toThrow(BadRequestException);
    });
  });
});
