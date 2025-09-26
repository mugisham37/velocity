import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { db } from '@velocity/database';
import {
  iotDevices,
  type IoTDevice,
  type NewIoTDevice,
} from '@velocity/database/schema';
import { and, asc, desc, eq, gte, ilike, or } from 'drizzle-orm';
import { CreateIoTDeviceDto } from './dto/create-device.dto';
import { DeviceQueryDto } from './dto/device-query.dto';
import { UpdateIoTDeviceDto } from './dto/update-device.dto';

@Injectable()
export class IoTDevicesService {
  private readonly logger = new Logger(IoTDevicesService.name);

  async create(
    createDeviceDto: CreateIoTDeviceDto,
    companyId: string,
    userId: string
  ): Promise<IoTDevice> {
    try {
      // Check if device ID already exists
      const existingDevice = await db
        .select()
        .from(iotDevices)
        .where(
          and(
            eq(iotDevices.deviceId, createDeviceDto.deviceId),
            eq(iotDevices.companyId, companyId)
          )
        )
        .limit(1);

      if (existingDevice.length > 0) {
        throw new ConflictException(
          `Device with ID ${createDeviceDto.deviceId} already exists`
        );
      }

      const newDevice: NewIoTDevice = {
        ...createDeviceDto,
        companyId,
        createdBy: userId,
        updatedBy: userId,
      };

      const [device] = await db
        .insert(iotDevices)
        .values(newDevice)
        .returning();

      this.logger.log(
        `Created IoT device: ${device.deviceId} for company: ${companyId}`
      );
      return device;
    } catch (error) {
      this.logger.error(
        `Failed to create IoT device: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async findAll(
    query: DeviceQueryDto,
    companyId: string
  ): Promise<{
    devices: IoTDevice[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const conditions = [eq(iotDevices.companyId, companyId)];

      // Apply filters
      if (query.status) {
        conditions.push(eq(iotDevices.status, query.status));
      }

      if (query.deviceType) {
        conditions.push(eq(iotDevices.deviceType, query.deviceType));
      }

      if (query.manufacturer) {
        conditions.push(eq(iotDevices.manufacturer, query.manufacturer));
      }

      if (query.assetId) {
        conditions.push(eq(iotDevices.assetId, query.assetId));
      }

      if (query.search) {
        conditions.push(
          or(
            ilike(iotDevices.name, `%${query.search}%`),
            ilike(iotDevices.deviceId, `%${query.search}%`)
          )
        );
      }

      if (query.lastSeenAfter) {
        conditions.push(
          gte(iotDevices.lastSeen, new Date(query.lastSeenAfter))
        );
      }

      if (query.lastSeenBefore) {
        conditions.push(
          lte(iotDevices.lastSeen, new Date(query.lastSeenBefore))
        );
      }

      const whereClause = and(...conditions);

      // Get total count
      const [{ count: totalCount }] = await db
        .select({ count: count() })
        .from(iotDevices)
        .where(whereClause);

      // Get paginated results
      const offset = (query.page - 1) * query.limit;
      const orderBy =
        query.sortOrder === 'asc'
          ? asc(
              iotDevices[query.sortBy as keyof typeof iotDevices] ||
                iotDevices.createdAt
            )
          : desc(
              iotDevices[query.sortBy as keyof typeof iotDevices] ||
                iotDevices.createdAt
            );

      const devices = await db
        .select()
        .from(iotDevices)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(query.limit)
        .offset(offset);

      const totalPages = Math.ceil(totalCount / query.limit);

      return {
        devices,
        total: totalCount,
        page: query.page,
        limit: query.limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch IoT devices: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async findOne(id: string, companyId: string): Promise<IoTDevice> {
    try {
      const [device] = await db
        .select()
        .from(iotDevices)
        .where(and(eq(iotDevices.id, id), eq(iotDevices.companyId, companyId)))
        .limit(1);

      if (!device) {
        throw new NotFoundException(`IoT device with ID ${id} not found`);
      }

      return device;
    } catch (error) {
      this.logger.error(
        `Failed to fetch IoT device ${id}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async findByDeviceId(
    deviceId: string,
    companyId: string
  ): Promise<IoTDevice> {
    try {
      const [device] = await db
        .select()
        .from(iotDevices)
        .where(
          and(
            eq(iotDevices.deviceId, deviceId),
            eq(iotDevices.companyId, companyId)
          )
        )
        .limit(1);

      if (!device) {
        throw new NotFoundException(
          `IoT device with device ID ${deviceId} not found`
        );
      }

      return device;
    } catch (error) {
      this.logger.error(
        `Failed to fetch IoT device by device ID ${deviceId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async update(
    id: string,
    updateDeviceDto: UpdateIoTDeviceDto,
    companyId: string,
    userId: string
  ): Promise<IoTDevice> {
    try {
      // Check if device exists
      await this.findOne(id, companyId);

      // Check for device ID conflicts if updating deviceId
      if (updateDeviceDto.deviceId) {
        const existingDevice = await db
          .select()
          .from(iotDevices)
          .where(
            and(
              eq(iotDevices.deviceId, updateDeviceDto.deviceId),
              eq(iotDevices.companyId, companyId),
              // Exclude current device
              eq(iotDevices.id, id)
            )
          )
          .limit(1);

        if (existingDevice.length > 0) {
          throw new ConflictException(
            `Device with ID ${updateDeviceDto.deviceId} already exists`
          );
        }
      }

      const [updatedDevice] = await db
        .update(iotDevices)
        .set({
          ...updateDeviceDto,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(and(eq(iotDevices.id, id), eq(iotDevices.companyId, companyId)))
        .returning();

      this.logger.log(
        `Updated IoT device: ${updatedDevice.deviceId} for company: ${companyId}`
      );
      return updatedDevice;
    } catch (error) {
      this.logger.error(
        `Failed to update IoT device ${id}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async updateLastSeen(deviceId: string, companyId: string): Promise<void> {
    try {
      await db
        .update(iotDevices)
        .set({
          lastSeen: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(iotDevices.deviceId, deviceId),
            eq(iotDevices.companyId, companyId)
          )
        );

      this.logger.debug(`Updated last seen for device: ${deviceId}`);
    } catch (error) {
      this.logger.error(
        `Failed to update last seen for device ${deviceId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async updateStatus(
    id: string,
    status: string,
    companyId: string,
    userId: string
  ): Promise<IoTDevice> {
    try {
      const [updatedDevice] = await db
        .update(iotDevices)
        .set({
          status: status as any,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(and(eq(iotDevices.id, id), eq(iotDevices.companyId, companyId)))
        .returning();

      if (!updatedDevice) {
        throw new NotFoundException(`IoT device with ID ${id} not found`);
      }

      this.logger.log(
        `Updated status for IoT device: ${updatedDevice.deviceId} to ${status}`
      );
      return updatedDevice;
    } catch (error) {
      this.logger.error(
        `Failed to update status for IoT device ${id}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async remove(id: string, companyId: string): Promise<void> {
    try {
      const result = await db
        .delete(iotDevices)
        .where(and(eq(iotDevices.id, id), eq(iotDevices.companyId, companyId)))
        .returning();

      if (result.length === 0) {
        throw new NotFoundException(`IoT device with ID ${id} not found`);
      }

      this.logger.log(
        `Deleted IoT device: ${result[0].deviceId} for company: ${companyId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete IoT device ${id}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async getDeviceStats(companyId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    maintenance: number;
    error: number;
    offline: number;
  }> {
    try {
      const stats = await db
        .select({
          status: iotDevices.status,
          count: count(),
        })
        .from(iotDevices)
        .where(eq(iotDevices.companyId, companyId))
        .groupBy(iotDevices.status);

      const result = {
        total: 0,
        active: 0,
        inactive: 0,
        maintenance: 0,
        error: 0,
        offline: 0,
      };

      stats.forEach(stat => {
        result.total += stat.count;
        result[stat.status as keyof typeof result] = stat.count;
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to get device stats: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
