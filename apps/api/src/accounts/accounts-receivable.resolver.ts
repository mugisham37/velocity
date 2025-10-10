import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationArgs } from '../common/dto/pagination.dto';
import { AccountsReceivableService } from './accounts-receivable.service';
import {
    AgingReportFilterDto,
    CreateCreditLimitDto,
    CreateInvoiceDto,
    CreateInvoiceTemplateDto,
    CreateNumberingSeriesDto,
    CreatePaymentDto,
    CreditLimitCheckDto,
    CustomerStatementFilterDto,
    InvoiceFilterDto,
    PaymentFilterDto,
    UpdateCreditLimitDto,
    UpdateInvoiceDto,
    UpdateInvoiceTemplateDto,
    UpdateNumberingSeriesDto,
} from './dto/accounts-receivable.dto';
import {
    CreditLimitCheckResult,
    CustomerAgingReport,
    CustomerCreditLimit,
    CustomerPayment,
    CustomerStatementData,
    Invoice,
    InvoiceNumberingSeries,
    InvoiceTemplate,
} from './entities/accounts-receivable.entity';
import { User } from '../auth/interfaces/user.interface';

@Resolver(() => Invoice)
@UseGuards(JwtAuthGuard)
export class AccountsReceivableResolver {
  constructor(
    private readonly accountsReceivableService: AccountsReceivableService
  ) {}

  // Invoice Queries
  @Query(() => [Invoice])
  async invoices(
    @Args('filter', { nullable: true }) filter?: InvoiceFilterDto,
    @Args() pagination?: PaginationArgs,
    @CurrentUser() user?: User
  ): Promise<Invoice[]> {
    if (!user) {
      throw new Error('User not authenticated');
    }
    // TODO: Implement filtering and pagination
    const result = await this.accountsReceivableService.findAll({}, user.companyId);
    return result.data as Invoice[];
  }

  @Query(() => Invoice)
  async invoice(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<Invoice> {
    const result = await this.accountsReceivableService.findByIdOrFail(id, user.companyId);
    return result as Invoice;
  }

  @Query(() => [CustomerAgingReport])
  async customerAgingReport(
    @Args('filter', { nullable: true }) filter?: AgingReportFilterDto,
    @CurrentUser() user?: User
  ): Promise<CustomerAgingReport[]> {
    if (!user) {
      throw new Error('User not authenticated');
    }
    const asOfDate = filter?.asOfDate ? new Date(filter.asOfDate) : undefined;
    return this.accountsReceivableService.generateAgingReport(
      user.companyId,
      filter?.customerId,
      asOfDate
    );
  }

  @Query(() => CustomerStatementData)
  async customerStatement(
    @Args('filter') filter: CustomerStatementFilterDto,
    @CurrentUser() user: User
  ): Promise<CustomerStatementData> {
    return this.accountsReceivableService.generateCustomerStatement(
      filter.customerId,
      new Date(filter.fromDate),
      new Date(filter.toDate),
      user.companyId,
      user.id
    );
  }

  @Query(() => CreditLimitCheckResult)
  async checkCreditLimit(
    @Args('input') input: CreditLimitCheckDto,
    @CurrentUser() user: User
  ): Promise<CreditLimitCheckResult> {
    return this.accountsReceivableService.checkCreditLimit(
      input.customerId,
      input.proposedAmount,
      user.companyId,
      user.id
    );
  }

  // Invoice Mutations
  @Mutation(() => Invoice)
  async createInvoice(
    @Args('input') input: CreateInvoiceDto,
    @CurrentUser() user: User
  ): Promise<Invoice> {
    const result = await this.accountsReceivableService.createInvoice(
      {
        customerId: input.customerId,
        invoiceDate: new Date(input.invoiceDate),
        dueDate: new Date(input.dueDate),
        currency: input.currency,
        exchangeRate: input.exchangeRate,
        terms: input.terms,
        notes: input.notes,
        templateId: input.templateId,
        salesOrderId: input.salesOrderId,
        lineItems: input.lineItems.map(item => ({
          itemCode: item.itemCode || undefined,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent || undefined,
          taxPercent: item.taxPercent || undefined,
          accountId: item.accountId || undefined,
        })),
      },
      user.companyId,
      user.id
    );
    return result as Invoice;
  }

  @Mutation(() => Invoice)
  async updateInvoice(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateInvoiceDto,
    @CurrentUser() user: User
  ): Promise<Invoice> {
    const updateData: any = {};

    if (input.dueDate) updateData.dueDate = new Date(input.dueDate);
    if (input.terms !== undefined) updateData.terms = input.terms;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.status) updateData.status = input.status;

    const result = await this.accountsReceivableService.update(id, updateData, user.companyId);
    return result as Invoice;
  }

