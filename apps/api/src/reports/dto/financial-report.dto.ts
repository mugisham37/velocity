import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FinancialReportLine {
  @Field()
  accountId: string;

  @Field()
  accountCode: string;

  @Field()
  accountName: string;

  @Field()
  accountType: string;

  @Field(() => Float)
  amount: number;

  @Field(() => Float)
  previousAmount: number;

  @Field(() => Float)
  variance: number;

  @Field(() => Float)
  variancePercent: number;

  @Field()
  isGroup: boolean;

  @Field(() => Int)
  level: number;

  @Field(() => [FinancialReportLine], { nullable: true })
  children?: FinancialReportLine[];
}

@ObjectType()
export class FinancialReport {
  @Field()
  reportType: string;

  @Field()
  title: string;

  @Field()
  companyName: string;

  @Field()
  periodStart: Date;

  @Field()
  periodEnd: Date;

  @Field({ nullable: true })
  comparativePeriodStart?: Date;

  @Field({ nullable: true })
  comparativePeriodEnd?: Date;

  @Field(() => [FinancialReportLine])
  lines: FinancialReportLine[];

  @Field(() => Float)
  totalAssets?: number;

  @Field(() => Float)
  totalLiabilities?: number;

  @Field(() => Float)
  totalEquity?: number;

  @Field(() => Float)
  totalRevenue?: number;

  @Field(() => Float)
  totalExpenses?: number;

  @Field(() => Float)
  netIncome?: number;

  @Field()
  generatedAt: Date;
}

@InputType()
export class FinancialReportInput {
  @Field()
  reportType: string;

  @Field()
  periodStart: Date;

  @Field()
  periodEnd: Date;

  @Field({ nullable: true })
  comparativePeriodStart?: Date;

  @Field({ nullable: true })
  comparativePeriodEnd?: Date;

  @Field({ nullable: true })
  includeInactive?: boolean;

  @Field({ nullable: true })
  consolidate?: boolean;

  @Field(() => [String], { nullable: true })
  accountTypes?: string[];

  @Field(() => [String], { nullable: true })
  accountIds?: string[];
}

@ObjectType()
export class FinancialRatio {
  @Field()
  name: string;

  @Field()
  category: string;

  @Field(() => Float)
  value: number;

  @Field(() => Float, { nullable: true })
  previousValue?: number;

  @Field(() => Float, { nullable: true })
  industryBenchmark?: number;

  @Field()
  formula: string;

  @Field()
  interpretation: string;

  @Field()
  trend: string; // 'improving' | 'declining' | 'stable'
}

@ObjectType()
export class FinancialRatiosReport {
  @Field()
  companyName: string;

  @Field()
  periodStart: Date;

  @Field()
  periodEnd: Date;

  @Field(() => [FinancialRatio])
  liquidityRatios: FinancialRatio[];

  @Field(() => [FinancialRatio])
  profitabilityRatios: FinancialRatio[];

  @Field(() => [FinancialRatio])
  leverageRatios: FinancialRatio[];

  @Field(() => [FinancialRatio])
  efficiencyRatios: FinancialRatio[];

  @Field()
  generatedAt: Date;
}
