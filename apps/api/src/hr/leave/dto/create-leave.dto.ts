import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsDateString,
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { AccrualType, LeaveStatus, LeaveType } from '../entities/leave.entity';

@InputType()
export class CreateLeavePolicyDto {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field(() => LeaveType)
  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @Field()
  @IsDecimal()
  annualAllocation: number;

  @Field(() => AccrualType, { nullable: true })
  @IsOptional()
  @IsEnum(AccrualType)
  accrualType?: AccrualType;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  maxCarryForward?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  maxAccumulation?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  minNoticedays?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  maxConsecutiveDays?: number;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;
}

@InputType()
export class CreateLeaveApplicationDto {
  @Field()
  @IsNotEmpty()
  employeeId: string;

  @Field()
  @IsNotEmpty()
  leavePolicyId: string;

  @Field()
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @Field()
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @Field()
  @IsDecimal()
  daysRequested: number;

  @Field()
  @IsNotEmpty()
  reason: string;

  @Field({ nullable: true })
  @IsOptional()
  attachmentUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isHalfDay?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  halfDayPeriod?: string;
}

@InputType()
export class ApproveLeaveDto {
  @Field(() => LeaveStatus)
  @IsEnum(LeaveStatus)
  status: LeaveStatus;

  @Field({ nullable: true })
  @IsOptional()
  approverComments?: string;
}

@InputType()
export class CreateLeaveBalanceDto {
  @Field()
  @IsNotEmpty()
  employeeId: string;

  @Field()
  @IsNotEmpty()
  leavePolicyId: string;

  @Field()
  @IsDecimal()
  allocated: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDecimal()
  carriedForward?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  year?: number;
}
