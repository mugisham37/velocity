import {
  DatabaseService,
  workflowAnalytics,
  workflowApprovals,
  workflowInstances,
  workflowSteps,
  workflows,
} from '@kiro/database';
import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, inArray, lte, sql } from '@kiro/database';
import { WorkflowAnalyticsFilter, WorkflowMetrics } from '../dto/workflow.dto';

@Injectable()
export class WorkflowAnalyticsService {
  constructor(private readonly db: DatabaseService) {}

  async getWorkflowMetrics(
    companyId: string,
    filter?: WorkflowAnalyticsFilter
  ): Promise<WorkflowMetrics> {
    const conditions = [eq(workflowInstances.companyId, companyId)];

    if (filter?.startDate) {
      conditions.push(
        gte(workflowInstances.createdAt, new Date(filter.startDate))
      );
    }

    if (filter?.endDate) {
      conditions.push(
        lte(workflowInstances.createdAt, new Date(filter.endDate))
      );
    }

    if (filter?.statuses?.length) {
      conditions.push(inArray(workflowInstances.status, filter.statuses));
    }

    if (filter?.workflowIds?.length) {
      conditions.push(
        inArray(workflowInstances.workflowId, filter.workflowIds)
      );
    }

    // Get basic metrics
    const [basicMetrics] = await this.db.db
      .select({
        totalWorkflows: sql<number>`count(distinct ${workflowInstances.workflowId})`,
        activeInstances: sql<number>`count(*) filter (where ${workflowInstances.status} in ('pending', 'running'))`,
        completedToday: sql<number>`count(*) filter (where ${workflowInstances.status} = 'completed' and date(${workflowInstances.completedAt}) = current_date)`,
        overdueTasks: sql<number>`count(*) filter (where ${workflowInstances.dueDate} < now() and ${workflowInstances.status} in ('pending', 'running'))`,
        slaBreaches: sql<number>`count(*) filter (where ${workflowInstances.slaBreached} = true)`,
        averageCompletionTime: sql<number>`avg(extract(epoch from (${workflowInstances.completedAt} - ${workflowInstances.startedAt}))/3600) filter (where ${workflowInstances.status} = 'completed')`,
      })
      .from(workflowInstances)
      .where(and(...conditions));

    // Get category metrics
    const categoryMetrics = await this.db.db
      .select({
        category: workflows.category,
        count: sql<number>`count(*)`,
        averageTime: sql<number>`avg(extract(epoch from (${workflowInstances.completedAt} - ${workflowInstances.startedAt}))/3600) filter (where ${workflowInstances.status} = 'completed')`,
      })
      .from(workflowInstances)
      .innerJoin(workflows, eq(workflows.id, workflowInstances.workflowId))
      .where(and(...conditions))
      .groupBy(workflows.category)
      .orderBy(desc(sql`count(*)`));

    return {
      totalWorkflows: Number(basicMetrics?.totalWorkflows) || 0,
      activeInstances: Number(basicMetrics?.activeInstances) || 0,
      completedToday: Number(basicMetrics?.completedToday) || 0,
      overdueTasks: Number(basicMetrics?.overdueTasks) || 0,
      slaBreaches: Number(basicMetrics?.slaBreaches) || 0,
      averageCompletionTime: Number(basicMetrics?.averageCompletionTime) || 0,
      byCategory: categoryMetrics.map(metric => ({
        category: metric.category,
        count: Number(metric.count) || 0,
        averageTime: Number(metric.averageTime) || 0,
      })),
    };
  }

