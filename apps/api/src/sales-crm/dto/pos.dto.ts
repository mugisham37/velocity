import { Field, Float, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

// Enums
export enum PaymentMethodType {
  CASH = 'CASH',
  CARD = 'CARD',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT',
  GIFT_CARD = 'GIFT_CARD',
  STORE_CREDIT = 'STORE_CREDIT',
  CHECK = 'CHECK',
}

// Input Types
@InputType()
export class CreatePOSProfileDto {
  @Field()
  @IsString()
  name!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => ID)
  @IsUUID()
  warehouseId!: string;

  @Field(() => ID)
  @IsUUID()
  cashAccount!: string;

  @Field(() => ID)
  @IsUUID()
  incomeAccount!: string;

  @Field(() => ID)
  @IsUUID()
  expenseAccount!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  costCenter?: string;

  @Field({ defaultValue: 'USD' })
  @IsString()
  currency!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  priceList?: string;

  @Field({ defaultValue: true })
  @IsBoolean()
  allowDiscount!: boolean;

  @Field(() => Float, { defaultValue: 0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  maxDiscount!: number;

  @Field({ defaultValue: false })
  @IsBoolean()
  allowCreditSale!: boolean;

  @Field({ defaultValue: true })
  @IsBoolean()
  allowReturn!: boolean;

  @Field({ defaultValue: true })
  @IsBoolean()
  printReceipt!: boolean;

  @Field({ defaultValue: false })
  @IsBoolean()
  emailReceipt!: boolean;

  @Field({ defaultValue: false })
  @IsBoolean()
  offlineMode!: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  loyaltyProgram?: string;
}

@InputType()
export class UpdatePOSProfileDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  cashAccount?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  incomeAccount?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  expenseAccount?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  costCenter?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  priceList?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  allowDiscount?: boolean;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxDiscount?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  allowCreditSale?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  allowReturn?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  printReceipt?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  emailReceipt?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  offlineMode?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  loyaltyProgram?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@InputType()
export class PaymentMethodDto {
  @Field(() => PaymentMethodType)
  @IsEnum(PaymentMethodType)
  type!: PaymentMethodType;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  amount!: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reference?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  cardType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  cardLast4?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  transactionId?: string;
}

@InputType()
export class POSItemDto {
  @Field()
  @IsString()
  itemCode!: string;

  @Field()
  @IsString()
  itemName!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  barcode?: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0.0001)
  quantity!: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @Field(() => Float, { defaultValue: 0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent!: number;

  @Field(() => Float, { defaultValue: 0 })
  @IsNumber()
  @Min(0)
  discountAmount!: number;

  @Field(() => Float, { defaultValue: 0 })
  @IsNumber()
  @Min(0)
  taxPercent!: number;

  @Field(() => Float, { defaultValue: 0 })
  @IsNumber()
  @Min(0)
  taxAmount!: number;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serialNumbers?: string[];
}

@InputType()
export class CreatePOSSaleDto {
  @Field(() => ID)
  @IsUUID()
  posProfileId!: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  customerName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @Field(() => [POSItemDto])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => POSItemDto)
  items!: POSItemDto[];

  @Field(() => [PaymentMethodDto])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentMethodDto)
  paymentMethods!: PaymentMethodDto[];

  @Field(() => Int, { defaultValue: 0 })
  @IsNumber()
  @Min(0)
  loyaltyPointsRedeemed!: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ defaultValue: false })
  @IsBoolean()
  isOffline!: boolean;
}

@InputType()
export class OfflineTransactionDto {
  @Field()
  @IsString()
  localId!: string;

  @Field(() => CreatePOSSaleDto)
  @ValidateNested()
  @Type(() => CreatePOSSaleDto)
  saleData!: CreatePOSSaleDto;

  @Field()
  @IsString()
  timestamp!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  deviceId?: string;
}

@InputType()
export class BarcodeSearchDto {
  @Field()
  @IsString()
  barcode!: string;

  @Field(() => ID)
  @IsUUID()
  warehouseId!: string;
}

@InputType()
export class LoyaltyPointsDto {
  @Field(() => ID)
  @IsUUID()
  customerId!: string;

  @Field(() => Int)
  @IsNumber()
  @Min(1)
  points!: number;

  @Field()
  @IsString()
  reason!: string;
}

