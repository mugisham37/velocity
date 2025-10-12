import { Field, Float, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

// Enums
export enum WorkOrderStatus {
  DRAFT = 'Draft',
  RELEASED = 'Released',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  ON_HOLD = 'On Hold',
}

export enum WorkOrderPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent',
}

export enum OperationStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export enum StockEntryType {
  MATERIAL_TRANSFER = 'Material Transfer',
  MATERIAL_CONSUMPTION = 'Material Consumption',
  MANUFACTURE = 'Manufacture',
}

// Work Order DTOs
@InputType()
export class CreateWorkOrderDto {
  @Field()
  @IsString()
  workOrderNo!: string;

  @Field(() => ID)
  @IsUUID()
  companyId!: string;

  @Field(() => ID)
  @IsUUID()
  itemId!: string;

  @Field()
  @IsString()
  itemCode!: string;

  @Field()
  @IsString()
  itemName!: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  bomId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  bomNo?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  productionPlanId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  salesOrderId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  salesOrderItem?: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  qtyToManufacture!: number;

  @Field()
  @IsString()
  uom!: string;

  @Field(() => ID)
  @IsUUID()
  warehouseId!: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  sourceWarehouseId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  wipWarehouseId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  fgWarehouseId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  scrapWarehouseId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  plannedStartDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  plannedEndDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @Field(() => WorkOrderPriority, { defaultValue: WorkOrderPriority.MEDIUM })
  @IsOptional()
  @IsEnum(WorkOrderPriority)
  priority?: WorkOrderPriority;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @Field({ defaultValue: 'Work Order' })
  @IsOptional()
  @IsString()
  transferMaterialAgainst?: string;

  @Field({ defaultValue: true })
  @IsOptional()
  @IsBoolean()
  useMultiLevelBom?: boolean;

  @Field({ defaultValue: false })
  @IsOptional()
  @IsBoolean()
  skipTransfer?: boolean;

  @Field({ defaultValue: false })
  @IsOptional()
  @IsBoolean()
  allowAlternativeItem?: boolean;

  @Field({ defaultValue: false })
  @IsOptional()
  @IsBoolean()
  scrapWarehouseRequired?: boolean;

