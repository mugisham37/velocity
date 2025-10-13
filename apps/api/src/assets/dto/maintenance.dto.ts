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
export enum MaintenanceType {
  PREVENTIVE = 'Preventive',
  PREDICTIVE = 'Predictive',
  CONDITION_BASED = 'Condition-based',
  CORRECTIVE = 'Corrective',
}

export enum ScheduleType {
  TIME_BASED = 'Time-based',
  USAGE_BASED = 'Usage-based',
  CONDITION_BASED = 'Condition-based',
}

export enum MaintenanceScheduleStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  SUSPENDED = 'Suspended',
}

export enum WorkOrderType {
  PREVENTIVE = 'Preventive',
  CORRECTIVE = 'Corrective',
  EMERGENCY = 'Emergency',
  INSPECTION = 'Inspection',
}

export enum WorkOrderStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  ON_HOLD = 'On Hold',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export enum CostType {
  LABOR = 'Labor',
  MATERIAL = 'Material',
  EXTERNAL_SERVICE = 'External Service',
  EQUIPMENT = 'Equipment',
}

export enum CostStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  INVOICED = 'Invoiced',
  PAID = 'Paid',
}

export enum SparePartStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  DISCONTINUED = 'Discontinued',
}

// Maintenance Schedule DTOs
@InputType()
export class CreateMaintenanceScheduleDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  scheduleCode!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  scheduleName!: string;

  @Field()
  @IsUUID()
  assetId!: string;

  @Field()
  @IsEnum(MaintenanceType)
  maintenanceType!: MaintenanceType;

  @Field()
  @IsEnum(ScheduleType)
  scheduleType!: ScheduleType;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  frequency?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  frequencyUnit?: string; // Days, Weeks, Months, Years

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  usageThreshold?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  usageUnit?: string; // Hours, Cycles, Miles, etc.

  @Field()
  @IsDateString()
  startDate!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  instructions?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDuration?: number; // in minutes

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @Field({ nullable: true })
  @IsOptional()
  requiredSkills?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  estimatedCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  notificationLeadTime?: number; // days before due date

  @Field({ nullable: true })
  @IsOptional()
  notifyUsers?: any; // Array of user IDs

  @Field()
  @IsUUID()
  companyId!: string;
}

@InputType()
export class UpdateMaintenanceScheduleDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  scheduleName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(MaintenanceType)
  maintenanceType?: MaintenanceType;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(ScheduleType)
  scheduleType?: ScheduleType;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  frequency?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  frequencyUnit?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  usageThreshold?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  usageUnit?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  lastMaintenanceDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  instructions?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDuration?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @Field({ nullable: true })
  @IsOptional()
  requiredSkills?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  estimatedCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(MaintenanceScheduleStatus)
  status?: MaintenanceScheduleStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  notificationLeadTime?: number;

  @Field({ nullable: true })
  @IsOptional()
  notifyUsers?: any;
}

// Maintenance Work Order DTOs
@InputType()
export class CreateMaintenanceWorkOrderDto {
  @Field()
  @IsUUID()
  assetId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  scheduleId?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field()
  @IsEnum(WorkOrderType)
  workOrderType!: WorkOrderType;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  scheduledStartDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  scheduledEndDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDuration?: number; // in minutes

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @Field({ nullable: true })
  @IsOptional()
  assignedTeam?: any; // Array of user IDs

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  estimatedCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  failureDescription?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  failureCause?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  failureType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  safetyPrecautions?: string;

  @Field({ nullable: true })
  @IsOptional()
  qualityChecks?: any;

  @Field({ nullable: true })
  @IsOptional()
  attachments?: any;

  @Field()
  @IsUUID()
  companyId!: string;
}

@InputType()
export class UpdateMaintenanceWorkOrderDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(WorkOrderType)
  workOrderType?: WorkOrderType;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  scheduledStartDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  scheduledEndDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  actualStartDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  actualEndDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDuration?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  actualDuration?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @Field({ nullable: true })
  @IsOptional()
  assignedTeam?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  completionPercentage?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  estimatedCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  actualCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  laborCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  materialCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  externalServiceCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  failureDescription?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  failureCause?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  failureType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  workPerformed?: string;

  @Field({ nullable: true })
  @IsOptional()
  partsUsed?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  completionNotes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  safetyPrecautions?: string;

  @Field({ nullable: true })
  @IsOptional()
  qualityChecks?: any;

  @Field({ nullable: true })
  @IsOptional()
  attachments?: any;
}

