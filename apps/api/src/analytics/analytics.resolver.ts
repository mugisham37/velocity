import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { AnalyticsSummary } from './dto/analytics-summary.dto';
import { GenerateInsightsInput } from './dto/generate-insights.input';
import { InsightsResponse } from './dto/insights-response.dto';

@Resolver()
@UseGuards(JwtAuthGuard)
export class AnalyticsResolver {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Query(() => AnalyticsSummary)
  async analyticsSummary(): Promise<AnalyticsSummary> {
    return this.analyticsService.getAnalyticsSummary();
  }

  @Mutation(() => InsightsResponse)
  async generateInsights(
    @Args('input') input: GenerateInsightsInput
  ): Promise<InsightsResponse> {
    return this.analyticsService.generateInsights(
      input.entityType,
      input.entityId
    );
  }
}

