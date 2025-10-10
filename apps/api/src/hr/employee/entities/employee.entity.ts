import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import type { Employee as EmployeeType } from '@kiro/database';
import { EmploymentStatus, EmploymentType } from '../../enums';
import { Gender, MaritalStatus } from '../dto/create-employee.dto';

registerEnumType(EmploymentStatus, { name: 'EmploymentStatus' });
registerEnumType(EmploymentType, { name: 'EmploymentType' });
registerEnumType(Gender, { name: 'Gender' });
registerEnumType(MaritalStatus, { name: 'MaritalStatus' });

@ObjectType()
export class Employee implements EmployeeType {
  @Field(() => ID)
  id!: string;

  @Field()
  employeeId!: string;

  @Field()
  firstName!: string;

  @Field()
  lastName!: string;

  @Field({ nullable: true })
  middleName?: string | null;

  @Field({ nullable: true })
  email?: string | null;

  @Field({ nullable: true })
  phone?: string | null;

  @Field({ nullable: true })
  personalEmail?: string | null;

  @Field({ nullable: true })
  dateOfBirth?: string | null;

  @Field({ nullable: true })
  gender?: string | null;

  @Field({ nullable: true })
  maritalStatus?: string | null;

  @Field({ nullable: true })
  nationality?: string | null;

  @Field()
  dateOfJoining!: string;

  @Field({ nullable: true })
  dateOfLeaving?: string | null;

  @Field()
  employmentType!: string;

  @Field()
  status!: string;

  @Field({ nullable: true })
  departmentId?: string | null;

  @Field({ nullable: true })
  designationId?: string | null;

  @Field({ nullable: true })
  reportsToId?: string | null;

  @Field()
  companyId!: string;

  @Field({ nullable: true })
  currentAddress?: any;

  @Field({ nullable: true })
  permanentAddress?: any;

  @Field({ nullable: true })
  emergencyContact?: any;

  @Field({ nullable: true })
  isActive?: boolean | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  @Field({ nullable: true })
  createdBy?: string | null;

  @Field({ nullable: true })
  updatedBy?: string | null;

  // Virtual fields for GraphQL
  @Field(() => Employee, { nullable: true })
  manager?: Employee;

  @Field(() => [Employee])
  directReports?: Employee[];
}