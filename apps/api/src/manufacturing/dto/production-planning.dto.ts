import { Field, Float, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

// Enums
export enum ProductionPlanStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export enum MRPRunStatus {
  DRAFT = 'Draft',
  RUNNING = 'Running',
  COMPLETED = 'Completed',
  FAILED = 'Failed',
}

export enum CapacityPlanStatus {
  DRAFT = 'Draft',
  RUNNING = 'Running',
  COMPLETED = 'Completed',
  FAILED = 'Failed',
}

export enum ForecastType {
  MANUAL = 'Manual',
  AI_GENERATED = 'AI_Generated',
  HISTORICAL_AVERAGE = 'Historical_Average',
}

export enum ActionRequired {
  PURCHASE = 'Purchase',
  MANUFACTURE = 'Manufacture',
  TRANSFER = 'Transfer',
}

// Production Plan DTOs
@InputType()
export class CreateProductionPlanDto {
  @Field()
  @IsString()
  planName: string;

  @Field(() => ID)
  @IsUUID()
  companyId: string;

  @Field()
  @IsDateString()
  fromDate: string;

  @Field()
  @IsDateString()
  toDate: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ defaultValue: false })
  @IsOptional()
  @IsBoolean()
  getItemsFromOpenSalesOrders?: boolean;

  @Field({ defaultValue: false })
  @IsOptional()
  @IsBoolean()
  downloadMaterialsRequired?: boolean;

  @Field({ defaultValue: false })
  @IsOptional()
  @IsBoolean()
  ignoreExistingOrderedQty?: boolean;

  @Field({ defaultValue: false })
  @IsOptional()
  @IsBoolean()
  considerMinOrderQty?: boolean;

  @Field({ defaultValue: false })
  @IsOptional()
  @IsBoolean()
  includeNonStockItems?: boolean;

  @Field({ defaultValue: false })
  @IsOptional()
  @IsBoolean()
  includeSubcontractedItems?: boolean;

  @Field(() => [CreateProductionPlanItemDto], { nullable: true })
  @IsOptional()
  items?: CreateProductionPlanItemDto[];
}

@InputType()
export class CreateProductionPlanItemDto {
  @Field(() => ID)
  @IsUUID()
  itemId: string;

  @Field()
  @IsString()
  itemCode: string;

  @Field()
  @IsString()
  itemName: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  bomId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  bomNo?: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  plannedQty: number;

  @Field()
  @IsString()
  uom: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

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
  description?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  salesOrderId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  salesOrderItem?: string;
}

@InputType()
export class UpdateProductionPlanDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  planName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @Field(() => ProductionPlanStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ProductionPlanStatus)
  status?: ProductionPlanStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  getItemsFromOpenSalesOrders?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  downloadMaterialsRequired?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  ignoreExistingOrderedQty?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  considerMinOrderQty?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  includeNonStockItems?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  includeSubcontractedItems?: boolean;

  @Field(() => [CreateProductionPlanItemDto], { nullable: true })
  @IsOptional()
  items?: CreateProductionPlanItemDto[];
}

@InputType()
export class ProductionPlanFilterDto {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @Field(() => ProductionPlanStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ProductionPlanStatus)
  status?: ProductionPlanStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  planName?: string;

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

// MRP DTOs
@InputType()
export class CreateMRPRunDto {
  @Field()
  @IsString()
  runName: string;

  @Field(() => ID)
  @IsUUID()
  companyId: string;

  @Field()
  @IsDateString()
  fromDate: string;

  @Field()
  @IsDateString()
  toDate: string;

  @Field({ defaultValue: false })
  @IsOptional()
  @IsBoolean()
  includeNonStockItems?: boolean;

  @Field({ defaultValue: false })
  @IsOptional()
  @IsBoolean()
  includeSubcontractedItems?: boolean;

  @Field({ defaultValue: false })
  @IsOptional()
  @IsBoolean()
  ignoreExistingOrderedQty?: boolean;

  @Field({ defaultValue: false })
  @IsOptional()
  @IsBoolean()
  considerMinOrderQty?: boolean;

  @Field({ defaultValue: true })
  @IsOptional()
  @IsBoolean()
  considerSafetyStock?: boolean;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  itemGroupId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  buyerId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  projectId?: string;
}

@InputType()
export class MRPRunFilterDto {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @Field(() => MRPRunStatus, { nullable: true })
  @IsOptional()
  @IsEnum(MRPRunStatus)
  status?: MRPRunStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  runName?: string;

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
export class MRPResultFilterDto {
  @Field(() => ID)
  @IsUUID()
  mrpRunId: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  itemId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @Field(() => ActionRequired, { nullable: true })
  @IsOptional()
  @IsEnum(ActionRequired)
  actionRequired?: ActionRequired;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;
}

// Capacity Planning DTOs
@InputType()
export class CreateCapacityPlanDto {
  @Field()
  @IsString()
  planName: string;

  @Field(() => ID)
  @IsUUID()
  companyId: string;

  @Field()
  @IsDateString()
  fromDate: string;

  @Field()
  @IsDateString()
  toDate: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  workstationId?: string;

  @Field({ defaultValue: true })
  @IsOptional()
  @IsBoolean()
  includeWorkOrders?: boolean;

  @Field({ defaultValue: true })
  @IsOptional()
  @IsBoolean()
  includeProductionPlans?: boolean;

