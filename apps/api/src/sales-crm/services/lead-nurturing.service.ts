import {
  Lead,
  LeadNurturingCampaign,
  NewLeadNurturingCampaign,
  leadNurturingCampaigns,
  leadCampaignEnrollments,
} from '@kiro/database';
import { Injectable, Inject } from '@nestjs/common';
import { and, eq, sql } from '@kiro/database';
import { WINSTON_MODULE_PROVIDER }om 'nest-winston';
import { Logger } from 'winston';
import { BaseService } from '../../common/services/base.service';
import { NotificationService } from '../../common/services/notification.service';

export interface CreateLeadNurturingCampaignDto {
  name: string;
  description?: string;
  targetCriteria: Record<string, any>;
  workflow: NurturingWorkflow;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateLeadNurturingCampaignDto {
  name?: string;
  description?: string;
  targetCriteria?: Record<string, any>;
  workflow?: NurturingWorkflow;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface NurturingWorkflow {
  steps: NurturingStep[];
}

export interface NurturingStep {
  id: string;
  name: string;
  type: 'email' | 'task' | 'wait' | 'condition' | 'webhook';
  delay: number; // in hours
  config: Record<string, any>;
  nextSteps?: string[]; // for conditional branching
}

export interface EmailStepConfig {
  templateId: string;
  subject: string;
  body: string;
  fromEmail?: string;
  fromName?: string;
}

export interface TaskStepConfig {
  title: string;
  description: string;
  assignTo?: string;
  priority: 'Low' | 'Medium' | 'High';
  dueInHours: number;
}

export interface ConditionStepConfig {
  criteria: Record<string, any>;
  trueStep: string;
  falseStep: string;
}

export interface WebhookStepConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT';
  headers?: Record<string, string>;
  payload?: Record<string, any>;
}

@Injectable()
export class LeadNurturingService extends BaseService<
  typeof leadNurturingCampaigns,
  LeadNurturingCampaign,
  NewLeadNurturingCampaign,
  UpdateLeadNurturingCampaignDto
> {
  protected table = leadNurturingCampaigns;
  protected tableName = 'lead_nurturing_campaigns';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    logger: Logger,
    private readonly notificationService: NotificationService,
  ) {
    super(logger);
  }

  /**
   * Create nurturing campaign
   */
  async createCampaign(
    data: CreateLeadNurturingCampaignDto,
    companyId: string,
    userId?: string
  ): Promise<LeadNurturingCampaign> {
    const [campaign] = await this.database
      .insert(leadNurturingCampaigns)
      .values({
        name: data.name,
        description: data.description,
        targetCriteria: data.targetCriteria,
        workflow: data.workflow,
        isActive: data.isActive ?? true,
        startDate: data.startDate,
        endDate: data.endDate,
        companyId,
      })
      .returning();

    return campaign;
  }

