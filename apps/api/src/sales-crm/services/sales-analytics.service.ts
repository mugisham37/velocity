import {
  leads,
  opportunities,
  quotations,
  salesOrders,
  salesTargets,
} from '../../database';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, lte, sql } from '../../database';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { BaseService } from '../../common/services/base.service';
import { CacheService } from '../../common/services/cache.service';
import { PerformanceMonitorService } from '../../common/services/performance-monitor.service';

export interface SalesMetrics {
  totalLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  leadConversionRate: number;
  totalOpportunities: number;
  wonOpportunities: number;
  lostOpportunities: number;
  winRate: number;
  totalPipelineValue: number;
  wonValue: number;
  averageDealSize: number;
  salesCycleLength: number;
  totalQuotations: number;
  acceptedQuotations: number;
  quotationAcceptanceRate: number;
  totalSalesOrders: number;
  totalRevenue: number;
}

export interface SalesForecast {
  period: string;
  forecastAmount: number;
  weightedAmount: number;
  bestCase: number;
  worstCase: number;
  confidence: number;
}

export interface SalesPerformance {
  userId: string;
  userName: string;
  leadsGenerated: number;
  leadsConverted: number;
  opportunitiesCreated: number;
  opportunitiesWon: number;
  totalRevenue: number;
  averageDealSize: number;
  winRate: number;
  targetAchievement: number;
}

export interface CreateSalesTargetDto {
  name: string;
  targetType: 'Revenue' | 'Quantity' | 'Deals';
  targetPeriod: 'Monthly' | 'Quarterly' | 'Yearly';
  startDate: Date;
  endDate: Date;
  targetValue: number;
  assignedTo?: string;
  territory?: string;
  productCategory?: string;
}

