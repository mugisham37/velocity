import { Injectable, Logger } from '@nestjs/common';
import { MLPipelineService } from './ml-pipeline.service';

export interface ForecastResult {
  value: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality?: {
    pattern: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    strength: number;
  };
}

export interface InventoryOptimization {
  optimalLevel: number;
  reorderPoint: number;
  confidence: number;
  costSavings: number;
}

@Injectable()
export class ForecastingService {
  private readonly logger = new Logger(ForecastingService.name);

  constructor(private readonly mlPipeline: MLPipelineService) {}

  async generateSalesForecast(
    entityType: string,
    entityId: string
  ): Promise<ForecastResult> {
    this.logger.log(`Generating sales forecast for ${entityType}:${entityId}`);

    // Get historical sales data
    const historicalData = await this.getHistoricalSalesData(
      entityType,
      entityId
    );

    // Use ML model for prediction
    const prediction = await this.mlPipeline.predict('sales_forecast', {
      historical_sales: historicalData.sales,
      seasonality: historicalData.seasonality,
      marketing_spend: historicalData.marketingSpend,
      economic_indicators: historicalData.economicIndicators,
    });

    // Analyze trend
    const trend = this.analyzeTrend(historicalData.sales);

    // Detect seasonality
    const seasonality = this.detectSeasonality(historicalData.sales);

    return {
      value: prediction.forecast[0] || prediction.value,
      confidence: prediction.confidence,
      trend,
      seasonality,
    };
  }

  async optimizeInventory(
    entityType: string,
    entityId: string
  ): Promise<InventoryOptimization> {
    this.logger.log(`Optimizing inventory for ${entityType}:${entityId}`);

    // Get inventory and demand data
    const inventoryData = await this.getInventoryData(entityType, entityId);

    // Use ML model for optimization
    const prediction = await this.mlPipeline.predict('inventory_optimization', {
      demand_history: inventoryData.demandHistory,
      lead_time: inventoryData.leadTime,
      seasonality: inventoryData.seasonality,
      storage_cost: inventoryData.storageCost,
    });

    // Calculate optimal levels using EOQ-like formula with ML adjustments
    const optimalLevel = Math.round(prediction.value);
    const reorderPoint = Math.round(optimalLevel * 0.3); // 30% of optimal as reorder point
    const currentCost = inventoryData.currentLevel * inventoryData.storageCost;
    const optimizedCost = optimalLevel * inventoryData.storageCost;
    const costSavings = Math.max(0, currentCost - optimizedCost);

    return {
      optimalLevel,
      reorderPoint,
      confidence: prediction.confidence,
      costSavings,
    };
  }

  async generateDemandForecast(
    productId: string,
    periods: number = 12
  ): Promise<{
    forecast: number[];
    confidence: number[];
    totalDemand: number;
  }> {
    this.logger.log(
      `Generating demand forecast for product ${productId} for ${periods} periods`
    );

    const historicalData = await this.getProductDemandHistory(productId);

    const prediction = await this.mlPipeline.predict('sales_forecast', {
      historical_sales: historicalData,
      seasonality: this.detectSeasonality(historicalData).strength,
    });

    const forecast =
      prediction.forecast ||
      Array.from({ length: periods }, () => Math.random() * 100);
    const confidence = Array.from(
      { length: periods },
      (_, i) => prediction.confidence * (1 - i * 0.05) // Confidence decreases over time
    );

    return {
      forecast,
      confidence,
      totalDemand: forecast.reduce((sum, value) => sum + value, 0),
    };
  }

