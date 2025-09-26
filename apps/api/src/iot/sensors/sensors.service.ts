import { Injectable, Logger } from '@nestjs/common';
import { db } from '@velocity/database';
import {
  iotSensors,
  type IoTSensor,
  type NewIoTSensor,
} from '@velocity/database/schema';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class IoTSensorsService {
  private readonly logger = new Logger(IoTSensorsService.name);

  async create(sensorData: NewIoTSensor): Promise<IoTSensor> {
    try {
      const [sensor] = await db
        .insert(iotSensors)
        .values(sensorData)
        .returning();
      this.logger.log(
        `Created IoT sensor: ${sensor.sensorId} for device: ${sensor.deviceId}`
      );
      return sensor;
    } catch (error) {
      this.logger.error(
        `Failed to create IoT sensor: ${error.message}`,
        error.stack
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
      this.logger.error(
        `Failed to fetch sensors for device ${deviceId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
