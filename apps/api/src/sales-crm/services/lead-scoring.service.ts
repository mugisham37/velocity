import {
  type Lead,
  type LeadScoringRule,
  type NewLeadScoringRule,
  leadScoringRules,
  leads,
} from '@kiro/database';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from '@kiro/database';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { BaseService } from '../../common/services/base.service';
import { CacheService } from '../../common/services/cache.service';
import { PerformanceMonitorService } from '../../common/services/performance-monitor.service';

export interface CreateLeadScoringRuleDto {
  name: string;
  description?: string;
  criteria: Record<string, any>;
  points: number;
  isActive?: boolean;
}

export interface UpdateLeadScoringRuleDto {
  name?: string;
  description?: string;
  criteria?: Record<string, any>;
  points?: number;
  isActive?: boolean;
}

@Injectable()
export class LeadScoringService extends BaseService<
  any,
  LeadScoringRule,
  NewLeadScoringRule,
  Record<string, any>
> {
  protected table = leadScoringRules as any;
  protected tableName = 'lead_scoring_rules';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    logger: Logger,
    cacheService: CacheService,
    performanceMonitor: PerformanceMonitorService
  ) {
    super(logger, cacheService, performanceMonitor);
  }

  /**
   * Calculate lead score based on active scoring rules
   */
  async calculateLeadScore(lead: Lead, companyId: string): Promise<number> {
    // Get all active scoring rules
    const rules = await this.database
      .select()
      .from(leadScoringRules)
      .where(
        and(
          eq(leadScoringRules.companyId, companyId),
          eq(leadScoringRules.isActive, true)
        )
      );

    let totalScore = 0;

    for (const rule of rules) {
      if (this.evaluateCriteria(lead, rule.criteria as Record<string, any>)) {
        totalScore += rule.points;
      }
    }

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, totalScore));
  }

  /**
   * Create lead scoring rule
   */
  async createScoringRule(
    data: CreateLeadScoringRuleDto,
    companyId: string,
    _userId?: string
  ): Promise<LeadScoringRule> {
    const [rule] = await this.database
      .insert(leadScoringRules)
      .values({
        name: data.name,
        description: data.description ?? null,
        criteria: data.criteria,
        points: data.points,
        isActive: data.isActive ?? true,
        companyId,
      })
      .returning();

    if (!rule) {
      throw new Error('Failed to create scoring rule');
    }

    return rule;
  }

  /**
   * Update lead scoring rule
   */
  async updateScoringRule(
    id: string,
    data: UpdateLeadScoringRuleDto,
    companyId: string,
    _userId?: string
  ): Promise<LeadScoringRule> {
    const updateData = {
      ...data,
      description: data.description ?? null,
      updatedAt: new Date()
    };

    const [rule] = await this.database
      .update(leadScoringRules)
      .set(updateData)
      .where(
        and(
          eq(leadScoringRules.id, id),
          eq(leadScoringRules.companyId, companyId)
        )
      )
      .returning();

    if (!rule) {
      throw new Error('Scoring rule not found');
    }

    return rule;
  }

  /**
   * Get all scoring rules for a company
   */
  async getScoringRules(companyId: string): Promise<LeadScoringRule[]> {
    return await this.database
      .select()
      .from(leadScoringRules)
      .where(eq(leadScoringRules.companyId, companyId))
      .orderBy(leadScoringRules.name);
  }

  /**
   * Delete scoring rule
   */
  async deleteScoringRule(id: string, companyId: string): Promise<void> {
    await this.database
      .delete(leadScoringRules)
      .where(
        and(
          eq(leadScoringRules.id, id),
          eq(leadScoringRules.companyId, companyId)
        )
      );
  }

  /**
   * Get default scoring rules for setup
   */
  getDefaultScoringRules(): CreateLeadScoringRuleDto[] {
    return [
      {
        name: 'High-Value Industry',
        description: 'Leads from high-value industries',
        criteria: {
          field: 'industry',
          operator: 'in',
          values: ['Technology', 'Finance', 'Healthcare', 'Manufacturing'],
        },
        points: 15,
      },
      {
        name: 'Executive Level',
        description: 'Leads with executive job titles',
        criteria: {
          field: 'jobTitle',
          operator: 'contains_any',
          values: ['CEO', 'CTO', 'CFO', 'VP', 'Director', 'Manager'],
        },
        points: 20,
      },
      {
        name: 'Large Company',
        description:
          'Leads from companies with websites (indicator of established business)',
        criteria: {
          field: 'website',
          operator: 'not_empty',
        },
        points: 10,
      },
      {
        name: 'High Estimated Value',
        description: 'Leads with high estimated deal value',
        criteria: {
          field: 'estimatedValue',
          operator: 'gte',
          value: 50000,
        },
        points: 25,
      },
      {
        name: 'Referral Source',
        description: 'Leads from referrals (high quality)',
        criteria: {
          field: 'source',
          operator: 'equals',
          value: 'Referral',
        },
        points: 20,
      },
      {
        name: 'Website Lead',
        description: 'Leads from website (showing interest)',
        criteria: {
          field: 'source',
          operator: 'equals',
          value: 'Website',
        },
        points: 15,
      },
      {
        name: 'Complete Contact Info',
        description: 'Leads with both email and phone',
        criteria: {
          operator: 'and',
          conditions: [
            { field: 'email', operator: 'not_empty' },
            { field: 'phone', operator: 'not_empty' },
          ],
        },
        points: 10,
      },
      {
        name: 'Near-term Opportunity',
        description: 'Leads with expected close date within 3 months',
        criteria: {
          field: 'expectedCloseDate',
          operator: 'within_days',
          value: 90,
        },
        points: 15,
      },
    ];
  }

  /**
   * Setup default scoring rules for a company
   */
  async setupDefaultScoringRules(
    companyId: string,
    _userId?: string
  ): Promise<LeadScoringRule[]> {
    const defaultRules = this.getDefaultScoringRules();
    const createdRules: LeadScoringRule[] = [];

    for (const ruleData of defaultRules) {
      const rule = await this.createScoringRule(ruleData, companyId, _userId);
      createdRules.push(rule);
    }

    return createdRules;
  }

  /**
   * Recalculate scores for all leads in a company
   */
  async recalculateAllLeadScores(companyId: string): Promise<void> {
    // This would typically be run as a background job
    const leadsToScore = await this.database
      .select()
      .from(leads)
      .where(eq(leads.companyId, companyId));

    for (const lead of leadsToScore) {
      const newScore = await this.calculateLeadScore(lead, companyId);

      await this.database
        .update(leads)
        .set({ score: newScore, updatedAt: new Date() })
        .where(eq(leads.id, lead.id));
    }
  }

  /**
   * Private method to evaluate criteria against lead data
   */
  private evaluateCriteria(lead: Lead, criteria: Record<string, any>): boolean {
    if (criteria['operator'] === 'and') {
      return criteria['conditions'].every((condition: any) =>
        this.evaluateSingleCriteria(lead, condition)
      );
    }

    if (criteria['operator'] === 'or') {
      return criteria['conditions'].some((condition: any) =>
        this.evaluateSingleCriteria(lead, condition)
      );
    }

    return this.evaluateSingleCriteria(lead, criteria);
  }

  private evaluateSingleCriteria(
    lead: Lead,
    criteria: Record<string, any>
  ): boolean {
    const fieldValue = this.getFieldValue(lead, criteria['field']);

    switch (criteria['operator']) {
      case 'equals':
        return fieldValue === criteria['value'];

      case 'not_equals':
        return fieldValue !== criteria['value'];

      case 'in':
        return (
          Array.isArray(criteria['values']) && criteria['values'].includes(fieldValue)
        );

      case 'not_in':
        return (
          Array.isArray(criteria['values']) &&
          !criteria['values'].includes(fieldValue)
        );

      case 'contains':
        return (
          typeof fieldValue === 'string' &&
          typeof criteria['value'] === 'string' &&
          fieldValue.toLowerCase().includes(criteria['value'].toLowerCase())
        );

      case 'contains_any':
        return (
          typeof fieldValue === 'string' &&
          Array.isArray(criteria['values']) &&
          criteria['values'].some((value: string) =>
            fieldValue.toLowerCase().includes(value.toLowerCase())
          )
        );

      case 'not_empty':
        return (
          fieldValue !== null && fieldValue !== undefined && fieldValue !== ''
        );

      case 'empty':
        return (
          fieldValue === null || fieldValue === undefined || fieldValue === ''
        );

      case 'gt':
        return typeof fieldValue === 'number' && fieldValue > criteria['value'];

      case 'gte':
        return typeof fieldValue === 'number' && fieldValue >= criteria['value'];

      case 'lt':
        return typeof fieldValue === 'number' && fieldValue < criteria['value'];

      case 'lte':
        return typeof fieldValue === 'number' && fieldValue <= criteria['value'];

      case 'within_days':
        if (!fieldValue || !(fieldValue instanceof Date)) return false;
        const today = new Date();
        const diffTime = fieldValue.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= criteria['value'];

      case 'past_days':
        if (!fieldValue || !(fieldValue instanceof Date)) return false;
        const now = new Date();
        const pastTime = now.getTime() - fieldValue.getTime();
        const pastDays = Math.ceil(pastTime / (1000 * 60 * 60 * 24));
        return pastDays >= 0 && pastDays <= criteria['value'];

      default:
        return false;
    }
  }

  private getFieldValue(lead: Lead, fieldPath: string): any {
    // Handle nested field paths like 'address.city'
    const fields = fieldPath.split('.');
    let value: any = lead;

    for (const field of fields) {
      if (value === null || value === undefined) {
        return null;
      }
      value = value[field];
    }

    // Convert string numbers to numbers for numeric comparisons
    if (fieldPath === 'estimatedValue' && typeof value === 'string') {
      return parseFloat(value) || 0;
    }

    return value;
  }
}
