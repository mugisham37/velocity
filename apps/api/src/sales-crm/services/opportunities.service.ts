import {
  type NewOpportunity,
  type Opportunity,
  type OpportunityActivity,
  type OpportunityCompetitor,
  customers,
  leads,
  opportunities,
  opportunityActivities,
  opportunityCompetitors,
  opportunityStageHistory,
  opportunityTeamMembers,
} from '@kiro/database';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gte, like, lte, or, sql } from '@kiro/database';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AuditService } from '../../common/services/audit.service';
import { BaseService } from '../../common/services/base.service';
import { NotificationService } from '../../common/services/notification.service';
import { CacheService } from '../../common/services/cache.service';
import { PerformanceMonitorService } from '../../common/services/performance-monitor.service';

export interface CreateOpportunityDto {
  name: string;
  customerId?: string;
  leadId?: string;
  stage?:
    | 'Prospecting'
    | 'Qualification'
    | 'Needs Analysis'
    | 'Value Proposition'
    | 'Proposal'
    | 'Negotiation';
  probability?: number;
  amount: number;
  currency?: string;
  expectedCloseDate?: Date;
  source?:
    | 'Website'
    | 'Email Campaign'
    | 'Social Media'
    | 'Referral'
    | 'Cold Call'
    | 'Trade Show'
    | 'Advertisement'
    | 'Partner'
    | 'Other';
  description?: string;
  nextStep?: string;
  assignedTo?: string;
  territory?: string;
  competitorInfo?: Record<string, any>;
  customFields?: Record<string, any>;
}

export interface UpdateOpportunityDto {
  name?: string;
  customerId?: string;
  stage?:
    | 'Prospecting'
    | 'Qualification'
    | 'Needs Analysis'
    | 'Value Proposition'
    | 'Proposal'
    | 'Negotiation'
    | 'Closed Won'
    | 'Closed Lost';
  probability?: number;
  amount?: number;
  currency?: string;
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  source?:
    | 'Website'
    | 'Email Campaign'
    | 'Social Media'
    | 'Referral'
    | 'Cold Call'
    | 'Trade Show'
    | 'Advertisement'
    | 'Partner'
    | 'Other';
  description?: string;
  nextStep?: string;
  assignedTo?: string;
  territory?: string;
  competitorInfo?: Record<string, any>;
  lostReason?: string;
  customFields?: Record<string, any>;
}

export interface CreateOpportunityActivityDto {
  opportunityId: string;
  activityType: string;
  subject: string;
  description?: string;
  activityDate: Date;
  duration?: number;
  outcome?: string;
  nextAction?: string;
  nextActionDate?: Date;
}

export interface CreateOpportunityCompetitorDto {
  opportunityId: string;
  competitorName: string;
  strengths?: string;
  weaknesses?: string;
  pricing?: number;
  winProbability?: number;
  notes?: string;
}

export interface AddTeamMemberDto {
  opportunityId: string;
  userId: string;
  role: string;
  accessLevel?: 'Read' | 'Write' | 'Full';
}

export interface OpportunityFilterDto {
  stage?: string[];
  assignedTo?: string[];
  territory?: string[];
  source?: string[];
  customerId?: string[];
  minAmount?: number;
  maxAmount?: number;
  minProbability?: number;
  maxProbability?: number;
  expectedCloseAfter?: Date;
  expectedCloseBefore?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
  search?: string;
}

@Injectable()
export class OpportunitiesService extends BaseService<
  any,
  Opportunity,
  NewOpportunity,
  Record<string, any>
