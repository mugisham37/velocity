import { Module } from '@nestjs/common';
import { AttendanceModule } from '../attendance/attendance.module';
import { EmployeeModule } from '../employee/employee.module';
import { PayrollResolver } from './payroll.resolver';
import { PayrollService } from './payroll.service';

@Module({
  imports: [EmployeeModule, AttendanceModule],
  providers: [PayrollResolver, PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}
