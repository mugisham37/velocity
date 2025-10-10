import {
  type CustomerPayment,
  type Invoice,
  type NewInvoice,
  accounts,
  customerCreditLimits,
  customerPayments,
  customers,
  dunningRecords,
  glEntries,
  invoiceLineItems,
  invoiceNumberingSeries,
  invoices,
  journalEntries,
  paymentAllocations,
} from '@kiro/database';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gte, lte, sql, sum } from '@kiro/database';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AuditService } from '../common/services/audit.service';
import { BaseService } from '../common/services/base.service';
import { CacheService } from '../common/services/cache.service';
import { PerformanceMonitorService } from '../common/services/performance-monitor.service';

export interface CreateInvoiceDto {
  customerId: string;
  invoiceDate: Date;
  dueDate: Date;
  currency?: string;
  exchangeRate?: number;
  terms?: string;
  notes?: string;
  templateId?: string;
  salesOrderId?: string;
  lineItems: {
    itemCode?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    taxPercent?: number;
    accountId?: string;
  }[];
}

export interface CreatePaymentDto {
  customerId: string;
  paymentDate: Date;
  amount: number;
  currency?: string;
  exchangeRate?: number;
  paymentMethod: string;
  reference?: string;
  bankAccountId?: string;
  notes?: string;
  allocations?: {
    invoiceId: string;
    amount: number;
  }[];
}

export interface AgingBucket {
  current: number;
  days30: number;
  days60: number;
  days90: number;
  over90: number;
  total: number;
}

export interface CustomerAgingReport {
  customerId: string;
  customerName: string;
  aging: AgingBucket;
  invoices: {
    id: string;
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date;
    totalAmount: number;
    outstandingAmount: number;
    daysOverdue: number;
  }[];
}

export interface CreditLimitCheckResult {
  isApproved: boolean;
  currentOutstanding: number;
  creditLimit: number;
  proposedAmount: number;
  totalExposure: number;
  availableCredit: number;
  message: string;
}

@Injectable()
export class AccountsReceivableService extends BaseService<
  any, // Temporarily use any to avoid Drizzle type issues
  Invoice,
  NewInvoice,
  Partial<NewInvoice>
