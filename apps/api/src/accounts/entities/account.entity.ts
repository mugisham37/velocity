import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Account {
  @Field(() => ID)
  id: string;

  @Field()
  accountCode: string;

  @Field()
  accountName: string;

  @Field()
  accountType: string;

  @Field(() => ID, { nullable: true })
  parentAccountId?: string | null;

  @Field(() => ID)
  companyId: string;

  @Field({ nullable: true })
  currency?: string | null;

  @Field()
  isGroup: boolean;

  @Field()
  isActive: boolean;

  @Field()
  balance: string;

  @Field({ nullable: true })
  description?: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Virtual fields
  @Field(() => Account, { nullable: true })
  parentAccount?: Account;

  @Field(() => [Account])
  childAccounts?: Account[];
}

@ObjectType()
export class AccountHierarchy {
  @Field(() => ID)
  id: string;

  @Field()
  accountCode: string;

  @Field()
  accountName: string;

  @Field()
  accountType: string;

  @Field()
  balance: string;

  @Field()
  isGroup: boolean;

  @Field(() => [AccountHierarchy])
  children: AccountHierarchy[];
}

@ObjectType()
export class JournalEntry {
  @Field(() => ID)
  id: string;

  @Field()
  entryNumber: string;

  @Field()
  postingDate: Date;

  @Field({ nullable: true })
  reference?: string | null;

  @Field({ nullable: true })
  description?: string | null;

  @Field()
  totalDebit: string;

  @Field()
  totalCredit: string;

  @Field()
  isPosted: boolean;

  @Field(() => ID)
  companyId: string;

  @Field(() => ID)
  createdBy: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [GLEntry])
  glEntries?: GLEntry[];
}

@ObjectType()
export class GLEntry {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  journalEntryId: string;

  @Field(() => ID)
  accountId: string;

  @Field()
  debit: string;

  @Field()
  credit: string;

  @Field({ nullable: true })
  description?: string | null;

  @Field({ nullable: true })
  reference?: string | null;

  @Field(() => ID)
  companyId: string;

  @Field()
  createdAt: Date;

  @Field(() => Account)
  account?: Account;

  @Field(() => JournalEntry)
  journalEntry?: JournalEntry;
}

@ObjectType()
export class FiscalYear {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  startDate: Date;

  @Field()
  endDate: Date;

  @Field()
  isClosed: boolean;

  @Field(() => ID)
  companyId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [FiscalPeriod])
  periods?: FiscalPeriod[];
}

@ObjectType()
export class FiscalPeriod {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  startDate: Date;

  @Field()
  endDate: Date;

  @Field(() => ID)
  fiscalYearId: string;

  @Field()
  isClosed: boolean;

  @Field(() => ID)
  companyId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => FiscalYear)
  fiscalYear?: FiscalYear;
}

@ObjectType()
export class GLReportEntry {
  @Field(() => ID)
  glEntryId: string;

  @Field(() => ID)
  journalEntryId: string;

  @Field()
  entryNumber: string;

  @Field()
  postingDate: Date;

  @Field({ nullable: true })
  reference?: string | null;

  @Field({ nullable: true })
  description?: string | null;

  @Field(() => ID)
  accountId: string;

  @Field()
  accountCode: string;

  @Field()
  accountName: string;

  @Field()
  accountType: string;

  @Field()
  debit: string;

  @Field()
  credit: string;

  @Field()
  runningBalance: string;
}
