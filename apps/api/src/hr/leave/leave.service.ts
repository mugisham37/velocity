import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db, eq, and, gte, lte, desc } from '@kiro/database';
import { leavePolicies, leaveRequests, leaveBalances } from '@kiro/database';
import { EmployeeService } from '../employee/employee.service';
import {
  ApproveLeaveDto,
  CreateLeaveApplicationDto,
  CreateLeaveBalanceDto,
  CreateLeavePolicyDto,
} from './dto/create-leave.dto';
import { LeaveStatus } from '../enums';

@Injectable()
export class LeaveService {
  constructor(private employeeService: EmployeeService) {}

  // Leave Policy Management
  async createLeavePolicy(createLeavePolicyDto: CreateLeavePolicyDto) {
    const [policy] = await db
      .insert(leavePolicies)
      .values(createLeavePolicyDto)
      .returning();
    return policy;
  }

  async findAllLeavePolicies() {
    return await db
      .select()
      .from(leavePolicies)
      .where(eq(leavePolicies.isActive, true))
      .orderBy(leavePolicies.name);
  }

  async findLeavePolicy(id: string) {
    const policies = await db
      .select()
      .from(leavePolicies)
      .where(eq(leavePolicies.id, id))
      .limit(1);

    if (policies.length === 0) {
      throw new NotFoundException('Leave policy not found');
    }

    return policies[0];
  }

  // Leave Application Management
  async createLeaveApplication(createLeaveApplicationDto: CreateLeaveApplicationDto) {
    const employee = await this.employeeService.findOne(createLeaveApplicationDto.employeeId);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    await this.findLeavePolicy(createLeaveApplicationDto.leavePolicyId);

    const appliedDate = new Date().toISOString().split('T')[0];
    if (!appliedDate) {
      throw new Error('Unable to get current date');
    }

    const insertData = {
      employeeId: createLeaveApplicationDto.employeeId,
      leavePolicyId: createLeaveApplicationDto.leavePolicyId,
      startDate: createLeaveApplicationDto.startDate,
      endDate: createLeaveApplicationDto.endDate,
      daysRequested: createLeaveApplicationDto.daysRequested,
      reason: createLeaveApplicationDto.reason,
      companyId: createLeaveApplicationDto.companyId,
      status: LeaveStatus.PENDING,
      appliedDate,
      isHalfDay: createLeaveApplicationDto.isHalfDay || false,
      halfDayPeriod: createLeaveApplicationDto.halfDayPeriod || null,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      attachments: null,
    };

    const [application] = await db
      .insert(leaveRequests)
      .values(insertData)
      .returning();

    return application;
  }

  async findAllLeaveApplications(employeeId?: string) {
    let query = db
      .select()
      .from(leaveRequests)
      .orderBy(desc(leaveRequests.appliedDate));

    if (employeeId) {
      query = query.where(eq(leaveRequests.employeeId, employeeId));
    }

    return await query;
  }

