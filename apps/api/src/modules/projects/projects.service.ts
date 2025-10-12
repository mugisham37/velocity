import { DatabaseService } from '@kiro/database';
import {
  projects,
  projectTasks,
  taskDependencies,
  projectTeamMembers,
  projectMilestones,
  projectTemplates,
  projectBudgets,
  projectBudgetCategories,
  projectCosts,
  projectRevenue,
  projectInvoices,
  projectInvoiceLineItems,
} from '@kiro/database/schema/projects';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateProject,
  CreateProjectBudget,
  CreateProjectBudgetCategory,
  CreateProjectCost,
  CreateProjectInvoice,
  CreateProjectMilestone,
  CreateProjectRevenue,
  CreateProjectTask,
  CreateProjectTeamMember,
  CreateProjectTemplate,
  CreateTaskDependency,
  CriticalPathAnalysis,
  GanttData,
  Project,
  ProjectBudget,
  ProjectBudgetCategory,
  ProjectCost,
  ProjectFinancialSummary,
  ProjectInvoice,
  ProjectProfitability,
  ProjectRevenue,
  ProjectTask,
  UpdateProject,
  UpdateProjectBudget,
  UpdateProjectCost,
  UpdateProjectMilestone,
  UpdateProjectRevenue,
  UpdateProjectTask
} from '@kiro/shared';
import { and, asc, desc, eq, gte, lte, sql } from '@kiro/database';

@Injectable()
export class ProjectsService {
  constructor(private readonly db: DatabaseService) {}

  // Project Management
  async createProject(
    companyId: string,
    data: CreateProject
  ): Promise<Project> {
    const [project] = await this.db.db
      .insert(projects)
      .values({
        ...data,
        companyId,
        status: 'Draft',
        percentComplete: 0,
      })
      .returning();

    // If created from template, copy template structure
    if (data.templateId) {
      await this.applyProjectTemplate(project!['id'], data.templateId);
    }

    return project as Project;
  }

