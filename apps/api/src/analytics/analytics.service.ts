import { Injectable, Logger } from '@nestjs/common';
import { IntelligentAutomationService } from './services/intelligent-automation.service';
import { PredictiveAnalyticsService } from './services/predictive-analytics.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly predictiveAnalytics: PredictiveAnalyticsService,
    private readonly intelligentAutomation: IntelligentAutomationService
  ) {}

  async getAnalyticsSummary() {
    this.logger.log('Generating analytics summary');

    return {
      predictiveAnalytics: await this.predictiveAnalytics.getSummary(),
      intelligentAutomation: await this.intelligentAutomation.getSummary(),
      timestamp: new Date().toISOString(),
    };
  }

  async generateInsights(entityType: string, entityId: string) {
    this.logger.log(`Generating insights for ${entityType}:${entityId}`);

    const [predictions, automationSuggestions] = await Promise.all([
      this.predictiveAnalytics.generatePredictions(entityType, entityId),
      this.intelligentAutomation.generateSuggestions(entityType, entityId),
    ]);

    return {
      predictions,
      automationSuggestions,
      entityType,
      entityId,
      generatedAt: new Date().toISOString(),
    };
  }
}

