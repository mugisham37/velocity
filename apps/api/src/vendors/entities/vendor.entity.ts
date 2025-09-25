import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Vendor {
  @Field(() => ID)
  id: string;

  vendorCode: string;

  @Field()
  vendorName: string;

  @Field()
  vendorType: string;

  @Field(() => ID, { nullable: true })
  parentVendorId?: string | null;

  @Field(() => ID)
  companyId: string;

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
  creditLimit: string;

  @Field({ nullable: true })
  billingAddress?: any;

  @Field({ nullable: true })
  shippingAddress?: any;

  @Field()
  isActive: boolean;

  @Field()
  isBlocked: boolean;

  @Field({ nullable: true })
  notes?: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Virtual fields
  @Field(() => Vendor, { nullable: true })
  parentVendor?: Vendor;

  @Field(() => [Vendor])
  childVendors?: Vendor[];

  @Field(() => [VendorContact])
  contacts?: VendorContact[];
}

@ObjectType()
export class VendorContact {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  vendorId: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field({ nullable: true })
  email?: string | null;

  @Field({ nullable: true })
  phone?: string | null;

  @Field({ nullable: true })
  designation?: string | null;

  @Field({ nullable: true })
  department?: string | null;

  @Field()
  isPrimary: boolean;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => Vendor)
  vendor?: Vendor;
}

@ObjectType()
export class VendorCategory {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string | null;

  @Field(() => ID, { nullable: true })
  parentCategoryId?: string | null;

  @Field()
  isActive: boolean;

  @Field(() => ID)
  companyId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => VendorCategory, { nullable: true })
  parentCategory?: VendorCategory;

  @Field(() => [VendorCategory])
  childCategories?: VendorCategory[];
}

@ObjectType()
export class VendorEvaluation {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  vendorId: string;

  @Field()
  evaluationDate: Date;

  @Field(() => ID)
  evaluatedBy: string;

  @Field()
  overallScore: string;

  @Field({ nullable: true })
  qualityScore?: string | null;

  @Field({ nullable: true })
  deliveryScore?: string | null;

  @Field({ nullable: true })
  costScore?: string | null;

  @Field({ nullable: true })
  serviceScore?: string | null;

  @Field({ nullable: true })
  comments?: string | null;

  @Field({ nullable: true })
  recommendations?: string | null;

  @Field({ nullable: true })
  nextEvaluationDate?: Date | null;

  @Field(() => ID)
  companyId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => Vendor)
  vendor?: Vendor;
}

@ObjectType()
export class VendorPerformanceSummary {
  @Field(() => [VendorPerformanceMetric])
  performanceMetrics: VendorPerformanceMetric[];

  @Field(() => VendorEvaluation, { nullable: true })
  latestEvaluation?: VendorEvaluation | null;
}

@ObjectType()
export class VendorPerformanceMetric {
  @Field()
  metricType: string;

  @Field()
  avgValue: number;

  @Field({ nullable: true })
  avgTarget?: number | null;

  @Field()
  metricCount: number;
}

@ObjectType()
export class VendorAnalytics {
  @Field()
  totalVendors: number;

  @Field()
  activeVendors: number;

  @Field()
  blockedVendors: number;

  @Field()
  individualVendors: number;

  @Field()
  companyVendors: number;

  @Field()
  totalCreditLimit: number;
}
