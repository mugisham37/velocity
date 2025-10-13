import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export enum WarehouseType {
  STOCK = 'Stock',
  TRANSIT = 'Transit',
  SAMPLE = 'Sample',
  QUARANTINE = 'Quarantine',
  RETURNS = 'Returns',
}

export enum LocationType {
  STORAGE = 'Storage',
  PICKING = 'Picking',
  PACKING = 'Packing',
  STAGING = 'Staging',
  QUARANTINE = 'Quarantine',
}

export enum AccessLevel {
  PUBLIC = 'Public',
  RESTRICTED = 'Restricted',
  SECURE = 'Secure',
}

export enum TransferStatus {
  DRAFT = 'Draft',
  IN_TRANSIT = 'In Transit',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled',
}

export enum ItemCondition {
  GOOD = 'Good',
  DAMAGED = 'Damaged',
  EXPIRED = 'Expired',
}

export class AddressDto {
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  country?: string;
}

export class OperatingHoursDto {
  @IsOptional()
  @IsString()
  open?: string;

  @IsOptional()
  @IsString()
  close?: string;
}

export class CreateWarehouseDto {
  @IsString()
  @Length(1, 50)
  warehouseCode!: string;

  @IsString()
  @Length(1, 255)
  warehouseName!: string;

  @IsOptional()
  @IsEnum(WarehouseType)
  warehouseType?: WarehouseType = WarehouseType.STOCK;

  @IsOptional()
  @IsUUID()
  parentWarehouseId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalCapacity?: number;

  @IsOptional()
  @IsString()
  capacityUom?: string;

  @IsOptional()
  @IsBoolean()
  allowNegativeStock?: boolean = false;

  @IsOptional()
  @IsBoolean()
  autoReorderEnabled?: boolean = false;

  @IsOptional()
  @IsBoolean()
  barcodeRequired?: boolean = false;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsObject()
  operatingHours?: Record<string, OperatingHoursDto>;

  @IsOptional()
  @IsBoolean()
  isGroup?: boolean = false;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  companyId!: string;
}

export class UpdateWarehouseDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  warehouseName?: string;

  @IsOptional()
  @IsEnum(WarehouseType)
  warehouseType?: WarehouseType;

  @IsOptional()
  @IsUUID()
  parentWarehouseId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalCapacity?: number;

  @IsOptional()
  @IsString()
  capacityUom?: string;

  @IsOptional()
  @IsBoolean()
  allowNegativeStock?: boolean;

  @IsOptional()
  @IsBoolean()
  autoReorderEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  barcodeRequired?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsObject()
  operatingHours?: Record<string, OperatingHoursDto>;

  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateWarehouseLocationDto {
  @IsUUID()
  warehouseId!: string;

  @IsString()
  @Length(1, 50)
  locationCode!: string;

  @IsString()
  @Length(1, 255)
  locationName!: string;

  @IsOptional()
  @IsUUID()
  parentLocationId?: string;

  @IsOptional()
  @IsString()
  aisle?: string;

  @IsOptional()
  @IsString()
  rack?: string;

  @IsOptional()
  @IsString()
  shelf?: string;

  @IsOptional()
  @IsString()
  bin?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  capacity?: number;

  @IsOptional()
  @IsString()
  capacityUom?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  length?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @IsOptional()
  @IsString()
  dimensionUom?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  barcodeType?: string;

  @IsOptional()
  @IsEnum(LocationType)
  locationType?: LocationType = LocationType.STORAGE;

  @IsOptional()
  @IsBoolean()
  temperatureControlled?: boolean = false;

  @IsOptional()
  @IsNumber()
  minTemperature?: number;

  @IsOptional()
  @IsNumber()
  maxTemperature?: number;

  @IsOptional()
  @IsString()
  temperatureUom?: string = 'C';

  @IsOptional()
  @IsBoolean()
  restrictedAccess?: boolean = false;

  @IsOptional()
  @IsEnum(AccessLevel)
  accessLevel?: AccessLevel;

  @IsOptional()
  @IsBoolean()
  isGroup?: boolean = false;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateWarehouseLocationDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  locationName?: string;

  @IsOptional()
  @IsUUID()
  parentLocationId?: string;

  @IsOptional()
  @IsString()
  aisle?: string;

  @IsOptional()
  @IsString()
  rack?: string;

  @IsOptional()
  @IsString()
  shelf?: string;

  @IsOptional()
  @IsString()
  bin?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  capacity?: number;

  @IsOptional()
  @IsString()
  capacityUom?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  length?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @IsOptional()
  @IsString()
  dimensionUom?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  barcodeType?: string;

  @IsOptional()
  @IsEnum(LocationType)
  locationType?: LocationType;

  @IsOptional()
  @IsBoolean()
  temperatureControlled?: boolean;

  @IsOptional()
  @IsNumber()
  minTemperature?: number;

  @IsOptional()
  @IsNumber()
  maxTemperature?: number;

  @IsOptional()
  @IsString()
  temperatureUom?: string;

  @IsOptional()
  @IsBoolean()
  restrictedAccess?: boolean;

  @IsOptional()
  @IsEnum(AccessLevel)
  accessLevel?: AccessLevel;

  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateWarehouseTransferDto {
  @IsString()
  @Length(1, 50)
  transferNumber!: string;

  @IsUUID()
  fromWarehouseId!: string;

  @IsUUID()
  toWarehouseId!: string;

  @IsOptional()
  @IsUUID()
  fromLocationId?: string;

  @IsOptional()
  @IsUUID()
  toLocationId?: string;

  @IsDateString()
  transferDate!: string;

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsEnum(TransferStatus)
  status?: TransferStatus = TransferStatus.DRAFT;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  carrier?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number = 0;

  @IsOptional()
  @IsString()
  currency?: string = 'USD';

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean = false;

  @IsUUID()
  companyId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWarehouseTransferItemDto)
  items!: CreateWarehouseTransferItemDto[];
}

export class CreateWarehouseTransferItemDto {
  @IsUUID()
  itemId!: string;

  @IsNumber()
  @Min(0.01)
  requestedQty!: number;

  @IsString()
  uom!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serialNumbers?: string[];

  @IsOptional()
  @IsArray()
  batchNumbers?: Array<{ batchNumber: string; quantity: number }>;

  @IsOptional()
  @IsEnum(ItemCondition)
  condition?: ItemCondition = ItemCondition.GOOD;

  @IsOptional()
  @IsString()
  qualityNotes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number = 0;
}

export class UpdateWarehouseTransferDto {
  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsDateString()
  actualDeliveryDate?: string;

  @IsOptional()
  @IsEnum(TransferStatus)
  status?: TransferStatus;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  carrier?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTransferItemDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  shippedQty?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  receivedQty?: number;

  @IsOptional()
  @IsEnum(ItemCondition)
  condition?: ItemCondition;

  @IsOptional()
  @IsString()
  qualityNotes?: string;
}

export class WarehouseFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(WarehouseType)
  warehouseType?: WarehouseType;

  @IsOptional()
  @IsUUID()
  parentWarehouseId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'warehouseName';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}

export class LocationFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsEnum(LocationType)
  locationType?: LocationType;

  @IsOptional()
  @IsUUID()
  parentLocationId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @IsOptional()
  @IsBoolean()
  temperatureControlled?: boolean;

  @IsOptional()
  @IsBoolean()
  restrictedAccess?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'locationName';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}

export class TransferFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  fromWarehouseId?: string;

  @IsOptional()
  @IsUUID()
  toWarehouseId?: string;

  @IsOptional()
  @IsEnum(TransferStatus)
  status?: TransferStatus;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'transferDate';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

