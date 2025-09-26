import { Field, Float, InputType, ObjectType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

@InputType()
export class CreateWorkstationDto {
  @Field()
  @IsString()
  workstationName: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  workstationType?: string;

  @Field()
  @IsUUID()
  companyId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourRate?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourRateElectricity?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourRateConsumable?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourRateRent?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourRateLabour?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  productionCapacity?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  workingHoursStart?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  workingHoursEnd?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  holidayList?: string;
}

@InputType()
export class UpdateWorkstationDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  workstationName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  workstationType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourRate?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourRateElectricity?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourRateConsumable?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourRateRent?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourRateLabour?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  productionCapacity?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  workingHoursStart?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  workingHoursEnd?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  holidayList?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@InputType()
export class WorkstationFilterDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  workstationType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;
}

@ObjectType()
export class WorkstationCapacityInfo {
  @Field(() => Float)
  totalCapacity: number;

  @Field(() => Float)
  availableCapacity: number;

  @Field(() => Float)
  utilizationPercentage: number;

  @Field()
  workingHoursStart: string;

  @Field()
  workingHoursEnd: string;

  @Field(() => Float)
  dailyWorkingHours: number;
}

@ObjectType()
export class WorkstationCostBreakdown {
  @Field(() => Float)
  hourRate: number;

  @Field(() => Float)
  electricityCost: number;

  @Field(() => Float)
  consumableCost: number;

  @Field(() => Float)
  rentCost: number;

  @Field(() => Float)
  labourCost: number;

  @Field(() => Float)
  totalHourlyRate: number;

  @Field()
  currency: string;
}
