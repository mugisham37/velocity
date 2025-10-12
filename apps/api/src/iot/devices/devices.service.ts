import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { db, and, asc, desc, eq, gte, ilike, or, lte, count } from '@kiro/database';
import {
  iotDevices,
  type IoTDevice,
  type NewIoTDevice,
} from '@kiro/database/schema';
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

      if (!device) {
        throw new Error('Failed to create IoT device');
      }

      this.logger.log(
        `Created IoT device: ${device['deviceId']} for company: ${companyId}`
      );
      return device;
    } catch (error) {
      this.logger.error(
        `Failed to create IoT device: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
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
        const searchCondition = or(
          ilike(iotDevices.name, `%${query.search}%`),
          ilike(iotDevices.deviceId, `%${query.search}%`)
        );
        if (searchCondition) {
          conditions.push(searchCondition);
        }
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

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const countQuery = db
        .select({ count: count() })
        .from(iotDevices);
      
      if (whereClause) {
        countQuery.where(whereClause);
      }
      
      const countResult = await countQuery;
      const totalCount = countResult[0]?.count ? Number(countResult[0].count) : 0;

      // Get paginated results
      const page = query.page || 1;
      const limit = query.limit || 10;
      const offset = (page - 1) * limit;
      // Get the column to sort by, defaulting to createdAt
      let sortColumn = iotDevices.createdAt;
      if (query.sortBy && typeof query.sortBy === 'string') {
        const validColumns = ['createdAt', 'updatedAt', 'name', 'deviceId', 'status', 'deviceType'];
        if (validColumns.includes(query.sortBy)) {
          sortColumn = iotDevices[query.sortBy as keyof typeof iotDevices] as any;
        }
      }
      
      const orderBy = query.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

      const devicesQuery = db
        .select()
        .from(iotDevices);
      
      if (whereClause) {
        devicesQuery.where(whereClause);
      }
      
      const devices = await devicesQuery
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        devices,
        total: totalCount,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch IoT devices: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
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
        `Failed to fetch IoT device ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
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
        `Failed to fetch IoT device by device ID ${deviceId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async update(
    id: string,
    updateDeviceDto: UpdateIoTDeviceDto & { deviceId?: string },
    companyId: string,
    userId: string
  ): Promise<IoTDevice> {
    try {
      // Check if device exists
      await this.findOne(id, companyId);

      // Check for device ID conflicts if updating deviceId
      if (updateDeviceDto.deviceId) {
        const deviceIdToCheck = updateDeviceDto.deviceId;
        const existingDevice = await db
          .select()
          .from(iotDevices)
          .where(
            and(
              eq(iotDevices.deviceId, deviceIdToCheck),
              eq(iotDevices.companyId, companyId)
            )
          )
          .limit(1);

        // Check if the existing device is not the current device being updated
        if (existingDevice.length > 0 && existingDevice[0]?.id !== id) {
          throw new ConflictException(
            `Device with ID ${deviceIdToCheck} already exists`
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

      if (!updatedDevice) {
        throw new Error('Failed to update IoT device');
      }

      this.logger.log(
        `Updated IoT device: ${updatedDevice['deviceId']} for company: ${companyId}`
      );
      return updatedDevice;
    } catch (error) {
      this.logger.error(
        `Failed to update IoT device ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
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
        `Failed to update last seen for device ${deviceId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
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
        `Updated status for IoT device: ${updatedDevice['deviceId']} to ${status}`
      );
      return updatedDevice;
    } catch (error) {
      this.logger.error(
        `Failed to update status for IoT device ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
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
        `Deleted IoT device: ${result[0]?.['deviceId']} for company: ${companyId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete IoT device ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
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

      stats.forEach((stat) => {
        const count = Number(stat.count);
        result.total += count;
        if (stat.status in result) {
          (result as any)[stat.status] = count;
        }
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to get device stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }
}
