import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import type { LeavePolicy as LeavePolicyType, LeaveRequest, LeaveBalance as LeaveBalanceType } from '@kiro/database';
import { LeaveStatus, LeaveType, AccrualType } from '../../enums';
import { Employee } from '../../employee/entities/employee.entity';

registerEnumType(LeaveStatus, { name: 'LeaveStatus' });
registerEnumType(LeaveType, { name: 'LeaveType' });
registerEnumType(AccrualType, { name: 'AccrualType' });

// Export the enum for use in resolvers
export { LeaveStatus };

@ObjectType()
export class LeavePolicy implements LeavePolicyType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  leaveType!: string;

  @Field()
  annualAllocation!: number;

  @Field()
  accrualType!: string;

  @Field({ nullable: true })
  maxCarryForward!: number | null;

  @Field({ nullable: true })
  maxAccumulation!: number | null;

  @Field()
  requiresApproval!: boolean | null;

  @Field({ nullable: true })
  minNoticeDays!: number | null;

  @Field({ nullable: true })
  maxConsecutiveDays!: number | null;

  @Field({ nullable: true })
  isActive!: boolean | null;

  @Field()
  companyId!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@ObjectType()
export class LeaveApplication implements LeaveRequest {
  @Field(() => ID)
  id!: string;

  @Field()
  employeeId!: string;

  @Field(() => Employee, { nullable: true })
  employee?: Employee;

  @Field()
  leavePolicyId!: string;

  @Field(() => LeavePolicy, { nullable: true })
  leavePolicy?: LeavePolicy;

  @Field()
  startDate!: string;

  @Field()
  endDate!: string;

  @Field()
  daysRequested!: number;

  @Field()
  status!: string;

  @Field()
  reason!: string;

  @Field({ nullable: true })
  isHalfDay!: boolean | null;

  @Field({ nullable: true })
  halfDayPeriod!: string | null;

  @Field()
  appliedDate!: string;

  @Field({ nullable: true })
  approvedBy!: string | null;

  @Field(() => Date, { nullable: true })
  approvedAt!: Date | null;

  @Field({ nullable: true })
  rejectionReason!: string | null;

  @Field({ nullable: true })
  attachments!: any;

  @Field()
  companyId!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@ObjectType()
export class LeaveBalance implements LeaveBalanceType {
  @Field(() => ID)
  id!: string;

  @Field()
  employeeId!: string;

  @Field(() => Employee, { nullable: true })
  employee?: Employee;

  @Field()
  leavePolicyId!: string;

  @Field(() => LeavePolicy, { nullable: true })
  leavePolicy?: LeavePolicy;

  @Field()
  allocated!: number;

  @Field()
  used!: number | null;

  @Field()
  pending!: number | null;

  @Field()
  carriedForward!: number | null;

  @Field()
  year!: number;

  @Field()
  companyId!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}