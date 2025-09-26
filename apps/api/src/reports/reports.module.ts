import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { FinancialReportsResolver } from './resolvers/financial-reports.resolver';
import { ReportBuilderResolver } from './resolvers/report-builder.resolver';
import { BalanceSheetService } from './services/balance-sheet.service';
import { CashFlowService } from './services/cash-flow.service';
import { DashboardService } from './services/dashboard.service';
import { FinancialRatiosService } from './services/financial-ratios.service';
import { ProfitLossService } from './services/profit-loss.service';
import { ReportBuilderService } from './services/report-builder.service';
import { TrialBalanceService } from './services/trial-balance.service';

@Module({
  imports: [AccountsModule, AnalyticsModule],
  providers: [
    // Core Financial Reports
    BalanceSheetService,
    ProfitLossService,
    CashFlowService,
    TrialBalanceService,
    FinancialRatiosService,

    // Advanced Analytics
    DashboardService,
    ReportBuilderService,

    // Resolvers
    FinancialReportsResolver,
    ReportBuilderResolver,
  ],
  exports: [
    BalanceSheetService,
    ProfitLossService,
    CashFlowService,
    DashboardService,
    ReportBuilderService,
  ],
})
export class ReportsModule {}
