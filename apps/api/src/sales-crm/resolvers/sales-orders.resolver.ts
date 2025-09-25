import { User } from '@kiro/database';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SalesOrdersService } from '../services/sales-orders.service';

@Resolver()
@UseGuards(JwtAuthGuard)
export class SalesOrdersResolver {
  constructor(private readonly salesOrdersService: SalesOrdersService) {}

  @Query(() => String)
  async salesOrdersPlaceholder(): Promise<string> {
    return 'Sales Orders resolver - to be fully implemented';
  }

  // Placeholder methods - to be implemented
  @Mutation(() => Boolean)
  async createSalesOrder(
    @Args('data', { type: () => String }) data: string,
    @CurrentUser() user: User
  ): Promise<boolean> {
    return true;
  }
}
