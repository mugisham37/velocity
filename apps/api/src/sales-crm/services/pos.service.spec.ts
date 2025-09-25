import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { beforeEach } from 'node:test';
import { CreatePOSProfileDto } from '../dto/pos.dto';
import { POSService } from './pos.service';

// Mock DatabaseService
const mockDatabaseService = {
  db: {
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    orderBy: jest.fn().mockReturnThis(),
  },
};

describe('POSService', () => {
  let service: POSService;
  let mockLogger: any;

  const mockCompanyId = 'test-company-id';
  const mockUserId = 'test-user-id';

  beforeEach(async () => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        POSService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: 'DatabaseService',
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<POSService>(POSService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPOSProfile', () => {
    it('should create a POS profile successfully', async () => {
      const createProfileDto: CreatePOSProfileDto = {
        name: 'Test POS Profile',
        description: 'Test description',
        warehouseId: 'warehouse-1',
        cashAccount: 'cash-account-1',
        incomeAccount: 'income-account-1',
        expenseAccount: 'expense-account-1',
        currency: 'USD',
        allowDiscount: true,
        maxDiscount: 10,
        allowCreditSale: false,
        allowReturn: true,
        printReceipt: true,
        emailReceipt: false,
        offlineMode: false,
      };

      const mockProfile = {
        id: 'profile-1',
        ...createProfileDto,
        companyId: mockCompanyId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabaseService.db.returning.mockResolvedValue([mockProfile]);

      const result = await service.createPOSProfile(
        createProfileDto,
        mockCompanyId,
        mockUserId
      );

      expect(result).toEqual(mockProfile);
      expect(mockDatabaseService.db.insert).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Creating POS profile', {
        data: createProfileDto,
        companyId: mockCompanyId,
        userId: mockUserId,
      });
    });

    it('should handle errors when creating POS profile', async () => {
      const createProfileDto: CreatePOSProfileDto = {
        name: 'Test POS Profile',
        warehouseId: 'warehouse-1',
        cashAccount: 'cash-account-1',
        incomeAccount: 'income-account-1',
        expenseAccount: 'expense-account-1',
        currency: 'USD',
        allowDiscount: true,
        maxDiscount: 10,
        allowCreditSale: false,
        allowReturn: true,
        printReceipt: true,
        emailReceipt: false,
        offlineMode: false,
      };

      const error = new Error('Database error');
      mockDatabaseService.db.returning.mockRejectedValue(error);

      await expect(
        service.createPOSProfile(createProfileDto, mockCompanyId, mockUserId)
      ).rejects.toThrow('Database error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create POS profile',
        {
          error: error.message,
          data: createProfileDto,
        }
      );
    });
  });

  describe('lookupItemByBarcode', () => {
    it('should return item lookup result', async () => {
      const barcodeData = {
        barcode: '123456789',
        warehouseId: 'warehouse-1',
      };

      const result = await service.lookupItemByBarcode(
        barcodeData,
        mockCompanyId
      );

      expect(result).toBeDefined();
      expect(result?.barcode).toBe(barcodeData.barcode);
      expect(result?.itemCode).toBe('ITEM001');
      expect(result?.price).toBe(10.99);
    });
  });

  describe('getLoyaltyPointsBalance', () => {
    it('should return loyalty points balance', async () => {
      const customerId = 'customer-1';

      const result = await service.getLoyaltyPointsBalance(
        customerId,
        mockCompanyId
      );

      expect(result).toBeDefined();
      expect(result.customerId).toBe(customerId);
      expect(result.totalPoints).toBe(1000);
      expect(result.availablePoints).toBe(850);
      expect(result.redeemedPoints).toBe(150);
      expect(result.pointValue).toBe(0.01);
    });
  });
});
