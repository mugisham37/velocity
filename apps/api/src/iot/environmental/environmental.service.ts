import { Injectable, Logger } from '@nestjs/common';
import { db, and, desc, eq, gte } from '../../database';
import {
  environmentalMonitoring,
  type EnvironmentalMonitoring,
  type NewEnvironmentalMonitoring,
} from '../../database/schema';

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
      
      if (!record) {
        throw new Error('Failed to create environmental monitoring record');
      }
      
      this.logger.log(
        `Created environmental monitoring record for location: ${record['locationId']}`
      );
      return record;
    } catch (error) {
      this.logger.error(
        `Failed to create environmental monitoring record: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
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
        `Failed to fetch environmental data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }
}

