import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsDateString,
  IsDecimal,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

// Enums
export enum DepreciationMethod {
  STRAIGHT_LINE = 'Straight Line',
  DECLINING_BALANCE = 'Declining Balance',
  UNITS_OF_PRODUCTION = 'Units of Production',
  SUM_OF_YEARS_DIGITS = 'Sum of Years Digits',
}

export enum DepreciationScheduleStatus {
  ACTIVE = 'Active',
  SUSPENDED = 'Suspended',
  COMPLETED = 'Completed',
}

export enum RevaluationMethod {
  FAIR_VALUE = 'Fair Value',
  REPLACEMENT_COST = 'Replacement Cost',
  MARKET_VALUE = 'Market Value',
}

export enum RevaluationStatus {
  DRAFT = 'Draft',
  PENDING_APPROVAL = 'Pending Approval',
  APPROVED = 'Approved',
  POSTED = 'Posted',
}

// Depreciation Schedule DTOs
@InputType()
export class CreateDepreciationScheduleDto {
  @Field()
  @IsUUID()
  assetId!: string;

  @Field()
  @IsEnum(DepreciationMethod)
  depreciationMethod!: DepreciationMethod;

  @Field()
  @IsInt()
  @Min(1)
  usefulLife!: number; // in months

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  salvageValue?: string;

  @Field()
  @IsDecimal()
  assetCost!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  depreciationRate?: string; // For declining balance

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  unitsOfProduction?: number; // For units of production method

  @Field()
  @IsDateString()
  startDate!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(DepreciationMethod)
  taxDepreciationMethod?: DepreciationMethod;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  taxUsefulLife?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  taxSalvageValue?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  assetAccountId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  depreciationExpenseAccountId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  accumulatedDepreciationAccountId?: string;

  @Field()
  @IsUUID()
  companyId!: string;
}

@InputType()
export class UpdateDepreciationScheduleDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(DepreciationMethod)
  depreciationMethod?: DepreciationMethod;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  usefulLife?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  salvageValue?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  assetCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  depreciationRate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  unitsOfProduction?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(DepreciationMethod)
  taxDepreciationMethod?: DepreciationMethod;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  taxUsefulLife?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  taxSalvageValue?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(DepreciationScheduleStatus)
  status?: DepreciationScheduleStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  assetAccountId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  depreciationExpenseAccountId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  accumulatedDepreciationAccountId?: string;
}

// Depreciation Entry DTOs
@InputType()
export class CreateDepreciationEntryDto {
  @Field()
  @IsUUID()
  scheduleId!: string;

  @Field()
  @IsDateString()
  depreciationDate!: string;

  @Field()
  @IsDateString()
  periodStartDate!: string;

  @Field()
  @IsDateString()
  periodEndDate!: string;

  @Field()
  @IsDecimal()
  depreciationAmount!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  taxDepreciationAmount?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  actualUnitsProduced?: number; // For units of production method

  @Field()
  @IsUUID()
  companyId!: string;
}

@InputType()
export class UpdateDepreciationEntryDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  depreciationDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  periodStartDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  periodEndDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  depreciationAmount?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  taxDepreciationAmount?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  actualUnitsProduced?: number;
}

@InputType()
export class ReverseDepreciationEntryDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  reversalReason!: string;

  @Field()
  @IsUUID()
  companyId!: string;
}

// Asset Revaluation DTOs
@InputType()
export class CreateAssetRevaluationDto {
  @Field()
  @IsUUID()
  assetId!: string;

  @Field()
  @IsDateString()
  revaluationDate!: string;

  @Field()
  @IsEnum(RevaluationMethod)
  revaluationMethod!: RevaluationMethod;

  @Field()
  @IsDecimal()
  previousBookValue!: string;

  @Field()
  @IsDecimal()
  newFairValue!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  valuationBasis?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  valuedBy?: string;

  @Field({ nullable: true })
  @IsOptional()
  valuationReport?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  assetAccountId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  revaluationSurplusAccountId?: string;

  @Field({ nullable: true })
  @IsOptional()
  documents?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field()
  @IsUUID()
  companyId!: string;
}

@InputType()
export class UpdateAssetRevaluationDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  revaluationDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(RevaluationMethod)
  revaluationMethod?: RevaluationMethod;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  previousBookValue?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  newFairValue?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  valuationBasis?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  valuedBy?: string;

  @Field({ nullable: true })
  @IsOptional()
  valuationReport?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  assetAccountId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  revaluationSurplusAccountId?: string;

  @Field({ nullable: true })
  @IsOptional()
  documents?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(RevaluationStatus)
  status?: RevaluationStatus;
}

// Depreciation Method DTOs
@InputType()
export class CreateDepreciationMethodDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  methodCode!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  methodName!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  formula?: string;

  @Field({ nullable: true })
  @IsOptional()
  parameters?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  applicableAssetTypes?: any;

  @Field()
  @IsUUID()
  companyId!: string;
}

@InputType()
export class UpdateDepreciationMethodDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  methodName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  formula?: string;

  @Field({ nullable: true })
  @IsOptional()
  parameters?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  applicableAssetTypes?: any;
}

// Filter DTOs
@InputType()
export class DepreciationScheduleFilterDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(DepreciationMethod)
  depreciationMethod?: DepreciationMethod;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(DepreciationScheduleStatus)
  status?: DepreciationScheduleStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

@InputType()
export class DepreciationEntryFilterDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  scheduleId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPosted?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isReversed?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  depreciationDateFrom?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  depreciationDateTo?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sortBy?: string = 'depreciationDate';

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

@InputType()
export class AssetRevaluationFilterDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(RevaluationMethod)
  revaluationMethod?: RevaluationMethod;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(RevaluationStatus)
  status?: RevaluationStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPosted?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  revaluationDateFrom?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  revaluationDateTo?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sortBy?: string = 'revaluationDate';

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
