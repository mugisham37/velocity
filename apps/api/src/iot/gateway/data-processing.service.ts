import { Injectable, Logger } from '@nestjs/common';
import { db } from '../../database';
import { equipmentMetrics, iotSensorData, type NewEquipmentMetric, type NewIoTSensorData } from '@kiro/database/schema';
import { EquipmentMetricDto, SensorDataDto } from './dto/sensor-data.dto';

@Injectable()
export class DataProcessingService {
  private readonly logger = new Logger(DataProcessingService.name);

  async processSensorData(sensorData: SensorDataDto & { timestamp?: Date }, companyId: string): Promise<void> {
    try {
      const newSensorData: NewIoTSensorData = {
        deviceId: sensorData.deviceId,
        sensorType: sensorData.sensorType,
        measurementType: sensorData.measurementType,
        value: sensorData.value.toString(),
        unit: sensorData.unit || null,
        location: sensorData.location,
        metadata: sensorData.metadata,
        timestamp: sensorData.timestamp || new Date(),
        companyId,
      };

      await db.insert(iotSensorData).values(newSensorData);

      this.logger.debug(`Processed sensor data for device: ${sensorData.deviceId}`);

      // Trigger real-time analytics and alerts
      await this.checkForAlerts(sensorData, companyId);

    } catch (error) {
      this.logger.error(`Failed to process sensor data: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async processEquipmentMetrics(equipmentMetric: EquipmentMetricDto & { timestamp?: Date }, companyId: string): Promise<void> {
    try {
      const newEquipmentMetric: NewEquipmentMetric = {
        equipmentId: equipmentMetric.equipmentId,
        metricName: equipmentMetric.metricName,
        metricValue: equipmentMetric.metricValue.toString(),
        unit: equipmentMetric.unit || null,
        status: equipmentMetric.status || 'normal',
        alertThreshold: equipmentMetric.alertThreshold?.toString() || null,
        metadata: equipmentMetric.metadata,
        timestamp: equipmentMetric.timestamp || new Date(),
        companyId,
      };

      await db.insert(equipmentMetrics).values(newEquipmentMetric);

      this.logger.debug(`Processed equipment metric for equipment: ${equipmentMetric.equipmentId}`);

      // Check for threshold violations
      await this.checkEquipmentThresholds(equipmentMetric, companyId);

    } catch (error) {
      this.logger.error(`Failed to process equipment metrics: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async processBulkSensorData(readings: SensorDataDto[], companyId: string): Promise<void> {
    try {
      const sensorDataRecords: NewIoTSensorData[] = readings.map(reading => ({
        deviceId: reading.deviceId,
        sensorType: reading.sensorType,
        measurementType: reading.measurementType,
        value: reading.value.toString(),
        unit: reading.unit || null,
        location: reading.location,
        metadata: reading.metadata,
        timestamp: reading.timestamp ? new Date(reading.timestamp) : new Date(),
        companyId,
      }));

      // Batch insert for better performance
      await db.insert(iotSensorData).values(sensorDataRecords);

      this.logger.log(`Processed ${readings.length} sensor readings in bulk`);

      // Process alerts for each reading
      for (const reading of readings) {
        await this.checkForAlerts(reading, companyId);
      }

    } catch (error) {
      this.logger.error(`Failed to process bulk sensor data: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  private async checkForAlerts(sensorData: SensorDataDto, companyId: string): Promise<void> {
    try {
      // This is a simplified alert checking mechanism
      // In a real implementation, you would have configurable thresholds
      // and more sophisticated alert logic

      const alertConditions = this.getAlertConditions(sensorData.sensorType, sensorData.measurementType);

      if (alertConditions) {
        const shouldAlert = this.evaluateAlertCondition(sensorData.value, alertConditions);

        if (shouldAlert) {
          await this.createAlert({
            deviceId: sensorData.deviceId,
            sensorType: sensorData.sensorType,
            measurementType: sensorData.measurementType,
            value: sensorData.value,
            threshold: alertConditions.threshold,
            severity: alertConditions.severity,
            companyId,
          });
        }
      }
    } catch (error) {
      this.logger.error(`Failed to check for alerts: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
    }
  }

  private async checkEquipmentThresholds(equipmentMetric: EquipmentMetricDto, companyId: string): Promise<void> {
    try {
      if (equipmentMetric.alertThreshold && equipmentMetric.metricValue > equipmentMetric.alertThreshold) {
        await this.createEquipmentAlert({
          equipmentId: equipmentMetric.equipmentId,
          metricName: equipmentMetric.metricName,
          value: equipmentMetric.metricValue,
          threshold: equipmentMetric.alertThreshold,
          companyId,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to check equipment thresholds: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
    }
  }

  private getAlertConditions(sensorType: string, measurementType: string): any {
    // Simplified alert conditions - in a real implementation,
    // these would be configurable per device/sensor
    const conditions: Record<string, any> = {
      'temperature': {
        threshold: 80, // Celsius
        operator: '>',
        severity: 'high',
      },
      'humidity': {
        threshold: 90, // Percentage
        operator: '>',
        severity: 'medium',
      },
      'pressure': {
        threshold: 1000, // kPa
        operator: '>',
        severity: 'high',
      },
      'vibration': {
        threshold: 10, // mm/s
        operator: '>',
        severity: 'critical',
      },
    };

    return conditions[sensorType] || conditions[measurementType];
  }

  private evaluateAlertCondition(value: number, condition: any): boolean {
    switch (condition.operator) {
      case '>':
        return value > condition.threshold;
      case '<':
        return value < condition.threshold;
      case '>=':
        return value >= condition.threshold;
      case '<=':
        return value <= condition.threshold;
      case '==':
        return value === condition.threshold;
      case '!=':
        return value !== condition.threshold;
      default:
        return false;
    }
  }

  private async createAlert(alertData: {
    deviceId: string;
    sensorType: string;
    measurementType: string;
    value: number;
    threshold: number;
    severity: string;
    companyId: string;
  }): Promise<void> {
    try {
      // This would integrate with the IoT Alerts service
      this.logger.warn(`ALERT: Device ${alertData.deviceId} - ${alertData.sensorType} value ${alertData.value} exceeds threshold ${alertData.threshold}`);

      // TODO: Implement actual alert creation
      // await this.alertsService.createAlert({
      //   deviceId: alertData.deviceId,
      //   alertType: 'threshold_exceeded',
      //   severity: alertData.severity,
      //   title: `${alertData.sensorType} threshold exceeded`,
      //   description: `${alertData.measurementType} value ${alertData.value} exceeds threshold ${alertData.threshold}`,
      //   triggerValue: alertData.value,
      //   thresholdValue: alertData.threshold,
      //   companyId: alertData.companyId,
      // });

    } catch (error) {
      this.logger.error(`Failed to create alert: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
    }
  }

  private async createEquipmentAlert(alertData: {
    equipmentId: string;
    metricName: string;
    value: number;
    threshold: number;
    companyId: string;
  }): Promise<void> {
    try {
      this.logger.warn(`EQUIPMENT ALERT: Equipment ${alertData.equipmentId} - ${alertData.metricName} value ${alertData.value} exceeds threshold ${alertData.threshold}`);

      // TODO: Implement actual equipment alert creation

    } catch (error) {
      this.logger.error(`Failed to create equipment alert: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
    }
  }

  async getRealtimeMetrics(_companyId: string, timeRange: string = '1h'): Promise<any> {
    try {
      // This would return real-time metrics for dashboards
      // Implementation would depend on your specific requirements

      // Example query structure - would be implemented with Drizzle ORM
      // This would be the SQL query structure for reference:
      /*
        SELECT
          device_id,
          sensor_type,
          measurement_type,
          AVG(value::numeric) as avg_value,
          MAX(value::numeric) as max_value,
          MIN(value::numeric) as min_value,
          COUNT(*) as reading_count
        FROM iot_sensor_data
        WHERE company_id = $1
          AND timestamp >= NOW() - INTERVAL '${timeRange}'
        GROUP BY device_id, sensor_type, measurement_type
        ORDER BY device_id, sensor_type
      */

      // This is a raw query example - you'd use Drizzle ORM in practice
      // const results = await db.execute(sql`${query}`, [companyId]);

      return {
        timeRange,
        metrics: [], // results would go here
        timestamp: new Date(),
      };

    } catch (error) {
      this.logger.error(`Failed to get realtime metrics: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}

