import { Injectable, Logger } from '@nestjs/common';
import { db, and, desc, eq, gte, sum } from '../../database';
import {
  energyConsumption,
  type EnergyConsumption,
  type NewEnergyConsumption,
} from '@kiro/database/schema';

@Injectable()
export class EnergyMonitoringService {
  private readonly logger = new Logger(EnergyMonitoringService.name);

  async create(data: NewEnergyConsumption): Promise<EnergyConsumption> {
    try {
      const [record] = await db
        .insert(energyConsumption)
        .values(data)
        .returning();
      
      if (!record) {
        throw new Error('Failed to create energy consumption record');
      }
      
      this.logger.log(
        `Created energy consumption record for meter: ${record['meterId']}`
      );
      return record;
    } catch (error) {
      this.logger.error(
        `Failed to create energy consumption record: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async getConsumptionByMeter(
    meterId: string,
    companyId: string,
    days: number = 7
  ): Promise<EnergyConsumption[]> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      return await db
        .select()
        .from(energyConsumption)
        .where(
          and(
            eq(energyConsumption.meterId, meterId),
            eq(energyConsumption.companyId, companyId),
            gte(energyConsumption.timestamp, startDate)
          )
        )
        .orderBy(desc(energyConsumption.timestamp));
    } catch (error) {
      this.logger.error(
        `Failed to fetch energy consumption data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async getTotalConsumption(
    companyId: string,
    meterType?: string
  ): Promise<any> {
    try {
      const conditions = [eq(energyConsumption.companyId, companyId)];

      if (meterType) {
        conditions.push(eq(energyConsumption.meterType, meterType));
      }

      const result = await db
        .select({
          totalConsumption: sum(energyConsumption.consumption),
          totalCost: sum(energyConsumption.cost),
          meterType: energyConsumption.meterType,
        })
        .from(energyConsumption)
        .where(and(...conditions))
        .groupBy(energyConsumption.meterType);

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to get total consumption: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }
}

