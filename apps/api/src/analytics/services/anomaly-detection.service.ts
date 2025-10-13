import { Injectable, Logger } from '@nestjs/common';

export interface Anomaly {
  id: string;
  type: 'financial' | 'operational' | 'behavioral';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  value: number;
  expectedValue: number;
  deviation: number;
  timestamp: Date;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
}

export interface AnomalyDetectionConfig {
  sensitivity: number; // 0-1, higher = more sensitive
  windowSize: number; // Number of data points to consider
  thresholdMultiplier: number; // Standard deviations for threshold
}

@Injectable()
export class AnomalyDetectionService {
  private readonly logger = new Logger(AnomalyDetectionService.name);
  private readonly defaultConfig: AnomalyDetectionConfig = {
    sensitivity: 0.7,
    windowSize: 30,
    thresholdMultiplier: 2.5,
  };

  async detectAnomalies(
    entityType: string,
    entityId: string,
    config: Partial<AnomalyDetectionConfig> = {}
  ): Promise<Anomaly[]> {
    this.logger.log(`Detecting anomalies for ${entityType}:${entityId}`);

    const detectionConfig = { ...this.defaultConfig, ...config };
    const anomalies: Anomaly[] = [];

    // Financial anomalies
    const financialAnomalies = await this.detectFinancialAnomalies(
      entityType,
      entityId,
      detectionConfig
    );
    anomalies.push(...financialAnomalies);

    // Operational anomalies
    const operationalAnomalies = await this.detectOperationalAnomalies(
      entityType,
      entityId,
      detectionConfig
    );
    anomalies.push(...operationalAnomalies);

    // Behavioral anomalies
    const behavioralAnomalies = await this.detectBehavioralAnomalies(
      entityType,
      entityId,
      detectionConfig
    );
    anomalies.push(...behavioralAnomalies);

    this.logger.log(
      `Detected ${anomalies.length} anomalies for ${entityType}:${entityId}`
    );
    return anomalies.sort(
      (a, b) =>
        this.getSeverityScore(b.severity) - this.getSeverityScore(a.severity)
    );
  }

  async detectFinancialAnomalies(
    entityType: string,
    entityId: string,
    config: AnomalyDetectionConfig
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    // Get financial data
    const financialData = await this.getFinancialData(entityType, entityId);

    // Revenue anomalies
    const revenueAnomalies = this.detectStatisticalAnomalies(
      financialData.revenue,
      'revenue',
      config
    );

    for (const anomaly of revenueAnomalies) {
      anomalies.push({
        id: `fin_rev_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        type: 'financial',
        severity: this.calculateSeverity(anomaly.deviation),
        description: `Unusual revenue pattern detected: ${anomaly.value.toFixed(2)} vs expected ${anomaly.expectedValue.toFixed(2)}`,
        value: anomaly.value,
        expectedValue: anomaly.expectedValue,
        deviation: anomaly.deviation,
        timestamp: new Date(),
        entityType,
        entityId,
        metadata: { metric: 'revenue', period: anomaly.period },
      });
    }

    // Expense anomalies
    const expenseAnomalies = this.detectStatisticalAnomalies(
      financialData.expenses,
      'expenses',
      config
    );

    for (const anomaly of expenseAnomalies) {
      anomalies.push({
        id: `fin_exp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        type: 'financial',
        severity: this.calculateSeverity(anomaly.deviation),
        description: `Unusual expense pattern detected: ${anomaly.value.toFixed(2)} vs expected ${anomaly.expectedValue.toFixed(2)}`,
        value: anomaly.value,
        expectedValue: anomaly.expectedValue,
        deviation: anomaly.deviation,
        timestamp: new Date(),
        entityType,
        entityId,
        metadata: { metric: 'expenses', period: anomaly.period },
      });
    }

    // Cash flow anomalies
    if (financialData.cashFlow) {
      const cashFlowAnomalies = this.detectCashFlowAnomalies(
        financialData.cashFlow,
        config
      );
      anomalies.push(
        ...cashFlowAnomalies.map(anomaly => ({
          ...anomaly,
          entityType,
          entityId,
        }))
      );
    }

    return anomalies;
  }

