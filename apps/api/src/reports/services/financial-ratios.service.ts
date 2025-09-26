import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AccountsService } from '../../accounts/accounts.service';
import { FinancialRatio, FinancialRatiosReport, FinancialReportInput } from '../dto/financial-report.dto';
import { BalanceSheetService } from './balance-sheet.service';
import { ProfitLossService } from './profit-loss.service';

@Injectable()
export class FinancialRatiosService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly accountsService: AccountsService,
    private readonly balanceSheetService: BalanceSheetService,
    private readonly profitLossService: ProfitLossService
  ) {}

  async generateFinancialRatios(
    input: FinancialReportInput,
    companyId: string
  ): Promise<FinancialRatiosReport> {
    this.logger.info('Generating financial ratios', { input, companyId });

    try {
      // Get base financial statements
      const [balanceSheet, profitLoss] = await Promise.all([
        this.balanceSheetService.generateBalanceSheet(input, companyId),
        this.profitLossService.generateProfitLossStatement(input, companyId),
      ]);

      // Extract key financial figures
      const financialData = this.extractFinancialData(balanceSheet, profitLoss);

      // Calculate ratios by category
      const liquidityRatios = this.calculateLiquidityRatios(financialData);
      const profitabilityRatios = this.calculateProfitabilityRatios(financialData);
      const leverageRatios = this.calculateLeverageRatios(financialData);
      const efficiencyRatios = this.calculateEfficiencyRatios(financialData);

      return {
        companyName: 'Company Name',
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        liquidityRatios,
        profitabilityRatios,
        leverageRatios,
        efficiencyRatios,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to generate financial ratios', { error, input, companyId });
      throw error;
    }
  }

  private extractFinancialData(balanceSheet: any, profitLoss: any) {
    // Extract key figures from financial statements
    const currentAssets = this.findLineAmount(balanceSheet.lines, 'current assets') || 0;
    const totalAssets = balanceSheet.totalAssets || 0;
    const currentLiabilities = this.findLineAmount(balanceSheet.lines, 'current liabilities') || 0;
    const totalLiabilities = balanceSheet.totalLiabilities || 0;
    const totalEquity = balanceSheet.totalEquity || 0;
    const inventory = this.findLineAmount(balanceSheet.lines, 'inventory') || 0;
    const accountsReceivable = this.findLineAmount(balanceSheet.lines, 'receivable') || 0;
    const cash = this.findLineAmount(balanceSheet.lines, 'cash') || 0;
nst revenue = profitLoss.totalRevenue || 0;
    const netIncome = profitLoss.netIncome || 0;
    const grossProfit = this.findLineAmount(profitLoss.lines, 'gross profit') || (revenue * 0.3); // Estimate
    const operatingIncome = this.findLineAmount(profitLoss.lines, 'operating income') || (netIncome * 1.2); // Estimate
    const interestExpense = this.findLineAmount(profitLoss.lines, 'interest') || 0;
    const costOfGoodsSold = this.findLineAmount(profitLoss.lines, 'cost of goods sold') || (revenue * 0.7); // Estimate

    return {
      currentAssets,
      totalAssets,
      currentLiabilities,
      totalLiabilities,
      totalEquity,
      inventory,
      accountsReceivable,
      cash,
      revenue,
      netIncome,
      grossProfit,
      operatingIncome,
      interestExpense,
      costOfGoodsSold,
    };
  }

  private calculateLiquidityRatios(data: any): FinancialRatio[] {
    const ratios: FinancialRatio[] = [];

    // Current Ratio
    const currentRatio = data.currentLiabilities !== 0
      ? data.currentAssets / data.currentLiabilities
      : 0;

    ratios.push({
      name: 'Current Ratio',
      category: 'Liquidity',
      value: currentRatio,
      industryBenchmark: 2.0,
      formula: 'Current Assets / Current Liabilities',
      interpretation: currentRatio >= 2.0
        ? 'Strong liquidity position'
        : currentRatio >= 1.0
          ? 'Adequate liquidity'
          : 'Potential liquidity concerns',
      trend: this.determineTrend(currentRatio, 2.0),
    });

    // Quick Ratio (Acid Test)
    const quickAssets = data.currentAssets - data.inventory;
    const quickRatio = data.currentLiabilities !== 0
      ? quickAssets / data.currentLiabilities
      : 0;

    ratios.push({
      name: 'Quick Ratio',
      category: 'Liquidity',
      value: quickRatio,
      industryBenchmark: 1.0,
      formula: '(Current Assets - Inventory) / Current Liabilities',
      interpretation: quickRatio >= 1.0
        ? 'Strong short-term liquidity'
        : 'May have difficulty meeting short-term obligations',
      trend: this.determineTrend(quickRatio, 1.0),
    });

    // Cash Ratio
    const cashRatio = data.currentLiabilities !== 0
      ? data.cash / data.currentLiabilities
      : 0;

    ratios.push({
      name: 'Cash Ratio',
      category: 'Liquidity',
      value: cashRatio,
      industryBenchmark: 0.2,
      formula: 'Cash / Current Liabilities',
      interpretation: cashRatio >= 0.2
        ? 'Strong cash position'
        : 'Limited cash reserves',
      trend: this.determineTrend(cashRatio, 0.2),
    });

    return ratios;
  }

  private calculateProfitabilityRatios(data: any): FinancialRatio[] {
    const ratios: FinancialRatio[] = [];

    // Gross Profit Margin
    const grossProfitMargin = data.revenue !== 0
      ? (data.grossProfit / data.revenue) * 100
      : 0;

    ratios.push({
      name: 'Gross Profit Margin',
      category: 'Profitability',
      value: grossProfitMargin,
      industryBenchmark: 25.0,
      formula: '(Gross Profit / Revenue) × 100',
      interpretation: grossProfitMargin >= 25
        ? 'Strong pricing power and cost control'
        : 'May need to improve pricing or reduce costs',
      trend: this.determineTrend(grossProfitMargin, 25.0),
    });

    // Net Profit Margin
    const netProfitMargin = data.revenue !== 0
      ? (data.netIncome / data.revenue) * 100
      : 0;

    ratios.push({
      name: 'Net Profit Margin',
      category: 'Profitability',
      value: netProfitMargin,
      industryBenchmark: 10.0,
      formula: '(Net Income / Revenue) × 100',
      interpretation: netProfitMargin >= 10
        ? 'Strong overall profitability'
        : netProfitMargin >= 5
          ? 'Moderate profitability'
          : 'Low profitability',
      trend: this.determineTrend(netProfitMargin, 10.0),
    });

    // Return on Assets (ROA)
    const roa = data.totalAssets !== 0
      ? (data.netIncome / data.totalAssets) * 100
      : 0;

    ratios.push({
      name: 'Return on Assets',
      category: 'Profitability',
      value: roa,
      industryBenchmark: 5.0,
      formula: '(Net Income / Total Assets) × 100',
      interpretation: roa >= 5
        ? 'Efficient use of assets'
        : 'Assets may not be generating adequate returns',
      trend: this.determineTrend(roa, 5.0),
    });

    // Return on Equity (ROE)
    const roe = data.totalEquity !== 0
      ? (data.netIncome / data.totalEquity) * 100
      : 0;

    ratios.push({
      name: 'Return on Equity',
      category: 'Profitability',
      value: roe,
      industryBenchmark: 15.0,
      formula: '(Net Income / Total Equity) × 100',
      interpretation: roe >= 15
        ? 'Strong returns for shareholders'
        : 'May need to improve profitability or capital efficiency',
      trend: this.determineTrend(roe, 15.0),
    });

    return ratios;
  }

  private calculateLeverageRatios(data: any): FinancialRatio[] {
    const ratios: FinancialRatio[] = [];

    // Debt-to-Equity Ratio
    const debtToEquity = data.totalEquity !== 0
      ? data.totalLiabilities / data.totalEquity
      : 0;

    ratios.push({
      name: 'Debt-to-Equity',
      category: 'Leverage',
      value: debtToEquity,
      industryBenchmark: 1.0,
      formula: 'Total Liabilities / Total Equity',
      interpretation: debtToEquity <= 1.0
        ? 'Conservative debt levels'
        : debtToEquity <= 2.0
          ? 'Moderate debt levels'
          : 'High debt levels - potential risk',
      trend: this.determineTrend(1.0, debtToEquity), // Lower is better
    });

    // Debt-to-Assets Ratio
    const debtToAssets = data.totalAssets !== 0
      ? (data.totalLiabilities / data.totalAssets) * 100
      : 0;

    ratios.push({
      name: 'Debt-to-Assets',
      category: 'Leverage',
      value: debtToAssets,
      industryBenchmark: 40.0,
      formula: '(Total Liabilities / Total Assets) × 100',
      interpretation: debtToAssets <= 40
        ? 'Conservative debt levels'
        : 'High debt levels relative to assets',
      trend: this.determineTrend(40.0, debtToAssets), // Lower is better
    });

    // Interest Coverage Ratio
    const interestCoverage = data.interestExpense !== 0
      ? data.operatingIncome / data.interestExpense
      : 0;

    ratios.push({
      name: 'Interest Coverage',
      category: 'Leverage',
      value: interestCoverage,
      industryBenchmark: 5.0,
      formula: 'Operating Income / Interest Expense',
      interpretation: interestCoverage >= 5
        ? 'Strong ability to service debt'
        : interestCoverage >= 2.5
          ? 'Adequate debt service capability'
          : 'Potential difficulty servicing debt',
      trend: this.determineTrend(interestCoverage, 5.0),
    });

    return ratios;
  }

  private calculateEfficiencyRatios(data: any): FinancialRatio[] {
    const ratios: FinancialRatio[] = [];

    // Asset Turnover
    const assetTurnover = data.totalAssets !== 0
      ? data.revenue / data.totalAssets
      : 0;

    ratios.push({
      name: 'Asset Turnover',
      category: 'Efficiency',
      value: assetTurnover,
      industryBenchmark: 1.0,
      formula: 'Revenue / Total Assets',
      interpretation: assetTurnover >= 1.0
        ? 'Efficient use of assets to generate revenue'
        : 'Assets may be underutilized',
      trend: this.determineTrend(assetTurnover, 1.0),
    });

    // Inventory Turnover
    const inventoryTurnover = data.inventory !== 0
      ? data.costOfGoodsSold / data.inventory
      : 0;

    ratios.push({
      name: 'Inventory Turnover',
      category: 'Efficiency',
      value: inventoryTurnover,
      industryBenchmark: 6.0,
      formula: 'Cost of Goods Sold / Average Inventory',
      interpretation: inventoryTurnover >= 6
        ? 'Efficient inventory management'
        : 'Slow-moving inventory or overstocking',
      trend: this.determineTrend(inventoryTurnover, 6.0),
    });

    // Receivables Turnover
    const receivablesTurnover = data.accountsReceivable !== 0
      ? data.revenue / data.accountsReceivable
      : 0;

    ratios.push({
      name: 'Receivables Turnover',
      category: 'Efficiency',
      value: receivablesTurnover,
      industryBenchmark: 12.0,
      formula: 'Revenue / Average Accounts Receivable',
      interpretation: receivablesTurnover >= 12
        ? 'Efficient collection of receivables'
        : 'Slow collection or credit issues',
      trend: this.determineTrend(receivablesTurnover, 12.0),
    });

    // Days Sales Outstanding (DSO)
    const dso = receivablesTurnover !== 0
      ? 365 / receivablesTurnover
      : 0;

    ratios.push({
      name: 'Days Sales Outstanding',
      category: 'Efficiency',
      value: dso,
      industryBenchmark: 30.0,
      formula: '365 / Receivables Turnover',
      interpretation: dso <= 30
        ? 'Fast collection of receivables'
        : dso <= 60
          ? 'Reasonable collection period'
          : 'Slow collection - review credit policies',
      trend: this.determineTrend(30.0, dso), // Lower is better
    });

    return ratios;
  }

  private findLineAmount(lines: any[], searchTerm: string): number {
    const line = lines.find(l =>
      l.accountName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return line?.amount || 0;
  }

  private determineTrend(actual: number, benchmark: number): string {
    const variance = ((actual - benchmark) / benchmark) * 100;

    if (Math.abs(variance) <= 5) return 'stable';
    return variance > 0 ? 'improving' : 'declining';
  }
}
