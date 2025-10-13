import {
  type NewOpportunityTemplate,
  type OpportunityTemplate,
  opportunityTemplateActivities,
  opportunityTemplateStages,
  opportunityTemplates,
} from '../../database';
import { and, eq, sql } from '../../database';
import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { BaseService } from '../../common/services/base.service';
import { CacheService } from '../../common/services/cache.service';
import { PerformanceMonitorService } from '../../common/services/performance-monitor.service';

export interface CreateOpportunityTemplateDto {
  name: string;
  description?: string;
  productLine?: string;
  industry?: string;
  dealType: 'New Business' | 'Upsell' | 'Renewal' | 'Cross-sell';
  averageDealSize?: number;
  averageSalesCycle?: number;
  stages: CreateTemplateStageDto[];
  activities: CreateTemplateActivityDto[];
  customFields?: Record<string, any>;
}

export interface CreateTemplateStageDto {
  stageName: string;
  stageOrder: number;
  defaultProbability: number;
  requiredActivities?: string[];
  exitCriteria?: string[];
  averageDuration?: number;
  isRequired: boolean;
}

export interface CreateTemplateActivityDto {
  activityName: string;
  activityType: string;
  description?: string;
  stageId?: string;
  isRequired: boolean;
  daysFromStageStart?: number;
  estimatedDuration?: number;
  assignedRole?: string;
}

export interface OpportunityTemplateWithDetails {
  template: OpportunityTemplate;
  stages: any[];
  activities: any[];
}

@Injectable()
export class OpportunityTemplatesService extends BaseService<
  any,
  OpportunityTemplate,
  NewOpportunityTemplate,
  any
