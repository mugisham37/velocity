import { DatabaseService, workflowInstances, workflows } from '../../database';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray } from '../../database';
import {
  CreateWorkflowInput,
  UpdateWorkflowInput,
  Workflow,
  WorkflowDefinition,
} from '../dto/workflow.dto';

@Injectable()
export class WorkflowsService {
  constructor(private readonly db: DatabaseService) {}

  async create(
    input: CreateWorkflowInput,
    companyId: string,
    userId: string
  ): Promise<Workflow> {
    try {
      const [workflow] = await this.db.db
        .insert(workflows)
        .values({
          companyId,
          name: input.name,
          description: input.description || null,
          category: input.category,
          definition: input.definition as any,
          tags: input.tags || null,
          permissions: input.permissions,
          isTemplate: input.isTemplate || false,
          createdBy: userId,
          updatedBy: userId,
        })
        .returning();

      return this.mapToDto(workflow);
    } catch (error) {
      throw new BadRequestException(
        `Failed to create workflow: ${(error as Error).message}`
      );
    }
  }

  async findAll(
    companyId: string,
    options?: {
      category?: string;
      isActive?: boolean;
      isTemplate?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<Workflow[]> {
    const conditions = [eq(workflows.companyId, companyId)];

    if (options?.category) {
      conditions.push(eq(workflows.category, options.category));
    }

    if (options?.isActive !== undefined) {
      conditions.push(eq(workflows.isActive, options.isActive));
    }

    if (options?.isTemplate !== undefined) {
      conditions.push(eq(workflows.isTemplate, options.isTemplate));
    }

    let query = this.db.db
      .select()
      .from(workflows)
      .where(and(...conditions))
      .orderBy(desc(workflows.updatedAt));

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    const results = await query;
    return results.map(this.mapToDto);
  }

  async findById(id: string, companyId: string): Promise<Workflow> {
    const [workflow] = await this.db.db
      .select()
      .from(workflows)
      .where(and(eq(workflows.id, id), eq(workflows.companyId, companyId)));

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    return this.mapToDto(workflow);
  }

  async update(
    id: string,
    input: UpdateWorkflowInput,
    companyId: string,
    userId: string
  ): Promise<Workflow> {
    // Verify workflow exists before updating
    await this.findById(id, companyId);

    try {
      const [updated] = await this.db.db
        .update(workflows)
        .set({
          ...input,
          definition: input.definition as any,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(and(eq(workflows.id, id), eq(workflows.companyId, companyId)))
        .returning();

      return this.mapToDto(updated);
    } catch (error) {
      throw new BadRequestException(
        `Failed to update workflow: ${(error as Error).message}`
      );
    }
  }

  async delete(id: string, companyId: string): Promise<boolean> {
    // Check if workflow has active instances
    const [activeInstance] = await this.db.db
      .select({ id: workflowInstances.id })
      .from(workflowInstances)
      .where(
        and(
          eq(workflowInstances.workflowId, id),
          inArray(workflowInstances.status, ['pending', 'running'])
        )
      )
      .limit(1);

    if (activeInstance) {
      throw new BadRequestException(
        'Cannot delete workflow with active instances. Please complete or cancel all instances first.'
      );
    }

    const result = await this.db.db
      .delete(workflows)
      .where(and(eq(workflows.id, id), eq(workflows.companyId, companyId)));

    return result.length > 0;
  }

  async duplicate(
    id: string,
    companyId: string,
    userId: string,
    newName?: string
  ): Promise<Workflow> {
    const original = await this.findById(id, companyId);

    const duplicateData = {
      name: newName || `${original.name} (Copy)`,
      description: original.description || '',
      category: original.category,
      definition: original.definition,
      tags: original.tags || [],
      permissions: original.permissions,
      isTemplate: original.isTemplate,
    };

    return this.create(duplicateData, companyId, userId);
  }

  async createVersion(
    id: string,
    companyId: string,
    userId: string
  ): Promise<Workflow> {
    const original = await this.findById(id, companyId);

    // Increment version number
    const newVersion = original.version + 1;

    const [newWorkflow] = await this.db.db
      .insert(workflows)
      .values({
        companyId,
        name: original.name,
        description: original.description || null,
        category: original.category,
        version: newVersion,
        definition: original.definition as any,
        tags: original.tags || null,
        permissions: original.permissions,
        isTemplate: original.isTemplate,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    // Deactivate previous version
    await this.db.db
      .update(workflows)
      .set({ isActive: false })
      .where(eq(workflows.id, id));

    return this.mapToDto(newWorkflow);
  }

  async getCategories(companyId: string): Promise<string[]> {
    const results = await this.db.db
      .selectDistinct({ category: workflows.category })
      .from(workflows)
      .where(eq(workflows.companyId, companyId))
      .orderBy(asc(workflows.category));

    return results.map(r => r.category);
  }

  async validateDefinition(definition: WorkflowDefinition): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Basic structure validation
    if (!definition.nodes || !Array.isArray(definition.nodes)) {
      errors.push('Workflow must have nodes array');
    }

    if (!definition.edges || !Array.isArray(definition.edges)) {
      errors.push('Workflow must have edges array');
    }

    if (definition.nodes.length === 0) {
      errors.push('Workflow must have at least one node');
    }

    // Node validation
    const nodeIds = new Set<string>();
    for (const node of definition.nodes) {
      if (!node.id) {
        errors.push('All nodes must have an ID');
        continue;
      }

      if (nodeIds.has(node.id)) {
        errors.push(`Duplicate node ID: ${node.id}`);
      }
      nodeIds.add(node.id);

      if (!node.type) {
        errors.push(`Node ${node.id} must have a type`);
      }

      if (!node.label) {
        errors.push(`Node ${node.id} must have a label`);
      }
    }

    // Edge validation
    for (const edge of definition.edges) {
      if (!edge.source || !nodeIds.has(edge.source)) {
        errors.push(`Edge ${edge.id} has invalid source: ${edge.source}`);
      }

      if (!edge.target || !nodeIds.has(edge.target)) {
        errors.push(`Edge ${edge.id} has invalid target: ${edge.target}`);
      }
    }

    // Check for start node
    const hasStartNode = definition.nodes.some(node => node.type === 'start');
    if (!hasStartNode) {
      errors.push('Workflow must have a start node');
    }

    // Check for end node
    const hasEndNode = definition.nodes.some(node => node.type === 'end');
    if (!hasEndNode) {
      errors.push('Workflow must have an end node');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private mapToDto(workflow: any): Workflow {
    return {
      id: workflow.id,
      companyId: workflow.companyId,
      name: workflow.name,
      description: workflow.description,
      category: workflow.category,
      version: workflow.version,
      isActive: workflow.isActive,
      isTemplate: workflow.isTemplate,
      definition: workflow.definition as WorkflowDefinition,
      tags: workflow.tags,
      permissions: workflow.permissions,
      createdBy: workflow.createdBy,
      updatedBy: workflow.updatedBy,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    };
  }
}

