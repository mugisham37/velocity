import {
  type NewVendorBill,
  type VendorBill,
  type VendorPayment,
  accounts,
  billLineItems,
  billNumberingSeries,
  glEntries,
  journalEntries,
  threeWayMatching,
  vendorBills,
  vendorPaymentAllocations,
  vendorPayments,
  vendors,
  and,
  eq,
  lte,
  sql,
  type SQL,
} from '../database';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger } from 'winston';
import { AuditService } from '../common/services/audit.service';
import { BaseService } from '../common/services/base.service';
import { CacheService } from '../common/services/cache.service';
import { PerformanceMonitorService } from '../common/services/performance-monitor.service';

export interface CreateVendorBillDto {
  vendorId: string;
  vendorBillNumber?: string;
  billDate: Date;
  dueDate: Date;
  currency?: string;
  exchangeRate?: number;
  terms?: string;
  notes?: string;
  templateId?: string;
  purchaseOrderId?: string;
  receiptId?: string;
  lineItems: {
    itemCode?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    taxPercent?: number;
    accountId?: string;
    purchaseOrderLineId?: string;
    receiptLineId?: string;
  }[];
}

export interface CreateVendorPaymentDto {
  vendorId: string;
  paymentDate: Date;
  amount: number;
  currency?: string;
  exchangeRate?: number;
  paymentMethod: string;
  reference?: string;
  bankAccountId?: string;
  checkNumber?: string;
  scheduledDate?: Date;
  notes?: string;
  allocations?: {
    billId: string;
    amount: number;
  }[];
}

export interface VendorAgingBucket {
  current: number;
  days30: number;
  days60: number;
  days90: number;
  over90: number;
  total: number;
}

export interface VendorAgingReport {
  vendorId: string;
  vendorName: string;
  aging: VendorAgingBucket;
  bills: {
    id: string;
    billNumber: string;
    billDate: Date;
    dueDate: Date;
    totalAmount: number;
    outstandingAmount: number;
    daysOverdue: number;
  }[];
}

export interface ThreeWayMatchResult {
  isMatched: boolean;
  quantityVariance: number;
  priceVariance: number;
  totalVariance: number;
  toleranceExceeded: boolean;
  exceptions: string[];
}

@Injectable()
export class AccountsPayableService extends BaseService<
  any,
  VendorBill,
  NewVendorBill,
  Partial<NewVendorBill>
