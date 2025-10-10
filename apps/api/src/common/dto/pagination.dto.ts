import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsPositive, Max, Min } from 'class-validator';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsPositive()
  page?: number = 1;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @Field({ nullable: true })
  @IsOptional()
  sortBy?: string;

  @Field({ nullable: true })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}