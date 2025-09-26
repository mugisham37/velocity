import { Module } from '@nestjs/common';
import { AnalyticsResolver } from './analytics.resolver';
import { AnalyticsService } from './analytics.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { ForecastingService } from './services/forecasting.service';
import { IntelligentAutomationService } from './services/intelligent-automation.service';
import { MLPipelineService } from './services/ml-pipeline.service';
import { OCRService } from './services/ocr.service';
import { PredictiveAnalyticsService } from './services/predictive-analytics.service';
import { SmartCategorizationService } from './services/smart-categorization.service';

@Module({
  providers: [
    AnalyticsService,
    AnalyticsResolver,
    PredictiveAnalyticsService,
    IntelligentAutomationService,
    MLPipelineService,
    AnomalyDetectionService,
    ForecastingService,
    OCRService,
    SmartCategorizationService,
  ],
  exports: [
    AnalyticsService,
    PredictiveAnalyticsService,
    IntelligentAutomationService,
  ],
})
export class AnalyticsModule {}
