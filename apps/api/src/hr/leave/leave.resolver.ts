import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
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
import { LeaveService } from './leave.service';

@Resolver(() => LeavePolicy)
@UseGuards(JwtAuthGuard)
export class LeaveResolver {
  constructor(private readonly leaveService: LeaveService) {}

  // Leave Policy Management
  @Mutation(() => LeavePolicy)
  async createLeavePolicy(
    @Args('createLeavePolicyInput') createLeavePolicyDto: CreateLeavePolicyDto
  ): Promise<LeavePolicy> {
    const result = await this.leaveService.createLeavePolicy(createLeavePolicyDto);
    return result as LeavePolicy;
  }

  @Query(() => [LeavePolicy])
  async leavePolicies(): Promise<LeavePolicy[]> {
    const results = await this.leaveService.findAllLeavePolicies();
    return results as LeavePolicy[];
  }

  @Query(() => LeavePolicy)
  async leavePolicy(
    @Args('id', { type: () => ID }) id: string
  ): Promise<LeavePolicy> {
    const result = await this.leaveService.findLeavePolicy(id);
    return result as LeavePolicy;
  }

  @Mutation(() => LeavePolicy)
  async updateLeavePolicy(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateLeavePolicyInput') updateData: CreateLeavePolicyDto
  ): Promise<LeavePolicy> {
    const result = await this.leaveService.updateLeavePolicy(id, updateData);
    return result as LeavePolicy;
  }

  @Mutation(() => Boolean)
  async deleteLeavePolicy(
    @Args('id', { type: () => ID }) id: string
  ): Promise<boolean> {
    await this.leaveService.deleteLeavePolicy(id);
    return true;
  }

  // Leave Application Management
  @Mutation(() => LeaveApplication)
  async createLeaveApplication(
    @Args('createLeaveApplicationInput')
    createLeaveApplicationDto: CreateLeaveApplicationDto,
    @CurrentUser() _user: any
  ): Promise<LeaveApplication> {
    const result = await this.leaveService.createLeaveApplication(
      createLeaveApplicationDto
    );
    return result as LeaveApplication;
  }

  @Query(() => [LeaveApplication])
  async leaveApplications(
    @Args('employeeId', { nullable: true }) employeeId?: string,
    @Args('status', { type: () => LeaveStatus, nullable: true })
    _status?: LeaveStatus,
    @Args('startDate', { nullable: true }) _startDate?: string,
    @Args('endDate', { nullable: true }) _endDate?: string
  ): Promise<LeaveApplication[]> {
    const results = await this.leaveService.findAllLeaveApplications(employeeId);
    return results as LeaveApplication[];
  }

  @Query(() => LeaveApplication)
  async leaveApplication(
    @Args('id', { type: () => ID }) id: string
  ): Promise<LeaveApplication> {
    const result = await this.leaveService.findLeaveApplication(id);
    return result as LeaveApplication;
  }

  @Mutation(() => LeaveApplication)
  async approveLeaveApplication(
    @Args('id', { type: () => ID }) id: string,
    @Args('approveLeaveInput') approveLeaveDto: ApproveLeaveDto,
    @CurrentUser() user: any
  ): Promise<LeaveApplication> {
    const result = await this.leaveService.approveLeaveApplication(
      id,
      approveLeaveDto,
      user?.id
    );
    return result as LeaveApplication;
  }

  @Mutation(() => LeaveApplication)
  async cancelLeaveApplication(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: any
  ): Promise<LeaveApplication> {
    const result = await this.leaveService.cancelLeaveApplication(id, user?.id);
    return result as LeaveApplication;
  }

  // Leave Balance Management
  @Mutation(() => LeaveBalance)
  async createLeaveBalance(
    @Args('createLeaveBalanceInput')
    createLeaveBalanceDto: CreateLeaveBalanceDto
  ): Promise<LeaveBalance> {
    const result = await this.leaveService.createLeaveBalance(createLeaveBalanceDto);
    return result as LeaveBalance;
  }

  @Query(() => LeaveBalance, { nullable: true })
  async leaveBalance(
    @Args('employeeId') employeeId: string,
    @Args('leavePolicyId') _leavePolicyId: string,
    @Args('year', { type: () => Int, nullable: true }) year?: number
  ): Promise<LeaveBalance | null> {
    const results = await this.leaveService.getLeaveBalance(employeeId, year);
    return results.length > 0 ? (results[0] as LeaveBalance) : null;
  }

  @Query(() => [LeaveBalance])
  async employeeLeaveBalances(
    @Args('employeeId') employeeId: string,
    @Args('year', { type: () => Int, nullable: true }) year?: number
  ): Promise<LeaveBalance[]> {
    const results = await this.leaveService.getEmployeeLeaveBalances(employeeId, year);
    return results as LeaveBalance[];
  }

  @Mutation(() => LeaveBalance)
  async updateLeaveBalance(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateLeaveBalanceInput') updateData: CreateLeaveBalanceDto
  ): Promise<LeaveBalance> {
    const result = await this.leaveService.updateLeaveBalance(id, updateData);
    return result as LeaveBalance;
  }

  @Query(() => [LeaveApplication])
  async leaveCalendar(
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string
  ): Promise<LeaveApplication[]> {
    const results = await this.leaveService.getLeaveCalendar(startDate, endDate);
    return results as LeaveApplication[];
  }

  @Query(() => String)
  async leaveStats(
    @Args('employeeId', { nullable: true }) employeeId?: string,
    @Args('year', { type: () => Int, nullable: true }) _year?: number
  ): Promise<string> {
    const stats = await this.leaveService.getLeaveStats(employeeId);
    return JSON.stringify(stats);
  }
}

