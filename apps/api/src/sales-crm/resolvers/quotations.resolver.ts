import { User } from '@kiro/database';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  ConvertToSalesOrderInput,
  CreateQuotationInput,
  PaginationInput,
  QuotationAnalyticsType,
  QuotationConnection,
  QuotationFilterInput,
  QuotationType,
  UpdateQuotationInput,
} from '../dto/quotation.dto';
import { QuotationsService } from '../services/quotations.service';

@Resolver(() => QuotationType)
@UseGuards(JwtAuthGuard)
export class QuotationsResolver {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Query(() => QuotationType, { nullable: true })
  async quotation(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<QuotationType | null> {
    return await this.quotationsService.getQuotationWithItems(
      id,
      user.companyId
    );
  }

  @Query(() => QuotationConnection)
  async quotations(
    @Args('filters', { type: () => QuotationFilterInput, nullable: true })
    filters: QuotationFilterInput = {},
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination: PaginationInput = {},
    @CurrentUser() user: User
  ): Promise<QuotationConnection> {
    const result = await this.quotationsService.findQuotations(
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
      quotations: result.data as QuotationType[],
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
      totalPages: result.pagination.totalPages,
    };
  }

  @Query(() => QuotationAnalyticsType)
  async quotationAnalytics(
    @CurrentUser() user: User
  ): Promise<QuotationAnalyticsType> {
    return await this.quotationsService.getQuotationAnalytics(user.companyId);
  }

  @Mutation(() => QuotationType)
  async createQuotation(
    @Args('input') input: CreateQuotationInput,
    @CurrentUser() user: User
  ): Promise<QuotationType> {
    return await this.quotationsService.createQuotation(
      input,
      user.companyId,
      user.id
    );
  }

  @Mutation(() => QuotationType)
  async updateQuotation(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateQuotationInput,
    @CurrentUser() user: User
  ): Promise<QuotationType> {
    return await this.quotationsService.updateQuotation(
      id,
      input,
      user.companyId,
      user.id
    );
  }

  @Mutation(() => QuotationType)
  async convertQuotationToSalesOrder(
    @Args('input') input: ConvertToSalesOrderInput,
    @CurrentUser() user: User
  ): Promise<any> {
    return await this.quotationsService.convertToSalesOrder(
      input,
      user.companyId,
      user.id
    );
  }

  @Mutation(() => Boolean)
  async deleteQuotation(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<boolean> {
    await this.quotationsService.delete(id, user.companyId);
    return true;
  }

  @Mutation(() => QuotationType)
  async sendQuotation(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<QuotationType> {
    return await this.quotationsService.updateQuotation(
      id,
      { status: 'Sent' },
      user.companyId,
      user.id
    );
  }

  @Mutation(() => QuotationType)
  async acceptQuotation(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<QuotationType> {
    return await this.quotationsService.updateQuotation(
      id,
      { status: 'Accepted' },
      user.companyId,
      user.id
    );
  }

  @Mutation(() => QuotationType)
  async rejectQuotation(
    @Args('id', { type: () => ID }) id: string,
    @Args('reason', { nullable: true }) reason?: string,
    @CurrentUser() user: User
  ): Promise<QuotationType> {
    return await this.quotationsService.updateQuotation(
      id,
      { status: 'Rejected', rejectionReason: reason },
      user.companyId,
      user.id
    );
  }
}
