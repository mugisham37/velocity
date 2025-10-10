import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Employee } from '../../employee/entities/employee.entity';

export enum PayrollStatus {
  DRAFT = 'draft',
  PROCESSED = 'processed',
  APPROVED = 'approved',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum ComponentType {
  EARNING = 'earning',
  DEDUCTION = 'deduction',
  EMPLOYER_CONTRIBUTION = 'employer_contribution',
}

export enum PayrollFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
}

registerEnumType(PayrollStatus, { name: 'PayrollStatus' });
registerEnumType(ComponentType, { name: 'ComponentType' });
registerEnumType(PayrollFrequency, { name: 'PayrollFrequency' });

@ObjectType()
@Entity('salary_components')
export class SalaryComponent {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  code: string;

  @Field(() => ComponentType)
  @Column({ type: 'enum', enum: ComponentType })
  type: ComponentType;

  @Field()
  @Column({ default: false })
  isStatutory: boolean;

  @Field()
  @Column({ default: false })
  isTaxable: boolean;

  @Field()
  @Column({ default: false })
  isVariable: boolean;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  formula?: string;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentage?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fixedAmount?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxAmount?: number;

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
@Entity('salary_structures')
export class SalaryStructure {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Employee)
  @ManyToOne(() => Employee, { eager: true })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Field()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  baseSalary: number;

  @Field(() => PayrollFrequency)
  @Column({
    type: 'enum',
    enum: PayrollFrequency,
    default: PayrollFrequency.MONTHLY,
  })
  frequency: PayrollFrequency;

  @Field()
  @Column({ type: 'date' })
  effectiveFrom: Date;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  effectiveTo?: Date;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field(() => [SalaryStructureComponent])
  @OneToMany(
    () => SalaryStructureComponent,
    component => component.salaryStructure,
    { cascade: true }
  )
  components: SalaryStructureComponent[];

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}

@ObjectType()
@Entity('salary_structure_components')
export class SalaryStructureComponent {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => SalaryStructure)
  @ManyToOne(() => SalaryStructure, structure => structure.components, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'salaryStructureId' })
  salaryStructure: SalaryStructure;

  @Field(() => SalaryComponent)
  @ManyToOne(() => SalaryComponent, { eager: true })
  @JoinColumn({ name: 'componentId' })
  component: SalaryComponent;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentage?: number;

  @Field()
  @Column({ default: true })
  isActive: boolean;
}

@ObjectType()
@Entity('payroll_runs')
export class PayrollRun {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ type: 'date' })
  payrollDate: Date;

  @Field()
  @Column({ type: 'date' })
  startDate: Date;

  @Field()
  @Column({ type: 'date' })
  endDate: Date;

  @Field(() => PayrollFrequency)
  @Column({ type: 'enum', enum: PayrollFrequency })
  frequency: PayrollFrequency;

  @Field(() => PayrollStatus)
  @Column({ type: 'enum', enum: PayrollStatus, default: PayrollStatus.DRAFT })
  status: PayrollStatus;

  @Field()
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalGrossPay: number;

  @Field()
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalDeductions: number;

  @Field()
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalNetPay: number;

  @Field()
  @Column({ type: 'int', default: 0 })
  employeeCount: number;

  @Field(() => [PayrollEntry])
  @OneToMany(() => PayrollEntry, entry => entry.payrollRun, { cascade: true })
  entries: PayrollEntry[];

  @Field({ nullable: true })
  @Column({ nullable: true })
  processedBy?: string;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  processedAt?: Date;

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
}

@ObjectType()
@Entity('payroll_entries')
export class PayrollEntry {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => PayrollRun)
  @ManyToOne(() => PayrollRun, run => run.entries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payrollRunId' })
  payrollRun: PayrollRun;

  @Field(() => Employee)
  @ManyToOne(() => Employee, { eager: true })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Field()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  baseSalary: number;

  @Field()
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarnings: number;

  @Field()
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalDeductions: number;

  @Field()
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  grossPay: number;

  @Field()
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  netPay: number;

  @Field()
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  workedDays: number;

  @Field()
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  paidDays: number;

  @Field()
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  overtimeHours: number;

  @Field(() => [PayrollEntryComponent])
  @OneToMany(() => PayrollEntryComponent, component => component.payrollEntry, {
    cascade: true,
  })
  components: PayrollEntryComponent[];

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}

@ObjectType()
@Entity('payroll_entry_components')
export class PayrollEntryComponent {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => PayrollEntry)
  @ManyToOne(() => PayrollEntry, entry => entry.components, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payrollEntryId' })
  payrollEntry: PayrollEntry;

  @Field(() => SalaryComponent)
  @ManyToOne(() => SalaryComponent, { eager: true })
  @JoinColumn({ name: 'componentId' })
  component: SalaryComponent;

  @Field()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  calculation?: string;
}
