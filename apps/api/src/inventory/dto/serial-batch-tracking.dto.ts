import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
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
} from 'class-validator';

// Enums
export enum SerialNumberStatus {
  AVAILABLE = 'Available',
  RESERVED = 'Reserved',
  SOLD = 'Sold',
  DAMAGED = 'Damaged',
  LOST = 'Lost',
  RETURNED = 'Returned',
}

export enum SerialNumberCondition {
  GOOD = 'Good',
  DAMAGED = 'Damaged',
  REFURBISHED = 'Refurbished',
  NEW = 'New',
}

export enum BatchQualityStatus {
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  PENDING = 'Pending',
  QUARANTINE = 'Quarantine',
}

export enum RecallType {
  VOLUNTARY = 'Voluntary',
  MANDATORY = 'Mandatory',
  PRECAUTIONARY = 'Precautionary',
}

export enum SeverityLevel {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export enum RecallStatus {
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export enum RecoveryStatus {
  PENDING = 'Pending',
  RECOVERED = 'Recovered',
  DESTROYED = 'Destroyed',
  CUSTOMER_NOTIFIED = 'Customer_Notified',
}

export enum InspectionType {
  INCOMING = 'Incoming',
  IN_PROCESS = 'In-Process',
  FINAL = 'Final',
  RANDOM = 'Random',
}

export enum InspectionStatus {
  PENDING = 'Pending',
  PASSED = 'Passed',
  FAILED = 'Failed',
  CONDITIONAL = 'Conditional',
}

export enum ComplianceReportType {
  FDA = 'FDA',
  EU_MDR = 'EU_MDR',
  ISO = 'ISO',
  CUSTOM = 'Custom',
}

export enum ComplianceReportStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

// Register enums with GraphQL (only in non-test environment)
if (typeof registerEnumType !== 'undefined') {
  registerEnumType(SerialNumberStatus, { name: 'SerialNumberStatus' });
  registerEnumType(SerialNumberCondition, { name: 'SerialNumberCondition' });
  registerEnumType(BatchQualityStatus, { name: 'BatchQualityStatus' });
  registerEnumType(RecallType, { name: 'RecallType' });
  registerEnumType(SeverityLevel, { name: 'SeverityLevel' });
  registerEnumType(RecallStatus, { name: 'RecallStatus' });
  registerEnumType(RecoveryStatus, { name: 'RecoveryStatus' });
  registerEnumType(InspectionType, { name: 'InspectionType' });
  registerEnumType(InspectionStatus, { name: 'InspectionStatus' });
  registerEnumType(ComplianceReportType, { name: 'ComplianceReportType' });
  registerEnumType(ComplianceReportStatus, { name: 'ComplianceReportStatus' });
}

// Serial Number DTOs
@InputType()
export class CreateSerialNumberDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  serialNumber!: string;

  @Field()
  @IsUUID()
  itemId!: string;

  @Field()
  @IsUUID()
  warehouseId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @Field(() => SerialNumberStatus, {
    defaultValue: SerialNumberStatus.AVAILABLE,
  })
  @IsEnum(SerialNumberStatus)
  status!: SerialNumberStatus;

  @Field(() => SerialNumberCondition, {
    defaultValue: SerialNumberCondition.GOOD,
  })
  @IsEnum(SerialNumberCondition)
  condition!: SerialNumberCondition;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  purchaseRate?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  purchaseDocumentType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  purchaseDocumentNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  warrantyExpiryDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

@InputType()
export class UpdateSerialNumberDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @Field(() => SerialNumberStatus, { nullable: true })
  @IsOptional()
  @IsEnum(SerialNumberStatus)
  status?: SerialNumberStatus;

  @Field(() => SerialNumberCondition, { nullable: true })
  @IsOptional()
  @IsEnum(SerialNumberCondition)
  condition?: SerialNumberCondition;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  deliveryDocumentType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  deliveryDocumentNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  maintenanceDueDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  lastMaintenanceDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

// Batch Number DTOs
@InputType()
export class CreateBatchNumberDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  batchNumber!: string;

  @Field()
  @IsUUID()
  itemId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  manufacturingDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  supplierBatchId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  purchaseDocumentType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  purchaseDocumentNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  manufacturingLocation?: string;

  @Field(() => BatchQualityStatus, {
    defaultValue: BatchQualityStatus.APPROVED,
  })
  @IsEnum(BatchQualityStatus)
  qualityStatus!: BatchQualityStatus;

  @Field()
  @IsNumber()
  totalQty!: number;

