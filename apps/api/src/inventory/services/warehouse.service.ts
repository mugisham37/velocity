import {
  DatabaseService,
  warehouseLocations,
  warehousePerformanceMetrics,
  warehouseTransferItems,
  warehouseTransfers,
  warehouses,
  type Warehouse,
  type WarehouseLocation,
  type WarehouseTransfer,
  type WarehouseTransferItem,
  type WarehousePerformanceMetric,
  // Import drizzle-orm functions from the database package to ensure consistency
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
} from '@kiro/database';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

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
    const existingWarehouse = await this.db.db
      .select()
      .from(warehouses)
      .where(
        and(
          eq(warehouses.warehouseCode, createWarehouseDto.warehouseCode),
          eq(warehouses.companyId, createWarehouseDto.companyId)
        )
      )
      .limit(1)
      .then(rows => rows[0] || null);

    if (existingWarehouse) {
      throw new ConflictException(
        `Warehouse with code '${createWarehouseDto.warehouseCode}' already exists`
      );
    }

    // Validate parent warehouse if provided
    if (createWarehouseDto.parentWarehouseId) {
      const parentWarehouse = await this.db.db
        .select()
        .from(warehouses)
        .where(
          and(
            eq(warehouses.id, createWarehouseDto.parentWarehouseId),
            eq(warehouses.companyId, createWarehouseDto.companyId)
          )
        )
        .limit(1)
        .then(rows => rows[0] || null);

      if (!parentWarehouse) {
        throw new NotFoundException('Parent warehouse not found');
      }
    }

    const [newWarehouse] = await this.db.db
      .insert(warehouses)
      .values({
        warehouseCode: createWarehouseDto.warehouseCode,
        warehouseName: createWarehouseDto.warehouseName,
        warehouseType: createWarehouseDto.warehouseType ?? null,
        parentWarehouseId: createWarehouseDto.parentWarehouseId ?? null,
        companyId: createWarehouseDto.companyId,
        address: createWarehouseDto.address ?? null,
        email: createWarehouseDto.email ?? null,
        phone: createWarehouseDto.phone ?? null,
        totalCapacity: createWarehouseDto.totalCapacity?.toString() ?? null,
        capacityUom: createWarehouseDto.capacityUom ?? null,
        allowNegativeStock: createWarehouseDto.allowNegativeStock ?? false,
        autoReorderEnabled: createWarehouseDto.autoReorderEnabled ?? false,
        barcodeRequired: createWarehouseDto.barcodeRequired ?? false,
        latitude: createWarehouseDto.latitude?.toString() ?? null,
        longitude: createWarehouseDto.longitude?.toString() ?? null,
        operatingHours: createWarehouseDto.operatingHours ?? null,
        isGroup: createWarehouseDto.isGroup ?? false,
        isActive: createWarehouseDto.isActive ?? true,
        description: createWarehouseDto.description ?? null,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    if (!newWarehouse) {
      throw new Error('Failed to create warehouse');
    }

    return newWarehouse;
  }

  async updateWarehouse(
    id: string,
    updateWarehouseDto: UpdateWarehouseDto,
    userId: string
  ): Promise<Warehouse> {
    const existingWarehouse = await this.db.db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, id))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!existingWarehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Validate parent warehouse if provided
    if (updateWarehouseDto.parentWarehouseId) {
      const parentWarehouse = await this.db.db
        .select()
        .from(warehouses)
        .where(
          and(
            eq(warehouses.id, updateWarehouseDto.parentWarehouseId),
            eq(warehouses.companyId, existingWarehouse.companyId)
          )
        )
        .limit(1)
        .then(rows => rows[0] || null);

      if (!parentWarehouse) {
        throw new NotFoundException('Parent warehouse not found');
      }

      // Prevent circular reference
      if (updateWarehouseDto.parentWarehouseId === id) {
        throw new BadRequestException('Warehouse cannot be its own parent');
      }
    }

    const updateData: any = {
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (updateWarehouseDto.warehouseName !== undefined) {
      updateData.warehouseName = updateWarehouseDto.warehouseName;
    }
    if (updateWarehouseDto.warehouseType !== undefined) {
      updateData.warehouseType = updateWarehouseDto.warehouseType;
    }
    if (updateWarehouseDto.parentWarehouseId !== undefined) {
      updateData.parentWarehouseId = updateWarehouseDto.parentWarehouseId;
    }
    if (updateWarehouseDto.address !== undefined) {
      updateData.address = updateWarehouseDto.address;
    }
    if (updateWarehouseDto.email !== undefined) {
      updateData.email = updateWarehouseDto.email;
    }
    if (updateWarehouseDto.phone !== undefined) {
      updateData.phone = updateWarehouseDto.phone;
    }
    if (updateWarehouseDto.totalCapacity !== undefined) {
      updateData.totalCapacity =
        updateWarehouseDto.totalCapacity?.toString() ?? null;
    }
    if (updateWarehouseDto.capacityUom !== undefined) {
      updateData.capacityUom = updateWarehouseDto.capacityUom;
    }
    if (updateWarehouseDto.allowNegativeStock !== undefined) {
      updateData.allowNegativeStock = updateWarehouseDto.allowNegativeStock;
    }
    if (updateWarehouseDto.autoReorderEnabled !== undefined) {
      updateData.autoReorderEnabled = updateWarehouseDto.autoReorderEnabled;
    }
    if (updateWarehouseDto.barcodeRequired !== undefined) {
      updateData.barcodeRequired = updateWarehouseDto.barcodeRequired;
    }
    if (updateWarehouseDto.latitude !== undefined) {
      updateData.latitude = updateWarehouseDto.latitude?.toString() ?? null;
    }
    if (updateWarehouseDto.longitude !== undefined) {
      updateData.longitude = updateWarehouseDto.longitude?.toString() ?? null;
    }
    if (updateWarehouseDto.operatingHours !== undefined) {
      updateData.operatingHours = updateWarehouseDto.operatingHours;
    }
    if (updateWarehouseDto.isGroup !== undefined) {
      updateData.isGroup = updateWarehouseDto.isGroup;
    }
    if (updateWarehouseDto.isActive !== undefined) {
      updateData.isActive = updateWarehouseDto.isActive;
    }
    if (updateWarehouseDto.description !== undefined) {
      updateData.description = updateWarehouseDto.description;
    }

    const [updatedWarehouse] = await this.db.db
      .update(warehouses)
      .set(updateData)
      .where(eq(warehouses.id, id))
      .returning();

    if (!updatedWarehouse) {
      throw new Error('Failed to update warehouse');
    }

    return updatedWarehouse;
  }

  async getWarehouse(id: string): Promise<
    Warehouse & {
      locations?: WarehouseLocation[];
      performanceMetrics?: WarehousePerformanceMetric[];
    }
  > {
    const warehouse = await this.db.db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, id))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Get locations separately
    const locations = await this.db.db
      .select()
      .from(warehouseLocations)
      .where(
        and(
          eq(warehouseLocations.warehouseId, id),
          eq(warehouseLocations.isActive, true)
        )
      )
      .orderBy(asc(warehouseLocations.locationName));

    // Get performance metrics separately
    const performanceMetrics = await this.db.db
      .select()
      .from(warehousePerformanceMetrics)
      .where(eq(warehousePerformanceMetrics.warehouseId, id))
      .orderBy(desc(warehousePerformanceMetrics.metricDate))
      .limit(12);

    return {
      ...warehouse,
      locations,
      performanceMetrics,
    };
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
        )!
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
    const countResult = await this.db.db
      .select({ count: count() })
      .from(warehouses)
      .where(whereClause);

    const totalCount = Number(countResult[0]?.count || 0);

    // Get warehouses with pagination and sorting
    const validSortColumns = [
      'warehouseCode',
      'warehouseName',
      'warehouseType',
      'createdAt',
      'updatedAt',
    ];
    const sortColumn = validSortColumns.includes(sortBy)
      ? warehouses[sortBy as keyof typeof warehouses]
      : warehouses.warehouseName;
    const orderBy =
      sortOrder === 'desc' ? desc(sortColumn as any) : asc(sortColumn as any);

    const warehousesList = await this.db.db
      .select()
      .from(warehouses)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get locations for each warehouse
    const warehousesWithLocations = await Promise.all(
      warehousesList.map(async warehouse => {
        const locations = await this.db.db
          .select()
          .from(warehouseLocations)
          .where(
            and(
              eq(warehouseLocations.warehouseId, warehouse.id),
              eq(warehouseLocations.isActive, true)
            )
          );
        return { ...warehouse, locations };
      })
    );

    const totalPages = Math.ceil(totalCount / limit);

    return {
      warehouses: warehousesWithLocations,
      total: totalCount,
      page,
      limit,
      totalPages,
    };
  }

  async getWarehouseHierarchy(companyId: string): Promise<Warehouse[]> {
    // Get root warehouses (no parent)
    return this.db.db
      .select()
      .from(warehouses)
      .where(
        and(
          eq(warehouses.companyId, companyId),
          sql`${warehouses.parentWarehouseId} IS NULL`
        )
      )
      .orderBy(asc(warehouses.warehouseName));
  }

  async deleteWarehouse(id: string): Promise<void> {
    const existingWarehouse = await this.db.db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, id))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!existingWarehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Check if warehouse has child warehouses
    const childWarehouses = await this.db.db
      .select()
      .from(warehouses)
      .where(eq(warehouses.parentWarehouseId, id));

    if (childWarehouses.length > 0) {
      throw new BadRequestException(
        'Cannot delete warehouse with child warehouses'
      );
    }

    // Check if warehouse has active stock (this would be implemented based on stock levels)
    // For now, we'll just delete the warehouse
    await this.db.db.delete(warehouses).where(eq(warehouses.id, id));
  }

  // Warehouse Location Management
  async createWarehouseLocation(
    createLocationDto: CreateWarehouseLocationDto,
    userId: string
  ): Promise<WarehouseLocation> {
    // Check if location code already exists in the warehouse
    const existingLocation = await this.db.db
      .select()
      .from(warehouseLocations)
      .where(
        and(
          eq(warehouseLocations.locationCode, createLocationDto.locationCode),
          eq(warehouseLocations.warehouseId, createLocationDto.warehouseId)
        )
      )
      .limit(1)
      .then(rows => rows[0] || null);

    if (existingLocation) {
      throw new ConflictException(
        `Location with code '${createLocationDto.locationCode}' already exists in this warehouse`
      );
    }

    // Validate warehouse exists
    const warehouse = await this.db.db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, createLocationDto.warehouseId))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Validate parent location if provided
    if (createLocationDto.parentLocationId) {
      const parentLocation = await this.db.db
        .select()
        .from(warehouseLocations)
        .where(
          and(
            eq(warehouseLocations.id, createLocationDto.parentLocationId),
            eq(warehouseLocations.warehouseId, createLocationDto.warehouseId)
          )
        )
        .limit(1)
        .then(rows => rows[0] || null);

      if (!parentLocation) {
        throw new NotFoundException('Parent location not found');
      }
    }

    const [newLocation] = await this.db.db
      .insert(warehouseLocations)
      .values({
        ...createLocationDto,
        capacity: createLocationDto.capacity?.toString() ?? null,
        length: createLocationDto.length?.toString() ?? null,
        width: createLocationDto.width?.toString() ?? null,
        height: createLocationDto.height?.toString() ?? null,
        minTemperature: createLocationDto.minTemperature?.toString() ?? null,
        maxTemperature: createLocationDto.maxTemperature?.toString() ?? null,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    if (!newLocation) {
      throw new Error('Failed to create warehouse location');
    }

    return newLocation;
  }

  async updateWarehouseLocation(
    id: string,
    updateLocationDto: UpdateWarehouseLocationDto,
    userId: string
  ): Promise<WarehouseLocation> {
    const existingLocation = await this.db.db
      .select()
      .from(warehouseLocations)
      .where(eq(warehouseLocations.id, id))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!existingLocation) {
      throw new NotFoundException('Location not found');
    }

    // Validate parent location if provided
    if (updateLocationDto.parentLocationId) {
      const parentLocation = await this.db.db
        .select()
        .from(warehouseLocations)
        .where(
          and(
            eq(warehouseLocations.id, updateLocationDto.parentLocationId),
            eq(warehouseLocations.warehouseId, existingLocation.warehouseId)
          )
        )
        .limit(1)
        .then(rows => rows[0] || null);

      if (!parentLocation) {
        throw new NotFoundException('Parent location not found');
      }

      // Prevent circular reference
      if (updateLocationDto.parentLocationId === id) {
        throw new BadRequestException('Location cannot be its own parent');
      }
    }

    const [updatedLocation] = await this.db.db
      .update(warehouseLocations)
      .set({
        ...updateLocationDto,
        capacity: updateLocationDto.capacity?.toString() ?? null,
        length: updateLocationDto.length?.toString() ?? null,
        width: updateLocationDto.width?.toString() ?? null,
        height: updateLocationDto.height?.toString() ?? null,
        minTemperature: updateLocationDto.minTemperature?.toString() ?? null,
        maxTemperature: updateLocationDto.maxTemperature?.toString() ?? null,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(warehouseLocations.id, id))
      .returning();

    if (!updatedLocation) {
      throw new Error('Failed to update warehouse location');
    }

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
        )!
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
    const countResult = await this.db.db
      .select({ count: count() })
      .from(warehouseLocations)
      .where(whereClause);

    const totalCount = Number(countResult[0]?.count || 0);

    // Get locations with pagination and sorting
    const validSortColumns = [
      'locationCode',
      'locationName',
      'locationType',
      'createdAt',
      'updatedAt',
    ];
    const sortColumn = validSortColumns.includes(sortBy)
      ? warehouseLocations[sortBy as keyof typeof warehouseLocations]
      : warehouseLocations.locationName;
    const orderBy =
      sortOrder === 'desc' ? desc(sortColumn as any) : asc(sortColumn as any);

    const locationsList = await this.db.db
      .select()
      .from(warehouseLocations)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

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
    return this.db.db
      .select()
      .from(warehouseLocations)
      .where(
        and(
          eq(warehouseLocations.warehouseId, warehouseId),
          sql`${warehouseLocations.parentLocationId} IS NULL`
        )
      )
      .orderBy(asc(warehouseLocations.locationName));
  }

  async deleteWarehouseLocation(id: string): Promise<void> {
    const existingLocation = await this.db.db
      .select()
      .from(warehouseLocations)
      .where(eq(warehouseLocations.id, id))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!existingLocation) {
      throw new NotFoundException('Location not found');
    }

    // Check if location has child locations
    const childLocations = await this.db.db
      .select()
      .from(warehouseLocations)
      .where(eq(warehouseLocations.parentLocationId, id));

    if (childLocations.length > 0) {
      throw new BadRequestException(
        'Cannot delete location with child locations'
      );
    }

    // Check if location has active stock (this would be implemented based on stock levels)
    // For now, we'll just delete the location
    await this.db.db
      .delete(warehouseLocations)
      .where(eq(warehouseLocations.id, id));
  }

  // Warehouse Transfer Management
  async createWarehouseTransfer(
    createTransferDto: CreateWarehouseTransferDto,
    userId: string
  ): Promise<WarehouseTransfer> {
    // Check if transfer number already exists for the company
    const existingTransfer = await this.db.db
      .select()
      .from(warehouseTransfers)
      .where(
        and(
          eq(
            warehouseTransfers.transferNumber,
            createTransferDto.transferNumber
          ),
          eq(warehouseTransfers.companyId, createTransferDto.companyId)
        )
      )
      .limit(1)
      .then(rows => rows[0] || null);

    if (existingTransfer) {
      throw new ConflictException(
        `Transfer with number '${createTransferDto.transferNumber}' already exists`
      );
    }

    // Validate warehouses exist
    const [fromWarehouse, toWarehouse] = await Promise.all([
      this.db.db
        .select()
        .from(warehouses)
        .where(
          and(
            eq(warehouses.id, createTransferDto.fromWarehouseId),
            eq(warehouses.companyId, createTransferDto.companyId)
          )
        )
        .limit(1)
        .then(rows => rows[0] || null),
      this.db.db
        .select()
        .from(warehouses)
        .where(
          and(
            eq(warehouses.id, createTransferDto.toWarehouseId),
            eq(warehouses.companyId, createTransferDto.companyId)
          )
        )
        .limit(1)
        .then(rows => rows[0] || null),
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
    const [newTransfer] = await this.db.db
      .insert(warehouseTransfers)
      .values({
        ...transferData,
        transferDate: new Date(transferData.transferDate),
        expectedDeliveryDate: transferData.expectedDeliveryDate
          ? new Date(transferData.expectedDeliveryDate)
          : null,
        shippingCost: transferData.shippingCost?.toString() ?? null,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    if (!newTransfer) {
      throw new Error('Failed to create warehouse transfer');
    }

    // Create transfer items
    if (items && items.length > 0) {
      const transferItemsData = items.map(item => ({
        ...item,
        transferId: newTransfer.id,
        requestedQty: item.requestedQty.toString(),
        unitCost: item.unitCost?.toString() ?? null,
        totalCost: ((item.unitCost || 0) * item.requestedQty).toString(),
      }));

      await this.db.db.insert(warehouseTransferItems).values(transferItemsData);
    }

    return newTransfer;
  }

  async updateWarehouseTransfer(
    id: string,
    updateTransferDto: UpdateWarehouseTransferDto,
    userId: string
  ): Promise<WarehouseTransfer> {
    const existingTransfer = await this.db.db
      .select()
      .from(warehouseTransfers)
      .where(eq(warehouseTransfers.id, id))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!existingTransfer) {
      throw new NotFoundException('Transfer not found');
    }

    const [updatedTransfer] = await this.db.db
      .update(warehouseTransfers)
      .set({
        ...updateTransferDto,
        expectedDeliveryDate: updateTransferDto.expectedDeliveryDate
          ? new Date(updateTransferDto.expectedDeliveryDate)
          : null,
        actualDeliveryDate: updateTransferDto.actualDeliveryDate
          ? new Date(updateTransferDto.actualDeliveryDate)
          : null,
        shippingCost: updateTransferDto.shippingCost?.toString() ?? null,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(warehouseTransfers.id, id))
      .returning();

    if (!updatedTransfer) {
      throw new Error('Failed to update warehouse transfer');
    }

    return updatedTransfer;
  }

  async getWarehouseTransfer(id: string): Promise<
    WarehouseTransfer & {
      transferItems?: WarehouseTransferItem[];
    }
  > {
    const transfer = await this.db.db
      .select()
      .from(warehouseTransfers)
      .where(eq(warehouseTransfers.id, id))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    // Get transfer items separately
    const transferItems = await this.db.db
      .select()
      .from(warehouseTransferItems)
      .where(eq(warehouseTransferItems.transferId, id));

    return {
      ...transfer,
      transferItems,
    };
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
        )!
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
    const countResult = await this.db.db
      .select({ count: count() })
      .from(warehouseTransfers)
      .where(whereClause);

    const totalCount = Number(countResult[0]?.count || 0);

    // Get transfers with pagination and sorting
    const validSortColumns = [
      'transferNumber',
      'transferDate',
      'status',
      'createdAt',
      'updatedAt',
    ];
    const sortColumn = validSortColumns.includes(sortBy)
      ? warehouseTransfers[sortBy as keyof typeof warehouseTransfers]
      : warehouseTransfers.transferDate;
    const orderBy =
      sortOrder === 'desc' ? desc(sortColumn as any) : asc(sortColumn as any);

    const transfersList = await this.db.db
      .select()
      .from(warehouseTransfers)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get transfer items for each transfer
    const transfersWithItems = await Promise.all(
      transfersList.map(async transfer => {
        const transferItems = await this.db.db
          .select()
          .from(warehouseTransferItems)
          .where(eq(warehouseTransferItems.transferId, transfer.id));
        return { ...transfer, transferItems };
      })
    );

    const totalPages = Math.ceil(totalCount / limit);

    return {
      transfers: transfersWithItems,
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
    const existingItem = await this.db.db
      .select()
      .from(warehouseTransferItems)
      .where(
        and(
          eq(warehouseTransferItems.transferId, transferId),
          eq(warehouseTransferItems.itemId, itemId)
        )
      )
      .limit(1)
      .then(rows => rows[0] || null);

    if (!existingItem) {
      throw new NotFoundException('Transfer item not found');
    }

    const [updatedItem] = await this.db.db
      .update(warehouseTransferItems)
      .set({
        ...updateItemDto,
        shippedQty: updateItemDto.shippedQty?.toString() ?? null,
        receivedQty: updateItemDto.receivedQty?.toString() ?? null,
        updatedAt: new Date(),
      })
      .where(eq(warehouseTransferItems.id, existingItem.id))
      .returning();

    if (!updatedItem) {
      throw new Error('Failed to update transfer item');
    }

    return updatedItem;
  }

  // Utility Methods
  async getWarehouseByCode(
    warehouseCode: string,
    companyId: string
  ): Promise<Warehouse | null> {
    return this.db.db
      .select()
      .from(warehouses)
      .where(
        and(
          eq(warehouses.warehouseCode, warehouseCode),
          eq(warehouses.companyId, companyId)
        )
      )
      .limit(1)
      .then(rows => rows[0] || null);
  }

  async getLocationByBarcode(
    barcode: string,
    warehouseId?: string
  ): Promise<WarehouseLocation | null> {
    const whereConditions = [eq(warehouseLocations.barcode, barcode)];

    if (warehouseId) {
      whereConditions.push(eq(warehouseLocations.warehouseId, warehouseId));
    }

    return this.db.db
      .select()
      .from(warehouseLocations)
      .where(and(...whereConditions))
      .limit(1)
      .then(rows => rows[0] || null);
  }

  async searchWarehouses(
    searchTerm: string,
    companyId: string,
    limit: number = 10
  ): Promise<Warehouse[]> {
    return this.db.db
      .select()
      .from(warehouses)
      .where(
        and(
          eq(warehouses.companyId, companyId),
          eq(warehouses.isActive, true),
          or(
            ilike(warehouses.warehouseCode, `%${searchTerm}%`),
            ilike(warehouses.warehouseName, `%${searchTerm}%`)
          )!
        )
      )
      .limit(limit)
      .orderBy(asc(warehouses.warehouseName));
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
      )!,
    ];

    if (warehouseId) {
      whereConditions.push(eq(warehouseLocations.warehouseId, warehouseId));
    }

    return this.db.db
      .select()
      .from(warehouseLocations)
      .where(and(...whereConditions))
      .limit(limit)
      .orderBy(asc(warehouseLocations.locationName));
  }

  // Performance Analytics
  async getWarehousePerformanceMetrics(
    warehouseId: string,
    periodType: string = 'Monthly',
    limit: number = 12
  ): Promise<WarehousePerformanceMetric[]> {
    return this.db.db
      .select()
      .from(warehousePerformanceMetrics)
      .where(
        and(
          eq(warehousePerformanceMetrics.warehouseId, warehouseId),
          eq(warehousePerformanceMetrics.periodType, periodType)
        )
      )
      .orderBy(desc(warehousePerformanceMetrics.metricDate))
      .limit(limit);
  }

  async calculateCapacityUtilization(warehouseId: string): Promise<{
    utilizationPercentage: number;
    usedCapacity: number;
    totalCapacity: number;
  }> {
    const warehouse = await this.db.db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, warehouseId))
      .limit(1)
      .then(rows => rows[0] || null);

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
