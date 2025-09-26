import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceModule } from '../attendance/attendance.module';
import { EmployeeModule } from '../employee/employee.module';
import {
  PayrollEntry,
  PayrollEntryComponent,
  PayrollRun,
  SalaryComponent,
  SalaryStructure,
  SalaryStructureComponent,
} from './entities/payroll.entity';
import { PayrollResolver } from './payroll.resolver';
import { PayrollService } from './payroll.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalaryComponent,
      SalaryStructure,
      SalaryStructureComponent,
      PayrollRun,
      PayrollEntry,
      PayrollEntryComponent,
    ]),
    EmployeeModule,
    AttendanceModule,
  ],
  providers: [PayrollResolver, PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}