@Injectable()
export class SalesAnalyticsService extends BaseService<any, any, any, any> {
  protected table = salesTargets;
  protected tableName = 'sales_targets';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    logger: Logger,
    cacheService: CacheService,
    performanceMonitor: PerformanceMonitorService
  ) {
    super(logger, cacheService, performanceMonitor);
  }

  /**
   * Get comprehensive sales metrics
   */
  async getSalesMetrics(
    companyId: string,
    period?: { start: Date; end: Date }
  ): Promise<SalesMetrics> {
    const dateFilter = period
      ? and(
          gte(sql`created_at`, period.start),
          lte(sql`created_at`, period.end)
        )
      : sql`1=1`;

    // Lead metrics
    const [leadMetrics] = await this.database
      .select({
        totalLeads: sql<number>`COUNT(*)`,
        qualifiedLeads: sql<number>`COUNT(*) FILTER (WHERE status = 'Qualified')`,
        convertedLeads: sql<number>`COUNT(*) FILTER (WHERE is_converted = true)`,
      })
      .from(leads)
      .where(and(eq(leads.companyId, companyId), dateFilter));

    // Opportunity metrics
    const [opportunityMetrics] = await this.database
      .select({
        totalOpportunities: sql<number>`COUNT(*)`,
        wonOpportunities: sql<number>`COUNT(*) FILTER (WHERE stage = 'Closed Won')`,
        lostOpportunities: sql<number>`COUNT(*) FILTER (WHERE stage = 'Closed Lost')`,
        totalPipelineValue: sql<number>`SUM(CAST(amount AS DECIMAL))`,
        wonValue: sql<number>`SUM(CAST(amount AS DECIMAL)) FILTER (WHERE stage = 'Closed Won')`,
        averageDealSize: sql<number>`AVG(CAST(amount AS DECIMAL))`,
      })
      .from(opportunities)
      .where(and(eq(opportunities.companyId, companyId), dateFilter));

    // Quotation metrics
    const [quotationMetrics] = await this.database
      .select({
        totalQuotations: sql<number>`COUNT(*)`,
        acceptedQuotations: sql<number>`COUNT(*) FILTER (WHERE status = 'Accepted')`,
      })
      .from(quotations)
      .where(and(eq(quotations.companyId, companyId), dateFilter));

    // Sales order metrics
    const [salesOrderMetrics] = await this.database
      .select({
        totalSalesOrders: sql<number>`COUNT(*)`,
        totalRevenue: sql<number>`SUM(CAST(grand_total AS DECIMAL))`,
      })
      .from(salesOrders)
      .where(and(eq(salesOrders.companyId, companyId), dateFilter));

    // Calculate sales cycle length
    const [salesCycleData] = await this.database
      .select({
        averageCycleLength: sql<number>`
          AVG(EXTRACT(EPOCH FROM (actual_close_date - created_at)) / 86400)
        `,
      })
      .from(opportunities)
      .where(
        and(
          eq(opportunities.companyId, companyId),
          eq(opportunities.stage, 'Closed Won'),
          sql`actual_close_date IS NOT NULL`
        )
      );

    const leadData = leadMetrics || { totalLeads: 0, qualifiedLeads: 0, convertedLeads: 0 };
    const oppData = opportunityMetrics || { 
      totalOpportunities: 0, 
      wonOpportunities: 0, 
      lostOpportunities: 0,
      totalPipelineValue: 0,
      wonValue: 0,
      averageDealSize: 0
    };
    const quotData = quotationMetrics || { totalQuotations: 0, acceptedQuotations: 0 };
    const salesData = salesOrderMetrics || { totalSalesOrders: 0, totalRevenue: 0 };
    const cycleData = salesCycleData || { averageCycleLength: 0 };

    return {
      totalLeads: leadData.totalLeads || 0,
      qualifiedLeads: leadData.qualifiedLeads || 0,
      convertedLeads: leadData.convertedLeads || 0,
      leadConversionRate:
        (leadData.totalLeads || 0) > 0
          ? ((leadData.convertedLeads || 0) / (leadData.totalLeads || 1)) * 100
          : 0,
      totalOpportunities: oppData.totalOpportunities || 0,
      wonOpportunities: oppData.wonOpportunities || 0,
      lostOpportunities: oppData.lostOpportunities || 0,
      winRate:
        (oppData.wonOpportunities || 0) + (oppData.lostOpportunities || 0) > 0
          ? ((oppData.wonOpportunities || 0) /
              ((oppData.wonOpportunities || 0) + (oppData.lostOpportunities || 0))) *
            100
          : 0,
      totalPipelineValue: oppData.totalPipelineValue || 0,
      wonValue: oppData.wonValue || 0,
      averageDealSize: oppData.averageDealSize || 0,
      salesCycleLength: cycleData.averageCycleLength || 0,
      totalQuotations: quotData.totalQuotations || 0,
      acceptedQuotations: quotData.acceptedQuotations || 0,
      quotationAcceptanceRate:
        (quotData.totalQuotations || 0) > 0
          ? ((quotData.acceptedQuotations || 0) / (quotData.totalQuotations || 1)) * 100
          : 0,
      totalSalesOrders: salesData.totalSalesOrders || 0,
      totalRevenue: salesData.totalRevenue || 0,
    };
  }

  /**
   * Generate sales forecast
   */
  async generateSalesForecast(
    companyId: string,
    forecastPeriod: { start: Date; end: Date }
  ): Promise<SalesForecast[]> {
    // Get opportunities expected to close in the forecast period
    const pipelineData = await this.database
      .select({
        stage: opportunities.stage,
        amount: opportunities.amount,
        probability: opportunities.probability,
        expectedCloseDate: opportunities.expectedCloseDate,
      })
      .from(opportunities)
      .where(
        and(
          eq(opportunities.companyId, companyId),
          gte(opportunities.expectedCloseDate, forecastPeriod.start),
          lte(opportunities.expectedCloseDate, forecastPeriod.end),
          sql`${opportunities.stage} NOT IN ('Closed Won', 'Closed Lost')`
        )
      );

    // Get historical win rates by stage
    const historicalWinRates = await this.database
      .select({
        stage: sql<string>`from_stage`,
        winRate: sql<number>`
          COUNT(*) FILTER (WHERE to_stage = 'Closed Won') * 100.0 /
          COUNT(*) FILTER (WHERE to_stage IN ('Closed Won', 'Closed Lost'))
        `,
      })
      .from(sql`opportunity_stage_history`)
      .where(eq(sql`company_id`, companyId))
      .groupBy(sql`from_stage`)
      .having(
        sql`COUNT(*) FILTER (WHERE to_stage IN ('Closed Won', 'Closed Lost')) > 0`
      );

    const winRateMap = new Map(
      historicalWinRates.map(rate => [rate.stage, rate.winRate / 100])
    );

    // Calculate forecast by month
    const monthlyForecasts: SalesForecast[] = [];
    const currentDate = new Date(forecastPeriod.start);

    while (currentDate <= forecastPeriod.end) {
      const monthStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const monthEnd = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      const monthOpportunities = pipelineData.filter(
        opp =>
          opp.expectedCloseDate &&
          opp.expectedCloseDate >= monthStart &&
          opp.expectedCloseDate <= monthEnd
      );

      let forecastAmount = 0;
      let weightedAmount = 0;
      let bestCase = 0;
      let worstCase = 0;

      monthOpportunities.forEach(opp => {
        const amount = parseFloat(opp.amount);
        const probability = (opp.probability || 0) / 100;
        const historicalWinRate = winRateMap.get(opp.stage) || probability;

        forecastAmount += amount * historicalWinRate;
        weightedAmount += amount * probability;
        bestCase += amount;
        worstCase += amount * Math.min(probability, historicalWinRate);
      });

      monthlyForecasts.push({
        period: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
        forecastAmount,
        weightedAmount,
        bestCase,
        worstCase,
        confidence:
          monthOpportunities.length > 0
            ? monthOpportunities.reduce(
                (sum, opp) => sum + (opp.probability || 0),
                0
              ) / monthOpportunities.length
            : 0,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return monthlyForecasts;
  }

  /**
   * Get sales performance by user
   */
  async getSalesPerformance(
    companyId: string,
    period?: { start: Date; end: Date }
  ): Promise<SalesPerformance[]> {
    const dateFilter = period
      ? and(
          gte(sql`created_at`, period.start),
          lte(sql`created_at`, period.end)
        )
      : sql`1=1`;

    // Get performance data by user
    const performanceData = await this.database
      .select({
        userId: sql<string>`COALESCE(assigned_to, created_by)`,
        leadsGenerated: sql<number>`
          (SELECT COUNT(*) FROM leads
           WHERE assigned_to = COALESCE(opportunities.assigned_to, opportunities.assigned_to)
           AND company_id = ${companyId} ${period ? sql`AND created_at BETWEEN ${period.start} AND ${period.end}` : sql``})
        `,
        leadsConverted: sql<number>`
          (SELECT COUNT(*) FROM leads
           WHERE assigned_to = COALESCE(opportunities.assigned_to, opportunities.assigned_to)
           AND is_converted = true
           AND company_id = ${companyId} ${period ? sql`AND created_at BETWEEN ${period.start} AND ${period.end}` : sql``})
        `,
        opportunitiesCreated: sql<number>`COUNT(*)`,
        opportunitiesWon: sql<number>`COUNT(*) FILTER (WHERE stage = 'Closed Won')`,
        totalRevenue: sql<number>`SUM(CAST(amount AS DECIMAL)) FILTER (WHERE stage = 'Closed Won')`,
        averageDealSize: sql<number>`AVG(CAST(amount AS DECIMAL)) FILTER (WHERE stage = 'Closed Won')`,
      })
      .from(opportunities)
      .where(and(eq(opportunities.companyId, companyId), dateFilter))
      .groupBy(sql`COALESCE(assigned_to, created_by)`);

    // Get user names and targets
    const userIds = performanceData.map(p => p.userId).filter(Boolean);

    const users = await this.database
      .select({
        id: sql<string>`id`,
        firstName: sql<string>`first_name`,
        lastName: sql<string>`last_name`,
      })
      .from(sql`users`)
      .where(sql`id = ANY(${userIds})`);

    const userNameMap = new Map(
      users.map(u => [u.id, `${u.firstName} ${u.lastName}`])
    );

    // Get targets for users
    const targets = await this.database
      .select({
        assignedTo: salesTargets.assignedTo,
        targetValue: salesTargets.targetValue,
        achievedValue: salesTargets.achievedValue,
      })
      .from(salesTargets)
      .where(
        and(
          eq(salesTargets.companyId, companyId),
          sql`assigned_to = ANY(${userIds})`,
          period
            ? and(
                lte(salesTargets.startDate, period.end),
                gte(salesTargets.endDate, period.start)
              )
            : sql`1=1`
        )
      );

    const targetMap = new Map(
      targets.map(t => [
        t.assignedTo,
        {
          target: parseFloat(t.targetValue),
          achieved: parseFloat(t.achievedValue || '0'),
        },
      ])
    );

    return performanceData.map(data => {
      const target = targetMap.get(data.userId);
      const wonOpportunities = data.opportunitiesWon || 0;
      const totalClosedOpportunities = data.opportunitiesCreated || 0; // This would need adjustment for actual closed count

      return {
        userId: data.userId,
        userName: userNameMap.get(data.userId) || 'Unknown',
        leadsGenerated: data.leadsGenerated || 0,
        leadsConverted: data.leadsConverted || 0,
        opportunitiesCreated: data.opportunitiesCreated || 0,
        opportunitiesWon: wonOpportunities,
        totalRevenue: data.totalRevenue || 0,
        averageDealSize: data.averageDealSize || 0,
        winRate:
          totalClosedOpportunities > 0
            ? (wonOpportunities / totalClosedOpportunities) * 100
            : 0,
        targetAchievement: target ? (target.achieved / target.target) * 100 : 0,
      };
    });
  }

  /**
   * Create sales target
   */
  async createSalesTarget(
    data: CreateSalesTargetDto,
    companyId: string,
    _userId?: string
  ): Promise<any> {
    const [target] = await this.database
      .insert(salesTargets)
      .values({
        name: data.name,
        targetType: data.targetType,
        targetPeriod: data.targetPeriod,
        startDate: data.startDate,
        endDate: data.endDate,
        targetValue: data.targetValue.toString(),
        assignedTo: data.assignedTo || null,
        territory: data.territory || null,
        productCategory: data.productCategory || null,
        companyId,
      })
      .returning();

    return target;
  }

  /**
   * Update sales target achievement
   */
  async updateTargetAchievement(companyId: string): Promise<void> {
    // Get all active targets
    const activeTargets = await this.database
      .select()
      .from(salesTargets)
      .where(
        and(
          eq(salesTargets.companyId, companyId),
          lte(salesTargets.startDate, new Date()),
          gte(salesTargets.endDate, new Date())
        )
      );

    for (const target of activeTargets) {
      let achievedValue = 0;

      // Calculate achievement based on target type
      if (target.targetType === 'Revenue') {
        const [result] = await this.database
          .select({
            totalRevenue: sql<number>`SUM(CAST(grand_total AS DECIMAL))`,
          })
          .from(salesOrders)
          .where(
            and(
              eq(salesOrders.companyId, companyId),
              target.assignedTo
                ? eq(salesOrders.assignedTo, target.assignedTo)
                : sql`1=1`,
              target.territory
                ? eq(sql`territory`, target.territory)
                : sql`1=1`,
              gte(salesOrders.createdAt, target.startDate),
              lte(salesOrders.createdAt, target.endDate)
            )
          );

        achievedValue = result?.totalRevenue || 0;
      } else if (target.targetType === 'Deals') {
        const [result] = await this.database
          .select({
            totalDeals: sql<number>`COUNT(*)`,
          })
          .from(opportunities)
          .where(
            and(
              eq(opportunities.companyId, companyId),
              eq(opportunities.stage, 'Closed Won'),
              target.assignedTo
                ? eq(opportunities.assignedTo, target.assignedTo)
                : sql`1=1`,
              target.territory
                ? eq(opportunities.territory, target.territory)
                : sql`1=1`,
              gte(opportunities.actualCloseDate, target.startDate),
              lte(opportunities.actualCloseDate, target.endDate)
            )
          );

        achievedValue = result?.totalDeals || 0;
      }

      // Update target achievement
      await this.database
        .update(salesTargets)
        .set({
          achievedValue: achievedValue.toString(),
          updatedAt: new Date(),
        })
        .where(eq(salesTargets.id, target.id));
    }
  }

  /**
   * Get conversion funnel data
   */
  async getConversionFunnel(
    companyId: string,
    period?: { start: Date; end: Date }
  ): Promise<any> {
    const dateFilter = period
      ? and(
          gte(sql`created_at`, period.start),
          lte(sql`created_at`, period.end)
        )
      : sql`1=1`;

    // Lead funnel
    const [leadFunnel] = await this.database
      .select({
        totalLeads: sql<number>`COUNT(*)`,
        contactedLeads: sql<number>`COUNT(*) FILTER (WHERE status != 'New')`,
        qualifiedLeads: sql<number>`COUNT(*) FILTER (WHERE status = 'Qualified')`,
        convertedLeads: sql<number>`COUNT(*) FILTER (WHERE is_converted = true)`,
      })
      .from(leads)
      .where(and(eq(leads.companyId, companyId), dateFilter));

    // Opportunity funnel
    const opportunityFunnel = await this.database
      .select({
        stage: opportunities.stage,
        count: sql<number>`COUNT(*)`,
        totalValue: sql<number>`SUM(CAST(amount AS DECIMAL))`,
      })
      .from(opportunities)
      .where(and(eq(opportunities.companyId, companyId), dateFilter))
      .groupBy(opportunities.stage);

    // Quotation to order conversion
    const [quotationConversion] = await this.database
      .select({
        totalQuotations: sql<number>`COUNT(*)`,
        acceptedQuotations: sql<number>`COUNT(*) FILTER (WHERE status = 'Accepted')`,
        convertedToOrders: sql<number>`
          (SELECT COUNT(*) FROM sales_orders
           WHERE quotation_id IS NOT NULL
           AND company_id = ${companyId}
           ${period ? sql`AND created_at BETWEEN ${period.start} AND ${period.end}` : sql``})
        `,
      })
      .from(quotations)
      .where(and(eq(quotations.companyId, companyId), dateFilter));

    return {
      leadFunnel,
      opportunityFunnel,
      quotationConversion,
    };
  }

  /**
   * Get sales trends over time
   */
  async getSalesTrends(
    companyId: string,
    period: { start: Date; end: Date },
    granularity: 'day' | 'week' | 'month' = 'month'
  ): Promise<any> {
    const dateFormat =
      granularity === 'day'
        ? 'YYYY-MM-DD'
        : granularity === 'week'
          ? 'YYYY-"W"WW'
          : 'YYYY-MM';

    // Revenue trends
    const revenueTrends = await this.database
      .select({
        period: sql<string>`TO_CHAR(created_at, '${dateFormat}')`,
        revenue: sql<number>`SUM(CAST(grand_total AS DECIMAL))`,
        orderCount: sql<number>`COUNT(*)`,
      })
      .from(salesOrders)
      .where(
        and(
          eq(salesOrders.companyId, companyId),
          gte(salesOrders.createdAt, period.start),
          lte(salesOrders.createdAt, period.end)
        )
      )
      .groupBy(sql`TO_CHAR(created_at, '${dateFormat}')`)
      .orderBy(sql`TO_CHAR(created_at, '${dateFormat}')`);

    // Lead trends
    const leadTrends = await this.database
      .select({
        period: sql<string>`TO_CHAR(created_at, '${dateFormat}')`,
        leadsGenerated: sql<number>`COUNT(*)`,
        leadsConverted: sql<number>`COUNT(*) FILTER (WHERE is_converted = true)`,
      })
      .from(leads)
      .where(
        and(
          eq(leads.companyId, companyId),
          gte(leads.createdAt, period.start),
          lte(leads.createdAt, period.end)
        )
      )
      .groupBy(sql`TO_CHAR(created_at, '${dateFormat}')`)
      .orderBy(sql`TO_CHAR(created_at, '${dateFormat}')`);

    // Opportunity trends
    const opportunityTrends = await this.database
      .select({
        period: sql<string>`TO_CHAR(created_at, '${dateFormat}')`,
        opportunitiesCreated: sql<number>`COUNT(*)`,
        opportunitiesWon: sql<number>`COUNT(*) FILTER (WHERE stage = 'Closed Won')`,
        totalValue: sql<number>`SUM(CAST(amount AS DECIMAL))`,
      })
      .from(opportunities)
      .where(
        and(
          eq(opportunities.companyId, companyId),
          gte(opportunities.createdAt, period.start),
          lte(opportunities.createdAt, period.end)
        )
      )
      .groupBy(sql`TO_CHAR(created_at, '${dateFormat}')`)
      .orderBy(sql`TO_CHAR(created_at, '${dateFormat}')`);

    return {
      revenueTrends,
      leadTrends,
      opportunityTrends,
    };
  }
}

