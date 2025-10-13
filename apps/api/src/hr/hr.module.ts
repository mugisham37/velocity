import { Module } from '@nestjs/common';
import { AttendanceModule } from './attendance/attendance.module';
import { EmployeeModule } from './employee/employee.module';
import { LeaveModule } from './leave/leave.module';
import { PayrollModule } from './payroll/payroll.module';

@Module({
  imports: [EmployeeModule, AttendanceModule, LeaveModule, PayrollModule],
  exports: [EmployeeModule, AttendanceModule, LeaveModule, PayrollModule],
})
export class HrModule {}

