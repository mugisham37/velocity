import {
    db,
    projectBudgetCategories,
    projectBudgets,
    projectCosts,
    projectInvoiceLineItems,
    projectInvoices,
    projectMilestones,
    projectProfitability,
    projectRevenue,
    projectTasks,
    projectTeamMembers,
    projectTemplates,
    projects,
    taskDependencies,
} from '@kiro/database';
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
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
} from '@packages/shared/types/projects';
import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { report } from 'process';
import { async } from 'rxjs';
import { query } from 'winston';

@Injectable()
export class ProjectsService {

  // Project Management
  async createProject(
    companyId: string,
    data: CreateProject
  ): Promise<Project> {
    const [project] = await db
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
      await this.applyProjectTemplate(project.id, data.templateId);
    }

    return project as Project;
  }

  async updateProject(
    id: string,
    companyId: string,
    data: UpdateProject
  ): Promise<Project> {
    const [project] = await db
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
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.companyId, companyId)));

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project as Project;
  }

  async getProjects(companyId: string, filters?: any): Promise<Project[]> {
    let query = db
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
    const result = await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.companyId, companyId)));

    if (result.rowCount === 0) {
      throw new NotFoundException('Project not found');
    }
  }

  // Work Breakdown Structure (WBS)
  async createTask(data: CreateProjectTask): Promise<ProjectTask> {
    // Validate project exists
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, data.projectId))
      .limit(1);

    if (!project.length) {
      throw new NotFoundException('Project not found');
    }

    // Generate task code if not provided
    if (!data.taskCode) {
      const taskCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(projectTasks)
        .where(eq(projectTasks.projectId, data.projectId));

      data.taskCode = `TASK-${String(taskCount[0].count + 1).padStart(4, '0')}`;
    }

    const [task] = await db
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
    const [task] = await db
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
    const [task] = await db
      .select()
      .from(projectTasks)
      .where(eq(projectTasks.id, id));

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task as ProjectTask;
  }

  async getProjectTasks(projectId: string): Promise<ProjectTask[]> {
    const tasks = await db
      .select()
      .from(projectTasks)
      .where(eq(projectTasks.projectId, projectId))
      .orderBy(asc(projectTasks.taskCode));

    return tasks as ProjectTask[];
  }

  async deleteTask(id: string): Promise<void> {
    // Check for dependencies
    const dependencies = await db
      .select()
      .from(taskDependencies)
      .where(
        sql`${taskDependencies.predecessorTaskId} = ${id} OR ${taskDependencies.successorTaskId} = ${id}`
      );

    if (dependencies.length > 0) {
      throw new BadRequestException('Cannot delete task with dependencies');
    }

    const result = await db
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

    await db.insert(taskDependencies).values(data);
  }

  async deleteTaskDependency(
    predecessorId: string,
    successorId: string
  ): Promise<void> {
    const result = await db
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
        new Date().toISOString().split('T')[0],
      end_date:
        task.endDate ||
        task.expectedEndDate ||
        new Date().toISOString().split('T')[0],
      duration: task.duration || 1,
      progress: task.percentComplete / 100,
      parent: task.parentTaskId || undefined,
      type: task.isMilestone
        ? 'milestone'
        : task.parentTaskId
          ? 'task'
          : 'project',
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
          .split('T')[0],
        earlyFinish: new Date(Date.now() + ef * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        lateStart: new Date(Date.now() + ls * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        lateFinish: new Date(Date.now() + lf * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
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
    await db.insert(projectTemplates).values({
      ...data,
      companyId,
    });
  }

  async getProjectTemplates(companyId: string): Promise<any[]> {
    const templates = await db
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
    const [template] = await db
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
    await db.insert(projectTeamMembers).values(data);
  }

  async removeTeamMember(projectId: string, userId: string): Promise<void> {
    const result = await db
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
    const members = await db
      .select()
      .from(projectTeamMembers)
      .where(eq(projectTeamMembers.projectId, projectId));

    return members;
  }

  // Milestones
  async createMilestone(data: CreateProjectMilestone): Promise<void> {
    await db.insert(projectMilestones).values({
      ...data,
      status: 'Pending',
      isCompleted: false,
    });
  }

  async updateMilestone(
    id: string,
    data: UpdateProjectMilestone
  ): Promise<void> {
    const [milestone] = await db
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
    const milestones = await db
      .select()
      .from(projectMilestones)
      .where(eq(projectMilestones.projectId, projectId))
      .orderBy(asc(projectMilestones.targetDate));

    return milestones;
  }

  // Helper methods
  private async getTaskDependencies(projectId: string): Promise<any[]> {
    const dependencies = await db
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
      const successors = await db
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
    await db.insert(taskDependencies).values({
      predecessorTaskId,
      successorTaskId,
      dependencyType: 'FS',
      lagDays: 0,
    });

    const hasCycleResult = await hasCycle(predecessorId);

    // Remove the temporary dependency
    await db
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
    const mapping = {
      FS: '0', // Finish-to-Start
      SS: '1', // Start-to-Start
      FF: '2', // Finish-to-Finish
      SF: '3', // Start-to-Finish
    };
    return (mapping[type] as '0' | '1' | '2' | '3') || '0';
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

    await db
      .update(projects)
      .set({
        percentComplete: Math.round(projectProgress * 100) / 100,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));
  }
}
  // Task Assignment and Workload Balancing
  async assignTask(taskId: string, assigneeId: string): Promise<ProjectTask> {
    // Check assignee workload
    const assigneeWorkload = await this.getAssigneeWorkload(assigneeId);

    if (assigneeWorkload.totalHours > 40) {
      throw new BadRequestException('Assignee is overloaded. Consider redistributing tasks.');
    }

    const [task] = await db
      .update(projectTasks)
      .set({
        assignedToId: assigneeId,
        updatedAt: new Date(),
      })
      .where(eq(projectTasks.id, taskId))
      .returning();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task as ProjectTask;
  }

  async getAssigneeWorkload(assigneeId: string): Promise<any> {
    const tasks = await db
      .select()
      .from(projectTasks)
      .where(
        and(
          eq(projectTasks.assignedToId, assigneeId),
          sql`${projectTasks.status} NOT IN ('Completed', 'Cancelled')`
        )
      );

    const totalHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
    const activeTasks = tasks.length;

    return {
      assigneeId,
      totalHours,
      activeTasks,
      tasks: tasks.map(task => ({
        id: task.id,
        taskName: task.taskName,
        estimatedHours: task.estimatedHours,
        status: task.status,
        priority: task.priority,
      })),
    };
  }

  async getTeamWorkloadBalance(projectId: string): Promise<any[]> {
    const teamMembers = await this.getTeamMembers(projectId);

    const workloads = await Promise.all(
      teamMembers.map(async (member) => {
        const workload = await this.getAssigneeWorkload(member.userId);
        return {
          ...member,
          workload,
        };
      })
    );

    return workloads;
  }

  // Task Status Workflow Management
  async updateTaskStatus(taskId: string, newStatus: string): Promise<ProjectTask> {
    const task = await this.getTask(taskId);

    // Validate status transition
    const validTransitions = this.getValidStatusTransitions(task.status);
    if (!validTransitions.includes(newStatus)) {
      throw new BadRequestException(`Invalid status transition from ${task.status} to ${newStatus}`);
    }

    // Auto-update progress based on status
    let percentComplete = task.percentComplete;
    if (newStatus === 'Completed') {
      percentComplete = 100;
    } else if (newStatus === 'Working' && percentComplete === 0) {
      percentComplete = 10; // Started
    }

    const [updatedTask] = await db
      .update(projectTasks)
      .set({
        status: newStatus,
        percentComplete,
        actualStartDate: newStatus === 'Working' && !task.actualStartDate
          ? new Date().toISOString().split('T')[0]
          : task.actualStartDate,
        actualEndDate: newStatus === 'Completed'
          ? new Date().toISOString().split('T')[0]
          : null,
        updatedAt: new Date(),
      })
      .where(eq(projectTasks.id, taskId))
      .returning();

    // Update project progress
    await this.updateProjectProgress(task.projectId);

    return updatedTask as ProjectTask;
  }

  private getValidStatusTransitions(currentStatus: string): string[] {
    const transitions = {
      'Open': ['Working', 'Cancelled'],
      'Working': ['Pending Review', 'Completed', 'Open', 'Cancelled'],
      'Pending Review': ['Completed', 'Working', 'Cancelled'],
      'Overdue': ['Working', 'Completed', 'Cancelled'],
      'Completed': ['Working'], // Allow reopening
      'Cancelled': ['Open'],
    };

    return transitions[currentStatus] || [];
  }

  // Task Reporting and Analytics
  async getTaskAnalytics(projectId: string): Promise<any> {
    const tasks = await this.getProjectTasks(projectId);

    const analytics = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'Completed').length,
      inProgressTasks: tasks.filter(t => t.status === 'Working').length,
      overdueTasks: tasks.filter(t => {
        const dueDate = t.endDate || t.expectedEndDate;
        return dueDate && new Date(dueDate) < new Date() && t.status !== 'Completed';
      }).length,

      // Progress metrics
      averageProgress: tasks.length > 0
        ? tasks.reduce((sum, t) => sum + t.percentComplete, 0) / tasks.length
        : 0,

      // Time metrics
      totalEstimatedHours: tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
      totalActualHours: tasks.reduce((sum, t) => sum + t.actualHours, 0),

      // Priority distribution
      priorityDistribution: {
        Low: tasks.filter(t => t.priority === 'Low').length,
        Medium: tasks.filter(t => t.priority === 'Medium').length,
        High: tasks.filter(t => t.priority === 'High').length,
        Urgent: tasks.filter(t => t.priority === 'Urgent').length,
      },

      // Status distribution
      statusDistribution: {
        Open: tasks.filter(t => t.status === 'Open').length,
        Working: tasks.filter(t => t.status === 'Working').length,
        'Pending Review': tasks.filter(t => t.status === 'Pending Review').length,
        Completed: tasks.filter(t => t.status === 'Completed').length,
        Cancelled: tasks.filter(t => t.status === 'Cancelled').length,
      },
    };

    return analytics;
  }

  async getTaskProgressReport(projectId: string): Promise<any> {
    const tasks = await this.getProjectTasks(projectId);

    const report = tasks.map(task => {
      const dueDate = task.endDate || task.expectedEndDate;
      const isOverdue = dueDate && new Date(dueDate) < new Date() && task.status !== 'Completed';
      const daysUntilDue = dueDate
        ? Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        id: task.id,
        taskCode: task.taskCode,
        taskName: task.taskName,
        assignedTo: task.assignedToId,
        status: task.status,
        priority: task.priority,
        percentComplete: task.percentComplete,
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
        dueDate,
        isOverdue,
        daysUntilDue,
        efficiency: task.estimatedHours && task.actualHours
          ? (task.estimatedHours / task.actualHours) * 100
          : null,
      };
    });

    return {
      tasks: report,
      summary: {
        onTrack: report.filter(t => !t.isOverdue && t.status !== 'Completed').length,
        overdue: report.filter(t => t.isOverdue).length,
        completed: report.filter(t => t.status === 'Completed').length,
        averageEfficiency: report
          .filter(t => t.efficiency !== null)
          .reduce((sum, t, _, arr) => sum + (t.efficiency || 0) / arr.length, 0),
      },
    };
  }
  // Project Accounting Methods

  // Budget Management
  async createProjectBudget(
    companyId: string,
    userId: string,
    data: CreateProjectBudget
  ): Promise<ProjectBudget> {
    // Validate project exists and user has access
    const project = await this.getProject(data.projectId, companyId);

    const [budget] = await db
      .insert(projectBudgets)
      .values({
        ...data,
        createdBy: userId,
      })
      .returning();

    return budget as ProjectBudget;
  }

  async updateProjectBudget(
    id: string,
    companyId: string,
    data: UpdateProjectBudget
  ): Promise<ProjectBudget> {
    const [budget] = await db
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

  async getProjectBudgets(projectId: string, companyId: string): Promise<ProjectBudget[]> {
    // Validate project access
    await this.getProject(projectId, companyId);

    const budgets = await db
      .select()
      .from(projectBudgets)
      .where(eq(projectBudgets.projectId, projectId))
      .orderBy(desc(projectBudgets.create
  return budgets as ProjectBudget[];
  }

  async approveProjectBudget(
    budgetId: string,
    approverId: string,
    companyId: string
  ): Promise<ProjectBudget> {
    const [budget] = await db
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

  // Budget Categories
  async createBudgetCategory(
    data: CreateProjectBudgetCategory,
    companyId: string
  ): Promise<ProjectBudgetCategory> {
    // Validate budget exists and user has access
    const budget = await db
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
      throw new NotFoundException('Project budget not found');
    }

    const [category] = await db
      .insert(projectBudgetCategories)
      .values(data)
      .returning();

    return category as ProjectBudgetCategory;
  }

  async getBudgetCategories(budgetId: string, companyId: string): Promise<ProjectBudgetCategory[]> {
    const categories = await db
      .select()
      .from(projectBudgetCategories)
      .innerJoin(projectBudgets, eq(projectBudgetCategories.budgetId, projectBudgets.id))
      .innerJoin(projects, eq(projectBudgets.projectId, projects.id))
      .where(
        and(
          eq(projectBudgetCategories.budgetId, budgetId),
          eq(projects.companyId, companyId),
          eq(projectBudgetCategories.isActive, true)
        )
      )
      .orderBy(asc(projectBudgetCategories.categoryName));

    return categories.map(c => c.project_budget_categories) as ProjectBudgetCategory[];
  }

  // Cost Management
  async createProjectCost(
    data: CreateProjectCost,
    userId: string,
    companyId: string
  ): Promise<ProjectCost> {
    // Validate project access
    await this.getProject(data.projectId, companyId);

    // Calculate billable amount if billing rate is provided
    let billableAmount = data.billableAmount;
    if (data.isBillable && data.billingRate && !billableAmount) {
      billableAmount = data.quantity * data.billingRate;
    }

    const [cost] = await db
      .insert(projectCosts)
      .values({
        ...data,
        billableAmount,
        createdBy: userId,
      })
      .returning();

    return cost as ProjectCost;
  }

  async updateProjectCost(
    id: string,
    data: UpdateProjectCost,
    companyId: string
  ): Promise<ProjectCost> {
    const [cost] = await db
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

  async getProjectCosts(
    projectId: string,
    companyId: string,
    filters?: {
      costType?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ProjectCost[]> {
    // Validate project access
    await this.getProject(projectId, companyId);

    let query = db
      .select()
      .from(projectCosts)
      .where(eq(projectCosts.projectId, projectId));

    if (filters?.costType) {
      query = query.where(eq(projectCosts.costType, filters.costType));
    }

    if (filters?.status) {
      query = query.where(eq(projectCosts.status, filters.status));
    }

    if (filters?.startDate && filters?.endDate) {
      query = query.where(
        and(
          gte(projectCosts.costDate, filters.startDate),
          lte(projectCosts.costDate, filters.endDate)
        )
      );
    }

    const costs = await query.orderBy(desc(projectCosts.costDate));
    return costs as ProjectCost[];
  }

  async approveProjectCost(
    costId: string,
    approverId: string,
    companyId: string
  ): Promise<ProjectCost> {
    const [cost] = await db
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

  // Revenue Management
  async createProjectRevenue(
    data: CreateProjectRevenue,
    userId: string,
    companyId: string
  ): Promise<ProjectRevenue> {
    // Validate project access
    await this.getProject(data.projectId, companyId);

    const [revenue] = await db
      .insert(projectRevenue)
      .values({
        ...data,
        createdBy: userId,
      })
      .returning();

    return revenue as ProjectRevenue;
  }

  async updateProjectRevenue(
    id: string,
    data: UpdateProjectRevenue,
    companyId: string
  ): Promise<ProjectRevenue> {
    const [revenue] = await db
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

  async getProjectRevenue(projectId: string, companyId: string): Promise<ProjectRevenue[]> {
    // Validate project access
    await this.getProject(projectId, companyId);

    const revenues = await db
      .select()
      .from(projectRevenue)
      .where(eq(projectRevenue.projectId, projectId))
      .orderBy(desc(projectRevenue.revenueDate));

    return revenues as ProjectRevenue[];
  }

  // Invoice Management
  async createProjectInvoice(
    data: CreateProjectInvoice,
    userId: string,
    companyId: string
  ): Promise<ProjectInvoice> {
    // Validate project access
    await this.getProject(data.projectId, companyId);

    // Calculate totals from line items
    const subtotal = data.lineItems.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice),
      0
    );
    const taxAmount = data.lineItems.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice * item.taxRate),
      0
    );
    const totalAmount = subtotal + taxAmount;

    const [invoice] = await db
      .insert(projectInvoices)
      .values({
        ...data,
        subtotal,
        taxAmount,
        totalAmount,
        createdBy: userId,
      })
      .returning();

    // Create line items
    if (data.lineItems.length > 0) {
      const lineItemsData = data.lineItems.map(item => ({
        ...item,
        invoiceId: invoice.id,
        lineTotal: item.quantity * item.unitPrice,
        taxAmount: item.quantity * item.unitPrice * item.taxRate,
      }));

      await db
        .insert(projectInvoiceLineItems)
        .values(lineItemsData);
    }

    return invoice as ProjectInvoice;
  }

  async getProjectInvoices(projectId: string, companyId: string): Promise<ProjectInvoice[]> {
    // Validate project access
    await this.getProject(projectId, companyId);

    const invoices = await db
      .select()
      .from(projectInvoices)
      .where(eq(projectInvoices.projectId, projectId))
      .orderBy(desc(projectInvoices.invoiceDate));

    return invoices as ProjectInvoice[];
  }

  async updateInvoiceStatus(
    invoiceId: string,
    status: string,
    companyId: string,
    paidAmount?: number
  ): Promise<ProjectInvoice> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'Sent' && !updateData.sentAt) {
      updateData.sentAt = new Date();
    }

    if (status === 'Paid' && paidAmount !== undefined) {
      updateData.paidAmount = paidAmount;
      updateData.paidAt = new Date();
    }

    const [invoice] = await db
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

    return invoice as ProjectInvoice;
  }

  // Profitability Analysis
  async calculateProjectProfitability(
    projectId: string,
    companyId: string
  ): Promise<ProjectProfitability> {
    // Validate project access
    await this.getProject(projectId, companyId);

    // Get all costs for the project
    const costs = await this.getProjectCosts(projectId, companyId, {
      status: 'Approved'
    });

    // Get all revenue for the project
    const revenues = await this.getProjectRevenue(projectId, companyId);

    // Calculate totals
    const totalCosts = costs.reduce((sum, cost) => sum + cost.totalCost, 0);
    const totalRevenue = revenues.reduce((sum, rev) => sum + rev.recognizedAmount, 0);
    const grossProfit = totalRevenue - totalCosts;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Calculate costs by category
    const laborCosts = costs
      .filter(c => c.costType === 'Labor')
      .reduce((sum, c) => sum + c.totalCost, 0);
    const materialCosts = costs
      .filter(c => c.costType === 'Material')
      .reduce((sum, c) => sum + c.totalCost, 0);
    const overheadCosts = costs
      .filter(c => c.costType === 'Overhead')
      .reduce((sum, c) => sum + c.totalCost, 0);

    // Get budget for variance calculation
    const budgets = await this.getProjectBudgets(projectId, companyId);
    const approvedBudget = budgets.find(b => b.status === 'Approved');
    const budgetVariance = approvedBudget
      ? totalCosts - approvedBudget.totalBudget
      : 0;

    // Calculate earned value metrics (simplified)
    const project = await this.getProject(projectId, companyId);
    const plannedValue = approvedBudget ? approvedBudget.totalBudget : totalCosts;
    const earnedValue = plannedValue * (project.percentComplete / 100);
    const actualCost = totalCosts;

    const costPerformanceIndex = earnedValue > 0 ? earnedValue / actualCost : 1;
    const schedulePerformanceIndex = plannedValue > 0 ? earnedValue / plannedValue : 1;

    const estimateAtCompletion = costPerformanceIndex > 0
      ? plannedValue / costPerformanceIndex
      : actualCost;
    const estimateToComplete = estimateAtCompletion - actualCost;

    const profitabilityData = {
      projectId,
      analysisDate: new Date().toISOString().split('T')[0],
      totalRevenue,
      totalCosts,
      grossProfit,
      grossMargin,
      laborCosts,
      materialCosts,
      overheadCosts,
      budgetVariance,
      scheduleVariance: project.percentComplete - 100, // Simplified
      earnedValue,
      actualCost,
      plannedValue,
      costPerformanceIndex,
      schedulePerformanceIndex,
      estimateAtCompletion,
      estimateToComplete,
    };

    // Save the analysis
    const [profitability] = await db
      .insert(projectProfitability)
      .values(profitabilityData)
      .returning();

    return profitability as ProjectProfitability;
  }

  async getProjectFinancialSummary(
    projectId: string,
    companyId: string
  ): Promise<ProjectFinancialSummary> {
    const project = await this.getProject(projectId, companyId);
    const costs = await this.getProjectCosts(projectId, companyId);
    const revenues = await this.getProjectRevenue(projectId, companyId);
    const invoices = await this.getProjectInvoices(projectId, companyId);
    const budgets = await this.getProjectBudgets(projectId, companyId);

    const totalBudget = budgets
      .filter(b => b.status === 'Approved')
      .reduce((sum, b) => sum + b.totalBudget, 0);

    const totalCosts = costs.reduce((sum, c) => sum + c.totalCost, 0);
    const totalRevenue = revenues.reduce((sum, r) => sum + r.recognizedAmount, 0);
    const grossProfit = totalRevenue - totalCosts;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const budgetVariance = totalBudget - totalCosts;

    const costsByCategory = {
      labor: costs.filter(c => c.costType === 'Labor').reduce((sum, c) => sum + c.totalCost, 0),
      material: costs.filter(c => c.costType === 'Material').reduce((sum, c) => sum + c.totalCost, 0),
      overhead: costs.filter(c => c.costType === 'Overhead').reduce((sum, c) => sum + c.totalCost, 0),
      travel: costs.filter(c => c.costType === 'Travel').reduce((sum, c) => sum + c.totalCost, 0),
      other: costs.filter(c => c.costType === 'Other').reduce((sum, c) => sum + c.totalCost, 0),
    };

    const totalInvoiced = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalPaid = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
    const outstanding = totalInvoiced - totalPaid;
    const overdue = invoices
      .filter(i => i.status === 'Overdue')
      .reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);

    // Calculate earned value metrics
    const plannedValue = totalBudget || totalCosts;
    const earnedValue = plannedValue * (project.percentComplete / 100);
    const costPerformanceIndex = earnedValue > 0 ? earnedValue / totalCosts : 1;
    const estimateAtCompletion = costPerformanceIndex > 0 ? plannedValue / costPerformanceIndex : totalCosts;

    return {
      projectId,
      projectName: project.projectName,
      totalBudget,
      totalCosts,
      totalRevenue,
      grossProfit,
      grossMargin,
      budgetVariance,
      costsByCategory,
      invoicesSummary: {
        totalInvoiced,
        totalPaid,
        outstanding,
        overdue,
      },
      profitabilityMetrics: {
        costPerformanceIndex,
        schedulePerformanceIndex: plannedValue > 0 ? earnedValue / plannedValue : 1,
        earnedValue,
        estimateAtCompletion,
      },
    };
  }

  // Time and Material Billing
  async generateTimeAndMaterialInvoice(
    projectId: string,
    billingPeriodStart: string,
    billingPeriodEnd: string,
    userId: string,
    companyId: string
  ): Promise<ProjectInvoice> {
    // Get approved costs for the billing period
    const costs = await this.getProjectCosts(projectId, companyId, {
      status: 'Approved',
      startDate: billingPeriodStart,
      endDate: billingPeriodEnd,
    });

    const billableCosts = costs.filter(c => c.isBillable && !c.invoiceId);

    if (billableCosts.length === 0) {
      throw new BadRequestException('No billable costs found for the specified period');
    }

    // Generate invoice number
    const invoiceCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(projectInvoices)
      .where(eq(projectInvoices.projectId, projectId));

    const invoiceNumber = `INV-${projectId.slice(-6)}-${String(invoiceCount[0].count + 1).padStart(4, '0')}`;

    // Create line items from costs
    const lineItems = billableCosts.map(cost => ({
      costId: cost.id,
      description: cost.description,
      quantity: cost.quantity,
      unitPrice: cost.billingRate || cost.unitCost,
      taxRate: 0, // Default tax rate, can be configured
    }));

    const invoiceData: CreateProjectInvoice = {
      projectId,
      invoiceNumber,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      billingPeriodStart,
      billingPeriodEnd,
      lineItems,
    };

    const invoice = await this.createProjectInvoice(invoiceData, userId, companyId);

    // Update costs to mark them as invoiced
    await db
      .update(projectCosts)
      .set({
        status: 'Invoiced',
        invoiceId: invoice.id,
        updatedAt: new Date(),
      })
      .where(
        sql`id IN (${billableCosts.map(c => `'${c.id}'`).join(',')})`
      );

    return invoice;
  }
}
