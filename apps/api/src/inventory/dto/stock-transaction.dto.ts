import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsDecimal, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

// Enums
export enum StockEntryType {
  RECEIPT = 'Receipt',
  ISSUE = 'Issue',
  TRANSFER = 'Transfer',
  ADJUSTMENT = 'Adjustment',
  OPENING = 'Opening',
  CLOSING = 'Closing',
}

export enum StockEntryStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  CANCELLED = 'Cancelled',
}

export enum QualityStatus {
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  PENDING = 'Pending',
}

export enum ReservationType {
  SALES_ORDER = 'Sales Order',
  WORK_ORDER = 'Work Order',
  QUALITY_INSPECTION = 'Quality Inspection',
}

export enum ReservationStatus {
  ACTIVE = 'Active',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled',
  EXPIRED = 'Expired',
}

export enum ReconciliationType {
  FULL = 'Full',
  PARTIAL = 'Partial',
  CYCLE_COUNT = 'Cycle Count',
}

export enum ReconciliationStatus {
  DRAFT = 'Draft',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

// Register enums for GraphQL
registerEnumType(StockEntryType, { name: 'StockEntryType' });
registerEnumType(StockEntryStatus, { name: 'StockEntryStatus' });
registerEnumType(QualityStatus, { name: 'QualityStatus' });
registerEnumType(ReservationType, { name: 'ReservationType' });
registerEnumType(ReservationStatus, { name: 'ReservationStatus' });
registerEnumType(ReconciliationType, { name: 'ReconciliationType' });
registerEnumType(ReconciliationStatus, { name: 'ReconciliationStatus' });

// Stock Entry DTOs
@InputType()
export class CreateStockEntryItemDto {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  itemId!: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  locationId?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  fromLocationId?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  toLocationId?: string;

  @Field()
  @IsDecimal()
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  qty!: number;

  @Field()
  @IsString()
  @IsNotEmpty()
  uom!: string;

  @Field({ nullable: true })
  @IsDecimal()
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : 1)
  conversionFactor?: number;

  @Field({ nullable: true })
  @IsDecimal()
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : 0)
  valuationRate?: number;

  @Field({ nullable: true })
  @IsArray()
  @IsOptional()
  serialNumbers?: string[];

  @Field({ nullable: true })
  @IsOptional()
  batchNumbers?: any; // JSON object with batch numbers and quantities

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  qualityInspection?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  inspectionRequired?: boolean;

  @Field(() => QualityStatus, { nullable: true })
  @IsEnum(QualityStatus)
  @IsOptional()
  qualityStatus?: QualityStatus;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  remarks?: string;
}

@InputType()
export class CreateStockEntryDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  entryNumber!: string;

  @Field(() => StockEntryType)
  @IsEnum(StockEntryType)
  @IsNotEmpty()
  entryType!: StockEntryType;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  referenceType?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  referenceId?: string;

  @Field()
  @IsDateString()
  @IsNotEmpty()
  transactionDate!: string;

  @Field()
  @IsDateString()
  @IsNotEmpty()
  postingDate!: string;

  @Field()
  @IsUUID()
  @IsNotEmpty()
  warehouseId!: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  fromWarehouseId?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  toWarehouseId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  purpose?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  remarks?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  requiresApproval?: boolean;

  @Field(() => [CreateStockEntryItemDto])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStockEntryItemDto)
  items!: CreateStockEntryItemDto[];

  @Field()
  @IsUUID()
  @IsNotEmpty()
  companyId!: string;
}

@InputType()
export class UpdateStockEntryDto {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  entryNumber?: string;

  @Field(() => StockEntryType, { nullable: true })
  @IsEnum(StockEntryType)
  @IsOptional()
  entryType?: StockEntryType;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  referenceType?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  referenceId?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  transactionDate?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  postingDate?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  warehouseId?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  fromWarehouseId?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  toWarehouseId?: string;

  @Field(() => StockEntryStatus, { nullable: true })
  @IsEnum(StockEntryStatus)
  @IsOptional()
  status?: StockEntryStatus;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  purpose?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  remarks?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  requiresApproval?: boolean;
}

// Stock Reservation DTOs
@InputType()
export class CreateStockReservationDto {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  itemId!: string;

  @Field()
  @IsUUID()
  @IsNotEmpty()
  warehouseId!: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  locationId?: string;

  @Field(() => ReservationType)
  @IsEnum(ReservationType)
  @IsNotEmpty()
  reservationType!: ReservationType;

  @Field()
  @IsString()
  @IsNotEmpty()
  referenceType!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  referenceNumber!: string;

  @Field()
  @IsUUID()
  @IsNotEmpty()
  referenceId!: string;

  @Field()
  @IsDecimal()
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  reservedQty!: number;

