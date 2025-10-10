import { IsString, IsUUID, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Type } from 'class-transformer';

@InputType()
export class CreateBOMItemDto {
  @Field()
  @IsUUID()
  itemId: string;

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
  @Min(0)
  qty: number;

  @Field()
  @IsString()
  uom: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  conversionFactor?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  bomNo?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  allowAlternativeItem?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  includeItemInManufacturing?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  sourcedBySupplier?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  operationId?: string;
}

@InputType()
export class CreateBOMOperationDto {
  @Field()
  @IsString()
  operationNo: string;

  @Field()
  @IsString()
  operationName: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  workstationId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  workstationType?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  timeInMins?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourRate?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  batchSize?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedTimeInMins?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  setUpTime?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tearDownTime?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sequenceId?: number;
}

@InputType()
export class CreateBOMScrapItemDto {
  @Field()
  @IsUUID()
  itemId: string;

  @Field()
  @IsString()
  itemCode: string;

  @Field()
  @IsString()
  itemName: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQty?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  stockUom?: string;
}

@InputType()
export class CreateBOMDto {
  @Field()
  @IsString()
  bomNo: string;

  @Field()
  @IsUUID()
  itemId: string;

  @Field()
  @IsUUID()
  companyId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  version?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @Field()
  @IsString()
  uom: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  bomType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  withOperations?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  transferMaterialAgainst?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  allowAlternativeItem?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  allowSameItemMultipleTimes?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  setRateOfSubAssemblyItemBasedOnBom?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  inspectionRequired?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  qualityInspectionTemplate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  routingId?: string;

  @Field(() => [CreateBOMItemDto], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBOMItemDto)
  items?: CreateBOMItemDto[];

  @Field(() => [CreateBOMOperationDto], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBOMOperationDto)
  operations?: CreateBOMOperationDto[];

  @Field(() => [CreateBOMScrapItemDto], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBOMScrapItemDto)
  scrapItems?: CreateBOMScrapItemDto[];
}

@InputType()
export class UpdateBOMDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  uom?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  withOperations?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  transferMaterialAgainst?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  allowAlternativeItem?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  allowSameItemMultipleTimes?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  setRateOfSubAssemblyItemBasedOnBom?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  inspectionRequired?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  qualityInspectionTemplate?: string;

  @Field(() => [CreateBOMItemDto], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBOMItemDto)
  items?: CreateBOMItemDto[];

  @Field(() => [CreateBOMOperationDto], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBOMOperationDto)
  operations?: CreateBOMOperationDto[];

  @Field(() => [CreateBOMScrapItemDto], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBOMScrapItemDto)
  scrapItems?: CreateBOMScrapItemDto[];
}

@InputType()
export class BOMFilterDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  itemId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  bomNo?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  version?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  bomType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;
}

@InputType()
export class CreateBOMVersionDto {
  @Field()
  @IsUUID()
  bomId: string;

  @Field()
  @IsString()
  newVersion: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  changeDescription?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  makeDefault?: boolean;
}

@InputType()
export class BOMCostCalculationDto {
  @Field()
  @IsUUID()
  bomId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  includeOperations?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  includeScrap?: boolean;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;
}

@InputType()
export class BOMExplosionDto {
  @Field()
  @IsUUID()
  bomId: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  quantity: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  includeSubAssemblies?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  includeOperations?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  includeScrap?: boolean;
}

@ObjectType()
export class BOMCostBreakdown {
  @Field(() => Float)
  materialCost: number;

  @Field(() => Float)
  operatingCost: number;

  @Field(() => Float)
  scrapCost: number;

  @Field(() => Float)
  totalCost: number;

  @Field()
  currency: string;
}

@ObjectType()
export class BOMExplosionItem {
  @Field()
  itemId: string;

  @Field()
  itemCode: string;

  @Field()
  itemName: string;

  @Field(() => Float)
  requiredQty: number;

  @Field()
  uom: string;

  @Field(() => Float)
  rate: number;

  @Field(() => Float)
  amount: number;

  @Field(() => Int)
  level: number;

  @Field({ nullable: true })
  parentBomId?: string;

  @Field({ nullable: true })
  bomNo?: string;
}

@ObjectType()
export class BOMExplosionResult {
  @Field(() => [BOMExplosionItem])
  items: BOMExplosionItem[];

  @Field(() => BOMCostBreakdown)
  costBreakdown: BOMCostBreakdown;

  @Field(() => Float)
  totalQuantity: number;
}
