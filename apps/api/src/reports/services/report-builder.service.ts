import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export interface CustomReportField {
  id: string;
  name: string;
  type: 'account' | 'calculation' | 'text' | 'date' | 'number';
  source?: string; // Account ID or calculation formula
  format?: 'currency' | 'percentage' | 'number' | 'date';
  aggregation?: 'sum' | 'average' | 'count' | 'min' | 'max';
  groupBy?: boolean;
  sortOrder?: number;
  visible: boolean;
}

export interface CustomReportFilter {
  field: string;
  operator:
    | 'equals'
    | 'not_equals'
    | 'greater_than'
    | 'less_than'
    | 'contains'
    | 'between';
  value: any;
  value2?: any; // For 'between' operator
}

export interface CustomReportDefinition {
  id: string;
  name: string;
  description?: string;
  category: string;
  fields: CustomReportField[];
  filters: CustomReportFilter[];
  groupBy: string[];
  sortBy: Array<{ field: string; direction: 'asc' | 'desc' }>;
  dateRange: {
    type: 'fixed' | 'relative';
    startDate?: Date;
    endDate?: Date;
    relativePeriod?:
      | 'last_month'
      | 'last_quarter'
      | 'last_year'
      | 'ytd'
      | 'mtd';
  };
  formatting: {
    showTotals: boolean;
    showSubtotals: boolean;
    currencySymbol: string;
    decimalPlaces: number;
  };
  createdBy: string;
  createdAt: Date;
  isPublic: boolean;
}

export interface CustomReportResult {
  definition: CustomReportDefinition;
  data: Array<Record<string, any>>;
  totals: Record<string, number> | undefined;
  metadata: {
    totalRows: number;
    executionTime: number;
    generatedAt: Date;
  };
}

