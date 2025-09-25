import { User } from '@kiro/database';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  AddTeamMemberInput,
  CreateOpportunityActivityInput,
  CreateOpportunityCompetitorInput,
  CreateOpportunityInput,
  ForecastPeriodInput,
  OpportunityActivityType,
  OpportunityAnalyticsType,
  OpportunityCompetitorType,
  OpportunityConnection,
  OpportunityFilterInput,
  OpportunityStageHistoryType,
  OpportunityType,
  PaginationInput,
  SalesForecastType,
  UpdateOpportunityInput,
} from '../dto/opportunity.dto';
import { OpportunitiesService } from '../services/opportunities.service';

@Resolver(() => OpportunityType)
@UseGuards(JwtAuthGuard)
export class OpportunitiesResolver {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  // Queries
  @Query(() => OpportunityConnection, {
    description: 'Get opportunities with filtering and pagination',
  })
  async opportunities(
    @Args('filter', { type: () => OpportunityFilterInput, nullable: true })
    filter: OpportunityFilterInput = {},
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination: PaginationInput = {},
    @CurrentUser() user: User
  ): Promise<OpportunityConnection> {
    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;

    const result = await this.opportunitiesService.getOpportunities(
      filter,
      user.companyId,
      limit,
      offset
    );

    return {
      opportunities: result.opportunities as OpportunityType[],
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  @Query(() => OpportunityType, { description: 'Get opportunity by ID' })
  async opportunity(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<OpportunityType> {
    const opportunity = await this.opportunitiesService.findByIdOrFail(
      id,
      user.companyId
    );
    return opportunity as OpportunityType;
  }

  @Query(() => [OpportunityActivityType], {
    description: 'Get opportunity activities',
  })
  async opportunityActivities(
    @Args('opportunityId', { type: () => ID }) opportunityId: string,
    @CurrentUser() user: User
  ): Promise<OpportunityActivityType[]> {
    const activities = await this.opportunitiesService.getOpportunityActivities(
      opportunityId,
      user.companyId
    );
    return activities as OpportunityActivityType[];
  }

  @Query(() => [OpportunityStageHistoryType], {
    description: 'Get opportunity stage history',
  })
  async opportunityStageHistory(
    @Args('opportunityId', { type: () => ID }) opportunityId: string,
    @CurrentUser() user: User
  ): Promise<OpportunityStageHistoryType[]> {
    const history = await this.opportunitiesService.getOpportunityStageHistory(
      opportunityId,
      user.companyId
    );
    return history as OpportunityStageHistoryType[];
  }

  @Query(() => [OpportunityCompetitorType], {
    description: 'Get opportunity competitors',
  })
  async opportunityCompetitors(
    @Args('opportunityId', { type: () => ID }) opportunityId: string,
    @CurrentUser() user: User
  ): Promise<OpportunityCompetitorType[]> {
    const competitors =
      await this.opportunitiesService.getOpportunityCompetitors(
        opportunityId,
        user.companyId
      );
    return competitors as OpportunityCompetitorType[];
  }

  @Query(() => SalesForecastType, { description: 'Get sales forecast' })
  async salesForecast(
    @Args('period', { type: () => ForecastPeriodInput, nullable: true })
    period?: ForecastPeriodInput,
    @CurrentUser() user: User
  ): Promise<SalesForecastType> {
    const forecast = await this.opportunitiesService.getSalesForecast(
      user.companyId,
      period ? { start: period.start, end: period.end } : undefined
    );
    return forecast as SalesForecastType;
  }

  @Query(() => OpportunityAnalyticsType, {
    description: 'Get opportunity analytics',
  })
  async opportunityAnalytics(
    @CurrentUser() user: User
  ): Promise<OpportunityAnalyticsType> {
    const analytics = await this.opportunitiesService.getOpportunityAnalytics(
      user.companyId
    );
    return analytics as OpportunityAnalyticsType;
  }

  // Mutations
  @Mutation(() => OpportunityType, { description: 'Create a new opportunity' })
  async createOpportunity(
    @Args('input') input: CreateOpportunityInput,
    @CurrentUser() user: User
  ): Promise<OpportunityType> {
    const opportunity = await this.opportunitiesService.createOpportunity(
      {
        name: input.name,
        customerId: input.customerId,
        leadId: input.leadId,
        stage: input.stage,
        probability: input.probability,
        amount: input.amount,
        currency: input.currency,
        expectedCloseDate: input.expectedCloseDate,
        source: input.source,
        description: input.description,
        nextStep: input.nextStep,
        assignedTo: input.assignedTo,
        territory: input.territory,
      },
      user.companyId,
      user.id
    );
    return opportunity as OpportunityType;
  }

  @Mutation(() => OpportunityType, { description: 'Update an opportunity' })
  async updateOpportunity(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateOpportunityInput,
    @CurrentUser() user: User
  ): Promise<OpportunityType> {
    const opportunity = await this.opportunitiesService.updateOpportunity(
      id,
      {
        name: input.name,
        customerId: input.customerId,
        stage: input.stage,
        probability: input.probability,
        amount: input.amount,
        currency: input.currency,
        expectedCloseDate: input.expectedCloseDate,
        actualCloseDate: input.actualCloseDate,
        source: input.source,
        description: input.description,
        nextStep: input.nextStep,
        assignedTo: input.assignedTo,
        territory: input.territory,
        lostReason: input.lostReason,
      },
      user.companyId,
      user.id
    );
    return opportunity as OpportunityType;
  }

  @Mutation(() => Boolean, { description: 'Delete an opportunity' })
  async deleteOpportunity(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<boolean> {
    await this.opportunitiesService.delete(id, user.companyId, user.id);
    return true;
  }

  @Mutation(() => OpportunityActivityType, {
    description: 'Create opportunity activity',
  })
  async createOpportunityActivity(
    @Args('input') input: CreateOpportunityActivityInput,
    @CurrentUser() user: User
  ): Promise<OpportunityActivityType> {
    const activity = await this.opportunitiesService.createActivity(
      {
        opportunityId: input.opportunityId,
        activityType: input.activityType,
        subject: input.subject,
        description: input.description,
        activityDate: input.activityDate,
        duration: input.duration,
        outcome: input.outcome,
        nextAction: input.nextAction,
        nextActionDate: input.nextActionDate,
      },
      user.companyId,
      user.id
    );
    return activity as OpportunityActivityType;
  }

  @Mutation(() => OpportunityCompetitorType, {
    description: 'Add competitor to opportunity',
  })
  async addOpportunityCompetitor(
    @Args('input') input: CreateOpportunityCompetitorInput,
    @CurrentUser() user: User
  ): Promise<OpportunityCompetitorType> {
    const competitor = await this.opportunitiesService.addCompetitor(
      {
        opportunityId: input.opportunityId,
        competitorName: input.competitorName,
        strengths: input.strengths,
        weaknesses: input.weaknesses,
        pricing: input.pricing,
        winProbability: input.winProbability,
        notes: input.notes,
      },
      user.companyId,
      user.id
    );
    return competitor as OpportunityCompetitorType;
  }

  @Mutation(() => Boolean, { description: 'Add team member to opportunity' })
  async addOpportunityTeamMember(
    @Args('input') input: AddTeamMemberInput,
    @CurrentUser() user: User
  ): Promise<boolean> {
    await this.opportunitiesService.addTeamMember(
      {
        opportunityId: input.opportunityId,
        userId: input.userId,
        role: input.role,
        accessLevel: input.accessLevel,
      },
      user.companyId,
      user.id
    );
    return true;
  }

  @Mutation(() => OpportunityType, {
    description: 'Move opportunity to next stage',
  })
  async moveOpportunityToNextStage(
    @Args('id', { type: () => ID }) id: string,
    @Args('notes', { nullable: true }) notes?: string,
    @CurrentUser() user: User
  ): Promise<OpportunityType> {
    const opportunity = await this.opportunitiesService.findByIdOrFail(
      id,
      user.companyId
    );

    // Define stage progression
    const stageProgression = {
      Prospecting: 'Qualification',
      Qualification: 'Needs Analysis',
      'Needs Analysis': 'Value Proposition',
      'Value Proposition': 'Proposal',
      Proposal: 'Negotiation',
      Negotiation: 'Closed Won',
    };

    const nextStage =
      stageProgression[opportunity.stage as keyof typeof stageProgression];
    if (!nextStage) {
      throw new Error('Cannot move opportunity to next stage');
    }

    const updatedOpportunity =
      await this.opportunitiesService.updateOpportunity(
        id,
        { stage: nextStage as any },
        user.companyId,
        user.id
      );

    // Add activity for stage progression
    await this.opportunitiesService.createActivity(
      {
        opportunityId: id,
        activityType: 'Stage Progression',
        subject: `Moved to ${nextStage}`,
        description:
          notes ||
          `Opportunity moved from ${opportunity.stage} to ${nextStage}`,
        activityDate: new Date(),
      },
      user.companyId,
      user.id
    );

    return updatedOpportunity as OpportunityType;
  }

  @Mutation(() => OpportunityType, { description: 'Mark opportunity as won' })
  async markOpportunityWon(
    @Args('id', { type: () => ID }) id: string,
    @Args('notes', { nullable: true }) notes?: string,
    @CurrentUser() user: User
  ): Promise<OpportunityType> {
    const updatedOpportunity =
      await this.opportunitiesService.updateOpportunity(
        id,
        {
          stage: 'Closed Won' as any,
          probability: 100,
          actualCloseDate: new Date(),
        },
        user.companyId,
        user.id
      );

    // Add activity for won opportunity
    await this.opportunitiesService.createActivity(
      {
        opportunityId: id,
        activityType: 'Opportunity Won',
        subject: 'Opportunity marked as won',
        description: notes || 'Opportunity successfully closed as won',
        activityDate: new Date(),
        outcome: 'Won',
      },
      user.companyId,
      user.id
    );

    return updatedOpportunity as OpportunityType;
  }

  @Mutation(() => OpportunityType, { description: 'Mark opportunity as lost' })
  async markOpportunityLost(
    @Args('id', { type: () => ID }) id: string,
    @Args('reason') reason: string,
    @Args('notes', { nullable: true }) notes?: string,
    @CurrentUser() user: User
  ): Promise<OpportunityType> {
    const updatedOpportunity =
      await this.opportunitiesService.updateOpportunity(
        id,
        {
          stage: 'Closed Lost' as any,
          probability: 0,
          actualCloseDate: new Date(),
          lostReason: reason,
        },
        user.companyId,
        user.id
      );

    // Add activity for lost opportunity
    await this.opportunitiesService.createActivity(
      {
        opportunityId: id,
        activityType: 'Opportunity Lost',
        subject: 'Opportunity marked as lost',
        description: notes || `Opportunity lost. Reason: ${reason}`,
        activityDate: new Date(),
        outcome: 'Lost',
      },
      user.companyId,
      user.id
    );

    return updatedOpportunity as OpportunityType;
  }
}
