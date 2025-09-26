import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Employee } from '../../employee/entities/employee.entity';

export enum LeaveType {
  ANNUAL = 'annual',
  SICK = 'sick',
  MATERNITY = 'maternity',
  PATERNITY = 'paternity',
  PERSONAL = 'personal',
  EMERGENCY = 'emergency',
  UNPAID = 'unpaid',
  COMPENSATORY = 'compensatory',
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum AccrualType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
  NONE = 'none',
}

registerEnumType(LeaveType, { name: 'LeaveType' });
registerEnumType(LeaveStatus, { name: 'LeaveStatus' });
registerEnumType(AccrualType, { name: 'AccrualType' });

@ObjectType()
@Entity('leave_policies')
export class LeavePolicy {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field(() => LeaveType)
  @Column({ type: 'enum', enum: LeaveType })
  leaveType: LeaveType;

  @Field()
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  annualAllocation: number;

  @Field(() => AccrualType)
  @Column({ type: 'enum', enum: AccrualType, default: AccrualType.MONTHLY })
  accrualType: AccrualType;

  @Field()
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  maxCarryForward: number;

  @Field()
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  maxAccumulation: number;

  @Field()
  @Column({ default: false })
  requiresApproval: boolean;

  @Field()
  @Column({ default: 0 })
  minNoticedays: number;

  @Field()
  @Column({ default: 0 })
  maxConsecutiveDays: number;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}

@ObjectType()
@Entity('leave_applications')
export class LeaveApplication {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Employee)
  @ManyToOne(() => Employee, { eager: true })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Field(() => LeavePolicy)
  @ManyToOne(() => LeavePolicy, { eager: true })
  @JoinColumn({ name: 'leavePolicyId' })
  leavePolicy: LeavePolicy;

  @Field()
  @Column({ type: 'date' })
  startDate: Date;

  @Field()
  @Column({ type: 'date' })
  endDate: Date;

  @Field()
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  daysRequested: number;

  @Field(() => LeaveStatus)
  @Column({ type: 'enum', enum: LeaveStatus, default: LeaveStatus.PENDING })
  status: LeaveStatus;

  @Field()
  @Column({ type: 'text' })
  reason: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  approverComments?: string;

  @Field(() => Employee, { nullable: true })
  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy?: Employee;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  attachmentUrl?: string;

  @Field()
  @Column({ default: false })
  isHalfDay: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  halfDayPeriod?: string; // 'morning' or 'afternoon'

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  createdBy?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  updatedBy?: string;
}

@ObjectType()
@Entity('leave_balances')
export class LeaveBalance {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Employee)
  @ManyToOne(() => Employee, { eager: true })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Field(() => LeavePolicy)
  @ManyToOne(() => LeavePolicy, { eager: true })
  @JoinColumn({ name: 'leavePolicyId' })
  leavePolicy: LeavePolicy;

  @Field()
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  allocated: number;

  @Field()
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  used: number;

  @Field()
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  pending: number;

  @Field()
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  carriedForward: number;

  @Field()
  @Column({ type: 'int', default: new Date().getFullYear() })
  year: number;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;

  // Computed field
  @Field()
  get available(): number {
    return this.allocated + this.carriedForward - this.used - this.pending;
  }
}
