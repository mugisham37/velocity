import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import {
  FinancialReport,
  FinancialReportInput,
  FinancialReportLine,
} from '../dto/financial-report.dto';

@Injectable()
export class CashFlowService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  async generateCashFlowStatement(
    input: FinancialReportInput,
    companyId: string
  ): Promise<FinancialReport> {
    this.logger.info('Generating cash flow statement', { input, companyId });

    try {
      // Generate both direct and indirect method cash flows
      const method = 'indirect' as 'direct' | 'indirect'; // Could be configurable

      if (method === 'direct') {
        return this.generateDirectCashFlow(input, companyId);
      }
      return this.generateIndirectCashFlow(input, companyId);
    } catch (error) {
      this.logger.error('Failed to generate cash flow statement', {
        error,
        input,
        companyId,
      });
      throw error;
    }
  }

  private async generateIndirectCashFlow(
    input: FinancialReportInput,
    companyId: string
  ): Promise<FinancialReport> {
    // Start with net income and adjust for non-cash items
    const netIncome = await this.getNetIncome(
      companyId,
      input.periodStart,
      input.periodEnd
    );

    // Operating activities adjustments
    const operatingAdjustments = await this.getOperatingAdjustments(
      companyId,
      input.periodStart,
      input.periodEnd
    );
    const operatingCashFlow = netIncome + operatingAdjustments.total;

    // Investing activities
    const investingCashFlow = await this.getInvestingCashFlow(
      companyId,
      input.periodStart,
      input.periodEnd
    );

    // Financing activities
    const financingCashFlow = await this.getFinancingCashFlow(
      companyId,
      input.periodStart,
      input.periodEnd
    );

    // Net change in cash
    const netCashChange =
      operatingCashFlow + investingCashFlow + financingCashFlow;

    const lines: FinancialReportLine[] = [
      // Operating Activities
      this.createSectionHeader('CASH FLOWS FROM OPERATING ACTIVITIES'),
      this.createCashFlowLine('Net Income', netIncome),
      ...operatingAdjustments.lines,
      this.createTotalLine(
        'Net Cash from Operating Activities',
        operatingCashFlow
      ),

      // Investing Activities
      this.createSectionHeader('CASH FLOWS FROM INVESTING ACTIVITIES'),
      this.createCashFlowLine('Capital Expenditures', investingCashFlow),
      this.createTotalLine(
        'Net Cash from Investing Activities',
        investingCashFlow
      ),

      // Financing Activities
      this.createSectionHeader('CASH FLOWS FROM FINANCING ACTIVITIES'),
      this.createCashFlowLine('Debt Proceeds/Payments', financingCashFlow),
      this.createTotalLine(
        'Net Cash from Financing Activities',
        financingCashFlow
      ),

      // Net Change
      this.createTotalLine('NET CHANGE IN CASH', netCashChange, true),
    ];

    return {
      reportType: 'CASH_FLOW',
      title: 'Cash Flow Statement (Indirect Method)',
      companyName: 'Company Name',
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      lines,
      generatedAt: new Date(),
    };
  }

  private async generateDirectCashFlow(
    input: FinancialReportInput,
    companyId: string
  ): Promise<FinancialReport> {
    // Direct method shows actual cash receipts and payments
    const cashReceipts = await this.getCashReceipts(
      companyId,
      input.periodStart,
      input.periodEnd
    );
    const cashPayments = await this.getCashPayments(
      companyId,
      input.periodStart,
      input.periodEnd
    );
    const operatingCashFlow = cashReceipts - cashPayments;

    const investingCashFlow = await this.getInvestingCashFlow(
      companyId,
      input.periodStart,
      input.periodEnd
    );
    const financingCashFlow = await this.getFinancingCashFlow(
      companyId,
      input.periodStart,
      input.periodEnd
    );
    const netCashChange =
      operatingCashFlow + investingCashFlow + financingCashFlow;

    const lines: FinancialReportLine[] = [
      // Operating Activities
      this.createSectionHeader('CASH FLOWS FROM OPERATING ACTIVITIES'),
      this.createCashFlowLine('Cash Receipts from Customers', cashReceipts),
      this.createCashFlowLine('Cash Payments to Suppliers', -cashPayments),
      this.createTotalLine(
        'Net Cash from Operating Activities',
        operatingCashFlow
      ),

      // Investing Activities
      this.createSectionHeader('CASH FLOWS FROM INVESTING ACTIVITIES'),
      this.createCashFlowLine('Capital Expenditures', investingCashFlow),
      this.createTotalLine(
        'Net Cash from Investing Activities',
        investingCashFlow
      ),

      // Financing Activities
      this.createSectionHeader('CASH FLOWS FROM FINANCING ACTIVITIES'),
      this.createCashFlowLine('Debt Proceeds/Payments', financingCashFlow),
      this.createTotalLine(
        'Net Cash from Financing Activities',
        financingCashFlow
      ),

      // Net Change
      this.createTotalLine('NET CHANGE IN CASH', netCashChange, true),
    ];

    return {
      reportType: 'CASH_FLOW',
      title: 'Cash Flow Statement (Direct Method)',
      companyName: 'Company Name',
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      lines,
      generatedAt: new Date(),
    };
  }

  // Helper methods for cash flow calculations
  private async getNetIncome(
    _companyId: string,
    _start: Date,
    _end: Date
  ): Promise<number> {
    // This would calculate net income for the period
    // For now, returning mock data
    return 50000;
  }

  private async getOperatingAdjustments(
    _companyId: string,
    _start: Date,
    _end: Date
  ) {
    // Adjustments for non-cash items like depreciation, changes in working capital
    const depreciation = 10000;
    const arChange = -5000; // Increase in AR reduces cash
    const apChange = 3000; // Increase in AP increases cash
    const inventoryChange = -2000; // Increase in inventory reduces cash

    return {
      total: depreciation + arChange + apChange + inventoryChange,
      lines: [
        this.createCashFlowLine('Depreciation and Amortization', depreciation),
        this.createCashFlowLine('Changes in Accounts Receivable', arChange),
        this.createCashFlowLine('Changes in Accounts Payable', apChange),
        this.createCashFlowLine('Changes in Inventory', inventoryChange),
      ],
    };
  }

  private async getCashReceipts(
    _companyId: string,
    _start: Date,
    _end: Date
  ): Promise<number> {
    // Calculate actual cash receipts from customers
    return 150000;
  }

  private async getCashPayments(
    _companyId: string,
    _start: Date,
    _end: Date
  ): Promise<number> {
    // Calculate actual cash payments to suppliers and employees
    return 100000;
  }

  private async getInvestingCashFlow(
    _companyId: string,
    _start: Date,
    _end: Date
  ): Promise<number> {
    // Calculate cash flows from investing activities
    return -15000; // Capital expenditures
  }

  private async getFinancingCashFlow(
    _companyId: string,
    _start: Date,
    _end: Date
  ): Promise<number> {
    // Calculate cash flows from financing activities
    return 5000; // Net borrowing
  }

  private createSectionHeader(name: string): FinancialReportLine {
    return {
      accountId: `section-${name.toLowerCase().replace(/\s+/g, '-')}`,
      accountCode: '',
      accountName: name,
      accountType: 'Section',
      amount: 0,
      previousAmount: 0,
      variance: 0,
      variancePercent: 0,
      isGroup: true,
      level: 0,
    };
  }

  private createCashFlowLine(
    name: string,
    amount: number
  ): FinancialReportLine {
    return {
      accountId: `cashflow-${name.toLowerCase().replace(/\s+/g, '-')}`,
      accountCode: '',
      accountName: name,
      accountType: 'CashFlow',
      amount,
      previousAmount: 0,
      variance: 0,
      variancePercent: 0,
      isGroup: false,
      level: 1,
    };
  }

  private createTotalLine(
    name: string,
    amount: number,
    isNetChange: boolean = false
  ): FinancialReportLine {
    return {
      accountId: `total-${name.toLowerCase().replace(/\s+/g, '-')}`,
      accountCode: '',
      accountName: name,
      accountType: isNetChange ? 'NetChange' : 'Total',
      amount,
      previousAmount: 0,
      variance: 0,
      variancePercent: 0,
      isGroup: true,
      level: 0,
    };
  }
}
