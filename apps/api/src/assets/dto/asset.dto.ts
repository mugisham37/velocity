import { Field, InputType } from '@nestjs/graphql';
import {
  IsDateString,
  IsDecimal,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min
} from 'class-validator';

// Enums
export enum AssetStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  UNDER_MAINTENANCE = 'Under Maintenance',
  DISPOSED = 'Disposed',
}

export enum AssetCondition {
  EXCELLENT = 'Excellent',
  GOOD = 'Good',
  FAIR = 'Fair',
  POOR = 'Poor',
}

export enum DepreciationMethod {
  STRAIGHT_LINE = 'Straight Line',
  DECLINING_BALANCE = 'Declining Balance',
  UNITS_OF_PRODUCTION = 'Units of Production',
  SUM_OF_YEARS_DIGITS = 'Sum of Years Digits',
}

export enum TransferStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  IN_TRANSIT = 'In Transit',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export enum DisposalMethod {
  SALE = 'Sale',
  SCRAP = 'Scrap',
  DONATION = 'Donation',
  TRADE_IN = 'Trade-in',
}

export enum DisposalStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  COMPLETED = 'Completed',
}

// Asset DTOs
@InputType()
export class CreateAssetDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  assetCode!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  assetName!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  assetCategoryId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  specifications?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  modelNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  supplier?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  purchaseAmount?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  currentValue?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  salvageValue?: string;

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
  @IsDateString()
  depreciationStartDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  currentLocationId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  custodianId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(AssetCondition)
  condition?: AssetCondition;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  barcode?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  rfidTag?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  qrCode?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  warrantyExpiryDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  insurancePolicyNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  insuranceExpiryDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  complianceCertifications?: any;

  @Field({ nullable: true })
  @IsOptional()
  documents?: any;

  @Field()
  @IsUUID()
  companyId!: string;
}

@InputType()
export class UpdateAssetDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  assetName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  assetCategoryId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  specifications?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  modelNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  supplier?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  purchaseAmount?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  currentValue?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  salvageValue?: string;

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
  @IsDateString()
  depreciationStartDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  currentLocationId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  custodianId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(AssetCondition)
  condition?: AssetCondition;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  barcode?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  rfidTag?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  qrCode?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  warrantyExpiryDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  insurancePolicyNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  insuranceExpiryDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  complianceCertifications?: any;

  @Field({ nullable: true })
  @IsOptional()
  documents?: any;
}

@InputType()
export class AssetFilterDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  custodianId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(AssetCondition)
  condition?: AssetCondition;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  purchaseDateFrom?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  purchaseDateTo?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  valueFrom?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  valueTo?: string;

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

// Asset Category DTOs
@InputType()
export class CreateAssetCategoryDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  categoryCode!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  categoryName!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  parentCategoryId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(DepreciationMethod)
  defaultDepreciationMethod?: DepreciationMethod;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  defaultUsefulLife?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  defaultSalvageValuePercent?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  assetAccountId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  depreciationAccountId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  accumulatedDepreciationAccountId?: string;

  @Field({ nullable: true })
  @IsOptional()
  customAttributes?: any;

  @Field()
  @IsUUID()
  companyId!: string;
}

@InputType()
export class UpdateAssetCategoryDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  categoryName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  parentCategoryId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(DepreciationMethod)
  defaultDepreciationMethod?: DepreciationMethod;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  defaultUsefulLife?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  defaultSalvageValuePercent?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  assetAccountId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  depreciationAccountId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  accumulatedDepreciationAccountId?: string;

  @Field({ nullable: true })
  @IsOptional()
  customAttributes?: any;
}

// Asset Location DTOs
@InputType()
export class CreateAssetLocationDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  locationCode!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  locationName!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  parentLocationId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  address?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  state?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  country?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  latitude?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  longitude?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  locationManagerId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;

  @Field()
  @IsUUID()
  companyId!: string;
}

@InputType()
export class UpdateAssetLocationDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  locationName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  parentLocationId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  address?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  state?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  country?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  latitude?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  longitude?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  locationManagerId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;
}

// Asset Transfer DTOs
@InputType()
export class CreateAssetTransferDto {
  @Field()
  @IsUUID()
  assetId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  fromLocationId?: string;

  @Field()
  @IsUUID()
  toLocationId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  fromCustodianId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  toCustodianId?: string;

  @Field()
  @IsDateString()
  transferDate!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  transferReason?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field()
  @IsUUID()
  companyId!: string;
}

@InputType()
export class UpdateAssetTransferDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  toLocationId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  toCustodianId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  transferDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  transferReason?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(TransferStatus)
  status?: TransferStatus;
}

// Asset Disposal DTOs
@InputType()
export class CreateAssetDisposalDto {
  @Field()
  @IsUUID()
  assetId!: string;

  @Field()
  @IsDateString()
  disposalDate!: string;

  @Field()
  @IsEnum(DisposalMethod)
  disposalMethod!: DisposalMethod;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  disposalReason?: string;

  @Field()
  @IsDecimal()
  bookValue!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  disposalAmount?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  buyerName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  buyerContact?: string;

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
export class UpdateAssetDisposalDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  disposalDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(DisposalMethod)
  disposalMethod?: DisposalMethod;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  disposalReason?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  bookValue?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  disposalAmount?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  buyerName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  buyerContact?: string;

  @Field({ nullable: true })
  @IsOptional()
  documents?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(DisposalStatus)
  status?: DisposalStatus;
}