  @Field(() => Float, { defaultValue: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  batchSize?: number;

  @Field(() => [CreateWorkOrderOperationDto], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkOrderOperationDto)
  operations?: CreateWorkOrderOperationDto[];

  @Field(() => [CreateWorkOrderItemDto], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkOrderItemDto)
  items?: CreateWorkOrderItemDto[];
}

@InputType()
export class CreateWorkOrderOperationDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  operationId?: string;

  @Field()
  @IsString()
  operationNo!: string;

  @Field()
  @IsString()
  operationName!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  workstationId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  workstationType?: string;

  @Field(() => Float, { defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  plannedOperatingCost?: number;

  @Field(() => Float, { defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  timeInMins?: number;

  @Field(() => Float, { defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourRate?: number;

  @Field(() => Int, { defaultValue: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  batchSize?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  plannedStartTime?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  plannedEndTime?: string;

  @Field(() => Int, { defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sequenceId?: number;
}

@InputType()
export class CreateWorkOrderItemDto {
  @Field(() => ID)
  @IsUUID()
  itemId!: string;

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

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  sourceWarehouseId?: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  requiredQty!: number;

  @Field()
  @IsString()
  uom!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  stockUom?: string;

  @Field(() => Float, { defaultValue: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  conversionFactor?: number;

  @Field(() => Float, { defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  bomItemId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  operationId?: string;

  @Field({ defaultValue: false })
  @IsOptional()
  @IsBoolean()
  allowAlternativeItem?: boolean;

  @Field({ defaultValue: true })
  @IsOptional()
  @IsBoolean()
  includeItemInManufacturing?: boolean;
}

@InputType()
export class UpdateWorkOrderDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  workOrderNo?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  plannedStartDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  plannedEndDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @Field(() => WorkOrderStatus, { nullable: true })
  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;

  @Field(() => WorkOrderPriority, { nullable: true })
  @IsOptional()
  @IsEnum(WorkOrderPriority)
  priority?: WorkOrderPriority;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  useMultiLevelBom?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  skipTransfer?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  allowAlternativeItem?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  scrapWarehouseRequired?: boolean;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  batchSize?: number;

  @Field(() => [CreateWorkOrderOperationDto], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkOrderOperationDto)
  operations?: CreateWorkOrderOperationDto[];

  @Field(() => [CreateWorkOrderItemDto], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkOrderItemDto)
  items?: CreateWorkOrderItemDto[];
}

@InputType()
export class WorkOrderFilterDto {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  itemId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  bomId?: string;

  @Field(() => WorkOrderStatus, { nullable: true })
  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;

  @Field(() => WorkOrderPriority, { nullable: true })
  @IsOptional()
  @IsEnum(WorkOrderPriority)
  priority?: WorkOrderPriority;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  workOrderNo?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  plannedStartDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  plannedEndDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;
}

// Time Log DTOs
@InputType()
export class CreateTimeLogDto {
  @Field(() => ID)
  @IsUUID()
  workOrderId!: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  operationId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  employeeName?: string;

  @Field()
  @IsDateString()
  fromTime!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  toTime?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  timeInMins?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  completedQty?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  operationName?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  workstationId?: string;

  @Field({ defaultValue: false })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}

@InputType()
export class UpdateTimeLogDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  toTime?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  timeInMins?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  completedQty?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}

// Stock Entry DTOs
@InputType()
export class CreateWorkOrderStockEntryDto {
  @Field(() => ID)
  @IsUUID()
  workOrderId!: string;

  @Field(() => StockEntryType)
  @IsEnum(StockEntryType)
  stockEntryType!: StockEntryType;

  @Field()
  @IsString()
  purpose!: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  fromWarehouseId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  toWarehouseId?: string;

  @Field()
  @IsDateString()
  postingDate!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  postingTime?: string;

  @Field(() => [StockEntryItemDto])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockEntryItemDto)
  items!: StockEntryItemDto[];
}

@InputType()
export class StockEntryItemDto {
  @Field(() => ID)
  @IsUUID()
  itemId!: string;

  @Field()
  @IsString()
  itemCode!: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  qty!: number;

  @Field()
  @IsString()
  uom!: string;

  @Field(() => Float, { defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;
}

// Response DTOs
@ObjectType()
export class WorkOrderSummary {
  @Field(() => Int)
  totalWorkOrders!: number;

  @Field(() => Int)
  draftWorkOrders!: number;

  @Field(() => Int)
  releasedWorkOrders!: number;

  @Field(() => Int)
  inProgressWorkOrders!: number;

  @Field(() => Int)
  completedWorkOrders!: number;

  @Field(() => Int)
  cancelledWorkOrders!: number;

  @Field(() => Float)
  totalPlannedQuantity!: number;

  @Field(() => Float)
  totalManufacturedQuantity!: number;

  @Field(() => Float)
  completionPercentage!: number;

  @Field(() => Float)
  totalOperatingCost!: number;

  @Field(() => Float)
  totalRawMaterialCost!: number;
}

@ObjectType()
export class OperationEfficiency {
  @Field(() => ID)
  operationId!: string;

  @Field()
  operationName!: string;

  @Field(() => ID)
  workstationId!: string;

  @Field()
  workstationName!: string;

  @Field(() => Float)
  plannedTimeInMins!: number;

  @Field(() => Float)
  actualTimeInMins!: number;

  @Field(() => Float)
  efficiency!: number;

  @Field(() => Float)
  plannedCost!: number;

  @Field(() => Float)
  actualCost!: number;

  @Field(() => Float)
  costVariance!: number;
}

@ObjectType()
export class WorkOrderProgress {
  @Field(() => ID)
  workOrderId!: string;

  @Field()
  workOrderNo!: string;

  @Field()
  itemCode!: string;

  @Field()
  itemName!: string;

  @Field(() => Float)
  qtyToManufacture!: number;

  @Field(() => Float)
  manufacturedQty!: number;

  @Field(() => Float)
  progressPercentage!: number;

  @Field(() => WorkOrderStatus)
  status!: WorkOrderStatus;

  @Field({ nullable: true })
  plannedStartDate?: string;

  @Field({ nullable: true })
  plannedEndDate?: string;

  @Field({ nullable: true })
  actualStartDate?: string;

  @Field({ nullable: true })
  actualEndDate?: string;

  @Field(() => Int)
  totalOperations!: number;

  @Field(() => Int)
  completedOperations!: number;
}

// Production Entry DTOs
@InputType()
export class CreateProductionEntryDto {
  @Field(() => ID)
  @IsUUID()
  workOrderId!: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  manufacturedQty!: number;

  @Field()
  @IsDateString()
  postingDate!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  postingTime?: string;

  @Field(() => [ProductionEntryItemDto], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductionEntryItemDto)
  consumedItems?: ProductionEntryItemDto[];

  @Field(() => [ProductionEntryItemDto], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductionEntryItemDto)
  scrapItems?: ProductionEntryItemDto[];
}

@InputType()
export class ProductionEntryItemDto {
  @Field(() => ID)
  @IsUUID()
  itemId!: string;

  @Field()
  @IsString()
  itemCode!: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  qty!: number;

  @Field()
  @IsString()
  uom!: string;

  @Field(() => Float, { defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;
}
