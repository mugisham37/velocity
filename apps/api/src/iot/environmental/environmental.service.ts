import { Injectable, Logger } from '@nestjs/common';
import { db } from '@velocity/database';
import {
  environmentalMonitoring,
  type EnvironmentalMonitoring,
  type NewEnvironmentalMonitoring,
} from '@velocity/database/schema';
import { and, desc, eq, gte } from '@kiro/database';

@Injectable()
export class EnvironmentalMonitoringService {
  private readonly logger = new Logger(EnvironmentalMonitoringService.name);

  async create(
    data: NewEnvironmentalMonitoring
  ): Promise<EnvironmentalMonitoring> {
    try {
      const [record] = await db
        .insert(environmentalMonitoring)
        .values(data)
        .returning();
      this.logger.log(
        `Created environmental monitoring record for location: ${record.locationId}`
      );
      return record;
    } catch (error) {
      this.logger.error(
        `Failed to create environmental monitoring record: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async getLatestByLocation(
    locationId: string,
    companyId: string
  ): Promise<EnvironmentalMonitoring[]> {
    try {
      return await db
        .select()
        .from(environmentalMonitoring)
        .where(
          and(
            eq(environmentalMonitoring.locationId, locationId),
            eq(environmentalMonitoring.companyId, companyId),
            gte(
              environmentalMonitoring.timestamp,
              new Date(Date.now() - 24 * 60 * 60 * 1000)
            ) // Last 24 hours
          )
        )
        .orderBy(desc(environmentalMonitoring.timestamp))
        .limit(100);
    } catch (error) {
      this.logger.error(
        `Failed to fetch environmental data: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
