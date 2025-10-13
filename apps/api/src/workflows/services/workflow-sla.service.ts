import {
  DatabaseService,
  workflowApprovals,
  workflowInstances,
  workflowSteps,
} from '../../../database';
import { Injectable } from '@nestjs/common';
import { and, eq, lt, sql } from '../../../database';
import { NotificationService } from '../../common/services/notification.service';
import {
  ApprovalStatus,
  WorkflowStatus,
  WorkflowStepStatus,
} from '../dto/workflow.dto';

export interface SlaConfiguration {
  instanceDueDays?: number;
  stepDueDays?: number;
  approvalDueDays?: number;
  escalationRules?: EscalationRule[];
  notificationRules?: NotificationRule[];
}

export interface EscalationRule {
  triggerAfterHours: number;
  escalateTo: string; // user ID or role
  type: 'user' | 'role';
}

export interface NotificationRule {
  triggerBeforeHours: number;
  notifyUsers: string[];
  message: string;
}

@Injectable()
export class WorkflowSlaService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notificationService: NotificationService
  ) {}

  async checkSlaBreaches(): Promise<void> {
    await Promise.all([
      this.checkInstanceSlaBreaches(),
      this.checkStepSlaBreaches(),
      this.checkApprovalSlaBreaches(),
    ]);
  }

  async checkInstanceSlaBreaches(): Promise<void> {
    const breachedInstances = await this.db.db
      .select()
      .from(workflowInstances)
      .where(
        and(
          eq(workflowInstances.slaBreached, false),
          lt(workflowInstances.dueDate, new Date()),
          eq(workflowInstances.status, WorkflowStatus.RUNNING)
        )
      );

    for (const instance of breachedInstances) {
      await this.handleInstanceSlaBreach(instance);
    }
  }

  async checkStepSlaBreaches(): Promise<void> {
    const breachedSteps = await this.db.db
      .select()
      .from(workflowSteps)
      .where(
        and(
          lt(workflowSteps.dueDate, new Date()),
          eq(workflowSteps.status, WorkflowStepStatus.PENDING)
        )
      );

    for (const step of breachedSteps) {
      await this.handleStepSlaBreach(step);
    }
  }

  async checkApprovalSlaBreaches(): Promise<void> {
    const breachedApprovals = await this.db.db
      .select()
      .from(workflowApprovals)
      .where(
        and(
          lt(workflowApprovals.dueDate, new Date()),
          eq(workflowApprovals.status, ApprovalStatus.PENDING)
        )
      );

    for (const approval of breachedApprovals) {
      await this.handleApprovalSlaBreach(approval);
    }
  }

  async setSlaForInstance(
    instanceId: string,
    slaConfig: SlaConfiguration
  ): Promise<void> {
    if (slaConfig.instanceDueDays) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + slaConfig.instanceDueDays);

      await this.db.db
        .update(workflowInstances)
        .set({
          dueDate,
          updatedAt: new Date(),
        })
        .where(eq(workflowInstances.id, instanceId));
    }

    // Set SLA for steps
    if (slaConfig.stepDueDays) {
      const stepDueDate = new Date();
      stepDueDate.setDate(stepDueDate.getDate() + slaConfig.stepDueDays);

      await this.db.db
        .update(workflowSteps)
        .set({
          dueDate: stepDueDate,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(workflowSteps.instanceId, instanceId),
            eq(workflowSteps.status, WorkflowStepStatus.PENDING)
          )
        );
    }

    // Set SLA for approvals
    if (slaConfig.approvalDueDays) {
      const approvalDueDate = new Date();
      approvalDueDate.setDate(
        approvalDueDate.getDate() + slaConfig.approvalDueDays
      );

      await this.db.db
        .update(workflowApprovals)
        .set({
          dueDate: approvalDueDate,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(workflowApprovals.instanceId, instanceId),
            eq(workflowApprovals.status, ApprovalStatus.PENDING)
          )
        );
    }
  }

  async getSlaMetrics(
    companyId: string,
    period: 'day' | 'week' | 'month' = 'day'
  ): Promise<{
    totalInstances: number;
    onTimeCompletions: number;
    slaBreaches: number;
    averageCompletionTime: number;
    slaComplianceRate: number;
  }> {
    const periodStart = this.getPeriodStart(period);

    const [metrics] = await this.db.db
      .select({
        totalInstances: sql<number>`count(*)`,
        onTimeCompletions: sql<number>`count(*) filter (where completed_at <= due_date and status = 'completed')`,
        slaBreaches: sql<number>`count(*) filter (where sla_breached = true)`,
        averageCompletionTime: sql<number>`avg(extract(epoch from (completed_at - started_at))/3600)`,
      })
      .from(workflowInstances)
      .where(
        and(
          eq(workflowInstances.companyId, companyId),
          sql`created_at >= ${periodStart}`
        )
      );

    const totalInstances = Number(metrics?.totalInstances) || 0;
    const onTimeCompletions = Number(metrics?.onTimeCompletions) || 0;
    const slaBreaches = Number(metrics?.slaBreaches) || 0;
    const averageCompletionTime = Number(metrics?.averageCompletionTime) || 0;

    const slaComplianceRate =
      totalInstances > 0 ? (onTimeCompletions / totalInstances) * 100 : 0;

    return {
      totalInstances,
      onTimeCompletions,
      slaBreaches,
      averageCompletionTime,
      slaComplianceRate,
    };
  }

  async getOverdueItems(companyId: string): Promise<{
    instances: any[];
    steps: any[];
    approvals: any[];
  }> {
    const now = new Date();

    const overdueInstances = await this.db.db
      .select()
      .from(workflowInstances)
      .where(
        and(
          eq(workflowInstances.companyId, companyId),
          lt(workflowInstances.dueDate, now),
          eq(workflowInstances.status, WorkflowStatus.RUNNING)
        )
      )
      .orderBy(workflowInstances.dueDate);

    const overdueSteps = await this.db.db
      .select()
      .from(workflowSteps)
      .innerJoin(
        workflowInstances,
        eq(workflowInstances.id, workflowSteps.instanceId)
      )
      .where(
        and(
          eq(workflowInstances.companyId, companyId),
          lt(workflowSteps.dueDate, now),
          eq(workflowSteps.status, WorkflowStepStatus.PENDING)
        )
      )
      .orderBy(workflowSteps.dueDate);

    const overdueApprovals = await this.db.db
      .select()
      .from(workflowApprovals)
      .innerJoin(
        workflowInstances,
        eq(workflowInstances.id, workflowApprovals.instanceId)
      )
      .where(
        and(
          eq(workflowInstances.companyId, companyId),
          lt(workflowApprovals.dueDate, now),
          eq(workflowApprovals.status, ApprovalStatus.PENDING)
        )
      )
      .orderBy(workflowApprovals.dueDate);

    return {
      instances: overdueInstances,
      steps: overdueSteps,
      approvals: overdueApprovals,
    };
  }

  async scheduleReminders(): Promise<void> {
    const reminderTime = new Date();
    reminderTime.setHours(reminderTime.getHours() + 24); // 24 hours from now

    // Find items due in 24 hours
    const upcomingInstances = await this.db.db
      .select()
      .from(workflowInstances)
      .where(
        and(
          lt(workflowInstances.dueDate, reminderTime),
          eq(workflowInstances.status, WorkflowStatus.RUNNING)
        )
      );

    for (const instance of upcomingInstances) {
      await this.sendReminderNotification(instance, 'instance');
    }

    const upcomingApprovals = await this.db.db
      .select()
      .from(workflowApprovals)
      .where(
        and(
          lt(workflowApprovals.dueDate, reminderTime),
          eq(workflowApprovals.status, ApprovalStatus.PENDING)
        )
      );

    for (const approval of upcomingApprovals) {
      await this.sendReminderNotification(approval, 'approval');
    }
  }

  private async handleInstanceSlaBreach(instance: any): Promise<void> {
    // Mark instance as SLA breached
    await this.db.db
      .update(workflowInstances)
      .set({
        slaBreached: true,
        slaBreachedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(workflowInstances.id, instance.id));

    // Send breach notification
    await this.notificationService.sendNotification(
      {
        recipientId: instance.initiatedBy,
        type: 'INFO',
        title: 'Workflow SLA Breach',
        message: `Workflow "${instance.name}" has breached its SLA deadline`,
        data: { instanceId: instance.id, type: 'instance' },
      },
      instance.companyId
    );

    // Log the breach for analytics
    await this.logSlaEvent(instance.id, 'instance_breach', {
      dueDate: instance.dueDate,
      breachedAt: new Date(),
    });
  }

  private async handleStepSlaBreach(step: any): Promise<void> {
    // Send breach notification to assigned user
    if (step.assignedTo) {
      await this.notificationService.sendNotification(
        {
          recipientId: step.assignedTo,
          type: 'INFO',
          title: 'Step SLA Breach',
          message: `Step "${step.name}" has breached its SLA deadline`,
          data: { stepId: step.id, instanceId: step.instanceId, type: 'step' },
        },
        step.companyId
      );
    }

    // Log the breach
    await this.logSlaEvent(step.instanceId, 'step_breach', {
      stepId: step.id,
      dueDate: step.dueDate,
      breachedAt: new Date(),
    });
  }

  private async handleApprovalSlaBreach(approval: any): Promise<void> {
    // Send breach notification to approver
    await this.notificationService.sendNotification(
      {
        recipientId: approval.approverId,
        type: 'INFO',
        title: 'Approval SLA Breach',
        message: 'An approval request has breached its SLA deadline',
        data: {
          approvalId: approval.id,
          instanceId: approval.instanceId,
          type: 'approval',
        },
      },
      approval.companyId
    );

    // Auto-escalate if configured
    // This would need escalation rules configuration
    // For now, we'll just log the breach
    await this.logSlaEvent(approval.instanceId, 'approval_breach', {
      approvalId: approval.id,
      dueDate: approval.dueDate,
      breachedAt: new Date(),
    });
  }

  private async sendReminderNotification(
    item: any,
    type: 'instance' | 'approval'
  ): Promise<void> {
    let userId: string;
    let title: string;
    let message: string;

    if (type === 'instance') {
      userId = item.initiatedBy;
      title = 'Workflow Due Soon';
      message = `Workflow "${item.name}" is due soon`;
    } else {
      userId = item.approverId;
      title = 'Approval Due Soon';
      message = 'An approval request is due soon';
    }

    await this.notificationService.sendNotification(
      {
        recipientId: userId,
        type: 'INFO',
        title,
        message,
        data: { itemId: item.id, type },
      },
      item.companyId
    );
  }

  private async logSlaEvent(
    instanceId: string,
    eventType: string,
    data: any
  ): Promise<void> {
    // This would typically go to an analytics/audit table
    // For now, we'll just log to console
    console.log(`SLA Event: ${eventType}`, {
      instanceId,
      data,
      timestamp: new Date(),
    });
  }

  private getPeriodStart(period: 'day' | 'week' | 'month'): Date {
    const now = new Date();

    switch (period) {
      case 'day':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return new Date(
          weekStart.getFullYear(),
          weekStart.getMonth(),
          weekStart.getDate()
        );
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
  }
}