  @Mutation(() => Boolean)
  async deleteInvoice(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<boolean> {
    await this.accountsReceivableService.delete(id, user.companyId);
    return true;
  }

  // Payment Queries
  @Query(() => [CustomerPayment])
  async customerPayments(
    @Args('filter', { nullable: true }) _filter?: PaymentFilterDto,
    @Args() _pagination?: PaginationArgs,
    @CurrentUser() _user?: User
  ): Promise<CustomerPayment[]> {
    // TODO: Implement filtering and pagination
    // For now, return empty array as payment service methods need to be implemented
    return [];
  }

  @Query(() => CustomerPayment)
  async customerPayment(
    @Args('id', { type: () => ID }) _id: string,
    @CurrentUser() _user: User
  ): Promise<CustomerPayment> {
    // TODO: Implement payment retrieval
    throw new Error('Not implemented');
  }

  // Payment Mutations
  @Mutation(() => CustomerPayment)
  async recordPayment(
    @Args('input') input: CreatePaymentDto,
    @CurrentUser() user: User
  ): Promise<CustomerPayment> {
    const result = await this.accountsReceivableService.recordPayment(
      {
        customerId: input.customerId,
        paymentDate: new Date(input.paymentDate),
        amount: input.amount,
        currency: input.currency || 'USD',
        exchangeRate: input.exchangeRate,
        paymentMethod: input.paymentMethod,
        reference: input.reference,
        bankAccountId: input.bankAccountId,
        notes: input.notes,
        allocations: input.allocations?.map(alloc => ({
          invoiceId: alloc.invoiceId,
          amount: alloc.amount,
        })),
      },
      user.companyId,
      user.id
    );
    return result as CustomerPayment;
  }

  // Credit Limit Queries
  @Query(() => [CustomerCreditLimit])
  async customerCreditLimits(
    @Args('customerId', { type: () => ID, nullable: true }) _customerId?: string,
    @CurrentUser() _user?: User
  ): Promise<CustomerCreditLimit[]> {
    // TODO: Implement credit limit retrieval
    return [];
  }

  // Credit Limit Mutations
  @Mutation(() => CustomerCreditLimit)
  async createCreditLimit(
    @Args('input') _input: CreateCreditLimitDto,
    @CurrentUser() _user: User
  ): Promise<CustomerCreditLimit> {
    // TODO: Implement credit limit creation
    throw new Error('Not implemented');
  }

  @Mutation(() => CustomerCreditLimit)
  async updateCreditLimit(
    @Args('id', { type: () => ID }) _id: string,
    @Args('input') _input: UpdateCreditLimitDto,
    @CurrentUser() _user: User
  ): Promise<CustomerCreditLimit> {
    // TODO: Implement credit limit update
    throw new Error('Not implemented');
  }

  // Template Queries
  @Query(() => [InvoiceTemplate])
  async invoiceTemplates(
    @CurrentUser() _user: User
  ): Promise<InvoiceTemplate[]> {
    // TODO: Implement template retrieval
    return [];
  }

  @Query(() => InvoiceTemplate)
  async invoiceTemplate(
    @Args('id', { type: () => ID }) _id: string,
    @CurrentUser() _user: User
  ): Promise<InvoiceTemplate> {
    // TODO: Implement template retrieval
    throw new Error('Not implemented');
  }

  // Template Mutations
  @Mutation(() => InvoiceTemplate)
  async createInvoiceTemplate(
    @Args('input') _input: CreateInvoiceTemplateDto,
    @CurrentUser() _user: User
  ): Promise<InvoiceTemplate> {
    // TODO: Implement template creation
    throw new Error('Not implemented');
  }

  @Mutation(() => InvoiceTemplate)
  async updateInvoiceTemplate(
    @Args('id', { type: () => ID }) _id: string,
    @Args('input') _input: UpdateInvoiceTemplateDto,
    @CurrentUser() _user: User
  ): Promise<InvoiceTemplate> {
    // TODO: Implement template update
    throw new Error('Not implemented');
  }

  // Numbering Series Queries
  @Query(() => [InvoiceNumberingSeries])
  async invoiceNumberingSeries(
    @CurrentUser() _user: User
  ): Promise<InvoiceNumberingSeries[]> {
    // TODO: Implement numbering series retrieval
    return [];
  }

  // Numbering Series Mutations
  @Mutation(() => InvoiceNumberingSeries)
  async createNumberingSeries(
    @Args('input') _input: CreateNumberingSeriesDto,
    @CurrentUser() _user: User
  ): Promise<InvoiceNumberingSeries> {
    // TODO: Implement numbering series creation
    throw new Error('Not implemented');
  }

  @Mutation(() => InvoiceNumberingSeries)
  async updateNumberingSeries(
    @Args('id', { type: () => ID }) _id: string,
    @Args('input') _input: UpdateNumberingSeriesDto,
    @CurrentUser() _user: User
  ): Promise<InvoiceNumberingSeries> {
    // TODO: Implement numbering series update
    throw new Error('Not implemented');
  }

  // Utility Mutations
  @Mutation(() => Boolean)
  async processDunning(
    @CurrentUser() user: User
  ): Promise<boolean> {
    await this.accountsReceivableService.processDunning(user.companyId, user.id);
    return true;
  }

  @Mutation(() => Boolean)
  async allocatePayment(
    @Args('paymentId', { type: () => ID }) paymentId: string,
    @Args('allocations', { type: () => [PaymentAllocationDto] })
    allocations: PaymentAllocationDto[],
    @CurrentUser() user: User
  ): Promise<boolean> {
    await this.accountsReceivableService.allocatePayment(
      paymentId,
      allocations.map(alloc => ({
        invoiceId: alloc.invoiceId,
        amount: alloc.amount,
      })),
      user.companyId,
      user.id
    );
    return true;
  }
}
