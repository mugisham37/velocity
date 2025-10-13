import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import type { 
  PayrollComponent, 
  SalaryStructure as SalaryStructureType, 
  SalaryStructureComponent,
  PayrollRun as PayrollRunType,
  PayrollEntry,
  PayrollEntryComponent
} from '../../../database';
import { ComponentType, PayrollFrequency, PayrollStatus, PayrollEntryStatus, PaymentMethod } from '../../enums';
import { Employee } from '../../employee/entities/employee.entity';

registerEnumType(ComponentType, { name: 'ComponentType' });
registerEnumType(PayrollFrequency, { name: 'PayrollFrequency' });
registerEnumType(PayrollStatus, { name: 'PayrollStatus' });
registerEnumType(PayrollEntryStatus, { name: 'PayrollEntryStatus' });
registerEnumType(PaymentMethod, { name: 'PaymentMethod' });

@ObjectType()
export class SalaryComponent implements PayrollComponent {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  code!: string;

  @Field()
  type!: string;

  @Field()
  isStatutory!: boolean | null;

  @Field()
  isTaxable!: boolean | null;

  @Field()
  isVariable!: boolean | null;

  @Field({ nullable: true })
  formula!: string | null;

  @Field({ nullable: true })
  defaultAmount!: number | null;

  @Field({ nullable: true })
  percentage!: number | null;

  @Field({ nullable: true })
  maxAmount!: number | null;

  @Field({ nullable: true })
  minAmount!: number | null;

  @Field()
  isActive!: boolean | null;

  @Field()
  companyId!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@ObjectType()
export class SalaryStructure implements SalaryStructureType {
  @Field(() => ID)
  id!: string;

  @Field()
  employeeId!: string;

  @Field(() => Employee, { nullable: true })
  employee?: Employee;

  @Field()
  baseSalary!: number;

  @Field()
  currency!: string;

  @Field()
  frequency!: string;

  @Field()
  effectiveFrom!: string;

  @Field({ nullable: true })
  effectiveTo!: string | null;

  @Field()
  isActive!: boolean | null;

  @Field()
  companyId!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  @Field(() => [SalaryStructureComponentEntity])
  components?: SalaryStructureComponentEntity[];
}

@ObjectType()
export class SalaryStructureComponentEntity implements SalaryStructureComponent {
  @Field(() => ID)
  id!: string;

  @Field()
  salaryStructureId!: string;

  @Field()
  componentId!: string;

  @Field(() => SalaryComponent, { nullable: true })
  component?: SalaryComponent;

  @Field({ nullable: true })
  amount!: number | null;

  @Field({ nullable: true })
  percentage!: number | null;

  @Field()
  isActive!: boolean | null;
}

@ObjectType()
export class PayrollRun implements PayrollRunType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  payrollDate!: string;

  @Field()
  startDate!: string;

  @Field()
  endDate!: string;

  @Field()
  frequency!: string;

  @Field()
  status!: string;

  @Field()
  totalGrossPay!: number | null;

  @Field()
  totalDeductions!: number | null;

  @Field()
  totalNetPay!: number | null;

  @Field()
  employeeCount!: number | null;

  @Field({ nullable: true })
  processedBy!: string | null;

  @Field(() => Date, { nullable: true })
  processedAt!: Date | null;

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

  @Field(() => [PayrollEntryEntity])
  entries?: PayrollEntryEntity[];
}

@ObjectType()
export class PayrollEntryEntity implements PayrollEntry {
  @Field(() => ID)
  id!: string;

  @Field()
  payrollRunId!: string;

  @Field(() => PayrollRun, { nullable: true })
  payrollRun?: PayrollRun;

  @Field()
  employeeId!: string;

  @Field(() => Employee, { nullable: true })
  employee?: Employee;

  @Field()
  baseSalary!: number;

  @Field()
  totalEarnings!: number;

  @Field()
  totalDeductions!: number;

  @Field()
  grossPay!: number;

  @Field()
  netPay!: number;

  @Field()
  workedDays!: number | null;

  @Field()
  paidDays!: number | null;

  @Field()
  overtimeHours!: number | null;

  @Field()
  status!: string;

  @Field({ nullable: true })
  paymentDate!: string | null;

  @Field({ nullable: true })
  paymentMethod!: string | null;

  @Field({ nullable: true })
  paymentReference!: string | null;

  @Field()
  companyId!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  @Field(() => [PayrollEntryComponentEntity])
  components?: PayrollEntryComponentEntity[];
}

@ObjectType()
export class PayrollEntryComponentEntity implements PayrollEntryComponent {
  @Field(() => ID)
  id!: string;

  @Field()
  payrollEntryId!: string;

  @Field()
  componentId!: string;

  @Field(() => SalaryComponent, { nullable: true })
  component?: SalaryComponent;

  @Field()
  amount!: number;
}