  async getWorkflowPerformance(
    workflowId: string,
    companyId: string,
    period: 'day' | 'week' | 'month' = 'month'
  ): Promise<{
    totalExecutions: number;
    successRate: number;
    averageCompletionTime: number;
    bottlenecks: Array<{
      stepName: string;
      averageTime: number;
      count: number;
    }>;
    trends: Array<{
      date: string;
      executions: number;
      completions: number;
      averageTime: number;
    }>;
  }> {
    const periodStart = this.getPeriodStart(period);

    // Get basic performance metrics
    const [performance] = await this.db.db
      .select({
        totalExecutions: sql<number>`count(*)`,
        successfulExecutions: sql<number>`count(*) filter (where status = 'completed')`,
        averageCompletionTime: sql<number>`avg(extract(epoch from (completed_at - started_at))/3600) filter (where status = 'completed')`,
      })
      .from(workflowInstances)
      .where(
        and(
          eq(workflowInstances.workflowId, workflowId),
          eq(workflowInstances.companyId, companyId),
          gte(workflowInstances.createdAt, periodStart)
        )
      );

    const totalExecutions = Number(performance?.totalExecutions) || 0;
    const successfulExecutions = Number(performance?.successfulExecutions) || 0;
    const successRate =
      totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

    // Get bottlenecks (steps taking longest time)
    const bottlenecks = await this.db.db
      .select({
        stepName: workflowSteps.name,
        averageTime: sql<number>`avg(extract(epoch from (completed_at - started_at))/3600)`,
        count: sql<number>`count(*)`,
      })
      .from(workflowSteps)
      .innerJoin(
        workflowInstances,
        eq(workflowInstances.id, workflowSteps.instanceId)
      )
      .where(
        and(
          eq(workflowInstances.workflowId, workflowId),
          eq(workflowInstances.companyId, companyId),
          gte(workflowInstances.createdAt, periodStart),
          sql`${workflowSteps.completedAt} is not null`
        )
      )
      .groupBy(workflowSteps.name)
      .orderBy(
        desc(sql`avg(extract(epoch from (completed_at - started_at))/3600)`)
      )
      .limit(10);

    // Get trends (daily/weekly/monthly data)
    const trendInterval =
      period === 'day' ? 'hour' : period === 'week' ? 'day' : 'week';
    const trends = await this.db.db
      .select({
        date: sql<string>`date_trunc('${sql.raw(trendInterval)}', ${workflowInstances.createdAt})::text`,
        executions: sql<number>`count(*)`,
        completions: sql<number>`count(*) filter (where status = 'completed')`,
        averageTime: sql<number>`avg(extract(epoch from (completed_at - started_at))/3600) filter (where status = 'completed')`,
      })
      .from(workflowInstances)
      .where(
        and(
          eq(workflowInstances.workflowId, workflowId),
          eq(workflowInstances.companyId, companyId),
          gte(workflowInstances.createdAt, periodStart)
        )
      )
      .groupBy(
        sql`date_trunc('${sql.raw(trendInterval)}', ${workflowInstances.createdAt})`
      )
      .orderBy(
        sql`date_trunc('${sql.raw(trendInterval)}', ${workflowInstances.createdAt})`
      );

    return {
      totalExecutions,
      successRate,
      averageCompletionTime: Number(performance?.averageCompletionTime) || 0,
      bottlenecks: bottlenecks.map(b => ({
        stepName: b.stepName,
        averageTime: Number(b.averageTime) || 0,
        count: Number(b.count) || 0,
      })),
      trends: trends.map(t => ({
        date: t.date,
        executions: Number(t.executions) || 0,
        completions: Number(t.completions) || 0,
        averageTime: Number(t.averageTime) || 0,
      })),
    };
  }

