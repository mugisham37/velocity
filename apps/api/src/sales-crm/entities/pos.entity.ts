import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class POSProfile {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => ID)
  warehouseId: string;

  @Field(() => ID)
  cashAccount: string;

  @Field(() => ID)
  incomeAccount: string;

  @Field(() => ID)
  expenseAccount: string;

  @Field({ nullable: true })
  costCenter?: string;

  @Field()
  currency: string;

  @Field({ nullable: true })
  priceList?: string;

  @Field()
  allowDiscount: boolean;

  @Field(() => Float)
  maxDiscount: number;

  @Field()
  allowCreditSale: boolean;

  @Field()
  allowReturn: boolean;

  @Field()
  printReceipt: boolean;

  @Field()
  emailReceipt: boolean;

  @Field()
  offlineMode: boolean;

  @Field({ nullable: true })
  loyaltyProgram?: string;

  @Field()
  isActive: boolean;

  @Field()
  companyId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class POSInvoiceItem {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  posInvoiceId: string;

  @Field()
  itemCode: string;

  @Field()
  itemName: string;

  @Field({ nullable: true })
  barcode?: string;

  @Field(() => Float)
  quantity: number;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  discountPercent: number;

  @Field(() => Float)
  discountAmount: number;

  @Field(() => Float)
  taxPercent: number;

  @Field(() => Float)
  taxAmount: number;

  @Field(() => Float)
  lineTotal: number;

  @Field(() => [String], { nullable: true })
  serialNumbers?: string[];

  @Field()
  companyId: string;
}

@ObjectType()
export class POSInvoice {
  @Field(() => ID)
  id: string;

  @Field()
  invoiceCode: string;

  @Field(() => ID)
  posProfileId: string;

  @Field(() => POSProfile, { nullable: true })
  posProfile?: POSProfile;

  @Field(() => ID, { nullable: true })
  customerId?: string;

  @Field({ nullable: true })
  customerName?: string;

  @Field({ nullable: true })
  customerPhone?: string;

  @Field({ nullable: true })
  customerEmail?: string;

  @Field()
  invoiceDate: Date;

  @Field()
  currency: string;

  @Field(() => Float)
  subtotal: number;

  @Field(() => Float)
  totalTax: number;

  @Field(() => Float)
  totalDiscount: number;

  @Field(() => Float)
  grandTotal: number;

  @Field(() => Float)
  paidAmount: number;

  @Field(() => Float)
  changeAmount: number;

  @Field(() => [Object])
  paymentMethods: any[];

  @Field(() => Int)
  loyaltyPointsEarned: number;

  @Field(() => Int)
  loyaltyPointsRedeemed: number;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  isSynced: boolean;

  @Field({ nullable: true })
  syncedAt?: Date;

  @Field(() => ID)
  cashierId: string;

  @Field()
  companyId: string;

  @Field(() => [POSInvoiceItem])
  items: POSInvoiceItem[];

  @Field()
  createdAt: Date;
}
