import type { User } from '../database';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomersService } from './customers.service';
import {
  CreateCustomerContactInput,
  CreateCustomerInput,
  CreateCustomerSegmentInput,
  UpdateCustomerInput,
} from './dto/create-customer.dto';
import {
  Customer,
  CustomerAnalytics,
  CustomerContact,
  CustomerSegment,
} from './entities/customer.entity';

@Resolver(() => Customer)
@UseGuards(JwtAuthGuard)
export class CustomersResolver {
  constructor(private readonly customersService: CustomersService) {}

  @Mutation(() => Customer)
  async createCustomer(
    @Args('input') input: CreateCustomerInput,
    @CurrentUser() user: User
  ): Promise<Customer> {
    return this.customersService.createCustomer(
      input,
      user.companyId,
      user.id
    ) as Promise<Customer>;
  }

  @Mutation(() => Customer)
  async updateCustomer(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateCustomerInput,
    @CurrentUser() user: User
  ): Promise<Customer> {
    return this.customersService.updateCustomer(
      id,
      input as Record<string, unknown>,
      user.companyId,
      user.id
    ) as Promise<Customer>;
  }

  @Mutation(() => Boolean)
  async deleteCustomer(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<boolean> {
    await this.customersService.delete(id, user.companyId);
    return true;
  }

  @Query(() => Customer, { nullable: true })
  async customer(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<Customer | null> {
    return this.customersService.findById(
      id,
      user.companyId
    ) as Promise<Customer | null>;
  }

  @Query(() => Customer, { nullable: true })
  async customerByCode(
    @Args('code') code: string,
    @CurrentUser() user: User
  ): Promise<Customer | null> {
    return this.customersService.findByCustomerCode(
      code,
      user.companyId
    ) as Promise<Customer | null>;
  }

  @Query(() => [Customer])
  async customerHierarchy(@CurrentUser() user: User): Promise<Customer[]> {
    return this.customersService.getCustomerHierarchy(
      user.companyId
    ) as Promise<Customer[]>;
  }

  @Mutation(() => CustomerContact)
  async createCustomerContact(
    @Args('input') input: CreateCustomerContactInput,
    @CurrentUser() user: User
  ): Promise<CustomerContact> {
    return this.customersService.createCustomerContact(
      input,
      user.companyId,
      user.id
    ) as Promise<CustomerContact>;
  }

  @Mutation(() => Boolean)
  async setCustomerCreditLimit(
    @Args('customerId', { type: () => ID }) customerId: string,
    @Args('creditLimit') creditLimit: number,
    @Args('effectiveDate') effectiveDate: string,
    @Args('expiryDate', { nullable: true }) expiryDate?: string,
    @Args('notes', { nullable: true }) notes?: string,
    @CurrentUser() user?: User
  ): Promise<boolean> {
    await this.customersService.setCreditLimit(
      {
        customerId,
        creditLimit,
        effectiveDate: new Date(effectiveDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        notes: notes || null,
      },
      user!.companyId,
      user!.id
    );
    return true;
  }

  @Mutation(() => CustomerSegment)
  async createCustomerSegment(
    @Args('input') input: CreateCustomerSegmentInput,
    @CurrentUser() user: User
  ): Promise<CustomerSegment> {
    return this.customersService.createCustomerSegment(
      input,
      user.companyId,
      user.id
    ) as Promise<CustomerSegment>;
  }

  @Mutation(() => Boolean)
  async createCustomerPortalUser(
    @Args('customerId', { type: () => ID }) customerId: string,
    @Args('contactId', { type: () => ID, nullable: true })
    contactId: string | undefined,
    @Args('username') username: string,
    @Args('email') email: string,
    @Args('password') password: string,
    @CurrentUser() user: User
  ): Promise<boolean> {
    await this.customersService.createPortalUser(
      {
        customerId,
        contactId: contactId || null,
        username,
        email,
        password,
      },
      user.companyId,
      user.id
    );
    return true;
  }

  @Query(() => CustomerAnalytics)
  async customerAnalytics(
    @CurrentUser() user: User
  ): Promise<CustomerAnalytics> {
    return this.customersService.getCustomerAnalytics(
      user.companyId
    ) as Promise<CustomerAnalytics>;
  }
}

