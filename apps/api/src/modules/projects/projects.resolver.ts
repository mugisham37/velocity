import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
    CreateProject,
    CreateProjectMilestone,
    CreateProjectTask,
    CreateProjectTemplate,
    CreateTaskDependency,
    CriticalPathAnalysis,
    GanttData,
    Project,
    ProjectTask,
    UpdateProject,
    UpdateProjectMilestone,
    UpdateProjectTask,
} from '@packages/shared/types/projects';
import { ProjectsService } from './projects.service';

@Resolver('Project')
@UseGuards(JwtAuthGuard)
export class ProjectsResolver {
  constructor(private readonly projectsService: ProjectsService) {}

  // Project Management Queries
  @Query('projects')
  async getProjects(
    @Args('filter') filter: any,
    @Context() context: any
  ): Promise<Project[]> {
    const { user } = context.req;
    return this.projectsService.getProjects(user.companyId, filter);
  }

  @Query('project')
  async getProject(
    @Args('id') id: string,
    @Context() context: any
  ): Promise<Project> {
    const { user } = context.req;
    return this.projectsService.getProject(id, user.companyId);
  }

  @Query('projectTasks')
  async getProjectTasks(
    @Args('projectId') projectId: string
  ): Promise<ProjectTask[]> {
    return this.projectsService.getProjectTasks(projectId);
  }

  @Query('projectTask')
  async getProjectTask(@Args('id') id: string): Promise<ProjectTask> {
    return this.projectsService.getTask(id);
  }

  @Query('projectGanttData')
  async getProjectGanttData(
    @Args('projectId') projectId: string
  ): Promise<GanttData> {
    return this.projectsService.getGanttData(projectId);
  }

  @Query('projectCriticalPath')
  async getProjectCriticalPath(
    @Args('projectId') projectId: string
  ): Promise<CriticalPathAnalysis> {
    return this.projectsService.calculateCriticalPath(projectId);
  }

  @Query('projectTemplates')
  async getProjectTemplates(@Context() context: any): Promise<any[]> {
    const { user } = context.req;
    return this.projectsService.getProjectTemplates(user.companyId);
  }

  @Query('projectTeamMembers')
  async getProjectTeamMembers(
    @Args('projectId') projectId: string
  ): Promise<any[]> {
    return this.projectsService.getTeamMembers(projectId);
  }

  @Query('projectMilestones')
  async getProjectMilestones(
    @Args('projectId') projectId: string
  ): Promise<any[]> {
    return this.projectsService.getProjectMilestones(projectId);
  }

  // Project Management Mutations
  @Mutation('createProject')
  async createProject(
    @Args('input') input: CreateProject,
    @Context() context: any
  ): Promise<Project> {
    const { user } = context.req;
    return this.projectsService.createProject(user.companyId, input);
  }

  @Mutation('updateProject')
  async updateProject(
    @Args('id') id: string,
    @Args('input') input: UpdateProject,
    @Context() context: any
  ): Promise<Project> {
    const { user } = context.req;
    return this.projectsService.updateProject(id, user.companyId, input);
  }

  @Mutation('deleteProject')
  async deleteProject(
    @Args('id') id: string,
    @Context() context: any
  ): Promise<boolean> {
    const { user } = context.req;
    await this.projectsService.deleteProject(id, user.companyId);
    return true;
  }

  // Task Management Mutations
  @Mutation('createProjectTask')
  async createProjectTask(
    @Args('input') input: CreateProjectTask
  ): Promise<ProjectTask> {
    return this.projectsService.createTask(input);
  }

  @Mutation('updateProjectTask')
  async updateProjectTask(
    @Args('id') id: string,
    @Args('input') input: UpdateProjectTask
  ): Promise<ProjectTask> {
    return this.projectsService.updateTask(id, input);
  }

  @Mutation('deleteProjectTask')
  async deleteProjectTask(@Args('id') id: string): Promise<boolean> {
    await this.projectsService.deleteTask(id);
    return true;
  }

  // Task Dependencies
  @Mutation('createTaskDependency')
  async createTaskDependency(
    @Args('input') input: CreateTaskDependency
  ): Promise<boolean> {
    await this.projectsService.createTaskDependency(input);
    return true;
  }

  @Mutation('deleteTaskDependency')
  async deleteTaskDependency(
    @Args('predecessorId') predecessorId: string,
    @Args('successorId') successorId: string
  ): Promise<boolean> {
    await this.projectsService.deleteTaskDependency(predecessorId, successorId);
    return true;
  }

  // Team Management
  @Mutation('addProjectTeamMember')
  async addProjectTeamMember(
    @Args('input') input: CreateProjectTeamMember
  ): Promise<boolean> {
    await this.projectsService.addTeamMember(input);
    return true;
  }

  @Mutation('removeProjectTeamMember')
  async removeProjectTeamMember(
    @Args('projectId') projectId: string,
    @Args('userId') userId: string
  ): Promise<boolean> {
    await this.projectsService.removeTeamMember(projectId, userId);
    return true;
  }