  async detectOperationalAnomalies(
    entityType: string,
    entityId: string,
    config: AnomalyDetectionConfig
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    // Get operational data
    const operationalData = await this.getOperationalData(entityType, entityId);

    // Production anomalies
    if (operationalData.production) {
      const productionAnomalies = this.detectStatisticalAnomalies(
        operationalData.production,
        'production',
        config
      );

      for (const anomaly of productionAnomalies) {
        anomalies.push({
          id: `op_prod_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          type: 'operational',
          severity: this.calculateSeverity(anomaly.deviation),
          description: `Production anomaly detected: ${anomaly.value.toFixed(0)} units vs expected ${anomaly.expectedValue.toFixed(0)}`,
          value: anomaly.value,
          expectedValue: anomaly.expectedValue,
          deviation: anomaly.deviation,
          timestamp: new Date(),
          entityType,
          entityId,
          metadata: { metric: 'production', period: anomaly.period },
        });
      }
    }

    // Quality anomalies
    if (operationalData.quality) {
      const qualityAnomalies = this.detectQualityAnomalies(
        operationalData.quality,
        config
      );
      anomalies.push(
        ...qualityAnomalies.map(anomaly => ({
          ...anomaly,
          entityType,
          entityId,
        }))
      );
    }

    // Equipment anomalies
    if (operationalData.equipment) {
      const equipmentAnomalies = this.detectEquipmentAnomalies(
        operationalData.equipment,
        config
      );
      anomalies.push(
        ...equipmentAnomalies.map(anomaly => ({
          ...anomaly,
          entityType,
          entityId,
        }))
      );
    }

    return anomalies;
  }

  async detectBehavioralAnomalies(
    entityType: string,
    entityId: string,
    config: AnomalyDetectionConfig
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    // Get behavioral data
    const behavioralData = await this.getBehavioralData(entityType, entityId);

    // User activity anomalies
    if (behavioralData.userActivity) {
      const activityAnomalies = this.detectActivityAnomalies(
        behavioralData.userActivity,
        config
      );
      anomalies.push(
        ...activityAnomalies.map(anomaly => ({
          ...anomaly,
          entityType,
          entityId,
        }))
      );
    }

    // Transaction pattern anomalies
    if (behavioralData.transactions) {
      const transactionAnomalies = this.detectTransactionAnomalies(
        behavioralData.transactions,
        config
      );
      anomalies.push(
        ...transactionAnomalies.map(anomaly => ({
          ...anomaly,
          entityType,
          entityId,
        }))
      );
    }

    return anomalies;
  }

  private detectStatisticalAnomalies(
    data: number[],
    _metric: string,
    config: AnomalyDetectionConfig
  ): Array<{
    value: number;
    expectedValue: number;
    deviation: number;
    period: number;
  }> {
    if (data.length < config.windowSize) return [];

    const anomalies = [];
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance =
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    const threshold = stdDev * config.thresholdMultiplier;

    for (let i = config.windowSize; i < data.length; i++) {
      const value = data[i];
      if (value === undefined) continue;

      const windowMean =
        data
          .slice(i - config.windowSize, i)
          .reduce((sum, val) => sum + (val || 0), 0) / config.windowSize;
      const deviation = Math.abs(value - windowMean);

      if (deviation > threshold * config.sensitivity) {
        anomalies.push({
          value,
          expectedValue: windowMean,
          deviation: deviation / stdDev, // Normalized deviation
          period: i,
        });
      }
    }

    return anomalies;
  }

  private detectCashFlowAnomalies(
    cashFlow: number[],
    _config: AnomalyDetectionConfig
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Detect negative cash flow spikes
    for (let i = 1; i < cashFlow.length; i++) {
      const current = cashFlow[i];
      const previous = cashFlow[i - 1];

      if (
        current !== undefined &&
        previous !== undefined &&
        current < 0 &&
        previous > 0 &&
        Math.abs(current - previous) > previous * 0.5
      ) {
        anomalies.push({
          id: `cf_spike_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          type: 'financial',
          severity: 'high',
          description: `Significant cash flow drop detected: ${current.toFixed(2)} from ${previous.toFixed(2)}`,
          value: current,
          expectedValue: previous * 0.9, // Expected slight decrease
          deviation: Math.abs(current - previous) / Math.abs(previous),
          timestamp: new Date(),
          entityType: '',
          entityId: '',
          metadata: { metric: 'cash_flow', period: i },
        });
      }
    }

    return anomalies;
  }