@Injectable()
export class ReportBuilderService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  async createCustomReport(
    definition: Omit<CustomReportDefinition, 'id' | 'createdAt'>,
    _companyId: string
  ): Promise<CustomReportDefinition> {
    this.logger.info('Creating custom report', {
      name: definition.name,
      companyId: _companyId,
    });

    const reportDefinition: CustomReportDefinition = {
      ...definition,
      id: this.generateReportId(),
      createdAt: new Date(),
    };

    // TODO: Save to database
    // await this.saveReportDefinition(reportDefinition, companyId);

    return reportDefinition;
  }

  async executeCustomReport(
    reportId: string,
    companyId: string,
    parameters?: Record<string, any>
  ): Promise<CustomReportResult> {
    this.logger.info('Executing custom report', { reportId, companyId });

    const startTime = Date.now();

    try {
      // TODO: Load report definition from database
      const definition = await this.getReportDefinition(reportId, companyId);

      if (!definition) {
        throw new Error(`Rep${reportId} not found`);
      }

      // Apply parameter overrides
      const effectiveDefinition = this.applyParameters(definition, parameters);

      // Execute the report
      const data = await this.executeReport(effectiveDefinition, companyId);

      // Calculate totals if requested
      const totals = effectiveDefinition.formatting.showTotals
        ? this.calculateTotals(data, effectiveDefinition.fields)
        : undefined;

      const executionTime = Date.now() - startTime;

      return {
        definition: effectiveDefinition,
        data,
        totals,
        metadata: {
          totalRows: data.length,
          executionTime,
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      this.logger.error('Failed to execute custom report', {
        error,
        reportId,
        companyId,
      });
      throw error;
    }
  }

  async getAvailableFields(_companyId: string): Promise<
    Array<{
      id: string;
      name: string;
      type: string;
      category: string;
      description?: string;
    }>
  > {
    // Return available fields that can be used in custom reports
    return [
      // Account fields
      {
        id: 'account.code',
        name: 'Account Code',
        type: 'text',
        category: 'Accounts',
      },
      {
        id: 'account.name',
        name: 'Account Name',
        type: 'text',
        category: 'Accounts',
      },
      {
        id: 'account.type',
        name: 'Account Type',
        type: 'text',
        category: 'Accounts',
      },
      {
        id: 'account.balance',
        name: 'Account Balance',
        type: 'currency',
        category: 'Accounts',
      },

      // Transaction fields
      {
        id: 'transaction.date',
        name: 'Transaction Date',
        type: 'date',
        category: 'Transactions',
      },
      {
        id: 'transaction.amount',
        name: 'Transaction Amount',
        type: 'currency',
        category: 'Transactions',
      },
      {
        id: 'transaction.description',
        name: 'Description',
        type: 'text',
        category: 'Transactions',
      },
      {
        id: 'transaction.reference',
        name: 'Reference',
        type: 'text',
        category: 'Transactions',
      },

      // Customer fields
      {
        id: 'customer.name',
        name: 'Customer Name',
        type: 'text',
        category: 'Customers',
      },
      {
        id: 'customer.balance',
        name: 'Customer Balance',
        type: 'currency',
        category: 'Customers',
      },
      {
        id: 'customer.creditLimit',
        name: 'Credit Limit',
        type: 'currency',
        category: 'Customers',
      },

      // Vendor fields
      {
        id: 'vendor.name',
        name: 'Vendor Name',
        type: 'text',
        category: 'Vendors',
      },
      {
        id: 'vendor.balance',
        name: 'Vendor Balance',
        type: 'currency',
        category: 'Vendors',
      },

      // Calculated fields
      {
        id: 'calc.variance',
        name: 'Variance',
        type: 'calculation',
        category: 'Calculations',
      },
      {
        id: 'calc.percentage',
        name: 'Percentage',
        type: 'calculation',
        category: 'Calculations',
      },
      {
        id: 'calc.growth',
        name: 'Growth Rate',
        type: 'calculation',
        category: 'Calculations',
      },
    ];
  }

  async getReportTemplates(): Promise<
    Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      definition: Partial<CustomReportDefinition>;
    }>
  > {
    // Return pre-built report templates
    return [
      {
        id: 'aging-receivables',
        name: 'Aging Receivables',
        description: 'Customer balances grouped by aging periods',
        category: 'Receivables',
        definition: {
          name: 'Aging Receivables Report',
          category: 'Receivables',
          fields: [
            {
              id: 'customer',
              name: 'Customer',
              type: 'text',
              visible: true,
              sortOrder: 1,
            },
            {
              id: 'current',
              name: 'Current',
              type: 'number',
              format: 'currency',
              visible: true,
              sortOrder: 2,
            },
            {
              id: '30days',
              name: '1-30 Days',
              type: 'number',
              format: 'currency',
              visible: true,
              sortOrder: 3,
            },
            {
              id: '60days',
              name: '31-60 Days',
              type: 'number',
              format: 'currency',
              visible: true,
              sortOrder: 4,
            },
            {
              id: '90days',
              name: '61-90 Days',
              type: 'number',
              format: 'currency',
              visible: true,
              sortOrder: 5,
            },
            {
              id: 'over90',
              name: 'Over 90 Days',
              type: 'number',
              format: 'currency',
              visible: true,
              sortOrder: 6,
            },
            {
              id: 'total',
              name: 'Total',
              type: 'calculation',
              format: 'currency',
              visible: true,
              sortOrder: 7,
            },
          ],
          filters: [],
          groupBy: ['customer'],
          sortBy: [{ field: 'total', direction: 'desc' }],
          formatting: {
            showTotals: true,
            showSubtotals: false,
            currencySymbol: '$',
            decimalPlaces: 2,
          },
        },
      },
      {
        id: 'expense-analysis',
        name: 'Expense Analysis',
        description: 'Detailed expense breakdown by category and period',
        category: 'Expenses',
        definition: {
          name: 'Expense Analysis Report',
          category: 'Expenses',
          fields: [
            {
              id: 'category',
              name: 'Expense Category',
              type: 'text',
              visible: true,
              sortOrder: 1,
            },
            {
              id: 'account',
              name: 'Account',
              type: 'text',
              visible: true,
              sortOrder: 2,
            },
            {
              id: 'current',
              name: 'Current Period',
              type: 'number',
              format: 'currency',
              visible: true,
              sortOrder: 3,
            },
            {
              id: 'previous',
              name: 'Previous Period',
              type: 'number',
              format: 'currency',
              visible: true,
              sortOrder: 4,
            },
            {
              id: 'variance',
              name: 'Variance',
              type: 'calculation',
              format: 'currency',
              visible: true,
              sortOrder: 5,
            },
            {
              id: 'variance_pct',
              name: 'Variance %',
              type: 'calculation',
              format: 'percentage',
              visible: true,
              sortOrder: 6,
            },
          ],
          filters: [
            { field: 'account.type', operator: 'equals', value: 'Expense' },
          ],
          groupBy: ['category'],
          sortBy: [{ field: 'current', direction: 'desc' }],
          formatting: {
            showTotals: true,
            showSubtotals: true,
            currencySymbol: '$',
            decimalPlaces: 2,
          },
        },
      },
    ];
  }

  private async getReportDefinition(
    reportId: string,
    _companyId: string
  ): Promise<CustomReportDefinition | null> {
    // TODO: Load from database
    // For now, return a mock definition
    return {
      id: reportId,
      name: 'Sample Report',
      category: 'General',
      fields: [],
      filters: [],
      groupBy: [],
      sortBy: [],
      dateRange: { type: 'relative', relativePeriod: 'mtd' },
      formatting: {
        showTotals: true,
        showSubtotals: false,
        currencySymbol: '$',
        decimalPlaces: 2,
      },
      createdBy: 'user',
      createdAt: new Date(),
      isPublic: false,
    };
  }

  private applyParameters(
    definition: CustomReportDefinition,
    parameters?: Record<string, any>
  ): CustomReportDefinition {
    if (!parameters) return definition;

    // Apply parameter overrides to the definition
    const updatedDefinition = { ...definition };

    // Override date range if provided
    if (parameters['startDate'] && parameters['endDate']) {
      updatedDefinition.dateRange = {
        type: 'fixed',
        startDate: new Date(parameters['startDate']),
        endDate: new Date(parameters['endDate']),
      };
    }

    // Add additional filters if provided
    if (parameters['filters']) {
      updatedDefinition.filters = [
        ...definition.filters,
        ...parameters['filters'],
      ];
    }

    return updatedDefinition;
  }

  private async executeReport(
    _definition: CustomReportDefinition,
    _companyId: string
  ): Promise<Array<Record<string, any>>> {
    // TODO: Build and execute SQL query based on definition
    // For now, return mock data
    return [
      { account: 'Cash', balance: 50000, type: 'Asset' },
      { account: 'Accounts Receivable', balance: 25000, type: 'Asset' },
      { account: 'Inventory', balance: 75000, type: 'Asset' },
    ];
  }

  private calculateTotals(
    data: Array<Record<string, any>>,
    fields: CustomReportField[]
  ): Record<string, number> {
    const totals: Record<string, number> = {};

    fields.forEach(field => {
      if (field.type === 'number' && field.aggregation) {
        const values = data
          .map(row => row[field.id])
          .filter(v => typeof v === 'number');

        switch (field.aggregation) {
          case 'sum':
            totals[field.id] = values.reduce((sum, val) => sum + val, 0);
            break;
          case 'average':
            totals[field.id] =
              values.length > 0
                ? values.reduce((sum, val) => sum + val, 0) / values.length
                : 0;
            break;
          case 'count':
            totals[field.id] = values.length;
            break;
          case 'min':
            totals[field.id] = values.length > 0 ? Math.min(...values) : 0;
            break;
          case 'max':
            totals[field.id] = values.length > 0 ? Math.max(...values) : 0;
            break;
        }
      }
    });

    return totals;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

