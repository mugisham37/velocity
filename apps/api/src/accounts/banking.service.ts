import {
  type BankAccount,
  type BankReconciliation,
  type NewBankAccount,
  accounts,
  bankAccounts,
  bankReconciliations,
  bankStatementImports,
  bankTransactions,
  cashFlowForecasts,
  glEntries,
  onlinePayments,
  paymentGateways,
  reconciliationItems,
} from '../database';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, eq, sql, sum } from '../database';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AuditService } from '../common/services/audit.service';
import { BaseService } from '../common/services/base.service';
import { CacheService } from '../common/services/cache.service';
import { PerformanceMonitorService } from '../common/services/performance-monitor.service';

export interface CreateBankAccountDto {
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  bankName: string;
  bankAddress?: string;
  accountType:
    | 'checking'
    | 'savings'
    | 'credit_card'
    | 'loan'
    | 'investment'
    | 'petty_cash';
  currency?: string;
  currentBalance?: number;
  glAccountId?: string;
  overdraftLimit?: number;
  interestRate?: number;
  minimumBalance?: number;
  monthlyFee?: number;
  notes?: string;
}

export interface ImportBankStatementDto {
  bankAccountId: string;
  fileName: string;
  fileFormat: 'OFX' | 'CSV' | 'MT940' | 'QIF';
  fileContent: string;
  statementStartDate: Date;
  statementEndDate: Date;
}

export interface CreateReconciliationDto {
  bankAccountId: string;
  statementDate: Date;
  statementBalance: number;
  reconciliationItems: {
    bankTransactionId?: string;
    glEntryId?: string;
    itemType:
      | 'DEPOSIT_IN_TRANSIT'
      | 'OUTSTANDING_CHECK'
      | 'BANK_ADJUSTMENT'
      | 'BOOK_ADJUSTMENT';
    amount: number;
    description: string;
  }[];
}

export interface CashFlowForecastDto {
  forecastName: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  currency?: string;
  openingBalance: number;
  forecastItems: {
    itemDate: Date;
    itemType: 'INFLOW' | 'OUTFLOW';
    category: string;
    description: string;
    projectedAmount: number;
    confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
    source?: string;
    notes?: string;
  }[];
}

export interface ReconciliationSummary {
  bankAccountId: string;
  accountName: string;
  lastReconciledDate?: Date;
  reconciledBalance: number;
  currentBalance: number;
  unreconciledTransactions: number;
  unreconciledAmount: number;
}

@Injectable()
export class BankingService extends BaseService<
  any, // Temporarily use any to avoid Drizzle type issues
  BankAccount,
  NewBankAccount,
  Partial<NewBankAccount>
