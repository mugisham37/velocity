import { Field, InputType } from '@nestjs/graphql';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsOptional,
} from 'class-or';
import { ComponentType, PayrollFrequency } from '../entities/payroll.entity';

@InputType()
export class CreateSalaryComponentDto {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsNotEmpty()
  code: string;

  @Field(() => ComponentType)
  @IsEnum(ComponentType)
  type: ComponentType;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isStatutory?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isTaxable?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isVariable?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  formula?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  percentage?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  fixedAmount?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  maxAmount?: number;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;
}

@InputType()
export class SalaryStructureComponentDto {
  @Field()
  @IsNotEmpty()
  componentId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  amount?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  percentage?: number;
}

@InputType()
export class CreateSalaryStructureDto {
  @Field()
  @IsNotEmpty()
  employeeId: string;

  @Field()
  @IsDecimal()
  baseSalary: number;

  @Field(() => PayrollFrequency, { nullable: true })
  @IsOptional()
  @IsEnum(PayrollFrequency)
  frequency?: PayrollFrequency;

  @Field()
  @IsNotEmpty()
  @IsDateString()
  effectiveFrom: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @Field(() => [SalaryStructureComponentDto])
  @IsArray()
  components: SalaryStructureComponentDto[];
}

@InputType()
export class CreatePayrollRunDto {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsNotEmpty()
  @IsDateString()
  payrollDate: string;

  @Field()
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @Field()
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @Field(() => PayrollFrequency)
  @IsEnum(PayrollFrequency)
  frequency: PayrollFrequency;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  employeeIds?: string[];
}

@InputType()
export class ProcessPayrollDto {
  @Field()
  @IsNotEmpty()
  payrollRunId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  includeInactive?: boolean;
}
