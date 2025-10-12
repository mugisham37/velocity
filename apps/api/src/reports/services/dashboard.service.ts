import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import { BalanceSheetService } from './balance-sheet.service';
import { FinancialRatiosService } from './financial-ratios.service';
import { ProfitLossService } from './profit-loss.service';

export interface DashboardMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  cashPosition: number;
  accountsReceivable: number;
  accountsPayable: number;
  workingCapital: number;
  revenueGrowth: number;
  profitMargin: number;
  currentRatio: number;
  quickRatio: number;
  debtToEquity: number;
  returnOnAssets: number;
  returnOnEquity: number;
  generatedAt: Date;
}

export interface DashboardChartData {
  name: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  data: Array<{
    label: string;
    value: number;
    date?: Date;
    category?: string;
  }>;
  period: string;
  currency: string;
}

export interface FinancialDashboard {
  metrics: DashboardMetrics;
  charts: DashboardChartData[];
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    title: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  insights: Array<{
    title: string;
    description: string;
    trend: 'positive' | 'negative' | 'neutral';
    impact: 'high' | 'medium' | 'low';
  }>;
}

@Injectable()
export class DashboardService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly balanceSheetService: BalanceSheetService,
    private readonly profitLossService: ProfitLossService,
    private readonly financialRatiosService: FinancialRatiosService
  ) {}

  async generateFinancialDashboard(
    companyId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<FinancialDashboard> {
    this.logger.info('Generating financial dashboard', {
      companyId,
      periodStart,
      periodEnd,
    });

    try {
      // Calculate comparative periods
      const periodLength = periodEnd.getTime() - periodStart.getTime();
      const comparativePeriodEnd = new Date(periodStart.getTime() - 1);
      const comparativePeriodStart = new Date(
        comparativePeriodEnd.getTime() - periodLength
      );

      // Generate core reports
      const [balanceSheet, profitLoss, ratios] = await Promise.all([
        this.balanceSheetService.generateBalanceSheet(
          {
            reportType: 'BALANCE_SHEET',
            periodStart,
            periodEnd,
            comparativePeriodStart,
            comparativePeriodEnd,
          },
          companyId
        ),
        this.profitLossService.generateProfitLossStatement(
          {
            reportType: 'PROFIT_LOSS',
            periodStart,
            periodEnd,
            comparativePeriodStart,
            comparativePeriodEnd,
          },
          companyId
        ),
        this.financialRatiosService.generateFinancialRatios(
          {
            reportType: 'FINANCIAL_RATIOS',
            periodStart,
            periodEnd,
            comparativePeriodStart,
            comparativePeriodEnd,
          },
          companyId
        ),
      ]);

      // Extract key metrics
      const metrics = this.extractDashboardMetrics(
        balanceSheet,
        profitLoss,
        ratios
      );

      // Generate chart data
      const charts = await this.generateChartData(
        companyId,
        periodStart,
        periodEnd
      );

      // Generate alerts and insights
      const alerts = this.generateAlerts(metrics, ratios);
      const insights = this.generateInsights(metrics, ratios);

      return {
        metrics,
        charts,
        alerts,
        insights,
      };
    } catch (error) {
      this.logger.error('Failed to generate financial dashboard', {
        error,
        companyId,
      });
      throw error;
    }
  }

  private extractDashboardMetrics(
    balanceSheet: any,
    profitLoss: any,
    ratios: any
  ): DashboardMetrics {
    // Extract cash position (assuming first current asset is cash)
    const cashPosition =
      this.findAccountAmount(balanceSheet.lines, 'cash') || 0;
    const accountsReceivable =
      this.findAccountAmount(balanceSheet.lines, 'receivable') || 0;
    const accountsPayable =
      this.findAccountAmount(balanceSheet.lines, 'payable') || 0;

    const workingCapital =
      (balanceSheet.totalAssets || 0) - (balanceSheet.totalLiabilities || 0);

    // Calculate growth rates (placeholder - would need historical data)
    const revenueGrowth = 0; // TODO: Calculate from historical data
    const profitMargin = balanceSheet.totalRevenue
      ? ((profitLoss.netIncome || 0) / (profitLoss.totalRevenue || 1)) * 100
      : 0;

    // Extract key ratios
    const currentRatio =
      this.findRatioValue(ratios.liquidityRatios, 'Current Ratio') || 0;
    const quickRatio =
      this.findRatioValue(ratios.liquidityRatios, 'Quick Ratio') || 0;
    const debtToEquity =
      this.findRatioValue(ratios.leverageRatios, 'Debt-to-Equity') || 0;
    const returnOnAssets =
      this.findRatioValue(ratios.profitabilityRatios, 'Return on Assets') || 0;
    const returnOnEquity =
      this.findRatioValue(ratios.profitabilityRatios, 'Return on Equity') || 0;

    return {
      totalRevenue: profitLoss.totalRevenue || 0,
      totalExpenses: profitLoss.totalExpenses || 0,
      netIncome: profitLoss.netIncome || 0,
      totalAssets: balanceSheet.totalAssets || 0,
      totalLiabilities: balanceSheet.totalLiabilities || 0,
      totalEquity: balanceSheet.totalEquity || 0,
      cashPosition,
      accountsReceivable,
      accountsPayable,
      workingCapital,
      revenueGrowth,
      profitMargin,
      currentRatio,
      quickRatio,
      debtToEquity,
      returnOnAssets,
      returnOnEquity,
      generatedAt: new Date(),
    };
  }

  private async generateChartData(
    companyId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<DashboardChartData[]> {
    // Generate sample chart data - in production, this would query actual data
    const charts: DashboardChartData[] = [
      {
        name: 'Revenue Trend',
        type: 'line',
        data: await this.generateRevenueChartData(
          companyId,
          periodStart,
          periodEnd
        ),
        period: 'monthly',
        currency: 'USD',
      },
      {
        name: 'Expense Breakdown',
        type: 'pie',
        data: await this.generateExpenseBreakdownData(
          companyId,
          periodStart,
          periodEnd
        ),
        period: 'current',
        currency: 'USD',
      },
      {
        name: 'Cash Flow',
        type: 'bar',
        data: await this.generateCashFlowData(
          companyId,
          periodStart,
          periodEnd
        ),
        period: 'monthly',
        currency: 'USD',
      },
      {
        name: 'Profitability',
        type: 'area',
        data: await this.generateProfitabilityData(
          companyId,
          periodStart,
          periodEnd
        ),
        period: 'monthly',
        currency: 'USD',
      },
    ];

    return charts;
  }

  private generateAlerts(metrics: DashboardMetrics, _ratios: any): Array<any> {
    const alerts = [];

    // Cash flow alerts
    if (metrics.cashPosition < 10000) {
      alerts.push({
        type: 'warning',
        title: 'Low Cash Position',
        message: `Cash position is ${metrics.cashPosition.toLocaleString()}. Consider improving cash flow.`,
        priority: 'high',
      });
    }

    // Profitability alerts
    if (metrics.netIncome < 0) {
      alerts.push({
        type: 'error',
        title: 'Negative Net Income',
        message:
          'Company is operating at a loss. Review expenses and revenue strategies.',
        priority: 'high',
      });
    }

    // Liquidity alerts
    if (metrics.currentRatio < 1.0) {
      alerts.push({
        type: 'warning',
        title: 'Low Current Ratio',
        message:
          'Current ratio is below 1.0, indicating potential liquidity issues.',
        priority: 'medium',
      });
    }

    // Debt alerts
    if (metrics.debtToEquity > 2.0) {
      alerts.push({
        type: 'warning',
        title: 'High Debt-to-Equity Ratio',
        message:
          'Debt-to-equity ratio is high. Consider debt reduction strategies.',
        priority: 'medium',
      });
    }

    return alerts;
  }

  private generateInsights(metrics: DashboardMetrics, _ratios: any): Array<any> {
    const insights = [];

    // Profitability insights
    if (metrics.profitMargin > 15) {
      insights.push({
        title: 'Strong Profitability',
        description: `Profit margin of ${metrics.profitMargin.toFixed(1)}% indicates strong operational efficiency.`,
        trend: 'positive',
        impact: 'high',
      });
    }

    // Growth insights
    if (metrics.revenueGrowth > 10) {
      insights.push({
        title: 'Revenue Growth',
        description: `Revenue growth of ${metrics.revenueGrowth.toFixed(1)}% shows strong business expansion.`,
        trend: 'positive',
        impact: 'high',
      });
    }

    // Efficiency insights
    if (metrics.returnOnAssets > 5) {
      insights.push({
        title: 'Asset Efficiency',
        description: `ROA of ${metrics.returnOnAssets.toFixed(1)}% demonstrates effective asset utilization.`,
        trend: 'positive',
        impact: 'medium',
      });
    }

    return insights;
  }

  // Helper methods for chart data generation
  private async generateRevenueChartData(
    _companyId: string,
    start: Date,
    end: Date
  ) {
    // Mock data - in production, query actual revenue by month
    const months = this.getMonthsBetween(start, end);
    return months.map((month, _index) => ({
      label: month.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
      value: Math.random() * 100000 + 50000, // Mock revenue
      date: month,
    }));
  }

  private async generateExpenseBreakdownData(
    _companyId: string,
    _start: Date,
    _end: Date
  ) {
    // Mock data - in production, query expense categories
    return [
      { label: 'Salaries', value: 45000, category: 'Personnel' },
      { label: 'Rent', value: 12000, category: 'Facilities' },
      { label: 'Utilities', value: 3000, category: 'Facilities' },
      { label: 'Marketing', value: 8000, category: 'Sales' },
      { label: 'Other', value: 5000, category: 'General' },
    ];
  }

  private async generateCashFlowData(
    _companyId: string,
    start: Date,
    end: Date
  ) {
    // Mock data - in production, calculate actual cash flow
    const months = this.getMonthsBetween(start, end);
    return months.map(month => ({
      label: month.toLocaleDateString('en-US', { month: 'short' }),
      value: Math.random() * 20000 - 10000, // Mock cash flow
      date: month,
    }));
  }

  private async generateProfitabilityData(
    _companyId: string,
    start: Date,
    end: Date
  ) {
    // Mock data - in production, calculate actual profitability metrics
    const months = this.getMonthsBetween(start, end);
    return months.map(month => ({
      label: month.toLocaleDateString('en-US', { month: 'short' }),
      value: Math.random() * 15 + 5, // Mock profit margin %
      date: month,
    }));
  }

  // Utility methods
  private findAccountAmount(lines: any[], searchTerm: string): number {
    const account = lines.find(line =>
      line.accountName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return account?.amount || 0;
  }

  private findRatioValue(ratios: any[], ratioName: string): number {
    const ratio = ratios?.find(r => r.name === ratioName);
    return ratio?.value || 0;
  }

  private getMonthsBetween(start: Date, end: Date): Date[] {
    const months = [];
    const current = new Date(start);

    while (current <= end) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }
}
