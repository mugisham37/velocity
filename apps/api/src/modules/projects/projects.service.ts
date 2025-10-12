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
      await this.applyProjectTemplate(project!.id, data.templateId);
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
    const result = await this.db.db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.companyId, companyId)));

    if (result.rowCount === 0) {
      throw new NotFoundException('Project not found');
    }
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
    await this.updateProjectProgress(task.projectId);

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

    const result = await this.db.db
      .delete(projectTasks)
      .where(eq(projectTasks.id, id));

    if (result.rowCount === 0) {
      throw new NotFoundException('Task not found');
    }
  }

  // Task Dependencies
  async createTaskDependency(data: CreateTaskDependency): Promise<void> {
    // Validate tasks exist
    const [predecessor, successor] = await Promise.all([
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
    const result = await this.db.db
      .delete(taskDependencies)
      .where(
        and(
          eq(taskDependencies.predecessorTaskId, predecessorId),
          eq(taskDependencies.successorTaskId, successorId)
        )
      );

    if (result.rowCount === 0) {
      throw new NotFoundException('Dependency not found');
    }
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
      ...data,
      companyId,
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
    await this.db.db.insert(projectTeamMembers).values(data);
  }

  async removeTeamMember(projectId: string, userId: string): Promise<void> {
    const result = await this.db.db
      .delete(projectTeamMembers)
      .where(
        and(
          eq(projectTeamMembers.projectId, projectId),
          eq(projectTeamMembers.userId, userId)
        )
      );

    if (result.rowCount === 0) {
      throw new NotFoundException('Team member not found');
    }
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
      ...data,
      status: 'Pending',
      isCompleted: false,
    });
  }

  async updateMilestone(
    id: string,
    data: UpdateProjectMilestone
  ): Promise<void> {
    const [milestone] = await this.db.db
      .update(projectMilestones)
      .set({
        ...data,
        updatedAt: new Date(),
      })
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

    return dependencies.map(d => d.task_dependencies);
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

    return budgets as ProjectBudget[];
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

    return categories as ProjectBudgetCategory[];
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
    return costs as ProjectCost[];
  }

  async getProjectRevenue(projectId: string, companyId: string): Promise<ProjectRevenue[]> {
    // Validate project access
    await this.getProject(projectId, companyId);

    const revenue = await this.db.db
      .select()
      .from(projectRevenue)
      .where(eq(projectRevenue.projectId, projectId))
      .orderBy(desc(projectRevenue.revenueDate));

    return revenue as ProjectRevenue[];
  }

  async getProjectInvoices(projectId: string, companyId: string): Promise<ProjectInvoice[]> {
    // Validate project access
    await this.getProject(projectId, companyId);

    const invoices = await this.db.db
      .select()
      .from(projectInvoices)
      .where(eq(projectInvoices.projectId, projectId))
      .orderBy(desc(projectInvoices.invoiceDate));

    return invoices as ProjectInvoice[];
  }

  async calculateProjectProfitability(projectId: string, companyId: string): Promise<ProjectProfitability> {
    // Validate project access
    const project = await this.getProject(projectId, companyId);

    // Get total revenue
    const revenueData = await this.db.db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${projectRevenue.amount}), 0)`,
      })
      .from(projectRevenue)
      .where(eq(projectRevenue.projectId, projectId));

    // Get total costs
    const costData = await this.db.db
      .select({
        totalCosts: sql<number>`COALESCE(SUM(${projectCosts.totalCost}), 0)`,
      })
      .from(projectCosts)
      .where(eq(projectCosts.projectId, projectId));

    const totalRevenue = revenueData[0]?.totalRevenue || 0;
    const totalCosts = costData[0]?.totalCosts || 0;
    const grossProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      projectId,
      projectName: project.projectName,
      totalRevenue,
      totalCosts,
      grossProfit,
      profitMargin,
      calculatedAt: new Date().toISOString(),
    } as ProjectProfitability;
  }

  async getProjectFinancialSummary(projectId: string, companyId: string): Promise<ProjectFinancialSummary> {
    const profitability = await this.calculateProjectProfitability(projectId, companyId);
    
    // Get budget information
    const budgets = await this.getProjectBudgets(projectId, companyId);
    const totalBudget = budgets.reduce((sum, budget) => sum + (budget.totalAmount || 0), 0);
    
    // Get invoice information
    const invoices = await this.getProjectInvoices(projectId, companyId);
    const totalInvoiced = invoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
    const totalPaid = invoices.reduce((sum, invoice) => sum + (invoice.paidAmount || 0), 0);

    return {
      projectId,
      totalBudget,
      totalRevenue: profitability.totalRevenue,
      totalCosts: profitability.totalCosts,
      totalInvoiced,
      totalPaid,
      grossProfit: profitability.grossProfit,
      profitMargin: profitability.profitMargin,
      budgetVariance: totalBudget - profitability.totalCosts,
      outstandingAmount: totalInvoiced - totalPaid,
    } as ProjectFinancialSummary;
  }

  async createProjectBudget(companyId: string, userId: string, data: CreateProjectBudget): Promise<ProjectBudget> {
    // Validate project exists and user has access
    await this.getProject(data.projectId, companyId);

    const [budget] = await this.db.db
      .insert(projectBudgets)
      .values({
        ...data,
        createdBy: userId,
      })
      .returning();

    return budget as ProjectBudget;
  }

  async updateProjectBudget(id: string, companyId: string, data: UpdateProjectBudget): Promise<ProjectBudget> {
    const [budget] = await this.db.db
      .update(projectBudgets)
      .set({
        ...data,
        updatedAt: new Date(),
      })
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

    return budget as ProjectBudget;
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

    return budget as ProjectBudget;
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
      .values(data)
      .returning();

    return category as ProjectBudgetCategory;
  }

  async createProjectCost(data: CreateProjectCost, userId: string, companyId: string): Promise<ProjectCost> {
    // Validate project access
    await this.getProject(data.projectId, companyId);

    const [cost] = await this.db.db
      .insert(projectCosts)
      .values({
        ...data,
        createdBy: userId,
      })
      .returning();

    return cost as ProjectCost;
  }

  async updateProjectCost(id: string, data: UpdateProjectCost, companyId: string): Promise<ProjectCost> {
    const [cost] = await this.db.db
      .update(projectCosts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
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

    return cost as ProjectCost;
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

    return cost as ProjectCost;
  }

  async createProjectRevenue(data: CreateProjectRevenue, userId: string, companyId: string): Promise<ProjectRevenue> {
    // Validate project access
    await this.getProject(data.projectId, companyId);

    const [revenue] = await this.db.db
      .insert(projectRevenue)
      .values({
        ...data,
        createdBy: userId,
      })
      .returning();

    return revenue as ProjectRevenue;
  }

  async updateProjectRevenue(id: string, data: UpdateProjectRevenue, companyId: string): Promise<ProjectRevenue> {
    const [revenue] = await this.db.db
      .update(projectRevenue)
      .set({
        ...data,
        updatedAt: new Date(),
      })
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

    return revenue as ProjectRevenue;
  }

  async createProjectInvoice(data: CreateProjectInvoice, userId: string, companyId: string): Promise<ProjectInvoice> {
    // Validate project access
    await this.getProject(data.projectId, companyId);

    const [invoice] = await this.db.db
      .insert(projectInvoices)
      .values({
        ...data,
        createdBy: userId,
      })
      .returning();

    // Create line items if provided
    if (data.lineItems && data.lineItems.length > 0) {
      const lineItemsData = data.lineItems.map(item => ({
        ...item,
        invoiceId: invoice!.id,
      }));

      await this.db.db.insert(projectInvoiceLineItems).values(lineItemsData);
    }

    return invoice as ProjectInvoice;
  }

  async updateInvoiceStatus(invoiceId: string, status: string, companyId: string, paidAmount?: number): Promise<ProjectInvoice> {
    const [invoice] = await this.db.db
      .update(projectInvoices)
      .set({
        status,
        paidAmount: paidAmount !== undefined ? paidAmount : sql`${projectInvoices.paidAmount}`,
        paidDate: status === 'Paid' ? new Date().toISOString().split('T')[0] : sql`${projectInvoices.paidDate}`,
        updatedAt: new Date(),
      })
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

    return invoice as ProjectInvoice;
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
      taskId: cost.taskId,
      costId: cost.id,
      description: cost.description,
      quantity: cost.quantity,
      unitPrice: cost.billingRate || cost.unitCost,
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