@InputType()
export class CompleteMaintenanceWorkOrderDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  workPerformed!: string;

  @Field({ nullable: true })
  @IsOptional()
  partsUsed?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  completionNotes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  actualCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  laborCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  materialCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  externalServiceCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  actualDuration?: number;

  @Field({ nullable: true })
  @IsOptional()
  qualityChecks?: any;

  @Field()
  @IsUUID()
  companyId!: string;
}

// Maintenance History DTOs
@InputType()
export class CreateMaintenanceHistoryDto {
  @Field()
  @IsUUID()
  assetId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  workOrderId?: string;

  @Field()
  @IsDateString()
  maintenanceDate!: string;

  @Field()
  @IsEnum(MaintenanceType)
  maintenanceType!: MaintenanceType;

  @Field()
  @IsString()
  @IsNotEmpty()
  description!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  downtime?: number; // in minutes

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  mtbf?: number; // Mean Time Between Failures in hours

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  mttr?: number; // Mean Time To Repair in minutes

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  totalCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  laborHours?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  laborCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  materialCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  performedBy?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  technicianNotes?: string;

  @Field({ nullable: true })
  @IsOptional()
  partsUsed?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  effectivenessRating?: number; // 1-5 scale

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  customerSatisfaction?: number; // 1-5 scale

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  followUpRequired?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  followUpNotes?: string;

  @Field()
  @IsUUID()
  companyId!: string;
}

@InputType()
export class UpdateMaintenanceHistoryDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  maintenanceDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(MaintenanceType)
  maintenanceType?: MaintenanceType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  downtime?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  mtbf?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  mttr?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  totalCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  laborHours?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  laborCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  materialCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  performedBy?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  technicianNotes?: string;

  @Field({ nullable: true })
  @IsOptional()
  partsUsed?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  effectivenessRating?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  customerSatisfaction?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  followUpRequired?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  followUpNotes?: string;
}

// Spare Parts DTOs
@InputType()
export class CreateSparePartDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  partCode!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  partName!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  itemId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  manufacturerPartNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  supplierPartNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  currentStock?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  minimumStock?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  maximumStock?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  reorderPoint?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  unitCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  lastPurchasePrice?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  averageCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  specifications?: any;

  @Field({ nullable: true })
  @IsOptional()
  compatibleAssets?: any; // Array of asset IDs

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  storageLocation?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  shelfLife?: number; // in days

  @Field()
  @IsUUID()
  companyId!: string;
}

@InputType()
export class UpdateSparePartDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  partName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  itemId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  manufacturerPartNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  supplierPartNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  currentStock?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  minimumStock?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  maximumStock?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  reorderPoint?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  unitCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  lastPurchasePrice?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  averageCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  specifications?: any;

  @Field({ nullable: true })
  @IsOptional()
  compatibleAssets?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  storageLocation?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  shelfLife?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(SparePartStatus)
  status?: SparePartStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// Maintenance Cost DTOs
@InputType()
export class CreateMaintenanceCostDto {
  @Field()
  @IsUUID()
  workOrderId!: string;

  @Field()
  @IsEnum(CostType)
  costType!: CostType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  quantity?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  unitCost?: string;

  @Field()
  @IsDecimal()
  totalCost!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  laborHours?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  hourlyRate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  technicianId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  sparePartId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantityUsed?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  vendorName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  serviceDescription?: string;

  @Field()
  @IsDateString()
  costDate!: string;

  @Field()
  @IsUUID()
  companyId!: string;
}

@InputType()
export class UpdateMaintenanceCostDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(CostType)
  costType?: CostType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  quantity?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  unitCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  totalCost?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  laborHours?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  hourlyRate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  technicianId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  sparePartId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantityUsed?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  vendorName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  serviceDescription?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  costDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(CostStatus)
  status?: CostStatus;
}

// Filter DTOs
@InputType()
export class MaintenanceScheduleFilterDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(MaintenanceType)
  maintenanceType?: MaintenanceType;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(ScheduleType)
  scheduleType?: ScheduleType;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(MaintenanceScheduleStatus)
  status?: MaintenanceScheduleStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  nextDueDateFrom?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  nextDueDateTo?: string;

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
  sortBy?: string = 'nextDueDate';

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}

@InputType()
export class MaintenanceWorkOrderFilterDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  scheduleId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(WorkOrderType)
  workOrderType?: WorkOrderType;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  scheduledStartDateFrom?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  scheduledStartDateTo?: string;

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
  sortBy?: string = 'scheduledStartDate';

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}

@InputType()
export class SparePartFilterDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  itemId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(SparePartStatus)
  status?: SparePartStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  lowStock?: boolean; // currentStock <= minimumStock

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
  sortBy?: string = 'partName';

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}

