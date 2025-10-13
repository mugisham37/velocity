import { Module } from '@nestjs/common';
import { EmployeeModule } from '../employee/employee.module';
import { LeaveResolver } from './leave.resolver';
import { LeaveService } from './leave.service';

@Module({
  imports: [EmployeeModule],
  providers: [LeaveResolver, LeaveService],
  exports: [LeaveService],
})
export class LeaveModule {}

