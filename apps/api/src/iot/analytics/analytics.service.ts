import { Injectable, Logger } from '@nestjs/common';
import { db, and, eq, gte, sql } from '@kiro/database';
import { equipmentMetrics, iotSensorData } from '@kiro/database/schema';

@Injectable()
export class IoTAnalyticsService {
  private readonly logger = new Logger(IoTAnalyticsService.name);

  async getDeviceAnalytics(
    deviceId: string,
    companyId: string,
    timeRange: string = '24h'
  ): Promise<any> {
    try {
      const timeRangeMap: Record<string, number> = {
        '1h': 1,
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30,
      };

      const hours = timeRangeMap[timeRange] || 24;
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      // Get sensor data analytics
      const sensorAnalytics = await db
        .select({
          sensorType: iotSensorData.sensorType,
          measurementType: iotSensorData.measurementType,
          avgValue: sql<number>`AVG(${iotSensorData.value}::numeric)`,
          minValue: sql<number>`MIN(${iotSensorData.value}::numeric)`,
          maxValue: sql<number>`MAX(${iotSensorData.value}::numeric)`,
          readingCount: sql<number>`COUNT(*)`,
        })
        .from(iotSensorData)
        .where(
          and(
            eq(iotSensorData.deviceId, deviceId),
            eq(iotSensorData.companyId, companyId),
            gte(iotSensorData.timestamp, startTime)
          )
        )
        .groupBy(iotSensorData.sensorType, iotSensorData.measurementType);

      return {
        deviceId,
        timeRange,
        analytics: sensorAnalytics,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get device analytics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async getEquipmentEfficiency(
    equipmentId: string,
    companyId: string
  ): Promise<any> {
    try {
      // Calculate OEE (Overall Equipment Effectiveness)
      const metrics = await db
        .select({
          metricName: equipmentMetrics.metricName,
          avgValue: sql<number>`AVG(${equipmentMetrics.metricValue}::numeric)`,
          maxValue: sql<number>`MAX(${equipmentMetrics.metricValue}::numeric)`,
          minValue: sql<number>`MIN(${equipmentMetrics.metricValue}::numeric)`,
        })
        .from(equipmentMetrics)
        .where(
          and(
            eq(equipmentMetrics.equipmentId, equipmentId),
            eq(equipmentMetrics.companyId, companyId),
            gte(
              equipmentMetrics.timestamp,
              new Date(Date.now() - 24 * 60 * 60 * 1000)
            )
          )
        )
        .groupBy(equipmentMetrics.metricName);

      // Mock OEE calculation - in reality, this would be more complex
      const availability = 0.85 + Math.random() * 0.1;
      const performance = 0.8 + Math.random() * 0.15;
      const quality = 0.9 + Math.random() * 0.08;
      const oee = availability * performance * quality;

      return {
        equipmentId,
        oee: Math.round(oee * 100) / 100,
        availability: Math.round(availability * 100) / 100,
        performance: Math.round(performance * 100) / 100,
        quality: Math.round(quality * 100) / 100,
        metrics,
        calculatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get equipment efficiency: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async getCompanyIoTOverview(companyId: string): Promise<any> {
    try {
      // Get recent sensor data count
      const recentDataCount = await db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(iotSensorData)
        .where(
          and(
            eq(iotSensorData.companyId, companyId),
            gte(
              iotSensorData.timestamp,
              new Date(Date.now() - 24 * 60 * 60 * 1000)
            )
          )
        );

      // Get equipment metrics count
      const equipmentMetricsCount = await db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(equipmentMetrics)
        .where(
          and(
            eq(equipmentMetrics.companyId, companyId),
            gte(
              equipmentMetrics.timestamp,
              new Date(Date.now() - 24 * 60 * 60 * 1000)
            )
          )
        );

      return {
        companyId,
        overview: {
          sensorReadings24h: recentDataCount[0]?.count || 0,
          equipmentMetrics24h: equipmentMetricsCount[0]?.count || 0,
          dataProcessingRate:
            Math.round(((recentDataCount[0]?.count || 0) / 24) * 100) / 100, // per hour
        },
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get IoT overview: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }
}
