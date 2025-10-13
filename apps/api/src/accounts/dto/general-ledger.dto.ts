import { Field, ID, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

@InputType()
export class CreateFiscalYearInput {
  @Field()
  @IsString()
  name!: string;

  @Field()
  @IsDateString()
  startDate!: string;

  @Field()
  @IsDateString()
  endDate!: string;
}

@InputType()
export class JournalTemplateLineInput {
  @Field(() => ID)
  @IsString()
  accountId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  debitFormula?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  creditFormula?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sequence?: string;
}

@InputType()
export class CreateJournalTemplateInput {
  @Field()
  @IsString()
  name!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => [JournalTemplateLineInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalTemplateLineInput)
  lines!: JournalTemplateLineInput[];
}

@InputType()
export class CreateRecurringEntryInput {
  @Field()
  @IsString()
  name!: string;

  @Field(() => ID)
  @IsString()
  templateId!: string;

  @Field()
  @IsEnum(['MONTHLY', 'QUARTERLY', 'YEARLY'])
  frequency!: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

  @Field()
  @IsDateString()
  startDate!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

@InputType()
export class ClosingEntryInput {
  @Field(() => ID)
  @IsString()
  accountId!: string;

  @Field({ nullable: true })
  @IsOptional()
  debit?: number;

  @Field({ nullable: true })
  @IsOptional()
  credit?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}

@InputType()
export class PeriodClosingInput {
  @Field(() => ID)
  @IsString()
  periodId!: string;

  @Field(() => [ClosingEntryInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClosingEntryInput)
  closingEntries?: ClosingEntryInput[];
}

@InputType()
export class GLReportOptionsInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  accountId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  includeClosingEntries?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(['account', 'date', 'reference'])
  groupBy?: 'account' | 'date' | 'reference';

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(['date', 'account', 'amount'])
  sortBy?: 'date' | 'account' | 'amount';

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

