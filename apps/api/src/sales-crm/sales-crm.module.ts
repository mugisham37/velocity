import { Module } from '@nestjs/common';
import { AuditService } from '../common/services/audit.service';
import { NotificationService } from '../common/services/notification.service';
import { LeadsResolver } from './resolvers/leads.resolver';
import { OpportunitiesResolver } from './resolvers/opportunities.resolver';
import { POSResolver } from './resolvers/pos.resolver';
import { QuotationsResolver } from './resolvers/quotations.resolver';
import { SalesOrdersResolver } from './resolvers/sales-orders.resolver';
import { ApprovalWorkflowService } from './services/approval-workflow.service';
import { LeadAssignmentService } from './services/lead-assignment.service';
import { LeadNurturingService } from './services/lead-nurturing.service';
import { LeadScoringService } from './services/lead-scoring.service';
import { LeadsService } from './services/leads.service';
import { OpportunitiesService } from './services/opportunities.service';
import { OpportunityTemplatesService } from './services/opportunity-templates.service';
import { POSService } from './services/pos.service';
import { PricingService } from './services/pricing.service';
import { QuotationsService } from './services/quotations.service';
import { SalesAnalyticsService } from './services/sales-analytics.service';
import { SalesOrdersService } from './services/sales-orders.service';

@Module({
  providers: [
    // Services
    LeadsService,
    OpportunitiesService,
    QuotationsService,
    SalesOrdersService,
    POSService,
    LeadScoringService,
    LeadAssignmentService,
    LeadNurturingService,
    SalesAnalyticsService,
    OpportunityTemplatesService,
    PricingService,
    ApprovalWorkflowService,

    // Resolvers
    LeadsResolver,
    OpportunitiesResolver,
    QuotationsResolver,
    SalesOrdersResolver,
    POSResolver,

    // Common Services
    AuditService,
    NotificationService,
  ],
  exports: [
    LeadsService,
    OpportunitiesService,
    QuotationsService,
    SalesOrdersService,
    POSService,
    LeadScoringService,
    LeadAssignmentService,
    LeadNurturingService,
    SalesAnalyticsService,
    OpportunityTemplatesService,
    PricingService,
    ApprovalWorkflowService,
  ],
})
export class SalesCRMModule {}