  @Field()
  @IsString()
  @IsNotEmpty()
  uom!: string;

  @Field({ nullable: true })
  @IsOptional()
  batchAttributes?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  qualityNotes?: string;
}

@InputType()
export class UpdateBatchNumberDto {
  @Field(() => BatchQualityStatus, { nullable: true })
  @IsOptional()
  @IsEnum(BatchQualityStatus)
  qualityStatus?: BatchQualityStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  availableQty?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  reservedQty?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  consumedQty?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  qualityInspectionDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  qualityInspector?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  qualityNotes?: string;

  @Field({ nullable: true })
  @IsOptional()
  batchAttributes?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// Batch Location DTOs
@InputType()
export class CreateBatchLocationDto {
  @Field()
  @IsUUID()
  batchId!: string;

  @Field()
  @IsUUID()
  warehouseId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @Field()
  @IsNumber()
  qty!: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  reservedQty?: number;
}

// Product Recall DTOs
@InputType()
export class CreateProductRecallDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  recallNumber!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  recallTitle!: string;

  @Field(() => RecallType)
  @IsEnum(RecallType)
  recallType!: RecallType;

  @Field(() => SeverityLevel)
  @IsEnum(SeverityLevel)
  severityLevel!: SeverityLevel;

  @Field()
  @IsString()
  @IsNotEmpty()
  recallReason!: string;

  @Field()
  @IsDateString()
  recallDate!: string;

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
  regulatoryBody?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  regulatoryReference?: string;

  @Field(() => [String])
  @IsArray()
  @IsUUID('4', { each: true })
  affectedItems!: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  affectedBatches?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  affectedSerials?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  dateRangeFrom?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  dateRangeTo?: string;

  @Field({ defaultValue: true })
  @IsBoolean()
  customerNotificationRequired!: boolean;

  @Field({ defaultValue: false })
  @IsBoolean()
  supplierNotificationRequired!: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  recallInstructions?: string;

  @Field({ nullable: true })
  @IsOptional()
  contactInformation?: any;
}

@InputType()
export class UpdateProductRecallDto {
  @Field(() => RecallStatus, { nullable: true })
  @IsOptional()
  @IsEnum(RecallStatus)
  status?: RecallStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  recoveredQty?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  destroyedQty?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  returnedQty?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  recallInstructions?: string;

  @Field({ nullable: true })
  @IsOptional()
  contactInformation?: any;
}

// Quality Inspection DTOs
@InputType()
export class CreateQualityInspectionDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  inspectionNumber!: string;

  @Field(() => InspectionType)
  @IsEnum(InspectionType)
  inspectionType!: InspectionType;

  @Field()
  @IsUUID()
  itemId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  serialNumberId?: string;

  @Field()
  @IsDateString()
  inspectionDate!: string;

  @Field()
  @IsUUID()
  inspectorId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  inspectionTemplate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  sampleSize?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  totalQtyInspected?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  locationId?: string;
}

@InputType()
export class UpdateQualityInspectionDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  passedQty?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  failedQty?: number;

  @Field(() => InspectionStatus, { nullable: true })
  @IsOptional()
  @IsEnum(InspectionStatus)
  overallStatus?: InspectionStatus;

  @Field({ nullable: true })
  @IsOptional()
  inspectionResults?: any;

  @Field({ nullable: true })
  @IsOptional()
  defectsFound?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  correctiveActions?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  inspectorNotes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  approvedBy?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  approvedAt?: string;
}

// Compliance Report DTOs
@InputType()
export class CreateComplianceReportDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  reportNumber!: string;

  @Field(() => ComplianceReportType)
  @IsEnum(ComplianceReportType)
  reportType!: ComplianceReportType;

  @Field()
  @IsString()
  @IsNotEmpty()
  reportTitle!: string;

  @Field()
  @IsDateString()
  reportingPeriodFrom!: string;

  @Field()
  @IsDateString()
  reportingPeriodTo!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  regulatoryBody?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  regulationReference?: string;

  @Field()
  reportData: any;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  affectedItems?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  affectedBatches?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  affectedSerials?: string[];
}

@InputType()
export class UpdateComplianceReportDto {
  @Field(() => ComplianceReportStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ComplianceReportStatus)
  status?: ComplianceReportStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  submissionDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  submissionReference?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  responseDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  responseStatus?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  responseNotes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  approvedBy?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  approvedAt?: string;

  @Field({ nullable: true })
  @IsOptional()
  reportData?: any;
}