> {
  protected table = opportunityTemplates as any;
  protected tableName = 'opportunity_templates';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    logger: Logger,
    cacheService: CacheService,
    performanceMonitor: PerformanceMonitorService
  ) {
    super(logger, cacheService, performanceMonitor);
  }

  /**
   * Create opportunity template with stages and activities
   */
  async createTemplate(
    data: CreateOpportunityTemplateDto,
    companyId: string,
    userId: string
  ): Promise<OpportunityTemplateWithDetails> {
    return await this.transaction(async tx => {
      // Create template
      const [template] = await tx
        .insert(opportunityTemplates)
        .values({
          name: data.name,
          description: data.description || null,
          productLine: data.productLine || null,
          industry: data.industry || null,
          dealType: data.dealType,
          averageDealSize: data.averageDealSize?.toString() || null,
          averageSalesCycle: data.averageSalesCycle || null,
          customFields: data.customFields || null,
          companyId,
          createdBy: userId,
        })
        .returning();

      // Create stages
      const stages = [];
      for (const stageData of data.stages) {
        const [stage] = await tx
          .insert(opportunityTemplateStages)
          .values({
            templateId: template!.id,
            stageName: stageData.stageName,
            stageOrder: stageData.stageOrder,
            defaultProbability: stageData.defaultProbability,
            requiredActivities: stageData.requiredActivities || null,
            exitCriteria: stageData.exitCriteria || null,
            averageDuration: stageData.averageDuration || null,
            isRequired: stageData.isRequired,
            companyId,
          })
          .returning();
        stages.push(stage);
      }

      // Create activities
      const activities = [];
      for (const activityData of data.activities) {
        const [activity] = await tx
          .insert(opportunityTemplateActivities)
          .values({
            templateId: template!.id,
            activityName: activityData.activityName,
            activityType: activityData.activityType,
            description: activityData.description || null,
            isRequired: activityData.isRequired,
            daysFromStageStart: activityData.daysFromStageStart || null,
            estimatedDuration: activityData.estimatedDuration || null,
            assignedRole: activityData.assignedRole || null,
            companyId,
          })
          .returning();
        activities.push(activity);
      }

      return {
        template: template!,
        stages,
        activities,
      };
    });
  }

  /**
   * Get template with all details
   */
  async getTemplateWithDetails(
    templateId: string,
    companyId: string
  ): Promise<OpportunityTemplateWithDetails> {
    const template = await this.findByIdOrFail(templateId, companyId);

    const stages = await this.database
      .select()
      .from(opportunityTemplateStages)
      .where(
        and(
          eq(opportunityTemplateStages.templateId, templateId),
          eq(opportunityTemplateStages.companyId, companyId)
        )
      )
      .orderBy(opportunityTemplateStages.stageOrder);

    const activities = await this.database
      .select()
      .from(opportunityTemplateActivities)
      .where(
        and(
          eq(opportunityTemplateActivities.templateId, templateId),
          eq(opportunityTemplateActivities.companyId, companyId)
        )
      )
      .orderBy(opportunityTemplateActivities.activityName);

    return {
      template,
      stages,
      activities,
    };
  }

  /**
   * Get templates by criteria
   */
  async getTemplatesByCriteria(
    companyId: string,
    criteria: {
      productLine?: string;
      industry?: string;
      dealType?: string;
      dealSizeRange?: { min: number; max: number };
    }
  ): Promise<OpportunityTemplate[]> {
    const conditions = [eq(opportunityTemplates.companyId, companyId)];

    if (criteria.productLine) {
      conditions.push(
        eq(opportunityTemplates.productLine, criteria.productLine)
      );
    }

    if (criteria.industry) {
      conditions.push(eq(opportunityTemplates.industry, criteria.industry));
    }

    if (criteria.dealType) {
      conditions.push(eq(opportunityTemplates.dealType, criteria.dealType));
    }

    if (criteria.dealSizeRange) {
      conditions.push(
        sql`CAST(${opportunityTemplates.averageDealSize} AS DECIMAL) BETWEEN ${criteria.dealSizeRange.min} AND ${criteria.dealSizeRange.max}`
      );
    }

    return await this.database
      .select()
      .from(opportunityTemplates)
      .where(and(...conditions))
      .orderBy(opportunityTemplates.name);
  }

  /**
   * Apply template to opportunity
   */
  async applyTemplateToOpportunity(
    templateId: string,
    opportunityId: string,
    companyId: string,
    userId: string
  ): Promise<void> {
    const templateDetails = await this.getTemplateWithDetails(
      templateId,
      companyId
    );

    await this.transaction(async _tx => {
      // Update opportunity with template defaults
      await this.database.execute(sql`
        UPDATE opportunities 
        SET template_id = ${templateId}, updated_at = ${new Date()}
        WHERE id = ${opportunityId} AND company_id = ${companyId}
      `);

      // Create template-based activities
      for (const activity of templateDetails.activities) {
        if (activity.isRequired) {
          await this.database.execute(sql`
            INSERT INTO opportunity_activities (
              opportunity_id, activity_type, subject, description, 
              activity_date, duration, created_by, company_id
            ) VALUES (
              ${opportunityId}, ${activity.activityType}, ${activity.activityName}, 
              ${activity.description}, 
              NOW() + INTERVAL '${activity.daysFromStageStart || 0} days',
              ${activity.estimatedDuration}, ${userId}, ${companyId}
            )
          `);
        }
      }

      // Create stage-specific tasks or reminders
      for (const stage of templateDetails.stages) {
        if (stage.requiredActivities?.length > 0) {
          // Create tasks for required activities in each stage
          for (const requiredActivity of stage.requiredActivities) {
            await this.database.execute(sql`
              INSERT INTO opportunity_activities (
                opportunity_id, activity_type, subject, description, 
                activity_date, created_by, company_id
              ) VALUES (
                ${opportunityId}, 'Task', ${requiredActivity}, 
                ${'Required activity for ' + stage.stageName + ' stage'},
                ${new Date()}, ${userId}, ${companyId}
              )
            `);
          }
        }
      }
    });
  }

  /**
   * Get template performance analytics
   */
  async getTemplatePerformance(
    templateId: string,
    companyId: string
  ): Promise<any> {
    const performance = await this.database.execute(sql`
      SELECT 
        COUNT(*) as total_opportunities,
        COUNT(*) FILTER (WHERE stage = 'Closed Won') as won_opportunities,
        COUNT(*) FILTER (WHERE stage = 'Closed Lost') as lost_opportunities,
        AVG(CAST(amount AS DECIMAL)) as average_amount,
        SUM(CAST(amount AS DECIMAL)) as total_value,
        SUM(CAST(amount AS DECIMAL)) FILTER (WHERE stage = 'Closed Won') as won_value,
        AVG(EXTRACT(EPOCH FROM (actual_close_date - created_at)) / 86400)
          FILTER (WHERE stage = 'Closed Won' AND actual_close_date IS NOT NULL) as average_sales_cycle,
        CASE
          WHEN COUNT(*) FILTER (WHERE stage IN ('Closed Won', 'Closed Lost')) > 0
          THEN (COUNT(*) FILTER (WHERE stage = 'Closed Won') * 100.0 /
                COUNT(*) FILTER (WHERE stage IN ('Closed Won', 'Closed Lost')))
          ELSE 0
        END as win_rate
      FROM opportunities
      WHERE template_id = ${templateId} AND company_id = ${companyId}
    `);

    // Get stage performance
    const stagePerformance = await this.database.execute(sql`
      SELECT 
        o.stage,
        COUNT(*) as count,
        AVG(
          CASE
            WHEN sh.to_stage IS NOT NULL
            THEN EXTRACT(EPOCH FROM (sh.changed_at - o.created_at)) / 86400
            ELSE EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 86400
          END
        ) as average_time_in_stage
      FROM opportunities o
      LEFT JOIN opportunity_stage_history sh ON sh.opportunity_id = o.id AND sh.from_stage = o.stage
      WHERE o.template_id = ${templateId} AND o.company_id = ${companyId}
      GROUP BY o.stage
    `);

    const perfData = performance[0] as any;
    return {
      totalOpportunities: perfData?.total_opportunities || 0,
      wonOpportunities: perfData?.won_opportunities || 0,
      lostOpportunities: perfData?.lost_opportunities || 0,
      averageAmount: perfData?.average_amount || 0,
      totalValue: perfData?.total_value || 0,
      wonValue: perfData?.won_value || 0,
      averageSalesCycle: perfData?.average_sales_cycle || 0,
      winRate: perfData?.win_rate || 0,
      stagePerformance: stagePerformance as any[],
    };
  }

  /**
   * Clone template
   */
  async cloneTemplate(
    templateId: string,
    newName: string,
    companyId: string,
    userId: string
  ): Promise<OpportunityTemplateWithDetails> {
    const originalTemplate = await this.getTemplateWithDetails(
      templateId,
      companyId
    );

    const cloneData: CreateOpportunityTemplateDto = {
      name: newName,
      description: `Cloned from ${originalTemplate.template.name}`,
      dealType: originalTemplate.template.dealType as any,
      stages: originalTemplate.stages.map(stage => ({
        stageName: stage.stageName,
        stageOrder: stage.stageOrder,
        defaultProbability: stage.defaultProbability,
        requiredActivities: stage.requiredActivities,
        exitCriteria: stage.exitCriteria,
        averageDuration: stage.averageDuration,
        isRequired: stage.isRequired,
      })),
      activities: originalTemplate.activities.map(activity => ({
        activityName: activity.activityName,
        activityType: activity.activityType,
        description: activity.description,
        isRequired: activity.isRequired,
        daysFromStageStart: activity.daysFromStageStart,
        estimatedDuration: activity.estimatedDuration,
        assignedRole: activity.assignedRole,
      })),
      customFields:
        (originalTemplate.template.customFields as Record<string, any>) ||
        undefined,
    };

    // Add optional fields only if they exist
    if (originalTemplate.template.productLine) {
      cloneData.productLine = originalTemplate.template.productLine;
    }
    if (originalTemplate.template.industry) {
      cloneData.industry = originalTemplate.template.industry;
    }
    if (originalTemplate.template.averageDealSize) {
      cloneData.averageDealSize = parseFloat(
        originalTemplate.template.averageDealSize
      );
    }
    if (originalTemplate.template.averageSalesCycle) {
      cloneData.averageSalesCycle = originalTemplate.template.averageSalesCycle;
    }

    return await this.createTemplate(cloneData, companyId, userId);
  }

  /**
   * Get recommended template for opportunity
   */
  async getRecommendedTemplate(
    opportunityData: {
      amount: number;
      customerId?: string;
      industry?: string;
      productLine?: string;
    },
    companyId: string
  ): Promise<OpportunityTemplate | null> {
    // Simple recommendation logic - can be enhanced with ML
    const templates = await this.getTemplatesByCriteria(companyId, {
      ...(opportunityData.industry && { industry: opportunityData.industry }),
      ...(opportunityData.productLine && {
        productLine: opportunityData.productLine,
      }),
      dealSizeRange: {
        min: opportunityData.amount * 0.5,
        max: opportunityData.amount * 2,
      },
    });

    if (templates.length === 0) {
      // Fallback to any template in the same industry
      return (
        (
          await this.getTemplatesByCriteria(companyId, {
            ...(opportunityData.industry && {
              industry: opportunityData.industry,
            }),
          })
        )[0] || null
      );
    }

    // Return the template with the closest average deal size
    return templates.reduce((closest, template) => {
      const templateSize = parseFloat(template.averageDealSize || '0');
      const closestSize = parseFloat(closest.averageDealSize || '0');

      return Math.abs(templateSize - opportunityData.amount) <
        Math.abs(closestSize - opportunityData.amount)
        ? template
        : closest;
    });
  }

  /**
   * Update template from opportunity performance
   */
  async updateTemplateFromPerformance(
    templateId: string,
    companyId: string
  ): Promise<void> {
    const performance = await this.getTemplatePerformance(
      templateId,
      companyId
    );

    if (performance.totalOpportunities > 10) {
      // Update template with actual performance data
      await this.database
        .update(opportunityTemplates)
        .set({
          averageDealSize: performance.averageAmount?.toString(),
          averageSalesCycle: Math.round(performance.averageSalesCycle),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(opportunityTemplates.id, templateId),
            eq(opportunityTemplates.companyId, companyId)
          )
        );

      // Update stage probabilities based on actual conversion rates
      for (const stagePerf of performance.stagePerformance) {
        await this.database
          .update(opportunityTemplateStages)
          .set({
            averageDuration: Math.round(stagePerf.averageTimeInStage),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(opportunityTemplateStages.templateId, templateId),
              eq(opportunityTemplateStages.stageName, stagePerf.stage),
              eq(opportunityTemplateStages.companyId, companyId)
            )
          );
      }
    }
  }
}

