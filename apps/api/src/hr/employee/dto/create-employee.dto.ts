import { Field, InputType } from '@nestjs/graphql';
import {
  IsDateString,
  IsDecimal,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
} from 'class-validator';
import {
  EmployeeStatus,
  Gender,
  MaritalStatus,
} from '../entities/employee.entity';

@InputType()
export class CreateEmployeeDto {
  @Field()
  @IsNotEmpty()
  employeeId: string;

  @Field()
  @IsNotEmpty()
  firstName: string;

  @Field()
  @IsNotEmpty()
  lastName: string;

  @Field({ nullable: true })
  @IsOptional()
  middleName?: string;

  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsPhoneNumber()
  mobilePhone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @Field(() => Gender, { nullable: true })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @Field(() => MaritalStatus, { nullable: true })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @Field({ nullable: true })
  @IsOptional()
  nationalId?: string;

  @Field({ nullable: true })
  @IsOptional()
  passportNumber?: string;

  @Field()
  @IsNotEmpty()
  @IsDateString()
  hireDate: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  terminationDate?: string;

  @Field(() => EmployeeStatus, { nullable: true })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @Field({ nullable: true })
  @IsOptional()
  jobTitle?: string;

  @Field({ nullable: true })
  @IsOptional()
  department?: string;

  @Field({ nullable: true })
  @IsOptional()
  division?: string;

  @Field({ nullable: true })
  @IsOptional()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  salary?: number;

  @Field({ nullable: true })
  @IsOptional()
  currency?: string;

  @Field({ nullable: true })
  @IsOptional()
  payrollFrequency?: string;

  @Field({ nullable: true })
  @IsOptional()
  managerId?: string;

  @Field({ nullable: true })
  @IsOptional()
  addressLine1?: string;

  @Field({ nullable: true })
  @IsOptional()
  addressLine2?: string;

  @Field({ nullable: true })
  @IsOptional()
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  state?: string;

  @Field({ nullable: true })
  @IsOptional()
  postalCode?: string;

  @Field({ nullable: true })
  @IsOptional()
  country?: string;

  @Field({ nullable: true })
  @IsOptional()
  emergencyContactName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsPhoneNumber()
  emergencyContactPhone?: string;

  @Field({ nullable: true })
  @IsOptional()
  emergencyContactRelationship?: string;

  @Field({ nullable: true })
  @IsOptional()
  notes?: string;
}
