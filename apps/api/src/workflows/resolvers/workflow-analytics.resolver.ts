import { UseGuards } from '@nestjs/common';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WorkflowAnalyticsFilter, WorkflowMetrics } from '../dto/workflow.dto';
import { WorkflowAnalyticsService } from '../services/workflow-analytics.service';
import { WorkflowSlaService } from '../services/workflow-sla.service';

@Resolver()
@UseGuards(JwtAuthGuard)
export class WorkflowAnalyticsResolver {
  constructor(
    private readonly analyticsService: WorkflowAnalyticsService,
    private readonly slaService: WorkflowSlaService
  ) {}

  @Query(() => WorkflowMetrics)
  async workflowMetrics(
    @CurrentUser() user: any,
    @Args('filter', { nullable: true }) filter?: WorkflowAnalyticsFilter
  ): Promise<WorkflowMetrics> {
    return this.analyticsService.getWorkflowMetrics(user.companyId, filter);
  }

  @Query(() => String)
  async workflowPerformance(
    @Args('workflowId', { type: () => ID }) workflowId: string,
    @Args('period', { nullable: true }) period?: string,
    @CurrentUser() user: any
  ): Promise<string> {
    const performance = await this.analyticsService.getWorkflowPerformance(
      workflowId,
      user.companyId,
      period as 'day' | 'week' | 'month'
    );
    return JSON.stringify(performance);
  }

  @Query(() => String)
  async approvalAnalytics(
    @CurrentUser() user: any,
    @Args('filter', { nullable: true }) filter?: WorkflowAnalyticsFilter
  ): Promise<string> {
    const analytics = await this.analyticsService.getApprovalMetrics(
      user.companyId,
      filter
    );
    return JSON.stringify(analytics);
  }

  @Query(() => String)
  async workflowInsights(@CurrentUser() user: any): Promise<string> {
    const insights = await this.analyticsService.generateInsights(
      user.companyId
    );
    return JSON.stringify(insights);
  }

  @Query(() => String)
  async slaMetrics(
    @CurrentUser() user: any,
    @Args('period', { nullable: true }) period?: string
  ): Promise<string> {
    const metrics = await this.slaService.getSlaMetrics(
      user.companyId,
      period as 'day' | 'week' | 'month'
    );
    return JSON.stringify(metrics);
  }

  @Query(() => String)
  async overdueItems(@CurrentUser() user: any): Promise<string> {
    const items = await this.slaService.getOverdueItems(user.companyId);
    return JSON.stringify(items);
  }
}