  async approveLeave(id: string, approveLeaveDto: ApproveLeaveDto, approvedBy: string) {
    const applications = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, id))
      .limit(1);

    if (applications.length === 0) {
      throw new NotFoundException('Leave application not found');
    }

    const application = applications[0];
    if (!application) {
      throw new NotFoundException('Leave application not found');
    }

    if (application.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Leave application is not in pending status');
    }

    const [updatedApplication] = await db
      .update(leaveRequests)
      .set({
        status: approveLeaveDto.status,
        approvedBy,
        approvedAt: new Date(),
        rejectionReason: approveLeaveDto.status === LeaveStatus.REJECTED 
          ? (approveLeaveDto as any).approverComments 
          : null,
      })
      .where(eq(leaveRequests.id, id))
      .returning();

    return updatedApplication;
  }

  // Add missing methods
  async updateLeavePolicy(id: string, updateData: Partial<CreateLeavePolicyDto>) {
    const [updatedPolicy] = await db
      .update(leavePolicies)
      .set(updateData)
      .where(eq(leavePolicies.id, id))
      .returning();

    if (!updatedPolicy) {
      throw new NotFoundException('Leave policy not found');
    }
    return updatedPolicy;
  }

  async deleteLeavePolicy(id: string): Promise<void> {
    const [updatedPolicy] = await db
      .update(leavePolicies)
      .set({ isActive: false })
      .where(eq(leavePolicies.id, id))
      .returning();

    if (!updatedPolicy) {
      throw new NotFoundException('Leave policy not found');
    }
  }

  async findLeaveApplication(id: string) {
    const applications = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, id))
      .limit(1);

    if (applications.length === 0) {
      throw new NotFoundException('Leave application not found');
    }

    const result = applications[0];
    if (!result) {
      throw new NotFoundException('Leave application not found');
    }

    return result;
  }

  async approveLeaveApplication(id: string, approveLeaveDto: ApproveLeaveDto, approvedBy: string) {
    return this.approveLeave(id, approveLeaveDto, approvedBy);
  }

  async cancelLeaveApplication(id: string, cancelledBy: string) {
    const [updatedApplication] = await db
      .update(leaveRequests)
      .set({
        status: LeaveStatus.CANCELLED,
        approvedBy: cancelledBy,
        approvedAt: new Date(),
      })
      .where(eq(leaveRequests.id, id))
      .returning();

    if (!updatedApplication) {
      throw new NotFoundException('Leave application not found');
    }

    return updatedApplication;
  }

  async getEmployeeLeaveBalances(employeeId: string, year?: number) {
    const currentYear = year || new Date().getFullYear();
    
    return await db
      .select()
      .from(leaveBalances)
      .where(
        and(
          eq(leaveBalances.employeeId, employeeId),
          eq(leaveBalances.year, currentYear)
        )
      );
  }

  async updateLeaveBalance(id: string, updateData: Partial<CreateLeaveBalanceDto>) {
    const [updatedBalance] = await db
      .update(leaveBalances)
      .set(updateData)
      .where(eq(leaveBalances.id, id))
      .returning();

    if (!updatedBalance) {
      throw new NotFoundException('Leave balance not found');
    }
    return updatedBalance;
  }

  async getLeaveCalendar(startDate: string, endDate: string) {
    return await db
      .select()
      .from(leaveRequests)
      .where(
        and(
          gte(leaveRequests.startDate, startDate),
          lte(leaveRequests.endDate, endDate),
          eq(leaveRequests.status, LeaveStatus.APPROVED)
        )
      )
      .orderBy(leaveRequests.startDate);
  }

  // Leave Balance Management
  async createLeaveBalance(createLeaveBalanceDto: CreateLeaveBalanceDto) {
    const [balance] = await db
      .insert(leaveBalances)
      .values({
        ...createLeaveBalanceDto,
        used: 0,
        pending: 0,
        carriedForward: createLeaveBalanceDto.carriedForward || 0,
        year: createLeaveBalanceDto.year || new Date().getFullYear(),
      })
      .returning();

    return balance;
  }

  async getLeaveBalance(employeeId: string, year?: number) {
    const currentYear = year || new Date().getFullYear();
    
    return await db
      .select()
      .from(leaveBalances)
      .where(
        and(
          eq(leaveBalances.employeeId, employeeId),
          eq(leaveBalances.year, currentYear)
        )
      );
  }

  async getLeaveStats(employeeId?: string) {
    let query = db.select().from(leaveRequests);

    if (employeeId) {
      query = query.where(eq(leaveRequests.employeeId, employeeId));
    }

    const applications = await query;

    const stats = {
      total: applications.length,
      pending: applications.filter(app => app.status === LeaveStatus.PENDING).length,
      approved: applications.filter(app => app.status === LeaveStatus.APPROVED).length,
      rejected: applications.filter(app => app.status === LeaveStatus.REJECTED).length,
      cancelled: applications.filter(app => app.status === LeaveStatus.CANCELLED).length,
    };

    return stats;
  }
}