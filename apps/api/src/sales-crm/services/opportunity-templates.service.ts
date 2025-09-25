import {
  NewOpportunityTemplate,
  OpportunityTemplate,
  opportunityTemplateActivities,
  opportunityTemplateStages,
  opportunityTemplates,
} from '@kiro/database';
import { and, eq, sql } from 'drizzle-orm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { BaseService } from '../../common/services/base.service';

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
  typeof opportunityTemplates,
  OpportunityTemplate,
  NewOpportunityTemplate,
  any
> {
  protected table = opportunityTemplates;
  protected tableName = 'opportunity_templates';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    logger: Logger
  ) {
    super(logger);
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
          description: data.description,
          productLine: data.productLine,
          industry: data.industry,
          dealType: data.dealType,
          averageDealSize: data.averageDealSize?.toString(),
          averageSalesCycle: data.averageSalesCycle,
          customFields: data.customFields,
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
            templateId: template.id,
            stageName: stageData.stageName,
            stageOrder: stageData.stageOrder,
            defaultProbability: stageData.defaultProbability,
            requiredActivities: stageData.requiredActivities,
            exitCriteria: stageData.exitCriteria,
            averageDuration: stageData.averageDuration,
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
            templateId: template.id,
            activityName: activityData.activityName,
            activityType: activityData.activityType,
            description: activityData.description,
            isRequired: activityData.isRequired,
            daysFromStageStart: activityData.daysFromStageStart,
            estimatedDuration: activityData.estimatedDuration,
            assignedRole: activityData.assignedRole,
            companyId,
          })
          .returning();
        activities.push(activity);
      }

      return {
        template,
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

    await this.transaction(async tx => {
      // Update opportunity with template defaults
      await tx
        .update(sql`opportunities`)
        .set({
          template_id: templateId,
          updated_at: new Date(),
        })
        .where(and(eq(sql`id`, opportunityId), eq(sql`company_id`, companyId)));

      // Create template-based activities
      for (const activity of templateDetails.activities) {
        if (activity.isRequired) {
          await tx.insert(sql`opportunity_activities`).values({
            opportunity_id: opportunityId,
            activity_type: activity.activityType,
            subject: activity.activityName,
            description: activity.description,
            activity_date: sql`NOW() + INTERVAL '${activity.daysFromStageStart || 0} days'`,
            duration: activity.estimatedDuration,
            created_by: userId,
            company_id: companyId,
          });
        }
      }

      // Create stage-specific tasks or reminders
      for (const stage of templateDetails.stages) {
        if (stage.requiredActivities?.length > 0) {
          // Create tasks for required activities in each stage
          for (const requiredActivity of stage.requiredActivities) {
            await tx.insert(sql`opportunity_activities`).values({
              opportunity_id: opportunityId,
              activity_type: 'Task',
              subject: requiredActivity,
              description: `Required activity for ${stage.stageName} stage`,
              activity_date: new Date(),
              created_by: userId,
              company_id: companyId,
            });
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
    const performance = await this.database
      .select({
        totalOpportunities: sql<number>`COUNT(*)`,
        wonOpportunities: sql<number>`COUNT(*) FILTER (WHERE stage = 'Closed Won')`,
        lostOpportunities: sql<number>`COUNT(*) FILTER (WHERE stage = 'Closed Lost')`,
        averageAmount: sql<number>`AVG(CAST(amount AS DECIMAL))`,
        totalValue: sql<number>`SUM(CAST(amount AS DECIMAL))`,
        wonValue: sql<number>`SUM(CAST(amount AS DECIMAL)) FILTER (WHERE stage = 'Closed Won')`,
        averageSalesCycle: sql<number>`
          AVG(EXTRACT(EPOCH FROM (actual_close_date - created_at)) / 86400)
          FILTER (WHERE stage = 'Closed Won' AND actual_close_date IS NOT NULL)
        `,
        winRate: sql<number>`
          CASE
            WHEN COUNT(*) FILTER (WHERE stage IN ('Closed Won', 'Closed Lost')) > 0
            THEN (COUNT(*) FILTER (WHERE stage = 'Closed Won') * 100.0 /
                  COUNT(*) FILTER (WHERE stage IN ('Closed Won', 'Closed Lost')))
            ELSE 0
          END
        `,
      })
      .from(sql`opportunities`)
      .where(
        and(eq(sql`template_id`, templateId), eq(sql`company_id`, companyId))
      );

    // Get stage performance
    const stagePerformance = await this.database
      .select({
        stage: sql<string>`stage`,
        count: sql<number>`COUNT(*)`,
        averageTimeInStage: sql<number>`
          AVG(
            CASE
              WHEN stage_history.to_stage IS NOT NULL
              THEN EXTRACT(EPOCH FROM (stage_history.changed_at - opportunities.created_at)) / 86400
              ELSE EXTRACT(EPOCH FROM (NOW() - opportunities.created_at)) / 86400
            END
          )
        `,
      })
      .from(sql`opportunities`)
      .leftJoin(
        sql`opportunity_stage_history stage_history`,
        sql`stage_history.opportunity_id = opportunities.id AND stage_history.from_stage = opportunities.stage`
      )
      .where(
        and(
          eq(sql`opportunities.template_id`, templateId),
          eq(sql`opportunities.company_id`, companyId)
        )
      )
      .groupBy(sql`opportunities.stage`);

    return {
      ...performance[0],
      stagePerformance,
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

    return await this.createTemplate(
      {
        name: newName,
        description: `Cloned from ${originalTemplate.template.name}`,
        productLine: originalTemplate.template.productLine,
        industry: originalTemplate.template.industry,
        dealType: originalTemplate.template.dealType as any,
        averageDealSize: originalTemplate.template.averageDealSize
          ? parseFloat(originalTemplate.template.averageDealSize)
          : undefined,
        averageSalesCycle: originalTemplate.template.averageSalesCycle,
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
        customFields: originalTemplate.template.customFields,
      },
      companyId,
      userId
    );
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
      industry: opportunityData.industry,
      productLine: opportunityData.productLine,
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
            industry: opportunityData.industry,
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
