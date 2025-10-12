import {
  type NewSalesOrder,
  type NewSalesOrderItem,
  type SalesOrder,
  type SalesOrderItem,
  salesOrderItems,
  salesOrders,
} from '@kiro/database';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  type SQL,
  and,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from '@kiro/database';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  BaseService,
  type PaginationOptions,
} from '../../common/services/base.service';
import { CacheService } from '../../common/services/cache.service';
import { PerformanceMonitorService } from '../../common/services/performance-monitor.service';
import {
  CreateSalesOrderInput,
  OrderAmendmentInput,
  OrderFulfillmentType,
  SalesOrderAnalyticsType,
  SalesOrderFilterInput,
  SalesOrderStatus,
  UpdateSalesOrderInput,
} from '../dto/sales-order.dto';

@Injectable()
export class SalesOrdersService extends BaseService<
  any,
  SalesOrder,
  NewSalesOrder,
  Partial<NewSalesOrder>
> {
  protected table = salesOrders as any;
  protected tableName = 'sales_orders';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    logger: Logger,
    cacheService: CacheService,
    performanceMonitor: PerformanceMonitorService
  ) {
    super(logger, cacheService, performanceMonitor);
  }

  /**
   * Create a new sales order with items
   */
  async createSalesOrder(
    data: CreateSalesOrderInput,
    companyId: string,
    userId: string
  ): Promise<SalesOrder & { items: SalesOrderItem[] }> {
    return await this.transaction(async tx => {
      try {
        this.logger.info('Creating sales order', { data, companyId, userId });

        // Generate sales order code
        const salesOrderCode = await this.generateSalesOrderCode(companyId);

        // Calculate totals from items
        const { subtotal, totalTax, totalDiscount, grandTotal } =
          this.calculateTotals(data.items);

        const balanceAmount = grandTotal - (data.advanceAmount || 0);

        // Create sales order
        const salesOrderData: NewSalesOrder = {
          salesOrderCode,
          customerId: data.customerId,
          quotationId: data.quotationId || null,
          opportunityId: data.opportunityId || null,
          status: 'Draft',
          orderDate: data.orderDate,
          deliveryDate: data.deliveryDate || null,
          currency: data.currency || 'USD',
          exchangeRate: (data.exchangeRate || 1.0).toString(),
          subtotal: subtotal.toString(),
          totalTax: totalTax.toString(),
          totalDiscount: totalDiscount.toString(),
          shippingCharges: (data.shippingCharges || 0).toString(),
          grandTotal: (grandTotal + (data.shippingCharges || 0)).toString(),
          advanceAmount: (data.advanceAmount || 0).toString(),
          balanceAmount: (
            balanceAmount + (data.shippingCharges || 0)
          ).toString(),
          billingAddress: data.billingAddress,
          shippingAddress: data.shippingAddress,
          terms: data.terms || null,
          notes: data.notes || null,
          internalNotes: data.internalNotes || null,
          assignedTo: data.assignedTo || null,
          companyId,
        };

        const [salesOrder] = await tx
          .insert(salesOrders)
          .values(salesOrderData)
          .returning();

        if (!salesOrder) {
          throw new BadRequestException('Failed to create sales order');
        }

        // Create sales order items
        const itemsData: NewSalesOrderItem[] = data.items.map((item, index) => {
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
            salesOrderId: salesOrder.id,
            itemCode: item.itemCode,
            itemName: item.itemName,
            description: item.description || null,
            quantity: item.quantity.toString(),
            deliveredQuantity: '0',
            invoicedQuantity: '0',
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
          .insert(salesOrderItems)
          .values(itemsData)
          .returning();

        this.invalidateCache();

        this.logger.info('Created sales order', {
          salesOrderId: salesOrder.id,
          itemsCount: createdItems.length,
        });

        return { ...salesOrder, items: createdItems } as SalesOrder & { items: SalesOrderItem[] };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error('Failed to create sales order', { error: errorMessage, data });
        throw new BadRequestException(
          `Failed to create sales order: ${errorMessage}`
        );
      }
    });
  }

  /**
   * Update sales order
   */
  async updateSalesOrder(
    id: string,
    data: UpdateSalesOrderInput,
    companyId: string,
    userId: string
  ): Promise<SalesOrder & { items: SalesOrderItem[] }> {
    return await this.transaction(async tx => {
      try {
        this.logger.info('Updating sales order', {
          id,
          data,
          companyId,
          userId,
        });

        // Check if sales order exists
        const existingSalesOrder = await this.findByIdOrFail(id, companyId);

        // Check if sales order can be updated
        if (
          existingSalesOrder.status === 'Delivered' ||
          existingSalesOrder.status === 'Cancelled'
        ) {
          throw new BadRequestException(
            `Cannot update sales order with status: ${existingSalesOrder.status}`
          );
        }

        let updateData: Partial<NewSalesOrder> = {};
        
        if (data.customerId !== undefined) {
          updateData.customerId = data.customerId;
        }
        
        if (data.status !== undefined) updateData.status = data.status;
        if (data.orderDate !== undefined) updateData.orderDate = data.orderDate;
        if (data.deliveryDate !== undefined) updateData.deliveryDate = data.deliveryDate;
        if (data.currency !== undefined) updateData.currency = data.currency;
        if (data.exchangeRate !== undefined) updateData.exchangeRate = data.exchangeRate.toString();
        if (data.shippingCharges !== undefined) updateData.shippingCharges = data.shippingCharges.toString();
        if (data.advanceAmount !== undefined) updateData.advanceAmount = data.advanceAmount.toString();
        if (data.billingAddress !== undefined) updateData.billingAddress = data.billingAddress;
        if (data.shippingAddress !== undefined) updateData.shippingAddress = data.shippingAddress;
        if (data.terms !== undefined) updateData.terms = data.terms;
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes;
        if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
        
        updateData.updatedAt = new Date();

        // Handle status changes
        if (data.status) {
          switch (data.status) {
            case SalesOrderStatus.CONFIRMED:
              updateData.confirmedAt = new Date();
              break;
          }
        }

        // If items are provided, recalculate totals
        if (data.items) {
          const { subtotal, totalTax, totalDiscount, grandTotal } =
            this.calculateTotals(data.items);

          const shippingCharges = data.shippingCharges || 0;
          const advanceAmount = data.advanceAmount || 0;
          const finalGrandTotal = grandTotal + shippingCharges;
          const balanceAmount = finalGrandTotal - advanceAmount;

          updateData = {
            ...updateData,
            subtotal: subtotal.toString(),
            totalTax: totalTax.toString(),
            totalDiscount: totalDiscount.toString(),
            grandTotal: finalGrandTotal.toString(),
            balanceAmount: balanceAmount.toString(),
          };

          // Delete existing items and create new ones
          await tx
            .delete(salesOrderItems)
            .where(
              and(
                eq(salesOrderItems.salesOrderId, id),
                eq(salesOrderItems.companyId, companyId)
              )
            );

          const itemsData: NewSalesOrderItem[] = data.items.map(
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
                salesOrderId: id,
                itemCode: item.itemCode,
                itemName: item.itemName,
                description: item.description || null,
                quantity: item.quantity.toString(),
                deliveredQuantity: '0',
                invoicedQuantity: '0',
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

          await tx.insert(salesOrderItems).values(itemsData);
        }

        // Update sales order
        const [updatedSalesOrder] = await tx
          .update(salesOrders)
          .set(updateData)
          .where(
            and(eq(salesOrders.id, id), eq(salesOrders.companyId, companyId))
          )
          .returning();

        // Get updated items
        const items = await tx
          .select()
          .from(salesOrderItems)
          .where(
            and(
              eq(salesOrderItems.salesOrderId, id),
              eq(salesOrderItems.companyId, companyId)
            )
          )
          .orderBy(salesOrderItems.sortOrder);

        this.invalidateCache();

        this.logger.info('Updated sales order', { salesOrderId: id });

        return { ...updatedSalesOrder, items } as SalesOrder & { items: SalesOrderItem[] };
      } catch (error) {
        this.logger.error('Failed to update sales order', { error, id, data });
        throw error;
      }
    });
  }

  /**
   * Confirm sales order
   */
  async confirmSalesOrder(
    id: string,
    companyId: string,
    userId: string
  ): Promise<SalesOrder> {
    try {
      this.logger.info('Confirming sales order', { id, companyId, userId });

      const salesOrder = await this.findByIdOrFail(id, companyId);

      if (salesOrder.status !== 'Approved') {
        throw new BadRequestException(
          'Only approved sales orders can be confirmed'
        );
      }

      const updatedSalesOrder = await this.update(
        id,
        {
          status: 'Confirmed',
          confirmedAt: new Date(),
        },
        companyId
      );

      this.logger.info('Confirmed sales order', { salesOrderId: id });

      return updatedSalesOrder;
    } catch (error) {
      this.logger.error('Failed to confirm sales order', { error, id });
      throw error;
    }
  }

  /**
   * Process order amendment
   */
  async processOrderAmendment(
    data: OrderAmendmentInput,
    companyId: string,
    userId: string
  ): Promise<SalesOrder & { items: SalesOrderItem[] }> {
    return await this.transaction(async tx => {
      try {
        this.logger.info('Processing order amendment', {
          data,
          companyId,
          userId,
        });

        const salesOrder = await this.findByIdOrFail(
          data.salesOrderId,
          companyId
        );

        if (
          salesOrder.status === 'Delivered' ||
          salesOrder.status === 'Cancelled'
        ) {
          throw new BadRequestException(
            `Cannot amend sales order with status: ${salesOrder.status}`
          );
        }

        // Remove items if specified
        if (data.removedItemIds?.length) {
          await tx
            .delete(salesOrderItems)
            .where(
              and(
                eq(salesOrderItems.salesOrderId, data.salesOrderId),
                eq(salesOrderItems.companyId, companyId),
                inArray(salesOrderItems.id, data.removedItemIds)
              )
            );
        }

        // Update existing items
        if (data.updatedItems?.length) {
          for (const updatedItem of data.updatedItems) {
            await tx
              .update(salesOrderItems)
              .set({
                deliveredQuantity: updatedItem.deliveredQuantity.toString(),
                invoicedQuantity: updatedItem.invoicedQuantity.toString(),
              })
              .where(
                and(
                  eq(salesOrderItems.id, updatedItem.itemId),
                  eq(salesOrderItems.companyId, companyId)
                )
              );
          }
        }

        // Add new items
        if (data.newItems?.length) {
          const itemsData: NewSalesOrderItem[] = data.newItems.map(
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
                salesOrderId: data.salesOrderId,
                itemCode: item.itemCode,
                itemName: item.itemName,
                description: item.description || null,
                quantity: item.quantity.toString(),
                deliveredQuantity: '0',
                invoicedQuantity: '0',
                unitPrice: item.unitPrice.toString(),
                discountPercent: (item.discountPercent || 0).toString(),
                discountAmount: discountAmount.toString(),
                taxPercent: (item.taxPercent || 0).toString(),
                taxAmount: taxAmount.toString(),
                lineTotal: lineTotal.toString(),
                notes: item.notes || null,
                sortOrder: item.sortOrder || index + 1000, // Add high sort order for new items
                companyId,
              };
            }
          );

          await tx.insert(salesOrderItems).values(itemsData);
        }

        // Recalculate totals
        const items = await tx
          .select()
          .from(salesOrderItems)
          .where(
            and(
              eq(salesOrderItems.salesOrderId, data.salesOrderId),
              eq(salesOrderItems.companyId, companyId)
            )
          );

        const { subtotal, totalTax, totalDiscount, grandTotal } =
          this.calculateTotalsFromItems(items);

        const shippingCharges = parseFloat(salesOrder.shippingCharges || '0');
        const advanceAmount = parseFloat(salesOrder.advanceAmount || '0');
        const finalGrandTotal = grandTotal + shippingCharges;
        const balanceAmount = finalGrandTotal - advanceAmount;

        // Update sales order totals
        const [updatedSalesOrder] = await tx
          .update(salesOrders)
          .set({
            subtotal: subtotal.toString(),
            totalTax: totalTax.toString(),
            totalDiscount: totalDiscount.toString(),
            grandTotal: finalGrandTotal.toString(),
            balanceAmount: balanceAmount.toString(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(salesOrders.id, data.salesOrderId),
              eq(salesOrders.companyId, companyId)
            )
          )
          .returning();

        this.invalidateCache();

        this.logger.info('Processed order amendment', {
          salesOrderId: data.salesOrderId,
        });

        return { ...updatedSalesOrder, items } as SalesOrder & { items: SalesOrderItem[] };
      } catch (error) {
        this.logger.error('Failed to process order amendment', { error, data });
        throw error;
      }
    });
  }

  /**
   * Get sales order with items
   */
  async getSalesOrderWithItems(
    id: string,
    companyId: string
  ): Promise<(SalesOrder & { items: SalesOrderItem[] }) | null> {
    try {
      const salesOrder = await this.findById(id, companyId);
      if (!salesOrder) return null;

      const items = await this.database
        .select()
        .from(salesOrderItems)
        .where(
          and(
            eq(salesOrderItems.salesOrderId, id),
            eq(salesOrderItems.companyId, companyId)
          )
        )
        .orderBy(salesOrderItems.sortOrder);

      return { ...salesOrder, items };
    } catch (error) {
      this.logger.error('Failed to get sales order with items', { error, id });
      throw error;
    }
  }

  /**
   * Find sales orders with filters
   */
  async findSalesOrders(
    filters: SalesOrderFilterInput,
    pagination: PaginationOptions,
    companyId: string
  ) {
    try {
      const conditions: SQL[] = [eq(salesOrders.companyId, companyId)];

      // Apply filters
      if (filters.status?.length) {
        conditions.push(inArray(salesOrders.status, filters.status));
      }

      if (filters.customerId?.length) {
        conditions.push(inArray(salesOrders.customerId, filters.customerId));
      }

      if (filters.assignedTo?.length) {
        conditions.push(inArray(salesOrders.assignedTo, filters.assignedTo));
      }

      if (filters.currency?.length) {
        conditions.push(inArray(salesOrders.currency, filters.currency));
      }

      if (filters.orderDateAfter) {
        conditions.push(gte(salesOrders.orderDate, filters.orderDateAfter));
      }

      if (filters.orderDateBefore) {
        conditions.push(lte(salesOrders.orderDate, filters.orderDateBefore));
      }

      if (filters.deliveryDateAfter) {
        conditions.push(
          gte(salesOrders.deliveryDate, filters.deliveryDateAfter)
        );
      }

      if (filters.deliveryDateBefore) {
        conditions.push(
          lte(salesOrders.deliveryDate, filters.deliveryDateBefore)
        );
      }

      if (filters.createdAfter) {
        conditions.push(gte(salesOrders.createdAt, filters.createdAfter));
      }

      if (filters.createdBefore) {
        conditions.push(lte(salesOrders.createdAt, filters.createdBefore));
      }

      if (filters.search) {
        conditions.push(
          or(
            ilike(salesOrders.salesOrderCode, `%${filters.search}%`),
            ilike(salesOrders.notes, `%${filters.search}%`)
          )!
        );
      }

      const whereClause = and(...conditions);

      return await this.findAll(pagination, companyId, whereClause);
    } catch (error) {
      this.logger.error('Failed to find sales orders', { error, filters });
      throw error;
    }
  }

  /**
   * Get sales order analytics
   */
  async getSalesOrderAnalytics(
    companyId: string
  ): Promise<SalesOrderAnalyticsType> {
    try {
      const analytics = await this.database
        .select({
          status: salesOrders.status,
          count: sql<number>`count(*)::int`,
          totalValue: sql<number>`sum(${salesOrders.grandTotal}::numeric)::float`,
        })
        .from(salesOrders)
        .where(eq(salesOrders.companyId, companyId))
        .groupBy(salesOrders.status);

      const totalOrders = analytics.reduce((sum, item) => sum + item.count, 0);
      const totalValue = analytics.reduce(
        (sum, item) => sum + (item.totalValue || 0),
        0
      );
      const deliveredValue = analytics
        .filter(item => item.status === 'Delivered')
        .reduce((sum, item) => sum + (item.totalValue || 0), 0);
      const invoicedValue = analytics
        .filter(item => item.status === 'Invoiced')
        .reduce((sum, item) => sum + (item.totalValue || 0), 0);

      const deliveredCount = analytics
        .filter(
          item => item.status === 'Delivered' || item.status === 'Invoiced'
        )
        .reduce((sum, item) => sum + item.count, 0);

      return {
        totalOrders,
        draftOrders:
          analytics.find(item => item.status === 'Draft')?.count || 0,
        confirmedOrders:
          analytics.find(item => item.status === 'Confirmed')?.count || 0,
        deliveredOrders:
          analytics.find(item => item.status === 'Delivered')?.count || 0,
        invoicedOrders:
          analytics.find(item => item.status === 'Invoiced')?.count || 0,
        cancelledOrders:
          analytics.find(item => item.status === 'Cancelled')?.count || 0,
        totalValue,
        deliveredValue,
        invoicedValue,
        averageOrderValue: totalOrders > 0 ? totalValue / totalOrders : 0,
        fulfillmentRate:
          totalOrders > 0 ? (deliveredCount / totalOrders) * 100 : 0,
        ordersByStatus: analytics.map(item => ({
          status: item.status as any,
          count: item.count,
          totalValue: item.totalValue || 0,
        })),
      };
    } catch (error) {
      this.logger.error('Failed to get sales order analytics', {
        error,
        companyId,
      });
      throw error;
    }
  }

  /**
   * Get order fulfillment status
   */
  async getOrderFulfillment(
    id: string,
    companyId: string
  ): Promise<OrderFulfillmentType> {
    try {
      const salesOrderWithItems = await this.getSalesOrderWithItems(
        id,
        companyId
      );

      if (!salesOrderWithItems) {
        throw new NotFoundException('Sales order not found');
      }

      const totalQuantity = salesOrderWithItems.items.reduce(
        (sum, item) => sum + parseFloat(item.quantity),
        0
      );

      const deliveredQuantity = salesOrderWithItems.items.reduce(
        (sum, item) => sum + parseFloat(item.deliveredQuantity || '0'),
        0
      );

      const pendingQuantity = totalQuantity - deliveredQuantity;
      const fulfillmentPercentage =
        totalQuantity > 0 ? (deliveredQuantity / totalQuantity) * 100 : 0;

      const items = salesOrderWithItems.items.map(item => {
        const orderedQty = parseFloat(item.quantity);
        const deliveredQty = parseFloat(item.deliveredQuantity || '0');
        const pendingQty = orderedQty - deliveredQty;
        const itemFulfillmentPercentage =
          orderedQty > 0 ? (deliveredQty / orderedQty) * 100 : 0;

        return {
          itemId: item.id,
          itemCode: item.itemCode,
          itemName: item.itemName,
          orderedQuantity: orderedQty,
          deliveredQuantity: deliveredQty,
          pendingQuantity: pendingQty,
          fulfillmentPercentage: itemFulfillmentPercentage,
        };
      });

      return {
        salesOrderId: salesOrderWithItems.id,
        salesOrderCode: salesOrderWithItems.salesOrderCode,
        totalQuantity,
        deliveredQuantity,
        pendingQuantity,
        fulfillmentPercentage,
        items,
      };
    } catch (error) {
      this.logger.error('Failed to get order fulfillment', { error, id });
      throw error;
    }
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

  /**
   * Calculate totals from database items
   */
  private calculateTotalsFromItems(items: SalesOrderItem[]) {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    items.forEach(item => {
      const itemSubtotal =
        parseFloat(item.unitPrice) * parseFloat(item.quantity);
      const discountAmount = parseFloat(item.discountAmount || '0');
      const taxAmount = parseFloat(item.taxAmount || '0');

      subtotal += itemSubtotal;
      totalDiscount += discountAmount;
      totalTax += taxAmount;
    });

    const grandTotal = subtotal - totalDiscount + totalTax;

    return { subtotal, totalTax, totalDiscount, grandTotal };
  }
}
