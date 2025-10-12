import {
  type NewQuotation,
  type NewQuotationItem,
  type NewSalesOrder,
  type NewSalesOrderItem,
  type Quotation,
  type QuotationItem,
  quotationItems,
  quotations,
  salesOrderItems,
  salesOrders,
} from '@kiro/database';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type SQL, and, desc, eq, gte, ilike, inArray, lte, or, sql } from '@kiro/database';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  BaseService,
  type PaginationOptions,
} from '../../common/services/base.service';
import { CacheService } from '../../common/services/cache.service';
import { PerformanceMonitorService } from '../../common/services/performance-monitor.service';
import {
  ConvertToSalesOrderInput,
  CreateQuotationInput,
  QuotationAnalyticsType,
  QuotationFilterInput,
  QuotationStatus,
  UpdateQuotationInput,
} from '../dto/quotation.dto';

@Injectable()
export class QuotationsService extends BaseService<
  any,
  Quotation,
  NewQuotation,
  Partial<NewQuotation>
> {
  protected table = quotations as any;
  protected tableName = 'quotations';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    logger: Logger,
    cacheService: CacheService,
    performanceMonitor: PerformanceMonitorService
  ) {
    super(logger, cacheService, performanceMonitor);
  }

  /**
   * Create a new quotation with items
   */
  async createQuotation(
    data: CreateQuotationInput,
    companyId: string,
    userId: string
  ): Promise<Quotation & { items: QuotationItem[] }> {
    return await this.transaction(async tx => {
      try {
        this.logger.info('Creating quotation', { data, companyId, userId });

        // Generate quotation code
        const quotationCode = await this.generateQuotationCode(companyId);

        // Calculate totals from items
        const { subtotal, totalTax, totalDiscount, grandTotal } =
          this.calculateTotals(data.items);

        // Create quotation
        const quotationData: NewQuotation = {
          quotationCode,
          customerId: data.customerId,
          opportunityId: data.opportunityId || null,
          status: 'Draft',
          validUntil: data.validUntil,
          currency: data.currency || 'USD',
          exchangeRate: (data.exchangeRate || 1.0).toString(),
          subtotal: subtotal.toString(),
          totalTax: totalTax.toString(),
          totalDiscount: totalDiscount.toString(),
          grandTotal: grandTotal.toString(),
          terms: data.terms || null,
          notes: data.notes || null,
          internalNotes: data.internalNotes || null,
          assignedTo: data.assignedTo || null,
          companyId,
        };

        const [quotation] = await tx
          .insert(quotations)
          .values(quotationData)
          .returning();

        if (!quotation) {
          throw new BadRequestException('Failed to create quotation');
        }

        // Create quotation items
        const itemsData: NewQuotationItem[] = data.items.map((item, index) => {
          const discountAmount =
            item.discountAmount ||
            (item.discountPercent
              ? (item.unitPrice * item.quantity * item.discountPercent) / 100
              : 0);
          const taxAmount = item.taxPercent
            ? ((item.unitPrice * item.quantity - discountAmount) *
                item.taxPercent) /
              100
            : 0;
          const lineTotal =
            item.unitPrice * item.quantity - discountAmount + taxAmount;

          return {
            quotationId: quotation.id,
            itemCode: item.itemCode,
            itemName: item.itemName,
            description: item.description || null,
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
            discountPercent: (item.discountPercent || 0).toString(),
            discountAmount: discountAmount.toString(),
            taxPercent: (item.taxPercent || 0).toString(),
            taxAmount: taxAmount.toString(),
            lineTotal: lineTotal.toString(),
            notes: item.notes || null,
            sortOrder: item.sortOrder || index,
            companyId,
          };
        });

        const createdItems = await tx
          .insert(quotationItems)
          .values(itemsData)
          .returning();

        this.invalidateCache();

        this.logger.info('Created quotation', {
          quotationId: quotation.id,
          itemsCount: createdItems.length,
        });

        return { ...quotation, items: createdItems } as Quotation & { items: QuotationItem[] };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error('Failed to create quotation', { error: errorMessage, data });
        throw new BadRequestException(
          `Failed to create quotation: ${errorMessage}`
        );
      }
    });
  }

  /**
   * Update quotation
   */
  async updateQuotation(
    id: string,
    data: UpdateQuotationInput,
    companyId: string,
    userId: string
  ): Promise<Quotation & { items: QuotationItem[] }> {
    return await this.transaction(async tx => {
      try {
        this.logger.info('Updating quotation', { id, data, companyId, userId });

        // Check if quotation exists
        const existingQuotation = await this.findByIdOrFail(id, companyId);

        // Check if quotation can be updated
        if (
          existingQuotation.status === 'Accepted' ||
          existingQuotation.status === 'Cancelled'
        ) {
          throw new BadRequestException(
            `Cannot update quotation with status: ${existingQuotation.status}`
          );
        }

        let updateData: Partial<NewQuotation> = {};
        
        if (data.customerId !== undefined) {
          updateData.customerId = data.customerId;
        }
        if (data.opportunityId !== undefined) {
          updateData.opportunityId = data.opportunityId;
        }
        
        if (data.status !== undefined) updateData.status = data.status;
        if (data.validUntil !== undefined) updateData.validUntil = data.validUntil;
        if (data.currency !== undefined) updateData.currency = data.currency;
        if (data.exchangeRate !== undefined) updateData.exchangeRate = data.exchangeRate.toString();
        if (data.terms !== undefined) updateData.terms = data.terms;
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes;
        if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
        if (data.rejectionReason !== undefined) updateData.rejectionReason = data.rejectionReason;
        
        updateData.updatedAt = new Date();

        // Handle status changes
        if (data.status) {
          switch (data.status) {
            case QuotationStatus.SENT:
              updateData.sentAt = new Date();
              break;
            case QuotationStatus.ACCEPTED:
              updateData.acceptedAt = new Date();
              break;
            case QuotationStatus.REJECTED:
              updateData.rejectedAt = new Date();
              break;
          }
        }

        // If items are provided, recalculate totals
        if (data.items) {
          const { subtotal, totalTax, totalDiscount, grandTotal } =
            this.calculateTotals(data.items);

          updateData = {
            ...updateData,
            subtotal: subtotal.toString(),
            totalTax: totalTax.toString(),
            totalDiscount: totalDiscount.toString(),
            grandTotal: grandTotal.toString(),
          };

          // Delete existing items and create new ones
          await tx
            .delete(quotationItems)
            .where(
              and(
                eq(quotationItems.quotationId, id),
                eq(quotationItems.companyId, companyId)
              )
            );

          const itemsData: NewQuotationItem[] = data.items.map(
            (item, index) => {
              const discountAmount =
                item.discountAmount ||
                (item.discountPercent
                  ? (item.unitPrice * item.quantity * item.discountPercent) /
                    100
                  : 0);
              const taxAmount = item.taxPercent
                ? ((item.unitPrice * item.quantity - discountAmount) *
                    item.taxPercent) /
                  100
                : 0;
              const lineTotal =
                item.unitPrice * item.quantity - discountAmount + taxAmount;

              return {
                quotationId: id,
                itemCode: item.itemCode,
                itemName: item.itemName,
                description: item.description || null,
                quantity: item.quantity.toString(),
                unitPrice: item.unitPrice.toString(),
                discountPercent: (item.discountPercent || 0).toString(),
                discountAmount: discountAmount.toString(),
                taxPercent: (item.taxPercent || 0).toString(),
                taxAmount: taxAmount.toString(),
                lineTotal: lineTotal.toString(),
                notes: item.notes || null,
                sortOrder: item.sortOrder || index,
                companyId,
              };
            }
          );

          await tx.insert(quotationItems).values(itemsData);
        }

        // Update quotation
        const [updatedQuotation] = await tx
          .update(quotations)
          .set(updateData)
          .where(
            and(eq(quotations.id, id), eq(quotations.companyId, companyId))
          )
          .returning();

        // Get updated items
        const items = await tx
          .select()
          .from(quotationItems)
          .where(
            and(
              eq(quotationItems.quotationId, id),
              eq(quotationItems.companyId, companyId)
            )
          )
          .orderBy(quotationItems.sortOrder);

        this.invalidateCache();

        this.logger.info('Updated quotation', { quotationId: id });

        return { ...updatedQuotation, items } as Quotation & { items: QuotationItem[] };
      } catch (error) {
        this.logger.error('Failed to update quotation', { error, id, data });
        throw error;
      }
    });
  }

  /**
   * Convert quotation to sales order
   */
  async convertToSalesOrder(
    data: ConvertToSalesOrderInput,
    companyId: string,
    userId: string
  ): Promise<any> {
    return await this.transaction(async tx => {
      try {
        this.logger.info('Converting quotation to sales order', {
          data,
          companyId,
          userId,
        });

        // Get quotation with items
        const quotation = await this.getQuotationWithItems(
          data.quotationId,
          companyId
        );

        if (!quotation) {
          throw new NotFoundException('Quotation not found');
        }

        if (quotation.status !== 'Accepted') {
          throw new BadRequestException(
            'Only accepted quotations can be converted to sales orders'
          );
        }

        // Generate sales order code
        const salesOrderCode = await this.generateSalesOrderCode(companyId);

        // Create sales order
        const salesOrderData: NewSalesOrder = {
          salesOrderCode,
          customerId: quotation.customerId,
          quotationId: quotation.id,
          opportunityId: quotation.opportunityId,
          status: 'Draft',
          orderDate: data.orderDate || new Date(),
          deliveryDate: data.deliveryDate || null,
          currency: quotation.currency,
          exchangeRate: quotation.exchangeRate,
          subtotal: quotation.subtotal,
          totalTax: quotation.totalTax,
          totalDiscount: quotation.totalDiscount,
          shippingCharges: '0',
          grandTotal: quotation.grandTotal,
          advanceAmount: '0',
          balanceAmount: quotation.grandTotal,
          terms: quotation.terms,
          notes: data.notes || quotation.notes,
          internalNotes: data.internalNotes || quotation.internalNotes,
          assignedTo: quotation.assignedTo,
          companyId,
        };

        const [salesOrder] = await tx
          .insert(salesOrders)
          .values(salesOrderData)
          .returning();

        if (!salesOrder) {
          throw new BadRequestException('Failed to create sales order');
        }

        // Create sales order items from quotation items
        const salesOrderItemsData: NewSalesOrderItem[] = quotation.items.map(
          item => ({
            salesOrderId: salesOrder.id,
            itemCode: item.itemCode,
            itemName: item.itemName,
            description: item.description,
            quantity: item.quantity,
            deliveredQuantity: '0',
            invoicedQuantity: '0',
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent,
            discountAmount: item.discountAmount,
            taxPercent: item.taxPercent,
            taxAmount: item.taxAmount,
            lineTotal: item.lineTotal,
            notes: item.notes,
            sortOrder: item.sortOrder,
            companyId,
          })
        );

        const createdSalesOrderItems = await tx
          .insert(salesOrderItems)
          .values(salesOrderItemsData)
          .returning();

        this.invalidateCache();

        this.logger.info('Converted quotation to sales order', {
          quotationId: data.quotationId,
          salesOrderId: salesOrder.id,
        });

        return { ...salesOrder, items: createdSalesOrderItems } as any;
      } catch (error) {
        this.logger.error('Failed to convert quotation to sales order', {
          error,
          data,
        });
        throw error;
      }
    });
  }

  /**
   * Get quotation with items
   */
  async getQuotationWithItems(
    id: string,
    companyId: string
  ): Promise<(Quotation & { items: QuotationItem[] }) | null> {
    try {
      const quotation = await this.findById(id, companyId);
      if (!quotation) return null;

      const items = await this.database
        .select()
        .from(quotationItems)
        .where(
          and(
            eq(quotationItems.quotationId, id),
            eq(quotationItems.companyId, companyId)
          )
        )
        .orderBy(quotationItems.sortOrder);

      return { ...quotation, items };
    } catch (error) {
      this.logger.error('Failed to get quotation with items', { error, id });
      throw error;
    }
  }

  /**
   * Find quotations with filters
   */
  async findQuotations(
    filters: QuotationFilterInput,
    pagination: PaginationOptions,
    companyId: string
  ) {
    try {
      const conditions: SQL[] = [eq(quotations.companyId, companyId)];

      // Apply filters
      if (filters.status?.length) {
        conditions.push(inArray(quotations.status, filters.status));
      }

      if (filters.customerId?.length) {
        conditions.push(inArray(quotations.customerId, filters.customerId));
      }

      if (filters.assignedTo?.length) {
        conditions.push(inArray(quotations.assignedTo, filters.assignedTo));
      }

      if (filters.currency?.length) {
        conditions.push(inArray(quotations.currency, filters.currency));
      }

      if (filters.validAfter) {
        conditions.push(gte(quotations.validUntil, filters.validAfter));
      }

      if (filters.validBefore) {
        conditions.push(lte(quotations.validUntil, filters.validBefore));
      }

      if (filters.createdAfter) {
        conditions.push(gte(quotations.createdAt, filters.createdAfter));
      }

      if (filters.createdBefore) {
        conditions.push(lte(quotations.createdAt, filters.createdBefore));
      }

      if (filters.search) {
        conditions.push(
          or(
            ilike(quotations.quotationCode, `%${filters.search}%`),
            ilike(quotations.notes, `%${filters.search}%`)
          )!
        );
      }

      const whereClause = and(...conditions);

      return await this.findAll(pagination, companyId, whereClause);
    } catch (error) {
      this.logger.error('Failed to find quotations', { error, filters });
      throw error;
    }
  }

  /**
   * Get quotation analytics
   */
  async getQuotationAnalytics(
    companyId: string
  ): Promise<QuotationAnalyticsType> {
    try {
      const analytics = await this.database
        .select({
          status: quotations.status,
          count: sql<number>`count(*)::int`,
          totalValue: sql<number>`sum(${quotations.grandTotal}::numeric)::float`,
        })
        .from(quotations)
        .where(eq(quotations.companyId, companyId))
        .groupBy(quotations.status);

      const totalQuotations = analytics.reduce(
        (sum, item) => sum + item.count,
        0
      );
      const totalValue = analytics.reduce(
        (sum, item) => sum + (item.totalValue || 0),
        0
      );
      const acceptedValue = analytics
        .filter(item => item.status === 'Accepted')
        .reduce((sum, item) => sum + (item.totalValue || 0), 0);

      const acceptedCount = analytics
        .filter(item => item.status === 'Accepted')
        .reduce((sum, item) => sum + item.count, 0);

      return {
        totalQuotations,
        draftQuotations:
          analytics.find(item => item.status === 'Draft')?.count || 0,
        sentQuotations:
          analytics.find(item => item.status === 'Sent')?.count || 0,
        acceptedQuotations: acceptedCount,
        rejectedQuotations:
          analytics.find(item => item.status === 'Rejected')?.count || 0,
        expiredQuotations:
          analytics.find(item => item.status === 'Expired')?.count || 0,
        totalValue,
        acceptedValue,
        conversionRate:
          totalQuotations > 0 ? (acceptedCount / totalQuotations) * 100 : 0,
        averageQuotationValue:
          totalQuotations > 0 ? totalValue / totalQuotations : 0,
        quotationsByStatus: analytics.map(item => ({
          status: item.status as any,
          count: item.count,
          totalValue: item.totalValue || 0,
        })),
      };
    } catch (error) {
      this.logger.error('Failed to get quotation analytics', {
        error,
        companyId,
      });
      throw error;
    }
  }

  /**
   * Generate quotation code
   */
  private async generateQuotationCode(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `QUO-${year}-`;

    const lastQuotation = await this.database
      .select({ quotationCode: quotations.quotationCode })
      .from(quotations)
      .where(
        and(
          eq(quotations.companyId, companyId),
          ilike(quotations.quotationCode, `${prefix}%`)
        )
      )
      .orderBy(desc(quotations.createdAt))
      .limit(1);

    let nextNumber = 1;
    if (lastQuotation.length > 0 && lastQuotation[0]) {
      const lastCode = lastQuotation[0].quotationCode;
      const lastNumber = parseInt(lastCode.split('-').pop() || '0');
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Generate sales order code
   */
  private async generateSalesOrderCode(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SO-${year}-`;

    const lastOrder = await this.database
      .select({ salesOrderCode: salesOrders.salesOrderCode })
      .from(salesOrders)
      .where(
        and(
          eq(salesOrders.companyId, companyId),
          ilike(salesOrders.salesOrderCode, `${prefix}%`)
        )
      )
      .orderBy(desc(salesOrders.createdAt))
      .limit(1);

    let nextNumber = 1;
    if (lastOrder.length > 0 && lastOrder[0]) {
      const lastCode = lastOrder[0].salesOrderCode;
      const lastNumber = parseInt(lastCode.split('-').pop() || '0');
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Calculate totals from items
   */
  private calculateTotals(items: any[]) {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    items.forEach(item => {
      const itemSubtotal = item.unitPrice * item.quantity;
      const discountAmount =
        item.discountAmount ||
        (item.discountPercent
          ? (itemSubtotal * item.discountPercent) / 100
          : 0);
      const taxAmount = item.taxPercent
        ? ((itemSubtotal - discountAmount) * item.taxPercent) / 100
        : 0;

      subtotal += itemSubtotal;
      totalDiscount += discountAmount;
      totalTax += taxAmount;
    });

    const grandTotal = subtotal - totalDiscount + totalTax;

    return { subtotal, totalTax, totalDiscount, grandTotal };
  }
}
