import { Injectable, Logger } from '@nestjs/common';
import { DataProcessingService } from './data-processing.service';
import {
  BulkSensorDataDto,
  EquipmentMetricDto,
  SensorDataDto,
} from './dto/sensor-data.dto';

@Injectable()
export class HttpGatewayService {
  private readonly logger = new Logger(HttpGatewayService.name);

  constructor(private readonly dataProcessingService: DataProcessingService) {}

  async receiveSensorData(
    sensorData: SensorDataDto,
    companyId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const processedData = {
        ...sensorData,
        timestamp: sensorData.timestamp ? new Date(sensorData.timestamp) : new Date(),
      } as SensorDataDto & { timestamp?: Date };
      await this.dataProcessingService.processSensorData(processedData, companyId);

      this.logger.log(
        `Received sensor data via HTTP from device: ${sensorData.deviceId}`
      );

      return {
        success: true,
        message: 'Sensor data processed successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to process HTTP sensor data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async receiveBulkSensorData(
    bulkData: BulkSensorDataDto,
    companyId: string
  ): Promise<{
    success: boolean;
    message: string;
    processed: number;
    failed: number;
  }> {
    try {
      let processed = 0;
      let failed = 0;

      // Process readings in batches for better performance
      const batchSize = 100;
      for (let i = 0; i < bulkData.readings.length; i += batchSize) {
        const batch = bulkData.readings.slice(i, i + batchSize);

        try {
          await this.dataProcessingService.processBulkSensorData(
            batch,
            companyId
          );
          processed += batch.length;
        } catch (error) {
          this.logger.error(
            `Failed to process batch starting at index ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          failed += batch.length;
        }
      }

      this.logger.log(
        `Processed bulk sensor data via HTTP: ${processed} successful, ${failed} failed`
      );

      return {
        success: failed === 0,
        message: `Processed ${processed} readings, ${failed} failed`,
        processed,
        failed,
      };
    } catch (error) {
      this.logger.error(
        `Failed to process bulk HTTP sensor data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async receiveEquipmentMetrics(
    equipmentMetric: EquipmentMetricDto,
    companyId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const processedMetric = {
        ...equipmentMetric,
        timestamp: equipmentMetric.timestamp ? new Date(equipmentMetric.timestamp) : new Date(),
      } as EquipmentMetricDto & { timestamp?: Date };
      await this.dataProcessingService.processEquipmentMetrics(
        processedMetric,
        companyId
      );

      this.logger.log(
        `Received equipment metrics via HTTP for equipment: ${equipmentMetric.equipmentId}`
      );

      return {
        success: true,
        message: 'Equipment metrics processed successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to process HTTP equipment metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async getDeviceStatus(deviceId: string, _companyId: string): Promise<any> {
    try {
      // This would return the current status of a device
      // For now, return a mock response

      this.logger.debug(`Status request for device: ${deviceId}`);

      return {
        deviceId,
        status: 'active',
        lastSeen: new Date(),
        uptime: '24h 15m',
        batteryLevel: 85,
        signalStrength: -45,
        firmware: '1.2.3',
        sensors: [
          { type: 'temperature', status: 'active', lastReading: new Date() },
          { type: 'humidity', status: 'active', lastReading: new Date() },
        ],
      };
    } catch (error) {
      this.logger.error(
        `Failed to get device status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async sendCommand(
    deviceId: string,
    command: any,
    _companyId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // This would send a command to a device
      // Implementation would depend on the device communication protocol

      this.logger.log(
        `Sending command to device ${deviceId}: ${JSON.stringify(command)}`
      );

      // For HTTP-based devices, you might make an HTTP request to the device
      // For MQTT devices, you would publish to the device's command topic

      return {
        success: true,
        message: `Command sent to device ${deviceId}`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send command to device: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async validateSensorData(
    sensorData: SensorDataDto
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic validation
    if (!sensorData.deviceId) {
      errors.push('Device ID is required');
    }

    if (!sensorData.sensorType) {
      errors.push('Sensor type is required');
    }

    if (!sensorData.measurementType) {
      errors.push('Measurement type is required');
    }

    if (typeof sensorData.value !== 'number') {
      errors.push('Value must be a number');
    }

    // Range validation based on sensor type
    if (
      sensorData.sensorType === 'temperature' &&
      (sensorData.value < -273.15 || sensorData.value > 1000)
    ) {
      errors.push('Temperature value out of valid range');
    }

    if (
      sensorData.sensorType === 'humidity' &&
      (sensorData.value < 0 || sensorData.value > 100)
    ) {
      errors.push('Humidity value must be between 0 and 100');
    }

    if (sensorData.sensorType === 'pressure' && sensorData.value < 0) {
      errors.push('Pressure value cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async getRealtimeData(
    companyId: string,
    filters?: {
      deviceIds?: string[];
      sensorTypes?: string[];
      timeRange?: string;
    }
  ): Promise<any> {
    try {
      return await this.dataProcessingService.getRealtimeMetrics(
        companyId,
        filters?.timeRange
      );
    } catch (error) {
      this.logger.error(
        `Failed to get realtime data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }
}
