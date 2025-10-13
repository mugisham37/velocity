import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  FinancialRatiosReport,
  FinancialReport,
  FinancialReportInput,
} from '../dto/financial-report.dto';
import { BalanceSheetService } from '../services/balance-sheet.service';
import { CashFlowService } from '../services/cash-flow.service';
import { DashboardService } from '../services/dashboard.service';
import { FinancialRatiosService } from '../services/financial-ratios.service';
import { ProfitLossService } from '../services/profit-loss.service';
import { TrialBalanceService } from '../services/trial-balance.service';

@Resolver()
@UseGuards(JwtAuthGuard)
export class FinancialReportsResolver {
  constructor(
    private readonly balanceSheetService: BalanceSheetService,
    private readonly profitLossService: ProfitLossService,
    private readonly cashFlowService: CashFlowService,
    private readonly trialBalanceService: TrialBalanceService,
    private readonly financialRatiosService: FinancialRatiosService,
    private readonly dashboardService: DashboardService
  ) {}

  @Query(() => FinancialReport)
  async balanceSheet(
    @Args('input') input: FinancialReportInput,
    @CurrentUser() user: any
  ): Promise<FinancialReport> {
    return this.balanceSheetService.generateBalanceSheet(input, user.companyId);
  }

  @Query(() => FinancialReport)
  async profitLossStatement(
    @Args('input') input: FinancialReportInput,
    @CurrentUser() user: any
  ): Promise<FinancialReport> {
    return this.profitLossService.generateProfitLossStatement(
      input,
      user.companyId
    );
  }

  @Query(() => FinancialReport)
  async cashFlowStatement(
    @Args('input') input: FinancialReportInput,
    @CurrentUser() user: any
  ): Promise<FinancialReport> {
    return this.cashFlowService.generateCashFlowStatement(
      input,
      user.companyId
    );
  }

  @Query(() => FinancialReport)
  async trialBalance(
    @Args('input') input: FinancialReportInput,
    @CurrentUser() user: any
  ): Promise<FinancialReport> {
    return this.trialBalanceService.generateTrialBalance(input, user.companyId);
  }

  @Query(() => FinancialRatiosReport)
  async financialRatios(
    @Args('input') input: FinancialReportInput,
    @CurrentUser() user: any
  ): Promise<FinancialRatiosReport> {
    return this.financialRatiosService.generateFinancialRatios(
      input,
      user.companyId
    );
  }

  @Query(() => String) // TODO: Create proper dashboard DTO
  async financialDashboard(
    @Args('periodStart') periodStart: Date,
    @Args('periodEnd') periodEnd: Date,
    @CurrentUser() user: any
  ): Promise<string> {
    const dashboard = await this.dashboardService.generateFinancialDashboard(
      user.companyId,
      periodStart,
      periodEnd
    );
    return JSON.stringify(dashboard);
  }

  @Query(() => FinancialReport)
  async budgetVarianceReport(
    @Args('input') input: FinancialReportInput,
    @CurrentUser() user: any
  ): Promise<FinancialReport> {
    return this.profitLossService.generateBudgetVarianceReport(
      input,
      user.companyId
    );
  }
}

