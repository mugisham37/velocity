import type { User } from '../../database';
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
import type {
  CreateLeadDto,
  UpdateLeadDto,
  CreateLeadActivityDto,
  LeadConversionDto,
  LeadFilterDto,
} from '../services/leads.service';
import type { CreateLeadScoringRuleDto } from '../services/lead-scoring.service';
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
    const leadData: CreateLeadDto = {
      firstName: input.firstName,
      lastName: input.lastName,
      source: input.source,
      ...(input.email && { email: input.email }),
      ...(input.phone && { phone: input.phone }),
      ...(input.company && { company: input.company }),
      ...(input.jobTitle && { jobTitle: input.jobTitle }),
      ...(input.industry && { industry: input.industry }),
      ...(input.website && { website: input.website }),
      ...(input.address && { address: input.address }),
      ...(input.territory && { territory: input.territory }),
      ...(input.estimatedValue && { estimatedValue: input.estimatedValue }),
      ...(input.notes && { notes: input.notes }),
      ...(input.customFields && { customFields: input.customFields }),
      ...(input.expectedCloseDate && {
        expectedCloseDate: new Date(input.expectedCloseDate),
      }),
    };

    const result = await this.leadsService.createLead(
      leadData,
      user.companyId,
      user.id
    );
    return result as any;
  }

  @Mutation(() => Lead)
  async updateLead(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateLeadInput,
    @CurrentUser() user: User
  ): Promise<Lead> {
    const leadData: UpdateLeadDto = {
      ...(input.firstName && { firstName: input.firstName }),
      ...(input.lastName && { lastName: input.lastName }),
      ...(input.email && { email: input.email }),
      ...(input.phone && { phone: input.phone }),
      ...(input.company && { company: input.company }),
      ...(input.jobTitle && { jobTitle: input.jobTitle }),
      ...(input.industry && { industry: input.industry }),
      ...(input.website && { website: input.website }),
      ...(input.address && { address: input.address }),
      ...(input.source && { source: input.source }),
      ...(input.status && { status: input.status }),
      ...(input.territory && { territory: input.territory }),
      ...(input.estimatedValue && { estimatedValue: input.estimatedValue }),
      ...(input.notes && { notes: input.notes }),
      ...(input.customFields && { customFields: input.customFields }),
      ...(input.expectedCloseDate && {
        expectedCloseDate: new Date(input.expectedCloseDate),
      }),
      ...(input.nextFollowUpDate && {
        nextFollowUpDate: new Date(input.nextFollowUpDate),
      }),
    };

    const result = await this.leadsService.updateLead(
      id,
      leadData,
      user.companyId,
      user.id
    );
    return result as any;
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
    const filterData: LeadFilterDto = {
      ...(filter?.status && { status: filter.status }),
      ...(filter?.source && { source: filter.source }),
      ...(filter?.assignedTo && { assignedTo: filter.assignedTo }),
      ...(filter?.territory && { territory: filter.territory }),
      ...(filter?.industry && { industry: filter.industry }),
      ...(filter?.minScore && { minScore: filter.minScore }),
      ...(filter?.maxScore && { maxScore: filter.maxScore }),
      ...(filter?.search && { search: filter.search }),
      ...(filter?.createdAfter && {
        createdAfter: new Date(filter.createdAfter),
      }),
      ...(filter?.createdBefore && {
        createdBefore: new Date(filter.createdBefore),
      }),
      ...(filter?.nextFollowUpAfter && {
        nextFollowUpAfter: new Date(filter.nextFollowUpAfter),
      }),
      ...(filter?.nextFollowUpBefore && {
        nextFollowUpBefore: new Date(filter.nextFollowUpBefore),
      }),
    };

    const result = await this.leadsService.getLeads(
      filterData,
      user.companyId,
      limit,
      offset
    );
    return result as any;
  }

  @Query(() => [Lead])
  async leadsRequiringFollowUp(@CurrentUser() user: User): Promise<Lead[]> {
    const result = await this.leadsService.getLeadsRequiringFollowUp(
      user.companyId
    );
    return result as any;
  }

  @Mutation(() => LeadActivity)
  async createLeadActivity(
    @Args('input') input: CreateLeadActivityInput,
    @CurrentUser() user: User
  ): Promise<LeadActivity> {
    const activityData: CreateLeadActivityDto = {
      leadId: input.leadId,
      activityType: input.activityType,
      subject: input.subject,
      activityDate: new Date(input.activityDate),
      ...(input.description && { description: input.description }),
      ...(input.duration && { duration: input.duration }),
      ...(input.outcome && { outcome: input.outcome }),
      ...(input.nextAction && { nextAction: input.nextAction }),
      ...(input.nextActionDate && {
        nextActionDate: new Date(input.nextActionDate),
      }),
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
    const conversionData: LeadConversionDto = {
      createCustomer: input.createCustomer,
      createOpportunity: input.createOpportunity,
      ...(input.customerData && { customerData: input.customerData }),
      ...(input.opportunityData && {
        opportunityData: {
          name: input.opportunityData.name,
          amount: input.opportunityData.amount,
          ...(input.opportunityData.stage && { stage: input.opportunityData.stage }),
          ...(input.opportunityData.probability && { probability: input.opportunityData.probability }),
          ...(input.opportunityData.description && { description: input.opportunityData.description }),
          ...(input.opportunityData.expectedCloseDate && {
            expectedCloseDate: new Date(input.opportunityData.expectedCloseDate),
          }),
        },
      }),
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
    const ruleData: CreateLeadScoringRuleDto = {
      name,
      criteria: JSON.parse(criteria),
      points,
      ...(description && { description }),
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

