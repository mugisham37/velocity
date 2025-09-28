import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

// Enums
export enum InvoiceStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum DunningLevel {
  FIRST_REMINDER = 'first_reminder',
  SECOND_REMINDER = 'second_reminder',
  FINAL_NOTICE = 'final_notice',
  LEGAL_ACTION = 'legal_action',
}

registerEnumType(InvoiceStatus, {
  name: 'InvoiceStatus',
});

registerEnumType(PaymentStatus, {
  name: 'PaymentStatus',
});

registerEnumType(DunningLevel, {
  name: 'DunningLevel',
});

@ObjectType()
export class InvoiceTemplate {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  template!: string;

  @Field()
  isDefault!: boolean;

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
export class InvoiceNumberingSeries {
  @Field(() => ID)
  id!: string;

  @Field()
  seriesName!: string;

  @Field()
  prefix!: string;

  @Field()
  currentNumber!: number;

  @Field()
  padLength!: number;

  @Field({ nullable: true })
  suffix?: string;

  @Field()
  isDefault!: boolean;

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
export class Invoice {
  @Field(() => ID)
  id!: string;

  @Field()
  invoiceNumber!: string;

  @Field(() => ID)
  customerId!: string;

  @Field()
  invoiceDate!: Date;

  @Field()
  dueDate!: Date;

  @Field()
  currency!: string;

  @Field()
  exchangeRate!: string;

  @Field()
  subtotal!: string;

  @Field()
  taxAmount!: string;

  @Field()
  discountAmount!: string;

  @Field()
  totalAmount!: string;

  @Field()
  paidAmount!: string;

  @Field()
  outstandingAmount!: string;

  @Field(() => InvoiceStatus)
  status!: InvoiceStatus;

  @Field(() => String, { nullable: true })
  terms?: string;

  @Field(() => String, { nullable: true })
  notes?: string;

  @Field(() => ID, { nullable: true })
  templateId?: string;

  @Field(() => ID, { nullable: true })
  salesOrderId?: string;

  @Field()
  isRecurring!: boolean;

  @Field({ nullable: true })
  recurringFrequency?: string;

  @Field({ nullable: true })
  nextInvoiceDate?: Date;

  @Field(() => ID)
  companyId!: string;

  @Field(() => ID)
  createdBy!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  // Relations
  @Field(() => [InvoiceLineItem])
  lineItems?: InvoiceLineItem[];

  @Field(() => [PaymentAllocation])
  paymentAllocations?: PaymentAllocation[];

  @Field(() => [DunningRecord])
  dunningRecords?: DunningRecord[];
}

@ObjectType()
export class InvoiceLineItem {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  invoiceId!: string;

  @Field({ nullable: true })
  itemCode?: string;

  @Field()
  description!: string;

  @Field()
  quantity!: string;

  @Field()
  unitPrice!: string;

  @Field()
  discountPercent!: string;

  @Field()
  discountAmount!: string;

  @Field()
  taxPercent!: string;

  @Field()
  taxAmount!: string;

  @Field()
  lineTotal!: string;

  @Field(() => ID, { nullable: true })
  accountId?: string;

  @Field(() => ID)
  companyId!: string;

  @Field()
  createdAt!: Date;

  // Relations
  @Field(() => Invoice)
  invoice?: Invoice;
}

@ObjectType()
export class CustomerPayment {
  @Field(() => ID)
  id!: string;

  @Field()
  paymentNumber!: string;

  @Field(() => ID)
  customerId!: string;

  @Field()
  paymentDate!: Date;

  @Field()
  amount!: string;

  @Field()
  currency!: string;

  @Field()
  exchangeRate!: string;

  @Field()
  paymentMethod!: string;

  @Field({ nullable: true })
  reference?: string;

  @Field(() => ID, { nullable: true })
  bankAccountId?: string;

  @Field(() => PaymentStatus)
  status!: PaymentStatus;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  allocatedAmount!: string;

  @Field()
  unallocatedAmount!: string;

  @Field(() => ID)
  companyId!: string;

  @Field(() => ID)
  createdBy!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  // Relations
  @Field(() => [PaymentAllocation])
  allocations?: PaymentAllocation[];
}

@ObjectType()
export class PaymentAllocation {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  paymentId!: string;

  @Field(() => ID)
  invoiceId!: string;

  @Field()
  allocatedAmount!: string;

  @Field()
  allocationDate!: Date;

  @Field(() => ID)
  companyId!: string;

  @Field(() => ID)
  createdBy!: string;

  @Field()
  createdAt!: Date;

  // Relations
  @Field(() => CustomerPayment)
  payment?: CustomerPayment;

  @Field(() => Invoice)
  invoice?: Invoice;
}

@ObjectType()
export class CustomerCreditLimit {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  customerId!: string;

  @Field()
  creditLimit!: string;

  @Field()
  currency!: string;

  @Field()
  effectiveDate!: Date;

  @Field({ nullable: true })
  expiryDate?: Date;

  @Field()
  isActive!: boolean;

