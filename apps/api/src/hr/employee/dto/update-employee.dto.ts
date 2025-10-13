import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateEmployeeDto } from './create-employee.dto';

@InputType()
export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
  @Field({ nullable: true })
  updatedBy?: string;
}

