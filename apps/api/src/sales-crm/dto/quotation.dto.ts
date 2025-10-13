import {
  Field,
  Float,
  ID,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
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
export enum QuotationStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  EXPIRED = 'Expired',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled',
}

// Register enums for GraphQL
registerEnumType(QuotationStatus, {
  name: 'QuotationStatus',
  description: 'The status of a quotation',
});

// GraphQL Object Types
@ObjectType()
export class QuotationType {
  @Field(() => ID)
  id!: string;

  @Field()
  quotationCode!: string;

  @Field(() => ID)
  customerId!: string;

  @Field(() => ID, { nullable: true })
  opportunityId?: string;

  @Field(() => QuotationStatus)
  status!: QuotationStatus;

  @Field()
  validUntil!: Date;

  @Field()
  currency!: string;

  @Field(() => Float)
  exchangeRate!: number;

  @Field(() => Float)
  subtotal!: number;

  @Field(() => Float)
  totalTax!: number;

  @Field(() => Float)
  totalDiscount!: number;

  @Field(() => Float)
  grandTotal!: number;

  @Field({ nullable: true })
  terms?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  internalNotes?: string;

  @Field(() => ID, { nullable: true })
  assignedTo?: string;

  @Field(() => ID, { nullable: true })
  approvedBy?: string;

  @Field({ nullable: true })
  approvedAt?: Date;

  @Field({ nullable: true })
  sentAt?: Date;

  @Field({ nullable: true })
  acceptedAt?: Date;

  @Field({ nullable: true })
  rejectedAt?: Date;

  @Field({ nullable: true })
  rejectionReason?: string;

  @Field(() => [QuotationItemType])
  items!: QuotationItemType[];

  @Field()
  companyId!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class QuotationItemType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  quotationId!: string;

  @Field()
  itemCode!: string;

  @Field()
  itemName!: string;

  @Field({ nullable: true })
  description?: string;

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

  @Field({ nullable: true })
  notes?: string;

  @Field(() => Int)
  sortOrder!: number;
}

// Input Types for Mutations
@InputType()
export class CreateQuotationItemInput {
  @Field()
  @IsString()
  itemCode!: string;

  @Field()
  @IsString()
  itemName!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0.0001)
  quantity!: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxPercent?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

@InputType()
export class CreateQuotationInput {
  @Field(() => ID)
  @IsUUID()
  customerId!: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @Field()
  @IsDate()
  @Type(() => Date)
  validUntil!: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  exchangeRate?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  terms?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @Field(() => [CreateQuotationItemInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemInput)
  items!: CreateQuotationItemInput[];
}

@InputType()
export class UpdateQuotationInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @Field(() => QuotationStatus, { nullable: true })
  @IsOptional()
  @IsEnum(QuotationStatus)
  status?: QuotationStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  validUntil?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  exchangeRate?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  terms?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @Field(() => [CreateQuotationItemInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemInput)
  items?: CreateQuotationItemInput[];
}

@InputType()
export class QuotationFilterInput {
  @Field(() => [QuotationStatus], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(QuotationStatus, { each: true })
  status?: QuotationStatus[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  customerId?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  assignedTo?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  currency?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  validAfter?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  validBefore?: Date;

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
export class QuotationConnection {
  @Field(() => [QuotationType])
  quotations!: QuotationType[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  limit!: number;

  @Field(() => Int)
  totalPages!: number;
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
export class ConvertToSalesOrderInput {
  @Field(() => ID)
  @IsUUID()
  quotationId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  orderDate?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deliveryDate?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  internalNotes?: string;
}

@ObjectType()
export class QuotationAnalyticsType {
  @Field(() => Int)
  totalQuotations!: number;

  @Field(() => Int)
  draftQuotations!: number;

  @Field(() => Int)
  sentQuotations!: number;

  @Field(() => Int)
  acceptedQuotations!: number;

  @Field(() => Int)
  rejectedQuotations!: number;

  @Field(() => Int)
  expiredQuotations!: number;

  @Field(() => Float)
  totalValue!: number;

  @Field(() => Float)
  acceptedValue!: number;

  @Field(() => Float)
  conversionRate!: number;

  @Field(() => Float)
  averageQuotationValue!: number;

  @Field(() => [QuotationStatusAnalyticsType])
  quotationsByStatus!: QuotationStatusAnalyticsType[];
}

@ObjectType()
export class QuotationStatusAnalyticsType {
  @Field(() => QuotationStatus)
  status!: QuotationStatus;

  @Field(() => Int)
  count!: number;

  @Field(() => Float)
  totalValue!: number;
}

