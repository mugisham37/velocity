import { Field, Float, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

@InputType()
export class JournalEntryLineInput {
  @Field()
  @IsString()
  accountId!: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  debit?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  credit?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reference?: string;
}

@InputType()
export class CreateJournalEntryInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reference?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field()
  @IsDateString()
  postingDate!: string;

  @Field(() => [JournalEntryLineInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineInput)
  entries!: JournalEntryLineInput[];
}
