import { Field, ID, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

// Enums
export enum InvoiceStatusInput {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum PaymentMethodInput {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD',
  CHECK = 'CHECK',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT',
}

// Invoice DTOs
@InputType()
export class CreateInvoiceLineItemDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  itemCode?: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  description!: string;

  @Field()
  @IsNumber()
  @Min(0)
  quantity!: number;

  @Field()
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPercent?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxPercent?: number;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  accountId?: string;
}

@InputType()
export class CreateInvoiceDto {
  @Field(() => ID)
  @IsNotEmpty()
  @IsUUID()
  customerId!: string;

  @Field()
  @IsDateString()
  invoiceDate!: string;

  @Field()
  @IsDateString()
  dueDate!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field({ nullable: true })
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

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  salesOrderId?: string;

  @Field(() => [CreateInvoiceLineItemDto])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceLineItemDto)
  lineItems!: CreateInvoiceLineItemDto[];
}

@InputType()
export class UpdateInvoiceDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  terms?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field(() => InvoiceStatusInput, { nullable: true })
  @IsOptional()
  @IsEnum(InvoiceStatusInput)
  status?: InvoiceStatusInput;
}

// Payment DTOs
@InputType()
export class PaymentAllocationDto {
  @Field(() => ID)
  @IsNotEmpty()
  @IsUUID()
  invoiceId!: string;

  @Field()
  @IsNumber()
  @Min(0)
  amount!: number;
}

@InputType()
export class CreatePaymentDto {
  @Field(() => ID)
  @IsNotEmpty()
  @IsUUID()
  customerId!: string;

  @Field()
  @IsDateString()
  paymentDate!: string;

  @Field()
  @IsNumber()
  @Min(0)
  amount!: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  exchangeRate?: number;

  @Field(() => PaymentMethodInput)
  @IsEnum(PaymentMethodInput)
  paymentMethod!: PaymentMethodInput;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reference?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field(() => [PaymentAllocationDto], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentAllocationDto)
  allocations?: PaymentAllocationDto[];
}

// Credit Limit DTOs
@InputType()
export class CreateCreditLimitDto {
  @Field(() => ID)
  @IsNotEmpty()
  @IsUUID()
  customerId!: string;

  @Field()
  @IsNumber()
  @Min(0)
  creditLimit!: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field()
  @IsDateString()
  effectiveDate!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

@InputType()
export class UpdateCreditLimitDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

// Template DTOs
@InputType()
export class CreateInvoiceTemplateDto {
  @Field()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  template!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

@InputType()
export class UpdateInvoiceTemplateDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  template?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// Numbering Series DTOs
@InputType()
export class CreateNumberingSeriesDto {
  @Field()
  @IsNotEmpty()
  @IsString()
  seriesName!: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  prefix!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  currentNumber?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  padLength?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  suffix?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

@InputType()
export class UpdateNumberingSeriesDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  seriesName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  prefix?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  currentNumber?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  padLength?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  suffix?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// Filter DTOs
@InputType()
export class InvoiceFilterDto {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @Field(() => InvoiceStatusInput, { nullable: true })
  @IsOptional()
  @IsEnum(InvoiceStatusInput)
  status?: InvoiceStatusInput;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;
}

@InputType()
export class PaymentFilterDto {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @Field(() => PaymentMethodInput, { nullable: true })
  @IsOptional()
  @IsEnum(PaymentMethodInput)
  paymentMethod?: PaymentMethodInput;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;
}

// Report DTOs
@InputType()
export class AgingReportFilterDto {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  asOfDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;
}

@InputType()
export class CustomerStatementFilterDto {
  @Field(() => ID)
  @IsNotEmpty()
  @IsUUID()
  customerId!: string;

  @Field()
  @IsDateString()
  fromDate!: string;

  @Field()
  @IsDateString()
  toDate!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  emailStatement?: boolean;
}

@InputType()
export class CreditLimitCheckDto {
  @Field(() => ID)
  @IsNotEmpty()
  @IsUUID()
  customerId!: string;

  @Field()
  @IsNumber()
  @Min(0)
  proposedAmount!: number;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;
}