> {
  protected table = invoices as any;
  protected tableName = 'invoices';

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
   * Create invoice with line items and automatic GL posting
   */
  async createInvoice(
    data: CreateInvoiceDto,
    companyId: string,
    userId: string
  ): Promise<Invoice> {
    return await this.transaction(async tx => {
      // Validate customer
      const [customer] = await tx
        .select()
        .from(customers)
        .where(
          and(
            eq(customers.id, data.customerId),
            eq(customers.companyId, companyId)
          )
        )
        .limit(1);

      if (!customer) {
        throw new BadRequestException('Customer not found');
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

      // Check credit limit
      const creditCheck = await this.checkCreditLimit(
        data.customerId,
        totalAmount,
        companyId,
        userId
      );

      if (!creditCheck.isApproved) {
        throw new BadRequestException(
          `Credit limit exceeded: ${creditCheck.message}`
        );
      }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(companyId);

      // Create invoice
      const [invoice] = await tx
        .insert(invoices)
        .values({
          invoiceNumber,
          customerId: data.customerId,
          invoiceDate: data.invoiceDate,
          dueDate: data.dueDate,
          currency: data.currency || 'USD',
          exchangeRate: data.exchangeRate?.toString() || '1.0000',
          subtotal: subtotal.toString(),
          taxAmount: totalTaxAmount.toString(),
          discountAmount: totalDiscountAmount.toString(),
          totalAmount: totalAmount.toString(),
          outstandingAmount: totalAmount.toString(),
          status: 'submitted',
          terms: data.terms || null,
          notes: data.notes || null,
          templateId: data.templateId || null,
          salesOrderId: data.salesOrderId || null,
          companyId,
          createdBy: userId,
        })
        .returning();

      if (!invoice) {
        throw new BadRequestException('Failed to create invoice');
      }

      // Create line items
      const lineItemPromises = processedLineItems.map(item =>
        tx.insert(invoiceLineItems).values({
          invoiceId: invoice.id,
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
          companyId,
        })
      );

      await Promise.all(lineItemPromises);

      // Create GL entries
      await this.createInvoiceGLEntries(
        invoice,
        processedLineItems,
        companyId,
        userId,
        tx
      );

      // Log audit trail
      await this.auditService.logAudit({
        entityType: 'invoices',
        entityId: invoice.id,
        action: 'CREATE',
        newValues: { ...invoice, lineItems: processedLineItems },
        companyId,
        userId,
      });

      return invoice;
    });
  }

  /**
   * Record customer payment with automatic allocation
   */
  async recordPayment(
    data: CreatePaymentDto,
    companyId: string,
    userId: string
  ): Promise<CustomerPayment> {
    return await this.transaction(async tx => {
      // Validate customer
      const [customer] = await tx
        .select()
        .from(customers)
        .where(
          and(
            eq(customers.id, data.customerId),
            eq(customers.companyId, companyId)
          )
        )
        .limit(1);

      if (!customer) {
        throw new BadRequestException('Customer not found');
      }

      // Generate payment number
      const paymentNumber = await this.generatePaymentNumber(companyId);

      // Calculate allocated and unallocated amounts
      const totalAllocated =
        data.allocations?.reduce((sum, alloc) => sum + alloc.amount, 0) || 0;
      const unallocatedAmount = data.amount - totalAllocated;

      // Create payment
      const [payment] = await tx
        .insert(customerPayments)
        .values({
          paymentNumber,
          customerId: data.customerId,
          paymentDate: data.paymentDate,
          amount: data.amount.toString(),
          currency: data.currency || 'USD',
          exchangeRate: data.exchangeRate?.toString() || '1.0000',
          paymentMethod: data.paymentMethod,
          reference: data.reference || null,
          bankAccountId: data.bankAccountId || null,
          status: 'completed',
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
        await this.allocatePayment(
          payment.id,
          data.allocations,
          companyId,
          userId,
          tx
        );
      } else {
        // Auto-allocate to oldest invoices
        await this.autoAllocatePayment(
          payment.id,
          data.customerId,
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
        entityType: 'customer_payments',
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
   * Allocate payment to specific invoices
   */
  async allocatePayment(
    paymentId: string,
    allocations: { invoiceId: string; amount: number }[],
    companyId: string,
    userId: string,
    tx?: any
  ): Promise<void> {
    const database = tx || this.database;

    for (const allocation of allocations) {
      // Validate invoice
      const [invoice] = await database
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.id, allocation.invoiceId),
            eq(invoices.companyId, companyId)
          )
        )
        .limit(1);

      if (!invoice) {
        throw new BadRequestException(
          `Invoice ${allocation.invoiceId} not found`
        );
      }

      const outstandingAmount = parseFloat(invoice.outstandingAmount);
      if (allocation.amount > outstandingAmount) {
        throw new BadRequestException(
          `Allocation amount ${allocation.amount} exceeds outstanding amount ${outstandingAmount}`
        );
      }

      // Create allocation record
      await database.insert(paymentAllocations).values({
        paymentId,
        invoiceId: allocation.invoiceId,
        allocatedAmount: allocation.amount.toString(),
        companyId,
        createdBy: userId,
      });

      // Update invoice outstanding amount
      const newOutstanding = outstandingAmount - allocation.amount;
      const newStatus = newOutstanding === 0 ? 'paid' : 'partially_paid';

      await database
        .update(invoices)
        .set({
          paidAmount: sql`${invoices.paidAmount} + ${allocation.amount}`,
          outstandingAmount: newOutstanding.toString(),
          status: newStatus,
        })
        .where(eq(invoices.id, allocation.invoiceId));
    }
  }

  /**
   * Generate aging report for customers
   */
  async generateAgingReport(
    companyId: string,
    customerId?: string,
    asOfDate?: Date
  ): Promise<CustomerAgingReport[]> {
    const reportDate = asOfDate || new Date();
    const conditions = [eq(invoices.companyId, companyId)];

    if (customerId) {
      conditions.push(eq(invoices.customerId, customerId));
    }

    // Get all outstanding invoices
    const outstandingInvoices = await this.database
      .select({
        invoiceId: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        customerId: invoices.customerId,
        customerName: customers.customerName,
        invoiceDate: invoices.invoiceDate,
        dueDate: invoices.dueDate,
        totalAmount: invoices.totalAmount,
        outstandingAmount: invoices.outstandingAmount,
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(
        and(
          ...conditions,
          sql`${invoices.outstandingAmount} > 0`,
          lte(invoices.invoiceDate, reportDate)
        )
      )
      .orderBy(customers.customerName, invoices.dueDate);

    // Group by customer and calculate aging buckets
    const customerMap = new Map<string, CustomerAgingReport>();

    for (const invoice of outstandingInvoices) {
      const daysOverdue = Math.max(
        0,
        Math.floor(
          (reportDate.getTime() - invoice.dueDate.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );

      const outstandingAmount = parseFloat(invoice.outstandingAmount);

      if (!customerMap.has(invoice.customerId)) {
        customerMap.set(invoice.customerId, {
          customerId: invoice.customerId,
          customerName: invoice.customerName,
          aging: {
            current: 0,
            days30: 0,
            days60: 0,
            days90: 0,
            over90: 0,
            total: 0,
          },
          invoices: [],
        });
      }

      const customerReport = customerMap.get(invoice.customerId)!;

      // Add to appropriate aging bucket
      if (daysOverdue <= 0) {
        customerReport.aging.current += outstandingAmount;
      } else if (daysOverdue <= 30) {
        customerReport.aging.days30 += outstandingAmount;
      } else if (daysOverdue <= 60) {
        customerReport.aging.days60 += outstandingAmount;
      } else if (daysOverdue <= 90) {
        customerReport.aging.days90 += outstandingAmount;
      } else {
        customerReport.aging.over90 += outstandingAmount;
      }

      customerReport.aging.total += outstandingAmount;

      customerReport.invoices.push({
        id: invoice.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        totalAmount: parseFloat(invoice.totalAmount),
        outstandingAmount,
        daysOverdue,
      });
    }

    return Array.from(customerMap.values());
  }

  /**
   * Check credit limit for customer
   */
  async checkCreditLimit(
    customerId: string,
    proposedAmount: number,
    companyId: string,
    _userId: string
  ): Promise<CreditLimitCheckResult> {
    // Get current credit limit
    const [creditLimit] = await this.database
      .select()
      .from(customerCreditLimits)
      .where(
        and(
          eq(customerCreditLimits.customerId, customerId),
          eq(customerCreditLimits.companyId, companyId),
          eq(customerCreditLimits.isActive, true),
          lte(customerCreditLimits.effectiveDate, new Date())
        )
      )
      .orderBy(desc(customerCreditLimits.effectiveDate))
      .limit(1);

    if (!creditLimit) {
      return {
        isApproved: false,
        currentOutstanding: 0,
        creditLimit: 0,
        proposedAmount,
        totalExposure: proposedAmount,
        availableCredit: 0,
        message: 'No credit limit configured for customer',
      };
    }

    // Get current outstanding amount
    const [outstandingResult] = await this.database
      .select({
        totalOutstanding: sum(invoices.outstandingAmount),
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.customerId, customerId),
          eq(invoices.companyId, companyId),
          sql`${invoices.outstandingAmount} > 0`
        )
      );

    const currentOutstanding = parseFloat(
      outstandingResult?.totalOutstanding?.toString() || '0'
    );
    const creditLimitAmount = parseFloat(creditLimit.creditLimit);
    const totalExposure = currentOutstanding + proposedAmount;
    const availableCredit = creditLimitAmount - currentOutstanding;

    const isApproved = totalExposure <= creditLimitAmount;

    const result: CreditLimitCheckResult = {
      isApproved,
      currentOutstanding,
      creditLimit: creditLimitAmount,
      proposedAmount,
      totalExposure,
      availableCredit,
      message: isApproved
        ? 'Credit limit check passed'
        : `Credit limit exceeded. Available credit: ${availableCredit}`,
    };

    // TODO: Log credit limit check to proper table when available
    // await this.database.insert(creditLimitChecks).values({
    //   customerId,
    //   checkDate: new Date(),
    //   currentOutstanding: currentOutstanding.toString(),
    //   creditLimit: creditLimitAmount.toString(),
    //   proposedAmount: proposedAmount.toString(),
    //   totalExposure: totalExposure.toString(),
    //   isApproved,
    //   companyId,
    // });

    return result;
  }

  /**
   * Generate customer statement
   */
  async generateCustomerStatement(
    customerId: string,
    fromDate: Date,
    toDate: Date,
    companyId: string,
    _userId: string
  ): Promise<any> {
    // Get customer details
    const [customer] = await this.database
      .select()
      .from(customers)
      .where(
        and(eq(customers.id, customerId), eq(customers.companyId, companyId))
      )
      .limit(1);

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    // Get opening balance
    const [openingBalanceResult] = await this.database
      .select({
        balance: sum(invoices.outstandingAmount),
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.customerId, customerId),
          eq(invoices.companyId, companyId),
          sql`${invoices.invoiceDate} < ${fromDate}`
        )
      );

    const openingBalance = parseFloat(openingBalanceResult?.balance?.toString() || '0');

    // Get invoice transactions in period
    const invoiceTransactions = await this.database
      .select({
        date: invoices.invoiceDate,
        type: sql<string>`'invoice'`,
        reference: invoices.invoiceNumber,
        description: sql<string>`'Invoice'`,
        debit: invoices.totalAmount,
        credit: sql<string>`'0'`,
        balance: invoices.outstandingAmount,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.customerId, customerId),
          eq(invoices.companyId, companyId),
          gte(invoices.invoiceDate, fromDate),
          lte(invoices.invoiceDate, toDate)
        )
      );

    // Get payment transactions in period
    const paymentTransactions = await this.database
      .select({
        date: customerPayments.paymentDate,
        type: sql<string>`'payment'`,
        reference: customerPayments.paymentNumber,
        description: sql<string>`'Payment'`,
        debit: sql<string>`'0'`,
        credit: customerPayments.amount,
        balance: sql<string>`'0'`,
      })
      .from(customerPayments)
      .where(
        and(
          eq(customerPayments.customerId, customerId),
          eq(customerPayments.companyId, companyId),
          gte(customerPayments.paymentDate, fromDate),
          lte(customerPayments.paymentDate, toDate)
        )
      );

    // Combine and sort transactions
    const transactions = [...invoiceTransactions, ...paymentTransactions]
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate closing balance
    const totalInvoices = transactions
      .filter((t: any) => t.type === 'invoice')
      .reduce((sum: number, t: any) => sum + parseFloat(t.debit), 0);

    const totalPayments = transactions
      .filter((t: any) => t.type === 'payment')
      .reduce((sum: number, t: any) => sum + parseFloat(t.credit), 0);

    const closingBalance = openingBalance + totalInvoices - totalPayments;

    return {
      customer,
      fromDate,
      toDate,
      openingBalance,
      closingBalance,
      totalInvoices,
      totalPayments,
      transactions,
    };
  }

  /**
   * Process dunning for overdue invoices
   */
  async processDunning(companyId: string, userId: string): Promise<void> {
    // Get overdue invoices
    const overdueInvoices = await this.database
      .select()
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(
        and(
          eq(invoices.companyId, companyId),
          sql`${invoices.outstandingAmount} > 0`,
          sql`${invoices.dueDate} < CURRENT_DATE`
        )
      );

    for (const { invoices: invoice, customers: _customer } of overdueInvoices) {
      const daysOverdue = Math.floor(
        (Date.now() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let dunningLevel:
        | 'first_reminder'
        | 'second_reminder'
        | 'final_notice'
        | 'legal_action';

      if (daysOverdue <= 7) {
        dunningLevel = 'first_reminder';
      } else if (daysOverdue <= 14) {
        dunningLevel = 'second_reminder';
      } else if (daysOverdue <= 30) {
        dunningLevel = 'final_notice';
      } else {
        dunningLevel = 'legal_action';
      }

      // Check if dunning already sent for this level
      const [existingDunning] = await this.database
        .select()
        .from(dunningRecords)
        .where(
          and(
            eq(dunningRecords.invoiceId, invoice.id),
            eq(dunningRecords.level, dunningLevel),
            eq(dunningRecords.companyId, companyId)
          )
        )
        .limit(1);

      if (!existingDunning) {
        // Create dunning record
        await this.database.insert(dunningRecords).values({
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          level: dunningLevel,
          dueDate: invoice.dueDate,
          dunningDate: new Date(),
          outstandingAmount: invoice.outstandingAmount,
          emailSent: false,
          smsSent: false,
          letterSent: false,
          companyId,
          createdBy: userId,
        });

        // TODO: Send dunning notifications (email, SMS, letter)
        this.logger.info('Dunning record created', {
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          level: dunningLevel,
          amount: invoice.outstandingAmount,
        });
      }
    }
  }

  /**
   * Private helper methods
   */
  private async generateInvoiceNumber(companyId: string): Promise<string> {
    // Get default numbering series
    const [series] = await this.database
      .select()
      .from(invoiceNumberingSeries)
      .where(
        and(
          eq(invoiceNumberingSeries.companyId, companyId),
          eq(invoiceNumberingSeries.isDefault, true),
          eq(invoiceNumberingSeries.isActive, true)
        )
      )
      .limit(1);

    if (!series) {
      // Create default series if none exists
      const [newSeries] = await this.database
        .insert(invoiceNumberingSeries)
        .values({
          seriesName: 'Default',
          prefix: 'INV-',
          currentNumber: 1,
          padLength: 6,
          isDefault: true,
          isActive: true,
          companyId,
        })
        .returning();

      if (!newSeries) {
        throw new BadRequestException('Failed to create default numbering series');
      }

      const invoiceNumber = `${newSeries.prefix}${newSeries.currentNumber
        .toString()
        .padStart(newSeries.padLength, '0')}${newSeries.suffix || ''}`;

      // Update current number
      await this.database
        .update(invoiceNumberingSeries)
        .set({ currentNumber: newSeries.currentNumber + 1 })
        .where(eq(invoiceNumberingSeries.id, newSeries.id));

      return invoiceNumber;
    }

    const invoiceNumber = `${series.prefix}${series.currentNumber
      .toString()
      .padStart(series.padLength, '0')}${series.suffix || ''}`;

    // Update current number
    await this.database
      .update(invoiceNumberingSeries)
      .set({ currentNumber: series.currentNumber + 1 })
      .where(eq(invoiceNumberingSeries.id, series.id));

    return invoiceNumber;
  }

  private async generatePaymentNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PAY-${year}-`;

    const [result] = await this.database
      .select({
        maxNumber: sql<string>`MAX(CAST(SUBSTRING(${customerPayments.paymentNumber}, ${prefix.length + 1}) AS INTEGER))`,
      })
      .from(customerPayments)
      .where(
        and(
          eq(customerPayments.companyId, companyId),
          sql`${customerPayments.paymentNumber} LIKE ${prefix + '%'}`
        )
      );

    const nextNumber = result?.maxNumber ? parseInt(result.maxNumber) + 1 : 1;
    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }

  private async autoAllocatePayment(
    paymentId: string,
    customerId: string,
    paymentAmount: number,
    companyId: string,
    userId: string,
    tx: any
  ): Promise<void> {
    // Get oldest outstanding invoices
    const outstandingInvoices = await tx
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.customerId, customerId),
          eq(invoices.companyId, companyId),
          sql`${invoices.outstandingAmount} > 0`
        )
      )
      .orderBy(invoices.dueDate);

    let remainingAmount = paymentAmount;
    const allocations: { invoiceId: string; amount: number }[] = [];

    for (const invoice of outstandingInvoices) {
      if (remainingAmount <= 0) break;

      const outstandingAmount = parseFloat(invoice.outstandingAmount);
      const allocationAmount = Math.min(remainingAmount, outstandingAmount);

      allocations.push({
        invoiceId: invoice.id,
        amount: allocationAmount,
      });

      remainingAmount -= allocationAmount;
    }

    if (allocations.length > 0) {
      await this.allocatePayment(paymentId, allocations, companyId, userId, tx);
    }

    // Update payment unallocated amount
    await tx
      .update(customerPayments)
      .set({
        allocatedAmount: (paymentAmount - remainingAmount).toString(),
        unallocatedAmount: remainingAmount.toString(),
      })
      .where(eq(customerPayments.id, paymentId));
  }

  private async createInvoiceGLEntries(
    invoice: Invoice,
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
        postingDate: invoice.invoiceDate,
        reference: invoice.invoiceNumber,
        description: `Invoice ${invoice.invoiceNumber}`,
        totalDebit: invoice.totalAmount,
        totalCredit: invoice.totalAmount,
        isPosted: true,
        companyId,
        createdBy: userId,
      })
      .returning();

    // Debit Accounts Receivable
    const arAccount = await this.getAccountsReceivableAccount(companyId);
    await tx.insert(glEntries).values({
      journalEntryId: journalEntry.id,
      accountId: arAccount.id,
      debit: invoice.totalAmount,
      credit: '0',
      description: `Invoice ${invoice.invoiceNumber}`,
      reference: invoice.invoiceNumber,
      companyId,
    });

    // Credit Revenue accounts (from line items)
    for (const item of lineItems) {
      if (item.accountId) {
        await tx.insert(glEntries).values({
          journalEntryId: journalEntry.id,
          accountId: item.accountId,
          debit: '0',
          credit: item.lineTotal.toString(),
          description: item.description,
          reference: invoice.invoiceNumber,
          companyId,
        });
      }
    }
  }

  private async createPaymentGLEntries(
    payment: CustomerPayment,
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

    // Debit Cash/Bank Account
    const cashAccount = await this.getCashAccount(
      companyId,
      payment.bankAccountId
    );
    await tx.insert(glEntries).values({
      journalEntryId: journalEntry.id,
      accountId: cashAccount.id,
      debit: payment.amount,
      credit: '0',
      description: `Payment ${payment.paymentNumber}`,
      reference: payment.paymentNumber,
      companyId,
    });

    // Credit Accounts Receivable
    const arAccount = await this.getAccountsReceivableAccount(companyId);
    await tx.insert(glEntries).values({
      journalEntryId: journalEntry.id,
      accountId: arAccount.id,
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

    const nextNumber = result?.maxNumber ? parseInt(result.maxNumber) + 1 : 1;
    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }

  private async getAccountsReceivableAccount(companyId: string) {
    const [account] = await this.database
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.companyId, companyId),
          eq(accounts.accountType, 'Asset'),
          sql`${accounts.accountName} ILIKE '%receivable%'`
        )
      )
      .limit(1);

    if (!account) {
      throw new BadRequestException('Accounts Receivable account not found');
    }

    return account;
  }

  private async getCashAccount(companyId: string, bankAccountId?: string | null) {
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
