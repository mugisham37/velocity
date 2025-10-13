import { Module } from '@nestjs/common';
import { EmployeeModule } from '../employee/employee.module';
import { AttendanceResolver } from './attendance.resolver';
import { AttendanceService } from './attendance.service';

@Module({
  imports: [EmployeeModule],
  providers: [AttendanceResolver, AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}

