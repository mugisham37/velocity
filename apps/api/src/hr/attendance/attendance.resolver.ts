import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AttendanceService } from './attendance.service';
import {
  CreateAttendanceDto,
  CreateShiftDto,
} from './dto/create-attendance.dto';
import { AttendanceRecord, Shift } from './entities/attendance.entity';

@Resolver(() => AttendanceRecord)
@UseGuards(JwtAuthGuard)
export class AttendanceResolver {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Mutation(() => AttendanceRecord)
  async createAttendance(
    @Args('createAttendanceInput') createAttendanceDto: CreateAttendanceDto,
    @CurrentUser() user: any
  ): Promise<AttendanceRecord> {
    const result = await this.attendanceService.createAttendance(
      createAttendanceDto,
      user?.id
    );
    return result as AttendanceRecord;
  }

  @Mutation(() => AttendanceRecord)
  async checkIn(
    @Args('employeeId') employeeId: string,
    @Args('location', { nullable: true }) location?: string,
    @Args('latitude', { nullable: true }) latitude?: number,
    @Args('longitude', { nullable: true }) longitude?: number,
    @Args('deviceId', { nullable: true }) deviceId?: string
  ): Promise<AttendanceRecord> {
    const result = await this.attendanceService.checkIn(
      employeeId,
      location,
      latitude,
      longitude,
      deviceId
    );
    return result as AttendanceRecord;
  }

  @Mutation(() => AttendanceRecord)
  async checkOut(
    @Args('employeeId') employeeId: string
  ): Promise<AttendanceRecord> {
    const result = await this.attendanceService.checkOut(employeeId);
    return result as AttendanceRecord;
  }

  @Query(() => [AttendanceRecord])
  async attendanceByEmployee(
    @Args('employeeId') employeeId: string,
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string
  ): Promise<AttendanceRecord[]> {
    const results = await this.attendanceService.getAttendanceByEmployee(
      employeeId,
      startDate,
      endDate
    );
    return results as AttendanceRecord[];
  }

  @Query(() => [AttendanceRecord])
  async attendanceByDateRange(
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string
  ): Promise<AttendanceRecord[]> {
    const results = await this.attendanceService.getAttendanceByDateRange(
      startDate,
      endDate
    );
    return results as AttendanceRecord[];
  }

  @Query(() => String)
  async attendanceStats(
    @Args('employeeId', { nullable: true }) employeeId?: string,
    @Args('month', { nullable: true }) month?: number,
    @Args('year', { nullable: true }) year?: number
  ): Promise<string> {
    const stats = await this.attendanceService.getAttendanceStats(
      employeeId,
      month,
      year
    );
    return JSON.stringify(stats);
  }

  // Shift Management
  @Mutation(() => Shift)
  async createShift(
    @Args('createShiftInput') createShiftDto: CreateShiftDto
  ): Promise<Shift> {
    const result = await this.attendanceService.createShift(createShiftDto);
    return result as Shift;
  }

  @Query(() => [Shift])
  async shifts(): Promise<Shift[]> {
    const results = await this.attendanceService.findAllShifts();
    return results as Shift[];
  }

  @Query(() => Shift)
  async shift(@Args('id', { type: () => ID }) id: string): Promise<Shift> {
    const result = await this.attendanceService.findShift(id);
    return result as Shift;
  }

  @Mutation(() => Shift)
  async updateShift(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateShiftInput') updateData: CreateShiftDto
  ): Promise<Shift> {
    const result = await this.attendanceService.updateShift(id, updateData);
    return result as Shift;
  }

  @Mutation(() => Boolean)
  async deleteShift(
    @Args('id', { type: () => ID }) id: string
  ): Promise<boolean> {
    await this.attendanceService.deleteShift(id);
    return true;
  }
}

