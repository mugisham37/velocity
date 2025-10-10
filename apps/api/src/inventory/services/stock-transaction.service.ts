import {
  DatabaseService,
  items,
  stockEntries,
  stockEntryItems,
  stockLedgerEntries,
  stockLevels,
  stockReconciliationItems,
  stockReconciliations,
  stockReservations,
  warehouses,
  type StockEntry,
  type StockEntryItem,
  type StockLedgerEntry,
  type StockLevel,
  type StockReconciliation,
  type StockReservation,
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
} from '@kiro/database';
import {
  CreateStockEntryDto,
  CreateStockReconciliationDto,
  CreateStockReservationDto,
  StockEntryFilterDto,
  StockLedgerQueryDto,
  StockLevelQueryDto,
  StockReconciliationFilterDto,
  StockReservationFilterDto,
  UpdateStockEntryDto,
  UpdateStockReservationDto,
} from '../dto/stock-transaction.dto';

@Injectable()
export class StockTransactionService {
  constructor(private readonly db: DatabaseService) {}

  // Stock Entry Management
  async createStockEntry(
    createStockEntryDto: CreateStockEntryDto,
    userId: string
  ): Promise<StockEntry> {
    // Check if entry number already exists for the company
    const existingEntry = await this.db.query.stockEntries.findFirst({
      where: and(
        eq(stockEntries.entryNumber, createStockEntryDto.entryNumber),
        eq(stockEntries.companyId, createStockEntryDto.companyId)
      ),
    });

    if (existingEntry) {
      throw new ConflictException(
        `Stock entry with number '${createStockEntryDto.entryNumber}' already exists`
      );
    }

    // Validate warehouses exist
    const warehouseValidations = [
      this.db.query.warehouses.findFirst({
        where: and(
          eq(warehouses.id, createStockEntryDto.warehouseId),
          eq(warehouses.companyId, createStockEntryDto.companyId)
        ),
      }),
    ];

    if (createStockEntryDto.fromWarehouseId) {
      warehouseValidations.push(
        this.db.query.warehouses.findFirst({
          where: and(
            eq(warehouses.id, createStockEntryDto.fromWarehouseId),
            eq(warehouses.companyId, createStockEntryDto.companyId)
          ),
        })
      );
    }

    if (createStockEntryDto.toWarehouseId) {
      warehouseValidations.push(
        this.db.query.warehouses.findFirst({
          where: and(
            eq(warehouses.id, createStockEntryDto.toWarehouseId),
            eq(warehouses.companyId, createStockEntryDto.companyId)
          ),
        })
      );
    }

    const warehouseResults = await Promise.all(warehouseValidations);
    if (warehouseResults.some(result => !result)) {
      throw new NotFoundException('One or more warehouses not found');
    }

    // Validate items exist
    const itemIds = createStockEntryDto.items.map(item => item.itemId);
    const itemsExist = await this.db.query.items.findMany({
      where: and(
        sql`${items.id} = ANY(${itemIds})`,
        eq(items.companyId, createStockEntryDto.companyId)
      ),
    });

    if (itemsExist.length !== itemIds.length) {
      throw new NotFoundException('One or more items not found');
    }

    // Calculate total value
    const totalValue = createStockEntryDto.items.reduce((sum, item) => {
      const amount = (item.valuationRate || 0) * item.qty;
      return sum + amount;
    }, 0);

    // Create stock entry
    const { items: entryItems, ...entryData } = createStockEntryDto;
    const [newEntry] = await this.db
      .insert(stockEntries)
      .values({
        ...entryData,
        totalValue: totalValue.toString(),
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    // Create stock entry items
    if (entryItems && entryItems.length > 0) {
      const stockEntryItemsData = await Promise.all(
        entryItems.map(async item => {
          // Get current stock level for audit trail
          const currentStock = await this.getCurrentStockLevel(
            item.itemId,
            createStockEntryDto.warehouseId,
            item.locationId
          );

          const stockUomQty = item.qty * (item.conversionFactor || 1);
          const amount = (item.valuationRate || 0) * stockUomQty;

          return {
            stockEntryId: newEntry.id,
            itemId: item.itemId,
            locationId: item.locationId,
            fromLocationId: item.fromLocationId,
            toLocationId: item.toLocationId,
            qty: item.qty.toString(),
            uom: item.uom,
            conversionFactor: (item.conversionFactor || 1).toString(),
            stockUomQty: stockUomQty.toString(),
            valuationRate: (item.valuationRate || 0).toString(),
            amount: amount.toString(),
            serialNumbers: item.serialNumbers,
            batchNumbers: item.batchNumbers,
            hasSerialNo: Boolean(item.serialNumbers?.length),
            hasBatchNo: Boolean(item.batchNumbers),
            qualityInspection: item.qualityInspection,
            inspectionRequired: item.inspectionRequired || false,
            qualityStatus: item.qualityStatus || 'Accepted',
            remarks: item.remarks,
            actualQtyBefore: currentStock.actualQty.toString(),
            actualQtyAfter: (
              parseFloat(currentStock.actualQty) +
              (createStockEntryDto.entryType === 'Receipt' ||
              createStockEntryDto.entryType === 'Adjustment'
                ? stockUomQty
                : -stockUomQty)
            ).toString(),
          };
        })
      );

      await this.db.insert(stockEntryItems).values(stockEntryItemsData);
    }

    return newEntry;
  }

  async updateStockEntry(
    id: string,
    updateStockEntryDto: UpdateStockEntryDto,
    userId: string
  ): Promise<StockEntry> {
    const existingEntry = await this.db.query.stockEntries.findFirst({
      where: eq(stockEntries.id, id),
    });

    if (!existingEntry) {
      throw new NotFoundException('Stock entry not found');
    }

    // Check if entry is in draft status
    if (existingEntry.status !== 'Draft') {
      throw new BadRequestException('Only draft stock entries can be modified');
    }

    const [updatedEntry] = await this.db
      .update(stockEntries)
      .set({
        ...updateStockEntryDto,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(stockEntries.id, id))
      .returning();

    return updatedEntry;
  }

  async submitStockEntry(id: string, userId: string): Promise<StockEntry> {
    const existingEntry = await this.db.query.stockEntries.findFirst({
      where: eq(stockEntries.id, id),
      with: {
        stockEntryItems: {
          with: {
            item: true,
          },
        },
      },
    });

    if (!existingEntry) {
      throw new NotFoundException('Stock entry not found');
    }

    if (existingEntry.status !== 'Draft') {
      throw new BadRequestException('Stock entry is not in draft status');
    }

    // Update stock levels and create ledger entries
    await this.processStockTransaction(existingEntry);

    // Update entry status
    const [updatedEntry] = await this.db
      .update(stockEntries)
      .set({
        status: 'Submitted',
        docStatus: 'Submitted',
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(stockEntries.id, id))
      .returning();

    return updatedEntry;
  }

  async getStockEntry(id: string): Promise<
    StockEntry & {
      stockEntryItems?: (StockEntryItem & { item: any; location?: any })[];
    }
  > {
    const entry = await this.db.query.stockEntries.findFirst({
      where: eq(stockEntries.id, id),
      with: {
        warehouse: true,
        fromWarehouse: true,
        toWarehouse: true,
        stockEntryItems: {
          with: {
            item: true,
            location: true,
            fromLocation: true,
            toLocation: true,
          },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException('Stock entry not found');
    }

    return entry;
  }

  async getStockEntries(
    filterDto: StockEntryFilterDto,
    companyId: string
  ): Promise<{
    entries: StockEntry[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'transactionDate',
      sortOrder = 'desc',
      ...filters
    } = filterDto;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(stockEntries.companyId, companyId)];

    if (filters.search) {
      whereConditions.push(
        or(
          ilike(stockEntries.entryNumber, `%${filters.search}%`),
          ilike(stockEntries.referenceNumber, `%${filters.search}%`),
          ilike(stockEntries.remarks, `%${filters.search}%`)
        )
      );
    }

    if (filters.entryType) {
      whereConditions.push(eq(stockEntries.entryType, filters.entryType));
    }

    if (filters.warehouseId) {
      whereConditions.push(eq(stockEntries.warehouseId, filters.warehouseId));
    }

    if (filters.status) {
      whereConditions.push(eq(stockEntries.status, filters.status));
    }

    if (filters.referenceType) {
      whereConditions.push(
        eq(stockEntries.referenceType, filters.referenceType)
      );
    }

    if (filters.fromDate && filters.toDate) {
      whereConditions.push(
        between(
          stockEntries.transactionDate,
          new Date(filters.fromDate),
          new Date(filters.toDate)
        )
      );
    } else if (filters.fromDate) {
      whereConditions.push(
        gte(stockEntries.transactionDate, new Date(filters.fromDate))
      );
    } else if (filters.toDate) {
      whereConditions.push(
        lte(stockEntries.transactionDate, new Date(filters.toDate))
      );
    }

    const whereClause = and(...whereConditions);

    // Get total count
    const [{ count: totalCount }] = await this.db
      .select({ count: count() })
      .from(stockEntries)
      .where(whereClause);

    // Get entries with pagination and sorting
    const orderBy =
      sortOrder === 'desc'
        ? desc(stockEntries[sortBy])
        : asc(stockEntries[sortBy]);

    const entriesList = await this.db.query.stockEntries.findMany({
      where: whereClause,
      with: {
        warehouse: true,
        fromWarehouse: true,
        toWarehouse: true,
        stockEntryItems: {
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
      entries: entriesList,
      total: totalCount,
      page,
      limit,
      totalPages,
    };
  }

  // Stock Reservation Management
  async createStockReservation(
    createReservationDto: CreateStockReservationDto,
    userId: string
  ): Promise<StockReservation> {
    // Validate item and warehouse exist
    const [item, warehouse] = await Promise.all([
      this.db.query.items.findFirst({
        where: and(
          eq(items.id, createReservationDto.itemId),
          eq(items.companyId, createReservationDto.companyId)
        ),
      }),
      this.db.query.warehouses.findFirst({
        where: and(
          eq(warehouses.id, createReservationDto.warehouseId),
          eq(warehouses.companyId, createReservationDto.companyId)
        ),
      }),
    ]);

    if (!item || !warehouse) {
      throw new NotFoundException('Item or warehouse not found');
    }

    // Check available stock
    const availableStock = await this.getAvailableStock(
      createReservationDto.itemId,
      createReservationDto.warehouseId,
      createReservationDto.locationId
    );

    if (availableStock < createReservationDto.reservedQty) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${availableStock}, Requested: ${createReservationDto.reservedQty}`
      );
    }

    const [newReservation] = await this.db
      .insert(stockReservations)
      .values({
        ...createReservationDto,
        reservedQty: createReservationDto.reservedQty.toString(),
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    // Update stock levels
    await this.updateStockLevelReservation(
      createReservationDto.itemId,
      createReservationDto.warehouseId,
      createReservationDto.reservedQty,
      'add'
    );

    return newReservation;
  }

  async updateStockReservation(
    id: string,
    updateReservationDto: UpdateStockReservationDto,
    userId: string
  ): Promise<StockReservation> {
    const existingReservation = await this.db.query.stockReservations.findFirst(
      {
        where: eq(stockReservations.id, id),
      }
    );

    if (!existingReservation) {
      throw new NotFoundException('Stock reservation not found');
    }

    // Handle quantity changes
    if (
      updateReservationDto.reservedQty &&
      updateReservationDto.reservedQty !==
        parseFloat(existingReservation.reservedQty)
    ) {
      const qtyDifference =
        updateReservationDto.reservedQty -
        parseFloat(existingReservation.reservedQty);

      await this.updateStockLevelReservation(
        existingReservation.itemId,
        existingReservation.warehouseId,
        Math.abs(qtyDifference),
        qtyDifference > 0 ? 'add' : 'remove'
      );
    }

    const [updatedReservation] = await this.db
      .update(stockReservations)
      .set({
        ...updateReservationDto,
        reservedQty: updateReservationDto.reservedQty?.toString(),
        deliveredQty: updateReservationDto.deliveredQty?.toString(),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(stockReservations.id, id))
      .returning();

    return updatedReservation;
  }

  async releaseStockReservation(
    id: string,
    userId: string
  ): Promise<StockReservation> {
    const existingReservation = await this.db.query.stockReservations.findFirst(
      {
        where: eq(stockReservations.id, id),
      }
    );

    if (!existingReservation) {
      throw new NotFoundException('Stock reservation not found');
    }

    if (existingReservation.status !== 'Active') {
      throw new BadRequestException('Reservation is not active');
    }

    // Release reserved quantity
    const remainingQty =
      parseFloat(existingReservation.reservedQty) -
      parseFloat(existingReservation.deliveredQty);

    if (remainingQty > 0) {
      await this.updateStockLevelReservation(
        existingReservation.itemId,
        existingReservation.warehouseId,
        remainingQty,
        'remove'
      );
    }

    const [updatedReservation] = await this.db
      .update(stockReservations)
      .set({
        status: 'Cancelled',
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(stockReservations.id, id))
      .returning();

    return updatedReservation;
  }

  async getStockReservations(
    filterDto: StockReservationFilterDto,
    companyId: string
  ): Promise<{
    reservations: StockReservation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'reservationDate',
      sortOrder = 'desc',
      ...filters
    } = filterDto;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(stockReservations.companyId, companyId)];

    if (filters.search) {
      whereConditions.push(
        or(
          ilike(stockReservations.referenceNumber, `%${filters.search}%`),
          ilike(stockReservations.remarks, `%${filters.search}%`)
        )
      );
    }

    if (filters.itemId) {
      whereConditions.push(eq(stockReservations.itemId, filters.itemId));
    }

    if (filters.warehouseId) {
      whereConditions.push(
        eq(stockReservations.warehouseId, filters.warehouseId)
      );
    }

    if (filters.reservationType) {
      whereConditions.push(
        eq(stockReservations.reservationType, filters.reservationType)
      );
    }

    if (filters.status) {
      whereConditions.push(eq(stockReservations.status, filters.status));
    }

    if (filters.referenceType) {
      whereConditions.push(
        eq(stockReservations.referenceType, filters.referenceType)
      );
    }

    if (filters.fromDate && filters.toDate) {
      whereConditions.push(
        between(
          stockReservations.reservationDate,
          new Date(filters.fromDate),
          new Date(filters.toDate)
        )
      );
    } else if (filters.fromDate) {
      whereConditions.push(
        gte(stockReservations.reservationDate, new Date(filters.fromDate))
      );
    } else if (filters.toDate) {
      whereConditions.push(
        lte(stockReservations.reservationDate, new Date(filters.toDate))
      );
    }

    const whereClause = and(...whereConditions);

    // Get total count
    const [{ count: totalCount }] = await this.db
      .select({ count: count() })
      .from(stockReservations)
      .where(whereClause);

    // Get reservations with pagination and sorting
    const orderBy =
      sortOrder === 'desc'
        ? desc(stockReservations[sortBy])
        : asc(stockReservations[sortBy]);

    const reservationsList = await this.db.query.stockReservations.findMany({
      where: whereClause,
      with: {
        item: true,
        warehouse: true,
        location: true,
      },
      orderBy,
      limit,
      offset,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return {
      reservations: reservationsList,
      total: totalCount,
      page,
      limit,
      totalPages,
    };
  }

  // Stock Reconciliation Management
  async createStockReconciliation(
    createReconciliationDto: CreateStockReconciliationDto,
    userId: string
  ): Promise<StockReconciliation> {
    // Check if reconciliation number already exists for the company
    const existingReconciliation =
      await this.db.query.stockReconciliations.findFirst({
        where: and(
          eq(
            stockReconciliations.reconciliationNumber,
            createReconciliationDto.reconciliationNumber
          ),
          eq(stockReconciliations.companyId, createReconciliationDto.companyId)
        ),
      });

    if (existingReconciliation) {
      throw new ConflictException(
        `Stock reconciliation with number '${createReconciliationDto.reconciliationNumber}' already exists`
      );
    }

    // Validate warehouse exists
    const warehouse = await this.db.query.warehouses.findFirst({
      where: and(
        eq(warehouses.id, createReconciliationDto.warehouseId),
        eq(warehouses.companyId, createReconciliationDto.companyId)
      ),
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Calculate summary statistics
    const totalItemsCount = createReconciliationDto.items.length;
    let itemsWithVariance = 0;
    let totalVarianceValue = 0;

    createReconciliationDto.items.forEach(item => {
      const varianceQty = item.physicalQty - item.systemQty;
      if (varianceQty !== 0) {
        itemsWithVariance++;
        totalVarianceValue += varianceQty * (item.valuationRate || 0);
      }
    });

    // Create reconciliation
    const { items: reconciliationItems, ...reconciliationData } =
      createReconciliationDto;
    const [newReconciliation] = await this.db
      .insert(stockReconciliations)
      .values({
        ...reconciliationData,
        totalItemsCount,
        itemsWithVariance,
        totalVarianceValue: totalVarianceValue.toString(),
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    // Create reconciliation items
    if (reconciliationItems && reconciliationItems.length > 0) {
      const reconciliationItemsData = reconciliationItems.map(item => {
        const varianceQty = item.physicalQty - item.systemQty;
        const varianceValue = varianceQty * (item.valuationRate || 0);

        return {
          reconciliationId: newReconciliation.id,
          itemId: item.itemId,
          locationId: item.locationId,
          systemQty: item.systemQty.toString(),
          physicalQty: item.physicalQty.toString(),
          varianceQty: varianceQty.toString(),
          valuationRate: (item.valuationRate || 0).toString(),
          varianceValue: varianceValue.toString(),
          serialNumbers: item.serialNumbers,
          batchNumbers: item.batchNumbers,
          varianceReason: item.varianceReason,
          remarks: item.remarks,
          countedBy: item.countedBy,
          countedAt: item.countedAt ? new Date(item.countedAt) : null,
        };
      });

      await this.db
        .insert(stockReconciliationItems)
        .values(reconciliationItemsData);
    }

    return newReconciliation;
  }

  async submitStockReconciliation(
    id: string,
    userId: string
  ): Promise<StockReconciliation> {
    const existingReconciliation =
      await this.db.query.stockReconciliations.findFirst({
        where: eq(stockReconciliations.id, id),
        with: {
          reconciliationItems: {
            with: {
              item: true,
            },
          },
        },
      });

    if (!existingReconciliation) {
      throw new NotFoundException('Stock reconciliation not found');
    }

    if (existingReconciliation.status !== 'Draft') {
      throw new BadRequestException(
        'Stock reconciliation is not in draft status'
      );
    }

    // Create stock adjustments for variances
    const adjustmentItems = existingReconciliation.reconciliationItems
      .filter(item => parseFloat(item.varianceQty) !== 0)
      .map(item => ({
        itemId: item.itemId,
        locationId: item.locationId,
        qty: Math.abs(parseFloat(item.varianceQty)),
        uom: 'Nos', // This should come from item master
        valuationRate: parseFloat(item.valuationRate),
        remarks: `Stock reconciliation adjustment - ${item.varianceReason}`,
      }));

    if (adjustmentItems.length > 0) {
      // Create stock adjustment entry
      const adjustmentEntry = await this.createStockEntry(
        {
          entryNumber: `ADJ-${existingReconciliation.reconciliationNumber}`,
          entryType: 'Adjustment',
          referenceType: 'Stock Reconciliation',
          referenceNumber: existingReconciliation.reconciliationNumber,
          referenceId: existingReconciliation.id,
          transactionDate: new Date().toISOString(),
          postingDate: new Date().toISOString(),
          warehouseId: existingReconciliation.warehouseId,
          purpose: 'Stock Reconciliation Adjustment',
          remarks: `Adjustment from reconciliation ${existingReconciliation.reconciliationNumber}`,
          items: adjustmentItems,
          companyId: existingReconciliation.companyId,
        },
        userId
      );

      // Submit the adjustment entry
      await this.submitStockEntry(adjustmentEntry.id, userId);
    }

    // Update reconciliation status
    const [updatedReconciliation] = await this.db
      .update(stockReconciliations)
      .set({
        status: 'Completed',
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(stockReconciliations.id, id))
      .returning();

    return updatedReconciliation;
  }

  async getStockReconciliations(
    filterDto: StockReconciliationFilterDto,
    companyId: string
  ): Promise<{
    reconciliations: StockReconciliation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'reconciliationDate',
      sortOrder = 'desc',
      ...filters
    } = filterDto;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(stockReconciliations.companyId, companyId)];

    if (filters.search) {
      whereConditions.push(
        or(
          ilike(
            stockReconciliations.reconciliationNumber,
            `%${filters.search}%`
          ),
          ilike(stockReconciliations.remarks, `%${filters.search}%`)
        )
      );
    }

    if (filters.warehouseId) {
      whereConditions.push(
        eq(stockReconciliations.warehouseId, filters.warehouseId)
      );
    }

    if (filters.status) {
      whereConditions.push(eq(stockReconciliations.status, filters.status));
    }

    if (filters.reconciliationType) {
      whereConditions.push(
        eq(stockReconciliations.reconciliationType, filters.reconciliationType)
      );
    }

    if (filters.fromDate && filters.toDate) {
      whereConditions.push(
        between(
          stockReconciliations.reconciliationDate,
          new Date(filters.fromDate),
          new Date(filters.toDate)
        )
      );
    } else if (filters.fromDate) {
      whereConditions.push(
        gte(stockReconciliations.reconciliationDate, new Date(filters.fromDate))
      );
    } else if (filters.toDate) {
      whereConditions.push(
        lte(stockReconciliations.reconciliationDate, new Date(filters.toDate))
      );
    }

    const whereClause = and(...whereConditions);

    // Get total count
    const [{ count: totalCount }] = await this.db
      .select({ count: count() })
      .from(stockReconciliations)
      .where(whereClause);

    // Get reconciliations with pagination and sorting
    const orderBy =
      sortOrder === 'desc'
        ? desc(stockReconciliations[sortBy])
        : asc(stockReconciliations[sortBy]);

    const reconciliationsList =
      await this.db.query.stockReconciliations.findMany({
        where: whereClause,
        with: {
          warehouse: true,
          reconciliationItems: {
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
      reconciliations: reconciliationsList,
      total: totalCount,
      page,
      limit,
      totalPages,
    };
  }

  // Stock Level Queries
  async getStockLevels(
    queryDto: StockLevelQueryDto,
    companyId: string
  ): Promise<StockLevel[]> {
    const whereConditions = [eq(stockLevels.companyId, companyId)];

    if (queryDto.itemId) {
      whereConditions.push(eq(stockLevels.itemId, queryDto.itemId));
    }

    if (queryDto.warehouseId) {
      whereConditions.push(eq(stockLevels.warehouseId, queryDto.warehouseId));
    }

    const whereClause = and(...whereConditions);

    return this.db.query.stockLevels.findMany({
      where: whereClause,
      with: {
        item: true,
        warehouse: true,
      },
      orderBy: [asc(stockLevels.itemId), asc(stockLevels.warehouseId)],
    });
  }

  async getStockLedger(
    queryDto: StockLedgerQueryDto,
    companyId: string
  ): Promise<{
    entries: StockLedgerEntry[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'postingDate',
      sortOrder = 'desc',
      ...filters
    } = queryDto;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(stockLedgerEntries.companyId, companyId)];

    if (filters.itemId) {
      whereConditions.push(eq(stockLedgerEntries.itemId, filters.itemId));
    }

    if (filters.warehouseId) {
      whereConditions.push(
        eq(stockLedgerEntries.warehouseId, filters.warehouseId)
      );
    }

    if (filters.voucherType) {
      whereConditions.push(
        eq(stockLedgerEntries.voucherType, filters.voucherType)
      );
    }

    if (filters.voucherNumber) {
      whereConditions.push(
        eq(stockLedgerEntries.voucherNumber, filters.voucherNumber)
      );
    }

    if (filters.fromDate && filters.toDate) {
      whereConditions.push(
        between(
          stockLedgerEntries.postingDate,
          new Date(filters.fromDate),
          new Date(filters.toDate)
        )
      );
    } else if (filters.fromDate) {
      whereConditions.push(
        gte(stockLedgerEntries.postingDate, new Date(filters.fromDate))
      );
    } else if (filters.toDate) {
      whereConditions.push(
        lte(stockLedgerEntries.postingDate, new Date(filters.toDate))
      );
    }

    const whereClause = and(...whereConditions);

    // Get total count
    const [{ count: totalCount }] = await this.db
      .select({ count: count() })
      .from(stockLedgerEntries)
      .where(whereClause);

    // Get entries with pagination and sorting
    const orderBy =
      sortOrder === 'desc'
        ? desc(stockLedgerEntries[sortBy])
        : asc(stockLedgerEntries[sortBy]);

    const entriesList = await this.db.query.stockLedgerEntries.findMany({
      where: whereClause,
      with: {
        item: true,
        warehouse: true,
        location: true,
      },
      orderBy,
      limit,
      offset,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return {
      entries: entriesList,
      total: totalCount,
      page,
      limit,
      totalPages,
    };
  }

  async getStockReservation(id: string): Promise<StockReservation> {
    const reservation = await this.db.query.stockReservations.findFirst({
      where: eq(stockReservations.id, id),
      with: {
        item: true,
        warehouse: true,
        location: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Stock reservation not found');
    }

    return reservation;
  }

  async getStockReconciliation(id: string): Promise<StockReconciliation> {
    const reconciliation = await this.db.query.stockReconciliations.findFirst({
      where: eq(stockReconciliations.id, id),
      with: {
        warehouse: true,
        reconciliationItems: {
          with: {
            item: true,
            location: true,
          },
        },
      },
    });

    if (!reconciliation) {
      throw new NotFoundException('Stock reconciliation not found');
    }

    return reconciliation;
  }

  async updateStockReconciliation(
    id: string,
    updateReconciliationDto: UpdateStockReconciliationDto,
    userId: string
  ): Promise<StockReconciliation> {
    const existingReconciliation =
      await this.db.query.stockReconciliations.findFirst({
        where: eq(stockReconciliations.id, id),
      });

    if (!existingReconciliation) {
      throw new NotFoundException('Stock reconciliation not found');
    }

    if (existingReconciliation.status !== 'Draft') {
      throw new BadRequestException(
        'Only draft reconciliations can be modified'
      );
    }

    const [updatedReconciliation] = await this.db
      .update(stockReconciliations)
      .set({
        ...updateReconciliationDto,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(stockReconciliations.id, id))
      .returning();

    return updatedReconciliation;
  }

  async getAvailableStock(
    itemId: string,
    warehouseId: string,
    locationId?: string
  ): Promise<number> {
    const stockLevel = await this.getCurrentStockLevel(
      itemId,
      warehouseId,
      locationId
    );
    return (
      parseFloat(stockLevel.actualQty) - parseFloat(stockLevel.reservedQty)
    );
  }

  // Utility Methods
  private async getCurrentStockLevel(
    itemId: string,
    warehouseId: string,
    locationId?: string
  ): Promise<StockLevel> {
    const existingLevel = await this.db.query.stockLevels.findFirst({
      where: and(
        eq(stockLevels.itemId, itemId),
        eq(stockLevels.warehouseId, warehouseId)
      ),
    });

    return (
      existingLevel || {
        id: '',
        itemId,
        warehouseId,
        actualQty: '0',
        reservedQty: '0',
        orderedQty: '0',
        plannedQty: '0',
        valuationRate: '0',
        stockValue: '0',
        companyId: '',
        updatedAt: new Date(),
      }
    );
  }

  private async getAvailableStock(
    itemId: string,
    warehouseId: string,
    locationId?: string
  ): Promise<number> {
    const stockLevel = await this.getCurrentStockLevel(
      itemId,
      warehouseId,
      locationId
    );
    return (
      parseFloat(stockLevel.actualQty) - parseFloat(stockLevel.reservedQty)
    );
  }

  private async updateStockLevelReservation(
    itemId: string,
    warehouseId: string,
    qty: number,
    operation: 'add' | 'remove'
  ): Promise<void> {
    const existingLevel = await this.getCurrentStockLevel(itemId, warehouseId);

    if (existingLevel.id) {
      // Update existing level
      const newReservedQty =
        parseFloat(existingLevel.reservedQty) +
        (operation === 'add' ? qty : -qty);

      await this.db
        .update(stockLevels)
        .set({
          reservedQty: Math.max(0, newReservedQty).toString(),
          updatedAt: new Date(),
        })
        .where(eq(stockLevels.id, existingLevel.id));
    }
  }

  private async processStockTransaction(
    stockEntry: StockEntry & { stockEntryItems: any[] }
  ): Promise<void> {
    // Process each item in the stock entry
    for (const item of stockEntry.stockEntryItems) {
      // Update stock levels
      await this.updateStockLevel(stockEntry, item);

      // Create stock ledger entry
      await this.createStockLedgerEntry(stockEntry, item);
    }
  }

  private async updateStockLevel(
    stockEntry: StockEntry,
    item: StockEntryItem
  ): Promise<void> {
    const existingLevel = await this.getCurrentStockLevel(
      item.itemId,
      stockEntry.warehouseId
    );

    const qtyChange = parseFloat(item.stockUomQty);
    const isInward = ['Receipt', 'Transfer'].includes(stockEntry.entryType);
    const actualQtyChange = isInward ? qtyChange : -qtyChange;

    const newActualQty = parseFloat(existingLevel.actualQty) + actualQtyChange;
    const newStockValue = newActualQty * parseFloat(item.valuationRate || '0');

    if (existingLevel.id) {
      // Update existing level
      await this.db
        .update(stockLevels)
        .set({
          actualQty: newActualQty.toString(),
          valuationRate: item.valuationRate || '0',
          stockValue: newStockValue.toString(),
          updatedAt: new Date(),
        })
        .where(eq(stockLevels.id, existingLevel.id));
    } else {
      // Create new level
      await this.db.insert(stockLevels).values({
        itemId: item.itemId,
        warehouseId: stockEntry.warehouseId,
        actualQty: newActualQty.toString(),
        reservedQty: '0',
        orderedQty: '0',
        plannedQty: '0',
        valuationRate: item.valuationRate || '0',
        stockValue: newStockValue.toString(),
        companyId: stockEntry.companyId,
      });
    }
  }

  private async createStockLedgerEntry(
    stockEntry: StockEntry,
    item: StockEntryItem
  ): Promise<void> {
    const qtyChange = parseFloat(item.stockUomQty);
    const isInward = ['Receipt', 'Transfer'].includes(stockEntry.entryType);
    const actualQty = isInward ? qtyChange : -qtyChange;

    const qtyAfterTransaction = parseFloat(item.actualQtyAfter);
    const stockValue =
      qtyAfterTransaction * parseFloat(item.valuationRate || '0');
    const stockValueDifference =
      actualQty * parseFloat(item.valuationRate || '0');

    await this.db.insert(stockLedgerEntries).values({
      itemId: item.itemId,
      warehouseId: stockEntry.warehouseId,
      locationId: item.locationId,
      voucherType: 'Stock Entry',
      voucherNumber: stockEntry.entryNumber,
      voucherId: stockEntry.id,
      postingDate: stockEntry.postingDate,
      postingTime: new Date(),
      actualQty: actualQty.toString(),
      qtyAfterTransaction: qtyAfterTransaction.toString(),
      incomingRate: item.valuationRate || '0',
      valuationRate: item.valuationRate || '0',
      stockValue: stockValue.toString(),
      stockValueDifference: stockValueDifference.toString(),
      companyId: stockEntry.companyId,
    });
  }
}
