import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';
import { IoTDevicesService } from '../devices/devices.service';
import { DataProcessingService } from './data-processing.service';

interface MqttConfig {
  brokerUrl: string;
  port: number;
  username?: string;
  password?: string;
  clientId: string;
  topics: {
    sensorData: string;
    equipmentMetrics: string;
    deviceStatus: string;
    commands: string;
  };
}

@Injectable()
export class MqttGatewayService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttGatewayService.name);
  private client: mqtt.MqttClient;
  private config: MqttConfig;
  private isConnected = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly dataProcessingService: DataProcessingService,
    private readonly devicesService: IoTDevicesService,
  ) {
    this.config = {
      brokerUrl: this.configService.get<string>('MQTT_BROKER_URL', 'mqtt://localhost'),
      port: this.configService.get<number>('MQTT_PORT', 1883),
      username: this.configService.get<strUSERNAME'),
      password: this.configService.get<string>('MQTT_PASSWORD'),
      clientId: this.configService.get<string>('MQTT_CLIENT_ID', 'kiro-erp-gateway'),
      topics: {
        sensorData: this.configService.get<string>('MQTT_TOPIC_SENSOR_DATA', 'kiro/sensors/+/data'),
        equipmentMetrics: this.configService.get<string>('MQTT_TOPIC_EQUIPMENT', 'kiro/equipment/+/metrics'),
        deviceStatus: this.configService.get<string>('MQTT_TOPIC_STATUS', 'kiro/devices/+/status'),
        commands: this.configService.get<string>('MQTT_TOPIC_COMMANDS', 'kiro/devices/+/commands'),
      },
    };
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      const options: mqtt.IClientOptions = {
        port: this.config.port,
        clientId: this.config.clientId,
        clean: true,
        connectTimeout: 30000,
        reconnectPeriod: 5000,
        keepalive: 60,
      };

      if (this.config.username && this.config.password) {
        options.username = this.config.username;
        options.password = this.config.password;
      }

      this.client = mqtt.connect(this.config.brokerUrl, options);

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Connected to MQTT broker');
        this.subscribeToTopics();
      });

      this.client.on('error', (error) => {
        this.logger.error(`MQTT connection error: ${error.message}`, error.stack);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.logger.warn('MQTT connection closed');
      });

      this.client.on('reconnect', () => {
        this.logger.log('Attempting to reconnect to MQTT broker');
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });

    } catch (error) {
      this.logger.error(`Failed to connect to MQTT broker: ${error.message}`, error.stack);
    }
  }

  private subscribeToTopics(): void {
    const topics = Object.values(this.config.topics);

    topics.forEach(topic => {
      this.client.subscribe(topic, { qos: 1 }, (error) => {
        if (error) {
          this.logger.error(`Failed to subscribe to topic ${topic}: ${error.message}`);
        } else {
          this.logger.log(`Subscribed to topic: ${topic}`);
        }
      });
    });
  }

  private async handleMessage(topic: string, message: Buffer): Promise<void> {
    try {
      const payload = JSON.parse(message.toString());
      const deviceId = this.extractDeviceIdFromTopic(topic);

      this.logger.debug(`Received message from ${topic}: ${JSON.stringify(payload)}`);

      // Update device last seen timestamp
      if (deviceId) {
        try {
          // Extract company ID from payload or use a default mechanism
          const companyId = payload.companyId || await this.getCompanyIdForDevice(deviceId);
          if (companyId) {
            await this.devicesService.updateLastSeen(deviceId, companyId);
          }
        } catch (error) {
          this.logger.warn(`Failed to update last seen for device ${deviceId}: ${error.message}`);
        }
      }

      // Route message based on topic pattern
      if (topic.includes('/sensors/') && topic.endsWith('/data')) {
        await this.handleSensorData(deviceId, payload);
      } else if (topic.includes('/equipment/') && topic.endsWith('/metrics')) {
        await this.handleEquipmentMetrics(payload);
      } else if (topic.includes('/devices/') && topic.endsWith('/status')) {
        await this.handleDeviceStatus(deviceId, payload);
      }

    } catch (error) {
      this.logger.error(`Failed to process MQTT message from ${topic}: ${error.message}`, error.stack);
    }
  }

  private extractDeviceIdFromTopic(topic: string): string | null {
    // Extract device ID from topic patterns like:
    // kiro/sensors/DEVICE_ID/data
    // kiro/equipment/DEVICE_ID/metrics
    // kiro/devices/DEVICE_ID/status
    const parts = topic.split('/');
    if (parts.length >= 3) {
      return parts[2]; // Device ID is typically the 3rd part
    }
    return null;
  }

  private async getCompanyIdForDevice(deviceId: string): Promise<string | null> {
    // This is a simplified approach - in a real implementation,
    // you might need a more sophisticated way to determine company ID
    // For now, we'll return null and handle it gracefully
    return null;
  }

  private async handleSensorData(deviceId: string, payload: any): Promise<void> {
    try {
      const sensorData = {
        deviceId,
        sensorType: payload.sensorType,
        measurementType: payload.measurementType,
        value: payload.value,
        unit: payload.unit,
        location: payload.location,
        metadata: payload.metadata,
        timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      };

      await this.dataProcessingService.processSensorData(sensorData, payload.companyId);
    } catch (error) {
      this.logger.error(`Failed to handle sensor data: ${error.message}`, error.stack);
    }
  }

  private async handleEquipmentMetrics(payload: any): Promise<void> {
    try {
      const equipmentMetric = {
        equipmentId: payload.equipmentId,
        metricName: payload.metricName,
        metricValue: payload.metricValue,
        unit: payload.unit,
        status: payload.status,
        alertThreshold: payload.alertThreshold,
        metadata: payload.metadata,
        timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      };

      await this.dataProcessingService.processEquipmentMetrics(equipmentMetric, payload.companyId);
    } catch (error) {
      this.logger.error(`Failed to handle equipment metrics: ${error.message}`, error.stack);
    }
  }

  private async handleDeviceStatus(deviceId: string, payload: any): Promise<void> {
    try {
      // Handle device status updates
      this.logger.log(`Device ${deviceId} status update: ${JSON.stringify(payload)}`);

      // You could update device status in database here
      // await this.devicesService.updateStatus(deviceId, payload.status, payload.companyId, 'system');
    } catch (error) {
      this.logger.error(`Failed to handle device status: ${error.message}`, error.stack);
    }
  }

  async publishCommand(deviceId: string, command: any): Promise<void> {
    if (!this.isConnected) {
      throw new Error('MQTT client is not connected');
    }

    const topic = `kiro/devices/${deviceId}/commands`;
    const message = JSON.stringify(command);

    return new Promise((resolve, reject) => {
      this.client.publish(topic, message, { qos: 1 }, (error) => {
        if (error) {
          this.logger.error(`Failed to publish command to ${deviceId}: ${error.message}`);
          reject(error);
        } else {
          this.logger.log(`Published command to device ${deviceId}`);
          resolve();
        }
      });
    });
  }

  async publishToTopic(topic: string, payload: any): Promise<void> {
    if (!this.isConnected) {
      throw new Error('MQTT client is not connected');
    }

    const message = JSON.stringify(payload);

    return new Promise((resolve, reject) => {
      this.client.publish(topic, message, { qos: 1 }, (error) => {
        if (error) {
          this.logger.error(`Failed to publish to topic ${topic}: ${error.message}`);
          reject(error);
        } else {
          this.logger.debug(`Published message to topic ${topic}`);
          resolve();
        }
      });
    });
  }

  private async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      return new Promise((resolve) => {
        this.client.end(false, {}, () => {
          this.logger.log('Disconnected from MQTT broker');
          resolve();
        });
      });
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getConfig(): MqttConfig {
    return { ...this.config };
  }
}
