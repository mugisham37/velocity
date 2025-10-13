import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import type { Attendance, AttendanceShift } from '../../../database';
import { AttendanceStatus, ShiftType } from '../../enums';
import { Employee } from '../../employee/entities/employee.entity';

registerEnumType(AttendanceStatus, { name: 'AttendanceStatus' });
registerEnumType(ShiftType, { name: 'ShiftType' });

@ObjectType()
export class AttendanceRecord implements Attendance {
  @Field(() => ID)
  id!: string;

  @Field()
  employeeId!: string;

  @Field(() => Employee, { nullable: true })
  employee?: Employee;

  @Field()
  date!: string;

  @Field(() => AttendanceStatus)
  status!: string;

  @Field(() => Date, { nullable: true })
  checkInTime!: Date | null;

  @Field(() => Date, { nullable: true })
  checkOutTime!: Date | null;

  @Field({ nullable: true })
  workingHours!: number | null;

  @Field({ nullable: true })
  overtimeHours!: number | null;

  @Field({ nullable: true })
  lateMinutes!: number | null;

  @Field({ nullable: true })
  earlyLeaveMinutes!: number | null;

  @Field({ nullable: true })
  shiftId!: string | null;

  @Field({ nullable: true })
  location!: any;

  @Field({ nullable: true })
  notes!: string | null;

  @Field({ nullable: true })
  approvedBy!: string | null;

  @Field(() => Date, { nullable: true })
  approvedAt!: Date | null;

  @Field()
  companyId!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@ObjectType()
export class Shift implements AttendanceShift {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  startTime!: string;

  @Field()
  endTime!: string;

  @Field(() => ShiftType)
  type!: string;

  @Field()
  isActive!: boolean | null;

  @Field()
  companyId!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

