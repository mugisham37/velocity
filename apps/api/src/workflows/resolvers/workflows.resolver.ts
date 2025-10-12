import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CreateWorkflowInput,
  UpdateWorkflowInput,
  Workflow,
} from '../dto/workflow.dto';
import { WorkflowsService } from '../services/workflows.service';

@Resolver(() => Workflow)
@UseGuards(JwtAuthGuard)
export class WorkflowsResolver {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Mutation(() => Workflow)
  async createWorkflow(
    @Args('input') input: CreateWorkflowInput,
    @CurrentUser() user: any
  ): Promise<Workflow> {
    return this.workflowsService.create(input, user.companyId, user.id);
  }

  @Query(() => [Workflow])
  async workflows(
    @CurrentUser() user: any,
    @Args('category', { nullable: true }) category?: string,
    @Args('isActive', { nullable: true }) isActive?: boolean,
    @Args('isTemplate', { nullable: true }) isTemplate?: boolean,
    @Args('limit', { nullable: true }) limit?: number,
    @Args('offset', { nullable: true }) offset?: number
  ): Promise<Workflow[]> {
    return this.workflowsService.findAll(user.companyId, {
      ...(category && { category }),
      ...(isActive !== undefined && { isActive }),
      ...(isTemplate !== undefined && { isTemplate }),
      ...(limit && { limit }),
      ...(offset && { offset }),
    });
  }

  @Query(() => Workflow)
  async workflow(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: any
  ): Promise<Workflow> {
    return this.workflowsService.findById(id, user.companyId);
  }

  @Mutation(() => Workflow)
  async updateWorkflow(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateWorkflowInput,
    @CurrentUser() user: any
  ): Promise<Workflow> {
    return this.workflowsService.update(id, input, user.companyId, user.id);
  }

  @Mutation(() => Boolean)
  async deleteWorkflow(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: any
  ): Promise<boolean> {
    return this.workflowsService.delete(id, user.companyId);
  }

  @Mutation(() => Workflow)
  async duplicateWorkflow(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: any,
    @Args('newName', { nullable: true }) newName?: string
  ): Promise<Workflow> {
    return this.workflowsService.duplicate(
      id,
      user.companyId,
      user.id,
      newName
    );
  }

  @Mutation(() => Workflow)
  async createWorkflowVersion(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: any
  ): Promise<Workflow> {
    return this.workflowsService.createVersion(id, user.companyId, user.id);
  }

  @Query(() => [String])
  async workflowCategories(@CurrentUser() user: any): Promise<string[]> {
    return this.workflowsService.getCategories(user.companyId);
  }

  @Query(() => String)
  async validateWorkflowDefinition(
    @Args('definition') definition: any
  ): Promise<string> {
    const validation =
      await this.workflowsService.validateDefinition(definition);
    return JSON.stringify(validation);
  }
}