  @Field()
  @IsString()
  @IsNotEmpty()
  uom!: string;

  @Field()
  @IsDateString()
  @IsNotEmpty()
  reservationDate!: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  expectedDeliveryDate?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @Field({ nullable: true })
  @IsArray()
  @IsOptional()
  serialNumbers?: string[];

  @Field({ nullable: true })
  @IsOptional()
  batchNumbers?: any;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  priority?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  remarks?: string;

  @Field()
  @IsUUID()
  @IsNotEmpty()
  companyId!: string;
}

@InputType()
export class UpdateStockReservationDto {
  @Field({ nullable: true })
  @IsDecimal()
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  reservedQty?: number;

  @Field({ nullable: true })
  @IsDecimal()
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  deliveredQty?: number;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  expectedDeliveryDate?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @Field(() => ReservationStatus, { nullable: true })
  @IsEnum(ReservationStatus)
  @IsOptional()
  status?: ReservationStatus;

  @Field({ nullable: true })
  @IsArray()
  @IsOptional()
  serialNumbers?: string[];

  @Field({ nullable: true })
  @IsOptional()
  batchNumbers?: any;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  priority?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  remarks?: string;
}

// Stock Reconciliation DTOs
@InputType()
export class CreateStockReconciliationItemDto {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  itemId!: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  locationId?: string;

  @Field()
  @IsDecimal()
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  systemQty!: number;

  @Field()
  @IsDecimal()
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  physicalQty!: number;

  @Field({ nullable: true })
  @IsDecimal()
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : 0)
  valuationRate?: number;

  @Field({ nullable: true })
  @IsArray()
  @IsOptional()
  serialNumbers?: string[];

  @Field({ nullable: true })
  @IsOptional()
  batchNumbers?: any;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  varianceReason?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  remarks?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  countedBy?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  countedAt?: string;
}

@InputType()
export class CreateStockReconciliationDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  reconciliationNumber!: string;

  @Field()
  @IsDateString()
  @IsNotEmpty()
  reconciliationDate!: string;

  @Field()
  @IsUUID()
  @IsNotEmpty()
  warehouseId!: string;

  @Field(() => ReconciliationType)
  @IsEnum(ReconciliationType)
  @IsNotEmpty()
  reconciliationType!: ReconciliationType;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  purpose?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  remarks?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  requiresApproval?: boolean;

  @Field(() => [CreateStockReconciliationItemDto])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStockReconciliationItemDto)
  items!: CreateStockReconciliationItemDto[];

  @Field()
  @IsUUID()
  @IsNotEmpty()
  companyId!: string;
}

@InputType()
export class UpdateStockReconciliationDto {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  reconciliationNumber?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  reconciliationDate?: string;

  @Field(() => ReconciliationStatus, { nullable: true })
  @IsEnum(ReconciliationStatus)
  @IsOptional()
  status?: ReconciliationStatus;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  purpose?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  remarks?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  requiresApproval?: boolean;
}

// Filter DTOs
@InputType()
export class StockEntryFilterDto {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  search?: string;

  @Field(() => StockEntryType, { nullable: true })
  @IsEnum(StockEntryType)
  @IsOptional()
  entryType?: StockEntryType;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  warehouseId?: string;

  @Field(() => StockEntryStatus, { nullable: true })
  @IsEnum(StockEntryStatus)
  @IsOptional()
  status?: StockEntryStatus;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  referenceType?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  page?: number;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

@InputType()
export class StockReservationFilterDto {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  search?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  itemId?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  warehouseId?: string;

  @Field(() => ReservationType, { nullable: true })
  @IsEnum(ReservationType)
  @IsOptional()
  reservationType?: ReservationType;

  @Field(() => ReservationStatus, { nullable: true })
  @IsEnum(ReservationStatus)
  @IsOptional()
  status?: ReservationStatus;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  referenceType?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  page?: number;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

@InputType()
export class StockReconciliationFilterDto {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  search?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  warehouseId?: string;

  @Field(() => ReconciliationStatus, { nullable: true })
  @IsEnum(ReconciliationStatus)
  @IsOptional()
  status?: ReconciliationStatus;

  @Field(() => ReconciliationType, { nullable: true })
  @IsEnum(ReconciliationType)
  @IsOptional()
  reconciliationType?: ReconciliationType;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  page?: number;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

// Stock Level Query DTOs
@InputType()
export class StockLevelQueryDto {
  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  itemId?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  warehouseId?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  locationId?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  asOfDate?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  includeReserved?: boolean;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  includeOrdered?: boolean;
}

@InputType()
export class StockLedgerQueryDto {
  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  itemId?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  warehouseId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  voucherType?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  voucherNumber?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  page?: number;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}
