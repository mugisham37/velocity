import { User } from '@kiro/database';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CreateLeadActivityInput,
  CreateLeadInput,
  LeadConversionInput,
  LeadFilterInput,
  UpdateLeadInput,
} from '../dto/lead.dto';
import {
  Lead,
  LeadActivity,
  LeadAnalytics,
  LeadConversionResult,
  LeadScoringRule,
  LeadsConnection,
} from '../entities/lead.entity';
import { LeadAssignmentService } from '../services/lead-assignment.service';
import { LeadNurturingService } from '../services/lead-nurturing.service';
import { LeadScoringService } from '../services/lead-scoring.service';
import { LeadsService } from '../services/leads.service';

@Resolver(() => Lead)
@UseGuards(JwtAuthGuard)
export class LeadsResolver {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly leadScoringService: LeadScoringService,
    private readonly leadAssignmentService: LeadAssignmentService,
    private readonly leadNurturingService: LeadNurturingService
  ) {}

  @Mutation(() => Lead)
  async createLead(
    @Args('input') input: CreateLeadInput,
    @CurrentUser() user: User
  ): Promise<Lead> {
    const leadData = {
      ...input,
      expectedCloseDate: input.expectedCloseDate
        ? new Date(input.expectedCloseDate)
        : undefined,
    };

    return this.leadsService.createLead(
      leadData,
      user.companyId,
      user.id
    ) as Promise<Lead>;
  }

  @Mutation(() => Lead)
  async updateLead(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateLeadInput,
    @CurrentUser() user: User
  ): Promise<Lead> {
    const leadData = {
      ...input,
      expectedCloseDate: input.expectedCloseDate
        ? new Date(input.expectedCloseDate)
        : undefined,
      nextFollowUpDate: input.nextFollowUpDate
        ? new Date(input.nextFollowUpDate)
        : undefined,
    };

    return this.leadsService.updateLead(
      id,
      leadData,
      user.companyId,
      user.id
    ) as Promise<Lead>;
  }

  @Mutation(() => Boolean)
  async deleteLead(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<boolean> {
    await this.leadsService.delete(id, user.companyId);
    return true;
  }

  @Query(() => Lead, { nullable: true })
  async lead(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<Lead | null> {
    return this.leadsService.findById(
      id,
      user.companyId
    ) as Promise<Lead | null>;
  }

  @Query(() => LeadsConnection)
  async leads(
    @Args('filter', { nullable: true }) filter: LeadFilterInput,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @CurrentUser() user: User
  ): Promise<LeadsConnection> {
    const filterData = {
      ...filter,
      createdAfter: filter?.createdAfter
        ? new Date(filter.createdAfter)
        : undefined,
      createdBefore: filter?.createdBefore
        ? new Date(filter.createdBefore)
        : undefined,
      nextFollowUpAfter: filter?.nextFollowUpAfter
        ? new Date(filter.nextFollowUpAfter)
        : undefined,
      nextFollowUpBefore: filter?.nextFollowUpBefore
        ? new Date(filter.nextFollowUpBefore)
        : undefined,
    };

    return this.leadsService.getLeads(
      filterData,
      user.companyId,
      limit,
      offset
    ) as Promise<LeadsConnection>;
  }

  @Query(() => [Lead])
  async leadsRequiringFollowUp(@CurrentUser() user: User): Promise<Lead[]> {
    return this.leadsService.getLeadsRequiringFollowUp(
      user.companyId
    ) as Promise<Lead[]>;
  }

  @Mutation(() => LeadActivity)
  async createLeadActivity(
    @Args('input') input: CreateLeadActivityInput,
    @CurrentUser() user: User
  ): Promise<LeadActivity> {
    const activityData = {
      ...input,
      activityDate: new Date(input.activityDate),
      nextActionDate: input.nextActionDate
        ? new Date(input.nextActionDate)
        : undefined,
    };

    return this.leadsService.createActivity(
      activityData,
      user.companyId,
      user.id
    ) as Promise<LeadActivity>;
  }

  @Query(() => [LeadActivity])
  async leadActivities(
    @Args('leadId', { type: () => ID }) leadId: string,
    @CurrentUser() user: User
  ): Promise<LeadActivity[]> {
    return this.leadsService.getLeadActivities(
      leadId,
      user.companyId
    ) as Promise<LeadActivity[]>;
  }

  @Mutation(() => LeadConversionResult)
  async convertLead(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: LeadConversionInput,
    @CurrentUser() user: User
  ): Promise<LeadConversionResult> {
    const conversionData = {
      ...input,
      opportunityData: input.opportunityData
        ? {
            ...input.opportunityData,
            expectedCloseDate: input.opportunityData.expectedCloseDate
              ? new Date(input.opportunityData.expectedCloseDate)
              : undefined,
          }
        : undefined,
    };

    return this.leadsService.convertLead(
      id,
      conversionData,
      user.companyId,
      user.id
    ) as Promise<LeadConversionResult>;
  }

  @Query(() => LeadAnalytics)
  async leadAnalytics(@CurrentUser() user: User): Promise<LeadAnalytics> {
    return this.leadsService.getLeadAnalytics(
      user.companyId
    ) as Promise<LeadAnalytics>;
  }

  // Lead Scoring Methods
  @Query(() => [LeadScoringRule])
  async leadScoringRules(
    @CurrentUser() user: User
  ): Promise<LeadScoringRule[]> {
    return this.leadScoringService.getScoringRules(user.companyId) as Promise<
      LeadScoringRule[]
    >;
  }

  @Mutation(() => LeadScoringRule)
  async createLeadScoringRule(
    @Args('name') name: string,
    @Args('criteria', { type: () => String }) criteria: string,
    @Args('points', { type: () => Int }) points: number,
    @Args('description', { nullable: true }) description?: string,
    @CurrentUser() user?: User
  ): Promise<LeadScoringRule> {
    const ruleData = {
      name,
      description,
      criteria: JSON.parse(criteria),
      points,
    };

    return this.leadScoringService.createScoringRule(
      ruleData,
      user!.companyId,
      user!.id
    ) as Promise<LeadScoringRule>;
  }

  @Mutation(() => Boolean)
  async setupDefaultLeadScoringRules(
    @CurrentUser() user: User
  ): Promise<boolean> {
    await this.leadScoringService.setupDefaultScoringRules(
      user.companyId,
      user.id
    );
    return true;
  }

  @Mutation(() => Boolean)
  async recalculateLeadScores(@CurrentUser() user: User): Promise<boolean> {
    await this.leadScoringService.recalculateAllLeadScores(user.companyId);
    return true;
  }

  // Lead Assignment Methods
  @Mutation(() => Boolean)
  async setupDefaultLeadAssignmentRules(
    @Args('salesTeamMembers', { type: () => String })
    salesTeamMembersJson: string,
    @CurrentUser() user: User
  ): Promise<boolean> {
    const salesTeamMembers = JSON.parse(salesTeamMembersJson);
    await this.leadAssignmentService.setupDefaultAssignmentRules(
      user.companyId,
      salesTeamMembers,
      user.id
    );
    return true;
  }

  @Mutation(() => Boolean)
  async reassignLeads(@CurrentUser() user: User): Promise<boolean> {
    await this.leadAssignmentService.reassignLeads(user.companyId);
    return true;
  }

  // Lead Nurturing Methods
  @Mutation(() => Boolean)
  async setupDefaultNurturingCampaigns(
    @CurrentUser() user: User
  ): Promise<boolean> {
    await this.leadNurturingService.setupDefaultCampaigns(
      user.companyId,
      user.id
    );
    return true;
  }

  @Mutation(() => Boolean)
  async processNurturingWorkflows(@CurrentUser() user: User): Promise<boolean> {
    await this.leadNurturingService.processNurturingWorkflows(user.companyId);
    return true;
  }

  @Query(() => String)
  async nurturingCampaignStatistics(
    @CurrentUser() user: User
  ): Promise<string> {
    const stats = await this.leadNurturingService.getCampaignStatistics(
      user.companyId
    );
    return JSON.stringify(stats);
  }
}
