import {
  type Account,
  type JournalEntry,
  type NewAccount,
  accounts,
  glEntries,
  journalEntries,
} from '@kiro/database';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, eq, like, sql } from '@kiro/database';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AuditService } from '../common/services/audit.service';
import { BaseService } from '../common/services/base.service';
import { CacheService } from '../common/services/cache.service';
import { PerformanceMonitorService } from '../common/services/performance-monitor.service';

export interface CreateAccountDto {
  accountCode?: string;
  accountName: string;
  accountType: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  parentAccountId?: string;
  currency?: string;
  isGroup?: boolean;
  description?: string;
}

export interface UpdateAccountDto {
  accountName?: string;
  parentAccountId?: string;
  currency?: string;
  isGroup?: boolean;
  description?: string;
  isActive?: boolean;
}

export interface CreateJournalEntryDto {
  reference?: string;
  description?: string;
  postingDate: Date;
  entries: {
    accountId: string;
    debit?: number;
    credit?: number;
    description?: string;
    reference?: string;
  }[];
}

export interface AccountHierarchy {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  balance: string;
  isGroup: boolean;
  children: AccountHierarchy[];
}

export interface AccountTemplate {
  name: string;
  industry: string;
  accounts: {
    code: string;
    name: string;
    type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
    parentCode?: string;
    isGroup: boolean;
  }[];
}

@Injectable()
export class AccountsService extends BaseService<
  any, // Temporarily use any to avoid Drizzle type issues
  Account,
  NewAccount,
  UpdateAccountDto
