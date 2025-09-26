import { Injectable, Logger } from '@nestjs/common';
import { PredictiveMaintenanceService } from './predictive-maintenance.service';

@Injectable()
export class MaintenancePredictionService {
  private readonly logger = new Logger(MaintenancePredictionService.name);

  constructor(
    private readonly predictiveMaintenanceService: PredictiveMaintenanceService
  ) {}

  async generateMaintenanceRecommendations(
    assetId: string,
    companyId: string
  ): Promise<any> {
    try {
      // Get recent predictions for the asset
      const predictions =
        await this.predictiveMaintenanceService.getPredictions(
          assetId,
          companyId,
          5
        );

      if (predictions.length === 0) {
        return {
          assetId,
          recommendations: [],
          message: 'No predictions available for this asset',
        };
      }

      const recommendations = [];

      for (const prediction of predictions) {
        const predictionValue = parseFloat(prediction.predictedValue);
        const confidence = prediction.confidence
          ? parseFloat(prediction.confidence)
          : 0;

        if (
          prediction.predictionType === 'failure_probability' &&
          predictionValue > 0.7
        ) {
          recommendations.push({
            type: 'immediate_maintenance',
            priority: 'high',
            description: `High failure probability detected (${Math.round(predictionValue * 100)}%)`,
            confidence: Math.round(confidence * 100),
            recommendedAction: 'Schedule immediate inspection and maintenance',
            estimatedCost: this.estimateMaintenanceCost('immediate'),
          });
        } else if (
          prediction.predictionType === 'remaining_useful_life' &&
          predictionValue < 168
        ) {
          // Less than 1 week
          recommendations.push({
            type: 'scheduled_maintenance',
            priority: 'medium',
            description: `Low remaining useful life (${Math.round(predictionValue)} hours)`,
            confidence: Math.round(confidence * 100),
            recommendedAction: 'Schedule maintenance within the next week',
            estimatedCost: this.estimateMaintenanceCost('scheduled'),
          });
        } else if (
          prediction.predictionType === 'anomaly_score' &&
          predictionValue > 0.8
        ) {
          recommendations.push({
            type: 'investigation',
            priority: 'medium',
            description: `Anomalous behavior detected (score: ${Math.round(predictionValue * 100)})`,
            confidence: Math.round(confidence * 100),
            recommendedAction:
              'Investigate unusual patterns in equipment behavior',
            estimatedCost: this.estimateMaintenanceCost('investigation'),
          });
        }
      }

      return {
        assetId,
        recommendations,
        generatedAt: new Date(),
        totalRecommendations: recommendations.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate maintenance recommendations: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  private estimateMaintenanceCost(type: string): {
    min: number;
    max: number;
    currency: string;
  } {
    const costRanges = {
      immediate: { min: 5000, max: 15000 },
      scheduled: { min: 2000, max: 8000 },
      investigation: { min: 500, max: 2000 },
    };

    return {
      ...(costRanges[type] || { min: 1000, max: 5000 }),
      currency: 'USD',
    };
  }

  async getMaintenanceInsights(companyId: string): Promise<any> {
    try {
      // This would analyze all assets and provide company-wide insights
      // For now, return mock insights

      return {
        companyId,
        insights: {
          totalAssetsMonitored: 45,
          assetsRequiringAttention: 8,
          predictedFailuresNext30Days: 3,
          estimatedMaintenanceCost: {
            next30Days: 25000,
            next90Days: 75000,
            currency: 'USD',
          },
          topRiskAssets: [
            { assetId: 'asset-001', riskScore: 0.85, type: 'Pump' },
            { assetId: 'asset-015', riskScore: 0.78, type: 'Motor' },
            { assetId: 'asset-032', riskScore: 0.72, type: 'Conveyor' },
          ],
          maintenanceEfficiency: {
            preventiveMaintenance: 0.75,
            predictiveMaintenance: 0.68,
            reactiveMaintenance: 0.15,
          },
        },
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get maintenance insights: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