  private detectQualityAnomalies(
    quality: number[],
    _config: AnomalyDetectionConfig
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Quality should generally be high and stable
    const mean = quality.reduce((sum, val) => sum + val, 0) / quality.length;

    for (let i = 0; i < quality.length; i++) {
      const currentQuality = quality[i];
      if (currentQuality !== undefined && currentQuality < mean * 0.8) {
        // Quality drop of more than 20%
        anomalies.push({
          id: `qual_drop_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          type: 'operational',
          severity: currentQuality < mean * 0.6 ? 'critical' : 'high',
          description: `Quality drop detected: ${(currentQuality * 100).toFixed(1)}% vs expected ${(mean * 100).toFixed(1)}%`,
          value: currentQuality,
          expectedValue: mean,
          deviation: (mean - currentQuality) / mean,
          timestamp: new Date(),
          entityType: '',
          entityId: '',
          metadata: { metric: 'quality', period: i },
        });
      }
    }

    return anomalies;
  }

  private detectEquipmentAnomalies(
    equipment: any[],
    _config: AnomalyDetectionConfig
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Mock equipment anomaly detection
    for (const eq of equipment) {
      if (eq.temperature > eq.maxTemperature * 0.9) {
        anomalies.push({
          id: `eq_temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          type: 'operational',
          severity: eq.temperature > eq.maxTemperature ? 'critical' : 'high',
          description: `Equipment temperature anomaly: ${eq.temperature}°C (max: ${eq.maxTemperature}°C)`,
          value: eq.temperature,
          expectedValue: eq.maxTemperature * 0.7,
          deviation:
            (eq.temperature - eq.maxTemperature * 0.7) /
            (eq.maxTemperature * 0.7),
          timestamp: new Date(),
          entityType: '',
          entityId: '',
          metadata: { metric: 'temperature', equipmentId: eq.id },
        });
      }
    }

    return anomalies;
  }

  private detectActivityAnomalies(
    _activity: any[],
    _config: AnomalyDetectionConfig
  ): Anomaly[] {
    // Mock activity anomaly detection
    return [];
  }

  private detectTransactionAnomalies(
    _transactions: any[],
    _config: AnomalyDetectionConfig
  ): Anomaly[] {
    // Mock transaction anomaly detection
    return [];
  }

  private calculateSeverity(deviation: number): Anomaly['severity'] {
    if (deviation > 4) return 'critical';
    if (deviation > 3) return 'high';
    if (deviation > 2) return 'medium';
    return 'low';
  }

  private getSeverityScore(severity: Anomaly['severity']): number {
    const scores = { critical: 4, high: 3, medium: 2, low: 1 };
    return scores[severity];
  }

  // Mock data getters
  private async getFinancialData(_entityType: string, _entityId: string) {
    return {
      revenue: Array.from({ length: 30 }, () => 10000 + Math.random() * 5000),
      expenses: Array.from({ length: 30 }, () => 7000 + Math.random() * 3000),
      cashFlow: Array.from(
        { length: 30 },
        () => 3000 + Math.random() * 2000 - 1000
      ),
    };
  }

  private async getOperationalData(_entityType: string, _entityId: string) {
    return {
      production: Array.from({ length: 30 }, () => 100 + Math.random() * 50),
      quality: Array.from({ length: 30 }, () => 0.85 + Math.random() * 0.1),
      equipment: [
        { id: 'eq1', temperature: 75 + Math.random() * 20, maxTemperature: 85 },
        { id: 'eq2', temperature: 65 + Math.random() * 25, maxTemperature: 80 },
      ],
    };
  }

  private async getBehavioralData(_entityType: string, _entityId: string) {
    return {
      userActivity: [],
      transactions: [],
    };
  }
}

