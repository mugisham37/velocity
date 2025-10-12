import { Field, InputType, ObjectType, Int, Float, registerEnumType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

// Enums
export enum OpportunityStage {
  PROSPECTING = 'Prospecting',
  QUALIFICATION = 'Qualification',
  NEEDS_ANALYSIS = 'Needs Analysis',
  VALUE_PROPOSITION = 'Value Proposition',
  PROPOSAL = 'Proposal',
  NEGOTIATION = 'Negotiation',
  CLOSED_WON = 'Closed Won',
  CLOSED_LOST = 'Closed Lost',
}

export enum OpportunitySource {
  WEBSITE = 'Website',
  EMAIL_CAMPAIGN = 'Email Campaign',
  SOCIAL_MEDIA = 'Social Media',
  REFERRAL = 'Referral',
  COLD_CALL = 'Cold Call',
  TRADE_SHOW = 'Trade Show',
  ADVERTISEMENT = 'Advertisement',
  PARTNER = 'Partner',
  OTHER = 'Other',
}

export enum AccessLevel {
  READ = 'Read',
  WRITE = 'Write',
  FULL = 'Full',
}

// Register enums for GraphQL
registerEnumType(OpportunityStage, {
  name: 'OpportunityStage',
  description: 'The stage of an opportunity in the sales pipeline',
});

registerEnumType(OpportunitySource, {
  name: 'OpportunitySource',
  description: 'The source of an opportunity',
});

registerEnumType(AccessLevel, {
  name: 'AccessLevel',
  description: 'Access level for team members',
});

// GraphQL Object Types
@ObjectType()
export class OpportunityType {
  @Field()
  id!: string;

  @Field()
  opportunityCode!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  customerId?: string;

  @Field({ nullable: true })
  leadId?: string;

  @Field(() => OpportunityStage)
  stage!: OpportunityStage;

  @Field(() => Int)
  probability!: number;

  @Field(() => Float)
  amount!: number;

  @Field()
  currency!: string;

  @Field({ nullable: true })
  expectedCloseDate?: Date;

  @Field({ nullable: true })
  actualCloseDate?: Date;

  @Field(() => OpportunitySource, { nullable: true })
  source?: OpportunitySource;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  nextStep?: string;

  @Field({ nullable: true })
  assignedTo?: string;

  @Field({ nullable: true })
  territory?: string;

  @Field({ nullable: true })
  lostReason?: string;

  @Field()
  companyId!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class OpportunityActivityType {
  @Field()
  id!: string;

  @Field()
  opportunityId!: string;

  @Field()
  activityType!: string;

  @Field()
  subject!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  activityDate!: Date;

  @Field(() => Int, { nullable: true })
  duration?: number;

  @Field({ nullable: true })
  outcome?: string;

  @Field({ nullable: true })
  nextAction?: string;

  @Field({ nullable: true })
  nextActionDate?: Date;

  @Field()
  createdBy!: string;

  @Field()
  createdAt!: Date;
}

@ObjectType()
export class OpportunityCompetitorType {
  @Field()
  id!: string;

  @Field()
  opportunityId!: string;

  @Field()
  competitorName!: string;

  @Field({ nullable: true })
  strengths?: string;

  @Field({ nullable: true })
  weaknesses?: string;

  @Field(() => Float, { nullable: true })
  pricing?: number;

  @Field(() => Int, { nullable: true })
  winProbability?: number;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class OpportunityStageHistoryType {
  @Field()
  id!: string;

  @Field()
  opportunityId!: string;

  @Field(() => OpportunityStage, { nullable: true })
  fromStage?: OpportunityStage;

  @Field(() => OpportunityStage)
  toStage!: OpportunityStage;

  @Field(() => Int, { nullable: true })
  probability?: number;

  @Field(() => Float, { nullable: true })
  amount?: number;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  changedBy!: string;

  @Field()
  changedAt!: Date;
}

@ObjectType()
export class OpportunityTeamMemberType {
  @Field()
  id!: string;

  @Field()
  opportunityId!: string;

  @Field()
  userId!: string;

  @Field()
  role!: string;

  @Field(() => AccessLevel)
  accessLevel!: AccessLevel;

  @Field()
  addedAt!: Date;

  @Field()
  addedBy!: string;
}

// Input Types for Mutations
@InputType()
export class CreateOpportunityInput {
  @Field()
  @IsString()
  name!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @Field(() => OpportunityStage, { nullable: true })
  @IsOptional()
  @IsEnum(OpportunityStage)
  stage?: OpportunityStage;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  probability?: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  amount!: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expectedCloseDate?: Date;

  @Field(() => OpportunitySource, { nullable: true })
  @IsOptional()
  @IsEnum(OpportunitySource)
  source?: OpportunitySource;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  nextStep?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  territory?: string;
}

@InputType()
export class UpdateOpportunityInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @Field(() => OpportunityStage, { nullable: true })
  @IsOptional()
  @IsEnum(OpportunityStage)
  stage?: OpportunityStage;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  probability?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expectedCloseDate?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  actualCloseDate?: Date;

  @Field(() => OpportunitySource, { nullable: true })
  @IsOptional()
  @IsEnum(OpportunitySource)
  source?: OpportunitySource;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  nextStep?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  territory?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  lostReason?: string;
}

@InputType()
export class CreateOpportunityActivityInput {
  @Field()
  @IsUUID()
  opportunityId!: string;

  @Field()
  @IsString()
  activityType!: string;

  @Field()
  @IsString()
  subject!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field()
  @IsDate()
  @Type(() => Date)
  activityDate!: Date;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  outcome?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  nextAction?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  nextActionDate?: Date;
}

@InputType()
export class CreateOpportunityCompetitorInput {
  @Field()
  @IsUUID()
  opportunityId!: string;

  @Field()
  @IsString()
  competitorName!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  strengths?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  weaknesses?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricing?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  winProbability?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

@InputType()
export class AddTeamMemberInput {
  @Field()
  @IsUUID()
  opportunityId!: string;

  @Field()
  @IsUUID()
  userId!: string;

  @Field()
  @IsString()
  role!: string;

  @Field(() => AccessLevel, { nullable: true })
  @IsOptional()
  @IsEnum(AccessLevel)
  accessLevel?: AccessLevel;
}

@InputType()
export class OpportunityFilterInput {
  @Field(() => [OpportunityStage], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(OpportunityStage, { each: true })
  stage?: OpportunityStage[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  assignedTo?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  territory?: string[];

  @Field(() => [OpportunitySource], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(OpportunitySource, { each: true })
  source?: OpportunitySource[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  customerId?: string[];

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minProbability?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxProbability?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expectedCloseAfter?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expectedCloseBefore?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdAfter?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdBefore?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;
}

// Response Types
@ObjectType()
export class OpportunityConnection {
  @Field(() => [OpportunityType])
  opportunities!: OpportunityType[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  limit!: number;

  @Field(() => Int)
  totalPages!: number;
}

@ObjectType()
export class SalesForecastType {
  @Field(() => [StageForecastType])
  forecastByStage!: StageForecastType[];

  @Field(() => [ConversionRateType])
  conversionRates!: ConversionRateType[];

  @Field(() => Float)
  totalPipeline!: number;

  @Field(() => Float)
  totalWeighted!: number;
}

@ObjectType()
export class StageForecastType {
  @Field(() => OpportunityStage)
  stage!: OpportunityStage;

  @Field(() => Float)
  totalAmount!: number;

  @Field(() => Float)
  weightedAmount!: number;

  @Field(() => Int)
  count!: number;

  @Field(() => Float)
  averageProbability!: number;
}

@ObjectType()
export class ConversionRateType {
  @Field(() => OpportunityStage, { nullable: true })
  fromStage?: OpportunityStage;

  @Field(() => OpportunityStage)
  toStage!: OpportunityStage;

  @Field(() => Int)
  count!: number;
}

@ObjectType()
export class OpportunityAnalyticsType {
  @Field(() => Int)
  totalOpportunities!: number;

  @Field(() => Int)
  openOpportunities!: number;

  @Field(() => Int)
  wonOpportunities!: number;

  @Field(() => Int)
  lostOpportunities!: number;

  @Field(() => Float)
  totalValue!: number;

  @Field(() => Float)
  wonValue!: number;

  @Field(() => Float)
  averageDealSize!: number;

  @Field(() => Float)
  averageProbability!: number;

  @Field(() => Float)
  winRate!: number;

  @Field(() => [StageAnalyticsType])
  opportunitiesByStage!: StageAnalyticsType[];

  @Field(() => [SourceAnalyticsType])
  opportunitiesBySource!: SourceAnalyticsType[];
}

@ObjectType()
export class StageAnalyticsType {
  @Field(() => OpportunityStage)
  stage!: OpportunityStage;

  @Field(() => Int)
  count!: number;

  @Field(() => Float)
  totalValue!: number;
}

@ObjectType()
export class SourceAnalyticsType {
  @Field(() => OpportunitySource, { nullable: true })
  source?: OpportunitySource;

  @Field(() => Int)
  count!: number;

  @Field(() => Int)
  wonCount!: number;

  @Field(() => Float)
  totalValue!: number;
}

@InputType()
export class PaginationInput {
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

@InputType()
export class ForecastPeriodInput {
  @Field()
  @IsDate()
  @Type(() => Date)
  start!: Date;

  @Field()
  @IsDate()
  @Type(() => Date)
  end!: Date;
}