  /**
   * Update nurturing campaign
   */
  async updateCampaign(
    id: string,
    data: UpdateLeadNurturingCampaignDto,
    companyId: string,
    userId?: string
  ): Promise<LeadNurturingCampaign> {
    const [campaign] = await this.database
      .update(leadNurturingCampaigns)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(leadNurturingCampaigns.id, id),
          eq(leadNurturingCampaigns.companyId, companyId)
        )
      )
      .returning();

    if (!campaign) {
      throw new Error('Nurturing campaign not found');
    }

    return campaign;
  }

  /**
   * Get all nurturing campaigns for a company
   */
  async getCampaigns(companyId: string): Promise<LeadNurturingCampaign[]> {
    return await this.database
      .select()
      .from(leadNurturingCampaigns)
      .where(eq(leadNurturingCampaigns.companyId, companyId))
      .orderBy(leadNurturingCampaigns.name);
  }

  /**
   * Delete nurturing campaign
   */
  async deleteCampaign(id: string, companyId: string): Promise<void> {
    // First, cancel all active enrollments
    await this.database
      .update(leadCampaignEnrollments)
      .set({ status: 'Cancelled' })
      .where(
        and(
          eq(leadCampaignEnrollments.campaignId, id),
          eq(leadCampaignEnrollments.companyId, companyId),
          eq(leadCampaignEnrollments.status, 'Active')
        )
      );

    // Then delete the campaign
    await this.database
      .delete(leadNurturingCampaigns)
      .where(
        and(
          eq(leadNurturingCampaigns.id, id),
          eq(leadNurturingCampaigns.companyId, companyId)
        )
      );
  }

  /**
   * Enroll lead in applicable nurturing campaigns
   */
  async enrollInCampaigns(lead: Lead, companyId: string): Promise<void> {
    // Get all active campaigns
    const campaigns = await this.database
      .select()
      .from(leadNurturingCampaigns)
      .where(
        and(
          eq(leadNurturingCampaigns.companyId, companyId),
          eq(leadNurturingCampaigns.isActive, true)
        )
      );

    for (const campaign of campaigns) {
      // Check if lead matches campaign criteria
      if (this.evaluateCriteria(lead, campaign.targetCriteria)) {
        // Check if lead is not already enrolled
        const [existingEnrollment] = await this.database
          .select()
          .from(leadCampaignEnrollments)
          .where(
            and(
              eq(leadCampaignEnrollments.leadId, lead.id),
              eq(leadCampaignEnrollments.campaignId, campaign.id),
              eq(leadCampaignEnrollments.status, 'Active')
            )
          )
          .limit(1);

        if (!existingEnrollment) {
          // Enroll lead in campaign
          await this.database
            .insert(leadCampaignEnrollments)
            .values({
              leadId: lead.id,
              campaignId: campaign.id,
              status: 'Active',
              currentStep: 0,
              companyId,
            });

          this.logger.info(`Lead ${lead.id} enrolled in campaign ${campaign.id}`);
        }
      }
    }
  }

  /**
   * Process nurturing workflows (to be called by a scheduled job)
   */
  async processNurturingWorkflows(companyId: string): Promise<void> {
    // Get all active enrollments that need processing
    const enrollments = await this.database
      .select({
        enrollment: leadCampaignEnrollments,
        campaign: leadNurturingCampaigns,
        lead: this.database.schema.leads,
      })
      .from(leadCampaignEnrollments)
      .innerJoin(
        leadNurturingCampaigns,
        eq(leadCampaignEnrollments.campaignId, leadNurturingCampaigns.id)
      )
      .innerJoin(
        this.database.schema.leads,
        eq(leadCampaignEnrollments.leadId, this.database.schema.leads.id)
      )
      .where(
        and(
          eq(leadCampaignEnrollments.companyId, companyId),
          eq(leadCampaignEnrollments.status, 'Active'),
          // Check if enough time has passed since enrollment or last step
          sql`
            EXTRACT(EPOCH FROM (NOW() - COALESCE(
              ${leadCampaignEnrollments.enrolledAt},
              ${leadCampaignEnrollments.enrolledAt}
            ))) / 3600 >= (
              SELECT COALESCE(
                (workflow->'steps'->>${leadCampaignEnrollments.currentStep}->>'delay')::integer,
                0
              )
            )
          `
        )
      );

    for (const { enrollment, campaign, lead } of enrollments) {
      await this.processEnrollmentStep(enrollment, campaign, lead);
    }
  }

  /**
   * Get default nurturing campaigns for setup
   */
  getDefaultNurturingCampaigns(): CreateLeadNurturingCampaignDto[] {
    return [
      {
        name: 'New Lead Welcome Series',
        description: 'Welcome series for new leads from website',
        targetCriteria: {
          operator: 'and',
          conditions: [
            { field: 'source', operator: 'equals', value: 'Website' },
            { field: 'status', operator: 'equals', value: 'New' },
          ],
        },
        workflow: {
          steps: [
            {
              id: 'welcome-email',
              name: 'Welcome Email',
              type: 'email',
              delay: 1, // 1 hour after enrollment
              config: {
                subject: 'Welcome! Thanks for your interest',
                body: 'Thank you for your interest in our solutions. We\'ll be in touch soon with more information.',
                templateId: 'welcome-template',
              } as EmailStepConfig,
            },
            {
              id: 'follow-up-task',
              name: 'Follow-up Task',
              type: 'task',
              delay: 24, // 24 hours after welcome email
              config: {
                title: 'Follow up with new lead',
                description: 'Call or email the lead to understand their needs',
                priority: 'Medium',
                dueInHours: 48,
              } as TaskStepConfig,
            },
            {
              id: 'product-info-email',
              name: 'Product Information Email',
              type: 'email',
              delay: 72, // 3 days after task
              config: {
                subject: 'Learn more about our solutions',
                body: 'Here\'s some detailed information about how we can help your business...',
                templateId: 'product-info-template',
              } as EmailStepConfig,
            },
          ],
        },
      },
      {
        name: 'High-Value Lead Nurturing',
        description: 'Intensive nurturing for high-value leads',
        targetCriteria: {
          field: 'estimatedValue',
          operator: 'gte',
          value: 50000,
        },
        workflow: {
          steps: [
            {
              id: 'immediate-task',
              name: 'Immediate Follow-up',
              type: 'task',
              delay: 0, // Immediate
              config: {
                title: 'High-value lead - immediate follow-up required',
                description: 'This is a high-value lead. Contact immediately.',
                priority: 'High',
                dueInHours: 2,
              } as TaskStepConfig,
            },
            {
              id: 'executive-intro-email',
              name: 'Executive Introduction',
              type: 'email',
              delay: 4, // 4 hours after task
              config: {
                subject: 'Personal introduction from our CEO',
                body: 'I wanted to personally reach out to discuss how we can help...',
                templateId: 'executive-intro-template',
              } as EmailStepConfig,
            },
          ],
        },
      },
      {
        name: 'Cold Lead Re-engagement',
        description: 'Re-engage leads that have gone cold',
        targetCriteria: {
          operator: 'and',
          conditions: [
            { field: 'status', operator: 'in', values: ['New', 'Contacted'] },
            { field: 'lastContactDate', operator: 'past_days', value: 30 },
          ],
        },
        workflow: {
          steps: [
            {
              id: 'reengagement-email',
              name: 'Re-engagement Email',
              type: 'email',
              delay: 0,
              config: {
                subject: 'Still interested? Let\'s reconnect',
                body: 'We haven\'t heard from you in a while. Are you still interested in learning more?',
                templateId: 'reengagement-template',
              } as EmailStepConfig,
            },
            {
              id: 'check-interest',
              name: 'Check Interest Level',
              type: 'condition',
              delay: 168, // 1 week
              config: {
                criteria: {
                  field: 'lastContactDate',
                  operator: 'within_days',
                  value: 7,
                },
                trueStep: 'continue-nurturing',
                falseStep: 'mark-unqualified',
              } as ConditionStepConfig,
            },
          ],
        },
      },
    ];
  }

  /**
   * Setup default nurturing campaigns for a company
   */
  async setupDefaultCampaigns(companyId: string, userId?: string): Promise<LeadNurturingCampaign[]> {
    const defaultCampaigns = this.getDefaultNurturingCampaigns();
    const createdCampaigns: LeadNurturingCampaign[] = [];

    for (const campaignData of defaultCampaigns) {
      const campaign = await this.createCampaign(campaignData, companyId, userId);
      createdCampaigns.push(campaign);
    }

    return createdCampaigns;
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStatistics(companyId: string): Promise<any> {
    const stats = await this.database
      .select({
        campaignId: leadCampaignEnrollments.campaignId,
        campaignName: leadNurturingCampaigns.name,
        totalEnrollments: sql<number>`COUNT(*)`,
        activeEnrollments: sql<number>`COUNT(*) FILTER (WHERE ${leadCampaignEnrollments.status} = 'Active')`,
        completedEnrollments: sql<number>`COUNT(*) FILTER (WHERE ${leadCampaignEnrollments.status} = 'Completed')`,
        cancelledEnrollments: sql<number>`COUNT(*) FILTER (WHERE ${leadCampaignEnrollments.status} = 'Cancelled')`,
      })
      .from(leadCampaignEnrollments)
      .innerJoin(
        leadNurturingCampaigns,
        eq(leadCampaignEnrollments.campaignId, leadNurturingCampaigns.id)
      )
      .where(eq(leadCampaignEnrollments.companyId, companyId))
      .groupBy(leadCampaignEnrollments.campaignId, leadNurturingCampaigns.name);

    return stats;
  }

  /**
   * Private method to process a single enrollment step
   */
  private async processEnrollmentStep(
    enrollment: any,
    campaign: LeadNurturingCampaign,
    lead: any
  ): Promise<void> {
    const workflow = campaign.workflow as NurturingWorkflow;
    const currentStep = workflow.steps[enrollment.currentStep];

    if (!currentStep) {
      // No more steps, mark as completed
      await this.database
        .update(leadCampaignEnrollments)
        .set({
          status: 'Completed',
          completedAt: new Date(),
        })
        .where(eq(leadCampaignEnrollments.id, enrollment.id));
      return;
    }

    try {
      await this.executeStep(currentStep, lead, campaign.companyId);

      // Move to next step
      await this.database
        .update(leadCampaignEnrollments)
        .set({
          currentStep: enrollment.currentStep + 1,
        })
        .where(eq(leadCampaignEnrollments.id, enrollment.id));

      this.logger.info(`Executed step ${currentStep.name} for lead ${lead.id} in campaign ${campaign.id}`);
    } catch (error) {
      this.logger.error(`Failed to execute step ${currentStep.name} for lead ${lead.id}:`, error);

      // Mark enrollment as failed or pause it
      await this.database
        .update(leadCampaignEnrollments)
        .set({ status: 'Paused' })
        .where(eq(leadCampaignEnrollments.id, enrollment.id));
    }
  }

  /**
   * Private method to execute a workflow step
   */
  private async executeStep(step: NurturingStep, lead: any, companyId: string): Promise<void> {
    switch (step.type) {
      case 'email':
        await this.executeEmailStep(step, lead, companyId);
        break;
      case 'task':
        await this.executeTaskStep(step, lead, companyId);
        break;
      case 'webhook':
        await this.executeWebhookStep(step, lead, companyId);
        break;
      case 'condition':
        // Conditional steps would need more complex handling
        break;
      case 'wait':
        // Wait steps are handled by the delay mechanism
        break;
    }
  }

  private async executeEmailStep(step: NurturingStep, lead: any, companyId: string): Promise<void> {
    const config = step.config as EmailStepConfig;

    if (lead.email) {
      await this.notificationService.sendNotification(
        {
          title: config.subject,
          message: config.body,
          type: 'INFO',
          recipientId: lead.id,
          entityType: 'leads',
          entityId: lead.id,
        },
        companyId,
        ['EMAIL']
      );
    }
  }

  private async executeTaskStep(step: NurturingStep, lead: any, companyId: string): Promise<void> {
    const config = step.config as TaskStepConfig;

    // Create a task for the assigned user or lead owner
    const assignTo = config.assignTo || lead.assignedTo;

    if (assignTo) {
      await this.notificationService.sendNotification(
        {
          title: config.title,
          message: config.description,
          type: 'TASK',
          recipientId: assignTo,
          entityType: 'leads',
          entityId: lead.id,
        },
        companyId,
        ['IN_APP', 'EMAIL']
      );
    }
  }

  private async executeWebhookStep(step: NurturingStep, lead: any, companyId: string): Promise<void> {
    const config = step.config as WebhookStepConfig;

    // This would make an HTTP request to the configured webhook URL
    // Implementation would depend on your HTTP client setup
    this.logger.info(`Webhook step executed for lead ${lead.id}: ${config.url}`);
  }

  /**
   * Private method to evaluate criteria against lead data
   */
  private evaluateCriteria(lead: Lead, criteria: Record<string, any>): boolean {
    if (criteria.operator === 'and') {
      return criteria.conditions.every((condition: any) =>
        this.evaluateSingleCriteria(lead, condition)
      );
    }

    if (criteria.operator === 'or') {
      return criteria.conditions.some((condition: any) =>
        this.evaluateSingleCriteria(lead, condition)
      );
    }

    return this.evaluateSingleCriteria(lead, criteria);
  }

  private evaluateSingleCriteria(lead: Lead, criteria: Record<string, any>): boolean {
    const fieldValue = this.getFieldValue(lead, criteria.field);

    switch (criteria.operator) {
      case 'equals':
        return fieldValue === criteria.value;
      case 'in':
        return Array.isArray(criteria.values) && criteria.values.includes(fieldValue);
      case 'gte':
        return typeof fieldValue === 'number' && fieldValue >= criteria.value;
      case 'past_days':
        if (!fieldValue || !(fieldValue instanceof Date)) return false;
        const now = new Date();
        const pastTime = now.getTime() - fieldValue.getTime();
        const pastDays = Math.ceil(pastTime / (1000 * 60 * 60 * 24));
        return pastDays >= criteria.value;
      case 'within_days':
        if (!fieldValue || !(fieldValue instanceof Date)) return false;
        const today = new Date();
        const diffTime = Math.abs(fieldValue.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= criteria.value;
      default:
        return false;
    }
  }

  private getFieldValue(lead: Lead, fieldPath: string): any {
    const fields = fieldPath.split('.');
    let value: any = lead;

    for (const field of fields) {
      if (value === null || value === undefined) {
        return null;
      }
      value = value[field];
    }

    if (fieldPath === 'estimatedValue' && typeof value === 'string') {
      return parseFloat(value) || 0;
    }

    return value;
  }
}
