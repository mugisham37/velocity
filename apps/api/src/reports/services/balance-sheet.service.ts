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
export class BalanceSheetService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly accountsService: AccountsService
  ) {}

  async generateBalanceSheet(
    input: FinancialReportInput,
    companyId: string
  ): Promise<FinancialReport> {
    this.logger.info('Generating balance sheet', { input, companyId });

    try {
      // Get account hierarchy for Assets, Liabilities, and Equity
      const [assets, liabilities, equity] = await Promise.all([
        this.accountsService.getAccountHierarchy(companyId, 'Asset'),
        this.accountsService.getAccountHierarchy(companyId, 'Liability'),
        this.accountsService.getAccountHierarchy(companyId, 'Equity'),
      ]);

      // Calculate balances for each account as of the period end
      const assetLines = await this.buildReportLines(
        assets,
        companyId,
        input.periodEnd,
        input.comparativePeriodEnd
      );
      const liabilityLines = await this.buildReportLines(
        liabilities,
        companyId,
        input.periodEnd,
        input.comparativePeriodEnd
      );
      const equityLines = await this.buildReportLines(
        equity,
        companyId,
        input.periodEnd,
        input.comparativePeriodEnd
      );

      // Calculate totals
      const totalAssets = this.calculateTotal(assetLines);
      const totalLiabilities = this.calculateTotal(liabilityLines);
      const totalEquity = this.calculateTotal(equityLines);

      // Combine all lines
      const allLines: FinancialReportLine[] = [
        ...this.addSectionHeader('ASSETS', assetLines),
        ...this.addSectionHeader('LIABILITIES', liabilityLines),
        ...this.addSectionHeader('EQUITY', equityLines),
      ];

      const report: FinancialReport = {
        reportType: 'BALANCE_SHEET',
        title: 'Balance Sheet',
        companyName: 'Company Name', // TODO: Get from company service
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        lines: allLines,
        totalAssets,
        totalLiabilities,
        totalEquity,
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
      this.logger.error('Failed to generate balance sheet', {
        error,
        input,
        companyId,
      });
      throw error;
    }
  }

  private async buildReportLines(
    accounts: any[],
    companyId: string,
    asOfDate: Date,
    comparativeDate?: Date,
    level: number = 0
  ): Promise<FinancialReportLine[]> {
    const lines: FinancialReportLine[] = [];

    for (const account of accounts) {
      const [currentBalance, previousBalance] = await Promise.all([
        this.accountsService.getAccountBalance(account.id, companyId, asOfDate),
        comparativeDate
          ? this.accountsService.getAccountBalance(
              account.id,
              companyId,
              comparativeDate
            )
          : Promise.resolve(0),
      ]);

      const variance = currentBalance - previousBalance;
      const variancePercent =
        previousBalance !== 0
          ? (variance / Math.abs(previousBalance)) * 100
          : 0;

      const line: FinancialReportLine = {
        accountId: account.id,
        accountCode: account.accountCode,
        accountName: account.accountName,
        accountType: account.accountType,
        amount: currentBalance,
        previousAmount: previousBalance,
        variance,
        variancePercent,
        isGroup: account.isGroup,
        level,
      };

      // Add children if this is a group account
      if (account.children && account.children.length > 0) {
        line.children = await this.buildReportLines(
          account.children,
          companyId,
          asOfDate,
          comparativeDate,
          level + 1
        );
      }

      lines.push(line);
    }

    return lines;
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

  private calculateTotal(lines: FinancialReportLine[]): number {
    return lines.reduce((total, line) => {
      if (line.children && line.children.length > 0) {
        return total + this.calculateTotal(line.children);
      }
      return total + line.amount;
    }, 0);
  }
}
