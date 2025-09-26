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
    return this.leaveService.createLeavePolicy(createLeavePolicyDto);
  }

  @Query(() => [LeavePolicy])
  async leavePolicies(): Promise<LeavePolicy[]> {
    return this.leaveService.findAllLeavePolicies();
  }

  @Query(() => LeavePolicy)
  async leavePolicy(
    @Args('id', { type: () => ID }) id: string
  ): Promise<LeavePolicy> {
    return this.leaveService.findLeavePolicy(id);
  }

  @Mutation(() => LeavePolicy)
  async updateLeavePolicy(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateLeavePolicyInput') updateData: CreateLeavePolicyDto
  ): Promise<LeavePolicy> {
    return this.leaveService.updateLeavePolicy(id, updateData);
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
    @CurrentUser() user: any
  ): Promise<LeaveApplication> {
    return this.leaveService.createLeaveApplication(
      createLeaveApplicationDto,
      user?.id
    );
  }

  @Query(() => [LeaveApplication])
  async leaveApplications(
    @Args('employeeId', { nullable: true }) employeeId?: string,
    @Args('status', { type: () => LeaveStatus, nullable: true })
    status?: LeaveStatus,
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string
  ): Promise<LeaveApplication[]> {
    return this.leaveService.findAllLeaveApplications(
      employeeId,
      status,
      startDate,
      endDate
    );
  }

  @Query(() => LeaveApplication)
  async leaveApplication(
    @Args('id', { type: () => ID }) id: string
  ): Promise<LeaveApplication> {
    return this.leaveService.findLeaveApplication(id);
  }

  @Mutation(() => LeaveApplication)
  async approveLeaveApplication(
    @Args('id', { type: () => ID }) id: string,
    @Args('approveLeaveInput') approveLeaveDto: ApproveLeaveDto,
    @CurrentUser() user: any
  ): Promise<LeaveApplication> {
    return this.leaveService.approveLeaveApplication(
      id,
      approveLeaveDto,
      user?.id
    );
  }

  @Mutation(() => LeaveApplication)
  async cancelLeaveApplication(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: any
  ): Promise<LeaveApplication> {
    return this.leaveService.cancelLeaveApplication(id, user?.id);
  }

  // Leave Balance Management
  @Mutation(() => LeaveBalance)
  async createLeaveBalance(
    @Args('createLeaveBalanceInput')
    createLeaveBalanceDto: CreateLeaveBalanceDto
  ): Promise<LeaveBalance> {
    return this.leaveService.createLeaveBalance(createLeaveBalanceDto);
  }

  @Query(() => LeaveBalance, { nullable: true })
  async leaveBalance(
    @Args('employeeId') employeeId: string,
    @Args('leavePolicyId') leavePolicyId: string,
    @Args('year', { type: () => Int, nullable: true }) year?: number
  ): Promise<LeaveBalance | null> {
    return this.leaveService.getLeaveBalance(employeeId, leavePolicyId, year);
  }

  @Query(() => [LeaveBalance])
  async employeeLeaveBalances(
    @Args('employeeId') employeeId: string,
    @Args('year', { type: () => Int, nullable: true }) year?: number
  ): Promise<LeaveBalance[]> {
    return this.leaveService.getEmployeeLeaveBalances(employeeId, year);
  }

  @Mutation(() => LeaveBalance)
  async updateLeaveBalance(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateLeaveBalanceInput') updateData: CreateLeaveBalanceDto
  ): Promise<LeaveBalance> {
    return this.leaveService.updateLeaveBalance(id, updateData);
  }

  @Query(() => [LeaveApplication])
  async leaveCalendar(
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string
  ): Promise<LeaveApplication[]> {
    return this.leaveService.getLeaveCalendar(startDate, endDate);
  }

  @Query(() => String)
  async leaveStats(
    @Args('employeeId', { nullable: true }) employeeId?: string,
    @Args('year', { type: () => Int, nullable: true }) year?: number
  ): Promise<string> {
    const stats = await this.leaveService.getLeaveStats(employeeId, year);
    return JSON.stringify(stats);
  }
}
