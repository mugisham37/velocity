import { Injectable, Logger } from '@nestjs/common';
import { db, and, desc, eq } from '../../database';
import {
  iotAlerts,
  type IoTAlert,
  type NewIoTAlert,
} from '@kiro/database/schema';

@Injectable()
export class IoTAlertsService {
  private readonly logger = new Logger(IoTAlertsService.name);

  async create(alertData: NewIoTAlert): Promise<IoTAlert> {
    try {
      const [alert] = await db.insert(iotAlerts).values(alertData).returning();
      if (!alert) {
        throw new Error('Failed to create IoT alert');
      }
      this.logger.log(
        `Created IoT alert: ${alert['title']} for device: ${alert['deviceId']}`
      );
      return alert;
    } catch (error) {
      this.logger.error(
        `Failed to create IoT alert: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
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
        `Failed to fetch IoT alerts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
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

      if (!alert) {
        throw new Error(`IoT alert with ID ${alertId} not found`);
      }

      this.logger.log(`Acknowledged IoT alert: ${alertId}`);
      return alert;
    } catch (error) {
      this.logger.error(
        `Failed to acknowledge IoT alert: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }
}

