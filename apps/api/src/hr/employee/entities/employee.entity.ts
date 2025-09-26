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

export enum EmployeeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TERMINATED = 'terminated',
  ON_LEAVE = 'on_leave',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
}

registerEnumType(EmployeeStatus, { name: 'EmployeeStatus' });
registerEnumType(Gender, { name: 'Gender' });
registerEnumType(MaritalStatus, { name: 'MaritalStatus' });

@ObjectType()
@Entity('employees')
export class Employee {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  employeeId: string;

  @Field()
  @Column()
  firstName: string;

  @Field()
  @Column()
  lastName: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  middleName?: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  mobilePhone?: string;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Field(() => Gender, { nullable: true })
  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender?: Gender;

  @Field(() => MaritalStatus, { nullable: true })
  @Column({ type: 'enum', enum: MaritalStatus, nullable: true })
  maritalStatus?: MaritalStatus;

  @Field({ nullable: true })
  @Column({ nullable: true })
  nationalId?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  passportNumber?: string;

  @Field(() => Date)
  @Column({ type: 'date' })
  hireDate: Date;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'date', nullable: true })
  terminationDate?: Date;

  @Field(() => EmployeeStatus)
  @Column({
    type: 'enum',
    enum: EmployeeStatus,
    default: EmployeeStatus.ACTIVE,
  })
  status: EmployeeStatus;

  @Field({ nullable: true })
  @Column({ nullable: true })
  jobTitle?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  department?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  division?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salary?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  currency?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  payrollFrequency?: string;

  // Reporting structure
  @Field(() => Employee, { nullable: true })
  @ManyToOne(() => Employee, employee => employee.directReports, {
    nullable: true,
  })
  @JoinColumn({ name: 'managerId' })
  manager?: Employee;

  @Field(() => [Employee])
  @OneToMany(() => Employee, employee => employee.manager)
  directReports: Employee[];

  // Address information
  @Field({ nullable: true })
  @Column({ nullable: true })
  addressLine1?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  addressLine2?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  postalCode?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  country?: string;

  // Emergency contact
  @Field({ nullable: true })
  @Column({ nullable: true })
  emergencyContactName?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  emergencyContactPhone?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  emergencyContactRelationship?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

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
