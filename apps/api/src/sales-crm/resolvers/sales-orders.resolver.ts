import type { User } from '../../database';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CreateSalesOrderInput,
  OrderAmendmentInput,
  OrderFulfillmentType,
  PaginationInput,
  SalesOrderAnalyticsType,
  SalesOrderConnection,
  SalesOrderFilterInput,
  SalesOrderType,
  UpdateSalesOrderInput,
} from '../dto/sales-order.dto';
import { SalesOrdersService } from '../services/sales-orders.service';

@Resolver(() => SalesOrderType)
@UseGuards(JwtAuthGuard)
export class SalesOrdersResolver {
  constructor(private readonly salesOrdersService: SalesOrdersService) {}

  @Query(() => SalesOrderType, { nullable: true })
  async salesOrder(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<SalesOrderType | null> {
    return await this.salesOrdersService.getSalesOrderWithItems(
      id,
      user.companyId
    ) as any;
  }

  @Query(() => SalesOrderConnection)
  async salesOrders(
    @Args('filters', { type: () => SalesOrderFilterInput, nullable: true })
    filters: SalesOrderFilterInput = {},
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination: PaginationInput = {},
    @CurrentUser() user: User
  ): Promise<SalesOrderConnection> {
    const result = await this.salesOrdersService.findSalesOrders(
      filters,
      {
        page: pagination.page || 1,
        limit: pagination.limit || 50,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
      user.companyId
    );

    return {
      salesOrders: result.data as any,
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
      totalPages: result.pagination.totalPages,
    };
  }

  @Query(() => SalesOrderAnalyticsType)
  async salesOrderAnalytics(
    @CurrentUser() user: User
  ): Promise<SalesOrderAnalyticsType> {
    return await this.salesOrdersService.getSalesOrderAnalytics(user.companyId) as any;
  }

  @Query(() => OrderFulfillmentType)
  async orderFulfillment(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<OrderFulfillmentType> {
    return await this.salesOrdersService.getOrderFulfillment(
      id,
      user.companyId
    ) as any;
  }

  @Mutation(() => SalesOrderType)
  async createSalesOrder(
    @Args('input') input: CreateSalesOrderInput,
    @CurrentUser() user: User
  ): Promise<SalesOrderType> {
    return await this.salesOrdersService.createSalesOrder(
      input,
      user.companyId,
      user.id
    ) as any;
  }

  @Mutation(() => SalesOrderType)
  async updateSalesOrder(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateSalesOrderInput,
    @CurrentUser() user: User
  ): Promise<SalesOrderType> {
    return await this.salesOrdersService.updateSalesOrder(
      id,
      input,
      user.companyId,
      user.id
    ) as any;
  }

  @Mutation(() => SalesOrderType)
  async confirmSalesOrder(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<SalesOrderType> {
    return await this.salesOrdersService.confirmSalesOrder(
      id,
      user.companyId,
      user.id
    ) as any;
  }

  @Mutation(() => SalesOrderType)
  async amendSalesOrder(
    @Args('input') input: OrderAmendmentInput,
    @CurrentUser() user: User
  ): Promise<SalesOrderType> {
    return await this.salesOrdersService.processOrderAmendment(
      input,
      user.companyId,
      user.id
    ) as any;
  }

  @Mutation(() => Boolean)
  async deleteSalesOrder(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<boolean> {
    await this.salesOrdersService.delete(id, user.companyId);
    return true;
  }

  @Mutation(() => SalesOrderType)
  async approveSalesOrder(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<SalesOrderType> {
    return await this.salesOrdersService.updateSalesOrder(
      id,
      { status: 'Approved' as any } as any,
      user.companyId,
      user.id
    ) as any;
  }

  @Mutation(() => SalesOrderType)
  async cancelSalesOrder(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
    @Args('reason', { nullable: true }) reason?: string
  ): Promise<SalesOrderType> {
    return await this.salesOrdersService.updateSalesOrder(
      id,
      { 
        status: 'Cancelled' as any, 
        ...(reason && { internalNotes: reason })
      },
      user.companyId,
      user.id
    ) as any;
  }

  @Mutation(() => SalesOrderType)
  async holdSalesOrder(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
    @Args('reason', { nullable: true }) reason?: string
  ): Promise<SalesOrderType> {
    return await this.salesOrdersService.updateSalesOrder(
      id,
      { 
        status: 'On Hold' as any, 
        ...(reason && { internalNotes: reason })
      },
      user.companyId,
      user.id
    ) as any;
  }
}