> {
  protected table = vendorBills as any;
  protected tableName = 'vendor_bills';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    logger: Logger,
    private readonly auditService: AuditService,
    protected override readonly cacheService: CacheService,
    protected override readonly performanceMonitor: PerformanceMonitorService
  ) {
    super(logger, cacheService, performanceMonitor);
  }

  /**
   * Create vendor bill with line items and automatic GL posting
   */
  async createVendorBill(
    data: CreateVendorBillDto,
    companyId: string,
    userId: string
  ): Promise<VendorBill> {
    return await this.transaction(async tx => {
      // Validate vendor
      const [vendor] = await tx
        .select()
        .from(vendors)
        .where(
          and(eq(vendors.id, data.vendorId), eq(vendors.companyId, companyId))
        )
        .limit(1);

      if (!vendor) {
        throw new BadRequestException('Vendor not found');
      }

      // Calculate totals
      let subtotal = 0;
      let totalTaxAmount = 0;
      let totalDiscountAmount = 0;

      const processedLineItems = data.lineItems.map(item => {
        const lineSubtotal = item.quantity * item.unitPrice;
        const discountAmount =
          (lineSubtotal * (item.discountPercent || 0)) / 100;
        const taxableAmount = lineSubtotal - discountAmount;
        const taxAmount = (taxableAmount * (item.taxPercent || 0)) / 100;
        const lineTotal = taxableAmount + taxAmount;

        subtotal += lineSubtotal;
        totalDiscountAmount += discountAmount;
        totalTaxAmount += taxAmount;

        return {
          ...item,
          discountAmount,
          taxAmount,
          lineTotal,
        };
      });

      const totalAmount = subtotal - totalDiscountAmount + totalTaxAmount;

      // Generate bill number
      const billNumber = await this.generateBillNumber(companyId);

      // Create bill
      const [bill] = await tx
        .insert(vendorBills)
        .values({
          billNumber,
          vendorBillNumber: data.vendorBillNumber || null,
          vendorId: data.vendorId,
          billDate: data.billDate,
          dueDate: data.dueDate,
          currency: data.currency || 'USD',
          exchangeRate: data.exchangeRate?.toString() || '1.0000',
          subtotal: subtotal.toString(),
          taxAmount: totalTaxAmount.toString(),
          discountAmount: totalDiscountAmount.toString(),
          totalAmount: totalAmount.toString(),
          outstandingAmount: totalAmount.toString(),
          status: 'submitted',
          approvalStatus: 'pending',
          terms: data.terms || null,
          notes: data.notes || null,
          templateId: data.templateId || null,
          purchaseOrderId: data.purchaseOrderId || null,
          receiptId: data.receiptId || null,
          matchingStatus:
            data.purchaseOrderId && data.receiptId
              ? 'unmatched'
              : 'fully_matched',
          companyId,
          createdBy: userId,
        })
        .returning();

      if (!bill) {
        throw new BadRequestException('Failed to create vendor bill');
      }

      // Create line items
      const lineItemPromises = processedLineItems.map(item =>
        tx.insert(billLineItems).values({
          billId: bill.id,
          itemCode: item.itemCode || null,
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          discountPercent: (item.discountPercent || 0).toString(),
          discountAmount: item.discountAmount.toString(),
          taxPercent: (item.taxPercent || 0).toString(),
          taxAmount: item.taxAmount.toString(),
          lineTotal: item.lineTotal.toString(),
          accountId: item.accountId || null,
          purchaseOrderLineId: item.purchaseOrderLineId || null,
          receiptLineId: item.receiptLineId || null,
          companyId,
        })
      );

      await Promise.all(lineItemPromises);

      // Perform three-way matching if applicable
      if (data.purchaseOrderId && data.receiptId) {
        await this.performThreeWayMatching(
          bill.id,
          data.purchaseOrderId,
          data.receiptId,
          companyId,
          userId,
          tx
        );
      }

      // Create GL entries (only if approved)
      if (bill.approvalStatus === 'approved') {
        await this.createBillGLEntries(
          bill,
          processedLineItems,
          companyId,
          userId,
          tx
        );
      }

      // Log audit trail
      await this.auditService.logAudit({
        entityType: 'vendor_bills',
        entityId: bill.id,
        action: 'CREATE',
        newValues: { ...bill, lineItems: processedLineItems },
        companyId,
        userId,
      });

      return bill;
    });
  }

  /**
   * Record vendor payment with automatic allocation
   */
  async recordVendorPayment(
    data: CreateVendorPaymentDto,
    companyId: string,
    userId: string
  ): Promise<VendorPayment> {
    return await this.transaction(async tx => {
      // Validate vendor
      const [vendor] = await tx
        .select()
        .from(vendors)
        .where(
          and(eq(vendors.id, data.vendorId), eq(vendors.companyId, companyId))
        )
        .limit(1);

      if (!vendor) {
        throw new BadRequestException('Vendor not found');
      }

      // Generate payment number
      const paymentNumber = await this.generatePaymentNumber(companyId);

      // Calculate allocated and unallocated amounts
      const totalAllocated =
        data.allocations?.reduce((sum, alloc) => sum + alloc.amount, 0) || 0;
      const unallocatedAmount = data.amount - totalAllocated;

      // Create payment
      const [payment] = await tx
        .insert(vendorPayments)
        .values({
          paymentNumber,
          vendorId: data.vendorId,
          paymentDate: data.paymentDate,
          amount: data.amount.toString(),
          currency: data.currency || 'USD',
          exchangeRate: data.exchangeRate?.toString() || '1.0000',
          paymentMethod: data.paymentMethod,
          reference: data.reference || null,
          bankAccountId: data.bankAccountId || null,
          checkNumber: data.checkNumber || null,
          status: data.scheduledDate ? 'scheduled' : 'completed',
          scheduledDate: data.scheduledDate || null,
          processedDate: data.scheduledDate ? null : data.paymentDate,
          notes: data.notes || null,
          allocatedAmount: totalAllocated.toString(),
          unallocatedAmount: unallocatedAmount.toString(),
          companyId,
          createdBy: userId,
        })
        .returning();

      if (!payment) {
        throw new BadRequestException('Failed to create payment');
      }

      // Create allocations if provided
      if (data.allocations && data.allocations.length > 0) {
        await this.allocateVendorPayment(
          payment.id,
          data.allocations,
          companyId,
          userId,
          tx
        );
      } else {
        // Auto-allocate to oldest bills
        await this.autoAllocateVendorPayment(
          payment.id,
          data.vendorId,
          data.amount,
          companyId,
          userId,
          tx
        );
      }

      // Create GL entries for payment
      await this.createPaymentGLEntries(payment, companyId, userId, tx);

      // Log audit trail
      await this.auditService.logAudit({
        entityType: 'vendor_payments',
        entityId: payment.id,
        action: 'CREATE',
        newValues: { ...payment, allocations: data.allocations },
        companyId,
        userId,
      });

      return payment;
    });
  }

  /**
   * Allocate vendor payment to specific bills
   */
  async allocateVendorPayment(
    paymentId: string,
    allocations: { billId: string; amount: number }[],
    companyId: string,
    userId: string,
    tx?: any
  ): Promise<void> {
    const database = tx || this.database;

    for (const allocation of allocations) {
      // Validate bill
      const [bill] = await database
        .select()
        .from(vendorBills)
        .where(
          and(
            eq(vendorBills.id, allocation.billId),
            eq(vendorBills.companyId, companyId)
          )
        )
        .limit(1);

      if (!bill) {
        throw new BadRequestException(`Bill ${allocation.billId} not found`);
      }

      const outstandingAmount = parseFloat(bill.outstandingAmount);
      if (allocation.amount > outstandingAmount) {
        throw new BadRequestException(
          `Allocation amount ${allocation.amount} exceeds outstanding amount ${outstandingAmount}`
        );
      }

      // Create allocation record
      await database.insert(vendorPaymentAllocations).values({
        paymentId,
        billId: allocation.billId,
        allocatedAmount: allocation.amount.toString(),
        companyId,
        createdBy: userId,
      });

      // Update bill outstanding amount
      const newOutstanding = outstandingAmount - allocation.amount;
      const newStatus = newOutstanding === 0 ? 'paid' : 'partially_paid';

      await database
        .update(vendorBills)
        .set({
          paidAmount: sql`${vendorBills.paidAmount} + ${allocation.amount}`,
          outstandingAmount: newOutstanding.toString(),
          status: newStatus,
        })
        .where(eq(vendorBills.id, allocation.billId));
    }
  }

  /**
   * Generate vendor aging report
   */
  async generateVendorAgingReport(
    companyId: string,
    vendorId?: string,
    asOfDate?: Date
  ): Promise<VendorAgingReport[]> {
    const reportDate = asOfDate || new Date();
    const conditions: SQL[] = [eq(vendorBills.companyId, companyId)];

    if (vendorId) {
      conditions.push(eq(vendorBills.vendorId, vendorId));
    }

    // Get all outstanding bills
    const outstandingBills = await this.database
      .select({
        billId: vendorBills.id,
        billNumber: vendorBills.billNumber,
        vendorId: vendorBills.vendorId,
        vendorName: vendors.vendorName,
        billDate: vendorBills.billDate,
        dueDate: vendorBills.dueDate,
        totalAmount: vendorBills.totalAmount,
        outstandingAmount: vendorBills.outstandingAmount,
      })
      .from(vendorBills)
      .innerJoin(vendors, eq(vendorBills.vendorId, vendors.id))
      .where(
        and(
          ...conditions,
          sql`${vendorBills.outstandingAmount} > 0`,
          lte(vendorBills.billDate, reportDate)
        )
      )
      .orderBy(vendors.vendorName, vendorBills.dueDate);

    // Group by vendor and calculate aging buckets
    const vendorMap = new Map<string, VendorAgingReport>();

    for (const bill of outstandingBills) {
      const daysOverdue = Math.max(
        0,
        Math.floor(
          (reportDate.getTime() - bill.dueDate.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );

      const outstandingAmount = parseFloat(bill.outstandingAmount);

      if (!vendorMap.has(bill.vendorId)) {
        vendorMap.set(bill.vendorId, {
          vendorId: bill.vendorId,
          vendorName: bill.vendorName,
          aging: {
            current: 0,
            days30: 0,
            days60: 0,
            days90: 0,
            over90: 0,
            total: 0,
          },
          bills: [],
        });
      }

      const vendorReport = vendorMap.get(bill.vendorId)!;

      // Add to appropriate aging bucket
      if (daysOverdue <= 0) {
        vendorReport.aging.current += outstandingAmount;
      } else if (daysOverdue <= 30) {
        vendorReport.aging.days30 += outstandingAmount;
      } else if (daysOverdue <= 60) {
        vendorReport.aging.days60 += outstandingAmount;
      } else if (daysOverdue <= 90) {
        vendorReport.aging.days90 += outstandingAmount;
      } else {
        vendorReport.aging.over90 += outstandingAmount;
      }

      vendorReport.aging.total += outstandingAmount;

      vendorReport.bills.push({
        id: bill.billId,
        billNumber: bill.billNumber,
        billDate: bill.billDate,
        dueDate: bill.dueDate,
        totalAmount: parseFloat(bill.totalAmount),
        outstandingAmount,
        daysOverdue,
      });
    }

    return Array.from(vendorMap.values());
  }

  /**
   * Perform three-way matching
   */
  async performThreeWayMatching(
    billId: string,
    purchaseOrderId: string,
    receiptId: string,
    companyId: string,
    userId: string,
    tx?: any
  ): Promise<ThreeWayMatchResult> {
    const database = tx || this.database;

    // TODO: Implement actual three-way matching logic
    // This would involve comparing:
    // 1. Purchase Order quantities and prices
    // 2. Receipt quantities and dates
    // 3. Bill quantities and prices

    // For now, create a basic matching record
    const [matching] = await database
      .insert(threeWayMatching)
      .values({
        billId,
        purchaseOrderId,
        receiptId,
        matchingStatus: 'fully_matched', // This would be determined by actual matching logic
        quantityVariance: '0',
        priceVariance: '0',
        totalVariance: '0',
        toleranceExceeded: false,
        matchedBy: userId,
        matchedAt: new Date(),
        companyId,
      })
      .returning();

    // Update bill matching status
    await database
      .update(vendorBills)
      .set({ matchingStatus: matching.matchingStatus })
      .where(eq(vendorBills.id, billId));

    return {
      isMatched: matching.matchingStatus === 'fully_matched',
      quantityVariance: parseFloat(matching.quantityVariance),
      priceVariance: parseFloat(matching.priceVariance),
      totalVariance: parseFloat(matching.totalVariance),
      toleranceExceeded: matching.toleranceExceeded,
      exceptions: [], // Would be populated based on actual matching logic
    };
  }

  /**
   * Process scheduled payments
   */
  async processScheduledPayments(
    companyId: string,
    _userId: string
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get scheduled payments due today
    const scheduledPayments = await this.database
      .select()
      .from(vendorPayments)
      .where(
        and(
          eq(vendorPayments.companyId, companyId),
          eq(vendorPayments.status, 'scheduled'),
          lte(vendorPayments.scheduledDate, today)
        )
      );

    for (const payment of scheduledPayments) {
      // Update payment status to processing
      await this.database
        .update(vendorPayments)
        .set({
          status: 'processing',
          processedDate: new Date(),
        })
        .where(eq(vendorPayments.id, payment.id));

      try {
        // TODO: Integrate with actual payment processing system
        // For now, just mark as completed
        await this.database
          .update(vendorPayments)
          .set({
            status: 'completed',
          })
          .where(eq(vendorPayments.id, payment.id));

        this.logger.info('Scheduled payment processed', {
          paymentId: payment.id,
          amount: payment.amount,
          vendorId: payment.vendorId,
        });
      } catch (error) {
        // Mark payment as failed
        await this.database
          .update(vendorPayments)
          .set({
            status: 'failed',
          })
          .where(eq(vendorPayments.id, payment.id));

        this.logger.error('Failed to process scheduled payment', {
          paymentId: payment.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Private helper methods
   */
  private async generateBillNumber(companyId: string): Promise<string> {
    // Get default numbering series
    const [series] = await this.database
      .select()
      .from(billNumberingSeries)
      .where(
        and(
          eq(billNumberingSeries.companyId, companyId),
          eq(billNumberingSeries.isDefault, true),
          eq(billNumberingSeries.isActive, true)
        )
      )
      .limit(1);

    if (!series) {
      // Create default series if none exists
      const [newSeries] = await this.database
        .insert(billNumberingSeries)
        .values({
          seriesName: 'Default',
          prefix: 'BILL-',
          currentNumber: 1,
          padLength: 6,
          isDefault: true,
          isActive: true,
          companyId,
        })
        .returning();

      if (!newSeries) {
        throw new BadRequestException(
          'Failed to create default numbering series'
        );
      }

      const billNumber = `${newSeries.prefix}${newSeries.currentNumber
        .toString()
        .padStart(newSeries.padLength, '0')}${newSeries.suffix || ''}`;

      // Update current number
      await this.database
        .update(billNumberingSeries)
        .set({ currentNumber: newSeries.currentNumber + 1 })
        .where(eq(billNumberingSeries.id, newSeries.id));

      return billNumber;
    }

    const billNumber = `${series.prefix}${series.currentNumber
      .toString()
      .padStart(series.padLength, '0')}${series.suffix || ''}`;

    // Update current number
    await this.database
      .update(billNumberingSeries)
      .set({ currentNumber: series.currentNumber + 1 })
      .where(eq(billNumberingSeries.id, series.id));

    return billNumber;
  }

  private async generatePaymentNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `VPAY-${year}-`;

    const [result] = await this.database
      .select({
        maxNumber: sql<string>`MAX(CAST(SUBSTRING(${vendorPayments.paymentNumber}, ${prefix.length + 1}) AS INTEGER))`,
      })
      .from(vendorPayments)
      .where(
        and(
          eq(vendorPayments.companyId, companyId),
          sql`${vendorPayments.paymentNumber} LIKE ${prefix + '%'}`
        )
      );

    const nextNumber = result && result['maxNumber'] ? parseInt(result['maxNumber'] as string) + 1 : 1;
    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }

  private async autoAllocateVendorPayment(
    paymentId: string,
    vendorId: string,
    paymentAmount: number,
    companyId: string,
    userId: string,
    tx: any
  ): Promise<void> {
    // Get oldest outstanding bills
    const outstandingBills = await tx
      .select()
      .from(vendorBills)
      .where(
        and(
          eq(vendorBills.vendorId, vendorId),
          eq(vendorBills.companyId, companyId),
          sql`${vendorBills.outstandingAmount} > 0`
        )
      )
      .orderBy(vendorBills.dueDate);

    let remainingAmount = paymentAmount;
    const allocations: { billId: string; amount: number }[] = [];

    for (const bill of outstandingBills) {
      if (remainingAmount <= 0) break;

      const outstandingAmount = parseFloat(bill.outstandingAmount);
      const allocationAmount = Math.min(remainingAmount, outstandingAmount);

      allocations.push({
        billId: bill.id,
        amount: allocationAmount,
      });

      remainingAmount -= allocationAmount;
    }

    if (allocations.length > 0) {
      await this.allocateVendorPayment(
        paymentId,
        allocations,
        companyId,
        userId,
        tx
      );
    }

    // Update payment unallocated amount
    await tx
      .update(vendorPayments)
      .set({
        allocatedAmount: (paymentAmount - remainingAmount).toString(),
        unallocatedAmount: remainingAmount.toString(),
      })
      .where(eq(vendorPayments.id, paymentId));
  }

  private async createBillGLEntries(
    bill: VendorBill,
    lineItems: any[],
    companyId: string,
    userId: string,
    tx: any
  ): Promise<void> {
    // Generate journal entry number
    const entryNumber = await this.generateJournalEntryNumber(companyId);

    // Create journal entry
    const [journalEntry] = await tx
      .insert(journalEntries)
      .values({
        entryNumber,
        postingDate: bill.billDate,
        reference: bill.billNumber,
        description: `Bill ${bill.billNumber}`,
        totalDebit: bill.totalAmount,
        totalCredit: bill.totalAmount,
        isPosted: true,
        companyId,
        createdBy: userId,
      })
      .returning();

    // Debit Expense accounts (from line items)
    for (const item of lineItems) {
      if (item.accountId) {
        await tx.insert(glEntries).values({
          journalEntryId: journalEntry.id,
          accountId: item.accountId,
          debit: item.lineTotal.toString(),
          credit: '0',
          description: item.description,
          reference: bill.billNumber,
          companyId,
        });
      }
    }

    // Credit Accounts Payable
    const apAccount = await this.getAccountsPayableAccount(companyId);
    await tx.insert(glEntries).values({
      journalEntryId: journalEntry.id,
      accountId: apAccount.id,
      debit: '0',
      credit: bill.totalAmount,
      description: `Bill ${bill.billNumber}`,
      reference: bill.billNumber,
      companyId,
    });
  }

  private async createPaymentGLEntries(
    payment: VendorPayment,
    companyId: string,
    userId: string,
    tx: any
  ): Promise<void> {
    // Generate journal entry number
    const entryNumber = await this.generateJournalEntryNumber(companyId);

    // Create journal entry
    const [journalEntry] = await tx
      .insert(journalEntries)
      .values({
        entryNumber,
        postingDate: payment.paymentDate,
        reference: payment.paymentNumber,
        description: `Payment ${payment.paymentNumber}`,
        totalDebit: payment.amount,
        totalCredit: payment.amount,
        isPosted: true,
        companyId,
        createdBy: userId,
      })
      .returning();

    // Debit Accounts Payable
    const apAccount = await this.getAccountsPayableAccount(companyId);
    await tx.insert(glEntries).values({
      journalEntryId: journalEntry.id,
      accountId: apAccount.id,
      debit: payment.amount,
      credit: '0',
      description: `Payment ${payment.paymentNumber}`,
      reference: payment.paymentNumber,
      companyId,
    });

    // Credit Cash/Bank Account
    const cashAccount = await this.getCashAccount(
      companyId,
      payment.bankAccountId
    );
    await tx.insert(glEntries).values({
      journalEntryId: journalEntry.id,
      accountId: cashAccount.id,
      debit: '0',
      credit: payment.amount,
      description: `Payment ${payment.paymentNumber}`,
      reference: payment.paymentNumber,
      companyId,
    });
  }

  private async generateJournalEntryNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `JE-${year}-`;

    const [result] = await this.database
      .select({
        maxNumber: sql<string>`MAX(CAST(SUBSTRING(${journalEntries.entryNumber}, ${prefix.length + 1}) AS INTEGER))`,
      })
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.companyId, companyId),
          sql`${journalEntries.entryNumber} LIKE ${prefix + '%'}`
        )
      );

    const nextNumber = result && result['maxNumber'] ? parseInt(result['maxNumber'] as string) + 1 : 1;
    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }

  private async getAccountsPayableAccount(companyId: string) {
    const [account] = await this.database
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.companyId, companyId),
          eq(accounts.accountType, 'Liability'),
          sql`${accounts.accountName} ILIKE '%payable%'`
        )
      )
      .limit(1);

    if (!account) {
      throw new BadRequestException('Accounts Payable account not found');
    }

    return account;
  }

  private async getCashAccount(
    companyId: string,
    bankAccountId?: string | null
  ) {
    let account;

    if (bankAccountId) {
      // TODO: Get specific bank account when bank accounts are implemented
      [account] = await this.database
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.companyId, companyId),
            eq(accounts.accountType, 'Asset'),
            sql`${accounts.accountName} ILIKE '%cash%' OR ${accounts.accountName} ILIKE '%bank%'`
          )
        )
        .limit(1);
    } else {
      [account] = await this.database
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.companyId, companyId),
            eq(accounts.accountType, 'Asset'),
            sql`${accounts.accountName} ILIKE '%cash%'`
          )
        )
        .limit(1);
    }

    if (!account) {
      throw new BadRequestException('Cash/Bank account not found');
    }

    return account;
  }
}
