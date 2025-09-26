import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { EmployeeService } from '../employee/employee.service';
import {
  ApproveLeaveDto,
  CreateLeaveApplicationDto,
  CreateLeaveBalanceDto,
  CreateLeavePolicyDto,
} from './dto/create-leave.dto';
import {
  LeaveApplication,
  LeaveBalance,
  LeavePolicy,
  LeaveStatus,
} from './entities/leave.entity';

@Injectable()
export class LeaveService {
  constructor(
    @InjectRepository(LeavePolicy)
    private leavePolicyRepository: Repository<LeavePolicy>,
    @InjectRepository(LeaveApplication)
    private leaveApplicationRepository: Repository<LeaveApplication>,
    @InjectRepository(LeaveBalance)
    private leaveBalanceRepository: Repository<LeaveBalance>,
    private employeeService: EmployeeService
  ) {}

  // Leave Policy Management
  async createLeavePolicy(
    createLeavePolicyDto: CreateLeavePolicyDto
  ): Promise<LeavePolicy> {
    const policy = this.leavePolicyRepository.create(createLeavePolicyDto);
    return this.leavePolicyRepository.save(policy);
  }

  async findAllLeavePolicies(): Promise<LeavePolicy[]> {
    return this.leavePolicyRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findLeavePolicy(id: string): Promise<LeavePolicy> {
    const policy = await this.leavePolicyRepository.findOne({ where: { id } });
    if (!policy) {
      throw new NotFoundException('Leave policy not found');
    }
    return policy;
  }

  async updateLeavePolicy(
    id: string,
    updateData: Partial<CreateLeavePolicyDto>
  ): Promise<LeavePolicy> {
    await this.leavePolicyRepository.update(id, updateData);
    return this.findLeavePolicy(id);
  }

  async deleteLeavePolicy(id: string): Promise<void> {
    const policy = await this.findLeavePolicy(id);
    policy.isActive = false;
    await this.leavePolicyRepository.save(policy);
  }

  // Leave Application Management
  async createLeaveApplication(
    createLeaveApplicationDto: CreateLeaveApplicationDto,
    createdBy?: string
  ): Promise<LeaveApplication> {
    const employee = await this.employeeService.findOne(
      createLeaveApplicationDto.employeeId
    );
    const leavePolicy = await this.findLeavePolicy(
      createLeaveApplicationDto.leavePolicyId
    );

    // Check if employee has sufficient leave balance
    const balance = await this.getLeaveBalance(
      createLeaveApplicationDto.employeeId,
      createLeaveApplicationDto.leavePolicyId
    );
    if (
      balance &&
      balance.available < createLeaveApplicationDto.daysRequested
    ) {
      throw new BadRequestException('Insufficient leave balance');
    }

    // Check for overlapping leave applications
    const overlapping = await this.leaveApplicationRepository.findOne({
      where: {
        employee: { id: createLeaveApplicationDto.employeeId },
        status: LeaveStatus.APPROVED,
        startDate: Between(
          new Date(createLeaveApplicationDto.startDate),
          new Date(createLeaveApplicationDto.endDate)
        ),
      },
    });

    if (overlapping) {
      throw new ConflictException(
        'Leave application overlaps with existing approved leave'
      );
    }

    const application = this.leaveApplicationRepository.create({
      ...createLeaveApplicationDto,
      employee,
      leavePolicy,
      startDate: new Date(createLeaveApplicationDto.startDate),
      endDate: new Date(createLeaveApplicationDto.endDate),
      createdBy,
    });

    const savedApplication =
      await this.leaveApplicationRepository.save(application);

    // Update pending balance
    if (balance) {
      balance.pending += createLeaveApplicationDto.daysRequested;
      await this.leaveBalanceRepository.save(balance);
    }

    return savedApplication;
  }

  async findAllLeaveApplications(
    employeeId?: string,
    status?: LeaveStatus,
    startDate?: string,
    endDate?: string
  ): Promise<LeaveApplication[]> {
    const where: any = {};

    if (employeeId) {
      where.employee = { id: employeeId };
    }

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.startDate = Between(new Date(startDate), new Date(endDate));
    }

    return this.leaveApplicationRepository.find({
      where,
      relations: ['employee', 'leavePolicy', 'approvedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findLeaveApplication(id: string): Promise<LeaveApplication> {
    const application = await this.leaveApplicationRepository.findOne({
      where: { id },
      relations: ['employee', 'leavePolicy', 'approvedBy'],
    });

    if (!application) {
      throw new NotFoundException('Leave application not found');
    }

    return application;
  }

  async approveLeaveApplication(
    id: string,
    approveLeaveDto: ApproveLeaveDto,
    approvedById?: string
  ): Promise<LeaveApplication> {
    const application = await this.findLeaveApplication(id);

    if (application.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        'Leave application is not in pending status'
      );
    }

    const approvedBy = approvedById
      ? await this.employeeService.findOne(approvedById)
      : undefined;

    application.status = approveLeaveDto.status;
    application.approverComments = approveLeaveDto.approverComments;
    application.approvedBy = approvedBy;
    application.approvedAt = new Date();

    const savedApplication =
      await this.leaveApplicationRepository.save(application);

    // Update leave balance
    const balance = await this.getLeaveBalance(
      application.employee.id,
      application.leavePolicy.id
    );
    if (balance) {
      balance.pending -= application.daysRequested;

      if (approveLeaveDto.status === LeaveStatus.APPROVED) {
        balance.used += application.daysRequested;
      }

      await this.leaveBalanceRepository.save(balance);
    }

    return savedApplication;
  }

  async cancelLeaveApplication(
    id: string,
    updatedBy?: string
  ): Promise<LeaveApplication> {
    const application = await this.findLeaveApplication(id);

    if (application.status === LeaveStatus.CANCELLED) {
      throw new BadRequestException('Leave application is already cancelled');
    }

    application.status = LeaveStatus.CANCELLED;
    application.updatedBy = updatedBy;

    const savedApplication =
      await this.leaveApplicationRepository.save(application);

    // Update leave balance
    const balance = await this.getLeaveBalance(
      application.employee.id,
      application.leavePolicy.id
    );
    if (balance) {
      if (application.status === LeaveStatus.PENDING) {
        balance.pending -= application.daysRequested;
      } else if (application.status === LeaveStatus.APPROVED) {
        balance.used -= application.daysRequested;
      }

      await this.leaveBalanceRepository.save(balance);
    }

    return savedApplication;
  }

  // Leave Balance Management
  async createLeaveBalance(
    createLeaveBalanceDto: CreateLeaveBalanceDto
  ): Promise<LeaveBalance> {
    const employee = await this.employeeService.findOne(
      createLeaveBalanceDto.employeeId
    );
    const leavePolicy = await this.findLeavePolicy(
      createLeaveBalanceDto.leavePolicyId
    );

    // Check if balance already exists for this year
    const year = createLeaveBalanceDto.year || new Date().getFullYear();
    const existingBalance = await this.leaveBalanceRepository.findOne({
      where: {
        employee: { id: createLeaveBalanceDto.employeeId },
        leavePolicy: { id: createLeaveBalanceDto.leavePolicyId },
        year,
      },
    });

    if (existingBalance) {
      throw new ConflictException('Leave balance already exists for this year');
    }

    const balance = this.leaveBalanceRepository.create({
      ...createLeaveBalanceDto,
      employee,
      leavePolicy,
      year,
    });

    return this.leaveBalanceRepository.save(balance);
  }

  async getLeaveBalance(
    employeeId: string,
    leavePolicyId: string,
    year?: number
  ): Promise<LeaveBalance | null> {
    const currentYear = year || new Date().getFullYear();

    return this.leaveBalanceRepository.findOne({
      where: {
        employee: { id: employeeId },
        leavePolicy: { id: leavePolicyId },
        year: currentYear,
      },
      relations: ['employee', 'leavePolicy'],
    });
  }

  async getEmployeeLeaveBalances(
    employeeId: string,
    year?: number
  ): Promise<LeaveBalance[]> {
    const currentYear = year || new Date().getFullYear();

    return this.leaveBalanceRepository.find({
      where: {
        employee: { id: employeeId },
        year: currentYear,
      },
      relations: ['employee', 'leavePolicy'],
      order: { leavePolicy: { name: 'ASC' } },
    });
  }

  async updateLeaveBalance(
    id: string,
    updateData: Partial<CreateLeaveBalanceDto>
  ): Promise<LeaveBalance> {
    await this.leaveBalanceRepository.update(id, updateData);
    const balance = await this.leaveBalanceRepository.findOne({
      where: { id },
      relations: ['employee', 'leavePolicy'],
    });

    if (!balance) {
      throw new NotFoundException('Leave balance not found');
    }

    return balance;
  }

  async getLeaveCalendar(
    startDate: string,
    endDate: string
  ): Promise<LeaveApplication[]> {
    return this.leaveApplicationRepository.find({
      where: {
        status: LeaveStatus.APPROVED,
        startDate: Between(new Date(startDate), new Date(endDate)),
      },
      relations: ['employee', 'leavePolicy'],
      order: { startDate: 'ASC' },
    });
  }

  async getLeaveStats(employeeId?: string, year?: number): Promise<any> {
    const currentYear = year || new Date().getFullYear();
    let query = this.leaveApplicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.employee', 'employee')
      .leftJoinAndSelect('application.leavePolicy', 'policy')
      .where('EXTRACT(YEAR FROM application.startDate) = :year', {
        year: currentYear,
      });

    if (employeeId) {
      query = query.andWhere('employee.id = :employeeId', { employeeId });
    }

    const applications = await query.getMany();

    const stats = {
      totalApplications: applications.length,
      approved: applications.filter(a => a.status === LeaveStatus.APPROVED)
        .length,
      pending: applications.filter(a => a.status === LeaveStatus.PENDING)
        .length,
      rejected: applications.filter(a => a.status === LeaveStatus.REJECTED)
        .length,
      cancelled: applications.filter(a => a.status === LeaveStatus.CANCELLED)
        .length,
      totalDaysRequested: applications.reduce(
        (sum, a) => sum + a.daysRequested,
        0
      ),
      totalDaysApproved: applications
        .filter(a => a.status === LeaveStatus.APPROVED)
        .reduce((sum, a) => sum + a.daysRequested, 0),
      byLeaveType: {},
    };

    // Group by leave type
    applications.forEach(app => {
      const type = app.leavePolicy.leaveType;
      if (!stats.byLeaveType[type]) {
        stats.byLeaveType[type] = {
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
        };
      }

      stats.byLeaveType[type].total += app.daysRequested;
      if (app.status === LeaveStatus.APPROVED) {
        stats.byLeaveType[type].approved += app.daysRequested;
      } else if (app.status === LeaveStatus.PENDING) {
        stats.byLeaveType[type].pending += app.daysRequested;
      } else if (app.status === LeaveStatus.REJECTED) {
        stats.byLeaveType[type].rejected += app.daysRequested;
      }
    });

    return stats;
  }
}
