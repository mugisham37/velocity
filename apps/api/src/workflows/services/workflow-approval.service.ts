import {
  DatabaseService,
  workflowApprovals,
  workflowSteps,
} from '../../database';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, sql } from '../../database';
import { NotificationService } from '../../common/services/notification.service';
import {
  ApprovalStatus,
  WorkflowApproval,
  WorkflowApprovalInput,
  WorkflowStepStatus,
} from '../dto/workflow.dto';

@Injectable()
export class WorkflowApprovalService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notificationService: NotificationService
  ) {}

  async processApproval(
    input: WorkflowApprovalInput,
    userId: string
  ): Promise<WorkflowApproval> {
    // Get approval record
    const [approval] = await this.db.db
      .select()
      .from(workflowApprovals)
      .where(eq(workflowApprovals.id, input.approvalId));

    if (!approval) {
      throw new NotFoundException('Approval request not found');
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException(
        'Approval request is not in pending status'
      );
    }

    if (approval.approverId !== userId) {
      throw new BadRequestException(
        'User not authorized to process this approval'
      );
    }

    try {
      let newStatus: ApprovalStatus;
      let updatedApproval: any;

      if (input.decision === 'delegate' && input.delegatedTo) {
        // Handle delegation
        [updatedApproval] = await this.db.db
          .update(workflowApprovals)
          .set({
            status: ApprovalStatus.DELEGATED,
            delegatedTo: input.delegatedTo,
            delegationReason: input.delegationReason || null,
            comments: input.comments || null,
            respondedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(workflowApprovals.id, input.approvalId))
          .returning();

        // Create new approval for delegated user
        await this.db.db.insert(workflowApprovals).values({
          stepId: approval.stepId,
          instanceId: approval.instanceId,
          approverId: input.delegatedTo,
          status: ApprovalStatus.PENDING,
          requestedAt: new Date(),
          dueDate: approval.dueDate,
        });

        // Notify delegated user
        await this.notificationService.sendNotification({
          recipientId: input.delegatedTo,
          type: 'INFO',
          title: 'Approval Delegated to You',
          message: `An approval has been delegated to you: ${approval.stepId}`,
          data: { stepId: approval.stepId, instanceId: approval.instanceId },
        });

        newStatus = ApprovalStatus.DELEGATED;
      } else {
        // Handle approve/reject
        newStatus =
          input.decision === 'approve'
            ? ApprovalStatus.APPROVED
            : ApprovalStatus.REJECTED;

        [updatedApproval] = await this.db.db
          .update(workflowApprovals)
          .set({
            status: newStatus,
            decision: input.decision,
            comments: input.comments || null,
            reason: input.reason || null,
            respondedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(workflowApprovals.id, input.approvalId))
          .returning();

        // Update workflow step based on approval decision
        await this.updateWorkflowStep(approval.stepId, newStatus);
      }

      return this.mapToDto(updatedApproval);
    } catch (error) {
      throw new BadRequestException(
        `Failed to process approval: ${(error as Error).message}`
      );
    }
  }

  async getPendingApprovals(
    userId: string,
    companyId?: string
  ): Promise<WorkflowApproval[]> {
    // If company filter is provided, join with workflow instances
    if (companyId) {
      const { workflowInstances } = await import('@kiro/database');
      const approvals = await this.db.db
        .select()
        .from(workflowApprovals)
        .innerJoin(
          workflowInstances,
          eq(workflowInstances.id, workflowApprovals.instanceId)
        )
        .where(
          and(
            eq(workflowApprovals.approverId, userId),
            eq(workflowApprovals.status, ApprovalStatus.PENDING),
            eq(workflowInstances.companyId, companyId)
          )
        )
        .orderBy(workflowApprovals.requestedAt);
      
      return approvals.map(approval => this.mapToDto(approval.workflow_approvals));
    }

    const approvals = await this.db.db
      .select()
      .from(workflowApprovals)
      .where(
        and(
          eq(workflowApprovals.approverId, userId),
          eq(workflowApprovals.status, ApprovalStatus.PENDING)
        )
      )
      .orderBy(workflowApprovals.requestedAt);

    return approvals.map(this.mapToDto);
  }

  async getApprovalHistory(
    stepId: string,
    instanceId: string
  ): Promise<WorkflowApproval[]> {
    const approvals = await this.db.db
      .select()
      .from(workflowApprovals)
      .where(
        and(
          eq(workflowApprovals.stepId, stepId),
          eq(workflowApprovals.instanceId, instanceId)
        )
      )
      .orderBy(workflowApprovals.requestedAt);

    return approvals.map(this.mapToDto);
  }

  async getApprovalById(id: string): Promise<WorkflowApproval> {
    const [approval] = await this.db.db
      .select()
      .from(workflowApprovals)
      .where(eq(workflowApprovals.id, id));

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    return this.mapToDto(approval);
  }

  async escalateApproval(
    approvalId: string,
    escalatedTo: string
  ): Promise<void> {
    const approval = await this.getApprovalById(approvalId);

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Can only escalate pending approvals');
    }

    // Create escalated approval
    await this.db.db.insert(workflowApprovals).values({
      stepId: approval.stepId,
      instanceId: approval.instanceId,
      approverId: escalatedTo,
      status: ApprovalStatus.PENDING,
      requestedAt: new Date(),
      dueDate: approval.dueDate || null,
    });

    // Mark original as escalated (using delegated status for now)
    await this.db.db
      .update(workflowApprovals)
      .set({
        status: ApprovalStatus.DELEGATED,
        delegatedTo: escalatedTo,
        delegationReason: 'Escalated due to SLA breach or manual escalation',
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(workflowApprovals.id, approvalId));

    // Notify escalated user
    await this.notificationService.sendNotification({
      recipientId: escalatedTo,
      type: 'INFO',
      title: 'Approval Escalated to You',
      message: `An approval has been escalated to you: ${approval.stepId}`,
      data: { stepId: approval.stepId, instanceId: approval.instanceId },
    });
  }

  async bulkApprove(
    approvalIds: string[],
    userId: string,
    comments?: string
  ): Promise<WorkflowApproval[]> {
    const results: WorkflowApproval[] = [];

    for (const approvalId of approvalIds) {
      try {
        const result = await this.processApproval(
          {
            approvalId,
            decision: 'approve',
            comments: comments || '',
          },
          userId
        );
        results.push(result);
      } catch (error) {
        // Log error but continue with other approvals
        console.error(`Failed to approve ${approvalId}:`, (error as Error).message);
      }
    }

    return results;
  }

  async getApprovalMetrics(
    userId: string,
    _companyId?: string
  ): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    delegated: number;
    overdue: number;
  }> {
    const conditions = [eq(workflowApprovals.approverId, userId)];

    const [metrics] = await this.db.db
      .select({
        pending: sql<number>`count(*) filter (where status = 'pending')`,
        approved: sql<number>`count(*) filter (where status = 'approved')`,
        rejected: sql<number>`count(*) filter (where status = 'rejected')`,
        delegated: sql<number>`count(*) filter (where status = 'delegated')`,
        overdue: sql<number>`count(*) filter (where status = 'pending' and due_date < now())`,
      })
      .from(workflowApprovals)
      .where(and(...conditions));

    return {
      pending: Number(metrics?.pending) || 0,
      approved: Number(metrics?.approved) || 0,
      rejected: Number(metrics?.rejected) || 0,
      delegated: Number(metrics?.delegated) || 0,
      overdue: Number(metrics?.overdue) || 0,
    };
  }

  private async updateWorkflowStep(
    stepId: string,
    approvalStatus: ApprovalStatus
  ): Promise<void> {
    let stepStatus: WorkflowStepStatus;

    switch (approvalStatus) {
      case ApprovalStatus.APPROVED:
        stepStatus = WorkflowStepStatus.COMPLETED;
        break;
      case ApprovalStatus.REJECTED:
        stepStatus = WorkflowStepStatus.FAILED;
        break;
      case ApprovalStatus.DELEGATED:
        // Keep step in running status for delegation
        stepStatus = WorkflowStepStatus.RUNNING;
        break;
      default:
        return; // Don't update step for other statuses
    }

    await this.db.db
      .update(workflowSteps)
      .set({
        status: stepStatus,
        completedAt:
          stepStatus === WorkflowStepStatus.COMPLETED ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(workflowSteps.id, stepId));

    // If step is completed, trigger next steps
    if (stepStatus === WorkflowStepStatus.COMPLETED) {
      // This would need to be injected properly to avoid circular dependency
      // For now, we'll handle this in the execution service
    }
  }

  private mapToDto(approval: any): WorkflowApproval {
    return {
      id: approval.id,
      stepId: approval.stepId,
      instanceId: approval.instanceId,
      approverId: approval.approverId,
      status: approval.status,
      decision: approval.decision,
      comments: approval.comments,
      reason: approval.reason,
      delegatedTo: approval.delegatedTo,
      delegationReason: approval.delegationReason,
      requestedAt: approval.requestedAt,
      respondedAt: approval.respondedAt,
      dueDate: approval.dueDate,
      createdAt: approval.createdAt,
      updatedAt: approval.updatedAt,
    };
  }
}