// Traceability DTOs
@InputType()
export class TraceabilityQueryDto {
  @Field()
  @IsUUID()
  itemId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @Field({ defaultValue: false })
  @IsBoolean()
  includeForwardTrace!: boolean;

  @Field({ defaultValue: false })
  @IsBoolean()
  includeBackwardTrace!: boolean;
}

// Filter DTOs
@InputType()
export class SerialNumberFilterDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  itemId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @Field(() => SerialNumberStatus, { nullable: true })
  @IsOptional()
  @IsEnum(SerialNumberStatus)
  status?: SerialNumberStatus;

  @Field(() => SerialNumberCondition, { nullable: true })
  @IsOptional()
  @IsEnum(SerialNumberCondition)
  condition?: SerialNumberCondition;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  warrantyExpiringBefore?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  maintenanceDueBefore?: string;
}

@InputType()
export class BatchNumberFilterDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  itemId?: string;

  @Field(() => BatchQualityStatus, { nullable: true })
  @IsOptional()
  @IsEnum(BatchQualityStatus)
  qualityStatus?: BatchQualityStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  expiringBefore?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  manufacturedAfter?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  manufacturedBefore?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  supplierId?: string;
}

@InputType()
export class ProductRecallFilterDto {
  @Field(() => RecallType, { nullable: true })
  @IsOptional()
  @IsEnum(RecallType)
  recallType?: RecallType;

  @Field(() => SeverityLevel, { nullable: true })
  @IsOptional()
  @IsEnum(SeverityLevel)
  severityLevel?: SeverityLevel;

  @Field(() => RecallStatus, { nullable: true })
  @IsOptional()
  @IsEnum(RecallStatus)
  status?: RecallStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  recallDateFrom?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  recallDateTo?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  affectedItemId?: string;
}

@InputType()
export class QualityInspectionFilterDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  itemId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @Field(() => InspectionType, { nullable: true })
  @IsOptional()
  @IsEnum(InspectionType)
  inspectionType?: InspectionType;

  @Field(() => InspectionStatus, { nullable: true })
  @IsOptional()
  @IsEnum(InspectionStatus)
  overallStatus?: InspectionStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  inspectorId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  inspectionDateFrom?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  inspectionDateTo?: string;
}

// Response DTOs
@ObjectType()
export class TraceabilityReportDto {
  @Field()
  itemId!: string;

  @Field({ nullable: true })
  serialNumber?: string;

  @Field({ nullable: true })
  batchNumber?: string;

  @Field(() => [TraceabilityEntryDto])
  forwardTrace!: TraceabilityEntryDto[];

  @Field(() => [TraceabilityEntryDto])
  backwardTrace!: TraceabilityEntryDto[];

  @Field(() => [String])
  affectedCustomers!: string[];

  @Field(() => [String])
  affectedSuppliers!: string[];

  @Field(() => [String])
  relatedDocuments!: string[];
}

@ObjectType()
export class TraceabilityEntryDto {
  @Field()
  transactionDate!: string;

  @Field()
  transactionType!: string;

  @Field({ nullable: true })
  fromLocation?: string;

  @Field({ nullable: true })
  toLocation?: string;

  @Field({ nullable: true })
  documentType?: string;

  @Field({ nullable: true })
  documentNumber?: string;

  @Field({ nullable: true })
  quantity?: number;

  @Field({ nullable: true })
  notes?: string;
}

@ObjectType()
export class RecallAnalyticsDto {
  @Field()
  totalRecalls!: number;

  @Field()
  activeRecalls!: number;

  @Field()
  completedRecalls!: number;

  @Field()
  totalAffectedItems!: number;

  @Field()
  totalRecoveredQty!: number;

  @Field()
  recoveryRate!: number;

  @Field(() => [RecallSummaryDto])
  recallsBySeverity!: RecallSummaryDto[];

  @Field(() => [RecallSummaryDto])
  recallsByType!: RecallSummaryDto[];
}

@ObjectType()
export class RecallSummaryDto {
  @Field()
  category!: string;

  @Field()
  count!: number;

  @Field()
  percentage!: number;
}

@ObjectType()
export class ExpiryAlertDto {
  @Field()
  batchId!: string;

  @Field()
  batchNumber!: string;

  @Field()
  itemId!: string;

  @Field()
  itemName!: string;

  @Field()
  expiryDate!: string;

  @Field()
  daysToExpiry!: number;

  @Field()
  availableQty!: number;

  @Field()
  warehouseLocations!: string[];
}
