import {
  type Lead,
  type LeadAssignmentRule,
  type NewLeadAssignmentRule,
  leadAssignmentRules,
  users,
  leads,
} from '../../database';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from '../../database';
import { Logger } from 'winston';
import { BaseService } from '../../common/services/base.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { CacheService } from '../../common/services/cache.service';
import { PerformanceMonitorService } from '../../common/services/performance-monitor.service';

export interface CreateLeadAssignmentRuleDto {
  name: string;
  description?: string;
  criteria: Record<string, any>;
  assignTo: string;
  priority?: number;
  isActive?: boolean;
}

export interface UpdateLeadAssignmentRuleDto {
  name?: string;
  description?: string;
  criteria?: Record<string, any>;
  assignTo?: string;
  priority?: number;
  isActive?: boolean;
}

@Injectable()
export class LeadAssignmentService extends BaseService<
  any,
  LeadAssignmentRule,
  NewLeadAssignmentRule,
  Record<string, any>
> {
  protected table = leadAssignmentRules as any;
  protected tableName = 'lead_assignment_rules';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    logger: Logger,
    cacheService: CacheService,
    performanceMonitor: PerformanceMonitorService
  ) {
    super(logger, cacheService, performanceMonitor);
  }

  /**
   * Assign lead based on assignment rules
   */
  async assignLead(lead: Lead, companyId: string): Promise<string | null> {
    // Get all active assignment rules ordered by priority
    const rules = await this.database
      .select()
      .from(leadAssignmentRules)
      .where(
        and(
          eq(leadAssignmentRules.companyId, companyId),
          eq(leadAssignmentRules.isActive, true)
        )
      )
      .orderBy(leadAssignmentRules.priority);

    // Find the first matching rule
    for (const rule of rules) {
      if (this.evaluateCriteria(lead, rule.criteria as Record<string, any>)) {
        // Verify the assigned user is still active
        const [assignedUser] = await this.database
          .select({ id: users.id })
          .from(users)
          .where(
            and(
              eq(users.id, rule.assignTo),
              eq(users.companyId, companyId),
              eq(users.isActive, true)
            )
          )
          .limit(1);

        if (assignedUser) {
          return rule.assignTo;
        }
      }
    }

    // If no rules match, use round-robin assignment
    return await this.roundRobinAssignment(companyId);
  }

  /**
   * Create lead assignment rule
   */
  async createAssignmentRule(
    data: CreateLeadAssignmentRuleDto,
    companyId: string,
    _userId?: string
  ): Promise<LeadAssignmentRule> {
    // Verify the assigned user exists and is active
    const [assignedUser] = await this.database
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.id, data.assignTo),
          eq(users.companyId, companyId),
          eq(users.isActive, true)
        )
      )
      .limit(1);

    if (!assignedUser) {
      throw new Error('Assigned user not found or inactive');
    }

    const [rule] = await this.database
      .insert(leadAssignmentRules)
      .values({
        name: data.name,
        description: data.description ?? null,
        criteria: data.criteria,
        assignTo: data.assignTo,
        priority: data.priority ?? 0,
        isActive: data.isActive ?? true,
        companyId,
      })
      .returning();

    if (!rule) {
      throw new Error('Failed to create assignment rule');
    }

    return rule;
  }

  /**
   * Update lead assignment rule
   */
  async updateAssignmentRule(
    id: string,
    data: UpdateLeadAssignmentRuleDto,
    companyId: string,
    _userId?: string
  ): Promise<LeadAssignmentRule> {
    // Verify the assigned user exists and is active if being updated
    if (data.assignTo) {
      const [assignedUser] = await this.database
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.id, data.assignTo),
            eq(users.companyId, companyId),
            eq(users.isActive, true)
          )
        )
        .limit(1);

      if (!assignedUser) {
        throw new Error('Assigned user not found or inactive');
      }
    }

    const updateData = {
      ...data,
      description: data.description ?? null,
      updatedAt: new Date()
    };

    const [rule] = await this.database
      .update(leadAssignmentRules)
      .set(updateData)
      .where(
        and(
          eq(leadAssignmentRules.id, id),
          eq(leadAssignmentRules.companyId, companyId)
        )
      )
      .returning();

    if (!rule) {
      throw new Error('Assignment rule not found');
    }

    return rule;
  }

  /**
   * Get all assignment rules for a company
   */
  async getAssignmentRules(companyId: string): Promise<LeadAssignmentRule[]> {
    return await this.database
      .select()
      .from(leadAssignmentRules)
      .where(eq(leadAssignmentRules.companyId, companyId))
      .orderBy(leadAssignmentRules.priority, leadAssignmentRules.name);
  }

  /**
   * Delete assignment rule
   */
  async deleteAssignmentRule(id: string, companyId: string): Promise<void> {
    await this.database
      .delete(leadAssignmentRules)
      .where(
        and(
          eq(leadAssignmentRules.id, id),
          eq(leadAssignmentRules.companyId, companyId)
        )
      );
  }

  /**
   * Get default assignment rules for setup
   */
  getDefaultAssignmentRules(salesTeamMembers: { id: string; name: string; territory?: string }[]): CreateLeadAssignmentRuleDto[] {
    const rules: CreateLeadAssignmentRuleDto[] = [];

    // Territory-based assignment
    const territories = [...new Set(salesTeamMembers.filter(m => m.territory).map(m => m.territory))];
    territories.forEach((territory, index) => {
      const territoryMembers = salesTeamMembers.filter(m => m.territory === territory);
      if (territoryMembers.length > 0 && territoryMembers[0]) {
        rules.push({
          name: `${territory} Territory Assignment`,
          description: `Assign leads from ${territory} territory`,
          criteria: {
            field: 'territory',
            operator: 'equals',
            value: territory,
          },
          assignTo: territoryMembers[0].id, // Assign to first member, could be enhanced with round-robin
          priority: index + 1,
        });
      }
    });

    // High-value lead assignment (to senior sales rep)
    if (salesTeamMembers.length > 0 && salesTeamMembers[0]) {
      rules.push({
        name: 'High-Value Lead Assignment',
        description: 'Assign high-value leads to senior sales representative',
        criteria: {
          field: 'estimatedValue',
          operator: 'gte',
          value: 100000,
        },
        assignTo: salesTeamMembers[0].id, // Assume first member is senior
        priority: 0, // Highest priority
      });
    }

    // Industry-specific assignment
    const industries = ['Technology', 'Healthcare', 'Finance', 'Manufacturing'];
    industries.forEach((industry, index) => {
      if (salesTeamMembers.length > 0) {
        const memberIndex = index % salesTeamMembers.length;
        const member = salesTeamMembers[memberIndex];
        if (member) {
          rules.push({
            name: `${industry} Industry Assignment`,
            description: `Assign ${industry} industry leads to specialist`,
            criteria: {
              field: 'industry',
              operator: 'equals',
              value: industry,
            },
            assignTo: member.id,
            priority: 10 + index,
          });
        }
      }
    });

    return rules;
  }

  /**
   * Setup default assignment rules for a company
   */
  async setupDefaultAssignmentRules(
    companyId: string,
    salesTeamMembers: { id: string; name: string; territory?: string }[],
    userId?: string
  ): Promise<LeadAssignmentRule[]> {
    const defaultRules = this.getDefaultAssignmentRules(salesTeamMembers);
    const createdRules: LeadAssignmentRule[] = [];

    for (const ruleData of defaultRules) {
      try {
        const rule = await this.createAssignmentRule(ruleData, companyId, userId);
        createdRules.push(rule);
      } catch (error) {
        // Skip rules with invalid users
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`Skipping assignment rule ${ruleData.name}: ${errorMessage}`);
      }
    }

    return createdRules;
  }

  /**
   * Reassign leads when assignment rules change
   */
  async reassignLeads(companyId: string): Promise<void> {
    // Get all unassigned or leads that need reassignment
    const leadsToReassign = await this.database
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.companyId, companyId),
          sql`${leads.status} NOT IN ('Converted', 'Lost', 'Unqualified')`
        )
      );

    for (const lead of leadsToReassign) {
      const newAssignee = await this.assignLead(lead, companyId);

      if (newAssignee && newAssignee !== lead.assignedTo) {
        await this.database
          .update(leads)
          .set({ assignedTo: newAssignee, updatedAt: new Date() })
          .where(eq(leads.id, lead.id));
      }
    }
  }

  /**
   * Get assignment statistics
   */
  async getAssignmentStatistics(companyId: string): Promise<any> {
    const stats = await this.database
      .select({
        assignedTo: leads.assignedTo,
        totalLeads: sql<number>`COUNT(*)`,
        newLeads: sql<number>`COUNT(*) FILTER (WHERE status = 'New')`,
        qualifiedLeads: sql<number>`COUNT(*) FILTER (WHERE status = 'Qualified')`,
        convertedLeads: sql<number>`COUNT(*) FILTER (WHERE is_converted = true)`,
      })
      .from(leads)
      .where(eq(leads.companyId, companyId))
      .groupBy(leads.assignedTo);

    // Get user names for assigned users
    const userIds = stats.map(s => s.assignedTo).filter(Boolean);
    let userNameMap = new Map<string, string>();
    
    if (userIds.length > 0) {
      const userNames = await this.database
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(sql`${users.id} = ANY(${userIds})`);

      userNameMap = new Map(
        userNames.map(u => [u.id, `${u.firstName} ${u.lastName}`])
      );
    }

    return stats.map(stat => ({
      ...stat,
      assigneeName: stat.assignedTo ? (userNameMap.get(stat.assignedTo) || 'Unknown') : 'Unassigned',
    }));
  }

  /**
   * Private method for round-robin assignment
   */
  private async roundRobinAssignment(companyId: string): Promise<string | null> {
    // Get all active sales users
    const salesUsers = await this.database
      .select({
        id: users.id,
        leadCount: sql<number>`
          (SELECT COUNT(*) FROM leads
           WHERE assigned_to = ${users.id}
           AND company_id = ${companyId}
           AND status NOT IN ('Converted', 'Lost', 'Unqualified'))
        `,
      })
      .from(users)
      .where(
        and(
          eq(users.companyId, companyId),
          eq(users.isActive, true),
          // Assuming there's a role or permission check for sales users
          // This would need to be implemented based on your role system
        )
      );

    if (salesUsers.length === 0) {
      return null;
    }

    // Find user with least number of active leads
    const userWithLeastLeads = salesUsers.reduce((min, user) =>
      user.leadCount < min.leadCount ? user : min
    );

    return userWithLeastLeads.id;
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

  private evaluateSingleCriteria(lead: Lead, criteria: Record<string, any>): boolean {
    const fieldValue = this.getFieldValue(lead, criteria['field']);

    switch (criteria['operator']) {
      case 'equals':
        return fieldValue === criteria['value'];

      case 'not_equals':
        return fieldValue !== criteria['value'];

      case 'in':
        return Array.isArray(criteria['values']) && criteria['values'].includes(fieldValue);

      case 'not_in':
        return Array.isArray(criteria['values']) && !criteria['values'].includes(fieldValue);

      case 'contains':
        return typeof fieldValue === 'string' &&
               typeof criteria['value'] === 'string' &&
               fieldValue.toLowerCase().includes(criteria['value'].toLowerCase());

      case 'not_empty':
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';

      case 'empty':
        return fieldValue === null || fieldValue === undefined || fieldValue === '';

      case 'gt':
        return typeof fieldValue === 'number' && fieldValue > criteria['value'];

      case 'gte':
        return typeof fieldValue === 'number' && fieldValue >= criteria['value'];

      case 'lt':
        return typeof fieldValue === 'number' && fieldValue < criteria['value'];

      case 'lte':
        return typeof fieldValue === 'number' && fieldValue <= criteria['value'];

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

    // Convert string numbers to numbers for numeric comparisons
    if (fieldPath === 'estimatedValue' && typeof value === 'string') {
      return parseFloat(value) || 0;
    }

    return value;
  }
}

