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

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  HALF_DAY = 'half_day',
  ON_LEAVE = 'on_leave',
}

export enum ShiftType {
  REGULAR = 'regular',
  NIGHT = 'night',
  WEEKEND = 'weekend',
  HOLIDAY = 'holiday',
}

registerEnumType(AttendanceStatus, { name: 'AttendanceStatus' });
registerEnumType(ShiftType, { name: 'ShiftType' });

@ObjectType()
@Entity('attendance_records')
export class AttendanceRecord {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Employee)
  @ManyToOne(() => Employee, { eager: true })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Field()
  @Column({ type: 'date' })
  date: Date;

  @Field(() => AttendanceStatus)
  @Column({ type: 'enum', enum: AttendanceStatus })
  status: AttendanceStatus;

  @Field({ nullable: true })
  @Column({ type: 'time', nullable: true })
  checkInTime?: string;

  @Field({ nullable: true })
  @Column({ type: 'time', nullable: true })
  checkOutTime?: string;

  @Field({ nullable: true })
  @Column({ type: 'time', nullable: true })
  scheduledInTime?: string;

  @Field({ nullable: true })
  @Column({ type: 'time', nullable: true })
  scheduledOutTime?: string;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  hoursWorked?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  overtimeHours?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  breakHours?: number;

  @Field(() => ShiftType, { nullable: true })
  @Column({ type: 'enum', enum: ShiftType, nullable: true })
  shiftType?: ShiftType;

  @Field({ nullable: true })
  @Column({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  deviceId?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  approvedBy?: string;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

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
@Entity('shifts')
export class Shift {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ type: 'time' })
  startTime: string;

  @Field()
  @Column({ type: 'time' })
  endTime: string;

  @Field(() => ShiftType)
  @Column({ type: 'enum', enum: ShiftType, default: ShiftType.REGULAR })
  type: ShiftType;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  breakDuration?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  overtimeThreshold?: number;

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