  // Milestones
  @Mutation('createProjectMilestone')
  async createProjectMilestone(
    @Args('input') input: CreateProjectMilestone
  ): Promise<boolean> {
    await this.projectsService.createMilestone(input);
    return true;
  }

  @Mutation('updateProjectMilestone')
  async updateProjectMilestone(
    @Args('id') id: string,
    @Args('input') input: UpdateProjectMilestone
  ): Promise<boolean> {
    await this.projectsService.updateMilestone(id, input);
    return true;
  }

  // Templates
  @Mutation('createProjectTemplate')
  async createProjectTemplate(
    @Args('input') input: CreateProjectTemplate,
    @Context() context: any
  ): Promise<boolean> {
    const { user } = context.req;
    await this.projectsService.createProjectTemplate(user.companyId, input);
    return true;
  }

  @Mutation('applyProjectTemplate')
  async applyProjectTemplate(
    @Args('projectId') projectId: string,
    @Args('templateId') templateId: string
  ): Promise<boolean> {
    await this.projectsService.applyProjectTemplate(projectId, templateId);
    return true;
  }
}
  // Project Accounting Queries

  @Query('projectBudgets')
  async getProjectBudgets(
    @Args('projectId') projectId: string,
    @Context() context: any
  ): Promise<ProjectBudget[]> {
    const { user } = context.req;
    return this.projectsService.getProjectBudgets(projectId, user.companyId);
  }

  @Query('projectBudget')
  async getProjectBudget(@Args('id') id: string): Promise<ProjectBudget> {
    // Implementation would need to be added to service
    throw new Error('Not implemented');
  }

  @Query('budgetCategories')
  async getBudgetCategories(
    @Args('budgetId') budgetId: string,
    @Context() context: any
  ): Promise<ProjectBudgetCategory[]> {
    const { user } = context.req;
    return this.projectsService.getBudgetCategories(budgetId, user.companyId);
  }

  @Query('projectCosts')
  async getProjectCosts(
    @Args('projectId') projectId: string,
    @Args('filter') filter: any,
    @Context() context: any
  ): Promise<ProjectCost[]> {
    const { user } = context.req;
    return this.projectsService.getProjectCosts(projectId, user.companyId, filter);
  }

  @Query('projectCost')
  async getProjectCost(@Args('id') id: string): Promise<ProjectCost> {
    // Implementation would need to be added to service
    throw new Error('Not implemented');
  }

  @Query('projectRevenue')
  async getProjectRevenue(
    @Args('projectId') projectId: string,
    @Context() context: any
  ): Promise<ProjectRevenue[]> {
    const { user } = context.req;
    return this.projectsService.getProjectRevenue(projectId, user.companyId);
  }

  @Query('projectRevenueItem')
  async getProjectRevenueItem(@Args('id') id: string): Promise<ProjectRevenue> {
    // Implementation would need to be added to service
    throw new Error('Not implemented');
  }

  @Query('projectInvoices')
  async getProjectInvoices(
    @Args('projectId') projectId: string,
    @Context() context: any
  ): Promise<ProjectInvoice[]> {
    const { user } = context.req;
    return this.projectsService.getProjectInvoices(projectId, user.companyId);
  }

  @Query('projectInvoice')
  async getProjectInvoice(@Args('id') id: string): Promise<ProjectInvoice> {
    // Implementation would need to be added to service
    throw new Error('Not implemented');
  }

  @Query('projectProfitability')
  async getProjectProfitability(
    @Args('projectId') projectId: string,
    @Context() context: any
  ): Promise<ProjectProfitability> {
    const { user } = context.req;
    return this.projectsService.calculateProjectProfitability(projectId, user.companyId);
  }

  @Query('projectFinancialSummary')
  async getProjectFinancialSummary(
    @Args('projectId') projectId: string,
    @Context() context: any
  ): Promise<ProjectFinancialSummary> {
    const { user } = context.req;
    return this.projectsService.getProjectFinancialSummary(projectId, user.companyId);
  }

  // Project Accounting Mutations

  @Mutation('createProjectBudget')
  async createProjectBudget(
    @Args('input') input: CreateProjectBudget,
    @Context() context: any
  ): Promise<ProjectBudget> {
    const { user } = context.req;
    return this.projectsService.createProjectBudget(user.companyId, user.id, input);
  }

  @Mutation('updateProjectBudget')
  async updateProjectBudget(
    @Args('id') id: string,
    @Args('input') input: UpdateProjectBudget,
    @Context() context: any
  ): Promise<ProjectBudget> {
    const { user } = context.req;
    return this.projectsService.updateProjectBudget(id, user.companyId, input);
  }

  @Mutation('approveProjectBudget')
  async approveProjectBudget(
    @Args('budgetId') budgetId: string,
    @Context() context: any
  ): Promise<ProjectBudget> {
    const { user } = context.req;
    return this.projectsService.approveProjectBudget(budgetId, user.id, user.companyId);
  }

  @Mutation('deleteProjectBudget')
  async deleteProjectBudget(
    @Args('id') id: string,
    @Context() context: any
  ): Promise<boolean> {
    // Implementation would need to be added to service
    throw new Error('Not implemented');
  }

  @Mutation('createBudgetCategory')
  async createBudgetCategory(
    @Args('input') input: CreateProjectBudgetCategory,
    @Context() context: any
  ): Promise<ProjectBudgetCategory> {
    const { user } = context.req;
    return this.projectsService.createBudgetCategory(input, user.companyId);
  }

  @Mutation('updateBudgetCategory')
  async updateBudgetCategory(
    @Args('id') id: string,
    @Args('input') input: UpdateProjectBudgetCategory,
    @Context() context: any
  ): Promise<ProjectBudgetCategory> {
    // Implementation would need to be added to service
    throw new Error('Not implemented');
  }

  @Mutation('deleteBudgetCategory')
  async deleteBudgetCategory(
    @Args('id') id: string,
    @Context() context: any
  ): Promise<boolean> {
    // Implementation would need to be added to service
    throw new Error('Not implemented');
  }

  @Mutation('createProjectCost')
  async createProjectCost(
    @Args('input') input: CreateProjectCost,
    @Context() context: any
  ): Promise<ProjectCost> {
    const { user } = context.req;
    return this.projectsService.createProjectCost(input, user.id, user.companyId);
  }

  @Mutation('updateProjectCost')
  async updateProjectCost(
    @Args('id') id: string,
    @Args('input') input: UpdateProjectCost,
    @Context() context: any
  ): Promise<ProjectCost> {
    const { user } = context.req;
    return this.projectsService.updateProjectCost(id, input, user.companyId);
  }

  @Mutation('approveProjectCost')
  async approveProjectCost(
    @Args('costId') costId: string,
    @Context() context: any
  ): Promise<ProjectCost> {
    const { user } = context.req;
    return this.projectsService.approveProjectCost(costId, user.id, user.companyId);
  }

  @Mutation('deleteProjectCost')
  async deleteProjectCost(
    @Args('id') id: string,
    @Context() context: any
  ): Promise<boolean> {
    // Implementation would need to be added to service
    throw new Error('Not implemented');
  }

  @Mutation('createProjectRevenue')
  async createProjectRevenue(
    @Args('input') input: CreateProjectRevenue,
    @Context() context: any
  ): Promise<ProjectRevenue> {
    const { user } = context.req;
    return this.projectsService.createProjectRevenue(input, user.id, user.companyId);
  }

  @Mutation('updateProjectRevenue')
  async updateProjectRevenue(
    @Args('id') id: string,
    @Args('input') input: UpdateProjectRevenue,
    @Context() context: any
  ): Promise<ProjectRevenue> {
    const { user } = context.req;
    return this.projectsService.updateProjectRevenue(id, input, user.companyId);
  }

  @Mutation('deleteProjectRevenue')
  async deleteProjectRevenue(
    @Args('id') id: string,
    @Context() context: any
  ): Promise<boolean> {
    // Implementation would need to be added to service
    throw new Error('Not implemented');
  }

  @Mutation('createProjectInvoice')
  async createProjectInvoice(
    @Args('input') input: CreateProjectInvoice,
    @Context() context: any
  ): Promise<ProjectInvoice> {
    const { user } = context.req;
    return this.projectsService.createProjectInvoice(input, user.id, user.companyId);
  }

  @Mutation('updateProjectInvoice')
  async updateProjectInvoice(
    @Args('id') id: string,
    @Args('input') input: UpdateProjectInvoice,
    @Context() context: any
  ): Promise<ProjectInvoice> {
    // Implementation would need to be added to service
    throw new Error('Not implemented');
  }

  @Mutation('updateInvoiceStatus')
  async updateInvoiceStatus(
    @Args('invoiceId') invoiceId: string,
    @Args('status') status: string,
    @Args('paidAmount') paidAmount: number,
    @Context() context: any
  ): Promise<ProjectInvoice> {
    const { user } = context.req;
    return this.projectsService.updateInvoiceStatus(invoiceId, status, user.companyId, paidAmount);
  }

  @Mutation('deleteProjectInvoice')
  async deleteProjectInvoice(
    @Args('id') id: string,
    @Context() context: any
  ): Promise<boolean> {
    // Implementation would need to be added to service
    throw new Error('Not implemented');
  }

  @Mutation('generateTimeAndMaterialInvoice')
  async generateTimeAndMaterialInvoice(
    @Args('projectId') projectId: string,
    @Args('billingPeriodStart') billingPeriodStart: string,
    @Args('billingPeriodEnd') billingPeriodEnd: string,
    @Context() context: any
  ): Promise<ProjectInvoice> {
    const { user } = context.req;
    return this.projectsService.generateTimeAndMaterialInvoice(
      projectId,
      billingPeriodStart,
      billingPeriodEnd,
      user.id,
      user.companyId
    );
  }

  @Mutation('calculateProjectProfitability')
  async calculateProjectProfitability(
    @Args('projectId') projectId: string,
    @Context() context: any
  ): Promise<ProjectProfitability> {
    const { user } = context.req;
    return this.projectsService.calculateProjectProfitability(projectId, user.companyId);
  }
