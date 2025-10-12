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
export class TrialBalanceService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly accountsService: AccountsService
  ) {}

  async generateTrialBalance(
    input: FinancialReportInput,
    companyId: string
  ): Promise<FinancialReport> {
    this.logger.info('Generating trial balance', { input, companyId });

    try {
      // Get all accounts with balances
      const allAccounts = await this.getAllAccountsWithBalances(
        companyId,
        input.periodEnd
      );

      // Filter out zero balances if requested
      const filteredAccounts = input.includeInactive
        ? allAccounts
        : allAccounts.filter(account => Math.abs(account.amount) > 0.01);

      // Sort by account code
      filteredAccounts.sort((a, b) =>
        a.accountCode.localeCompare(b.accountCode)
      );

      // Calculate totals
      const totalDebits = filteredAccounts
        .filter(account => account.amount > 0)
        .reduce((sum, account) => sum + account.amount, 0);

      const totalCredits = filteredAccounts
        .filter(account => account.amount < 0)
        .reduce((sum, account) => sum + Math.abs(account.amount), 0);

      // Create trial balance lines with separate debit/credit columns
      const lines: FinancialReportLine[] = filteredAccounts.map(account => ({
        ...account,
        // For trial balance, show debits as positive, credits as positive in separate columns
        amount: account.amount > 0 ? account.amount : 0, // Debit column
        previousAmount: account.amount < 0 ? Math.abs(account.amount) : 0, // Credit column (reusing field)
        variance: 0,
        variancePercent: 0,
      }));

      // Add total line
      lines.push({
        accountId: 'trial-balance-totals',
        accountCode: '',
        accountName: 'TOTALS',
        accountType: 'Total',
        amount: totalDebits,
        previousAmount: totalCredits,
        variance: 0,
        variancePercent: 0,
        isGroup: true,
        level: 0,
      });

      // Verify trial balance
      const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;
      if (!isBalanced) {
        this.logger.warn('Trial balance does not balance', {
          totalDebits,
          totalCredits,
          difference: totalDebits - totalCredits,
          companyId,
        });
      }

      return {
        reportType: 'TRIAL_BALANCE',
        title: 'Trial Balance',
        companyName: 'Company Name',
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        lines,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to generate trial balance', {
        error,
        input,
        companyId,
      });
      throw error;
    }
  }

  async generateAdjustedTrialBalance(
    input: FinancialReportInput,
    companyId: string
  ): Promise<FinancialReport> {
    this.logger.info('Generating adjusted trial balance', { input, companyId });

    // Get base trial balance
    const trialBalance = await this.generateTrialBalance(input, companyId);

    // Get adjusting entries for the period
    const adjustingEntries = await this.getAdjustingEntries(
      companyId,
      input.periodStart,
      input.periodEnd
    );

    // Apply adjustments to trial balance
    const adjustedLines = this.applyAdjustments(
      trialBalance.lines,
      adjustingEntries
    );

    return {
      ...trialBalance,
      reportType: 'ADJUSTED_TRIAL_BALANCE',
      title: 'Adjusted Trial Balance',
      lines: adjustedLines,
    };
  }

  async generateClosingTrialBalance(
    input: FinancialReportInput,
    companyId: string
  ): Promise<FinancialReport> {
    this.logger.info('Generating closing trial balance', { input, companyId });

    // Get adjusted trial balance
    const adjustedTB = await this.generateAdjustedTrialBalance(
      input,
      companyId
    );

    // Get closing entries
    const closingEntries = await this.getClosingEntries(
      companyId,
      input.periodEnd
    );

    // Apply closing entries
    const closingLines = this.applyAdjustments(
      adjustedTB.lines,
      closingEntries
    );

    return {
      ...adjustedTB,
      reportType: 'CLOSING_TRIAL_BALANCE',
      title: 'Post-Closing Trial Balance',
      lines: closingLines,
    };
  }

  private async getAllAccountsWithBalances(
    companyId: string,
    asOfDate: Date
  ): Promise<FinancialReportLine[]> {
    // Get all accounts
    const allAccountTypes = [
      'Asset',
      'Liability',
      'Equity',
      'Income',
      'Expense',
    ];
    const accountHierarchies = await Promise.all(
      allAccountTypes.map(type =>
        this.accountsService.getAccountHierarchy(companyId, type)
      )
    );

    const allAccounts = accountHierarchies.flat();

    // Get balances for all accounts
    const accountsWithBalances: FinancialReportLine[] = [];

    for (const account of allAccounts) {
      const balance = await this.accountsService.getAccountBalance(
        account.id,
        companyId,
        asOfDate
      );

      // Only include leaf accounts (not group accounts) in trial balance
      if (!account.isGroup) {
        accountsWithBalances.push({
          accountId: account.id,
          accountCode: account.accountCode,
          accountName: account.accountName,
          accountType: account.accountType,
          amount: balance,
          previousAmount: 0,
          variance: 0,
          variancePercent: 0,
          isGroup: false,
          level: 0,
        });
      }
    }

    return accountsWithBalances;
  }

  private async getAdjustingEntries(
    _companyId: string,
    _periodStart: Date,
    _periodEnd: Date
  ): Promise<any[]> {
    // Get adjusting journal entries for the period
    // This would query journal entries marked as adjusting entries
    // For now, returning empty array
    return [];
  }

  private async getClosingEntries(
    _companyId: string,
    _periodEnd: Date
  ): Promise<any[]> {
    // Get closing journal entries for the period
    // This would query journal entries marked as closing entries
    // For now, returning empty array
    return [];
  }

  private applyAdjustments(
    lines: FinancialReportLine[],
    _adjustments: any[]
  ): FinancialReportLine[] {
    // Apply adjusting or closing entries to trial balance lines
    // For now, just return the original lines
    return lines;
  }
}