  @Field(() => ID)
  approvedBy!: string;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => ID)
  companyId!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class CreditLimitCheck {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  customerId!: string;

  @Field(() => ID, { nullable: true })
  invoiceId?: string;

  @Field()
  checkDate!: Date;

  @Field()
  currentOutstanding!: string;

  @Field()
  creditLimit!: string;

  @Field()
  proposedAmount!: string;

  @Field()
  totalExposure!: string;

  @Field()
  isApproved!: boolean;

  @Field(() => ID, { nullable: true })
  approvedBy?: string;

  @Field({ nullable: true })
  approvalNotes?: string;

  @Field(() => ID)
  companyId!: string;

  @Field()
  createdAt!: Date;
}

@ObjectType()
export class DunningConfiguration {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  isDefault!: boolean;

  @Field()
  isActive!: boolean;

  @Field(() => ID)
  companyId!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  // Relations
  @Field(() => [DunningLevelConfig])
  levels?: DunningLevelConfig[];
}

@ObjectType()
export class DunningLevelConfig {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  configurationId!: string;

  @Field(() => DunningLevel)
  level!: DunningLevel;

  @Field()
  daysAfterDue!: number;

  @Field({ nullable: true })
  emailTemplate?: string;

  @Field({ nullable: true })
  smsTemplate?: string;

  @Field({ nullable: true })
  letterTemplate?: string;

  @Field()
  isActive!: boolean;

  @Field(() => ID)
  companyId!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  // Relations
  @Field(() => DunningConfiguration)
  configuration?: DunningConfiguration;
}

@ObjectType()
export class DunningRecord {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  invoiceId!: string;

  @Field(() => ID)
  customerId!: string;

  @Field(() => DunningLevel)
  level!: DunningLevel;

  @Field()
  dueDate!: Date;

  @Field()
  dunningDate!: Date;

  @Field()
  outstandingAmount!: string;

  @Field()
  emailSent!: boolean;

  @Field()
  smsSent!: boolean;

  @Field()
  letterSent!: boolean;

  @Field({ nullable: true })
  response?: string;

  @Field({ nullable: true })
  nextDunningDate?: Date;

  @Field(() => ID)
  companyId!: string;

  @Field(() => ID)
  createdBy!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  // Relations
  @Field(() => Invoice)
  invoice?: Invoice;
}

@ObjectType()
export class CustomerStatement {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  customerId!: string;

  @Field()
  statementNumber!: string;

  @Field()
  statementDate!: Date;

  @Field()
  fromDate!: Date;

  @Field()
  toDate!: Date;

  @Field()
  openingBalance!: string;

  @Field()
  closingBalance!: string;

  @Field()
  totalInvoices!: string;

  @Field()
  totalPayments!: string;

  @Field()
  emailSent!: boolean;

  @Field({ nullable: true })
  emailSentAt?: Date;

  @Field(() => ID)
  companyId!: string;

  @Field(() => ID)
  createdBy!: string;

  @Field()
  createdAt!: Date;
}

// Report DTOs
@ObjectType()
export class AgingBucket {
  @Field()
  current!: number;

  @Field()
  days30!: number;

  @Field()
  days60!: number;

  @Field()
  days90!: number;

  @Field()
  over90!: number;

  @Field()
  total!: number;
}

@ObjectType()
export class CustomerAgingInvoice {
  @Field(() => ID)
  id!: string;

  @Field()
  invoiceNumber!: string;

  @Field()
  invoiceDate!: Date;

  @Field()
  dueDate!: Date;

  @Field()
  totalAmount!: number;

  @Field()
  outstandingAmount!: number;

  @Field()
  daysOverdue!: number;
}

@ObjectType()
export class CustomerAgingReport {
  @Field(() => ID)
  customerId!: string;

  @Field()
  customerName!: string;

  @Field(() => AgingBucket)
  aging!: AgingBucket;

  @Field(() => [CustomerAgingInvoice])
  invoices!: CustomerAgingInvoice[];
}

@ObjectType()
export class CreditLimitCheckResult {
  @Field()
  isApproved!: boolean;

  @Field()
  currentOutstanding!: number;

  @Field()
  creditLimit!: number;

  @Field()
  proposedAmount!: number;

  @Field()
  totalExposure!: number;

  @Field()
  availableCredit!: number;

  @Field()
  message!: string;
}

@ObjectType()
export class StatementTransaction {
  @Field()
  date!: Date;

  @Field()
  type!: string;

  @Field()
  reference!: string;

  @Field()
  description!: string;

  @Field()
  debit!: number;

  @Field()
  credit!: number;

  @Field()
  balance!: number;
}

@ObjectType()
export class CustomerStatementData {
  @Field()
  customerId!: string;

  @Field()
  customerName!: string;

  @Field()
  fromDate!: Date;

  @Field()
  toDate!: Date;

  @Field()
  openingBalance!: number;

  @Field()
  closingBalance!: number;

  @Field()
  totalInvoices!: number;

  @Field()
  totalPayments!: number;

  @Field(() => [StatementTransaction])
  transactions!: StatementTransaction[];
}
