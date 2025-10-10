import {
  workflowApprovals,
  workflowInstances,
  workflowSteps,
  workflows,
} from '@kiro/database';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray, sql } from '@kiro/database';
import { NotificationService } from '../../common/services/notification.service';
import {
  CreateWorkflowInstanceInput,
  WorkflowInstance,
  WorkflowPriority,
  WorkflowStatus,
  WorkflowStep,
  WorkflowStepStatus,
  WorkflowStepType,
} from '../dto/workflow.dto';

@Injectable()
export class WorkflowExecutionService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notificationService: NotificationService
  ) {}

  async createInstance(
    input: CreateWorkflowInstanceInput,
    companyId: string,
    userId: string
  ): Promise<WorkflowInstance> {
    // Get workflow definition
    const [workflow] = await this.db.db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.id, input.workflowId),
          eq(workflows.companyId, companyId),
          eq(workflows.isActive, true)
        )
      );

    if (!workflow) {
      throw new NotFoundException('Workflow not found or inactive');
    }

    try {
      // Create workflow instance
      const [instance] = await this.db.db
        .insert(workflowInstances)
        .values({
          workflowId: input.workflowId,
          companyId,
          name: input.name || workflow.name,
          priority: input.priority || WorkflowPriority.NORMAL,
          contextData: input.contextData,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          initiatedBy: userId,
        })
        .returning();

      // Initialize workflow steps based on definition
      await this.initializeSteps(instance.id, workflow.definition);

      // Start execution
      await this.startExecution(instance.id);

      return this.getInstanceById(instance.id, companyId);
    } catch (error) {
      throw new BadRequestException(
        `Failed to create workflow instance: ${(error as Error).message}`
      );
    }
  }

  async getInstanceById(
    id: string,
    companyId: string
  ): Promise<WorkflowInstance> {
    const [instance] = await this.db.db
      .select()
      .from(workflowInstances)
      .where(
        and(
          eq(workflowInstances.id, id),
          eq(workflowInstances.companyId, companyId)
        )
      );

    if (!instance) {
      throw new NotFoundException(`Workflow instance with ID ${id} not found`);
    }

    // Get steps
    const steps = await this.db.db
      .select()
      .from(workflowSteps)
      .where(eq(workflowSteps.instanceId, id))
      .orderBy(workflowSteps.createdAt);

    return {
      ...instance,
      steps: steps.map(this.mapStepToDto),
    } as WorkflowInstance;
  }

  async getInstancesByWorkflow(
    workflowId: string,
    companyId: string,
    options?: {
      status?: WorkflowStatus[];
      limit?: number;
      offset?: number;
    }
  ): Promise<WorkflowInstance[]> {
    const conditions = [
      eq(workflowInstances.workflowId, workflowId),
      eq(workflowInstances.companyId, companyId),
    ];

    if (options?.status?.length) {
      conditions.push(inArray(workflowInstances.status, options.status));
    }

    let query = this.db.db
      .select()
      .from(workflowInstances)
      .where(and(...conditions))
      .orderBy(workflowInstances.createdAt);

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    const instances = await query;
    return instances.map(instance => ({ ...instance }) as WorkflowInstance);
  }

  async executeStep(
    stepId: string,
    userId: string,
    data?: any
  ): Promise<WorkflowStep> {
    const [step] = await this.db.db
      .select()
      .from(workflowSteps)
      .where(eq(workflowSteps.id, stepId));

    if (!step) {
      throw new NotFoundException('Workflow step not found');
    }

    if (step.status !== WorkflowStepStatus.PENDING) {
      throw new BadRequestException('Step is not in pending status');
    }

    // Check if user is authorized to execute this step
    if (step.assignedTo && step.assignedTo !== userId) {
      throw new BadRequestException('User not authorized to execute this step');
    }

    try {
      // Update step status
      const [updatedStep] = await this.db.db
        .update(workflowSteps)
        .set({
          status: WorkflowStepStatus.RUNNING,
          startedAt: new Date(),
          outputData: data,
          updatedAt: new Date(),
        })
        .where(eq(workflowSteps.id, stepId))
        .returning();

      // Execute step based on type
      await this.executeStepByType(updatedStep, userId, data);

      return this.mapStepToDto(updatedStep);
    } catch (error) {
      // Mark step as failed
      await this.db.db
        .update(workflowSteps)
        .set({
          status: WorkflowStepStatus.FAILED,
          updatedAt: new Date(),
        })
        .where(eq(workflowSteps.id, stepId));

      throw new BadRequestException(
        `Failed to execute step: ${(error as Error).message}`
      );
    }
  }

  async completeStep(
    stepId: string,
    userId: string,
    data?: any
  ): Promise<void> {
    const [step] = await this.db.db
      .update(workflowSteps)
      .set({
        status: WorkflowStepStatus.COMPLETED,
        completedAt: new Date(),
        outputData: data,
        updatedAt: new Date(),
      })
      .where(eq(workflowSteps.id, stepId))
      .returning();

    if (!step) {
      throw new NotFoundException('Workflow step not found');
    }

    // Check if this completes the workflow instance
    await this.checkInstanceCompletion(step.instanceId);

    // Move to next step(s)
    await this.moveToNextSteps(step.instanceId, step.stepId);
  }

  async cancelInstance(
    id: string,
    companyId: string,
    userId: string
  ): Promise<void> {
    const instance = await this.getInstanceById(id, companyId);

    if (instance.status === WorkflowStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed workflow');
    }

    // Cancel all pending/running steps
    await this.db.db
      .update(workflowSteps)
      .set({
        status: WorkflowStepStatus.SKIPPED,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(workflowSteps.instanceId, id),
          inArray(workflowSteps.status, [
            WorkflowStepStatus.PENDING,
            WorkflowStepStatus.RUNNING,
          ])
        )
      );

    // Update instance status
    await this.db.db
      .update(workflowInstances)
      .set({
        status: WorkflowStatus.CANCELLED,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(workflowInstances.id, id));
  }

  private async initializeSteps(
    instanceId: string,
    definition: any
  ): Promise<void> {
    const workflowDef = definition as any;

    // Find start node
    const startNode = workflowDef.nodes.find(
      (node: any) => node.type === 'start'
    );
    if (!startNode) {
      throw new BadRequestException('Workflow must have a start node');
    }

    // Create initial step for start node
    await this.db.db.insert(workflowSteps).values({
      instanceId,
      stepId: startNode.id,
      name: startNode.label || 'Start',
      type: WorkflowStepType.TASK,
      status: WorkflowStepStatus.PENDING,
    });
  }

  private async startExecution(instanceId: string): Promise<void> {
    // Update instance status to running
    await this.db.db
      .update(workflowInstances)
      .set({
        status: WorkflowStatus.RUNNING,
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(workflowInstances.id, instanceId));

    // Auto-complete start step and move to next
    const [startStep] = await this.db.db
      .select()
      .from(workflowSteps)
      .where(eq(workflowSteps.instanceId, instanceId))
      .limit(1);

    if (startStep) {
      await this.completeStep(startStep.id, startStep.assignedTo || 'system');
    }
  }

  private async executeStepByType(
    step: any,
    userId: string,
    data?: any
  ): Promise<void> {
    switch (step.type) {
      case WorkflowStepType.APPROVAL:
        await this.handleApprovalStep(step, userId);
        break;
      case WorkflowStepType.TASK:
        await this.handleTaskStep(step, userId, data);
        break;
      case WorkflowStepType.NOTIFICATION:
        await this.handleNotificationStep(step, data);
        break;
      case WorkflowStepType.CONDITION:
        await this.handleConditionStep(step, data);
        break;
      case WorkflowStepType.DELAY:
        await this.handleDelayStep(step);
        break;
      default:
        // For other types, just complete immediately
        await this.completeStep(step.id, userId, data);
    }
  }

  private async handleApprovalStep(step: any, userId: string): Promise<void> {
    // Create approval record
    await this.db.db.insert(workflowApprovals).values({
      stepId: step.id,
      instanceId: step.instanceId,
      approverId: step.assignedTo || userId,
      requestedAt: new Date(),
      dueDate: step.dueDate,
    });

    // Send notification to approver
    if (step.assignedTo) {
      await this.notificationService.sendNotification(
        {
          recipientId: step.assignedTo,
          type: 'INFO',
          title: 'Approval Required',
          message: `You have a pending approval for: ${step.name}`,
          metadata: { stepId: step.id, instanceId: step.instanceId },
        },
        step.companyId || 'default'
      );
    }
  }

  private async handleTaskStep(
    step: any,
    userId: string,
    data?: any
  ): Promise<void> {
    // For task steps, just mark as completed with the provided data
    await this.completeStep(step.id, userId, data);
  }

  private async handleNotificationStep(step: any, data?: any): Promise<void> {
    // Send notification based on step configuration
    const notificationConfig = step.inputData?.notification;
    if (notificationConfig) {
      await this.notificationService.sendNotification(
        {
          recipientId: notificationConfig.userId,
          type: 'INFO',
          title: notificationConfig.title || step.name,
          message: notificationConfig.message || 'Workflow notification',
          metadata: data || {},
        },
        step.companyId || 'default'
      );
    }

    // Auto-complete notification steps
    await this.completeStep(step.id, 'system');
  }

  private async handleConditionStep(step: any, data?: any): Promise<void> {
    // Evaluate condition based on step configuration and data
    const condition = step.inputData?.condition;
    let result = true; // Default to true if no condition specified

    if (condition && data) {
      // Simple condition evaluation (can be extended)
      result = this.evaluateCondition(condition, data);
    }

    await this.completeStep(step.id, 'system', { conditionResult: result });
  }

  private async handleDelayStep(step: any): Promise<void> {
    const delayMinutes = step.inputData?.delayMinutes || 0;

    if (delayMinutes > 0) {
      // Schedule completion after delay (in a real implementation, use a job queue)
      setTimeout(
        async () => {
          await this.completeStep(step.id, 'system');
        },
        delayMinutes * 60 * 1000
      );
    } else {
      await this.completeStep(step.id, 'system');
    }
  }

  private evaluateCondition(condition: any, data: any): boolean {
    // Simple condition evaluation - can be extended with more complex logic
    if (
      condition.field &&
      condition.operator &&
      condition.value !== undefined
    ) {
      const fieldValue = data[condition.field];

      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'greater_than':
          return fieldValue > condition.value;
        case 'less_than':
          return fieldValue < condition.value;
        case 'contains':
          return String(fieldValue).includes(String(condition.value));
        default:
          return true;
      }
    }

    return true;
  }

  private async moveToNextSteps(
    instanceId: string,
    completedStepId: string
  ): Promise<void> {
    // Get workflow definition to find next steps
    const [instance] = await this.db.db
      .select({
        workflowDefinition: workflows.definition,
      })
      .from(workflowInstances)
      .innerJoin(workflows, eq(workflows.id, workflowInstances.workflowId))
      .where(eq(workflowInstances.id, instanceId));

    if (!instance) return;

    const definition = instance.workflowDefinition as any;
    const nextSteps = this.findNextSteps(definition, completedStepId);

    // Create next steps
    for (const nextStep of nextSteps) {
      const existingStep = await this.db.db
        .select()
        .from(workflowSteps)
        .where(
          and(
            eq(workflowSteps.instanceId, instanceId),
            eq(workflowSteps.stepId, nextStep.id)
          )
        )
        .limit(1);

      if (existingStep.length === 0) {
        await this.db.db.insert(workflowSteps).values({
          instanceId,
          stepId: nextStep.id,
          name: nextStep.label || nextStep.type,
          type: nextStep.type as WorkflowStepType,
          status: WorkflowStepStatus.PENDING,
          assignedTo: nextStep.data?.assignedTo,
          assignedRole: nextStep.data?.assignedRole,
          inputData: nextStep.data,
          dueDate: nextStep.data?.dueDate
            ? new Date(nextStep.data.dueDate)
            : null,
        });
      }
    }
  }

  private findNextSteps(definition: any, currentStepId: string): any[] {
    const edges = definition.edges || [];
    const nodes = definition.nodes || [];

    const nextStepIds = edges
      .filter((edge: any) => edge.source === currentStepId)
      .map((edge: any) => edge.target);

    return nodes.filter((node: any) => nextStepIds.includes(node.id));
  }

  private async checkInstanceCompletion(instanceId: string): Promise<void> {
    // Check if all steps are completed
    const [pendingSteps] = await this.db.db
      .select({ count: sql<number>`count(*)` })
      .from(workflowSteps)
      .where(
        and(
          eq(workflowSteps.instanceId, instanceId),
          inArray(workflowSteps.status, [
            WorkflowStepStatus.PENDING,
            WorkflowStepStatus.RUNNING,
          ])
        )
      );

    if (pendingSteps.count === 0) {
      // All steps completed, mark instance as completed
      await this.db.db
        .update(workflowInstances)
        .set({
          status: WorkflowStatus.COMPLETED,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(workflowInstances.id, instanceId));
    }
  }

  private mapStepToDto(step: any): WorkflowStep {
    return {
      id: step.id,
      instanceId: step.instanceId,
      stepId: step.stepId,
      name: step.name,
      type: step.type,
      status: step.status,
      assignedTo: step.assignedTo,
      assignedRole: step.assignedRole,
      inputData: step.inputData,
      outputData: step.outputData,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
      dueDate: step.dueDate,
      comments: step.comments,
      attachments: step.attachments,
      createdAt: step.createdAt,
      updatedAt: step.updatedAt,
    };
  }
}