  async getApprovalMetrics(
    companyId: string,
    filter?: WorkflowAnalyticsFilter
  ): Promise<{
    totalApprovals: number;
    pendingApprovals: number;
    averageApprovalTime: number;
    approvalRate: number;
    topApprovers: Array<{
      userId: string;
      approvalCount: number;
      averageTime: number;
    }>;
  }> {
    const conditions = [eq(workflowInstances.companyId, companyId)];

    if (filter?.startDate) {
      conditions.push(
        gte(workflowApprovals.requestedAt, new Date(filter.startDate))
      );
    }

    if (filter?.endDate) {
      conditions.push(
        lte(workflowApprovals.requestedAt, new Date(filter.endDate))
      );
    }

    // Get basic approval metrics
    const [approvalMetrics] = await this.db.db
      .select({
        totalApprovals: sql<number>`count(*)`,
        pendingApprovals: sql<number>`count(*) filter (where ${workflowApprovals.status} = 'pending')`,
        approvedCount: sql<number>`count(*) filter (where ${workflowApprovals.status} = 'approved')`,
        averageApprovalTime: sql<number>`avg(extract(epoch from (${workflowApprovals.respondedAt} - ${workflowApprovals.requestedAt}))/3600) filter (where ${workflowApprovals.respondedAt} is not null)`,
      })
      .from(workflowApprovals)
      .innerJoin(
        workflowInstances,
        eq(workflowInstances.id, workflowApprovals.instanceId)
      )
      .where(and(...conditions));

    const totalApprovals = Number(approvalMetrics?.totalApprovals) || 0;
    const approvedCount = Number(approvalMetrics?.approvedCount) || 0;
    const approvalRate =
      totalApprovals > 0 ? (approvedCount / totalApprovals) * 100 : 0;

    // Get top approvers
    const topApprovers = await this.db.db
      .select({
        userId: workflowApprovals.approverId,
        approvalCount: sql<number>`count(*)`,
        averageTime: sql<number>`avg(extract(epoch from (${workflowApprovals.respondedAt} - ${workflowApprovals.requestedAt}))/3600) filter (where ${workflowApprovals.respondedAt} is not null)`,
      })
      .from(workflowApprovals)
      .innerJoin(
        workflowInstances,
        eq(workflowInstances.id, workflowApprovals.instanceId)
      )
      .where(and(...conditions))
      .groupBy(workflowApprovals.approverId)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    return {
      totalApprovals,
      pendingApprovals: Number(approvalMetrics?.pendingApprovals) || 0,
      averageApprovalTime: Number(approvalMetrics?.averageApprovalTime) || 0,
      approvalRate,
      topApprovers: topApprovers.map(approver => ({
        userId: approver.userId,
        approvalCount: Number(approver.approvalCount) || 0,
        averageTime: Number(approver.averageTime) || 0,
      })),
    };
  }

  async generateInsights(companyId: string): Promise<{
    insights: Array<{
      type: 'bottleneck' | 'efficiency' | 'sla' | 'usage';
      title: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      recommendation: string;
      data?: any;
    }>;
  }> {
    const insights: any[] = [];

    // Identify bottlenecks
    const bottlenecks = await this.identifyBottlenecks(companyId);
    for (const bottleneck of bottlenecks) {
      insights.push({
        type: 'bottleneck',
        title: 'Workflow Bottleneck Detected',
        description: `Step "${bottleneck.stepName}" is taking an average of ${bottleneck.averageTime.toFixed(1)} hours to complete`,
        severity:
          bottleneck.averageTime > 24
            ? 'high'
            : bottleneck.averageTime > 8
              ? 'medium'
              : 'low',
        recommendation:
          'Consider optimizing this step or adding more resources',
        data: bottleneck,
      });
    }

    // Check SLA compliance
    const slaInsights = await this.analyzeSlaCompliance(companyId);
    if (slaInsights.complianceRate < 80) {
      insights.push({
        type: 'sla',
        title: 'Low SLA Compliance',
        description: `SLA compliance rate is ${slaInsights.complianceRate.toFixed(1)}%`,
        severity: slaInsights.complianceRate < 60 ? 'high' : 'medium',
        recommendation:
          'Review workflow SLA settings and consider process improvements',
        data: slaInsights,
      });
    }

    // Analyze workflow efficiency
    const efficiencyInsights = await this.analyzeEfficiency(companyId);
    for (const insight of efficiencyInsights) {
      insights.push(insight);
    }

    return { insights };
  }