// Object Types
@ObjectType()
export class POSProfile {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => ID)
  warehouseId!: string;

  @Field(() => ID)
  cashAccount!: string;

  @Field(() => ID)
  incomeAccount!: string;

  @Field(() => ID)
  expenseAccount!: string;

  @Field({ nullable: true })
  costCenter?: string;

  @Field()
  currency!: string;

  @Field({ nullable: true })
  priceList?: string;

  @Field()
  allowDiscount!: boolean;

  @Field(() => Float)
  maxDiscount!: number;

  @Field()
  allowCreditSale!: boolean;

  @Field()
  allowReturn!: boolean;

  @Field()
  printReceipt!: boolean;

  @Field()
  emailReceipt!: boolean;

  @Field()
  offlineMode!: boolean;

  @Field({ nullable: true })
  loyaltyProgram?: string;

  @Field()
  isActive!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class POSInvoiceItem {
  @Field(() => ID)
  id!: string;

  @Field()
  itemCode!: string;

  @Field()
  itemName!: string;

  @Field({ nullable: true })
  barcode?: string;

  @Field(() => Float)
  quantity!: number;

  @Field(() => Float)
  unitPrice!: number;

  @Field(() => Float)
  discountPercent!: number;

  @Field(() => Float)
  discountAmount!: number;

  @Field(() => Float)
  taxPercent!: number;

  @Field(() => Float)
  taxAmount!: number;

  @Field(() => Float)
  lineTotal!: number;

  @Field(() => [String], { nullable: true })
  serialNumbers?: string[];
}

@ObjectType()
export class POSInvoice {
  @Field(() => ID)
  id!: string;

  @Field()
  invoiceCode!: string;

  @Field(() => ID)
  posProfileId!: string;

  @Field(() => POSProfile)
  posProfile!: POSProfile;

  @Field(() => ID, { nullable: true })
  customerId?: string;

  @Field({ nullable: true })
  customerName?: string;

  @Field({ nullable: true })
  customerPhone?: string;

  @Field({ nullable: true })
  customerEmail?: string;

  @Field()
  invoiceDate!: Date;

  @Field()
  currency!: string;

  @Field(() => Float)
  subtotal!: number;

  @Field(() => Float)
  totalTax!: number;

  @Field(() => Float)
  totalDiscount!: number;

  @Field(() => Float)
  grandTotal!: number;

  @Field(() => Float)
  paidAmount!: number;

  @Field(() => Float)
  changeAmount!: number;

  @Field(() => [PaymentMethodDto])
  paymentMethods!: PaymentMethodDto[];

  @Field(() => Int)
  loyaltyPointsEarned!: number;

  @Field(() => Int)
  loyaltyPointsRedeemed!: number;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  isSynced!: boolean;

  @Field({ nullable: true })
  syncedAt?: Date;

  @Field(() => [POSInvoiceItem])
  items!: POSInvoiceItem[];

  @Field()
  createdAt!: Date;
}

@ObjectType()
export class ItemLookupResult {
  @Field(() => ID)
  id!: string;

  @Field()
  itemCode!: string;

  @Field()
  itemName!: string;

  @Field({ nullable: true })
  barcode?: string;

  @Field(() => Float)
  price!: number;

  @Field(() => Float)
  availableQuantity!: number;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field(() => Float, { nullable: true })
  taxRate?: number;

  @Field()
  isActive!: boolean;
}

@ObjectType()
export class SyncResult {
  @Field(() => Int)
  totalTransactions!: number;

  @Field(() => Int)
  successfulSyncs!: number;

  @Field(() => Int)
  failedSyncs!: number;

  @Field(() => [String])
  errors!: string[];

  @Field()
  syncedAt!: Date;
}

@ObjectType()
export class LoyaltyPointsBalance {
  @Field(() => ID)
  customerId!: string;

  @Field(() => Int)
  totalPoints!: number;

  @Field(() => Int)
  availablePoints!: number;

  @Field(() => Int)
  redeemedPoints!: number;

  @Field(() => Float)
  pointValue!: number; // Monetary value per point

  @Field()
  lastUpdated!: Date;
}

@ObjectType()
export class ReceiptData {
  @Field(() => POSInvoice)
  invoice!: POSInvoice;

  @Field()
  receiptTemplate!: string;

  @Field()
  qrCode!: string;

  @Field({ nullable: true })
  loyaltyMessage?: string;
}
