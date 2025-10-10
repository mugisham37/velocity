import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

@InputType()
export class CreateAccountInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  accountCode?: string;

  @Field()
  @IsString()
  @MaxLength(255)
  accountName!: string;

  @Field()
  @IsEnum(['Asset', 'Liability', 'Equity', 'Income', 'Expense'])
  accountType!: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  parentAccountId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}
