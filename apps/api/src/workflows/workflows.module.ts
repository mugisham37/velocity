import { DatabaseModule } from '../database';
import { Module } from '@nestjs/common';
import { WorkflowAnalyticsResolver } from './resolvers/workflow-analytics.resolver';
import { WorkflowInstancesResolver } from './resolvers/workflow-instances.resolver';
import { WorkflowTemplatesResolver } from './resolvers/workflow-templates.resolver';
import { WorkflowsResolver } from './resolvers/workflows.resolver';
import { WorkflowAnalyticsService } from './services/workflow-analytics.service';
import { WorkflowApprovalService } from './services/workflow-approval.service';
import { WorkflowExecutionService } from './services/workflow-execution.service';
import { WorkflowSlaService } from './services/workflow-sla.service';
import { WorkflowTemplateService } from './services/workflow-template.service';
import { WorkflowsService } from './services/workflows.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    // Services
    WorkflowsService,
    WorkflowExecutionService,
    WorkflowAnalyticsService,
    WorkflowTemplateService,
    WorkflowApprovalService,
    WorkflowSlaService,

    // Resolvers
    WorkflowsResolver,
    WorkflowInstancesResolver,
    WorkflowTemplatesResolver,
    WorkflowAnalyticsResolver,
  ],
  exports: [
    WorkflowsService,
    WorkflowExecutionService,
    WorkflowAnalyticsService,
    WorkflowTemplateService,
    WorkflowApprovalService,
    WorkflowSlaService,
  ],
})
export class WorkflowsModule {}

