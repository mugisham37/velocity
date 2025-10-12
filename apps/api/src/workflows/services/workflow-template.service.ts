import { DatabaseService, workflowTemplates } from '@kiro/database';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, sql } from '@kiro/database';
import {
  CreateWorkflowTemplateInput,
  WorkflowDefinition,
  WorkflowTemplate,
} from '../dto/workflow.dto';
import { WorkflowsService } from './workflows.service';

@Injectable()
export class WorkflowTemplateService {
  constructor(
    private readonly db: DatabaseService,
    private readonly workflowsService: WorkflowsService
  ) {}

  async create(
    input: CreateWorkflowTemplateInput,
    userId: string
  ): Promise<WorkflowTemplate> {
    // Validate workflow definition
    const validation = await this.workflowsService.validateDefinition(
      input.definition
    );
    if (!validation.isValid) {
      throw new BadRequestException(
        `Invalid workflow definition: ${validation.errors.join(', ')}`
      );
    }

    try {
      const [template] = await this.db.db
        .insert(workflowTemplates)
        .values({
          name: input.name,
          description: input.description || null,
          category: input.category,
          industry: input.industry || null,
          definition: input.definition as any,
          tags: input.tags || null,
          isPublic: input.isPublic || false,
          createdBy: userId,
        })
        .returning();

      return this.mapToDto(template);
    } catch (error) {
      throw new BadRequestException(
        `Failed to create workflow template: ${(error as Error).message}`
      );
    }
  }

