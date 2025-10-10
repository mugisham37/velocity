import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Customer {
  @Field(() => ID)
  id!: string;

  @Field()
  customerCode!: string;

  @Field()
  customerName!: string;

  @Field()
  customerType!: string;

  @Field(() => ID, { nullable: true })
  parentCustomerId?: string | null;

  @Field(() => ID)
  companyId!: string;

  @Field({ nullable: true })
  email?: string | null;

  @Field({ nullable: true })
  phone?: string | null;

  @Field({ nullable: true })
  website?: string | null;

  @Field({ nullable: true })
  taxId?: string | null;

  @Field({ nullable: true })
  currency?: string | null;

  @Field({ nullable: true })
  paymentTerms?: string | null;

  @Field()
  creditLimit!: string;

  @Field({ nullable: true })
  billingAddress?: any;

  @Field({ nullable: true })
  shippingAddress?: any;

  @Field()
  isActive!: boolean;

  @Field()
  isBlocked!: boolean;

  @Field({ nullable: true })
  notes?: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  // Virtual fields
  @Field(() => Customer, { nullable: true })
  parentCustomer?: Customer;

  @Field(() => [Customer])
  childCustomers?: Customer[];

  @Field(() => [CustomerContact])
  contacts?: CustomerContact[];
}

@ObjectType()
export class CustomerContact {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  customerId!: string;

  @Field()
  firstName!: string;

  @Field()
  lastName!: string;

  @Field({ nullable: true })
  email?: string | null;

  @Field({ nullable: true })
  phone?: string | null;

  @Field({ nullable: true })
  designation?: string | null;

  @Field({ nullable: true })
  department?: string | null;

  @Field()
  isPrimary!: boolean;

  @Field()
  isActive!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field(() => Customer)
  customer?: Customer;
}

@ObjectType()
export class CustomerSegment {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string | null;

  @Field()
  criteria: any;

  @Field()
  isActive!: boolean;

  @Field(() => ID)
  companyId!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class CustomerAnalytics {
  @Field()
  totalCustomers!: number;

  @Field()
  activeCustomers!: number;

  @Field()
  blockedCustomers!: number;

  @Field()
  individualCustomers!: number;

  @Field()
  companyCustomers!: number;

  @Field()
  totalCreditLimit!: number;
}
