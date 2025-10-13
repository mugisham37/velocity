import { Injectable, Logger } from '@nestjs/common';
import { db, and, eq } from '../../database';
import {
  iotSensors,
  type IoTSensor,
  type NewIoTSensor,
} from '../../database';

@Injectable()
export class IoTSensorsService {
  private readonly logger = new Logger(IoTSensorsService.name);

  async create(sensorData: NewIoTSensor): Promise<IoTSensor> {
    try {
      const [sensor] = await db
        .insert(iotSensors)
        .values(sensorData)
        .returning();
      
      if (!sensor) {
        throw new Error('Failed to create IoT sensor');
      }
      
      this.logger.log(
        `Created IoT sensor: ${sensor.sensorId} for device: ${sensor.deviceId}`
      );
      return sensor;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to create IoT sensor: ${errorMessage}`,
        errorStack
      );
      throw error;
    }
  }

  async findByDevice(
    deviceId: string,
    companyId: string
  ): Promise<IoTSensor[]> {
    try {
      return await db
        .select()
        .from(iotSensors)
        .where(
          and(
            eq(iotSensors.deviceId, deviceId),
            eq(iotSensors.companyId, companyId)
          )
        );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to fetch sensors for device ${deviceId}: ${errorMessage}`,
        errorStack
      );
      throw error;
    }
  }
}

