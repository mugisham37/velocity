import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CreateWorkflowTemplateInput,
  Workflow,
  WorkflowTemplate,
} from '../dto/workflow.dto';
import { WorkflowTemplateService } from '../services/workflow-template.service';

@Resolver(() => WorkflowTemplate)
@UseGuards(JwtAuthGuard)
export class WorkflowTemplatesResolver {
  constructor(private readonly templateService: WorkflowTemplateService) {}

  @Mutation(() => WorkflowTemplate)
  async createWorkflowTemplate(
    @Args('input') input: CreateWorkflowTemplateInput,
    @CurrentUser() user: any
  ): Promise<WorkflowTemplate> {
    return this.templateService.create(input, user.id);
  }

  @Query(() => [WorkflowTemplate])
  async workflowTemplates(
    @Args('category', { nullable: true }) category?: string,
    @Args('industry', { nullable: true }) industry?: string,
    @Args('isPublic', { nullable: true }) isPublic?: boolean,
    @Args('search', { nullable: true }) search?: string,
    @Args('tags', { type: () => [String], nullable: true }) tags?: string[],
    @Args('limit', { nullable: true }) limit?: number,
    @Args('offset', { nullable: true }) offset?: number
  ): Promise<WorkflowTemplate[]> {
    return this.templateService.findAll({
      ...(category && { category }),
      ...(industry && { industry }),
      ...(isPublic !== undefined && { isPublic }),
      ...(search && { search }),
      ...(tags && { tags }),
      ...(limit && { limit }),
      ...(offset && { offset }),
    });
  }

  @Query(() => WorkflowTemplate)
  async workflowTemplate(
    @Args('id', { type: () => ID }) id: string
  ): Promise<WorkflowTemplate> {
    return this.templateService.findById(id);
  }

  @Query(() => [WorkflowTemplate])
  async workflowTemplatesByCategory(
    @Args('category') category: string
  ): Promise<WorkflowTemplate[]> {
    return this.templateService.findByCategory(category);
  }

  @Query(() => [WorkflowTemplate])
  async workflowTemplatesByIndustry(
    @Args('industry') industry: string
  ): Promise<WorkflowTemplate[]> {
    return this.templateService.findByIndustry(industry);
  }

  @Query(() => [WorkflowTemplate])
  async popularWorkflowTemplates(
    @Args('limit', { nullable: true }) limit?: number
  ): Promise<WorkflowTemplate[]> {
    return this.templateService.getPopularTemplates(limit);
  }

  @Mutation(() => Workflow)
  async useWorkflowTemplate(
    @Args('templateId', { type: () => ID }) templateId: string,
    @CurrentUser() user: any,
    @Args('name', { nullable: true }) name?: string,
    @Args('description', { nullable: true }) description?: string
  ): Promise<Workflow> {
    return this.templateService.useTemplate(
      templateId,
      user.companyId,
      user.id,
      {
        ...(name && { name }),
        ...(description && { description }),
      }
    );
  }

  @Mutation(() => Boolean)
  async deleteWorkflowTemplate(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: any
  ): Promise<boolean> {
    return this.templateService.delete(id, user.id);
  }

  @Query(() => [String])
  async workflowTemplateCategories(): Promise<string[]> {
    return this.templateService.getCategories();
  }

  @Query(() => [String])
  async workflowTemplateIndustries(): Promise<string[]> {
    return this.templateService.getIndustries();
  }

  @Query(() => [String])
  async workflowTemplateTags(): Promise<string[]> {
    return this.templateService.getAllTags();
  }

  @Mutation(() => WorkflowTemplate)
  async createTemplateFromWorkflow(
    @Args('workflowId', { type: () => ID }) workflowId: string,
    @Args('name') name: string,
    @Args('category') category: string,
    @CurrentUser() user: any,
    @Args('description', { nullable: true }) description?: string,
    @Args('industry', { nullable: true }) industry?: string,
    @Args('tags', { type: () => [String], nullable: true }) tags?: string[],
    @Args('isPublic', { nullable: true }) isPublic?: boolean
  ): Promise<WorkflowTemplate> {
    return this.templateService.createFromWorkflow(
      workflowId,
      user.companyId,
      user.id,
      {
        name,
        ...(description && { description }),
        category,
        ...(industry && { industry }),
        ...(tags && { tags }),
        ...(isPublic !== undefined && { isPublic }),
      }
    );
  }

  @Query(() => String)
  async workflowTemplateStats(): Promise<string> {
    const stats = await this.templateService.getTemplateStats();
    return JSON.stringify(stats);
  }

  @Query(() => [WorkflowTemplate])
  async searchWorkflowTemplates(
    @Args('query') query: string,
    @Args('category', { nullable: true }) category?: string,
    @Args('industry', { nullable: true }) industry?: string,
    @Args('tags', { type: () => [String], nullable: true }) tags?: string[]
  ): Promise<WorkflowTemplate[]> {
    return this.templateService.searchTemplates(query, {
      ...(category && { category }),
      ...(industry && { industry }),
      ...(tags && { tags }),
    });
  }
}
