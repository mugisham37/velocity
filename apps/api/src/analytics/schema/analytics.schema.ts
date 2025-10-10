import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MLModelInfo {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  type!: string;

  @Field(() => Float)
  accuracy!: number;

  @Field()
  lastTrained!: string;

  @Field(() => [String])
  features!: string[];
}

@ObjectType()
export class ForecastResult {
  @Field(() => Float)
  value!: number;

  @Field(() => Float)
  confidence!: number;

  @Field()
  trend!: string;

  @Field({ nullable: true })
  seasonalityPattern?: string;

  @Field(() => Float, { nullable: true })
  seasonalityStrength?: number;
}

@ObjectType()
export class AnomalyAlert {
  @Field()
  id!: string;

  @Field()
  type!: string;

  @Field()
  severity!: string;

  @Field()
  description!: string;

  @Field(() => Float)
  value!: number;

  @Field(() => Float)
  expectedValue!: number;

  @Field(() => Float)
  deviation!: number;

  @Field()
  timestamp!: string;

  @Field()
  entityType!: string;

  @Field()
  entityId!: string;
}

@ObjectType()
export class CategorySuggestion {
  @Field()
  category!: string;

  @Field(() => Float)
  confidence!: number;

  @Field({ nullable: true })
  subcategory?: string;

  @Field(() => [String])
  reasoning!: string[];
}

@ObjectType()
export class ProcessOptimization {
  @Field()
  processName!: string;

  @Field(() => Float)
  currentEfficiency!: number;

  @Field(() => Float)
  potentialEfficiency!: number;

  @Field(() => [String])
  bottlenecks!: string[];

  @Field(() => [String])
  recommendations!: string[];
}