> {
  protected table = accounts as any;
  protected tableName = 'accounts';

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
   * Create account with auto-generated code
   */
  async createAccount(
    data: CreateAccountDto,
    companyId: string,
    userId?: string
  ): Promise<Account> {
    try {
      // Generate account code if not provided
      if (!data.accountCode) {
        data.accountCode = await this.generateAccountCode(
          data.accountType,
          companyId
        );
      }

      // Validate parent account if provided
      if (data.parentAccountId) {
        const parentAccount = await this.findById(
          data.parentAccountId,
          companyId
        );
        if (!parentAccount) {
          throw new BadRequestException('Parent account not found');
        }
        if (!parentAccount.isGroup) {
          throw new BadRequestException(
            'Parent account must be a group account'
          );
        }
        if (parentAccount.accountType !== data.accountType) {
          throw new BadRequestException(
            'Account type must match parent account type'
          );
        }
      }

      // Check for duplicate account code
      const existingAccount = await this.findByAccountCode(
        data.accountCode,
        companyId
      );
      if (existingAccount) {
        throw new BadRequestException(
          `Account code ${data.accountCode} already exists`
        );
      }

      const account = await this.create(
        {
          accountCode: data.accountCode,
          accountName: data.accountName,
          accountType: data.accountType,
          parentAccountId: data.parentAccountId || null,
          currency: data.currency || 'USD',
          isGroup: data.isGroup || false,
          description: data.description || null,
          balance: '0',
          isActive: true,
          companyId,
        } as any,
        companyId
      );

      // Log audit trail
      if (userId) {
        await this.auditService.logAudit({
          entityType: 'accounts',
          entityId: account.id,
          action: 'CREATE',
          newValues: account,
          companyId,
          userId,
        });
      }

      return account;
    } catch (error) {
      this.logger.error('Failed to create account', { error, data, companyId });
      throw error;
    }
  }

  /**
   * Update account
   */
  async updateAccount(
    id: string,
    data: UpdateAccountDto,
    companyId: string,
    userId?: string
  ): Promise<Account> {
    const oldAccount = await this.findByIdOrFail(id, companyId);

    // Validate parent account change
    if (
      data.parentAccountId &&
      data.parentAccountId !== oldAccount.parentAccountId
    ) {
      const parentAccount = await this.findById(
        data.parentAccountId,
        companyId
      );
      if (!parentAccount) {
        throw new BadRequestException('Parent account not found');
      }
      if (!parentAccount.isGroup) {
        throw new BadRequestException('Parent account must be a group account');
      }
      if (parentAccount.accountType !== oldAccount.accountType) {
        throw new BadRequestException(
          'Account type must match parent account type'
        );
      }

      // Check for circular reference
      if (
        await this.wouldCreateCircularReference(
          id,
          data.parentAccountId,
          companyId
        )
      ) {
        throw new BadRequestException(
          'Cannot create circular reference in account hierarchy'
        );
      }
    }

    const updatedAccount = await this.update(id, data, companyId);

    // Log audit trail
    if (userId) {
      await this.auditService.logAudit({
        entityType: 'accounts',
        entityId: id,
        action: 'UPDATE',
        oldValues: oldAccount,
        newValues: updatedAccount,
        companyId,
        userId,
      });
    }

    return updatedAccount;
  }

  /**
   * Get account hierarchy
   */
  async getAccountHierarchy(
    companyId: string,
    accountType?: string
  ): Promise<AccountHierarchy[]> {
    const conditions = [
      eq(accounts.companyId, companyId),
      eq(accounts.isActive, true),
    ];
    if (accountType) {
      conditions.push(eq(accounts.accountType, accountType));
    }

    const allAccounts = await this.database
      .select()
      .from(accounts)
      .where(and(...conditions))
      .orderBy(accounts.accountCode);

    return this.buildHierarchy(allAccounts);
  }

  /**
   * Find account by code
   */
  async findByAccountCode(
    accountCode: string,
    companyId: string
  ): Promise<Account | null> {
    const [account] = await this.database
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.accountCode, accountCode),
          eq(accounts.companyId, companyId)
        )
      )
      .limit(1);

    return account || null;
  }

  /**
   * Get account balance
   */
  async getAccountBalance(
    accountId: string,
    companyId: string,
    asOfDate?: Date
  ): Promise<number> {
    const conditions = [
      eq(glEntries.accountId, accountId),
      eq(glEntries.companyId, companyId),
    ];

    if (asOfDate) {
      conditions.push(sql`${journalEntries.postingDate} <= ${asOfDate}`);
    }

    const [result] = await this.database
      .select({
        totalDebit: sql<number>`COALESCE(SUM(${glEntries.debit}), 0)`,
        totalCredit: sql<number>`COALESCE(SUM(${glEntries.credit}), 0)`,
      })
      .from(glEntries)
      .innerJoin(
        journalEntries,
        eq(glEntries.journalEntryId, journalEntries.id)
      )
      .where(and(...conditions));

    const account = await this.findByIdOrFail(accountId, companyId);
    const debitBalance = parseFloat(result?.totalDebit?.toString() || '0');
    const creditBalance = parseFloat(result?.totalCredit?.toString() || '0');

    // Calculate balance based on account type
    switch (account.accountType) {
      case 'Asset':
      case 'Expense':
        return debitBalance - creditBalance;
      case 'Liability':
      case 'Equity':
      case 'Income':
        return creditBalance - debitBalance;
      default:
        return debitBalance - creditBalance;
    }
  }

  /**
   * Create journal entry
   */
  async createJournalEntry(
    data: CreateJournalEntryDto,
    companyId: string,
    userId: string
  ): Promise<JournalEntry> {
    return await this.transaction(async tx => {
      // Validate entries
      if (!data.entries || data.entries.length === 0) {
        throw new BadRequestException(
          'Journal entry must have at least one entry'
        );
      }

      let totalDebit = 0;
      let totalCredit = 0;

      for (const entry of data.entries) {
        if (!entry.debit && !entry.credit) {
          throw new BadRequestException(
            'Each entry must have either debit or credit amount'
          );
        }
        if (entry.debit && entry.credit) {
          throw new BadRequestException(
            'Each entry cannot have both debit and credit amounts'
          );
        }
        if (entry.debit) totalDebit += entry.debit;
        if (entry.credit) totalCredit += entry.credit;

        // Validate account exists
        const account = await this.findById(entry.accountId, companyId);
        if (!account) {
          throw new BadRequestException(`Account ${entry.accountId} not found`);
        }
        if (account.isGroup) {
          throw new BadRequestException(
            `Cannot post to group account ${account.accountName}`
          );
        }
      }

      // Validate double-entry bookkeeping
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new BadRequestException('Total debits must equal total credits');
      }

      // Generate entry number
      const entryNumber = await this.generateJournalEntryNumber(companyId);

      // Create journal entry
      const [journalEntry] = await tx
        .insert(journalEntries)
        .values({
          entryNumber,
          postingDate: data.postingDate,
          reference: data.reference || null,
          description: data.description || null,
          totalDebit: totalDebit.toString(),
          totalCredit: totalCredit.toString(),
          isPosted: true,
          companyId,
          createdBy: userId,
        })
        .returning();

      if (!journalEntry) {
        throw new BadRequestException('Failed to create journal entry');
      }

      // Create GL entries
      const glEntryPromises = data.entries.map(entry =>
        tx.insert(glEntries).values({
          journalEntryId: journalEntry.id,
          accountId: entry.accountId,
          debit: entry.debit?.toString() || '0',
          credit: entry.credit?.toString() || '0',
          description: entry.description || null,
          reference: entry.reference || null,
          companyId,
        })
      );

      await Promise.all(glEntryPromises);

      // Update account balances
      await this.updateAccountBalances(data.entries, companyId, tx);

      // Log audit trail
      await this.auditService.logAudit({
        entityType: 'journal_entries',
        entityId: journalEntry.id,
        action: 'CREATE',
        newValues: { ...journalEntry, entries: data.entries },
        companyId,
        userId,
      });

      return journalEntry;
    });
  }

  /**
   * Merge accounts
   */
  async mergeAccounts(
    sourceAccountId: string,
    targetAccountId: string,
    companyId: string,
    userId: string
  ): Promise<void> {
    return await this.transaction(async tx => {
      const sourceAccount = await this.findByIdOrFail(
        sourceAccountId,
        companyId
      );
      const targetAccount = await this.findByIdOrFail(
        targetAccountId,
        companyId
      );

      // Validate merge conditions
      if (sourceAccount.accountType !== targetAccount.accountType) {
        throw new BadRequestException(
          'Cannot merge accounts of different types'
        );
      }
      if (sourceAccount.isGroup || targetAccount.isGroup) {
        throw new BadRequestException('Cannot merge group accounts');
      }

      // Move all GL entries to target account
      await tx
        .update(glEntries)
        .set({ accountId: targetAccountId })
        .where(
          and(
            eq(glEntries.accountId, sourceAccountId),
            eq(glEntries.companyId, companyId)
          )
        );

      // Update target account balance
      const sourceBalance = parseFloat(sourceAccount.balance);
      const targetBalance = parseFloat(targetAccount.balance);
      const newBalance = (sourceBalance + targetBalance).toString();

      await tx
        .update(accounts)
        .set({ balance: newBalance })
        .where(eq(accounts.id, targetAccountId));

      // Deactivate source account
      await tx
        .update(accounts)
        .set({ isActive: false })
        .where(eq(accounts.id, sourceAccountId));

      // Log audit trail
      await this.auditService.logAudit({
        entityType: 'accounts',
        entityId: sourceAccountId,
        action: 'UPDATE',
        oldValues: sourceAccount,
        newValues: { ...sourceAccount, isActive: false },
        companyId,
        userId,
        metadata: { mergedInto: targetAccountId },
      });
    });
  }

  /**
   * Apply account template
   */
  async applyAccountTemplate(
    templateName: string,
    companyId: string,
    userId: string
  ): Promise<Account[]> {
    const template = this.getAccountTemplate(templateName);
    if (!template) {
      throw new BadRequestException(
        `Account template ${templateName} not found`
      );
    }

    const createdAccounts: Account[] = [];
    const accountMap = new Map<string, string>(); // code -> id mapping

    // Sort accounts to create parent accounts first
    const sortedAccounts = template.accounts.sort((a, b) => {
      if (!a.parentCode && b.parentCode) return -1;
      if (a.parentCode && !b.parentCode) return 1;
      return 0;
    });

    for (const accountData of sortedAccounts) {
      const parentAccountId = accountData.parentCode
        ? accountMap.get(accountData.parentCode)
        : undefined;

      const accountCreateData: any = {
        accountCode: accountData.code,
        accountName: accountData.name,
        accountType: accountData.type,
        isGroup: accountData.isGroup,
      };
      if (parentAccountId !== undefined) {
        accountCreateData.parentAccountId = parentAccountId;
      }

      const account = await this.createAccount(
        accountCreateData,
        companyId,
        userId
      );

      createdAccounts.push(account);
      accountMap.set(accountData.code, account.id);
    }

    return createdAccounts;
  }

  /**
   * Private helper methods
   */
  private async generateAccountCode(
    accountType: string,
    companyId: string
  ): Promise<string> {
    const prefix = this.getAccountTypePrefix(accountType);

    const [result] = await this.database
      .select({
        maxCode: sql<string>`MAX(CAST(SUBSTRING(${accounts.accountCode}, 2) AS INTEGER))`,
      })
      .from(accounts)
      .where(
        and(
          eq(accounts.companyId, companyId),
          like(accounts.accountCode, `${prefix}%`)
        )
      );

    const nextNumber = result?.maxCode ? parseInt(result.maxCode) + 1 : 1;
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  private getAccountTypePrefix(accountType: string): string {
    switch (accountType) {
      case 'Asset':
        return '1';
      case 'Liability':
        return '2';
      case 'Equity':
        return '3';
      case 'Income':
        return '4';
      case 'Expense':
        return '5';
      default:
        return '9';
    }
  }

  private async generateJournalEntryNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `JE-${year}-`;

    const [result] = await this.database
      .select({
        maxNumber: sql<string>`MAX(CAST(SUBSTRING(${journalEntries.entryNumber}, ${prefix.length + 1}) AS INTEGER))`,
      })
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.companyId, companyId),
          like(journalEntries.entryNumber, `${prefix}%`)
        )
      );

    const nextNumber = result?.maxNumber ? parseInt(result.maxNumber) + 1 : 1;
    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }

  private buildHierarchy(accounts: Account[]): AccountHierarchy[] {
    const accountMap = new Map<string, AccountHierarchy>();
    const rootAccounts: AccountHierarchy[] = [];

    // Create hierarchy objects
    accounts.forEach(account => {
      accountMap.set(account.id, {
        id: account.id,
        accountCode: account.accountCode,
        accountName: account.accountName,
        accountType: account.accountType,
        balance: account.balance,
        isGroup: account.isGroup,
        children: [],
      });
    });

    // Build hierarchy
    accounts.forEach(account => {
      const hierarchyAccount = accountMap.get(account.id)!;

      if (account.parentAccountId) {
        const parent = accountMap.get(account.parentAccountId);
        if (parent) {
          parent.children.push(hierarchyAccount);
        } else {
          rootAccounts.push(hierarchyAccount);
        }
      } else {
        rootAccounts.push(hierarchyAccount);
      }
    });

    return rootAccounts;
  }

  private async wouldCreateCircularReference(
    accountId: string,
    newParentId: string,
    companyId: string
  ): Promise<boolean> {
    let currentParentId: string | null = newParentId;

    while (currentParentId) {
      if (currentParentId === accountId) {
        return true;
      }

      const parent = await this.findById(currentParentId, companyId);
      currentParentId = parent?.parentAccountId || null;
    }

    return false;
  }

  private async updateAccountBalances(
    entries: { accountId: string; debit?: number; credit?: number }[],
    companyId: string,
    tx: any
  ): Promise<void> {
    for (const entry of entries) {
      const account = await this.findByIdOrFail(entry.accountId, companyId);
      const currentBalance = parseFloat(account.balance);

      let balanceChange = 0;
      switch (account.accountType) {
        case 'Asset':
        case 'Expense':
          balanceChange = (entry.debit || 0) - (entry.credit || 0);
          break;
        case 'Liability':
        case 'Equity':
        case 'Income':
          balanceChange = (entry.credit || 0) - (entry.debit || 0);
          break;
      }

      const newBalance = (currentBalance + balanceChange).toString();

      await tx
        .update(accounts)
        .set({ balance: newBalance })
        .where(eq(accounts.id, entry.accountId));
    }
  }

  private getAccountTemplate(templateName: string): AccountTemplate | null {
    const templates: Record<string, AccountTemplate> = {
      manufacturing: {
        name: 'Manufacturing Company',
        industry: 'Manufacturing',
        accounts: [
          // Assets
          { code: '1000', name: 'Assets', type: 'Asset', isGroup: true },
          {
            code: '1100',
            name: 'Current Assets',
            type: 'Asset',
            parentCode: '1000',
            isGroup: true,
          },
          {
            code: '1110',
            name: 'Cash and Cash Equivalents',
            type: 'Asset',
            parentCode: '1100',
            isGroup: false,
          },
          {
            code: '1120',
            name: 'Accounts Receivable',
            type: 'Asset',
            parentCode: '1100',
            isGroup: false,
          },
          {
            code: '1130',
            name: 'Inventory - Raw Materials',
            type: 'Asset',
            parentCode: '1100',
            isGroup: false,
          },
          {
            code: '1140',
            name: 'Inventory - Work in Process',
            type: 'Asset',
            parentCode: '1100',
            isGroup: false,
          },
          {
            code: '1150',
            name: 'Inventory - Finished Goods',
            type: 'Asset',
            parentCode: '1100',
            isGroup: false,
          },

          // Liabilities
          {
            code: '2000',
            name: 'Liabilities',
            type: 'Liability',
            isGroup: true,
          },
          {
            code: '2100',
            name: 'Current Liabilities',
            type: 'Liability',
            parentCode: '2000',
            isGroup: true,
          },
          {
            code: '2110',
            name: 'Accounts Payable',
            type: 'Liability',
            parentCode: '2100',
            isGroup: false,
          },
          {
            code: '2120',
            name: 'Accrued Expenses',
            type: 'Liability',
            parentCode: '2100',
            isGroup: false,
          },

          // Equity
          { code: '3000', name: 'Equity', type: 'Equity', isGroup: true },
          {
            code: '3100',
            name: 'Share Capital',
            type: 'Equity',
            parentCode: '3000',
            isGroup: false,
          },
          {
            code: '3200',
            name: 'Retained Earnings',
            type: 'Equity',
            parentCode: '3000',
            isGroup: false,
          },

          // Income
          { code: '4000', name: 'Revenue', type: 'Income', isGroup: true },
          {
            code: '4100',
            name: 'Sales Revenue',
            type: 'Income',
            parentCode: '4000',
            isGroup: false,
          },

          // Expenses
          { code: '5000', name: 'Expenses', type: 'Expense', isGroup: true },
          {
            code: '5100',
            name: 'Cost of Goods Sold',
            type: 'Expense',
            parentCode: '5000',
            isGroup: false,
          },
          {
            code: '5200',
            name: 'Operating Expenses',
            type: 'Expense',
            parentCode: '5000',
            isGroup: true,
          },
          {
            code: '5210',
            name: 'Salaries and Wages',
            type: 'Expense',
            parentCode: '5200',
            isGroup: false,
          },
          {
            code: '5220',
            name: 'Rent Expense',
            type: 'Expense',
            parentCode: '5200',
            isGroup: false,
          },
        ],
      },
      retail: {
        name: 'Retail Company',
        industry: 'Retail',
        accounts: [
          // Assets
          { code: '1000', name: 'Assets', type: 'Asset', isGroup: true },
          {
            code: '1100',
            name: 'Current Assets',
            type: 'Asset',
            parentCode: '1000',
            isGroup: true,
          },
          {
            code: '1110',
            name: 'Cash and Cash Equivalents',
            type: 'Asset',
            parentCode: '1100',
            isGroup: false,
          },
          {
            code: '1120',
            name: 'Accounts Receivable',
            type: 'Asset',
            parentCode: '1100',
            isGroup: false,
          },
          {
            code: '1130',
            name: 'Inventory',
            type: 'Asset',
            parentCode: '1100',
            isGroup: false,
          },

          // Liabilities
          {
            code: '2000',
            name: 'Liabilities',
            type: 'Liability',
            isGroup: true,
          },
          {
            code: '2100',
            name: 'Current Liabilities',
            type: 'Liability',
            parentCode: '2000',
            isGroup: true,
          },
          {
            code: '2110',
            name: 'Accounts Payable',
            type: 'Liability',
            parentCode: '2100',
            isGroup: false,
          },

          // Equity
          { code: '3000', name: 'Equity', type: 'Equity', isGroup: true },
          {
            code: '3100',
            name: 'Share Capital',
            type: 'Equity',
            parentCode: '3000',
            isGroup: false,
          },

          // Income
          { code: '4000', name: 'Revenue', type: 'Income', isGroup: true },
          {
            code: '4100',
            name: 'Sales Revenue',
            type: 'Income',
            parentCode: '4000',
            isGroup: false,
          },

          // Expenses
          { code: '5000', name: 'Expenses', type: 'Expense', isGroup: true },
          {
            code: '5100',
            name: 'Cost of Goods Sold',
            type: 'Expense',
            parentCode: '5000',
            isGroup: false,
          },
          {
            code: '5200',
            name: 'Operating Expenses',
            type: 'Expense',
            parentCode: '5000',
            isGroup: true,
          },
        ],
      },
    };

    return templates[templateName] || null;
  }
}
