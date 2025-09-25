import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import {
  CreateSalesOrderInput,
  SalesOrderStatus,
} from '../dto/sales-order.dto';
import { SalesOrdersService } from './sales-orders.service';

describe('SalesOrdersService', () => {
  let service: SalesOrdersService;
  let mockLogger: any;

  beforeEach(async () => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesOrdersService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<SalesOrdersService>(SalesOrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateTotals', () => {
    it('should calculate totals correctly with shipping and advance', () => {
      const items = [
        {
          unitPrice: 100,
          quantity: 2,
          discountPercent: 10,
          taxPercent: 8,
        },
      ];

      const result = (service as any).calculateTotals(items);

      expect(result.subtotal).toBe(200);
      expect(result.totalDiscount).toBe(20);
      expect(result.totalTax).toBe(14.4); // (200-20) * 0.08
      expect(result.grandTotal).toBe(194.4);
    });
  });

  describe('generateSalesOrderCode', () => {
    it('should generate sales order code with correct format', async () => {
      const companyId = 'test-company-id';
      const year = new Date().getFullYear();

      // Mock database query to return empty result (first order)
      jest.spyOn(service['database'], 'select').mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      } as any);

      const code = await (service as any).generateSalesOrderCode(companyId);

      expect(code).toBe(`SO-${year}-0001`);
    });
  });

  describe('createSalesOrder', () => {
    it('should create sales order with valid data', async () => {
      const mockSalesOrderData: CreateSalesOrderInput = {
        customerId: 'customer-1',
        orderDate: new Date(),
        deliveryDate: new Date('2024-12-31'),
        currency: 'USD',
        shippingCharges: 50,
        advanceAmount: 100,
        items: [
          {
            itemCode: 'ITEM001',
            itemName: 'Test Item',
            quantity: 2,
            unitPrice: 100,
            discountPercent: 10,
            taxPercent: 8,
          },
        ],
      };

      const companyId = 'test-company';
      const userId = 'test-user';

      // Mock transaction
      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const mockTx = {
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([
                {
                  id: 'sales-order-1',
                  salesOrderCode: 'SO-2024-0001',
                  ...mockSalesOrderData,
                },
              ]),
            }),
          }),
        };
        return callback(mockTx);
      });

      service.transaction = mockTransaction;

      // Mock generateSalesOrderCode
      jest
        .spyOn(service as any, 'generateSalesOrderCode')
        .mockResolvedValue('SO-2024-0001');

      const result = await service.createSalesOrder(
        mockSalesOrderData,
        companyId,
        userId
      );

      expect(result).toBeDefined();
      expect(result.salesOrderCode).toBe('SO-2024-0001');
      expect(mockLogger.info).toHaveBeenCalledWith('Creating sales order', {
        data: mockSalesOrderData,
        companyId,
        userId,
      });
    });
  });

  describe('confirmSalesOrder', () => {
    it('should only confirm approved sales orders', async () => {
      const salesOrderId = 'sales-order-1';
      const companyId = 'test-company';
      const userId = 'test-user';

      // Mock findByIdOrFail to return draft order
      jest.spyOn(service, 'findByIdOrFail').mockResolvedValue({
        id: salesOrderId,
        status: 'Draft',
      } as any);

      await expect(
        service.confirmSalesOrder(salesOrderId, companyId, userId)
      ).rejects.toThrow('Only approved sales orders can be confirmed');
    });

    it('should confirm approved sales order', async () => {
      const salesOrderId = 'sales-order-1';
      const companyId = 'test-company';
      const userId = 'test-user';

      // Mock findByIdOrFail to return approved order
      jest.spyOn(service, 'findByIdOrFail').mockResolvedValue({
        id: salesOrderId,
        status: 'Approved',
      } as any);

      // Mock update method
      jest.spyOn(service, 'update').mockResolvedValue({
        id: salesOrderId,
        status: 'Confirmed',
        confirmedAt: expect.any(Date),
      } as any);

      const result = await service.confirmSalesOrder(
        salesOrderId,
        companyId,
        userId
      );

      expect(result.status).toBe('Confirmed');
      expect(service.update).toHaveBeenCalledWith(
        salesOrderId,
        {
          status: 'Confirmed',
          confirmedAt: expect.any(Date),
        },
        companyId
      );
    });
  });

  describe('updateSalesOrder', () => {
    it('should not allow updating delivered or cancelled orders', async () => {
      const salesOrderId = 'sales-order-1';
      const updateData = { status: SalesOrderStatus.CONFIRMED };
      const companyId = 'test-company';
      const userId = 'test-user';

      // Mock findByIdOrFail to return delivered order
      jest.spyOn(service, 'findByIdOrFail').mockResolvedValue({
        id: salesOrderId,
        status: 'Delivered',
      } as any);

      await expect(
        service.updateSalesOrder(salesOrderId, updateData, companyId, userId)
      ).rejects.toThrow('Cannot update sales order with status: Delivered');
    });
  });

  describe('getOrderFulfillment', () => {
    it('should calculate fulfillment percentages correctly', async () => {
      const salesOrderId = 'sales-order-1';
      const companyId = 'test-company';

      const mockSalesOrderWithItems = {
        id: salesOrderId,
        salesOrderCode: 'SO-2024-0001',
        items: [
          {
            id: 'item-1',
            itemCode: 'ITEM001',
            itemName: 'Test Item 1',
            quantity: '10',
            deliveredQuantity: '8',
          },
          {
            id: 'item-2',
            itemCode: 'ITEM002',
            itemName: 'Test Item 2',
            quantity: '5',
            deliveredQuantity: '5',
          },
        ],
      };

      jest
        .spyOn(service, 'getSalesOrderWithItems')
        .mockResolvedValue(mockSalesOrderWithItems as any);

      const result = await service.getOrderFulfillment(salesOrderId, companyId);

      expect(result.totalQuantity).toBe(15);
      expect(result.deliveredQuantity).toBe(13);
      expect(result.pendingQuantity).toBe(2);
      expect(result.fulfillmentPercentage).toBeCloseTo(86.67, 2);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].fulfillmentPercentage).toBe(80);
      expect(result.items[1].fulfillmentPercentage).toBe(100);
    });
  });

  describe('processOrderAmendment', () => {
    it('should not allow amending delivered or cancelled orders', async () => {
      const amendmentData = {
        salesOrderId: 'sales-order-1',
        amendmentReason: 'Customer request',
        newItems: [],
      };
      const companyId = 'test-company';
      const userId = 'test-user';

      // Mock findByIdOrFail to return delivered order
      jest.spyOn(service, 'findByIdOrFail').mockResolvedValue({
        id: amendmentData.salesOrderId,
        status: 'Delivered',
      } as any);

      await expect(
        service.processOrderAmendment(amendmentData, companyId, userId)
      ).rejects.toThrow('Cannot amend sales order with status: Delivered');
    });
  });
});
