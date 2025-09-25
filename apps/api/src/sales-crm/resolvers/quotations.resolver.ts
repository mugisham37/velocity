import { User } from '@kiro/database';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { QuotationsService } from '../services/quotations.service';

@Resolver()
@UseGuards(JwtAuthGuard)
export class QuotationsResolver {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Query(() => String)
  async quotationsPlaceholder(): Promise<string> {
    return 'Quotations resolver - to be fully implemented';
  }

  // Placeholder methods - to be implemented
  @Mutation(() => Boolean)
  async createQuotation(
    @Args('data', { type: () => String }) data: string,
    @CurrentUser() user: User
  ): Promise<boolean> {
    return true;
  }
}
