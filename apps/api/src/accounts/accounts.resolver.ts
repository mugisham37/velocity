import type { User } from '@kiro/database';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccountsService } from './accounts.service';
import { CreateAccountInput } from './dto/create-account.dto';
import { CreateJournalEntryInput } from './dto/create-journal-entry.dto';
import { UpdateAccountInput } from './dto/update-account.dto';
import {
  Account,
  AccountHierarchy,
  JournalEntry,
} from './entities/account.entity';

@Resolver(() => Account)
@UseGuards(JwtAuthGuard)
export class AccountsResolver {
  constructor(
    private readonly accountsService: AccountsService
  ) {}

  @Mutation(() => Account)
  async createAccount(
    @Args('input') input: CreateAccountInput,
    @CurrentUser() user: User
  ): Promise<Account> {
    return this.accountsService.createAccount(input, user.companyId, user.id);
  }

  @Mutation(() => Account)
  async updateAccount(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateAccountInput,
    @CurrentUser() user: User
  ): Promise<Account> {
    return this.accountsService.updateAccount(
      id,
      input,
      user.companyId,
      user.id
    );
  }

  @Mutation(() => Boolean)
  async deleteAccount(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<boolean> {
    await this.accountsService.delete(id, user.companyId);
    return true;
  }

  @Query(() => Account, { nullable: true })
  async account(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<Account | null> {
    return this.accountsService.findById(id, user.companyId);
  }

  @Query(() => Account, { nullable: true })
  async accountByCode(
    @Args('code') code: string,
    @CurrentUser() user: User
  ): Promise<Account | null> {
    return this.accountsService.findByAccountCode(code, user.companyId);
  }

  @Query(() => [AccountHierarchy])
  async accountHierarchy(
    @Args('accountType', { nullable: true }) accountType?: string,
    @CurrentUser() user?: User
  ): Promise<AccountHierarchy[]> {
    if (!user) {
      throw new Error('User not authenticated');
    }
    return this.accountsService.getAccountHierarchy(
      user.companyId,
      accountType
    );
  }

  @Query(() => Number)
  async accountBalance(
    @Args('id', { type: () => ID }) id: string,
    @Args('asOfDate', { nullable: true }) asOfDate?: Date,
    @CurrentUser() user?: User
  ): Promise<number> {
    if (!user) {
      throw new Error('User not authenticated');
    }
    return this.accountsService.getAccountBalance(id, user.companyId, asOfDate);
  }

  @Mutation(() => JournalEntry)
  async createJournalEntry(
    @Args('input') input: CreateJournalEntryInput,
    @CurrentUser() user: User
  ): Promise<JournalEntry> {
    return this.accountsService.createJournalEntry(
      {
        ...input,
        postingDate: new Date(input.postingDate),
      },
      user.companyId,
      user.id
    );
  }

  @Mutation(() => Boolean)
  async mergeAccounts(
    @Args('sourceAccountId', { type: () => ID }) sourceAccountId: string,
    @Args('targetAccountId', { type: () => ID }) targetAccountId: string,
    @CurrentUser() user: User
  ): Promise<boolean> {
    await this.accountsService.mergeAccounts(
      sourceAccountId,
      targetAccountId,
      user.companyId,
      user.id
    );
    return true;
  }

  @Mutation(() => [Account])
  async applyAccountTemplate(
    @Args('templateName') templateName: string,
    @CurrentUser() user: User
  ): Promise<Account[]> {
    return this.accountsService.applyAccountTemplate(
      templateName,
      user.companyId,
      user.id
    );
  }

  // TODO: Add General Ledger mutations and queries when GeneralLedgerService is available
}