> {
  protected table = opportunities as any;
  protected tableName = 'opportunities';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    logger: Logger,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    protected override readonly cacheService: CacheService,
    protected override readonly performanceMonitor: PerformanceMonitorService
  ) {
    super(logger, cacheService, performanceMonitor);
  }

  /**
   * Create opportunity with auto-generated code
   */
  async createOpportunity(
    data: CreateOpportunityDto,
    companyId: string,
    userId?: string
  ): Promise<Opportunity> {
    return await this.transaction(async tx => {
      // Generate opportunity code
      const opportunityCode = await this.generateOpportunityCode(companyId);

      // Validate customer exists if provided
      if (data.customerId) {
        const [customer] = await tx
          .select()
          .from(customers)
          .where(
            and(
              eq(customers.id, data.customerId),
              eq(customers.companyId, companyId)
            )
          )
          .limit(1);

        if (!customer) {
          throw new BadRequestException('Customer not found');
        }
      }

      // Validate lead exists if provided
      if (data.leadId) {
        const [lead] = await tx
          .select()
          .from(leads)
          .where(and(eq(leads.id, data.leadId), eq(leads.companyId, companyId)))
          .limit(1);

        if (!lead) {
          throw new BadRequestException('Lead not found');
        }
      }

      // Create opportunity
      const [opportunity] = await tx
        .insert(opportunities)
        .values({
          opportunityCode,
          name: data.name,
          customerId: data.customerId || null,
          leadId: data.leadId || null,
          stage: data.stage || 'Prospecting',
          probability:
            data.probability ||
            this.getDefaultProbability(data.stage || 'Prospecting'),
          amount: data.amount.toString(),
          currency: data.currency || 'USD',
          expectedCloseDate: data.expectedCloseDate || null,
          source: data.source || null,
          description: data.description || null,
          nextStep: data.nextStep || null,
          assignedTo: data.assignedTo || userId || null,
          territory: data.territory || null,
          competitorInfo: data.competitorInfo || null,
          customFields: data.customFields || null,
          companyId,
        })
        .returning();

      if (!opportunity) {
        throw new BadRequestException('Failed to create opportunity');
      }

      // Create initial stage history
      await tx.insert(opportunityStageHistory).values({
        opportunityId: opportunity.id,
        toStage: opportunity.stage,
        probability: opportunity.probability,
        amount: opportunity.amount,
        notes: 'Opportunity created',
        changedBy: userId || 'system',
        companyId,
      });

      // Create initial activity
      await tx.insert(opportunityActivities).values({
        opportunityId: opportunity.id,
        activityType: 'Opportunity Created',
        subject: 'Opportunity created in system',
        description: `Opportunity created with stage ${opportunity.stage}`,
        activityDate: new Date(),
        createdBy: userId || 'system',
        companyId,
      });

      // Add creator as team member if assigned to someone else
      if (userId && data.assignedTo && userId !== data.assignedTo) {
        await tx.insert(opportunityTeamMembers).values({
          opportunityId: opportunity.id,
          userId,
          role: 'Creator',
          accessLevel: 'Full',
          addedBy: userId,
          companyId,
        });
      }

      // Add assigned user as team member
      if (data.assignedTo) {
        await tx.insert(opportunityTeamMembers).values({
          opportunityId: opportunity.id,
          userId: data.assignedTo,
          role: 'Owner',
          accessLevel: 'Full',
          addedBy: userId || 'system',
          companyId,
        });

        // Send notification to assigned user
        if (userId !== data.assignedTo) {
          await this.notificationService.sendNotification(
            {
              title: 'New Opportunity Assigned',
              message: `A new opportunity "${data.name}" has been assigned to you`,
              type: 'INFO',
              recipientId: data.assignedTo,
              entityType: 'opportunities',
              entityId: opportunity.id,
            },
            companyId,
            ['EMAIL', 'IN_APP']
          );
        }
      }

      // Log audit trail
      if (userId) {
        await this.auditService.logAudit({
          entityType: 'opportunities',
          entityId: opportunity.id,
          action: 'CREATE',
          newValues: opportunity,
          companyId,
          userId,
        });
      } else {
        await this.auditService.logAudit({
          entityType: 'opportunities',
          entityId: opportunity.id,
          action: 'CREATE',
          newValues: opportunity,
          companyId,
        });
      }

      return opportunity;
    });
  }

  /**
   * Update opportunity and track stage changes
   */
  async updateOpportunity(
    id: string,
    data: UpdateOpportunityDto,
    companyId: string,
    userId?: string
  ): Promise<Opportunity> {
    const oldOpportunity = await this.findByIdOrFail(id, companyId);

    return await this.transaction(async tx => {
      // Prepare update data with proper type conversions
      const updateData: any = { ...data, updatedAt: new Date() };

      // Convert amount to string if provided
      if (updateData.amount !== undefined) {
        updateData.amount = updateData.amount.toString();
      }

      // Update opportunity
      const [updatedOpportunity] = await tx
        .update(opportunities)
        .set(updateData)
        .where(
          and(eq(opportunities.id, id), eq(opportunities.companyId, companyId))
        )
        .returning();

      if (!updatedOpportunity) {
        throw new BadRequestException('Failed to update opportunity');
      }

      // Track stage changes
      if (data.stage && data.stage !== oldOpportunity.stage) {
        await tx.insert(opportunityStageHistory).values({
          opportunityId: id,
          fromStage: oldOpportunity.stage,
          toStage: data.stage,
          probability: data.probability || updatedOpportunity.probability,
          amount: data.amount?.toString() || updatedOpportunity.amount,
          notes: `Stage changed from ${oldOpportunity.stage} to ${data.stage}`,
          changedBy: userId || 'system',
          companyId,
        });

        // Create activity for stage change
        await tx.insert(opportunityActivities).values({
          opportunityId: id,
          activityType: 'Stage Change',
          subject: `Stage changed from ${oldOpportunity.stage} to ${data.stage}`,
          activityDate: new Date(),
          createdBy: userId || 'system',
          companyId,
        });

        // Handle closed opportunities
        if (data.stage === 'Closed Won' || data.stage === 'Closed Lost') {
          await tx
            .update(opportunities)
            .set({ actualCloseDate: new Date() })
            .where(eq(opportunities.id, id));

          // Send notification to team members
          const teamMembers = await tx
            .select({ userId: opportunityTeamMembers.userId })
            .from(opportunityTeamMembers)
            .where(eq(opportunityTeamMembers.opportunityId, id));

          for (const member of teamMembers) {
            await this.notificationService.sendNotification(
              {
                title: `Opportunity ${data.stage}`,
                message: `Opportunity "${updatedOpportunity.name}" has been ${data.stage.toLowerCase()}`,
                type: data.stage === 'Closed Won' ? 'SUCCESS' : 'WARNING',
                recipientId: member.userId,
                entityType: 'opportunities',
                entityId: id,
              },
              companyId,
              ['IN_APP']
            );
          }
        }
      }

      // Log audit trail
      if (userId) {
        await this.auditService.logAudit({
          entityType: 'opportunities',
          entityId: id,
          action: 'UPDATE',
          oldValues: oldOpportunity,
          newValues: updatedOpportunity,
          companyId,
          userId,
        });
      } else {
        await this.auditService.logAudit({
          entityType: 'opportunities',
          entityId: id,
          action: 'UPDATE',
          oldValues: oldOpportunity,
          newValues: updatedOpportunity,
          companyId,
        });
      }

      return updatedOpportunity;
    });
  }

  /**
   * Create opportunity activity
   */
  async createActivity(
    data: CreateOpportunityActivityDto,
    companyId: string,
    userId: string
  ): Promise<OpportunityActivity> {
    // Validate opportunity exists
    await this.findByIdOrFail(data.opportunityId, companyId);

    const [activity] = await this.database
      .insert(opportunityActivities)
      .values({
        opportunityId: data.opportunityId,
        activityType: data.activityType,
        subject: data.subject,
        description: data.description || null,
        activityDate: data.activityDate,
        duration: data.duration || null,
        outcome: data.outcome || null,
        nextAction: data.nextAction || null,
        nextActionDate: data.nextActionDate || null,
        createdBy: userId,
        companyId,
      })
      .returning();

    if (!activity) {
      throw new BadRequestException('Failed to create activity');
    }

    // Update opportunity's next step if provided
    if (data.nextAction) {
      await this.database
        .update(opportunities)
        .set({
          nextStep: data.nextAction,
          updatedAt: new Date(),
        })
        .where(eq(opportunities.id, data.opportunityId));
    }

    // Log audit trail
    await this.auditService.logAudit({
      entityType: 'opportunity_activities',
      entityId: activity.id,
      action: 'CREATE',
      newValues: activity,
      companyId,
      userId,
    });

    return activity;
  }

  /**
   * Add competitor to opportunity
   */
  async addCompetitor(
    data: CreateOpportunityCompetitorDto,
    companyId: string,
    userId: string
  ): Promise<OpportunityCompetitor> {
    // Validate opportunity exists
    await this.findByIdOrFail(data.opportunityId, companyId);

    const [competitor] = await this.database
      .insert(opportunityCompetitors)
      .values({
        opportunityId: data.opportunityId,
        competitorName: data.competitorName,
        strengths: data.strengths || null,
        weaknesses: data.weaknesses || null,
        pricing: data.pricing?.toString() || null,
        winProbability: data.winProbability || null,
        notes: data.notes || null,
        companyId,
      })
      .returning();

    if (!competitor) {
      throw new BadRequestException('Failed to create competitor');
    }

    // Log audit trail
    await this.auditService.logAudit({
      entityType: 'opportunity_competitors',
      entityId: competitor.id,
      action: 'CREATE',
      newValues: competitor,
      companyId,
      userId,
    });

    return competitor;
  }

  /**
   * Add team member to opportunity
   */
  async addTeamMember(
    data: AddTeamMemberDto,
    companyId: string,
    userId: string
  ): Promise<void> {
    // Validate opportunity exists
    await this.findByIdOrFail(data.opportunityId, companyId);

    // Check if user is already a team member
    const [existingMember] = await this.database
      .select()
      .from(opportunityTeamMembers)
      .where(
        and(
          eq(opportunityTeamMembers.opportunityId, data.opportunityId),
          eq(opportunityTeamMembers.userId, data.userId)
        )
      )
      .limit(1);

    if (existingMember) {
      throw new BadRequestException('User is already a team member');
    }

    await this.database.insert(opportunityTeamMembers).values({
      opportunityId: data.opportunityId,
      userId: data.userId,
      role: data.role,
      accessLevel: data.accessLevel || 'Read',
      addedBy: userId,
      companyId,
    });

    // Send notification to new team member
    const opportunity = await this.findById(data.opportunityId, companyId);
    await this.notificationService.sendNotification(
      {
        title: 'Added to Opportunity Team',
        message: `You have been added to the opportunity "${opportunity?.name}" team`,
        type: 'INFO',
        recipientId: data.userId,
        entityType: 'opportunities',
        entityId: data.opportunityId,
      },
      companyId,
      ['IN_APP']
    );
  }

  /**
   * Get opportunity activities
   */
  async getOpportunityActivities(
    opportunityId: string,
    companyId: string
  ): Promise<OpportunityActivity[]> {
    return await this.database
      .select()
      .from(opportunityActivities)
      .where(
        and(
          eq(opportunityActivities.opportunityId, opportunityId),
          eq(opportunityActivities.companyId, companyId)
        )
      )
      .orderBy(desc(opportunityActivities.activityDate));
  }

  /**
   * Get opportunity stage history
   */
  async getOpportunityStageHistory(
    opportunityId: string,
    companyId: string
  ): Promise<any[]> {
    return await this.database
      .select()
      .from(opportunityStageHistory)
      .where(
        and(
          eq(opportunityStageHistory.opportunityId, opportunityId),
          eq(opportunityStageHistory.companyId, companyId)
        )
      )
      .orderBy(desc(opportunityStageHistory.changedAt));
  }

  /**
   * Get opportunity competitors
   */
  async getOpportunityCompetitors(
    opportunityId: string,
    companyId: string
  ): Promise<OpportunityCompetitor[]> {
    return await this.database
      .select()
      .from(opportunityCompetitors)
      .where(
        and(
          eq(opportunityCompetitors.opportunityId, opportunityId),
          eq(opportunityCompetitors.companyId, companyId)
        )
      )
      .orderBy(opportunityCompetitors.competitorName);
  }

  /**
   * Get opportunities with filtering and pagination
   */
  async getOpportunities(
    filter: OpportunityFilterDto,
    companyId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ opportunities: Opportunity[]; total: number }> {
    const conditions = [eq(opportunities.companyId, companyId)];

    // Apply filters
    if (filter.stage?.length) {
      conditions.push(sql`${opportunities.stage} = ANY(${filter.stage})`);
    }

    if (filter.assignedTo?.length) {
      conditions.push(
        sql`${opportunities.assignedTo} = ANY(${filter.assignedTo})`
      );
    }

    if (filter.territory?.length) {
      conditions.push(
        sql`${opportunities.territory} = ANY(${filter.territory})`
      );
    }

    if (filter.source?.length) {
      conditions.push(sql`${opportunities.source} = ANY(${filter.source})`);
    }

    if (filter.customerId?.length) {
      conditions.push(
        sql`${opportunities.customerId} = ANY(${filter.customerId})`
      );
    }

    if (filter.minAmount !== undefined) {
      conditions.push(
        sql`CAST(${opportunities.amount} AS DECIMAL) >= ${filter.minAmount}`
      );
    }

    if (filter.maxAmount !== undefined) {
      conditions.push(
        sql`CAST(${opportunities.amount} AS DECIMAL) <= ${filter.maxAmount}`
      );
    }

    if (filter.minProbability !== undefined) {
      conditions.push(gte(opportunities.probability, filter.minProbability));
    }

    if (filter.maxProbability !== undefined) {
      conditions.push(lte(opportunities.probability, filter.maxProbability));
    }

    if (filter.expectedCloseAfter) {
      conditions.push(
        gte(opportunities.expectedCloseDate, filter.expectedCloseAfter)
      );
    }

    if (filter.expectedCloseBefore) {
      conditions.push(
        lte(opportunities.expectedCloseDate, filter.expectedCloseBefore)
      );
    }

    if (filter.createdAfter) {
      conditions.push(gte(opportunities.createdAt, filter.createdAfter));
    }

    if (filter.createdBefore) {
      conditions.push(lte(opportunities.createdAt, filter.createdBefore));
    }

    if (filter.search) {
      const searchCondition = or(
        like(opportunities.name, `%${filter.search}%`),
        like(opportunities.description, `%${filter.search}%`),
        like(opportunities.opportunityCode, `%${filter.search}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Get total count
    const countResult = await this.database
      .select({ count: sql<number>`count(*)` })
      .from(opportunities)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const count = countResult[0]?.count || 0;

    // Get paginated results
    const results = await this.database
      .select()
      .from(opportunities)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(opportunities.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      opportunities: results,
      total: count,
    };
  }

  /**
   * Get sales forecast
   */
  async getSalesForecast(
    companyId: string,
    period?: { start: Date; end: Date }
  ): Promise<any> {
    const baseConditions = [
      eq(opportunities.companyId, companyId),
      sql`${opportunities.stage} NOT IN ('Closed Won', 'Closed Lost')`,
    ];

    if (period) {
      baseConditions.push(
        gte(opportunities.expectedCloseDate, period.start),
        lte(opportunities.expectedCloseDate, period.end)
      );
    }

    const query = this.database
      .select({
        stage: opportunities.stage,
        totalAmount: sql<number>`SUM(CAST(${opportunities.amount} AS DECIMAL))`,
        weightedAmount: sql<number>`SUM(CAST(${opportunities.amount} AS DECIMAL) * ${opportunities.probability} / 100)`,
        count: sql<number>`COUNT(*)`,
        averageProbability: sql<number>`AVG(${opportunities.probability})`,
      })
      .from(opportunities)
      .where(and(...baseConditions))
      .groupBy(opportunities.stage);

    const forecastByStage = await query;

    // Get historical conversion rates
    const conversionRates = await this.database
      .select({
        fromStage: opportunityStageHistory.fromStage,
        toStage: opportunityStageHistory.toStage,
        count: sql<number>`COUNT(*)`,
      })
      .from(opportunityStageHistory)
      .where(eq(opportunityStageHistory.companyId, companyId))
      .groupBy(
        opportunityStageHistory.fromStage,
        opportunityStageHistory.toStage
      );

    return {
      forecastByStage,
      conversionRates,
      totalPipeline: forecastByStage.reduce(
        (sum, stage) => sum + stage.totalAmount,
        0
      ),
      totalWeighted: forecastByStage.reduce(
        (sum, stage) => sum + stage.weightedAmount,
        0
      ),
    };
  }

  /**
   * Get opportunity analytics
   */
  async getOpportunityAnalytics(companyId: string): Promise<any> {
    const analytics = await this.database
      .select({
        totalOpportunities: sql<number>`COUNT(*)`,
        openOpportunities: sql<number>`COUNT(*) FILTER (WHERE ${opportunities.stage} NOT IN ('Closed Won', 'Closed Lost'))`,
        wonOpportunities: sql<number>`COUNT(*) FILTER (WHERE ${opportunities.stage} = 'Closed Won')`,
        lostOpportunities: sql<number>`COUNT(*) FILTER (WHERE ${opportunities.stage} = 'Closed Lost')`,
        totalValue: sql<number>`SUM(CAST(${opportunities.amount} AS DECIMAL))`,
        wonValue: sql<number>`SUM(CAST(${opportunities.amount} AS DECIMAL)) FILTER (WHERE ${opportunities.stage} = 'Closed Won')`,
        averageDealSize: sql<number>`AVG(CAST(${opportunities.amount} AS DECIMAL))`,
        averageProbability: sql<number>`AVG(${opportunities.probability})`,
        winRate: sql<number>`
          CASE
            WHEN COUNT(*) FILTER (WHERE ${opportunities.stage} IN ('Closed Won', 'Closed Lost')) > 0
            THEN (COUNT(*) FILTER (WHERE ${opportunities.stage} = 'Closed Won') * 100.0 /
                  COUNT(*) FILTER (WHERE ${opportunities.stage} IN ('Closed Won', 'Closed Lost')))
            ELSE 0
          END
        `,
      })
      .from(opportunities)
      .where(eq(opportunities.companyId, companyId));

    // Get opportunities by stage
    const opportunitiesByStage = await this.database
      .select({
        stage: opportunities.stage,
        count: sql<number>`COUNT(*)`,
        totalValue: sql<number>`SUM(CAST(${opportunities.amount} AS DECIMAL))`,
      })
      .from(opportunities)
      .where(eq(opportunities.companyId, companyId))
      .groupBy(opportunities.stage);

    // Get opportunities by source
    const opportunitiesBySource = await this.database
      .select({
        source: opportunities.source,
        count: sql<number>`COUNT(*)`,
        wonCount: sql<number>`COUNT(*) FILTER (WHERE ${opportunities.stage} = 'Closed Won')`,
        totalValue: sql<number>`SUM(CAST(${opportunities.amount} AS DECIMAL))`,
      })
      .from(opportunities)
      .where(eq(opportunities.companyId, companyId))
      .groupBy(opportunities.source);

    return {
      ...analytics[0],
      opportunitiesByStage,
      opportunitiesBySource,
    };
  }

  /**
   * Private helper methods
   */
  private async generateOpportunityCode(companyId: string): Promise<string> {
    const prefix = 'OPP';

    const result = await this.database
      .select({
        maxCode: sql<string>`MAX(CAST(SUBSTRING(${opportunities.opportunityCode}, 4) AS INTEGER))`,
      })
      .from(opportunities)
      .where(
        and(
          eq(opportunities.companyId, companyId),
          like(opportunities.opportunityCode, `${prefix}%`)
        )
      );

    const maxCode = result[0]?.maxCode;
    const nextNumber = maxCode ? parseInt(maxCode) + 1 : 1;
    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }

  private getDefaultProbability(stage: string): number {
    const probabilityMap: Record<string, number> = {
      Prospecting: 10,
      Qualification: 20,
      'Needs Analysis': 30,
      'Value Proposition': 40,
      Proposal: 60,
      Negotiation: 80,
      'Closed Won': 100,
      'Closed Lost': 0,
    };

    return probabilityMap[stage] || 10;
  }
}
