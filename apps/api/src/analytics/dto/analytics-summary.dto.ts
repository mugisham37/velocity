import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PredictiveAnalyticsSummary {
  @Field()
  activePredictions!: number;

  @Field()
  accuracy!: number;

  @Field()
  lastUpdated!: string;
}

@ObjectType()
export class IntelligentAutomationSummary {
  @Field()
  activeAutomations!: number;

  @Field()
  processedDocuments!: number;

  @Field()
  automationSavings!: number;
}

@ObjectType()
export class AnalyticsSummary {
  @Field(() => PredictiveAnalyticsSummary)
  predictiveAnalytics!: PredictiveAnalyticsSummary;

  @Field(() => IntelligentAutomationSummary)
  intelligentAutomation!: IntelligentAutomationSummary;

  @Field()
  timestamp!: string;
}