  async predictMaintenanceNeeds(equipmentId: string): Promise<{
    nextMaintenanceDate: Date;
    probability: number;
    recommendedActions: string[];
  }> {
    this.logger.log(
      `Predicting maintenance needs for equipment ${equipmentId}`
    );

    // Get equipment sensor data and maintenance history
    const equipmentData = await this.getEquipmentData(equipmentId);

    // Simple predictive maintenance logic
    const daysSinceLastMaintenance = equipmentData.daysSinceLastMaintenance;
    const averageMaintenanceInterval = equipmentData.averageMaintenanceInterval;
    const utilizationRate = equipmentData.utilizationRate;

    // Calculate probability of needing maintenance
    const probability = Math.min(
      (daysSinceLastMaintenance / averageMaintenanceInterval) * utilizationRate,
      0.95
    );

    // Predict next maintenance date
    const daysUntilMaintenance = Math.max(
      1,
      averageMaintenanceInterval - daysSinceLastMaintenance
    );
    const nextMaintenanceDate = new Date();
    nextMaintenanceDate.setDate(
      nextMaintenanceDate.getDate() + daysUntilMaintenance
    );

    // Generate recommendations
    const recommendedActions = [];
    if (probability > 0.7) {
      recommendedActions.push('Schedule preventive maintenance');
    }
    if (equipmentData.vibrationLevel > 0.8) {
      recommendedActions.push('Check bearing alignment');
    }
    if (equipmentData.temperatureAnomaly) {
      recommendedActions.push('Inspect cooling system');
    }

    return {
      nextMaintenanceDate,
      probability,
      recommendedActions,
    };
  }

  private async getHistoricalSalesData(entityType: string, entityId: string) {
    // Mock historical sales data
    const sales = Array.from(
      { length: 24 },
      (_, i) => 1000 + Math.sin(i / 6) * 200 + Math.random() * 100
    );

    return {
      sales,
      seasonality: this.detectSeasonality(sales).strength,
      marketingSpend: Math.random() * 10000,
      economicIndicators: Math.random(),
    };
  }

  private async getInventoryData(entityType: string, entityId: string) {
    // Mock inventory data
    return {
      currentLevel: Math.floor(Math.random() * 1000) + 100,
      demandHistory: Array.from({ length: 12 }, () => Math.random() * 100),
      leadTime: Math.floor(Math.random() * 14) + 1, // 1-14 days
      seasonality: Math.random(),
      storageCost: Math.random() * 10 + 1, // $1-11 per unit
    };
  }

  private async getProductDemandHistory(productId: string): Promise<number[]> {
    // Mock demand history
    return Array.from(
      { length: 24 },
      (_, i) => 50 + Math.sin(i / 6) * 20 + Math.random() * 30
    );
  }

  private async getEquipmentData(equipmentId: string) {
    // Mock equipment data
    return {
      daysSinceLastMaintenance: Math.floor(Math.random() * 90),
      averageMaintenanceInterval: 60 + Math.floor(Math.random() * 30), // 60-90 days
      utilizationRate: 0.6 + Math.random() * 0.4, // 60-100%
      vibrationLevel: Math.random(),
      temperatureAnomaly: Math.random() > 0.8,
    };
  }

  private analyzeTrend(data: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 2) return 'stable';

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const change = (secondAvg - firstAvg) / firstAvg;

    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  }

  private detectSeasonality(data: number[]): {
    pattern: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    strength: number;
  } {
    // Simplified seasonality detection
    // In a real implementation, this would use FFT or autocorrelation

    const patterns = [
      { period: 7, name: 'weekly' as const },
      { period: 30, name: 'monthly' as const },
      { period: 90, name: 'quarterly' as const },
      { period: 365, name: 'yearly' as const },
    ];

    let bestPattern = patterns[0];
    let maxStrength = 0;

    for (const pattern of patterns) {
      if (data.length >= pattern.period * 2) {
        const strength = this.calculateSeasonalStrength(data, pattern.period);
        if (strength > maxStrength) {
          maxStrength = strength;
          bestPattern = pattern;
        }
      }
    }

    return {
      pattern: bestPattern.name,
      strength: maxStrength,
    };
  }

  private calculateSeasonalStrength(data: number[], period: number): number {
    // Simplified seasonal strength calculation
    if (data.length < period * 2) return 0;

    let totalVariation = 0;
    let seasonalVariation = 0;

    for (let i = period; i < data.length; i++) {
      const currentValue = data[i];
      const previousPeriodValue = data[i - period];
      const overallMean = data.reduce((sum, val) => sum + val, 0) / data.length;

      totalVariation += Math.abs(currentValue - overallMean);
      seasonalVariation += Math.abs(currentValue - previousPeriodValue);
    }

    return totalVariation > 0 ? 1 - seasonalVariation / totalVariation : 0;
  }
}
