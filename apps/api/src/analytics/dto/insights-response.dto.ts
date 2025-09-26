import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Prediction {
  @Field()
  type: string;

  @Field()
  value: number;

  @Field()
  confidence: number;

  @Field()
  description: string;
}

@ObjectType()
export class AutomationSuggestion {
  @Field()
  type: string;

  @Field()
  description: string;

  @Field()
  potentialSavings: number;

  @Field()
  implementationEffort: string;
}

@ObjectType()
export class InsightsResponse {
  @Field(() => [Prediction])
  predictions: Prediction[];

  @Field(() => [AutomationSuggestion])
  automationSuggestions: AutomationSuggestion[];

  @Field()
  entityType: string;

  @Field()
  entityId: string;

  @Field()
  generatedAt: string;
}
