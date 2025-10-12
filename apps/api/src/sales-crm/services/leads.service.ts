import {
  type Lead,
  type LeadActivity,
  type NewLead,
  customers,
  leadActivities,
  leads,
  opportunities,
} from '@kiro/database';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gte, like, lte, or, sql } from '@kiro/database';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AuditService } from '../../common/services/audit.service';
import { BaseService } from '../../common/services/base.service';
import { NotificationService } from '../../common/services/notification.service';
import { LeadAssignmentService } from './lead-assignment.service';
import { LeadNurturingService } from './lead-nurturing.service';
import { LeadScoringService } from './lead-scoring.service';
import { CacheService } from '../../common/services/cache.service';
import { PerformanceMonitorService } from '../../common/services/performance-monitor.service';

export interface CreateLeadDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  industry?: string;
  website?: string;
  address?: any;
  source:
    | 'Website'
    | 'Email Campaign'
    | 'Social Media'
    | 'Referral'
    | 'Cold Call'
    | 'Trade Show'
    | 'Advertisement'
    | 'Partner'
    | 'Other';
  territory?: string;
  estimatedValue?: number;
  expectedCloseDate?: Date;
  notes?: string;
  customFields?: Record<string, any>;
}

export interface UpdateLeadDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  industry?: string;
  website?: string;
  address?: any;
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
  status?:
    | 'New'
    | 'Contacted'
    | 'Qualified'
    | 'Proposal'
    | 'Negotiation'
    | 'Converted'
    | 'Lost'
    | 'Unqualified';
  territory?: string;
  estimatedValue?: number;
  expectedCloseDate?: Date;
  nextFollowUpDate?: Date;
  notes?: string;
  customFields?: Record<string, any>;
}

export interface CreateLeadActivityDto {
  leadId: string;
  activityType: string;
  subject: string;
  description?: string;
  activityDate: Date;
  duration?: number;
  outcome?: string;
  nextAction?: string;
  nextActionDate?: Date;
}

export interface LeadConversionDto {
  createCustomer: boolean;
  createOpportunity: boolean;
  customerData?: {
    customerName: string;
    customerType?: 'Individual' | 'Company';
    email?: string;
    phone?: string;
    website?: string;
    billingAddress?: any;
    shippingAddress?: any;
  };
  opportunityData?: {
    name: string;
    amount: number;
    expectedCloseDate?: Date;
    stage?:
      | 'Prospecting'
      | 'Qualification'
      | 'Needs Analysis'
      | 'Value Proposition'
      | 'Proposal'
      | 'Negotiation';
    probability?: number;
    description?: string;
  };
}

export interface LeadFilterDto {
  status?: string[];
  source?: string[];
  assignedTo?: string[];
  territory?: string[];
  industry?: string[];
  minScore?: number;
  maxScore?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  nextFollowUpAfter?: Date;
  nextFollowUpBefore?: Date;
  search?: string;
}

@Injectable()
export class LeadsService extends BaseService<
  any,
  Lead,
  NewLead,
  Record<string, any>