  @Field({ defaultValue: false })
  @IsOptional()
  @IsBoolean()
  includeMaintenanceSchedule?: boolean;

  @Field({ defaultValue: 'Hours' })
  @IsOptional()
  @IsString()
  capacityUom?: string;
}

@InputType()
export class CapacityPlanFilterDto {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @Field(() => CapacityPlanStatus, { nullable: true })
  @IsOptional()
  @IsEnum(CapacityPlanStatus)
  status?: CapacityPlanStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  planName?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  workstationId?: string;

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

// Production Forecast DTOs
@InputType()
export class CreateProductionForecastDto {
  @Field()
  @IsString()
  forecastName: string;

  @Field(() => ID)
  @IsUUID()
  companyId: string;

  @Field(() => ID)
  @IsUUID()
  itemId: string;

  @Field()
  @IsString()
  itemCode: string;

  @Field()
  @IsString()
  itemName: string;

  @Field()
  @IsDateString()
  forecastDate: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  forecastQuantity: number;

  @Field()
  @IsString()
  uom: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  salesOrderId?: string;

  @Field(() => ForecastType, { defaultValue: ForecastType.MANUAL })
  @IsOptional()
  @IsEnum(ForecastType)
  forecastType?: ForecastType;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  confidenceLevel?: number;

  @Field(() => Float, { defaultValue: 1 })
  @IsOptional()
  @IsNumber()
  seasonalFactor?: number;

  @Field(() => Float, { defaultValue: 1 })
  @IsOptional()
  @IsNumber()
  trendFactor?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

@InputType()
export class UpdateProductionForecastDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  forecastName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  forecastDate?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  forecastQuantity?: number;

  @Field(() => ForecastType, { nullable: true })
  @IsOptional()
  @IsEnum(ForecastType)
  forecastType?: ForecastType;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  confidenceLevel?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  seasonalFactor?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  trendFactor?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualQuantity?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@InputType()
export class ProductionForecastFilterDto {
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
  warehouseId?: string;

  @Field(() => ForecastType, { nullable: true })
  @IsOptional()
  @IsEnum(ForecastType)
  forecastType?: ForecastType;

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
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;
}

// Response DTOs
@ObjectType()
export class ProductionPlanSummary {
  @Field(() => Int)
  totalPlans: number;

  @Field(() => Int)
  draftPlans: number;

  @Field(() => Int)
  submittedPlans: number;

  @Field(() => Int)
  completedPlans: number;

  @Field(() => Int)
  totalItems: number;

  @Field(() => Float)
  totalPlannedQuantity: number;

  @Field(() => Float)
  totalProducedQuantity: number;

  @Field(() => Float)
  completionPercentage: number;
}

@ObjectType()
export class MRPSummary {
  @Field(() => Int)
  totalRuns: number;

  @Field(() => Int)
  completedRuns: number;

  @Field(() => Int)
  totalItems: number;

  @Field(() => Int)
  itemsRequiringPurchase: number;

  @Field(() => Int)
  itemsRequiringManufacture: number;

  @Field(() => Int)
  itemsRequiringTransfer: number;

  @Field(() => Float)
  totalRequiredValue: number;
}

@ObjectType()
export class CapacityUtilizationSummary {
  @Field(() => ID)
  workstationId: string;

  @Field()
  workstationName: string;

  @Field(() => Float)
  totalAvailableCapacity: number;

  @Field(() => Float)
  totalPlannedCapacity: number;

  @Field(() => Float)
  utilizationPercentage: number;

  @Field(() => Float)
  overloadHours: number;

  @Field(() => Float)
  underloadHours: number;

  @Field()
  capacityUom: string;
}

@ObjectType()
export class ForecastAccuracy {
  @Field(() => ID)
  itemId: string;

  @Field()
  itemCode: string;

  @Field()
  itemName: string;

  @Field(() => Int)
  totalForecasts: number;

  @Field(() => Float)
  averageAccuracy: number;

  @Field(() => Float)
  totalForecastedQuantity: number;

  @Field(() => Float)
  totalActualQuantity: number;

  @Field(() => Float)
  totalVariance: number;

  @Field(() => Float)
  averageVariancePercentage: number;
}

// Gantt Chart DTOs
@ObjectType()
export class GanttChartItem {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  startDate: string;

  @Field()
  endDate: string;

  @Field(() => Float)
  progress: number;

  @Field({ nullable: true })
  @IsOptional()
  parentId?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  dependencies?: string[];

  @Field()
  type: string; // 'production_plan', 'work_order', 'operation'

  @Field({ nullable: true })
  @IsOptional()
  workstationId?: string;

  @Field({ nullable: true })
  @IsOptional()
  workstationName?: string;
}

@InputType()
export class GenerateGanttChartDto {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  productionPlanId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  workstationId?: string;

  @Field()
  @IsDateString()
  fromDate: string;

  @Field()
  @IsDateString()
  toDate: string;

  @Field({ defaultValue: true })
  @IsOptional()
  @IsBoolean()
  includeProductionPlans?: boolean;

  @Field({ defaultValue: true })
  @IsOptional()
  @IsBoolean()
  includeWorkOrders?: boolean;

  @Field({ defaultValue: false })
  @IsOptional()
  @IsBoolean()
  includeOperations?: boolean;
}
