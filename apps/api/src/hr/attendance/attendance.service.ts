import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { EmployeeService } from '../employee/employee.service';
import {
  CreateAttendanceDto,
  CreateShiftDto,
} from './dto/create-attendance.dto';
import {
  AttendanceRecord,
  AttendanceStatus,
  Shift,
} from './entities/attendance.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceRecord)
    private attendanceRepository: Repository<AttendanceRecord>,
    @InjectRepository(Shift)
    private shiftRepository: Repository<Shift>,
    private employeeService: EmployeeService
  ) {}

  async createAttendance(
    createAttendanceDto: CreateAttendanceDto,
    createdBy?: string
  ): Promise<AttendanceRecord> {
    const employee = await this.employeeService.findOne(
      createAttendanceDto.employeeId
    );

    // Check if attendance already exists for this date
    const existingAttendance = await this.attendanceRepository.findOne({
      where: {
        employee: { id: createAttendanceDto.employeeId },
        date: new Date(createAttendanceDto.date),
      },
    });

    if (existingAttendance) {
      throw new ConflictException(
        'Attendance record already exists for this date'
      );
    }

    const attendance = this.attendanceRepository.create({
      ...createAttendanceDto,
      employee,
      date: new Date(createAttendanceDto.date),
      createdBy,
    });

    return this.attendanceRepository.save(attendance);
  }

  async checkIn(
    employeeId: string,
    location?: string,
    latitude?: number,
    longitude?: number,
    deviceId?: string
  ): Promise<AttendanceRecord> {
    const employee = await this.employeeService.findOne(employeeId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existingAttendance = await this.attendanceRepository.findOne({
      where: {
        employee: { id: employeeId },
        date: today,
      },
    });

    if (existingAttendance && existingAttendance.checkInTime) {
      throw new ConflictException('Already checked in today');
    }

    const now = new Date();
    const checkInTime = now.toTimeString().slice(0, 8);

    if (existingAttendance) {
      existingAttendance.checkInTime = checkInTime;
      existingAttendance.status = AttendanceStatus.PRESENT;
      existingAttendance.location = location;
      existingAttendance.latitude = latitude;
      existingAttendance.longitude = longitude;
      existingAttendance.deviceId = deviceId;
      return this.attendanceRepository.save(existingAttendance);
    }

    const attendance = this.attendanceRepository.create({
      employee,
      date: today,
      status: AttendanceStatus.PRESENT,
      checkInTime,
      location,
      latitude,
      longitude,
      deviceId,
    });

    return this.attendanceRepository.save(attendance);
  }

  async checkOut(employeeId: string): Promise<AttendanceRecord> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.attendanceRepository.findOne({
      where: {
        employee: { id: employeeId },
        date: today,
      },
    });

    if (!attendance) {
      throw new NotFoundException('No check-in record found for today');
    }

    if (attendance.checkOutTime) {
      throw new ConflictException('Already checked out today');
    }

    const now = new Date();
    const checkOutTime = now.toTimeString().slice(0, 8);

    attendance.checkOutTime = checkOutTime;

    // Calculate hours worked
    if (attendance.checkInTime) {
      const checkIn = new Date(`1970-01-01T${attendance.checkInTime}`);
      const checkOut = new Date(`1970-01-01T${checkOutTime}`);
      const hoursWorked =
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      attendance.hoursWorked = Math.round(hoursWorked * 100) / 100;

      // Calculate overtime if applicable
      const standardHours = 8; // Configurable
      if (hoursWorked > standardHours) {
        attendance.overtimeHours =
          Math.round((hoursWorked - standardHours) * 100) / 100;
      }
    }

    return this.attendanceRepository.save(attendance);
  }

  async getAttendanceByEmployee(
    employeeId: string,
    startDate?: string,
    endDate?: string
  ): Promise<AttendanceRecord[]> {
    const where: any = { employee: { id: employeeId } };

    if (startDate && endDate) {
      where.date = Between(new Date(startDate), new Date(endDate));
    }

    return this.attendanceRepository.find({
      where,
      order: { date: 'DESC' },
    });
  }

  async getAttendanceByDateRange(
    startDate: string,
    endDate: string
  ): Promise<AttendanceRecord[]> {
    return this.attendanceRepository.find({
      where: {
        date: Between(new Date(startDate), new Date(endDate)),
      },
      relations: ['employee'],
      order: { date: 'DESC', employee: { lastName: 'ASC' } },
    });
  }

  async getAttendanceStats(
    employeeId?: string,
    month?: number,
    year?: number
  ): Promise<any> {
    let query = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee');

    if (employeeId) {
      query = query.where('employee.id = :employeeId', { employeeId });
    }

    if (month && year) {
      query = query
        .andWhere('EXTRACT(MONTH FROM attendance.date) = :month', { month })
        .andWhere('EXTRACT(YEAR FROM attendance.date) = :year', { year });
    }

    const records = await query.getMany();

    const stats = {
      totalDays: records.length,
      present: records.filter(r => r.status === AttendanceStatus.PRESENT)
        .length,
      absent: records.filter(r => r.status === AttendanceStatus.ABSENT).length,
      late: records.filter(r => r.status === AttendanceStatus.LATE).length,
      halfDay: records.filter(r => r.status === AttendanceStatus.HALF_DAY)
        .length,
      onLeave: records.filter(r => r.status === AttendanceStatus.ON_LEAVE)
        .length,
      totalHours: records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0),
      totalOvertimeHours: records.reduce(
        (sum, r) => sum + (r.overtimeHours || 0),
        0
      ),
    };

    return stats;
  }

  // Shift Management
  async createShift(createShiftDto: CreateShiftDto): Promise<Shift> {
    const shift = this.shiftRepository.create(createShiftDto);
    return this.shiftRepository.save(shift);
  }

  async findAllShifts(): Promise<Shift[]> {
    return this.shiftRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findShift(id: string): Promise<Shift> {
    const shift = await this.shiftRepository.findOne({ where: { id } });
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }
    return shift;
  }

  async updateShift(
    id: string,
    updateData: Partial<CreateShiftDto>
  ): Promise<Shift> {
    await this.shiftRepository.update(id, updateData);
    return this.findShift(id);
  }

  async deleteShift(id: string): Promise<void> {
    const shift = await this.findShift(id);
    shift.isActive = false;
    await this.shiftRepository.save(shift);
  }
}