  async updateProject(
    id: string,
    companyId: string,
    data: UpdateProject
  ): Promise<Project> {
    const [project] = await this.db.db
      .update(projects)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, id), eq(projects.companyId, companyId)))
      .returning();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project as Project;
  }

  async getProject(id: string, companyId: string): Promise<Project> {
    const [project] = await this.db.db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.companyId, companyId)));

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project as Project;
  }

  async getProjects(companyId: string, filters?: any): Promise<Project[]> {
    let query = this.db.db
      .select()
      .from(projects)
      .where(eq(projects.companyId, companyId));

    if (filters?.status) {
      query = query.where(eq(projects.status, filters.status));
    }

    if (filters?.projectManagerId) {
      query = query.where(
        eq(projects.projectManagerId, filters.projectManagerId)
      );
    }

    const result = await query.orderBy(desc(projects.createdAt));
    return result as Project[];
  }

  async deleteProject(id: string, companyId: string): Promise<void> {
    await this.db.db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.companyId, companyId)));
  }

  // Work Breakdown Structure (WBS)
  async createTask(data: CreateProjectTask): Promise<ProjectTask> {
    // Validate project exists
    const project = await this.db.db
      .select()
      .from(projects)
      .where(eq(projects.id, data.projectId))
      .limit(1);

    if (!project.length) {
      throw new NotFoundException('Project not found');
    }

    // Generate task code if not provided
    if (!data.taskCode) {
      const taskCount = await this.db.db
        .select({ count: sql<number>`count(*)` })
        .from(projectTasks)
        .where(eq(projectTasks.projectId, data.projectId));

      data.taskCode = `TASK-${String(taskCount[0]!.count + 1).padStart(4, '0')}`;
    }

    const [task] = await this.db.db
      .insert(projectTasks)
      .values({
        ...data,
        status: 'Open',
        actualHours: 0,
        percentComplete: 0,
      })
      .returning();

    return task as ProjectTask;
  }

  async updateTask(id: string, data: UpdateProjectTask): Promise<ProjectTask> {
    const [task] = await this.db.db
      .update(projectTasks)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(projectTasks.id, id))
      .returning();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Update project progress when task is updated
    await this.updateProjectProgress(task['projectId']);

    return task as ProjectTask;
  }

  async getTask(id: string): Promise<ProjectTask> {
    const [task] = await this.db.db
      .select()
      .from(projectTasks)
      .where(eq(projectTasks.id, id));

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task as ProjectTask;
  }

  async getProjectTasks(projectId: string): Promise<ProjectTask[]> {
    const tasks = await this.db.db
      .select()
      .from(projectTasks)
      .where(eq(projectTasks.projectId, projectId))
      .orderBy(asc(projectTasks.taskCode));

    return tasks as ProjectTask[];
  }

  async deleteTask(id: string): Promise<void> {
    // Check for dependencies
    const dependencies = await this.db.db
      .select()
      .from(taskDependencies)
      .where(
        sql`${taskDependencies.predecessorTaskId} = ${id} OR ${taskDependencies.successorTaskId} = ${id}`
      );

    if (dependencies.length > 0) {
      throw new BadRequestException('Cannot delete task with dependencies');
    }

    await this.db.db
      .delete(projectTasks)
      .where(eq(projectTasks.id, id));
  }

  // Task Dependencies
  async createTaskDependency(data: CreateTaskDependency): Promise<void> {
    // Validate tasks exist
    await Promise.all([
      this.getTask(data.predecessorTaskId),
      this.getTask(data.successorTaskId),
    ]);

    // Check for circular dependencies
    if (
      await this.wouldCreateCircularDependency(
        data.predecessorTaskId,
        data.successorTaskId
      )
    ) {
      throw new BadRequestException(
        'This dependency would create a circular reference'
      );
    }

    await this.db.db.insert(taskDependencies).values(data);
  }

  async deleteTaskDependency(
    predecessorId: string,
    successorId: string
  ): Promise<void> {
    await this.db.db
      .delete(taskDependencies)
      .where(
        and(
          eq(taskDependencies.predecessorTaskId, predecessorId),
          eq(taskDependencies.successorTaskId, successorId)
        )
      );
  }

  // Gantt Chart Data
  async getGanttData(projectId: string): Promise<GanttData> {
    const [tasks, dependencies] = await Promise.all([
      this.getProjectTasks(projectId),
      this.getTaskDependencies(projectId),
    ]);

    const ganttTasks = tasks.map(task => ({
      id: task.id,
      text: task.taskName,
      start_date:
        task.startDate ||
        task.expectedStartDate ||
        new Date().toISOString().split('T')[0]!,
      end_date:
        task.endDate ||
        task.expectedEndDate ||
        new Date().toISOString().split('T')[0]!,
      duration: task.duration || 1,
      progress: task.percentComplete / 100,
      parent: task.parentTaskId || undefined,
      type: (task.isMilestone
        ? 'milestone'
        : task.parentTaskId
          ? 'task'
          : 'project') as 'project' | 'task' | 'milestone',
      open: true,
    }));

    const ganttLinks = dependencies.map(dep => ({
      id: dep.id,
      source: dep.predecessorTaskId,
      target: dep.successorTaskId,
      type: this.mapDependencyTypeToGantt(dep.dependencyType),
      lag: dep.lagDays,
    }));

    return {
      tasks: ganttTasks,
      links: ganttLinks,
    };
  }

  // Critical Path Analysis
  async calculateCriticalPath(
    projectId: string
  ): Promise<CriticalPathAnalysis> {
    const tasks = await this.getProjectTasks(projectId);
    const dependencies = await this.getTaskDependencies(projectId);

    // Build task network
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const dependencyMap = new Map<string, string[]>();

    // Initialize dependency map
    tasks.forEach(task => {
      dependencyMap.set(task.id, []);
    });

    // Populate dependencies
    dependencies.forEach(dep => {
      const successors = dependencyMap.get(dep.predecessorTaskId) || [];
      successors.push(dep.successorTaskId);
      dependencyMap.set(dep.predecessorTaskId, successors);
    });

    // Forward pass - calculate early start and finish
    const earlyStart = new Map<string, number>();
    const earlyFinish = new Map<string, number>();

    const calculateEarlyTimes = (
      taskId: string,
      visited = new Set<string>()
    ): void => {
      if (visited.has(taskId)) return;
      visited.add(taskId);

      const task = taskMap.get(taskId);
      if (!task) return;

      // Find all predecessors
      const predecessors = dependencies
        .filter(dep => dep.successorTaskId === taskId)
        .map(dep => dep.predecessorTaskId);

      let maxEarlyFinish = 0;
      predecessors.forEach(predId => {
        calculateEarlyTimes(predId, visited);
        const predEarlyFinish = earlyFinish.get(predId) || 0;
        maxEarlyFinish = Math.max(maxEarlyFinish, predEarlyFinish);
      });

      const taskDuration = task.duration || 1;
      earlyStart.set(taskId, maxEarlyFinish);
      earlyFinish.set(taskId, maxEarlyFinish + taskDuration);
    };

    // Calculate early times for all tasks
    tasks.forEach(task => calculateEarlyTimes(task.id));

    // Find project duration (maximum early finish)
    const projectDuration = Math.max(...Array.from(earlyFinish.values()));

    // Backward pass - calculate late start and finish
    const lateStart = new Map<string, number>();
    const lateFinish = new Map<string, number>();

    const calculateLateTimes = (
      taskId: string,
      visited = new Set<string>()
    ): void => {
      if (visited.has(taskId)) return;
      visited.add(taskId);

      const task = taskMap.get(taskId);
      if (!task) return;

      // Find all successors
      const successors = dependencyMap.get(taskId) || [];

      let minLateStart = projectDuration;
      if (successors.length === 0) {
        // End task
        minLateStart = earlyFinish.get(taskId) || 0;
      } else {
        successors.forEach(succId => {
          calculateLateTimes(succId, visited);
          const succLateStart = lateStart.get(succId) || 0;
          minLateStart = Math.min(minLateStart, succLateStart);
        });
      }

      const taskDuration = task.duration || 1;
      lateFinish.set(taskId, minLateStart);
      lateStart.set(taskId, minLateStart - taskDuration);
    };

    // Calculate late times for all tasks
    tasks.forEach(task => calculateLateTimes(task.id));

    // Calculate total float and identify critical path
    const criticalPathTasks = tasks.map(task => {
      const es = earlyStart.get(task.id) || 0;
      const ef = earlyFinish.get(task.id) || 0;
      const ls = lateStart.get(task.id) || 0;
      const lf = lateFinish.get(task.id) || 0;
      const totalFloat = ls - es;

      return {
        taskId: task.id,
        taskName: task.taskName,
        duration: task.duration || 1,
        earlyStart: new Date(Date.now() + es * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]!,
        earlyFinish: new Date(Date.now() + ef * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]!,
        lateStart: new Date(Date.now() + ls * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]!,
        lateFinish: new Date(Date.now() + lf * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]!,
        totalFloat,
        isCritical: totalFloat === 0,
      };
    });

    return {
      projectId,
      criticalPath: criticalPathTasks.filter(t => t.isCritical),
      projectDuration,
      analysisDate: new Date().toISOString(),
    };
  }

  // Project Templates
  async createProjectTemplate(
    companyId: string,
    data: CreateProjectTemplate
  ): Promise<void> {
    await this.db.db.insert(projectTemplates).values({
      companyId,
      templateName: data.templateName,
      description: data.description || null,
      category: data.category || null,
      isPublic: data.isPublic,
      templateData: data.templateData,
    });
  }

  async getProjectTemplates(companyId: string): Promise<any[]> {
    const templates = await this.db.db
      .select()
      .from(projectTemplates)
      .where(
        sql`${projectTemplates.companyId} = ${companyId} OR ${projectTemplates.isPublic} = true`
      )
      .orderBy(asc(projectTemplates.templateName));

    return templates;
  }

  async applyProjectTemplate(
    projectId: string,
    templateId: string
  ): Promise<void> {
    const [template] = await this.db.db
      .select()
      .from(projectTemplates)
      .where(eq(projectTemplates.id, templateId));

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const templateData = template.templateData as any;

    // Create tasks from template
    if (templateData.tasks) {
      const taskIdMap = new Map<string, string>();

      // First pass: create all tasks
      for (const templateTask of templateData.tasks) {
        const task = await this.createTask({
          ...templateTask,
          projectId,
          parentTaskId: undefined, // Will be set in second pass
        });
        taskIdMap.set(templateTask.id, task.id);
      }

      // Second pass: set parent relationships
      for (const templateTask of templateData.tasks) {
        if (templateTask.parentTaskId) {
          const newTaskId = taskIdMap.get(templateTask.id);
          const newParentId = taskIdMap.get(templateTask.parentTaskId);

          if (newTaskId && newParentId) {
            await this.updateTask(newTaskId, { parentTaskId: newParentId });
          }
        }
      }

      // Third pass: create dependencies
      if (templateData.dependencies) {
        for (const templateDep of templateData.dependencies) {
          const predecessorId = taskIdMap.get(templateDep.predecessorTaskId);
          const successorId = taskIdMap.get(templateDep.successorTaskId);

          if (predecessorId && successorId) {
            await this.createTaskDependency({
              predecessorTaskId: predecessorId,
              successorTaskId: successorId,
              dependencyType: templateDep.dependencyType,
              lagDays: templateDep.lagDays || 0,
            });
          }
        }
      }
    }

    // Create milestones from template
    if (templateData.milestones) {
      for (const templateMilestone of templateData.milestones) {
        await this.createMilestone({
          ...templateMilestone,
          projectId,
        });
      }
    }
  }

  // Team Management
  async addTeamMember(data: CreateProjectTeamMember): Promise<void> {
    await this.db.db.insert(projectTeamMembers).values({
      projectId: data.projectId,
      userId: data.userId,
      role: data.role,
      allocationPercentage: data.allocationPercentage.toString(),
      startDate: data.startDate || null,
      endDate: data.endDate || null,
    });
  }

  async removeTeamMember(projectId: string, userId: string): Promise<void> {
    await this.db.db
      .delete(projectTeamMembers)
      .where(
        and(
          eq(projectTeamMembers.projectId, projectId),
          eq(projectTeamMembers.userId, userId)
        )
      );
  }

  async getTeamMembers(projectId: string): Promise<any[]> {
    const members = await this.db.db
      .select()
      .from(projectTeamMembers)
      .where(eq(projectTeamMembers.projectId, projectId));

    return members;
  }

  // Milestones
  async createMilestone(data: CreateProjectMilestone): Promise<void> {
    await this.db.db.insert(projectMilestones).values({
      projectId: data.projectId,
      milestoneName: data.milestoneName,
      description: data.description || null,
      targetDate: data.targetDate,
      status: 'Pending',
      isCompleted: false,
    });
  }

  async updateMilestone(
    id: string,
    data: UpdateProjectMilestone
  ): Promise<void> {
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (data.projectId !== undefined) updateData.projectId = data.projectId;
    if (data.milestoneName !== undefined) updateData.milestoneName = data.milestoneName;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.targetDate !== undefined) updateData.targetDate = data.targetDate;
    if (data.actualDate !== undefined) updateData.actualDate = data.actualDate || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isCompleted !== undefined) updateData.isCompleted = data.isCompleted;

    const [milestone] = await this.db.db
      .update(projectMilestones)
      .set(updateData)
      .where(eq(projectMilestones.id, id))
      .returning();

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }
  }

  async getProjectMilestones(projectId: string): Promise<any[]> {
    const milestones = await this.db.db
      .select()
      .from(projectMilestones)
      .where(eq(projectMilestones.projectId, projectId))
      .orderBy(asc(projectMilestones.targetDate));

    return milestones;
  }

  // Helper methods
  private async getTaskDependencies(projectId: string): Promise<any[]> {
    const dependencies = await this.db.db
      .select()
      .from(taskDependencies)
      .innerJoin(
        projectTasks,
        eq(taskDependencies.predecessorTaskId, projectTasks.id)
      )
      .where(eq(projectTasks.projectId, projectId));

    return dependencies.map(d => d['task_dependencies']);
  }

  private async wouldCreateCircularDependency(
    predecessorId: string,
    successorId: string
  ): Promise<boolean> {
    // Simple cycle detection using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = async (taskId: string): Promise<boolean> => {
      if (recursionStack.has(taskId)) return true;
      if (visited.has(taskId)) return false;

      visited.add(taskId);
      recursionStack.add(taskId);

      // Get all successors of current task
      const successors = await this.db.db
        .select()
        .from(taskDependencies)
        .where(eq(taskDependencies.predecessorTaskId, taskId));

      for (const successor of successors) {
        if (await hasCycle(successor.successorTaskId)) {
          return true;
        }
      }

      recursionStack.delete(taskId);
      return false;
    };

    // Temporarily add the new dependency and check for cycles
    await this.db.db.insert(taskDependencies).values({
      predecessorTaskId: predecessorId,
      successorTaskId: successorId,
      dependencyType: 'FS',
      lagDays: 0,
    });

    const hasCycleResult = await hasCycle(predecessorId);

    // Remove the temporary dependency
    await this.db.db
      .delete(taskDependencies)
      .where(
        and(
          eq(taskDependencies.predecessorTaskId, predecessorId),
          eq(taskDependencies.successorTaskId, successorId)
        )
      );

    return hasCycleResult;
  }

  private mapDependencyTypeToGantt(type: string): '0' | '1' | '2' | '3' {
    const mapping: Record<string, '0' | '1' | '2' | '3'> = {
      FS: '0', // Finish-to-Start
      SS: '1', // Start-to-Start
      FF: '2', // Finish-to-Finish
      SF: '3', // Start-to-Finish
    };
    return mapping[type] || '0';
  }

  private async updateProjectProgress(projectId: string): Promise<void> {
    // Calculate project progress based on task completion
    const tasks = await this.getProjectTasks(projectId);

    if (tasks.length === 0) return;

    const totalWeight = tasks.reduce(
      (sum, task) => sum + (task.estimatedHours || 1),
      0
    );
    const completedWeight = tasks.reduce(
      (sum, task) =>
        sum + (task.estimatedHours || 1) * (task.percentComplete / 100),
      0
    );

    const projectProgress =
      totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

    await this.db.db
      .update(projects)
      .set({
        percentComplete: Math.round(projectProgress * 100) / 100,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));
  }

  // Financial/Accounting Methods
  async getProjectBudgets(projectId: string, companyId: string): Promise<ProjectBudget[]> {
    // Validate project access
    await this.getProject(projectId, companyId);

    const budgets = await this.db.db
      .select()
      .from(projectBudgets)
      .where(eq(projectBudgets.projectId, projectId))
      .orderBy(desc(projectBudgets.createdAt));

    return budgets.map(budget => ({
      id: budget.id,
      projectId: budget.projectId,
      budgetName: budget.budgetName,
      budgetType: budget.budgetType as 'Original' | 'Revised' | 'Approved',
      totalBudget: parseFloat(budget.totalBudget),
      laborBudget: parseFloat(budget.laborBudget || '0'),
      materialBudget: parseFloat(budget.materialBudget || '0'),
      overheadBudget: parseFloat(budget.overheadBudget || '0'),
      contingencyBudget: parseFloat(budget.contingencyBudget || '0'),
      status: budget.status as 'Draft' | 'Submitted' | 'Approved' | 'Rejected',
      approvedBy: budget.approvedBy || undefined,
      approvedAt: budget.approvedAt?.toISOString() || undefined,
      budgetPeriodStart: budget.budgetPeriodStart || undefined,
      budgetPeriodEnd: budget.budgetPeriodEnd || undefined,
      notes: budget.notes || undefined,
      createdBy: budget.createdBy,
      createdAt: budget.createdAt.toISOString(),
      updatedAt: budget.updatedAt.toISOString(),
    }));
  }

  async getBudgetCategories(budgetId: string, companyId: string): Promise<ProjectBudgetCategory[]> {
    // Validate budget exists and user has access
    const budget = await this.db.db
      .select()
      .from(projectBudgets)
      .innerJoin(projects, eq(projectBudgets.projectId, projects.id))
      .where(
        and(
          eq(projectBudgets.id, budgetId),
          eq(projects.companyId, companyId)
        )
      )
      .limit(1);

    if (!budget.length) {
      throw new NotFoundException('Budget not found');
    }

    const categories = await this.db.db
      .select()
      .from(projectBudgetCategories)
      .where(eq(projectBudgetCategories.budgetId, budgetId))
      .orderBy(asc(projectBudgetCategories.categoryName));

    return categories.map(category => ({
      id: category.id,
      budgetId: category.budgetId,
      categoryName: category.categoryName,
      categoryCode: category.categoryCode,
      budgetedAmount: parseFloat(category.budgetedAmount),
      description: category.description || undefined,
      isActive: category.isActive || false,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    }));
  }

  async getProjectCosts(projectId: string, companyId: string, filter?: any): Promise<ProjectCost[]> {
    // Validate project access
    await this.getProject(projectId, companyId);

    let query = this.db.db
      .select()
      .from(projectCosts)
      .where(eq(projectCosts.projectId, projectId));

    if (filter?.status) {
      query = query.where(eq(projectCosts.status, filter.status));
    }

    if (filter?.costType) {
      query = query.where(eq(projectCosts.costType, filter.costType));
    }

    const costs = await query.orderBy(desc(projectCosts.costDate));
    return costs.map(cost => ({
      id: cost.id,
      projectId: cost.projectId,
      taskId: cost.taskId || undefined,
      budgetCategoryId: cost.budgetCategoryId || undefined,
      costType: cost.costType as 'Labor' | 'Material' | 'Overhead' | 'Travel' | 'Other',
      costDate: cost.costDate,
      description: cost.description,
      quantity: parseFloat(cost.quantity || '1'),
      unitCost: parseFloat(cost.unitCost),
      totalCost: parseFloat(cost.totalCost),
      isBillable: cost.isBillable || false,
      billingRate: cost.billingRate ? parseFloat(cost.billingRate) : undefined,
      billableAmount: cost.billableAmount ? parseFloat(cost.billableAmount) : undefined,
      invoiceId: cost.invoiceId || undefined,
      status: cost.status as 'Pending' | 'Approved' | 'Invoiced' | 'Paid',
      approvedBy: cost.approvedBy || undefined,
      approvedAt: cost.approvedAt?.toISOString() || undefined,
      attachments: cost.attachments as string[] || undefined,
      customFields: cost.customFields as Record<string, any> || undefined,
      createdBy: cost.createdBy,
      createdAt: cost.createdAt.toISOString(),
      updatedAt: cost.updatedAt.toISOString(),
    }));
  }

  async getProjectRevenue(projectId: string, companyId: string): Promise<ProjectRevenue[]> {
    // Validate project access
    await this.getProject(projectId, companyId);

    const revenue = await this.db.db
      .select()
      .from(projectRevenue)
      .where(eq(projectRevenue.projectId, projectId))
      .orderBy(desc(projectRevenue.revenueDate));

    return revenue.map(rev => ({
      id: rev.id,
      projectId: rev.projectId,
      revenueType: rev.revenueType as 'Fixed' | 'TimeAndMaterial' | 'Milestone' | 'Recurring',
      description: rev.description,
      revenueDate: rev.revenueDate,
      amount: parseFloat(rev.amount),
      recognizedAmount: parseFloat(rev.recognizedAmount || '0'),
      milestoneId: rev.milestoneId || undefined,
      invoiceId: rev.invoiceId || undefined,
      status: rev.status as 'Planned' | 'Recognized' | 'Invoiced' | 'Collected',
      recognitionMethod: rev.recognitionMethod as 'Percentage' | 'Milestone' | 'Completed',
      recognitionPercentage: parseFloat(rev.recognitionPercentage || '0'),
      notes: rev.notes || undefined,
      createdBy: rev.createdBy,
      createdAt: rev.createdAt.toISOString(),
      updatedAt: rev.updatedAt.toISOString(),
    }));
  }

  async getProjectInvoices(projectId: string, companyId: string): Promise<ProjectInvoice[]> {
    // Validate project access
    await this.getProject(projectId, companyId);

    const invoices = await this.db.db
      .select()
      .from(projectInvoices)
      .where(eq(projectInvoices.projectId, projectId))
      .orderBy(desc(projectInvoices.invoiceDate));

    return invoices.map(invoice => ({
      id: invoice.id,
      projectId: invoice.projectId,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      billingPeriodStart: invoice.billingPeriodStart || undefined,
      billingPeriodEnd: invoice.billingPeriodEnd || undefined,
      subtotal: parseFloat(invoice.subtotal),
      taxAmount: parseFloat(invoice.taxAmount || '0'),
      totalAmount: parseFloat(invoice.totalAmount),
      paidAmount: parseFloat(invoice.paidAmount || '0'),
      status: invoice.status as 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled',
      paymentTerms: invoice.paymentTerms || undefined,
      notes: invoice.notes || undefined,
      customerId: invoice.customerId || undefined,
      sentAt: invoice.sentAt?.toISOString() || undefined,
      paidAt: invoice.paidAt?.toISOString() || undefined,
      createdBy: invoice.createdBy,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
    }));
  }

  async calculateProjectProfitability(projectId: string, companyId: string): Promise<ProjectProfitability> {
    // Validate project access
    await this.getProject(projectId, companyId);

    // Get total revenue
    const revenueData = await this.db.db
      .select({
        totalRevenue: sql<string>`COALESCE(SUM(${projectRevenue.amount}), 0)`,
      })
      .from(projectRevenue)
      .where(eq(projectRevenue.projectId, projectId));

    // Get total costs
    const costData = await this.db.db
      .select({
        totalCosts: sql<string>`COALESCE(SUM(${projectCosts.totalCost}), 0)`,
      })
      .from(projectCosts)
      .where(eq(projectCosts.projectId, projectId));

    const totalRevenue = parseFloat(revenueData[0]?.totalRevenue || '0');
    const totalCosts = parseFloat(costData[0]?.totalCosts || '0');
    const grossProfit = totalRevenue - totalCosts;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      id: crypto.randomUUID(),
      projectId,
      analysisDate: new Date().toISOString().split('T')[0]!,
      totalRevenue,
      totalCosts,
      grossProfit,
      grossMargin,
      laborCosts: 0,
      materialCosts: 0,
      overheadCosts: 0,
      budgetVariance: 0,
      scheduleVariance: 0,
      earnedValue: 0,
      actualCost: totalCosts,
      plannedValue: 0,
      costPerformanceIndex: 1,
      schedulePerformanceIndex: 1,
      estimateAtCompletion: undefined,
      estimateToComplete: undefined,
      createdAt: new Date().toISOString(),
    };
  }

  async getProjectFinancialSummary(projectId: string, companyId: string): Promise<ProjectFinancialSummary> {
    const profitability = await this.calculateProjectProfitability(projectId, companyId);
    const project = await this.getProject(projectId, companyId);
    
    // Get budget information
    const budgets = await this.getProjectBudgets(projectId, companyId);
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.totalBudget, 0);
    
    // Get invoice information
    const invoices = await this.getProjectInvoices(projectId, companyId);
    const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const totalPaid = invoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0);

    return {
      projectId,
      projectName: project.projectName,
      totalBudget,
      totalCosts: profitability.totalCosts,
      totalRevenue: profitability.totalRevenue,
      grossProfit: profitability.grossProfit,
      grossMargin: profitability.grossMargin,
      budgetVariance: totalBudget - profitability.totalCosts,
      costsByCategory: {
        labor: 0,
        material: 0,
        overhead: 0,
        travel: 0,
        other: 0,
      },
      invoicesSummary: {
        totalInvoiced,
        totalPaid,
        outstanding: totalInvoiced - totalPaid,
        overdue: 0,
      },
      profitabilityMetrics: {
        costPerformanceIndex: profitability.costPerformanceIndex,
        schedulePerformanceIndex: profitability.schedulePerformanceIndex,
        earnedValue: profitability.earnedValue,
        estimateAtCompletion: profitability.estimateAtCompletion || 0,
      },
    };
  }

  async createProjectBudget(companyId: string, userId: string, data: CreateProjectBudget): Promise<ProjectBudget> {
    // Validate project exists and user has access
    await this.getProject(data.projectId, companyId);

    const [budget] = await this.db.db
      .insert(projectBudgets)
      .values({
        projectId: data.projectId,
        budgetName: data.budgetName,
        budgetType: data.budgetType,
        totalBudget: data.totalBudget.toString(),
        laborBudget: data.laborBudget.toString(),
        materialBudget: data.materialBudget.toString(),
        overheadBudget: data.overheadBudget.toString(),
        contingencyBudget: data.contingencyBudget.toString(),
        budgetPeriodStart: data.budgetPeriodStart || null,
        budgetPeriodEnd: data.budgetPeriodEnd || null,
        notes: data.notes || null,
        createdBy: userId,
      })
      .returning();

    return {
      id: budget!.id,
      projectId: budget!.projectId,
      budgetName: budget!.budgetName,
      budgetType: budget!.budgetType as 'Original' | 'Revised' | 'Approved',
      totalBudget: parseFloat(budget!.totalBudget),
      laborBudget: parseFloat(budget!.laborBudget || '0'),
      materialBudget: parseFloat(budget!.materialBudget || '0'),
      overheadBudget: parseFloat(budget!.overheadBudget || '0'),
      contingencyBudget: parseFloat(budget!.contingencyBudget || '0'),
      status: budget!.status as 'Draft' | 'Submitted' | 'Approved' | 'Rejected',
      approvedBy: budget!.approvedBy || undefined,
      approvedAt: budget!.approvedAt?.toISOString() || undefined,
      budgetPeriodStart: budget!.budgetPeriodStart || undefined,
      budgetPeriodEnd: budget!.budgetPeriodEnd || undefined,
      notes: budget!.notes || undefined,
      createdBy: budget!.createdBy,
      createdAt: budget!.createdAt.toISOString(),
      updatedAt: budget!.updatedAt.toISOString(),
    };
  }

  async updateProjectBudget(id: string, companyId: string, data: UpdateProjectBudget): Promise<ProjectBudget> {
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (data.projectId !== undefined) updateData.projectId = data.projectId;
    if (data.budgetName !== undefined) updateData.budgetName = data.budgetName;
    if (data.budgetType !== undefined) updateData.budgetType = data.budgetType;
    if (data.totalBudget !== undefined) updateData.totalBudget = data.totalBudget.toString();
    if (data.laborBudget !== undefined) updateData.laborBudget = data.laborBudget.toString();
    if (data.materialBudget !== undefined) updateData.materialBudget = data.materialBudget.toString();
    if (data.overheadBudget !== undefined) updateData.overheadBudget = data.overheadBudget.toString();
    if (data.contingencyBudget !== undefined) updateData.contingencyBudget = data.contingencyBudget.toString();
    if (data.budgetPeriodStart !== undefined) updateData.budgetPeriodStart = data.budgetPeriodStart || null;
    if (data.budgetPeriodEnd !== undefined) updateData.budgetPeriodEnd = data.budgetPeriodEnd || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.status !== undefined) updateData.status = data.status;

    const [budget] = await this.db.db
      .update(projectBudgets)
      .set(updateData)
      .where(
        and(
          eq(projectBudgets.id, id),
          eq(projectBudgets.projectId,
            sql`(SELECT id FROM projects WHERE company_id = ${companyId})`
          )
        )
      )
      .returning();

    if (!budget) {
      throw new NotFoundException('Project budget not found');
    }

    return {
      id: budget.id,
      projectId: budget.projectId,
      budgetName: budget.budgetName,
      budgetType: budget.budgetType as 'Original' | 'Revised' | 'Approved',
      totalBudget: parseFloat(budget.totalBudget),
      laborBudget: parseFloat(budget.laborBudget || '0'),
      materialBudget: parseFloat(budget.materialBudget || '0'),
      overheadBudget: parseFloat(budget.overheadBudget || '0'),
      contingencyBudget: parseFloat(budget.contingencyBudget || '0'),
      status: budget.status as 'Draft' | 'Submitted' | 'Approved' | 'Rejected',
      approvedBy: budget.approvedBy || undefined,
      approvedAt: budget.approvedAt?.toISOString() || undefined,
      budgetPeriodStart: budget.budgetPeriodStart || undefined,
      budgetPeriodEnd: budget.budgetPeriodEnd || undefined,
      notes: budget.notes || undefined,
      createdBy: budget.createdBy,
      createdAt: budget.createdAt.toISOString(),
      updatedAt: budget.updatedAt.toISOString(),
    };
  }

  async approveProjectBudget(budgetId: string, approverId: string, companyId: string): Promise<ProjectBudget> {
    const [budget] = await this.db.db
      .update(projectBudgets)
      .set({
        status: 'Approved',
        approvedBy: approverId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectBudgets.id, budgetId),
          eq(projectBudgets.projectId,
            sql`(SELECT id FROM projects WHERE company_id = ${companyId})`
          )
        )
      )
      .returning();

    if (!budget) {
      throw new NotFoundException('Project budget not found');
    }

    return {
      id: budget.id,
      projectId: budget.projectId,
      budgetName: budget.budgetName,
      budgetType: budget.budgetType as 'Original' | 'Revised' | 'Approved',
      totalBudget: parseFloat(budget.totalBudget),
      laborBudget: parseFloat(budget.laborBudget || '0'),
      materialBudget: parseFloat(budget.materialBudget || '0'),
      overheadBudget: parseFloat(budget.overheadBudget || '0'),
      contingencyBudget: parseFloat(budget.contingencyBudget || '0'),
      status: budget.status as 'Draft' | 'Submitted' | 'Approved' | 'Rejected',
      approvedBy: budget.approvedBy || undefined,
      approvedAt: budget.approvedAt?.toISOString() || undefined,
      budgetPeriodStart: budget.budgetPeriodStart || undefined,
      budgetPeriodEnd: budget.budgetPeriodEnd || undefined,
      notes: budget.notes || undefined,
      createdBy: budget.createdBy,
      createdAt: budget.createdAt.toISOString(),
      updatedAt: budget.updatedAt.toISOString(),
    };
  }

  async createBudgetCategory(data: CreateProjectBudgetCategory, companyId: string): Promise<ProjectBudgetCategory> {
    // Validate budget exists and user has access
    const budget = await this.db.db
      .select()
      .from(projectBudgets)
      .innerJoin(projects, eq(projectBudgets.projectId, projects.id))
      .where(
        and(
          eq(projectBudgets.id, data.budgetId),
          eq(projects.companyId, companyId)
        )
      )
      .limit(1);

    if (!budget.length) {
      throw new NotFoundException('Budget not found');
    }

    const [category] = await this.db.db
      .insert(projectBudgetCategories)
      .values({
        budgetId: data.budgetId,
        categoryName: data.categoryName,
        categoryCode: data.categoryCode,
        budgetedAmount: data.budgetedAmount.toString(),
        description: data.description || null,
      })
      .returning();

    return {
      id: category!.id,
      budgetId: category!.budgetId,
      categoryName: category!.categoryName,
      categoryCode: category!.categoryCode,
      budgetedAmount: parseFloat(category!.budgetedAmount),
      description: category!.description || undefined,
      isActive: category!.isActive || false,
      createdAt: category!.createdAt.toISOString(),
      updatedAt: category!.updatedAt.toISOString(),
    };
  }

  async createProjectCost(data: CreateProjectCost, userId: string, companyId: string): Promise<ProjectCost> {
    // Validate project access
    await this.getProject(data.projectId, companyId);

    const [cost] = await this.db.db
      .insert(projectCosts)
      .values({
        projectId: data.projectId,
        taskId: data.taskId || null,
        budgetCategoryId: data.budgetCategoryId || null,
        costType: data.costType,
        costDate: data.costDate,
        description: data.description,
        quantity: data.quantity.toString(),
        unitCost: data.unitCost.toString(),
        totalCost: data.totalCost.toString(),
        isBillable: data.isBillable,
        billingRate: data.billingRate?.toString() || null,
        billableAmount: data.billableAmount?.toString() || null,
        attachments: data.attachments || null,
        customFields: data.customFields || null,
        createdBy: userId,
      })
      .returning();

    return {
      id: cost!.id,
      projectId: cost!.projectId,
      taskId: cost!.taskId || undefined,
      budgetCategoryId: cost!.budgetCategoryId || undefined,
      costType: cost!.costType as 'Labor' | 'Material' | 'Overhead' | 'Travel' | 'Other',
      costDate: cost!.costDate,
      description: cost!.description,
      quantity: parseFloat(cost!.quantity || '1'),
      unitCost: parseFloat(cost!.unitCost),
      totalCost: parseFloat(cost!.totalCost),
      isBillable: cost!.isBillable || false,
      billingRate: cost!.billingRate ? parseFloat(cost!.billingRate) : undefined,
      billableAmount: cost!.billableAmount ? parseFloat(cost!.billableAmount) : undefined,
      invoiceId: cost!.invoiceId || undefined,
      status: cost!.status as 'Pending' | 'Approved' | 'Invoiced' | 'Paid',
      approvedBy: cost!.approvedBy || undefined,
      approvedAt: cost!.approvedAt?.toISOString() || undefined,
      attachments: cost!.attachments as string[] || undefined,
      customFields: cost!.customFields as Record<string, any> || undefined,
      createdBy: cost!.createdBy,
      createdAt: cost!.createdAt.toISOString(),
      updatedAt: cost!.updatedAt.toISOString(),
    };
  }

  async updateProjectCost(id: string, data: UpdateProjectCost, companyId: string): Promise<ProjectCost> {
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (data.projectId !== undefined) updateData.projectId = data.projectId;
    if (data.taskId !== undefined) updateData.taskId = data.taskId || null;
    if (data.budgetCategoryId !== undefined) updateData.budgetCategoryId = data.budgetCategoryId || null;
    if (data.costType !== undefined) updateData.costType = data.costType;
    if (data.costDate !== undefined) updateData.costDate = data.costDate;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.quantity !== undefined) updateData.quantity = data.quantity.toString();
    if (data.unitCost !== undefined) updateData.unitCost = data.unitCost.toString();
    if (data.totalCost !== undefined) updateData.totalCost = data.totalCost.toString();
    if (data.isBillable !== undefined) updateData.isBillable = data.isBillable;
    if (data.billingRate !== undefined) updateData.billingRate = data.billingRate?.toString() || null;
    if (data.billableAmount !== undefined) updateData.billableAmount = data.billableAmount?.toString() || null;
    if (data.attachments !== undefined) updateData.attachments = data.attachments || null;
    if (data.customFields !== undefined) updateData.customFields = data.customFields || null;
    if (data.status !== undefined) updateData.status = data.status;

    const [cost] = await this.db.db
      .update(projectCosts)
      .set(updateData)
      .where(
        and(
          eq(projectCosts.id, id),
          eq(projectCosts.projectId,
            sql`(SELECT id FROM projects WHERE company_id = ${companyId})`
          )
        )
      )
      .returning();

    if (!cost) {
      throw new NotFoundException('Project cost not found');
    }

    return {
      id: cost.id,
      projectId: cost.projectId,
      taskId: cost.taskId || undefined,
      budgetCategoryId: cost.budgetCategoryId || undefined,
      costType: cost.costType as 'Labor' | 'Material' | 'Overhead' | 'Travel' | 'Other',
      costDate: cost.costDate,
      description: cost.description,
      quantity: parseFloat(cost.quantity || '1'),
      unitCost: parseFloat(cost.unitCost),
      totalCost: parseFloat(cost.totalCost),
      isBillable: cost.isBillable || false,
      billingRate: cost.billingRate ? parseFloat(cost.billingRate) : undefined,
      billableAmount: cost.billableAmount ? parseFloat(cost.billableAmount) : undefined,
      invoiceId: cost.invoiceId || undefined,
      status: cost.status as 'Pending' | 'Approved' | 'Invoiced' | 'Paid',
      approvedBy: cost.approvedBy || undefined,
      approvedAt: cost.approvedAt?.toISOString() || undefined,
      attachments: cost.attachments as string[] || undefined,
      customFields: cost.customFields as Record<string, any> || undefined,
      createdBy: cost.createdBy,
      createdAt: cost.createdAt.toISOString(),
      updatedAt: cost.updatedAt.toISOString(),
    };
  }

  async approveProjectCost(costId: string, approverId: string, companyId: string): Promise<ProjectCost> {
    const [cost] = await this.db.db
      .update(projectCosts)
      .set({
        status: 'Approved',
        approvedBy: approverId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectCosts.id, costId),
          eq(projectCosts.projectId,
            sql`(SELECT id FROM projects WHERE company_id = ${companyId})`
          )
        )
      )
      .returning();

    if (!cost) {
      throw new NotFoundException('Project cost not found');
    }

    return {
      id: cost.id,
      projectId: cost.projectId,
      taskId: cost.taskId || undefined,
      budgetCategoryId: cost.budgetCategoryId || undefined,
      costType: cost.costType as 'Labor' | 'Material' | 'Overhead' | 'Travel' | 'Other',
      costDate: cost.costDate,
      description: cost.description,
      quantity: parseFloat(cost.quantity || '1'),
      unitCost: parseFloat(cost.unitCost),
      totalCost: parseFloat(cost.totalCost),
      isBillable: cost.isBillable || false,
      billingRate: cost.billingRate ? parseFloat(cost.billingRate) : undefined,
      billableAmount: cost.billableAmount ? parseFloat(cost.billableAmount) : undefined,
      invoiceId: cost.invoiceId || undefined,
      status: cost.status as 'Pending' | 'Approved' | 'Invoiced' | 'Paid',
      approvedBy: cost.approvedBy || undefined,
      approvedAt: cost.approvedAt?.toISOString() || undefined,
      attachments: cost.attachments as string[] || undefined,
      customFields: cost.customFields as Record<string, any> || undefined,
      createdBy: cost.createdBy,
      createdAt: cost.createdAt.toISOString(),
      updatedAt: cost.updatedAt.toISOString(),
    };
  }

  async createProjectRevenue(data: CreateProjectRevenue, userId: string, companyId: string): Promise<ProjectRevenue> {
    // Validate project access
    await this.getProject(data.projectId, companyId);

    const [revenue] = await this.db.db
      .insert(projectRevenue)
      .values({
        projectId: data.projectId,
        revenueType: data.revenueType,
        description: data.description,
        revenueDate: data.revenueDate,
        amount: data.amount.toString(),
        milestoneId: data.milestoneId || null,
        recognitionMethod: data.recognitionMethod,
        recognitionPercentage: data.recognitionPercentage.toString(),
        notes: data.notes || null,
        createdBy: userId,
      })
      .returning();

    return {
      id: revenue!.id,
      projectId: revenue!.projectId,
      revenueType: revenue!.revenueType as 'Fixed' | 'TimeAndMaterial' | 'Milestone' | 'Recurring',
      description: revenue!.description,
      revenueDate: revenue!.revenueDate,
      amount: parseFloat(revenue!.amount),
      recognizedAmount: parseFloat(revenue!.recognizedAmount || '0'),
      milestoneId: revenue!.milestoneId || undefined,
      invoiceId: revenue!.invoiceId || undefined,
      status: revenue!.status as 'Planned' | 'Recognized' | 'Invoiced' | 'Collected',
      recognitionMethod: revenue!.recognitionMethod as 'Percentage' | 'Milestone' | 'Completed',
      recognitionPercentage: parseFloat(revenue!.recognitionPercentage || '0'),
      notes: revenue!.notes || undefined,
      createdBy: revenue!.createdBy,
      createdAt: revenue!.createdAt.toISOString(),
      updatedAt: revenue!.updatedAt.toISOString(),
    };
  }

  async updateProjectRevenue(id: string, data: UpdateProjectRevenue, companyId: string): Promise<ProjectRevenue> {
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (data.projectId !== undefined) updateData.projectId = data.projectId;
    if (data.revenueType !== undefined) updateData.revenueType = data.revenueType;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.revenueDate !== undefined) updateData.revenueDate = data.revenueDate;
    if (data.amount !== undefined) updateData.amount = data.amount.toString();
    if (data.recognizedAmount !== undefined) updateData.recognizedAmount = data.recognizedAmount.toString();
    if (data.milestoneId !== undefined) updateData.milestoneId = data.milestoneId || null;
    if (data.recognitionMethod !== undefined) updateData.recognitionMethod = data.recognitionMethod;
    if (data.recognitionPercentage !== undefined) updateData.recognitionPercentage = data.recognitionPercentage.toString();
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.status !== undefined) updateData.status = data.status;

    const [revenue] = await this.db.db
      .update(projectRevenue)
      .set(updateData)
      .where(
        and(
          eq(projectRevenue.id, id),
          eq(projectRevenue.projectId,
            sql`(SELECT id FROM projects WHERE company_id = ${companyId})`
          )
        )
      )
      .returning();

    if (!revenue) {
      throw new NotFoundException('Project revenue not found');
    }

    return {
      id: revenue.id,
      projectId: revenue.projectId,
      revenueType: revenue.revenueType as 'Fixed' | 'TimeAndMaterial' | 'Milestone' | 'Recurring',
      description: revenue.description,
      revenueDate: revenue.revenueDate,
      amount: parseFloat(revenue.amount),
      recognizedAmount: parseFloat(revenue.recognizedAmount || '0'),
      milestoneId: revenue.milestoneId || undefined,
      invoiceId: revenue.invoiceId || undefined,
      status: revenue.status as 'Planned' | 'Recognized' | 'Invoiced' | 'Collected',
      recognitionMethod: revenue.recognitionMethod as 'Percentage' | 'Milestone' | 'Completed',
      recognitionPercentage: parseFloat(revenue.recognitionPercentage || '0'),
      notes: revenue.notes || undefined,
      createdBy: revenue.createdBy,
      createdAt: revenue.createdAt.toISOString(),
      updatedAt: revenue.updatedAt.toISOString(),
    };
  }

  async createProjectInvoice(data: CreateProjectInvoice, userId: string, companyId: string): Promise<ProjectInvoice> {
    // Validate project access
    await this.getProject(data.projectId, companyId);

    // Calculate totals from line items
    const subtotal = data.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = data.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.taxRate), 0);
    const totalAmount = subtotal + taxAmount;

    const [invoice] = await this.db.db
      .insert(projectInvoices)
      .values({
        projectId: data.projectId,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        billingPeriodStart: data.billingPeriodStart || null,
        billingPeriodEnd: data.billingPeriodEnd || null,
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        totalAmount: totalAmount.toString(),
        paymentTerms: data.paymentTerms || null,
        notes: data.notes || null,
        customerId: data.customerId || null,
        createdBy: userId,
      })
      .returning();

    // Create line items if provided
    if (data.lineItems && data.lineItems.length > 0) {
      const lineItemsData = data.lineItems.map(item => ({
        invoiceId: invoice!.id,
        taskId: item.taskId || null,
        costId: item.costId || null,
        description: item.description,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        lineTotal: (item.quantity * item.unitPrice).toString(),
        taxRate: item.taxRate.toString(),
        taxAmount: (item.quantity * item.unitPrice * item.taxRate).toString(),
      }));

      await this.db.db.insert(projectInvoiceLineItems).values(lineItemsData);
    }

    return {
      id: invoice!.id,
      projectId: invoice!.projectId,
      invoiceNumber: invoice!.invoiceNumber,
      invoiceDate: invoice!.invoiceDate,
      dueDate: invoice!.dueDate,
      billingPeriodStart: invoice!.billingPeriodStart || undefined,
      billingPeriodEnd: invoice!.billingPeriodEnd || undefined,
      subtotal: parseFloat(invoice!.subtotal),
      taxAmount: parseFloat(invoice!.taxAmount || '0'),
      totalAmount: parseFloat(invoice!.totalAmount),
      paidAmount: parseFloat(invoice!.paidAmount || '0'),
      status: invoice!.status as 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled',
      paymentTerms: invoice!.paymentTerms || undefined,
      notes: invoice!.notes || undefined,
      customerId: invoice!.customerId || undefined,
      sentAt: invoice!.sentAt?.toISOString() || undefined,
      paidAt: invoice!.paidAt?.toISOString() || undefined,
      createdBy: invoice!.createdBy,
      createdAt: invoice!.createdAt.toISOString(),
      updatedAt: invoice!.updatedAt.toISOString(),
    };
  }

  async updateInvoiceStatus(invoiceId: string, status: string, companyId: string, paidAmount?: number): Promise<ProjectInvoice> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (paidAmount !== undefined) {
      updateData.paidAmount = paidAmount.toString();
    }

    if (status === 'Paid') {
      updateData.paidAt = new Date();
    }

    const [invoice] = await this.db.db
      .update(projectInvoices)
      .set(updateData)
      .where(
        and(
          eq(projectInvoices.id, invoiceId),
          eq(projectInvoices.projectId,
            sql`(SELECT id FROM projects WHERE company_id = ${companyId})`
          )
        )
      )
      .returning();

    if (!invoice) {
      throw new NotFoundException('Project invoice not found');
    }

    return {
      id: invoice.id,
      projectId: invoice.projectId,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      billingPeriodStart: invoice.billingPeriodStart || undefined,
      billingPeriodEnd: invoice.billingPeriodEnd || undefined,
      subtotal: parseFloat(invoice.subtotal),
      taxAmount: parseFloat(invoice.taxAmount || '0'),
      totalAmount: parseFloat(invoice.totalAmount),
      paidAmount: parseFloat(invoice.paidAmount || '0'),
      status: invoice.status as 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled',
      paymentTerms: invoice.paymentTerms || undefined,
      notes: invoice.notes || undefined,
      customerId: invoice.customerId || undefined,
      sentAt: invoice.sentAt?.toISOString() || undefined,
      paidAt: invoice.paidAt?.toISOString() || undefined,
      createdBy: invoice.createdBy,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
    };
  }

  async generateTimeAndMaterialInvoice(
    projectId: string,
    billingPeriodStart: string,
    billingPeriodEnd: string,
    userId: string,
    companyId: string
  ): Promise<ProjectInvoice> {
    // Validate project access
    await this.getProject(projectId, companyId);

    // Get billable costs for the period
    const billableCosts = await this.db.db
      .select()
      .from(projectCosts)
      .where(
        and(
          eq(projectCosts.projectId, projectId),
          eq(projectCosts.isBillable, true),
          gte(projectCosts.costDate, billingPeriodStart),
          lte(projectCosts.costDate, billingPeriodEnd),
          sql`${projectCosts.invoiceId} IS NULL`
        )
      );

    if (billableCosts.length === 0) {
      throw new BadRequestException('No billable costs found for the specified period');
    }

    // Generate invoice number
    const invoiceCount = await this.db.db
      .select({ count: sql<number>`count(*)` })
      .from(projectInvoices)
      .where(eq(projectInvoices.projectId, projectId));

    const invoiceNumber = `INV-${projectId.slice(-6)}-${String(invoiceCount[0]!.count + 1).padStart(4, '0')}`;

    // Create line items from costs
    const lineItems = billableCosts.map(cost => ({
      taskId: cost.taskId || undefined,
      costId: cost.id || undefined,
      description: cost.description,
      quantity: parseFloat(cost.quantity || '1'),
      unitPrice: parseFloat(cost.billingRate || cost.unitCost),
      taxRate: 0, // Default tax rate
    }));

    // Create invoice
    const invoiceData: CreateProjectInvoice = {
      projectId,
      invoiceNumber,
      invoiceDate: new Date().toISOString().split('T')[0]!,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!, // 30 days from now
      billingPeriodStart,
      billingPeriodEnd,
      lineItems,
    };

    const invoice = await this.createProjectInvoice(invoiceData, userId, companyId);

    // Update costs to reference this invoice
    await this.db.db
      .update(projectCosts)
      .set({
        invoiceId: invoice.id,
        status: 'Invoiced',
        updatedAt: new Date(),
      })
      .where(
        sql`id IN (${billableCosts.map(c => `'${c.id}'`).join(',')})`
      );

    return invoice;
  }
}