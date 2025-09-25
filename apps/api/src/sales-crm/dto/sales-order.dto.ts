import { Field, Float, ID, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

// Enums
export enum SalesOrderStatus {
  Draft',
  PENDING_APPROVAL = 'Pending Approval',
  APPROVED = 'Approved',
  CONFIRMED = 'Confirmed',
  PARTIALLY_DELIVERED = 'Partially Delivered',
  DELIVERED = 'Delivered',
  PARTIALLY_INVOICED = 'Partially Invoiced',
  INVOICED = 'Invoiced',
  CANCELLED = 'Cancelled',
  ON_HOLD = 'On Hold',
}

// Register enums for GraphQL
registerEnumType(SalesOrderStatus, {
  name: 'SalesOrderStatus',
  description: 'The status of a sales order',
});

// GraphQL Object Types
@ObjectType()
export class SalesOrderType {
  @Field(() => ID)
  id: string;

  @Field()
  salesOrderCode: string;

  @Field(() => ID)
  customerId: string;

  @Field(() => ID, { nullable: true })
  quotationId?: string;

  @Field(() => ID, { nullable: true })
  opportunityId?: string;

  @Field(() => SalesOrderStatus)
  status: SalesOrderStatus;

  @Field()
  orderDate: Date;

  @Field({ nullable: true })
  deliveryDate?: Date;

  @Field()
  currency: string;

  @Field(() => Float)
  exchangeRate: number;

  @Field(() => Float)
  subtotal: number;

  @Field(() => Float)
  totalTax: number;

  @Field(() => Float)
  totalDiscount: number;

  @Field(() => Float)
  shippingCharges: number;

  @Field(() => Float)
  grandTotal: number;

  @Field(() => Float)
  advanceAmount: number;

  @Field(() => Float, { nullable: true })
  balanceAmount?: number;

  @Field({ nullable: true })
  billingAddress?: any;

  @Field({ nullable: true })
  shippingAddress?: any;

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
  confirmedAt?: Date;

  @Field(() => [SalesOrderItemType])
  items: SalesOrderItemType[];

  @Field()
  companyId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class SalesOrderItemType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  salesOrderId: string;

  @Field()
  itemCode: string;

  @Field()
  itemName: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float)
  quantity: number;

  @Field(() => Float)
  deliveredQuantity: number;

  @Field(() => Float)
  invoicedQuantity: number;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  discountPercent: number;

  @Field(() => Float)
  discountAmount: number;

  @Field(() => Float)
  taxPercent: number;

  @Field(() => Float)
  taxAmount: number;

  @Field(() => Float)
  lineTotal: number;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => Int)
  sortOrder: number;
}

// Input Types for Mutations
@InputType()
export class CreateSalesOrderItemInput {
  @Field()
  @IsString()
  itemCode: string;

  @Field()
  @IsString()
  itemName: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  unitPrice: number;

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
export class AddressInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  addressLine2?: string;

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
  postalCode?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  country?: string;
}

@InputType()
export class CreateSalesOrderInput {
  @Field(() => ID)
  @IsUUID()
  customerId: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  quotationId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @Field()
  @IsDate()
  @Type(() => Date)
  orderDate: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deliveryDate?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  exchangeRate?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCharges?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  advanceAmount?: number;

  @Field(() => AddressInput, { nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressInput)
  billingAddress?: AddressInput;

  @Field(() => AddressInput, { nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressInput)
  shippingAddress?: AddressInput;

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

  @Field(() => [CreateSalesOrderItemInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderItemInput)
  items: CreateSalesOrderItemInput[];
}

@InputType()
export class UpdateSalesOrderInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @Field(() => SalesOrderStatus, { nullable: true })
  @IsOptional()
  @IsEnum(SalesOrderStatus)
  status?: SalesOrderStatus;

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
  currency?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  exchangeRate?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCharges?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  advanceAmount?: number;

  @Field(() => AddressInput, { nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressInput)
  billingAddress?: AddressInput;

  @Field(() => AddressInput, { nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressInput)
  shippingAddress?: AddressInput;

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

  @Field(() => [CreateSalesOrderItemInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderItemInput)
  items?: CreateSalesOrderItemInput[];
}

@InputType()
export class SalesOrderFilterInput {
  @Field(() => [SalesOrderStatus], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(SalesOrderStatus, { each: true })
  status?: SalesOrderStatus[];

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
  orderDateAfter?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  orderDateBefore?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deliveryDateAfter?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deliveryDateBefore?: Date;

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
export class SalesOrderConnection {
  @Field(() => [SalesOrderType])
  salesOrders: SalesOrderType[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}

@InputType()
export class UpdateOrderItemQuantityInput {
  @Field(() => ID)
  @IsUUID()
  itemId: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  deliveredQuantity: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  invoicedQuantity: number;
}

@InputType()
export class OrderAmendmentInput {
  @Field(() => ID)
  @IsUUID()
  salesOrderId: string;

  @Field()
  @IsString()
  amendmentReason: string;

  @Field(() => [CreateSalesOrderItemInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderItemInput)
  newItems?: CreateSalesOrderItemInput[];

  @Field(() => [UpdateOrderItemQuantityInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemQuantityInput)
  updatedItems?: UpdateOrderItemQuantityInput[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  removedItemIds?: string[];
}

@ObjectType()
export class SalesOrderAnalyticsType {
  @Field(() => Int)
  totalOrders: number;

  @Field(() => Int)
  draftOrders: number;

  @Field(() => Int)
  confirmedOrders: number;

  @Field(() => Int)
  deliveredOrders: number;

  @Field(() => Int)
  invoicedOrders: number;

  @Field(() => Int)
  cancelledOrders: number;

  @Field(() => Float)
  totalValue: number;

  @Field(() => Float)
  deliveredValue: number;

  @Field(() => Float)
  invoicedValue: number;

  @Field(() => Float)
  averageOrderValue: number;

  @Field(() => Float)
  fulfillmentRate: number;

  @Field(() => [SalesOrderStatusAnalyticsType])
  ordersByStatus: SalesOrderStatusAnalyticsType[];
}

@ObjectType()
export class SalesOrderStatusAnalyticsType {
  @Field(() => SalesOrderStatus)
  status: SalesOrderStatus;

  @Field(() => Int)
  count: number;

  @Field(() => Float)
  totalValue: number;
}

@ObjectType()
export class OrderFulfillmentType {
  @Field(() => ID)
  salesOrderId: string;

  @Field()
  salesOrderCode: string;

  @Field(() => Float)
  totalQuantity: number;

  @Field(() => Float)
  deliveredQuantity: number;

  @Field(() => Float)
  pendingQuantity: number;

  @Field(() => Float)
  fulfillmentPercentage: number;

  @Field(() => [OrderItemFulfillmentType])
  items: OrderItemFulfillmentType[];
}

@ObjectType()
export class OrderItemFulfillmentType {
  @Field(() => ID)
  itemId: string;

  @Field()
  itemCode: string;

  @Field()
  itemName: string;

  @Field(() => Float)
  orderedQuantity: number;

  @Field(() => Float)
  deliveredQuantity: number;

  @Field(() => Float)
  pendingQuantity: number;

  @Field(() => Float)
  fulfillmentPercentage: number;
}
