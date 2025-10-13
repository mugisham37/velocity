import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AccountsService } from '../../accounts/accounts.service';
import {
  FinancialReport,
  FinancialReportInput,
  FinancialReportLine,
} from '../dto/financial-report.dto';

@Injectable()
export class ProfitLossService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly accountsService: AccountsService
  ) {}

  async generateProfitLossStatement(
    input: FinancialReportInput,
    companyId: string
  ): Promise<FinancialReport> {
    this.logger.info('Generating profit & loss statement', {
      input,
      companyId,
    });

    try {
      // Get account hierarchy for Income and Expenses
      const [income, expenses] = await Promise.all([
        this.accountsService.getAccountHierarchy(companyId, 'Income'),
        this.accountsService.getAccountHierarchy(companyId, 'Expense'),
      ]);

      // Calculate period balances (not as-of balances, but period activity)
      const incomeLines = await this.buildPeriodReportLines(
        income,
        companyId,
        input.periodStart,
        input.periodEnd,
        input.comparativePeriodStart,
        input.comparativePeriodEnd
      );

      const expenseLines = await this.buildPeriodReportLines(
        expenses,
        companyId,
        input.periodStart,
        input.periodEnd,
        input.comparativePeriodStart,
        input.comparativePeriodEnd
      );

      // Calculate totals
      const totalRevenue = this.calculateTotal(incomeLines);
      const totalExpenses = this.calculateTotal(expenseLines);
      const netIncome = totalRevenue - totalExpenses;

      // Build structured P&L
      const allLines: FinancialReportLine[] = [
        ...this.addSectionHeader('REVENUE', incomeLines),
        this.createTotalLine('Total Revenue', totalRevenue, 0),
        ...this.addSectionHeader('EXPENSES', expenseLines),
        this.createTotalLine('Total Expenses', totalExpenses, 0),
        this.createTotalLine('NET INCOME', netIncome, 0, true),
      ];

      const report: FinancialReport = {
        reportType: 'PROFIT_LOSS',
        title: 'Profit & Loss Statement',
        companyName: 'Company Name', // TODO: Get from company service
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        lines: allLines,
        totalRevenue,
        totalExpenses,
        netIncome,
        generatedAt: new Date(),
      };

      // Only add comparative periods if they exist
      if (input.comparativePeriodStart) {
        report.comparativePeriodStart = input.comparativePeriodStart;
      }
      if (input.comparativePeriodEnd) {
        report.comparativePeriodEnd = input.comparativePeriodEnd;
      }

      return report;
    } catch (error) {
      this.logger.error('Failed to generate profit & loss statement', {
        error,
        input,
        companyId,
      });
      throw error;
    }
  }

  async generateBudgetVarianceReport(
    input: FinancialReportInput,
    companyId: string
  ): Promise<FinancialReport> {
    this.logger.info('Generating budget variance report', { input, companyId });

    // TODO: Implement budget variance analysis
    // This would compare actual vs budgeted amounts
    const basicPL = await this.generateProfitLossStatement(input, companyId);

    return {
      ...basicPL,
      reportType: 'BUDGET_VARIANCE',
      title: 'Budget Variance Report',
    };
  }

  private async buildPeriodReportLines(
    accounts: any[],
    companyId: string,
    periodStart: Date,
    periodEnd: Date,
    comparativePeriodStart?: Date,
    comparativePeriodEnd?: Date,
    level: number = 0
  ): Promise<FinancialReportLine[]> {
    const lines: FinancialReportLine[] = [];

    for (const account of accounts) {
      // For P&L, we need period activity, not balance as of date
      const [currentActivity, previousActivity] = await Promise.all([
        this.getAccountPeriodActivity(
          account.id,
          companyId,
          periodStart,
          periodEnd
        ),
        comparativePeriodStart && comparativePeriodEnd
          ? this.getAccountPeriodActivity(
              account.id,
              companyId,
              comparativePeriodStart,
              comparativePeriodEnd
            )
          : Promise.resolve(0),
      ]);

      const variance = currentActivity - previousActivity;
      const variancePercent =
        previousActivity !== 0
          ? (variance / Math.abs(previousActivity)) * 100
          : 0;

      const line: FinancialReportLine = {
        accountId: account.id,
        accountCode: account.accountCode,
        accountName: account.accountName,
        accountType: account.accountType,
        amount: currentActivity,
        previousAmount: previousActivity,
        variance,
        variancePercent,
        isGroup: account.isGroup,
        level,
      };

      // Add children if this is a group account
      if (account.children && account.children.length > 0) {
        line.children = await this.buildPeriodReportLines(
          account.children,
          companyId,
          periodStart,
          periodEnd,
          comparativePeriodStart,
          comparativePeriodEnd,
          level + 1
        );
      }

      lines.push(line);
    }

    return lines;
  }

  private async getAccountPeriodActivity(
    accountId: string,
    companyId: string,
    _periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    // This would calculate the net activity for the period
    // For now, using the balance as a placeholder
    // In reality, this should sum GL entries for the period
    return this.accountsService.getAccountBalance(
      accountId,
      companyId,
      periodEnd
    );
  }

  private addSectionHeader(
    sectionName: string,
    lines: FinancialReportLine[]
  ): FinancialReportLine[] {
    const sectionTotal = this.calculateTotal(lines);

    const header: FinancialReportLine = {
      accountId: `section-${sectionName.toLowerCase()}`,
      accountCode: '',
      accountName: sectionName,
      accountType: 'Section',
      amount: sectionTotal,
      previousAmount: 0,
      variance: 0,
      variancePercent: 0,
      isGroup: true,
      level: 0,
      children: lines,
    };

    return [header];
  }

  private createTotalLine(
    name: string,
    amount: number,
    previousAmount: number,
    isNetIncome: boolean = false
  ): FinancialReportLine {
    const variance = amount - previousAmount;
    const variancePercent =
      previousAmount !== 0 ? (variance / Math.abs(previousAmount)) * 100 : 0;

    return {
      accountId: `total-${name.toLowerCase().replace(/\s+/g, '-')}`,
      accountCode: '',
      accountName: name,
      accountType: isNetIncome ? 'NetIncome' : 'Total',
      amount,
      previousAmount,
      variance,
      variancePercent,
      isGroup: true,
      level: 0,
    };
  }

  private calculateTotal(lines: FinancialReportLine[]): number {
    return lines.reduce((total, line) => {
      if (line.children && line.children.length > 0) {
        return total + this.calculateTotal(line.children);
      }
      return total + line.amount;
    }, 0);
  }
}

