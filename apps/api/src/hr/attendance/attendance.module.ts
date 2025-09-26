import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeModule } from '../employee/employee.module';
import { AttendanceResolver } from './attendance.resolver';
import { AttendanceService } from './attendance.service';
import { AttendanceRecord, Shift } from './entities/attendance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AttendanceRecord, Shift]),
    EmployeeModule,
  ],
  providers: [AttendanceResolver, AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
