import { Injectable, Logger } from '@nestjs/common';
import { DataProcessingService } from './data-processing.service';
import { MqttGatewayService } from './mqtt-gateway.service';

@Injectable()
export class IoTGatewayService {
  private readonly logger = new Logger(IoTGatewayService.name);

  constructor(
    private readonly mqttGateway: MqttGatewayService,
    private readonly dataProcessing: DataProcessingService
  ) {}

  async getGatewayStatus(): Promise<{
    mqtt: {
      connected: boolean;
      config: any;
    };
    http: {
      available: boolean;
    };
    dataProcessing: {
      available: boolean;
    };
  }> {
    return {
      mqtt: {
        connected: this.mqttGateway.getConnectionStatus(),
        config: this.mqttGateway.getConfig(),
      },
      http: {
        available: true,
      },
      dataProcessing: {
        available: true,
      },
    };
  }

  async sendCommandToDevice(
    deviceId: string,
    command: any,
    protocol: 'mqtt' | 'http' = 'mqtt'
  ): Promise<void> {
    try {
      if (protocol === 'mqtt') {
        await this.mqttGateway.publishCommand(deviceId, command);
      } else {
        // For HTTP, you would need the device's endpoint
        // This is a simplified implementation
        this.logger.log(
          `HTTP command sending not fully implemented for device: ${deviceId}`
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send command to device ${deviceId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async publishToTopic(topic: string, payload: any): Promise<void> {
    return this.mqttGateway.publishToTopic(topic, payload);
  }

  async getRealtimeMetrics(
    companyId: string,
    timeRange?: string
  ): Promise<any> {
    return this.dataProcessing.getRealtimeMetrics(companyId, timeRange);
  }
}
