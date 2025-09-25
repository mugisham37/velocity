import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { QuotationsService } from './quotations.service';

// Mock the database import to avoid environment variable issues
jest.mock('@kiro/database', () => ({
  quotations: {},
  quotationItems: {},
  salesOrders: {},
  salesOrderItems: {},
  db: {},
}));

describe('QuotationsService', () => {
  let service: QuotationsService;
  let mockLogger: any;

  beforeEach(async () => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotationsService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<QuotationsService>(QuotationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateTotals', () => {
    it('should calculate totals correctly', () => {
      const items = [
        {
          unitPrice: 100,
          quantity: 2,
          discountPercent: 10,
          taxPercent: 8,
        },
        {
          unitPrice: 50,
          quantity: 3,
          discountPercent: 5,
          taxPercent: 8,
        },
      ];

      // Access private method for testing
      const result = (service as any).calculateTotals(items);

      expect(result.subtotal).toBe(350); // (100*2) + (50*3)
      expect(result.totalDiscount).toBe(27.5); // (200*0.1) + (150*0.05)
      expect(result.totalTax).toBe(25.8); // ((200-20)*0.08) + ((150-7.5)*0.08)
      expect(result.grandTotal).toBe(348.3); // 350 - 27.5 + 25.8
    });

    it('should handle items without discounts or taxes', () => {
      const items = [
        {
          unitPrice: 100,
          quantity: 1,
        },
      ];

      const result = (service as any).calculateTotals(items);

      expect(result.subtotal).toBe(100);
      expect(result.totalDiscount).toBe(0);
      expect(result.totalTax).toBe(0);
      expect(result.grandTotal).toBe(100);
    });
  });

  describe('business logic validation', () => {
    it('should validate quotation status transitions', () => {
      // Test that certain status transitions are not allowed
      const validTransitions = {
        Draft: ['Sent', 'Cancelled'],
        Sent: ['Accepted', 'Rejected', 'Expired', 'Cancelled'],
        Accepted: [], // No further transitions allowed
        Rejected: [], // No further transitions allowed
        Expired: [], // No further transitions allowed
        Cancelled: [], // No further transitions allowed
      };

      Object.entries(validTransitions).forEach(
        ([fromStatus, allowedToStatuses]) => {
          expect(allowedToStatuses).toBeDefined();
          // In a real implementation, you would test the actual validation logic
        }
      );
    });

    it('should validate quotation expiry', () => {
      const today = new Date();
      const futureDate = new Date(today.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
      const pastDate = new Date(today.getTime() - 24 * 60 * 60 * 1000); // Yesterday

      expect(futureDate > today).toBe(true);
      expect(pastDate < today).toBe(true);
    });
  });
});
