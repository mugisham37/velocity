import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ReportBuilderService } from '../services/report-builder.service';
import type { CustomReportDefinition } from '../services/report-builder.service';

@Resolver()
@UseGuards(JwtAuthGuard)
export class ReportBuilderResolver {
  constructor(private readonly reportBuilderService: ReportBuilderService) {}

  @Query(() => String) // TODO: Create proper GraphQL types
  async availableReportFields(@CurrentUser() user: any): Promise<string> {
    const fields = await this.reportBuilderService.getAvailableFields(
      user.companyId
    );
    return JSON.stringify(fields);
  }

  @Query(() => String) // TODO: Create proper GraphQL types
  async reportTemplates(): Promise<string> {
    const templates = await this.reportBuilderService.getReportTemplates();
    return JSON.stringify(templates);
  }

  @Mutation(() => String) // TODO: Create proper GraphQL types
  async createCustomReport(
    @Args('definition') definition: string,
    @CurrentUser() user: any
  ): Promise<string> {
    const reportDef = JSON.parse(definition) as Omit<
      CustomReportDefinition,
      'id' | 'createdAt'
    >;
    const result = await this.reportBuilderService.createCustomReport(
      { ...reportDef, createdBy: user.id },
      user.companyId
    );
    return JSON.stringify(result);
  }

  @Query(() => String) // TODO: Create proper GraphQL types
  async executeCustomReport(
    @Args('reportId') reportId: string,
    @Args('parameters', { nullable: true }) parameters?: string,
    @CurrentUser() user?: any
  ): Promise<string> {
    const params = parameters ? JSON.parse(parameters) : undefined;
    const result = await this.reportBuilderService.executeCustomReport(
      reportId,
      user.companyId,
      params
    );
    return JSON.stringify(result);
  }
}

