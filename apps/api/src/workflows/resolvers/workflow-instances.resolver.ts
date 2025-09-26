import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../../aards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import {
  CreateWorkflowInstanceInput,
  WorkflowApproval,
  WorkflowApprovalInput,
  WorkflowInstance,
  WorkflowStatus,
  WorkflowStep,
} from '../dto/workflow.dto';
import { WorkflowApprovalService } from '../services/workflow-approval.service';
import { WorkflowExecutionService } from '../services/workflow-execution.service';

@Resolver(() => WorkflowInstance)
@UseGuards(JwtAuthGuard)
export class WorkflowInstancesResolver {
  constructor(
    private readonly executionService: WorkflowExecutionService,
    private readonly approvalService: WorkflowApprovalService
  ) {}

  @Mutation(() => WorkflowInstance)
  async createWorkflowInstance(
    @Args('input') input: CreateWorkflowInstanceInput,
    @CurrentUser() user: any
  ): Promise<WorkflowInstance> {
    return this.executionService.createInstance(input, user.companyId, user.id);
  }

  @Query(() => WorkflowInstance)
  async workflowInstance(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: any
  ): Promise<WorkflowInstance> {
    return this.executionService.getInstanceById(id, user.companyId);
  }

  @Query(() => [WorkflowInstance])
  async workflowInstances(
    @Args('workflowId', { type: () => ID }) workflowId: string,
    @CurrentUser() user: any,
    @Args('status', { type: () => [WorkflowStatus], nullable: true })
    status?: WorkflowStatus[],
    @Args('limit', { nullable: true }) limit?: number,
    @Args('offset', { nullable: true }) offset?: number
  ): Promise<WorkflowInstance[]> {
    return this.executionService.getInstancesByWorkflow(
      workflowId,
      user.companyId,
      {
        status,
        limit,
        offset,
      }
    );
  }

  @Mutation(() => WorkflowStep)
  async executeWorkflowStep(
    @Args('stepId', { type: () => ID }) stepId: string,
    @Args('data', { nullable: true }) data?: any,
    @CurrentUser() user: any
  ): Promise<WorkflowStep> {
    return this.executionService.executeStep(stepId, user.id, data);
  }

  @Mutation(() => Boolean)
  async completeWorkflowStep(
    @Args('stepId', { type: () => ID }) stepId: string,
    @Args('data', { nullable: true }) data?: any,
    @CurrentUser() user: any
  ): Promise<boolean> {
    await this.executionService.completeStep(stepId, user.id, data);
    return true;
  }

  @Mutation(() => Boolean)
  async cancelWorkflowInstance(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: any
  ): Promise<boolean> {
    await this.executionService.cancelInstance(id, user.companyId, user.id);
    return true;
  }

  @Mutation(() => WorkflowApproval)
  async processApproval(
    @Args('input') input: WorkflowApprovalInput,
    @CurrentUser() user: any
  ): Promise<WorkflowApproval> {
    return this.approvalService.processApproval(input, user.id);
  }

  @Query(() => [WorkflowApproval])
  async pendingApprovals(
    @CurrentUser() user: any
  ): Promise<WorkflowApproval[]> {
    return this.approvalService.getPendingApprovals(user.id, user.companyId);
  }

  @Query(() => [WorkflowApproval])
  async approvalHistory(
    @Args('stepId', { type: () => ID }) stepId: string,
    @Args('instanceId', { type: () => ID }) instanceId: string
  ): Promise<WorkflowApproval[]> {
    return this.approvalService.getApprovalHistory(stepId, instanceId);
  }

  @Mutation(() => [WorkflowApproval])
  async bulkApprove(
    @Args('approvalIds', { type: () => [ID] }) approvalIds: string[],
    @Args('comments', { nullable: true }) comments?: string,
    @CurrentUser() user: any
  ): Promise<WorkflowApproval[]> {
    return this.approvalService.bulkApprove(approvalIds, user.id, comments);
  }

  @Query(() => String)
  async approvalMetrics(@CurrentUser() user: any): Promise<string> {
    const metrics = await this.approvalService.getApprovalMetrics(
      user.id,
      user.companyId
    );
    return JSON.stringify(metrics);
  }
}