  async findAll(options?: {
    category?: string;
    industry?: string;
    isPublic?: boolean;
    search?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<WorkflowTemplate[]> {
    const conditions: any[] = [];

    if (options?.category) {
      conditions.push(eq(workflowTemplates.category, options.category));
    }

    if (options?.industry) {
      conditions.push(eq(workflowTemplates.industry, options.industry));
    }

    if (options?.isPublic !== undefined) {
      conditions.push(eq(workflowTemplates.isPublic, options.isPublic));
    }

    if (options?.search) {
      conditions.push(
        sql`(${workflowTemplates.name} ILIKE ${`%${options.search}%`} or ${workflowTemplates.description} ILIKE ${`%${options.search}%`})`
      );
    }

    if (options?.tags?.length) {
      conditions.push(
        sql`${workflowTemplates.tags} ?| array[${options.tags.map(tag => `'${tag}'`).join(',')}]`
      );
    }

    let query = this.db.db
      .select()
      .from(workflowTemplates)
      .orderBy(
        desc(workflowTemplates.usageCount),
        desc(workflowTemplates.createdAt)
      );

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    const results = await query;
    return results.map(this.mapToDto);
  }

  async findById(id: string): Promise<WorkflowTemplate> {
    const [template] = await this.db.db
      .select()
      .from(workflowTemplates)
      .where(eq(workflowTemplates.id, id));

    if (!template) {
      throw new NotFoundException(`Workflow template with ID ${id} not found`);
    }

    return this.mapToDto(template);
  }

  async findByCategory(category: string): Promise<WorkflowTemplate[]> {
    const templates = await this.db.db
      .select()
      .from(workflowTemplates)
      .where(eq(workflowTemplates.category, category))
      .orderBy(desc(workflowTemplates.usageCount));

    return templates.map(this.mapToDto);
  }

  async findByIndustry(industry: string): Promise<WorkflowTemplate[]> {
    const templates = await this.db.db
      .select()
      .from(workflowTemplates)
      .where(eq(workflowTemplates.industry, industry))
      .orderBy(desc(workflowTemplates.usageCount));

    return templates.map(this.mapToDto);
  }

  async getPopularTemplates(limit: number = 10): Promise<WorkflowTemplate[]> {
    const templates = await this.db.db
      .select()
      .from(workflowTemplates)
      .where(eq(workflowTemplates.isPublic, true))
      .orderBy(desc(workflowTemplates.usageCount))
      .limit(limit);

    return templates.map(this.mapToDto);
  }

  async useTemplate(
    templateId: string,
    companyId: string,
    userId: string,
    customizations?: {
      name?: string;
      description?: string;
      definitionOverrides?: Partial<WorkflowDefinition>;
    }
  ): Promise<any> {
    const template = await this.findById(templateId);

    // Increment usage count
    await this.db.db
      .update(workflowTemplates)
      .set({
        usageCount: sql`${workflowTemplates.usageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(workflowTemplates.id, templateId));

    // Create workflow from template
    let definition = template.definition;

    // Apply customizations if provided
    if (customizations?.definitionOverrides) {
      definition = {
        ...definition,
        ...customizations.definitionOverrides,
        nodes: customizations.definitionOverrides.nodes || definition.nodes,
        edges: customizations.definitionOverrides.edges || definition.edges,
      };
    }

    const workflowData = {
      name: customizations?.name || template.name,
      description: customizations?.description || template.description || '',
      category: template.category,
      definition,
      tags: template.tags || [],
      isTemplate: false,
    };

    return await this.workflowsService.create(workflowData, companyId, userId);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    // Check if user owns the template or has admin rights
    const template = await this.findById(id);

    if (template.createdBy !== userId) {
      throw new BadRequestException(
        'Only the template creator can delete this template'
      );
    }

    const result = await this.db.db
      .delete(workflowTemplates)
      .where(eq(workflowTemplates.id, id));

    return result.length > 0;
  }

  async getCategories(): Promise<string[]> {
    const results = await this.db.db
      .selectDistinct({ category: workflowTemplates.category })
      .from(workflowTemplates)
      .orderBy(asc(workflowTemplates.category));

    return results.map(r => r.category);
  }

  async getIndustries(): Promise<string[]> {
    const results = await this.db.db
      .selectDistinct({ industry: workflowTemplates.industry })
      .from(workflowTemplates)
      .where(sql`${workflowTemplates.industry} is not null`)
      .orderBy(asc(workflowTemplates.industry));

    return results.map(r => r.industry!);
  }

  async getAllTags(): Promise<string[]> {
    const results = await this.db.db
      .select({ tags: workflowTemplates.tags })
      .from(workflowTemplates)
      .where(sql`${workflowTemplates.tags} is not null`);

    const allTags = new Set<string>();

    for (const result of results) {
      if (Array.isArray(result.tags)) {
        result.tags.forEach(tag => allTags.add(tag));
      }
    }

    return Array.from(allTags).sort();
  }

  async createFromWorkflow(
    workflowId: string,
    companyId: string,
    userId: string,
    templateData: {
      name: string;
      description?: string;
      category: string;
      industry?: string;
      tags?: string[];
      isPublic?: boolean;
    }
  ): Promise<WorkflowTemplate> {
    // Get the workflow
    const workflow = await this.workflowsService.findById(
      workflowId,
      companyId
    );

    const templateInput: CreateWorkflowTemplateInput = {
      name: templateData.name,
      description: templateData.description || '',
      category: templateData.category,
      industry: templateData.industry || '',
      definition: workflow.definition,
      tags: templateData.tags || [],
      isPublic: templateData.isPublic || false,
    };

    return await this.create(templateInput, userId);
  }

  async getTemplateStats(): Promise<{
    totalTemplates: number;
    publicTemplates: number;
    totalUsage: number;
    topCategories: Array<{ category: string; count: number }>;
    topIndustries: Array<{ industry: string; count: number }>;
  }> {
    const [stats] = await this.db.db
      .select({
        totalTemplates: sql<number>`count(*)`,
        publicTemplates: sql<number>`count(*) filter (where is_public = true)`,
        totalUsage: sql<number>`sum(usage_count)`,
      })
      .from(workflowTemplates);

    const topCategories = await this.db.db
      .select({
        category: workflowTemplates.category,
        count: sql<number>`count(*)`,
      })
      .from(workflowTemplates)
      .groupBy(workflowTemplates.category)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    const topIndustries = await this.db.db
      .select({
        industry: workflowTemplates.industry,
        count: sql<number>`count(*)`,
      })
      .from(workflowTemplates)
      .where(sql`${workflowTemplates.industry} is not null`)
      .groupBy(workflowTemplates.industry)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    return {
      totalTemplates: Number(stats?.totalTemplates) || 0,
      publicTemplates: Number(stats?.publicTemplates) || 0,
      totalUsage: Number(stats?.totalUsage) || 0,
      topCategories: topCategories.map(cat => ({
        category: cat.category,
        count: Number(cat.count) || 0,
      })),
      topIndustries: topIndustries.map(ind => ({
        industry: ind.industry!,
        count: Number(ind.count) || 0,
      })),
    };
  }

  async searchTemplates(
    query: string,
    filters?: {
      category?: string;
      industry?: string;
      tags?: string[];
    }
  ): Promise<WorkflowTemplate[]> {
    const conditions = [
      sql`(${workflowTemplates.name} ILIKE ${`%${query}%`} or ${workflowTemplates.description} ILIKE ${`%${query}%`})`,
    ];

    if (filters?.category) {
      conditions.push(eq(workflowTemplates.category, filters.category));
    }

    if (filters?.industry) {
      conditions.push(eq(workflowTemplates.industry, filters.industry));
    }

    if (filters?.tags?.length) {
      conditions.push(
        sql`${workflowTemplates.tags} ?| array[${filters.tags.map(tag => `'${tag}'`).join(',')}]`
      );
    }

    const templates = await this.db.db
      .select()
      .from(workflowTemplates)
      .where(and(...conditions))
      .orderBy(desc(workflowTemplates.usageCount))
      .limit(50);

    return templates.map(this.mapToDto);
  }

  private mapToDto(template: any): WorkflowTemplate {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      industry: template.industry,
      definition: template.definition as WorkflowDefinition,
      usageCount: template.usageCount,
      isPublic: template.isPublic,
      tags: template.tags,
      createdBy: template.createdBy,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}
