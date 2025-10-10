import { Field, InputType } from '@nestjs/graphql';
import {
  IsDateString,
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { AttendanceStatus, ShiftType } from '../../enums';

@InputType()
export class CreateAttendanceDto {
  @Field()
  @IsNotEmpty()
  employeeId!: string;

  @Field()
  @IsNotEmpty()
  @IsDateString()
  date!: string;

  @Field(() => AttendanceStatus)
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @Field({ nullable: true })
  @IsOptional()
  checkInTime?: string;

  @Field({ nullable: true })
  @IsOptional()
  checkOutTime?: string;

  @Field({ nullable: true })
  @IsOptional()
  scheduledInTime?: string;

  @Field({ nullable: true })
  @IsOptional()
  scheduledOutTime?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  hoursWorked?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  overtimeHours?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  breakHours?: number;

  @Field(() => ShiftType, { nullable: true })
  @IsOptional()
  @IsEnum(ShiftType)
  shiftType?: ShiftType;

  @Field({ nullable: true })
  @IsOptional()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @Field({ nullable: true })
  @IsOptional()
  deviceId?: string;

  @Field({ nullable: true })
  @IsOptional()
  notes?: string;
}

@InputType()
export class CreateShiftDto {
  @Field()
  @IsNotEmpty()
  name!: string;

  @Field()
  @IsNotEmpty()
  startTime!: string;

  @Field()
  @IsNotEmpty()
  endTime!: string;

  @Field()
  @IsNotEmpty()
  companyId!: string;

  @Field(() => ShiftType, { nullable: true })
  @IsOptional()
  @IsEnum(ShiftType)
  type?: ShiftType;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  breakDuration?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  overtimeThreshold?: number;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;
}
