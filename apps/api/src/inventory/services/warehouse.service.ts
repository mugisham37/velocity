import {
  DatabaseService,
  warehouseLocations,
  warehousePerformanceMetrics,
  warehouseTransferItems,
  warehouseTransfers,
  warehouses,
  type Warehouse,
  type WarehouseLocation,
  type WarehousePerformanceMetric,
  type WarehouseTransfer,
  type WarehouseTransferItem,
} from '@kiro/database';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  asc,
  between,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  sql,
} from 'drizzle-orm';
import {
  CreateWarehouseDto,
  CreateWarehouseLocationDto,
  CreateWarehouseTransferDto,
  LocationFilterDto,
  TransferFilterDto,
  UpdateTransferItemDto,
  UpdateWarehouseDto,
  UpdateWarehouseLocationDto,
  UpdateWarehouseTransferDto,
  WarehouseFilterDto,
} from '../dto/warehouse.dto';

@Injectable()
export class WarehouseService {
  constructor(private readonly db: DatabaseService) {}

  // Warehouse Management
  async createWarehouse(
    createWarehouseDto: CreateWarehouseDto,
    userId: string
  ): Promise<Warehouse> {
    // Check if warehouse code already exists for the company
    const existingWarehouse = await this.db.query.warehouses.findFirst({
      where: and(
        eq(warehouses.warehouseCode, createWarehouseDto.warehouseCode),
        eq(warehouses.companyId, createWarehouseDto.companyId)
      ),
    });

    if (existingWarehouse) {
      throw new ConflictException(
        `Warehouse with code '${createWarehouseDto.warehouseCode}' already exists`
      );
    }

    // Validate parent warehouse if provided
    if (createWarehouseDto.parentWarehouseId) {
      const parentWarehouse = await this.db.query.warehouses.findFirst({
        where: and(
          eq(warehouses.id, createWarehouseDto.parentWarehouseId),
          eq(warehouses.companyId, createWarehouseDto.companyId)
        ),
      });

      if (!parentWarehouse) {
        throw new NotFoundException('Parent warehouse not found');
      }
    }

    const [newWarehouse] = await this.db
      .insert(warehouses)
      .values({
        ...createWarehouseDto,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return newWarehouse;
  }

  async updateWarehouse(
    id: string,
    updateWarehouseDto: UpdateWarehouseDto,
    userId: string
  ): Promise<Warehouse> {
    const existingWarehouse = await this.db.query.warehouses.findFirst({
      where: eq(warehouses.id, id),
    });

    if (!existingWarehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Validate parent warehouse if provided
    if (updateWarehouseDto.parentWarehouseId) {
      const parentWarehouse = await this.db.query.warehouses.findFirst({
        where: and(
          eq(warehouses.id, updateWarehouseDto.parentWarehouseId),
          eq(warehouses.companyId, existingWarehouse.companyId)
        ),
      });

      if (!parentWarehouse) {
        throw new NotFoundException('Parent warehouse not found');
      }

      // Prevent circular reference
      if (updateWarehouseDto.parentWarehouseId === id) {
        throw new BadRequestException('Warehouse cannot be its own parent');
      }
    }

    const [updatedWarehouse] = await this.db
      .update(warehouses)
      .set({
        ...updateWarehouseDto,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(warehouses.id, id))
      .returning();

    return updatedWarehouse;
  }

  async getWarehouse(id: string): Promise<
    Warehouse & {
      locations?: WarehouseLocation[];
      performanceMetrics?: WarehousePerformanceMetric[];
    }
  > {
    const warehouse = await this.db.query.warehouses.findFirst({
      where: eq(warehouses.id, id),
      with: {
        locations: {
          where: eq(warehouseLocations.isActive, true),
          orderBy: asc(warehouseLocations.locationName),
        },
        performanceMetrics: {
          orderBy: desc(warehousePerformanceMetrics.metricDate),
          limit: 12, // Last 12 periods
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    return warehouse;
  }

  async getWarehouses(
    filterDto: WarehouseFilterDto,
    companyId: string
  ): Promise<{
    warehouses: Warehouse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'warehouseName',
      sortOrder = 'asc',
      ...filters
    } = filterDto;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(warehouses.companyId, companyId)];

    if (filters.search) {
      whereConditions.push(
        or(
          ilike(warehouses.warehouseCode, `%${filters.search}%`),
          ilike(warehouses.warehouseName, `%${filters.search}%`),
          ilike(warehouses.description, `%${filters.search}%`)
        )
      );
    }

    if (filters.warehouseType) {
      whereConditions.push(eq(warehouses.warehouseType, filters.warehouseType));
    }

    if (filters.parentWarehouseId) {
      whereConditions.push(
        eq(warehouses.parentWarehouseId, filters.parentWarehouseId)
      );
    }

    if (filters.isActive !== undefined) {
      whereConditions.push(eq(warehouses.isActive, filters.isActive));
    }

    if (filters.isGroup !== undefined) {
      whereConditions.push(eq(warehouses.isGroup, filters.isGroup));
    }

    const whereClause = and(...whereConditions);

    // Get total count
    const [{ count: totalCount }] = await this.db
      .select({ count: count() })
      .from(warehouses)
      .where(whereClause);

    // Get warehouses with pagination and sorting
    const orderBy =
      sortOrder === 'desc' ? desc(warehouses[sortBy]) : asc(warehouses[sortBy]);

    const warehousesList = await this.db.query.warehouses.findMany({
      where: whereClause,
      with: {
        locations: {
          where: eq(warehouseLocations.isActive, true),
        },
      },
      orderBy,
      limit,
      offset,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return {
      warehouses: warehousesList,
      total: totalCount,
      page,
      limit,
      totalPages,
    };
  }

  async getWarehouseHierarchy(companyId: string): Promise<Warehouse[]> {
    // Get root warehouses (no parent)
    return this.db.query.warehouses.findMany({
      where: and(
        eq(warehouses.companyId, companyId),
        sql`${warehouses.parentWarehouseId} IS NULL`
      ),
      with: {
        childWarehouses: {
          with: {
            childWarehouses: {
              with: {
                childWarehouses: true, // Support up to 4 levels
              },
            },
          },
        },
      },
      orderBy: asc(warehouses.warehouseName),
    });
  }

  async deleteWarehouse(id: string): Promise<void> {
    const existingWarehouse = await this.db.query.warehouses.findFirst({
      where: eq(warehouses.id, id),
    });

    if (!existingWarehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Check if warehouse has child warehouses
    const childWarehouses = await this.db.query.warehouses.findMany({
      where: eq(warehouses.parentWarehouseId, id),
    });

    if (childWarehouses.length > 0) {
      throw new BadRequestException(
        'Cannot delete warehouse with child warehouses'
      );
    }

    // Check if warehouse has active stock (this would be implemented based on stock levels)
    // For now, we'll just delete the warehouse
    await this.db.delete(warehouses).where(eq(warehouses.id, id));
  }

  // Warehouse Location Management
  async createWarehouseLocation(
    createLocationDto: CreateWarehouseLocationDto,
    userId: string
  ): Promise<WarehouseLocation> {
    // Check if location code already exists in the warehouse
    const existingLocation = await this.db.query.warehouseLocations.findFirst({
      where: and(
        eq(warehouseLocations.locationCode, createLocationDto.locationCode),
        eq(warehouseLocations.warehouseId, createLocationDto.warehouseId)
      ),
    });

    if (existingLocation) {
      throw new ConflictException(
        `Location with code '${createLocationDto.locationCode}' already exists in this warehouse`
      );
    }

    // Validate warehouse exists
    const warehouse = await this.db.query.warehouses.findFirst({
      where: eq(warehouses.id, createLocationDto.warehouseId),
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Validate parent location if provided
    if (createLocationDto.parentLocationId) {
      const parentLocation = await this.db.query.warehouseLocations.findFirst({
        where: and(
          eq(warehouseLocations.id, createLocationDto.parentLocationId),
          eq(warehouseLocations.warehouseId, createLocationDto.warehouseId)
        ),
      });

      if (!parentLocation) {
        throw new NotFoundException('Parent location not found');
      }
    }

    const [newLocation] = await this.db
      .insert(warehouseLocations)
      .values({
        ...createLocationDto,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return newLocation;
  }

  async updateWarehouseLocation(
    id: string,
    updateLocationDto: UpdateWarehouseLocationDto,
    userId: string
  ): Promise<WarehouseLocation> {
    const existingLocation = await this.db.query.warehouseLocations.findFirst({
      where: eq(warehouseLocations.id, id),
    });

    if (!existingLocation) {
      throw new NotFoundException('Location not found');
    }

    // Validate parent location if provided
    if (updateLocationDto.parentLocationId) {
      const parentLocation = await this.db.query.warehouseLocations.findFirst({
        where: and(
          eq(warehouseLocations.id, updateLocationDto.parentLocationId),
          eq(warehouseLocations.warehouseId, existingLocation.warehouseId)
        ),
      });

      if (!parentLocation) {
        throw new NotFoundException('Parent location not found');
      }

      // Prevent circular reference
      if (updateLocationDto.parentLocationId === id) {
        throw new BadRequestException('Location cannot be its own parent');
      }
    }

    const [updatedLocation] = await this.db
      .update(warehouseLocations)
      .set({
        ...updateLocationDto,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(warehouseLocations.id, id))
      .returning();

    return updatedLocation;
  }

  async getWarehouseLocations(filterDto: LocationFilterDto): Promise<{
    locations: WarehouseLocation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'locationName',
      sortOrder = 'asc',
      ...filters
    } = filterDto;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];

    if (filters.search) {
      whereConditions.push(
        or(
          ilike(warehouseLocations.locationCode, `%${filters.search}%`),
          ilike(warehouseLocations.locationName, `%${filters.search}%`),
          ilike(warehouseLocations.description, `%${filters.search}%`)
        )
      );
    }

    if (filters.warehouseId) {
      whereConditions.push(
        eq(warehouseLocations.warehouseId, filters.warehouseId)
      );
    }

    if (filters.locationType) {
      whereConditions.push(
        eq(warehouseLocations.locationType, filters.locationType)
      );
    }

    if (filters.parentLocationId) {
      whereConditions.push(
        eq(warehouseLocations.parentLocationId, filters.parentLocationId)
      );
    }

    if (filters.isActive !== undefined) {
      whereConditions.push(eq(warehouseLocations.isActive, filters.isActive));
    }

    if (filters.isGroup !== undefined) {
      whereConditions.push(eq(warehouseLocations.isGroup, filters.isGroup));
    }

    if (filters.temperatureControlled !== undefined) {
      whereConditions.push(
        eq(
          warehouseLocations.temperatureControlled,
          filters.temperatureControlled
        )
      );
    }

    if (filters.restrictedAccess !== undefined) {
      whereConditions.push(
        eq(warehouseLocations.restrictedAccess, filters.restrictedAccess)
      );
    }

    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const [{ count: totalCount }] = await this.db
      .select({ count: count() })
      .from(warehouseLocations)
      .where(whereClause);

    // Get locations with pagination and sorting
    const orderBy =
      sortOrder === 'desc'
        ? desc(warehouseLocations[sortBy])
        : asc(warehouseLocations[sortBy]);

    const locationsList = await this.db.query.warehouseLocations.findMany({
      where: whereClause,
      with: {
        warehouse: true,
        parentLocation: true,
      },
      orderBy,
      limit,
      offset,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return {
      locations: locationsList,
      total: totalCount,
      page,
      limit,
      totalPages,
    };
  }

  async getLocationHierarchy(
    warehouseId: string
  ): Promise<WarehouseLocation[]> {
    // Get root locations (no parent)
    return this.db.query.warehouseLocations.findMany({
      where: and(
        eq(warehouseLocations.warehouseId, warehouseId),
        sql`${warehouseLocations.parentLocationId} IS NULL`
      ),
      with: {
        childLocations: {
          with: {
            childLocations: {
              with: {
                childLocations: true, // Support up to 4 levels
              },
            },
          },
        },
      },
      orderBy: asc(warehouseLocations.locationName),
    });
  }

  async deleteWarehouseLocation(id: string): Promise<void> {
    const existingLocation = await this.db.query.warehouseLocations.findFirst({
      where: eq(warehouseLocations.id, id),
    });

    if (!existingLocation) {
      throw new NotFoundException('Location not found');
    }

    // Check if location has child locations
    const childLocations = await this.db.query.warehouseLocations.findMany({
      where: eq(warehouseLocations.parentLocationId, id),
    });

    if (childLocations.length > 0) {
      throw new BadRequestException(
        'Cannot delete location with child locations'
      );
    }

    // Check if location has active stock (this would be implemented based on stock levels)
    // For now, we'll just delete the location
    await this.db
      .delete(warehouseLocations)
      .where(eq(warehouseLocations.id, id));
  }

  // Warehouse Transfer Management
  async createWarehouseTransfer(
    createTransferDto: CreateWarehouseTransferDto,
    userId: string
  ): Promise<WarehouseTransfer> {
    // Check if transfer number already exists for the company
    const existingTransfer = await this.db.query.warehouseTransfers.findFirst({
      where: and(
        eq(warehouseTransfers.transferNumber, createTransferDto.transferNumber),
        eq(warehouseTransfers.companyId, createTransferDto.companyId)
      ),
    });

    if (existingTransfer) {
      throw new ConflictException(
        `Transfer with number '${createTransferDto.transferNumber}' already exists`
      );
    }

    // Validate warehouses exist
    const [fromWarehouse, toWarehouse] = await Promise.all([
      this.db.query.warehouses.findFirst({
        where: and(
          eq(warehouses.id, createTransferDto.fromWarehouseId),
          eq(warehouses.companyId, createTransferDto.companyId)
        ),
      }),
      this.db.query.warehouses.findFirst({
        where: and(
          eq(warehouses.id, createTransferDto.toWarehouseId),
          eq(warehouses.companyId, createTransferDto.companyId)
        ),
      }),
    ]);

    if (!fromWarehouse || !toWarehouse) {
      throw new NotFoundException('One or both warehouses not found');
    }

    if (createTransferDto.fromWarehouseId === createTransferDto.toWarehouseId) {
      throw new BadRequestException(
        'Source and destination warehouses cannot be the same'
      );
    }

    // Create transfer
    const { items, ...transferData } = createTransferDto;
    const [newTransfer] = await this.db
      .insert(warehouseTransfers)
      .values({
        ...transferData,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    // Create transfer items
    if (items && items.length > 0) {
      const transferItemsData = items.map(item => ({
        ...item,
        transferId: newTransfer.id,
        totalCost: item.unitCost * item.requestedQty,
      }));

      await this.db.insert(warehouseTransferItems).values(transferItemsData);
    }

    return newTransfer;
  }

  async updateWarehouseTransfer(
    id: string,
    updateTransferDto: UpdateWarehouseTransferDto,
    userId: string
  ): Promise<WarehouseTransfer> {
    const existingTransfer = await this.db.query.warehouseTransfers.findFirst({
      where: eq(warehouseTransfers.id, id),
    });

    if (!existingTransfer) {
      throw new NotFoundException('Transfer not found');
    }

    const [updatedTransfer] = await this.db
      .update(warehouseTransfers)
      .set({
        ...updateTransferDto,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(warehouseTransfers.id, id))
      .returning();

    return updatedTransfer;
  }

  async getWarehouseTransfer(id: string): Promise<
    WarehouseTransfer & {
      transferItems?: (WarehouseTransferItem & { item: any })[];
    }
  > {
    const transfer = await this.db.query.warehouseTransfers.findFirst({
      where: eq(warehouseTransfers.id, id),
      with: {
        fromWarehouse: true,
        toWarehouse: true,
        fromLocation: true,
        toLocation: true,
        transferItems: {
          with: {
            item: true,
          },
        },
      },
    });

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    return transfer;
  }

  async getWarehouseTransfers(
    filterDto: TransferFilterDto,
    companyId: string
  ): Promise<{
    transfers: WarehouseTransfer[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'transferDate',
      sortOrder = 'desc',
      ...filters
    } = filterDto;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(warehouseTransfers.companyId, companyId)];

    if (filters.search) {
      whereConditions.push(
        or(
          ilike(warehouseTransfers.transferNumber, `%${filters.search}%`),
          ilike(warehouseTransfers.trackingNumber, `%${filters.search}%`),
          ilike(warehouseTransfers.notes, `%${filters.search}%`)
        )
      );
    }

    if (filters.fromWarehouseId) {
      whereConditions.push(
        eq(warehouseTransfers.fromWarehouseId, filters.fromWarehouseId)
      );
    }

    if (filters.toWarehouseId) {
      whereConditions.push(
        eq(warehouseTransfers.toWarehouseId, filters.toWarehouseId)
      );
    }

    if (filters.status) {
      whereConditions.push(eq(warehouseTransfers.status, filters.status));
    }

    if (filters.fromDate && filters.toDate) {
      whereConditions.push(
        between(
          warehouseTransfers.transferDate,
          new Date(filters.fromDate),
          new Date(filters.toDate)
        )
      );
    } else if (filters.fromDate) {
      whereConditions.push(
        gte(warehouseTransfers.transferDate, new Date(filters.fromDate))
      );
    } else if (filters.toDate) {
      whereConditions.push(
        lte(warehouseTransfers.transferDate, new Date(filters.toDate))
      );
    }

    const whereClause = and(...whereConditions);

    // Get total count
    const [{ count: totalCount }] = await this.db
      .select({ count: count() })
      .from(warehouseTransfers)
      .where(whereClause);

    // Get transfers with pagination and sorting
    const orderBy =
      sortOrder === 'desc'
        ? desc(warehouseTransfers[sortBy])
        : asc(warehouseTransfers[sortBy]);

    const transfersList = await this.db.query.warehouseTransfers.findMany({
      where: whereClause,
      with: {
        fromWarehouse: true,
        toWarehouse: true,
        transferItems: {
          with: {
            item: true,
          },
        },
      },
      orderBy,
      limit,
      offset,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return {
      transfers: transfersList,
      total: totalCount,
      page,
      limit,
      totalPages,
    };
  }

  async updateTransferItem(
    transferId: string,
    itemId: string,
    updateItemDto: UpdateTransferItemDto
  ): Promise<WarehouseTransferItem> {
    const existingItem = await this.db.query.warehouseTransferItems.findFirst({
      where: and(
        eq(warehouseTransferItems.transferId, transferId),
        eq(warehouseTransferItems.itemId, itemId)
      ),
    });

    if (!existingItem) {
      throw new NotFoundException('Transfer item not found');
    }

    const [updatedItem] = await this.db
      .update(warehouseTransferItems)
      .set({
        ...updateItemDto,
        updatedAt: new Date(),
      })
      .where(eq(warehouseTransferItems.id, existingItem.id))
      .returning();

    return updatedItem;
  }

  // Utility Methods
  async getWarehouseByCode(
    warehouseCode: string,
    companyId: string
  ): Promise<Warehouse | null> {
    return this.db.query.warehouses.findFirst({
      where: and(
        eq(warehouses.warehouseCode, warehouseCode),
        eq(warehouses.companyId, companyId)
      ),
    });
  }

  async getLocationByBarcode(
    barcode: string,
    warehouseId?: string
  ): Promise<WarehouseLocation | null> {
    const whereConditions = [eq(warehouseLocations.barcode, barcode)];

    if (warehouseId) {
      whereConditions.push(eq(warehouseLocations.warehouseId, warehouseId));
    }

    return this.db.query.warehouseLocations.findFirst({
      where: and(...whereConditions),
      with: {
        warehouse: true,
      },
    });
  }

  async searchWarehouses(
    searchTerm: string,
    companyId: string,
    limit: number = 10
  ): Promise<Warehouse[]> {
    return this.db.query.warehouses.findMany({
      where: and(
        eq(warehouses.companyId, companyId),
        eq(warehouses.isActive, true),
        or(
          ilike(warehouses.warehouseCode, `%${searchTerm}%`),
          ilike(warehouses.warehouseName, `%${searchTerm}%`)
        )
      ),
      limit,
      orderBy: asc(warehouses.warehouseName),
    });
  }

  async searchLocations(
    searchTerm: string,
    warehouseId?: string,
    limit: number = 10
  ): Promise<WarehouseLocation[]> {
    const whereConditions = [
      eq(warehouseLocations.isActive, true),
      or(
        ilike(warehouseLocations.locationCode, `%${searchTerm}%`),
        ilike(warehouseLocations.locationName, `%${searchTerm}%`),
        ilike(warehouseLocations.barcode, `%${searchTerm}%`)
      ),
    ];

    if (warehouseId) {
      whereConditions.push(eq(warehouseLocations.warehouseId, warehouseId));
    }

    return this.db.query.warehouseLocations.findMany({
      where: and(...whereConditions),
      with: {
        warehouse: true,
      },
      limit,
      orderBy: asc(warehouseLocations.locationName),
    });
  }

  // Performance Analytics
  async getWarehousePerformanceMetrics(
    warehouseId: string,
    periodType: string = 'Monthly',
    limit: number = 12
  ): Promise<WarehousePerformanceMetric[]> {
    return this.db.query.warehousePerformanceMetrics.findMany({
      where: and(
        eq(warehousePerformanceMetrics.warehouseId, warehouseId),
        eq(warehousePerformanceMetrics.periodType, periodType)
      ),
      orderBy: desc(warehousePerformanceMetrics.metricDate),
      limit,
    });
  }

  async calculateCapacityUtilization(
    warehouseId: string
  ): Promise<{
    utilizationPercentage: number;
    usedCapacity: number;
    totalCapacity: number;
  }> {
    const warehouse = await this.db.query.warehouses.findFirst({
      where: eq(warehouses.id, warehouseId),
    });

    if (!warehouse || !warehouse.totalCapacity) {
      return { utilizationPercentage: 0, usedCapacity: 0, totalCapacity: 0 };
    }

    const usedCapacity = Number(warehouse.usedCapacity) || 0;
    const totalCapacity = Number(warehouse.totalCapacity) || 0;
    const utilizationPercentage =
      totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;

    return {
      utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
      usedCapacity,
      totalCapacity,
    };
  }
}
