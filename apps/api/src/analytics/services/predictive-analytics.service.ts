import { Injectable, Logger } from '@nestjs/common';
import { AnomalyDetectionService } from './anomaly-detection.service';
import { ForecastingService } from './forecasting.service';
import { MLPipelineService } from './ml-pipeline.service';

@Injectable()
export class PredictiveAnalyticsService {
  private readonly logger = new Logger(PredictiveAnalyticsService.name);

  constructor(
    private readonly mlPipeline: MLPipelineService,
    private readonly forecasting: ForecastingService,
    private readonly anomalyDetection: AnomalyDetectionService
  ) {}

  async getSummary() {
    this.logger.log('Generating predictive analytics summary');

    return {
      activePredictions: await this.getActivePredictionsCount(),
      accuracy: await this.getOverallAccuracy(),
      lastUpdated: new Date().toISOString(),
    };
  }

  async generatePredictions(entityType: string, entityId: string) {
    this.logger.log(`Generating predictions for ${entityType}:${entityId}`);

    const predictions = [];

    // Sales forecasting
    if (entityType === 'customer' || entityType === 'product') {
      const salesForecast = await this.forecasting.generateSalesForecast(
        entityType,
        entityId
      );
      predictions.push({
        type: 'sales_forecast',
        value: salesForecast.value,
        confidence: salesForecast.confidence,
        description: `Predicted sales for next quarter: ${salesForecast.value}`,
      });
    }

    // Inventory optimization
    if (entityType === 'product' || entityType === 'warehouse') {
      const inventoryOptimization = await this.forecasting.optimizeInventory(
        entityType,
        entityId
      );
      predictions.push({
        type: 'inventory_optimization',
        value: inventoryOptimization.optimalLevel,
        confidence: inventoryOptimization.confidence,
        description: `Optimal inventory level: ${inventoryOptimization.optimalLevel} units`,
      });
    }

    // Customer churn prediction
    if (entityType === 'customer') {
      const churnPrediction = await this.predictCustomerChurn(entityId);
      predictions.push({
        type: 'churn_prediction',
        value: churnPrediction.probability,
        confidence: churnPrediction.confidence,
        description: `Churn probability: ${(churnPrediction.probability * 100).toFixed(1)}%`,
      });
    }

    // Anomaly detection
    const anomalies = await this.anomalyDetection.detectAnomalies(
      entityType,
      entityId
    );
    if (anomalies.length > 0) {
      predictions.push({
        type: 'anomaly_alert',
        value: anomalies.length,
        confidence: 0.95,
        description: `${anomalies.length} anomalies detected requiring attention`,
      });
    }

    return predictions;
  }

  private async getActivePredictionsCount(): Promise<number> {
    // In a real implementation, this would query the database
    return 42;
  }

  private async getOverallAccuracy(): Promise<number> {
    // In a real implementation, this would calculate from historical predictions
    return 0.87;
  }

  private async predictCustomerChurn(customerId: string) {
    this.logger.log(`Predicting churn for customer ${customerId}`);

    // Simplified churn prediction logic
    // In a real implementation, this would use ML models
    const features = await this.extractCustomerFeatures(customerId);
    const probability = this.calculateChurnProbability(features);

    return {
      probability,
      confidence: 0.82,
      factors: features.riskFactors,
    };
  }

  private async extractCustomerFeatures(customerId: string) {
    // Mock feature extraction
    return {
      lastOrderDays: Math.floor(Math.random() * 90),
      orderFrequency: Math.random() * 10,
      averageOrderValue: Math.random() * 1000,
      supportTickets: Math.floor(Math.random() * 5),
      riskFactors: ['declining_order_frequency', 'increased_support_tickets'],
    };
  }

  private calculateChurnProbability(features: any): number {
    // Simplified probability calculation
    let probability = 0.1;

    if (features.lastOrderDays > 60) probability += 0.3;
    if (features.orderFrequency < 2) probability += 0.2;
    if (features.supportTickets > 2) probability += 0.15;

    return Math.min(probability, 0.95);
  }
}