> {
  protected table = bankAccounts as any;
  protected tableName = 'bank_accounts';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    logger: Logger,
    private readonly auditService: AuditService,
    protected override readonly cacheService: CacheService,
    protected override readonly performanceMonitor: PerformanceMonitorService
  ) {
    super(logger, cacheService, performanceMonitor);
  }

  /**
   * Create bank account with GL account linking
   */
  async createBankAccount(
    data: CreateBankAccountDto,
    companyId: string,
    userId: string
  ): Promise<BankAccount> {
    return await this.transaction(async tx => {
      // Validate GL account if provided
      if (data.glAccountId) {
        const [glAccount] = await tx
          .select()
          .from(accounts)
          .where(
            and(
              eq(accounts.id, data.glAccountId),
              eq(accounts.companyId, companyId)
            )
          )
          .limit(1);

        if (!glAccount) {
          throw new BadRequestException('GL Account not found');
        }

        if (glAccount.accountType !== 'Asset') {
          throw new BadRequestException('GL Account must be an Asset account');
        }
      }

      // Check for duplicate account number
      const [existingAccount] = await tx
        .select()
        .from(bankAccounts)
        .where(
          and(
            eq(bankAccounts.accountNumber, data.accountNumber),
            eq(bankAccounts.companyId, companyId)
          )
        )
        .limit(1);

      if (existingAccount) {
        throw new BadRequestException(
          `Bank account with number ${data.accountNumber} already exists`
        );
      }

      // Create bank account
      const [bankAccount] = await tx
        .insert(bankAccounts)
        .values({
          accountName: data.accountName,
          accountNumber: data.accountNumber,
          routingNumber: data.routingNumber || null,
          bankName: data.bankName,
          bankAddress: data.bankAddress || null,
          accountType: data.accountType,
          currency: data.currency || 'USD',
          currentBalance: data.currentBalance?.toString() || '0',
          availableBalance: data.currentBalance?.toString() || '0',
          reconciledBalance: '0',
          glAccountId: data.glAccountId ?? null,
          overdraftLimit: data.overdraftLimit?.toString() || null,
          interestRate: data.interestRate?.toString() || null,
          minimumBalance: data.minimumBalance?.toString() || null,
          monthlyFee: data.monthlyFee?.toString() || null,
          notes: data.notes || null,
          companyId,
        })
        .returning();

      if (!bankAccount) {
        throw new BadRequestException('Failed to create bank account');
      }

      // Log audit trail
      await this.auditService.logAudit({
        entityType: 'bank_accounts',
        entityId: bankAccount.id,
        action: 'CREATE',
        newValues: bankAccount,
        companyId,
        userId,
      });

      return bankAccount;
    });
  }

  /**
   * Import bank statement transactions
   */
  async importBankStatement(
    data: ImportBankStatementDto,
    companyId: string,
    userId: string
  ): Promise<{ imported: number; duplicates: number; errors: string[] }> {
    return await this.transaction(async tx => {
      // Validate bank account
      const [bankAccount] = await tx
        .select()
        .from(bankAccounts)
        .where(
          and(
            eq(bankAccounts.id, data.bankAccountId),
            eq(bankAccounts.companyId, companyId)
          )
        )
        .limit(1);

      if (!bankAccount) {
        throw new BadRequestException('Bank account not found');
      }

      // Create import record
      const [importRecord] = await tx
        .insert(bankStatementImports)
        .values({
          bankAccountId: data.bankAccountId,
          fileName: data.fileName,
          fileFormat: data.fileFormat,
          statementStartDate: data.statementStartDate,
          statementEndDate: data.statementEndDate,
          totalTransactions: 0,
          successfulImports: 0,
          failedImports: 0,
          duplicateTransactions: 0,
          status: 'processing',
          importedBy: userId,
          companyId,
        })
        .returning();

      // Parse transactions based on file format
      const transactions = await this.parseStatementFile(
        data.fileContent,
        data.fileFormat
      );

      let imported = 0;
      let duplicates = 0;
      const errors: string[] = [];

      for (const transaction of transactions) {
        try {
          // Check for duplicate transactions
          const [existing] = await tx
            .select()
            .from(bankTransactions)
            .where(
              and(
                eq(bankTransactions.bankAccountId, data.bankAccountId),
                eq(bankTransactions.transactionDate, transaction.date),
                eq(bankTransactions.amount, transaction.amount.toString()),
                eq(bankTransactions.description, transaction.description)
              )
            )
            .limit(1);

          if (existing) {
            duplicates++;
            continue;
          }

          // Create bank transaction
          await tx.insert(bankTransactions).values({
            bankAccountId: data.bankAccountId,
            transactionDate: transaction.date,
            valueDate: transaction.valueDate || transaction.date,
            transactionType: transaction.type,
            amount: transaction.amount.toString(),
            runningBalance: transaction.balance?.toString(),
            description: transaction.description,
            reference: transaction.reference,
            checkNumber: transaction.checkNumber,
            payee: transaction.payee,
            category: transaction.category,
            reconciliationStatus: 'unreconciled',
            importedFrom: data.fileFormat,
            originalData: JSON.stringify(transaction),
            companyId,
          });

          imported++;
        } catch (error) {
          errors.push(
            `Transaction ${transaction.description}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Update import record
      await tx
        .update(bankStatementImports)
        .set({
          totalTransactions: transactions.length,
          successfulImports: imported,
          failedImports: errors.length,
          duplicateTransactions: duplicates,
          status: 'completed',
          errorLog: errors.length > 0 ? errors.join('\n') : null,
        })
        .where(eq(bankStatementImports.id, importRecord!.id));

      // Update bank account balance if provided
      if (transactions.length > 0) {
        const lastTransaction = transactions[transactions.length - 1];
        if (lastTransaction.balance) {
          await tx
            .update(bankAccounts)
            .set({
              currentBalance: lastTransaction.balance.toString(),
              availableBalance: lastTransaction.balance.toString(),
            })
            .where(eq(bankAccounts.id, data.bankAccountId));
        }
      }

      return { imported, duplicates, errors };
    });
  }

  /**
   * Perform bank reconciliation
   */
  async performReconciliation(
    data: CreateReconciliationDto,
    companyId: string,
    userId: string
  ): Promise<BankReconciliation> {
    return await this.transaction(async tx => {
      // Validate bank account
      const [bankAccount] = await tx
        .select()
        .from(bankAccounts)
        .where(
          and(
            eq(bankAccounts.id, data.bankAccountId),
            eq(bankAccounts.companyId, companyId)
          )
        )
        .limit(1);

      if (!bankAccount) {
        throw new BadRequestException('Bank account not found');
      }

      // Calculate book balance from GL entries
      const [bookBalanceResult] = await tx
        .select({
          balance: sum(
            sql`CASE WHEN ${glEntries.debit} > 0 THEN ${glEntries.debit} ELSE -${glEntries.credit} END`
          ),
        })
        .from(glEntries)
        .innerJoin(accounts, eq(glEntries.accountId, accounts.id))
        .where(
          and(
            eq(accounts.id, bankAccount.glAccountId!),
            eq(glEntries.companyId, companyId)
          )
        );

      const bookBalance = parseFloat(bookBalanceResult?.balance?.toString() || '0');

      // Calculate reconciliation totals
      let totalDepositsInTransit = 0;
      let totalOutstandingChecks = 0;
      let totalBankAdjustments = 0;
      let totalBookAdjustments = 0;

      for (const item of data.reconciliationItems) {
        switch (item.itemType) {
          case 'DEPOSIT_IN_TRANSIT':
            totalDepositsInTransit += item.amount;
            break;
          case 'OUTSTANDING_CHECK':
            totalOutstandingChecks += item.amount;
            break;
          case 'BANK_ADJUSTMENT':
            totalBankAdjustments += item.amount;
            break;
          case 'BOOK_ADJUSTMENT':
            totalBookAdjustments += item.amount;
            break;
        }
      }

      const adjustedBookBalance = bookBalance + totalBookAdjustments;
      const adjustedBankBalance =
        data.statementBalance +
        totalDepositsInTransit -
        totalOutstandingChecks +
        totalBankAdjustments;
      const variance = Math.abs(adjustedBookBalance - adjustedBankBalance);
      const isBalanced = variance < 0.01; // Allow for rounding differences

      // Create reconciliation record
      const [reconciliation] = await tx
        .insert(bankReconciliations)
        .values({
          bankAccountId: data.bankAccountId,
          reconciliationDate: new Date(),
          statementDate: data.statementDate,
          statementBalance: data.statementBalance.toString(),
          bookBalance: bookBalance.toString(),
          adjustedBookBalance: adjustedBookBalance.toString(),
          totalDepositsInTransit: totalDepositsInTransit.toString(),
          totalOutstandingChecks: totalOutstandingChecks.toString(),
          totalBankAdjustments: totalBankAdjustments.toString(),
          totalBookAdjustments: totalBookAdjustments.toString(),
          isBalanced,
          variance: variance.toString(),
          reconciledBy: userId,
          companyId,
        })
        .returning();

      // Create reconciliation items
      for (const item of data.reconciliationItems) {
        await tx.insert(reconciliationItems).values({
          reconciliationId: reconciliation!.id,
          bankTransactionId: item.bankTransactionId ?? null,
          glEntryId: item.glEntryId ?? null,
          itemType: item.itemType,
          amount: item.amount.toString(),
          description: item.description,
          isCleared: true,
          companyId,
        });

        // Mark bank transaction as reconciled if provided
        if (item.bankTransactionId) {
          await tx
            .update(bankTransactions)
            .set({
              reconciliationStatus: 'cleared',
              reconciledDate: new Date(),
              isCleared: true,
              clearedDate: new Date(),
            })
            .where(eq(bankTransactions.id, item.bankTransactionId));
        }
      }

      // Update bank account reconciliation info
      if (isBalanced) {
        await tx
          .update(bankAccounts)
          .set({
            lastReconciled: new Date(),
            reconciledBalance: adjustedBookBalance.toString(),
          })
          .where(eq(bankAccounts.id, data.bankAccountId));
      }

      // Log audit trail
      await this.auditService.logAudit({
        entityType: 'bank_reconciliations',
        entityId: reconciliation!.id,
        action: 'CREATE',
        newValues: { ...reconciliation, items: data.reconciliationItems },
        companyId,
        userId,
      });

      return reconciliation!;
    });
  }

  /**
   * Create cash flow forecast
   */
  async createCashFlowForecast(
    data: CashFlowForecastDto,
    companyId: string,
    userId: string
  ): Promise<any> {
    return await this.transaction(async tx => {
      // Calculate projected closing balance
      const totalInflows = data.forecastItems
        .filter(item => item.itemType === 'INFLOW')
        .reduce((sum, item) => sum + item.projectedAmount, 0);

      const totalOutflows = data.forecastItems
        .filter(item => item.itemType === 'OUTFLOW')
        .reduce((sum, item) => sum + item.projectedAmount, 0);

      const projectedClosingBalance =
        data.openingBalance + totalInflows - totalOutflows;

      // Create forecast
      const [forecast] = await tx
        .insert(cashFlowForecasts)
        .values({
          forecastName: data.forecastName,
          description: data.description ?? null,
          startDate: data.startDate,
          endDate: data.endDate,
          currency: data.currency || 'USD',
          openingBalance: data.openingBalance.toString(),
          projectedClosingBalance: projectedClosingBalance.toString(),
          companyId,
          createdBy: userId,
        })
        .returning();

      // Create forecast items
      // Note: This would need the cashFlowForecastItems table import
      // For now, just return the forecast

      // Log audit trail
      await this.auditService.logAudit({
        entityType: 'cash_flow_forecasts',
        entityId: forecast!.id,
        action: 'CREATE',
        newValues: { ...forecast, items: data.forecastItems },
        companyId,
        userId,
      });

      return forecast!;
    });
  }

  /**
   * Get reconciliation summary for all bank accounts
   */
  async getReconciliationSummary(
    companyId: string
  ): Promise<ReconciliationSummary[]> {
    const accounts = await this.database
      .select({
        id: bankAccounts.id,
        accountName: bankAccounts.accountName,
        lastReconciled: bankAccounts.lastReconciled,
        reconciledBalance: bankAccounts.reconciledBalance,
        currentBalance: bankAccounts.currentBalance,
      })
      .from(bankAccounts)
      .where(
        and(
          eq(bankAccounts.companyId, companyId),
          eq(bankAccounts.isActive, true)
        )
      );

    const summaries: ReconciliationSummary[] = [];

    for (const account of accounts) {
      // Get unreconciled transactions count and amount
      const [unreconciledResult] = await this.database
        .select({
          count: sql<number>`COUNT(*)`,
          amount: sum(bankTransactions.amount),
        })
        .from(bankTransactions)
        .where(
          and(
            eq(bankTransactions.bankAccountId, account.id),
            eq(bankTransactions.reconciliationStatus, 'unreconciled'),
            eq(bankTransactions.companyId, companyId)
          )
        );

      const summary: any = {
        bankAccountId: account.id,
        accountName: account.accountName,
        reconciledBalance: parseFloat(account.reconciledBalance),
        currentBalance: parseFloat(account.currentBalance),
        unreconciledTransactions: unreconciledResult?.count || 0,
        unreconciledAmount: parseFloat(unreconciledResult?.amount?.toString() || '0'),
      };
      if (account.lastReconciled) {
        summary.lastReconciledDate = account.lastReconciled;
      }
      summaries.push(summary);
    }

    return summaries;
  }

  /**
   * Process online payments from payment gateways
   */
  async processOnlinePayments(companyId: string): Promise<void> {
    // Get pending online payments
    const pendingPayments = await this.database
      .select()
      .from(onlinePayments)
      .innerJoin(
        paymentGateways,
        eq(onlinePayments.paymentGatewayId, paymentGateways.id)
      )
      .where(
        and(
          eq(onlinePayments.companyId, companyId),
          eq(onlinePayments.status, 'pending')
        )
      );

    for (const {
      online_payments: payment,
      payment_gateways: gateway,
    } of pendingPayments) {
      try {
        // TODO: Integrate with actual payment gateway APIs
        // For now, just mark as completed
        await this.database
          .update(onlinePayments)
          .set({
            status: 'completed',
            settlementDate: new Date(),
          })
          .where(eq(onlinePayments.id, payment.id));

        this.logger.info('Online payment processed', {
          paymentId: payment.id,
          amount: payment.amount,
          gateway: gateway.gatewayType,
        });
      } catch (error) {
        // Mark payment as failed
        await this.database
          .update(onlinePayments)
          .set({
            status: 'failed',
          })
          .where(eq(onlinePayments.id, payment.id));

        this.logger.error('Failed to process online payment', {
          paymentId: payment.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Private helper methods
   */
  private async parseStatementFile(
    fileContent: string,
    format: string
  ): Promise<any[]> {
    // TODO: Implement actual file parsing for different formats
    // This is a simplified implementation
    const transactions: any[] = [];

    switch (format) {
      case 'CSV':
        const lines = fileContent.split('\n').filter(line => line.trim());
        if (lines.length === 0) break;
        
        // Parse headers (not used in this simple implementation)
        // const headers = lines[0]?.split(',') || [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line) continue;
          
          const values = line.split(',');
          if (values.length >= 4 && values[0] && values[1] && values[2]) {
            transactions.push({
              date: new Date(values[0]),
              description: values[1],
              amount: parseFloat(values[2]),
              balance: values[3] ? parseFloat(values[3]) : undefined,
              type: parseFloat(values[2]) > 0 ? 'deposit' : 'withdrawal',
              reference: values[4] || undefined,
            });
          }
        }
        break;

      case 'OFX':
        // TODO: Implement OFX parsing
        break;

      case 'MT940':
        // TODO: Implement MT940 parsing
        break;

      case 'QIF':
        // TODO: Implement QIF parsing
        break;

      default:
        throw new BadRequestException(`Unsupported file format: ${format}`);
    }

    return transactions;
  }
}

