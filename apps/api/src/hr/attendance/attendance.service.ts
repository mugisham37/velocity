import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db, eq, and, gte, lte, desc, asc } from '../../database';
import { attendance, attendanceShifts, employees } from '../../database';
import { EmployeeService } from '../employee/employee.service';
import {
  CreateAttendanceDto,
  CreateShiftDto,
} from './dto/create-attendance.dto';
import { AttendanceStatus } from '../enums';

@Injectable()
export class AttendanceService {
  constructor(private employeeService: EmployeeService) {}

  async createAttendance(
    createAttendanceDto: CreateAttendanceDto,
    _createdBy?: string
  ) {
    const employee = await this.employeeService.findOne(
      createAttendanceDto.employeeId
    );

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Check if attendance already exists for this date
    const existingAttendance = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.employeeId, createAttendanceDto.employeeId),
          eq(attendance.date, createAttendanceDto.date)
        )
      )
      .limit(1);

    if (existingAttendance.length > 0) {
      throw new ConflictException(
        'Attendance record already exists for this date'
      );
    }

    const [newAttendance] = await db
      .insert(attendance)
      .values({
        employeeId: createAttendanceDto.employeeId,
        date: createAttendanceDto.date,
        status: createAttendanceDto.status,
        companyId: employee['companyId'],
        checkInTime: null,
        checkOutTime: null,
        workingHours: null,
        overtimeHours: null,
        lateMinutes: null,
        earlyLeaveMinutes: null,
        shiftId: null,
        location: null,
        notes: null,
        approvedBy: null,
        approvedAt: null,
      })
      .returning();

    return newAttendance;
  }

  async checkIn(
    employeeId: string,
    location?: string,
    latitude?: number,
    longitude?: number,
    deviceId?: string
  ) {
    const employee = await this.employeeService.findOne(employeeId);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const today = new Date().toISOString().split('T')[0];
    if (!today) {
      throw new Error('Unable to get current date');
    }

    // Check if already checked in today
    const existingAttendance = await db
      .select()
      .from(attendance)
      .where(
        and(eq(attendance.employeeId, employeeId), eq(attendance.date, today))
      )
      .limit(1);

    if (existingAttendance.length > 0 && existingAttendance[0]?.checkInTime) {
      throw new ConflictException('Already checked in today');
    }

    const now = new Date();

    if (existingAttendance.length > 0) {
      const attendanceRecord = existingAttendance[0];
      if (!attendanceRecord) {
        throw new NotFoundException('Attendance record not found');
      }

      const [updatedAttendance] = await db
        .update(attendance)
        .set({
          checkInTime: now,
          status: AttendanceStatus.PRESENT,
          location: location
            ? { address: location, latitude, longitude, deviceId }
            : null,
        })
        .where(eq(attendance.id, attendanceRecord.id))
        .returning();

      return updatedAttendance;
    }

    const insertData = {
      employeeId,
      date: today,
      status: AttendanceStatus.PRESENT,
      checkInTime: now,
      checkOutTime: null,
      workingHours: null,
      overtimeHours: null,
      lateMinutes: null,
      earlyLeaveMinutes: null,
      shiftId: null,
      location: location
        ? { address: location, latitude, longitude, deviceId }
        : null,
      notes: null,
      approvedBy: null,
      approvedAt: null,
      companyId: employee['companyId'],
    };

    const [newAttendance] = await db
      .insert(attendance)
      .values(insertData)
      .returning();

    return newAttendance;
  }

  async checkOut(employeeId: string) {
    const today = new Date().toISOString().split('T')[0];
    if (!today) {
      throw new Error('Unable to get current date');
    }

    const existingAttendance = await db
      .select()
      .from(attendance)
      .where(
        and(eq(attendance.employeeId, employeeId), eq(attendance.date, today))
      )
      .limit(1);

    if (existingAttendance.length === 0) {
      throw new NotFoundException('No check-in record found for today');
    }

    const attendanceRecord = existingAttendance[0];
    if (!attendanceRecord) {
      throw new NotFoundException('Attendance record not found');
    }

    if (attendanceRecord.checkOutTime) {
      throw new ConflictException('Already checked out today');
    }

    const now = new Date();

    // Calculate hours worked
    let workingHours = 0;
    let overtimeHours = 0;

    if (attendanceRecord.checkInTime) {
      const checkInTime = new Date(attendanceRecord.checkInTime);
      const hoursWorked = (now.getTime() - checkInTime.getTime()) / (1000 * 60);
      workingHours = Math.round(hoursWorked);

      // Calculate overtime if applicable (standard 8 hours = 480 minutes)
      const standardMinutes = 480;
      if (hoursWorked > standardMinutes) {
        overtimeHours = Math.round(hoursWorked - standardMinutes);
      }
    }

    const [updatedAttendance] = await db
      .update(attendance)
      .set({
        checkOutTime: now,
        workingHours,
        overtimeHours,
      })
      .where(eq(attendance.id, attendanceRecord.id))
      .returning();

    return updatedAttendance;
  }

  async getAttendanceByEmployee(
    employeeId: string,
    startDate?: string,
    endDate?: string
  ) {
    const conditions = [eq(attendance.employeeId, employeeId)];

    if (startDate) {
      conditions.push(gte(attendance.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(attendance.date, endDate));
    }

    return await db
      .select()
      .from(attendance)
      .where(and(...conditions))
      .orderBy(desc(attendance.date));
  }

  async getAttendanceByDateRange(startDate: string, endDate: string) {
    const results = await db
      .select({
        attendance,
        employee: employees,
      })
      .from(attendance)
      .leftJoin(employees, eq(attendance.employeeId, employees.id))
      .where(
        and(gte(attendance.date, startDate), lte(attendance.date, endDate))
      )
      .orderBy(desc(attendance.date), asc(employees.lastName));

    // Transform the results to match the expected return type
    return results.map(result => result.attendance);
  }

  async getAttendanceStats(employeeId?: string, month?: number, year?: number) {
    let query = db
      .select()
      .from(attendance)
      .leftJoin(employees, eq(attendance.employeeId, employees.id));

    const conditions = [];

    if (employeeId) {
      conditions.push(eq(attendance.employeeId, employeeId));
    }

    if (month && year) {
      // For date filtering, we'll need to construct date range
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month
      
      if (startDate && endDate) {
        conditions.push(gte(attendance.date, startDate));
        conditions.push(lte(attendance.date, endDate));
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const records = await query;

    const stats = {
      totalDays: records.length,
      present: records.filter(
        (r: any) => r.attendance.status === AttendanceStatus.PRESENT
      ).length,
      absent: records.filter(
        (r: any) => r.attendance.status === AttendanceStatus.ABSENT
      ).length,
      late: records.filter(
        (r: any) => r.attendance.status === AttendanceStatus.LATE
      ).length,
      halfDay: records.filter(
        (r: any) => r.attendance.status === AttendanceStatus.HALF_DAY
      ).length,
      onLeave: records.filter(
        (r: any) => r.attendance.status === AttendanceStatus.LEAVE
      ).length,
      totalHours: records.reduce(
        (sum: number, r: any) => sum + (r.attendance.workingHours || 0),
        0
      ),
      totalOvertimeHours: records.reduce(
        (sum: number, r: any) => sum + (r.attendance.overtimeHours || 0),
        0
      ),
    };

    return stats;
  }

  // Shift Management
  async createShift(createShiftDto: CreateShiftDto) {
    const [shift] = await db
      .insert(attendanceShifts)
      .values(createShiftDto)
      .returning();
    return shift;
  }

  async findAllShifts() {
    return await db
      .select()
      .from(attendanceShifts)
      .where(eq(attendanceShifts.isActive, true))
      .orderBy(asc(attendanceShifts.name));
  }

  async findShift(id: string) {
    const shifts = await db
      .select()
      .from(attendanceShifts)
      .where(eq(attendanceShifts.id, id))
      .limit(1);

    if (shifts.length === 0) {
      throw new NotFoundException('Shift not found');
    }
    
    const shift = shifts[0];
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }
    
    return shift;
  }

  async updateShift(id: string, updateData: Partial<CreateShiftDto>) {
    // First check if shift exists
    await this.findShift(id);
    
    const [updatedShift] = await db
      .update(attendanceShifts)
      .set(updateData)
      .where(eq(attendanceShifts.id, id))
      .returning();

    if (!updatedShift) {
      throw new NotFoundException('Shift not found');
    }
    return updatedShift;
  }

  async deleteShift(id: string): Promise<void> {
    const [updatedShift] = await db
      .update(attendanceShifts)
      .set({ isActive: false })
      .where(eq(attendanceShifts.id, id))
      .returning();

    if (!updatedShift) {
      throw new NotFoundException('Shift not found');
    }
  }
}

