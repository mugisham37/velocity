import {
  accounts,
  db,
  fiscalPeriods,
  fiscalYears,
  glEntries,
  journalEntries,
  journalEntryTemplates,
  journalEntryTemplateLines,
  recurringJournalEntries,
} from '../database';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, between, desc, eq, gte, lte, sql } from '../database';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AuditService } from '../common/services/audit.service';

export interface CreateFiscalYearDto {
  name: string;
  startDate: Date;
  endDate: Date;
}

export interface CreateJournalTemplateDto {
  name: string;
  description?: string;
  lines: {
    accountId: string;
    debitFormula?: string;
    creditFormula?: string;
    description?: string;
    sequence?: string;
  }[];
}

export interface CreateRecurringEntryDto {
  name: string;
  templateId: string;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: Date;
  endDate?: Date;
}

export interface PeriodClosingDto {
  periodId: string;
  closingEntries?: {
    accountId: string;
    debit?: number;
    credit?: number;
    description?: string;
  }[];
}

export interface GLReportOptions {
  accountId?: string;
  startDate?: Date;
  endDate?: Date;
  includeClosingEntries?: boolean;
  groupBy?: 'account' | 'date' | 'reference';
  sortBy?: 'date' | 'account' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class GeneralLedgerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly auditService: AuditService
  ) {}

  /**
   * Create fiscal year with automatic period generation
   */
  async createFiscalYear(
    data: CreateFiscalYearDto,
    companyId: string,
    userId: string
  ): Promise<any> {
    return await db.transaction(async tx => {
      // Create fiscal year
      const [fiscalYear] = await tx
        .insert(fiscalYears)
        .values({
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate,
          companyId,
        })
        .returning();

      if (!fiscalYear) {
        throw new BadRequestException('Failed to create fiscal year');
      }

      // Generate monthly periods
      const periods = this.generateMonthlyPeriods(data.startDate, data.endDate);

      const periodInserts = periods.map(period => ({
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
        fiscalYearId: fiscalYear.id,
        companyId,
      }));

      await tx.insert(fiscalPeriods).values(periodInserts);

      // Log audit trail
      await this.auditService.logAudit({
        entityType: 'fiscal_years',
        entityId: fiscalYear.id,
        action: 'CREATE',
        newValues: { ...fiscalYear, periods: periodInserts },
        companyId,
        userId,
      });

      return fiscalYear;
    });
  }

  /**
   * Close fiscal period
   */
  async closeFiscalPeriod(
    data: PeriodClosingDto,
    companyId: string,
    userId: string
  ): Promise<void> {
    return await db.transaction(async tx => {
      // Validate period exists and is not already closed
      const [period] = await tx
        .select()
        .from(fiscalPeriods)
        .where(
          and(
            eq(fiscalPeriods.id, data.periodId),
            eq(fiscalPeriods.companyId, companyId)
          )
        )
        .limit(1);

      if (!period) {
        throw new NotFoundException('Fiscal period not found');
      }

      if (period.isClosed) {
        throw new BadRequestException('Period is already closed');
      }

      // Validate all journal entries in the period are posted
      const unpostedEntries = await tx
        .select({ count: sql<number>`COUNT(*)` })
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.companyId, companyId),
            between(
              journalEntries.postingDate,
              period.startDate,
              period.endDate
            ),
            eq(journalEntries.isPosted, false)
          )
        );

      if ((unpostedEntries[0]?.count ?? 0) > 0) {
        throw new BadRequestException(
          'Cannot close period with unposted journal entries'
        );
      }

      // Create closing entries if provided
      if (data.closingEntries && data.closingEntries.length > 0) {
        const totalDebit = data.closingEntries.reduce(
          (sum, entry) => sum + (entry.debit || 0),
          0
        );
        const totalCredit = data.closingEntries.reduce(
          (sum, entry) => sum + (entry.credit || 0),
          0
        );

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          throw new BadRequestException('Closing entries must balance');
        }

        // Generate closing entry number
        const entryNumber = await this.generateJournalEntryNumber(
          companyId,
          'CLOSING'
        );

        const [closingJournalEntry] = await tx
          .insert(journalEntries)
          .values({
            entryNumber,
            postingDate: period.endDate,
            reference: `Period Closing - ${period.name}`,
            description: `Closing entries for period ${period.name}`,
            totalDebit: totalDebit.toString(),
            totalCredit: totalCredit.toString(),
            isPosted: true,
            companyId,
            createdBy: userId,
          })
          .returning();

        if (!closingJournalEntry) {
          throw new BadRequestException('Failed to create closing journal entry');
        }

        // Create GL entries for closing
        const closingGLEntries = data.closingEntries.map(entry => ({
          journalEntryId: closingJournalEntry.id,
          accountId: entry.accountId,
          debit: (entry.debit || 0).toString(),
          credit: (entry.credit || 0).toString(),
          description: entry.description || 'Period closing entry',
          reference: `CLOSING-${period.name}`,
          companyId,
        }));

        await tx.insert(glEntries).values(closingGLEntries);
      }

      // Close the period
      await tx
        .update(fiscalPeriods)
        .set({
          isClosed: true,
          updatedAt: new Date(),
        })
        .where(eq(fiscalPeriods.id, data.periodId));

      // Log audit trail
      await this.auditService.logAudit({
        entityType: 'fiscal_periods',
        entityId: data.periodId,
        action: 'UPDATE',
        oldValues: period,
        newValues: { ...period, isClosed: true },
        companyId,
        userId,
        metadata: { action: 'period_closing' },
      });

      this.logger.info('Fiscal period closed', {
        periodId: data.periodId,
        periodName: period.name,
        companyId,
        userId,
      });
    });
  }

  /**
   * Create journal entry template
   */
  async createJournalTemplate(
    data: CreateJournalTemplateDto,
    companyId: string,
    userId: string
  ): Promise<any> {
    return await db.transaction(async tx => {
      // Create template
      const [template] = await tx
        .insert(journalEntryTemplates)
        .values({
          name: data.name,
          description: data.description || null,
          companyId,
        })
        .returning();

      if (!template) {
        throw new BadRequestException('Failed to create journal template');
      }

      // Create template lines
      const templateLines = data.lines.map((line, index) => ({
        templateId: template.id,
        accountId: line.accountId,
        debitFormula: line.debitFormula || null,
        creditFormula: line.creditFormula || null,
        description: line.description || null,
        sequence: line.sequence || ((index + 1) * 10).toString(),
        companyId,
      }));

      await tx.insert(journalEntryTemplateLines).values(templateLines);

      // Log audit trail
      await this.auditService.logAudit({
        entityType: 'journal_entry_templates',
        entityId: template.id,
        action: 'CREATE',
        newValues: { ...template, lines: templateLines },
        companyId,
        userId,
      });

      return template;
    });
  }

  /**
   * Create recurring journal entry
   */
  async createRecurringEntry(
    data: CreateRecurringEntryDto,
    companyId: string,
    userId: string
  ): Promise<any> {
    // Validate template exists
    const [template] = await db
      .select()
      .from(journalEntryTemplates)
      .where(
        and(
          eq(journalEntryTemplates.id, data.templateId),
          eq(journalEntryTemplates.companyId, companyId),
          eq(journalEntryTemplates.isActive, true)
        )
      )
      .limit(1);

    if (!template) {
      throw new NotFoundException('Journal entry template not found');
    }

    const nextRunDate = this.calculateNextRunDate(
      data.startDate,
      data.frequency
    );

    const [recurringEntry] = await db
      .insert(recurringJournalEntries)
      .values({
        name: data.name,
        templateId: data.templateId,
        frequency: data.frequency,
        startDate: data.startDate,
        endDate: data.endDate || null,
        nextRunDate,
        companyId,
      })
      .returning();

    if (!recurringEntry) {
      throw new BadRequestException('Failed to create recurring entry');
    }

    // Log audit trail
    await this.auditService.logAudit({
      entityType: 'recurring_journal_entries',
      entityId: recurringEntry.id,
      action: 'CREATE',
      newValues: recurringEntry,
      companyId,
      userId,
    });

    return recurringEntry;
  }

  /**
   * Process recurring journal entries
   */
  async processRecurringEntries(companyId: string): Promise<void> {
    const today = new Date();

    // Get all active recurring entries that are due
    const dueEntries = await db
      .select()
      .from(recurringJournalEntries)
      .where(
        and(
          eq(recurringJournalEntries.companyId, companyId),
          eq(recurringJournalEntries.isActive, true),
          lte(recurringJournalEntries.nextRunDate, today)
        )
      );

    for (const recurringEntry of dueEntries) {
      try {
        await this.createJournalEntryFromTemplate(
          recurringEntry.templateId,
          {
            reference: `AUTO-${recurringEntry.name}`,
            description: `Recurring entry: ${recurringEntry.name}`,
            postingDate: recurringEntry.nextRunDate,
          },
          companyId,
          'system' // System user for automated entries
        );

        // Update next run date
        const nextRunDate = this.calculateNextRunDate(
          recurringEntry.nextRunDate,
          recurringEntry.frequency
        );

        // Check if we've passed the end date
        if (recurringEntry.endDate && nextRunDate > recurringEntry.endDate) {
          await db
            .update(recurringJournalEntries)
            .set({
              isActive: false,
              updatedAt: new Date(),
            })
            .where(eq(recurringJournalEntries.id, recurringEntry.id));
        } else {
          await db
            .update(recurringJournalEntries)
            .set({
              nextRunDate,
              updatedAt: new Date(),
            })
            .where(eq(recurringJournalEntries.id, recurringEntry.id));
        }

        this.logger.info('Processed recurring journal entry', {
          recurringEntryId: recurringEntry.id,
          name: recurringEntry.name,
          nextRunDate,
          companyId,
        });
      } catch (error) {
        this.logger.error('Failed to process recurring journal entry', {
          error,
          recurringEntryId: recurringEntry.id,
          companyId,
        });
      }
    }
  }

  /**
   * Reverse journal entry
   */
  async reverseJournalEntry(
    journalEntryId: string,
    reverseDate: Date,
    reason: string,
    companyId: string,
    userId: string
  ): Promise<any> {
    return await db.transaction(async tx => {
      // Get original journal entry
      const [originalEntry] = await tx
        .select()
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.id, journalEntryId),
            eq(journalEntries.companyId, companyId)
          )
        )
        .limit(1);

      if (!originalEntry) {
        throw new NotFoundException('Journal entry not found');
      }

      // Get GL entries
      const originalGLEntries = await tx
        .select()
        .from(glEntries)
        .where(eq(glEntries.journalEntryId, journalEntryId));

      // Generate reversal entry number
      const entryNumber = await this.generateJournalEntryNumber(
        companyId,
        'REV'
      );

      // Create reversal journal entry
      const [reversalEntry] = await tx
        .insert(journalEntries)
        .values({
          entryNumber,
          postingDate: reverseDate,
          reference: `REV-${originalEntry.entryNumber}`,
          description: `Reversal of ${originalEntry.entryNumber}: ${reason}`,
          totalDebit: originalEntry.totalCredit, // Swap debit and credit
          totalCredit: originalEntry.totalDebit,
          isPosted: true,
          companyId,
          createdBy: userId,
        })
        .returning();

      if (!reversalEntry) {
        throw new BadRequestException('Failed to create reversal entry');
      }

      // Create reversal GL entries (swap debit and credit)
      const reversalGLEntries = originalGLEntries.map(entry => ({
        journalEntryId: reversalEntry.id,
        accountId: entry.accountId,
        debit: entry.credit, // Swap
        credit: entry.debit, // Swap
        description: `Reversal: ${entry.description || ''}`,
        reference: `REV-${entry.reference || ''}`,
        companyId,
      }));

      await tx.insert(glEntries).values(reversalGLEntries);

      // Update account balances
      await this.updateAccountBalancesForReversal(
        originalGLEntries,
        companyId,
        tx
      );

      // Log audit trail
      await this.auditService.logAudit({
        entityType: 'journal_entries',
        entityId: reversalEntry.id,
        action: 'CREATE',
        newValues: { ...reversalEntry, glEntries: reversalGLEntries },
        companyId,
        userId,
        metadata: {
          action: 'reversal',
          originalEntryId: journalEntryId,
          reason,
        },
      });

      return reversalEntry;
    });
  }

  /**
   * Get General Ledger report
   */
  async getGeneralLedgerReport(
    companyId: string,
    options: GLReportOptions = {}
  ): Promise<any[]> {
    const {
      accountId,
      startDate,
      endDate,
      includeClosingEntries = true,
      groupBy: _groupBy = 'date',
      sortBy = 'date',
      sortOrder = 'asc',
    } = options;

    let query = db
      .select({
        glEntryId: glEntries.id,
        journalEntryId: glEntries.journalEntryId,
        entryNumber: journalEntries.entryNumber,
        postingDate: journalEntries.postingDate,
        reference: journalEntries.reference,
        description: glEntries.description,
        accountId: glEntries.accountId,
        accountCode: accounts.accountCode,
        accountName: accounts.accountName,
        accountType: accounts.accountType,
        debit: glEntries.debit,
        credit: glEntries.credit,
        runningBalance: sql<string>`
          SUM(
            CASE
              WHEN ${accounts.accountType} IN ('Asset', 'Expense')
              THEN CAST(${glEntries.debit} AS DECIMAL) - CAST(${glEntries.credit} AS DECIMAL)
              ELSE CAST(${glEntries.credit} AS DECIMAL) - CAST(${glEntries.debit} AS DECIMAL)
            END
          ) OVER (
            PARTITION BY ${glEntries.accountId}
            ORDER BY ${journalEntries.postingDate}, ${glEntries.id}
          )
        `,
      })
      .from(glEntries)
      .innerJoin(
        journalEntries,
        eq(glEntries.journalEntryId, journalEntries.id)
      )
      .innerJoin(accounts, eq(glEntries.accountId, accounts.id))
      .where(eq(glEntries.companyId, companyId));

    // Apply filters
    const conditions = [eq(glEntries.companyId, companyId)];

    if (accountId) {
      conditions.push(eq(glEntries.accountId, accountId));
    }

    if (startDate) {
      conditions.push(gte(journalEntries.postingDate, startDate));
    }

    if (endDate) {
      conditions.push(lte(journalEntries.postingDate, endDate));
    }

    if (!includeClosingEntries) {
      conditions.push(sql`${journalEntries.reference} NOT LIKE 'CLOSING-%'`);
    }

    query = query.where(and(...conditions));

    // Apply sorting
    const orderByColumn =
      sortBy === 'account' ? accounts.accountCode : journalEntries.postingDate;
    const orderDirection =
      sortOrder === 'asc' ? asc(orderByColumn) : desc(orderByColumn);

    query = query.orderBy(orderDirection);

    return await query;
  }

  /**
   * Private helper methods
   */
  private generateMonthlyPeriods(
    startDate: Date,
    endDate: Date
  ): Array<{ name: string; startDate: Date; endDate: Date }> {
    const periods = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const periodStart = new Date(current);
      const periodEnd = new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        0
      ); // Last day of month

      if (periodEnd > endDate) {
        periodEnd.setTime(endDate.getTime());
      }

      periods.push({
        name: `${current.toLocaleString('default', { month: 'long' })} ${current.getFullYear()}`,
        startDate: periodStart,
        endDate: periodEnd,
      });

      current.setMonth(current.getMonth() + 1);
      current.setDate(1);
    }

    return periods;
  }

  private calculateNextRunDate(currentDate: Date, frequency: string): Date {
    const nextDate = new Date(currentDate);

    switch (frequency) {
      case 'MONTHLY':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'YEARLY':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    return nextDate;
  }

  private async generateJournalEntryNumber(
    companyId: string,
    prefix: string = 'JE'
  ): Promise<string> {
    const year = new Date().getFullYear();
    const entryPrefix = `${prefix}-${year}-`;

    const [result] = await db
      .select({
        maxNumber: sql<string>`MAX(CAST(SUBSTRING(${journalEntries.entryNumber}, ${entryPrefix.length + 1}) AS INTEGER))`,
      })
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.companyId, companyId),
          sql`${journalEntries.entryNumber} LIKE ${entryPrefix + '%'}`
        )
      );

    const nextNumber = result?.maxNumber ? parseInt(result.maxNumber) + 1 : 1;
    return `${entryPrefix}${nextNumber.toString().padStart(6, '0')}`;
  }

  private async createJournalEntryFromTemplate(
    templateId: string,
    _entryData: { reference?: string; description?: string; postingDate: Date },
    _companyId: string,
    _userId: string
  ): Promise<any> {
    // Get template and lines
    const template = await db
      .select()
      .from(journalEntryTemplates)
      .where(eq(journalEntryTemplates.id, templateId))
      .limit(1);

    const templateLines = await db
      .select()
      .from(journalEntryTemplateLines)
      .where(eq(journalEntryTemplateLines.templateId, templateId))
      .orderBy(asc(journalEntryTemplateLines.sequence));

    if (!template[0] || templateLines.length === 0) {
      throw new BadRequestException(
        'Invalid template or no template lines found'
      );
    }

    // For now, we'll use simple formulas (actual implementation would need a formula parser)
    const entries = templateLines.map(line => ({
      accountId: line.accountId,
      debit: line.debitFormula
        ? this.evaluateFormula(line.debitFormula)
        : undefined,
      credit: line.creditFormula
        ? this.evaluateFormula(line.creditFormula)
        : undefined,
      description: line.description,
    }));

    // Create journal entry using existing method
    // This would need to be implemented in the AccountsService
    // For now, we'll return a placeholder
    return { id: 'template-generated', entries };
  }

  private evaluateFormula(formula: string): number {
    // Simple formula evaluation - in production, use a proper formula parser
    // For now, just return a fixed value or parse simple numbers
    const numericValue = parseFloat(formula);
    return isNaN(numericValue) ? 0 : numericValue;
  }

  private async updateAccountBalancesForReversal(
    originalGLEntries: any[],
    _companyId: string,
    tx: any
  ): Promise<void> {
    for (const entry of originalGLEntries) {
      const [account] = await tx
        .select()
        .from(accounts)
        .where(eq(accounts.id, entry.accountId))
        .limit(1);

      if (account) {
        const currentBalance = parseFloat(account.balance);
        let balanceChange = 0;

        // Reverse the original balance change
        switch (account.accountType) {
          case 'Asset':
          case 'Expense':
            balanceChange = parseFloat(entry.credit) - parseFloat(entry.debit);
            break;
          case 'Liability':
          case 'Equity':
          case 'Income':
            balanceChange = parseFloat(entry.debit) - parseFloat(entry.credit);
            break;
        }

        const newBalance = (currentBalance + balanceChange).toString();

        await tx
          .update(accounts)
          .set({ balance: newBalance })
          .where(eq(accounts.id, entry.accountId));
      }
    }
  }
}