> {
  protected table = leads as any;
  protected tableName = 'leads';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    logger: Logger,
    cacheService: CacheService,
    performanceMonitor: PerformanceMonitorService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly leadScoringService: LeadScoringService,
    private readonly leadAssignmentService: LeadAssignmentService,
    private readonly leadNurturingService: LeadNurturingService
  ) {
    super(logger, cacheService, performanceMonitor);
  }

  /**
   * Create lead with auto-generated code, scoring, and assignment
   */
  async createLead(
    data: CreateLeadDto,
    companyId: string,
    userId?: string
  ): Promise<Lead> {
    return await this.transaction(async tx => {
      // Generate lead code
      const leadCode = await this.generateLeadCode(companyId);

      // Create lead
      const [lead] = await tx
        .insert(leads)
        .values({
          leadCode,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email ?? null,
          phone: data.phone ?? null,
          company: data.company ?? null,
          jobTitle: data.jobTitle ?? null,
          industry: data.industry ?? null,
          website: data.website ?? null,
          address: data.address ?? null,
          source: data.source,
          territory: data.territory ?? null,
          estimatedValue: data.estimatedValue?.toString() ?? null,
          expectedCloseDate: data.expectedCloseDate ?? null,
          notes: data.notes ?? null,
          customFields: data.customFields ?? null,
          companyId,
        })
        .returning();

      if (!lead) {
        throw new Error('Failed to create lead');
      }

      // Calculate lead score
      const score = await this.leadScoringService.calculateLeadScore(
        lead,
        companyId
      );

      // Update lead with score
      const [scoredLead] = await tx
        .update(leads)
        .set({ score, updatedAt: new Date() })
        .where(eq(leads.id, lead.id))
        .returning();

      if (!scoredLead) {
        throw new Error('Failed to update lead with score');
      }

      // Auto-assign lead based on rules
      const assignedTo = await this.leadAssignmentService.assignLead(
        scoredLead,
        companyId
      );

      let finalLead = scoredLead;
      if (assignedTo) {
        const [updatedLead] = await tx
          .update(leads)
          .set({ assignedTo, updatedAt: new Date() })
          .where(eq(leads.id, lead.id))
          .returning();

        if (updatedLead) {
          finalLead = updatedLead;
        }
      }

      // Enroll in nurturing campaigns
      await this.leadNurturingService.enrollInCampaigns(finalLead, companyId);

      // Create initial activity
      await tx.insert(leadActivities).values({
        leadId: lead.id,
        activityType: 'Lead Created',
        subject: 'Lead created in system',
        description: `Lead created from ${data.source}`,
        activityDate: new Date(),
        createdBy: userId || 'system',
        companyId,
      });

      // Send notification to assigned user
      if (assignedTo && userId !== assignedTo) {
        await this.notificationService.sendNotification(
          {
            title: 'New Lead Assigned',
            message: `A new lead "${data.firstName} ${data.lastName}" has been assigned to you`,
            type: 'INFO',
            recipientId: assignedTo,
            entityType: 'leads',
            entityId: lead.id,
          },
          companyId,
          ['EMAIL', 'IN_APP']
        );
      }

      // Log audit trail
      const auditEntry: any = {
        entityType: 'leads',
        entityId: lead.id,
        action: 'CREATE',
        newValues: finalLead,
        companyId,
      };
      if (userId) {
        auditEntry.userId = userId;
      }
      await this.auditService.logAudit(auditEntry);

      return finalLead;
    });
  }

  /**
   * Update lead and recalculate score if needed
   */
  async updateLead(
    id: string,
    data: UpdateLeadDto,
    companyId: string,
    userId?: string
  ): Promise<Lead> {
    const oldLead = await this.findByIdOrFail(id, companyId);

    return await this.transaction(async tx => {
      // Prepare update data with proper null handling
      const updateData = {
        ...data,
        email: data.email ?? null,
        phone: data.phone ?? null,
        company: data.company ?? null,
        jobTitle: data.jobTitle ?? null,
        industry: data.industry ?? null,
        website: data.website ?? null,
        address: data.address ?? null,
        territory: data.territory ?? null,
        estimatedValue: data.estimatedValue?.toString() ?? null,
        expectedCloseDate: data.expectedCloseDate ?? null,
        nextFollowUpDate: data.nextFollowUpDate ?? null,
        notes: data.notes ?? null,
        customFields: data.customFields ?? null,
        updatedAt: new Date()
      };

      // Update lead
      const [updatedLead] = await tx
        .update(leads)
        .set(updateData)
        .where(and(eq(leads.id, id), eq(leads.companyId, companyId)))
        .returning();

      if (!updatedLead) {
        throw new Error('Lead not found or update failed');
      }

      // Recalculate score if relevant fields changed
      const scoreRelevantFields = [
        'industry',
        'company',
        'jobTitle',
        'estimatedValue',
        'source',
      ];
      const shouldRecalculateScore = scoreRelevantFields.some(
        field => data[field as keyof UpdateLeadDto] !== undefined
      );

      let finalUpdatedLead = updatedLead;
      if (shouldRecalculateScore) {
        const newScore = await this.leadScoringService.calculateLeadScore(
          updatedLead,
          companyId
        );
        const [rescored] = await tx
          .update(leads)
          .set({ score: newScore, updatedAt: new Date() })
          .where(eq(leads.id, id))
          .returning();
        
        if (rescored) {
          finalUpdatedLead = rescored;
        }
      }

      // Create activity for status change
      if (data.status && data.status !== oldLead.status) {
        await tx.insert(leadActivities).values({
          leadId: id,
          activityType: 'Status Change',
          subject: `Status changed from ${oldLead.status} to ${data.status}`,
          activityDate: new Date(),
          createdBy: userId || 'system',
          companyId,
        });

        // Send notification for important status changes
        if (data.status === 'Qualified' && finalUpdatedLead.assignedTo) {
          await this.notificationService.sendNotification(
            {
              title: 'Lead Qualified',
              message: `Lead "${finalUpdatedLead.firstName} ${finalUpdatedLead.lastName}" has been qualified`,
              type: 'SUCCESS',
              recipientId: finalUpdatedLead.assignedTo,
              entityType: 'leads',
              entityId: id,
            },
            companyId,
            ['IN_APP']
          );
        }
      }

      // Log audit trail
      const auditEntry: any = {
        entityType: 'leads',
        entityId: id,
        action: 'UPDATE',
        oldValues: oldLead,
        newValues: finalUpdatedLead,
        companyId,
      };
      if (userId) {
        auditEntry.userId = userId;
      }
      await this.auditService.logAudit(auditEntry);

      return finalUpdatedLead;
    });
  }

  /**
   * Convert lead to customer and/or opportunity
   */
  async convertLead(
    id: string,
    conversionData: LeadConversionDto,
    companyId: string,
    userId: string
  ): Promise<{
    customer?: any;
    opportunity?: any;
  }> {
    const lead = await this.findByIdOrFail(id, companyId);

    if (lead.isConverted) {
      throw new BadRequestException('Lead has already been converted');
    }

    return await this.transaction(async tx => {
      let customerId: string | undefined;
      let opportunityId: string | undefined;
      let customer: any;
      let opportunity: any;

      // Create customer if requested
      if (conversionData.createCustomer && conversionData.customerData) {
        const customerCode = await this.generateCustomerCode(companyId);

        [customer] = await tx
          .insert(customers)
          .values({
            customerCode,
            customerName: conversionData.customerData.customerName,
            customerType:
              conversionData.customerData.customerType || 'Individual',
            email: conversionData.customerData.email || lead.email,
            phone: conversionData.customerData.phone || lead.phone,
            website: conversionData.customerData.website || lead.website,
            billingAddress:
              conversionData.customerData.billingAddress || lead.address,
            shippingAddress:
              conversionData.customerData.shippingAddress || lead.address,
            companyId,
          })
          .returning();

        customerId = customer.id;
      }

      // Create opportunity if requested
      if (conversionData.createOpportunity && conversionData.opportunityData) {
        const opportunityCode = await this.generateOpportunityCode(companyId);

        [opportunity] = await tx
          .insert(opportunities)
          .values({
            opportunityCode,
            name: conversionData.opportunityData.name,
            customerId: customerId ?? null,
            leadId: id,
            stage: conversionData.opportunityData.stage || 'Prospecting',
            probability: conversionData.opportunityData.probability || 10,
            amount: conversionData.opportunityData.amount.toString(),
            expectedCloseDate: conversionData.opportunityData.expectedCloseDate ?? null,
            description: conversionData.opportunityData.description ?? null,
            source: lead.source,
            assignedTo: lead.assignedTo,
            territory: lead.territory,
            companyId,
          })
          .returning();

        opportunityId = opportunity.id;
      }

      // Mark lead as converted
      await tx
        .update(leads)
        .set({
          isConverted: true,
          status: 'Converted',
          convertedCustomerId: customerId ?? null,
          convertedOpportunityId: opportunityId ?? null,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, id));

      // Create conversion activity
      await tx.insert(leadActivities).values({
        leadId: id,
        activityType: 'Lead Converted',
        subject: 'Lead converted successfully',
        description: `Lead converted to ${customerId ? 'customer' : ''}${customerId && opportunityId ? ' and ' : ''}${opportunityId ? 'opportunity' : ''}`,
        activityDate: new Date(),
        createdBy: userId,
        companyId,
      });

      // Send notification
      if (lead.assignedTo) {
        await this.notificationService.sendNotification(
          {
            title: 'Lead Converted',
            message: `Lead "${lead.firstName} ${lead.lastName}" has been successfully converted`,
            type: 'SUCCESS',
            recipientId: lead.assignedTo,
            entityType: 'leads',
            entityId: id,
          },
          companyId,
          ['EMAIL', 'IN_APP']
        );
      }

      // Log audit trail
      await this.auditService.logAudit({
        entityType: 'leads',
        entityId: id,
        action: 'UPDATE',
        newValues: { customerId, opportunityId, isConverted: true, status: 'Converted' },
        companyId,
        userId,
      });

      return { customer, opportunity };
    });
  }

  /**
   * Create lead activity
   */
  async createActivity(
    data: CreateLeadActivityDto,
    companyId: string,
    userId: string
  ): Promise<LeadActivity> {
    // Validate lead exists
    await this.findByIdOrFail(data.leadId, companyId);

    const [activity] = await this.database
      .insert(leadActivities)
      .values({
        leadId: data.leadId,
        activityType: data.activityType,
        subject: data.subject,
        description: data.description ?? null,
        activityDate: data.activityDate,
        duration: data.duration ?? null,
        outcome: data.outcome ?? null,
        nextAction: data.nextAction ?? null,
        nextActionDate: data.nextActionDate ?? null,
        createdBy: userId,
        companyId,
      })
      .returning();

    if (!activity) {
      throw new Error('Failed to create activity');
    }

    // Update lead's last contact date and next follow-up date
    await this.database
      .update(leads)
      .set({
        lastContactDate: data.activityDate,
        nextFollowUpDate: data.nextActionDate ?? null,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, data.leadId));

    // Log audit trail
    await this.auditService.logAudit({
      entityType: 'lead_activities',
      entityId: activity.id,
      action: 'CREATE',
      newValues: activity,
      companyId,
      userId,
    });

    return activity;
  }

  /**
   * Get lead activities
   */
  async getLeadActivities(
    leadId: string,
    companyId: string
  ): Promise<LeadActivity[]> {
    return await this.database
      .select()
      .from(leadActivities)
      .where(
        and(
          eq(leadActivities.leadId, leadId),
          eq(leadActivities.companyId, companyId)
        )
      )
      .orderBy(desc(leadActivities.activityDate));
  }

  /**
   * Get leads with filtering and pagination
   */
  async getLeads(
    filter: LeadFilterDto,
    companyId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ leads: Lead[]; total: number }> {
    let query = this.database
      .select()
      .from(leads)
      .where(eq(leads.companyId, companyId));

    // Apply filters
    const conditions = [eq(leads.companyId, companyId)];

    if (filter.status?.length) {
      conditions.push(sql`${leads.status} = ANY(${filter.status})`);
    }

    if (filter.source?.length) {
      conditions.push(sql`${leads.source} = ANY(${filter.source})`);
    }

    if (filter.assignedTo?.length) {
      conditions.push(sql`${leads.assignedTo} = ANY(${filter.assignedTo})`);
    }

    if (filter.territory?.length) {
      conditions.push(sql`${leads.territory} = ANY(${filter.territory})`);
    }

    if (filter.industry?.length) {
      conditions.push(sql`${leads.industry} = ANY(${filter.industry})`);
    }

    if (filter.minScore !== undefined) {
      conditions.push(gte(leads.score, filter.minScore));
    }

    if (filter.maxScore !== undefined) {
      conditions.push(lte(leads.score, filter.maxScore));
    }

    if (filter.createdAfter) {
      conditions.push(gte(leads.createdAt, filter.createdAfter));
    }

    if (filter.createdBefore) {
      conditions.push(lte(leads.createdAt, filter.createdBefore));
    }

    if (filter.nextFollowUpAfter) {
      conditions.push(gte(leads.nextFollowUpDate, filter.nextFollowUpAfter));
    }

    if (filter.nextFollowUpBefore) {
      conditions.push(lte(leads.nextFollowUpDate, filter.nextFollowUpBefore));
    }

    if (filter.search) {
      conditions.push(
        or(
          like(leads.firstName, `%${filter.search}%`),
          like(leads.lastName, `%${filter.search}%`),
          like(leads.email, `%${filter.search}%`),
          like(leads.company, `%${filter.search}%`),
          like(leads.phone, `%${filter.search}%`)
        )!
      );
    }

    query = query.where(and(...conditions));

    // Get total count
    const countResult = await this.database
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(and(...conditions));
    
    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const results = await query
      .orderBy(desc(leads.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      leads: results,
      total,
    };
  }

  /**
   * Get leads requiring follow-up
   */
  async getLeadsRequiringFollowUp(companyId: string): Promise<Lead[]> {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return await this.database
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.companyId, companyId),
          lte(leads.nextFollowUpDate, today),
          sql`${leads.status} NOT IN ('Converted', 'Lost', 'Unqualified')`
        )
      )
      .orderBy(asc(leads.nextFollowUpDate));
  }

  /**
   * Get lead analytics
   */
  async getLeadAnalytics(companyId: string): Promise<any> {
    const analytics = await this.database
      .select({
        totalLeads: sql<number>`COUNT(*)`,
        newLeads: sql<number>`COUNT(*) FILTER (WHERE ${leads.status} = 'New')`,
        qualifiedLeads: sql<number>`COUNT(*) FILTER (WHERE ${leads.status} = 'Qualified')`,
        convertedLeads: sql<number>`COUNT(*) FILTER (WHERE ${leads.isConverted} = true)`,
        lostLeads: sql<number>`COUNT(*) FILTER (WHERE ${leads.status} = 'Lost')`,
        averageScore: sql<number>`AVG(${leads.score})`,
        totalEstimatedValue: sql<number>`SUM(CAST(${leads.estimatedValue} AS DECIMAL))`,
        conversionRate: sql<number>`
          CASE
            WHEN COUNT(*) > 0
            THEN (COUNT(*) FILTER (WHERE ${leads.isConverted} = true) * 100.0 / COUNT(*))
            ELSE 0
          END
        `,
      })
      .from(leads)
      .where(eq(leads.companyId, companyId));

    // Get leads by source
    const leadsBySource = await this.database
      .select({
        source: leads.source,
        count: sql<number>`COUNT(*)`,
        converted: sql<number>`COUNT(*) FILTER (WHERE ${leads.isConverted} = true)`,
      })
      .from(leads)
      .where(eq(leads.companyId, companyId))
      .groupBy(leads.source);

    // Get leads by status
    const leadsByStatus = await this.database
      .select({
        status: leads.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(leads)
      .where(eq(leads.companyId, companyId))
      .groupBy(leads.status);

    return {
      ...analytics[0],
      leadsBySource,
      leadsByStatus,
    };
  }

  /**
   * Private helper methods
   */
  private async generateLeadCode(companyId: string): Promise<string> {
    const prefix = 'LEAD';

    const result = await this.database
      .select({
        maxCode: sql<string>`MAX(CAST(SUBSTRING(${leads.leadCode}, 5) AS INTEGER))`,
      })
      .from(leads)
      .where(
        and(eq(leads.companyId, companyId), like(leads.leadCode, `${prefix}%`))
      );

    const maxCode = result[0]?.maxCode;
    const nextNumber = maxCode ? parseInt(maxCode) + 1 : 1;
    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }

  private async generateCustomerCode(companyId: string): Promise<string> {
    const prefix = 'CUST';

    const result = await this.database
      .select({
        maxCode: sql<string>`MAX(CAST(SUBSTRING(customer_code, 5) AS INTEGER))`,
      })
      .from(customers)
      .where(
        and(
          eq(customers.companyId, companyId),
          like(customers.customerCode, `${prefix}%`)
        )
      );

    const maxCode = result[0]?.maxCode;
    const nextNumber = maxCode ? parseInt(maxCode) + 1 : 1;
    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }

  private async generateOpportunityCode(companyId: string): Promise<string> {
    const prefix = 'OPP';

    const result = await this.database
      .select({
        maxCode: sql<string>`MAX(CAST(SUBSTRING(opportunity_code, 4) AS INTEGER))`,
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
}