  async recordMetric(
    companyId: string,
    workflowId: string | null,
    instanceId: string | null,
    metricType: string,
    metricValue: any,
    period: string = 'daily'
  ): Promise<void> {
    await this.db.db.insert(workflowAnalytics).values({
      companyId,
      workflowId,
      instanceId,
      metricType,
      metricValue,
      period,
      date: new Date(),
    });
  }

  private async identifyBottlenecks(companyId: string): Promise<
    Array<{
      stepName: string;
      averageTime: number;
      count: number;
    }>
  > {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await this.db.db
      .select({
        stepName: workflowSteps.name,
        averageTime: sql<number>`avg(extract(epoch from (completed_at - started_at))/3600)`,
        count: sql<number>`count(*)`,
      })
      .from(workflowSteps)
      .innerJoin(
        workflowInstances,
        eq(workflowInstances.id, workflowSteps.instanceId)
      )
      .where(
        and(
          eq(workflowInstances.companyId, companyId),
          gte(workflowInstances.createdAt, thirtyDaysAgo),
          sql`${workflowSteps.completedAt} is not null`
        )
      )
      .groupBy(workflowSteps.name)
      .having(
        sql`avg(extract(epoch from (completed_at - started_at))/3600) > 4`
      ) // Steps taking more than 4 hours
      .orderBy(
        desc(sql`avg(extract(epoch from (completed_at - started_at))/3600)`)
      )
      .limit(5);
  }

  private async analyzeSlaCompliance(companyId: string): Promise<{
    complianceRate: number;
    totalInstances: number;
    breachedInstances: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [compliance] = await this.db.db
      .select({
        totalInstances: sql<number>`count(*)`,
        breachedInstances: sql<number>`count(*) filter (where sla_breached = true)`,
      })
      .from(workflowInstances)
      .where(
        and(
          eq(workflowInstances.companyId, companyId),
          gte(workflowInstances.createdAt, thirtyDaysAgo)
        )
      );

    const totalInstances = Number(compliance?.totalInstances) || 0;
    const breachedInstances = Number(compliance?.breachedInstances) || 0;
    const complianceRate =
      totalInstances > 0
        ? ((totalInstances - breachedInstances) / totalInstances) * 100
        : 100;

    return {
      complianceRate,
      totalInstances,
      breachedInstances,
    };
  }

  private async analyzeEfficiency(companyId: string): Promise<any[]> {
    const insights: any[] = [];

    // Check for workflows with low completion rates
    const lowCompletionWorkflows = await this.db.db
      .select({
        workflowId: workflowInstances.workflowId,
        workflowName: workflows.name,
        totalInstances: sql<number>`count(*)`,
        completedInstances: sql<number>`count(*) filter (where status = 'completed')`,
      })
      .from(workflowInstances)
      .innerJoin(workflows, eq(workflows.id, workflowInstances.workflowId))
      .where(eq(workflowInstances.companyId, companyId))
      .groupBy(workflowInstances.workflowId, workflows.name)
      .having(
        sql`count(*) > 5 and (count(*) filter (where status = 'completed'))::float / count(*) < 0.7`
      );

    for (const workflow of lowCompletionWorkflows) {
      const completionRate =
        (Number(workflow.completedInstances) /
          Number(workflow.totalInstances)) *
        100;
      insights.push({
        type: 'efficiency',
        title: 'Low Completion Rate',
        description: `Workflow "${workflow.workflowName}" has a completion rate of ${completionRate.toFixed(1)}%`,
        severity: completionRate < 50 ? 'high' : 'medium',
        recommendation: 'Review workflow design and identify failure points',
        data: workflow,
      });
    }

    return insights;
  }

  private getPeriodStart(period: 'day' | 'week' | 'month'): Date {
    const now = new Date();

    switch (period) {
      case 'day':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return new Date(
          weekStart.getFullYear(),
          weekStart.getMonth(),
          weekStart.getDate()
        );
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
  }
}
