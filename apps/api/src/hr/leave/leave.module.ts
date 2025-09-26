import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeModule } from '../employee/employee.module';
import {
  LeaveApplication,
  LeaveBalance,
  LeavePolicy,
} from './entities/leave.entity';
import { LeaveResolver } from './leave.resolver';
import { LeaveService } from './leave.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeavePolicy, LeaveApplication, LeaveBalance]),
    EmployeeModule,
  ],
  providers: [LeaveResolver, LeaveService],
  exports: [LeaveService],
})
export class LeaveModule {}
