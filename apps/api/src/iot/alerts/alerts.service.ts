import { Injectable, Logger } from '@nestjs/common';
import { db } from '@velocity/database';
import {
  iotAlerts,
  type IoTAlert,
  type NewIoTAlert,
} from '@velocity/database/schema';
import { and, desc, eq } from 'drizzle-orm';

@Injectable()
export class IoTAlertsService {
  private readonly logger = new Logger(IoTAlertsService.name);

  async create(alertData: NewIoTAlert): Promise<IoTAlert> {
    try {
      const [alert] = await db.insert(iotAlerts).values(alertData).returning();
      this.logger.log(
        `Created IoT alert: ${alert.title} for device: ${alert.deviceId}`
      );
      return alert;
    } catch (error) {
      this.logger.error(
        `Failed to create IoT alert: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async findAll(companyId: string, limit: number = 50): Promise<IoTAlert[]> {
    try {
      return await db
        .select()
        .from(iotAlerts)
        .where(eq(iotAlerts.companyId, companyId))
        .orderBy(desc(iotAlerts.createdAt))
        .limit(limit);
    } catch (error) {
      this.logger.error(
        `Failed to fetch IoT alerts: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async acknowledge(
    alertId: string,
    userId: string,
    companyId: string
  ): Promise<IoTAlert> {
    try {
      const [alert] = await db
        .update(iotAlerts)
        .set({
          status: 'acknowledged',
          acknowledgedAt: new Date(),
          acknowledgedBy: userId,
          updatedAt: new Date(),
        })
        .where(
          and(eq(iotAlerts.id, alertId), eq(iotAlerts.companyId, companyId))
        )
        .returning();

      this.logger.log(`Acknowledged IoT alert: ${alertId}`);
      return alert;
    } catch (error) {
      this.logger.error(
        `Failed to acknowledge IoT alert: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
