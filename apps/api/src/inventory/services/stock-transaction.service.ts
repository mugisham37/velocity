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
  type StockLedgerEntry,
  type StockLevel,
  type StockReconciliation,
  type StockReservation,
} from '../../database';
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
  ilike,
  or,
  sql,
} from '../../database';
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
  UpdateStockReconciliationDto,
  UpdateStockReservationDto,
  StockEntryType,
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
    const existingEntry = await this.db.db
      .select()
      .from(stockEntries)
      .where(
        and(
          eq(stockEntries.entryNumber, createStockEntryDto.entryNumber),
          eq(stockEntries.companyId, createStockEntryDto.companyId)
        )
      )
      .limit(1)
      .then(rows => rows[0] || null);

    if (existingEntry) {
      throw new ConflictException(
        `Stock entry with number '${createStockEntryDto.entryNumber}' already exists`
      );
    }

    // Validate warehouses exist
    const warehouseValidations = [
      this.db.db
        .select()
        .from(warehouses)
        .where(
          and(
            eq(warehouses.id, createStockEntryDto.warehouseId),
            eq(warehouses.companyId, createStockEntryDto.companyId)
          )
        )
        .limit(1)
        .then(rows => rows[0] || null),
    ];

    if (createStockEntryDto.fromWarehouseId) {
      warehouseValidations.push(
        this.db.db
          .select()
          .from(warehouses)
          .where(
            and(
              eq(warehouses.id, createStockEntryDto.fromWarehouseId),
              eq(warehouses.companyId, createStockEntryDto.companyId)
            )
          )
          .limit(1)
          .then(rows => rows[0] || null)
      );
    }

    if (createStockEntryDto.toWarehouseId) {
      warehouseValidations.push(
        this.db.db
          .select()
          .from(warehouses)
          .where(
            and(
              eq(warehouses.id, createStockEntryDto.toWarehouseId),
              eq(warehouses.companyId, createStockEntryDto.companyId)
            )
          )
          .limit(1)
          .then(rows => rows[0] || null)
      );
    }

    const warehouseResults = await Promise.all(warehouseValidations);
    if (warehouseResults.some(result => !result)) {
      throw new NotFoundException('One or more warehouses not found');
    }

    // Validate items exist
    const itemIds = createStockEntryDto.items.map(item => item.itemId);
    const itemsExist = await this.db.db
      .select()
      .from(items)
      .where(
        and(
          sql`${items.id} = ANY(${itemIds})`,
          eq(items.companyId, createStockEntryDto.companyId)
        )
      );

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
    const [newEntry] = await this.db.db
      .insert(stockEntries)
      .values({
        ...entryData,
        transactionDate: new Date(entryData.transactionDate),
        postingDate: new Date(entryData.postingDate),
        totalValue: totalValue.toString(),
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    if (!newEntry) {
      throw new Error('Failed to create stock entry');
    }

    // Create stock entry items
    if (entryItems && entryItems.length > 0) {
      const stockEntryItemsData = await Promise.all(
        entryItems.map(async item => {
          // Get current stock level for audit trail
          const currentStock = await this.getCurrentStockLevel(
            item.itemId,
            createStockEntryDto.warehouseId,
            item.locationId,
            createStockEntryDto.companyId
          );

          const stockUomQty = item.qty * (item.conversionFactor || 1);
          const amount = (item.valuationRate || 0) * stockUomQty;

          return {
            stockEntryId: newEntry.id,
            itemId: item.itemId,
            locationId: item.locationId || null,
            fromLocationId: item.fromLocationId || null,
            toLocationId: item.toLocationId || null,
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
            qualityInspection: item.qualityInspection || null,
            inspectionRequired: item.inspectionRequired || false,
            qualityStatus: item.qualityStatus || 'Accepted',
            remarks: item.remarks || null,
            actualQtyBefore: currentStock.actualQty.toString(),
            actualQtyAfter: (
              parseFloat(currentStock.actualQty) +
              (createStockEntryDto.entryType === StockEntryType.RECEIPT ||
              createStockEntryDto.entryType === StockEntryType.ADJUSTMENT
                ? stockUomQty
                : -stockUomQty)
            ).toString(),
          };
        })
      );

      await this.db.db.insert(stockEntryItems).values(stockEntryItemsData);
    }

    return newEntry;
  }

  async updateStockEntry(
    id: string,
    updateStockEntryDto: UpdateStockEntryDto,
    userId: string
  ): Promise<StockEntry> {
    const existingEntry = await this.db.db
      .select()
      .from(stockEntries)
      .where(eq(stockEntries.id, id))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!existingEntry) {
      throw new NotFoundException('Stock entry not found');
    }

    // Check if entry is in draft status
    if (existingEntry.status !== 'Draft') {
      throw new BadRequestException('Only draft stock entries can be modified');
    }

    const updateData: any = {
      ...updateStockEntryDto,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    // Convert date strings to Date objects if present
    if (updateStockEntryDto.transactionDate) {
      updateData.transactionDate = new Date(
        updateStockEntryDto.transactionDate
      );
    }
    if (updateStockEntryDto.postingDate) {
      updateData.postingDate = new Date(updateStockEntryDto.postingDate);
    }

    const [updatedEntry] = await this.db.db
      .update(stockEntries)
      .set(updateData)
      .where(eq(stockEntries.id, id))
      .returning();

    if (!updatedEntry) {
      throw new Error('Failed to update stock entry');
    }

    return updatedEntry;
  }

  async submitStockEntry(id: string, userId: string): Promise<StockEntry> {
    const existingEntry = await this.db.db
      .select()
      .from(stockEntries)
      .where(eq(stockEntries.id, id))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!existingEntry) {
      throw new NotFoundException('Stock entry not found');
    }

    // Check if entry is in draft status
    if (existingEntry.status !== 'Draft') {
      throw new BadRequestException('Stock entry is not in draft status');
    }

    // Update status to submitted
    const [submittedEntry] = await this.db.db
      .update(stockEntries)
      .set({
        status: 'Submitted',
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(stockEntries.id, id))
      .returning();

    if (!submittedEntry) {
      throw new Error('Failed to submit stock entry');
    }

    // Create stock ledger entries and update stock levels
    await this.processStockMovement(submittedEntry);

    return submittedEntry;
  }

  async getStockEntry(id: string): Promise<StockEntry | null> {
    return this.db.db
      .select()
      .from(stockEntries)
      .where(eq(stockEntries.id, id))
      .limit(1)
      .then(rows => rows[0] || null);
  }

  async getStockEntries(
    filter: StockEntryFilterDto,
    companyId: string
  ): Promise<{ data: StockEntry[]; total: number }> {
    const whereConditions = [eq(stockEntries.companyId, companyId)];

    if (filter.search) {
      const searchCondition = or(
        ilike(stockEntries.entryNumber, `%${filter.search}%`),
        ilike(stockEntries.referenceNumber, `%${filter.search}%`)
      );
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    if (filter.entryType) {
      whereConditions.push(eq(stockEntries.entryType, filter.entryType));
    }

    if (filter.warehouseId) {
      whereConditions.push(eq(stockEntries.warehouseId, filter.warehouseId));
    }

    if (filter.status) {
      whereConditions.push(eq(stockEntries.status, filter.status));
    }

    if (filter.referenceType) {
      whereConditions.push(
        eq(stockEntries.referenceType, filter.referenceType)
      );
    }

    if (filter.fromDate && filter.toDate) {
      whereConditions.push(
        between(
          stockEntries.transactionDate,
          new Date(filter.fromDate),
          new Date(filter.toDate)
        )
      );
    }

    const whereClause = and(...whereConditions);

    // Get total count
    const countResult = await this.db.db
      .select({ count: count() })
      .from(stockEntries)
      .where(whereClause);

    const totalCount = Number(countResult[0]?.count) || 0;

    // Get paginated data
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const offset = (page - 1) * limit;

    const sortOrder = filter.sortOrder === 'asc' ? asc : desc;
    const sortColumn =
      filter.sortBy === 'createdAt'
        ? stockEntries.createdAt
        : filter.sortBy === 'transactionDate'
          ? stockEntries.transactionDate
          : filter.sortBy === 'entryNumber'
            ? stockEntries.entryNumber
            : stockEntries.createdAt;

    const entriesList = await this.db.db
      .select()
      .from(stockEntries)
      .where(whereClause)
      .orderBy(sortOrder(sortColumn))
      .limit(limit)
      .offset(offset);

    return {
      data: entriesList,
      total: totalCount,
    };
  }

  // Stock Reservation Management
  async createStockReservation(
    createReservationDto: CreateStockReservationDto,
    userId: string
  ): Promise<StockReservation> {
    // Validate item and warehouse exist
    const [item, warehouse] = await Promise.all([
      this.db.db
        .select()
        .from(items)
        .where(
          and(
            eq(items.id, createReservationDto.itemId),
            eq(items.companyId, createReservationDto.companyId)
          )
        )
        .limit(1)
        .then(rows => rows[0] || null),
      this.db.db
        .select()
        .from(warehouses)
        .where(
          and(
            eq(warehouses.id, createReservationDto.warehouseId),
            eq(warehouses.companyId, createReservationDto.companyId)
          )
        )
        .limit(1)
        .then(rows => rows[0] || null),
    ]);

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Check available stock
    const availableStock = await this.getAvailableStock(
      createReservationDto.itemId,
      createReservationDto.warehouseId,
      createReservationDto.locationId
    );

    if (availableStock.availableQty < createReservationDto.reservedQty) {
      throw new BadRequestException(
        'Insufficient stock available for reservation'
      );
    }

    // Create reservation
    const reservationData = {
      ...createReservationDto,
      reservedQty: createReservationDto.reservedQty.toString(),
      reservationDate: new Date(createReservationDto.reservationDate),
      expectedDeliveryDate: createReservationDto.expectedDeliveryDate
        ? new Date(createReservationDto.expectedDeliveryDate)
        : null,
      expiryDate: createReservationDto.expiryDate
        ? new Date(createReservationDto.expiryDate)
        : null,
      createdBy: userId,
      updatedBy: userId,
    };

    const [newReservation] = await this.db.db
      .insert(stockReservations)
      .values(reservationData)
      .returning();

    if (!newReservation) {
      throw new Error('Failed to create stock reservation');
    }

    return newReservation;
  }

  async updateStockReservation(
    id: string,
    updateReservationDto: UpdateStockReservationDto,
    userId: string
  ): Promise<StockReservation> {
    const existingReservation = await this.db.db
      .select()
      .from(stockReservations)
      .where(eq(stockReservations.id, id))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!existingReservation) {
      throw new NotFoundException('Stock reservation not found');
    }

    // Check if reservation is active
    if (existingReservation.status !== 'Active') {
      throw new BadRequestException('Only active reservations can be modified');
    }

    const updateData: any = {
      ...updateReservationDto,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    // Convert number fields to strings and dates
    if (updateReservationDto.reservedQty !== undefined) {
      updateData.reservedQty = updateReservationDto.reservedQty.toString();
    }
    if (updateReservationDto.deliveredQty !== undefined) {
      updateData.deliveredQty = updateReservationDto.deliveredQty.toString();
    }
    if (updateReservationDto.expectedDeliveryDate) {
      updateData.expectedDeliveryDate = new Date(
        updateReservationDto.expectedDeliveryDate
      );
    }
    if (updateReservationDto.expiryDate) {
      updateData.expiryDate = new Date(updateReservationDto.expiryDate);
    }

    const [updatedReservation] = await this.db.db
      .update(stockReservations)
      .set(updateData)
      .where(eq(stockReservations.id, id))
      .returning();

    if (!updatedReservation) {
      throw new Error('Failed to update stock reservation');
    }

    return updatedReservation;
  }

  async releaseStockReservation(
    id: string,
    userId: string
  ): Promise<StockReservation> {
    const existingReservation = await this.db.db
      .select()
      .from(stockReservations)
      .where(eq(stockReservations.id, id))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!existingReservation) {
      throw new NotFoundException('Stock reservation not found');
    }

    const [releasedReservation] = await this.db.db
      .update(stockReservations)
      .set({
        status: 'Cancelled',
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(stockReservations.id, id))
      .returning();

    if (!releasedReservation) {
      throw new Error('Failed to release stock reservation');
    }

    return releasedReservation;
  }

  async getStockReservations(
    filter: StockReservationFilterDto,
    companyId: string
  ): Promise<{ data: StockReservation[]; total: number }> {
    const whereConditions = [eq(stockReservations.companyId, companyId)];

    if (filter.search) {
      const searchCondition = or(
        ilike(stockReservations.referenceNumber, `%${filter.search}%`),
        ilike(stockReservations.referenceType, `%${filter.search}%`)
      );
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    if (filter.itemId) {
      whereConditions.push(eq(stockReservations.itemId, filter.itemId));
    }

    if (filter.warehouseId) {
      whereConditions.push(
        eq(stockReservations.warehouseId, filter.warehouseId)
      );
    }

    if (filter.reservationType) {
      whereConditions.push(
        eq(stockReservations.reservationType, filter.reservationType)
      );
    }

    if (filter.status) {
      whereConditions.push(eq(stockReservations.status, filter.status));
    }

    if (filter.referenceType) {
      whereConditions.push(
        eq(stockReservations.referenceType, filter.referenceType)
      );
    }

    if (filter.fromDate && filter.toDate) {
      whereConditions.push(
        between(
          stockReservations.reservationDate,
          new Date(filter.fromDate),
          new Date(filter.toDate)
        )
      );
    }

    const whereClause = and(...whereConditions);

    // Get total count
    const countResult = await this.db.db
      .select({ count: count() })
      .from(stockReservations)
      .where(whereClause);

    const totalCount = Number(countResult[0]?.count) || 0;

    // Get paginated data
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const offset = (page - 1) * limit;

    const sortOrder = filter.sortOrder === 'asc' ? asc : desc;
    const sortColumn =
      filter.sortBy === 'createdAt'
        ? stockReservations.createdAt
        : filter.sortBy === 'reservationDate'
          ? stockReservations.reservationDate
          : filter.sortBy === 'referenceNumber'
            ? stockReservations.referenceNumber
            : stockReservations.createdAt;

    const reservationsList = await this.db.db
      .select()
      .from(stockReservations)
      .where(whereClause)
      .orderBy(sortOrder(sortColumn))
      .limit(limit)
      .offset(offset);

    return {
      data: reservationsList,
      total: totalCount,
    };
  }

  // Stock Reconciliation Management
  async createStockReconciliation(
    createReconciliationDto: CreateStockReconciliationDto,
    userId: string
  ): Promise<StockReconciliation> {
    // Check if reconciliation number already exists for the company
    const existingReconciliation = await this.db.db
      .select()
      .from(stockReconciliations)
      .where(
        and(
          eq(
            stockReconciliations.reconciliationNumber,
            createReconciliationDto.reconciliationNumber
          ),
          eq(stockReconciliations.companyId, createReconciliationDto.companyId)
        )
      )
      .limit(1)
      .then(rows => rows[0] || null);

    if (existingReconciliation) {
      throw new ConflictException(
        `Stock reconciliation with number '${createReconciliationDto.reconciliationNumber}' already exists`
      );
    }

    // Validate warehouse exists
    const warehouse = await this.db.db
      .select()
      .from(warehouses)
      .where(
        and(
          eq(warehouses.id, createReconciliationDto.warehouseId),
          eq(warehouses.companyId, createReconciliationDto.companyId)
        )
      )
      .limit(1)
      .then(rows => rows[0] || null);

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Create reconciliation
    const { items: reconciliationItems, ...reconciliationData } =
      createReconciliationDto;
    const reconciliationInsertData = {
      ...reconciliationData,
      reconciliationDate: new Date(reconciliationData.reconciliationDate),
      totalItemsCount: reconciliationItems.length,
      createdBy: userId,
      updatedBy: userId,
    };

    const [newReconciliation] = await this.db.db
      .insert(stockReconciliations)
      .values(reconciliationInsertData)
      .returning();

    if (!newReconciliation) {
      throw new Error('Failed to create stock reconciliation');
    }

    // Create reconciliation items
    if (reconciliationItems && reconciliationItems.length > 0) {
      const reconciliationItemsData = reconciliationItems.map(item => {
        const varianceQty = item.physicalQty - item.systemQty;
        const varianceValue = varianceQty * (item.valuationRate || 0);

        return {
          reconciliationId: newReconciliation.id,
          itemId: item.itemId,
          locationId: item.locationId || null,
          systemQty: item.systemQty.toString(),
          physicalQty: item.physicalQty.toString(),
          varianceQty: varianceQty.toString(),
          valuationRate: (item.valuationRate || 0).toString(),
          varianceValue: varianceValue.toString(),
          serialNumbers: item.serialNumbers,
          batchNumbers: item.batchNumbers,
          varianceReason: item.varianceReason || null,
          remarks: item.remarks || null,
          countedBy: item.countedBy || null,
          countedAt: item.countedAt ? new Date(item.countedAt) : null,
        };
      });

      await this.db.db
        .insert(stockReconciliationItems)
        .values(reconciliationItemsData);
    }

    return newReconciliation;
  }

  async submitStockReconciliation(
    id: string,
    userId: string
  ): Promise<StockReconciliation> {
    const existingReconciliation = await this.db.db
      .select()
      .from(stockReconciliations)
      .where(eq(stockReconciliations.id, id))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!existingReconciliation) {
      throw new NotFoundException('Stock reconciliation not found');
    }

    // Check if reconciliation is in draft status
    if (existingReconciliation.status !== 'Draft') {
      throw new BadRequestException(
        'Stock reconciliation is not in draft status'
      );
    }

    // Get reconciliation items with variances
    const reconciliationItems = await this.db.db
      .select()
      .from(stockReconciliationItems)
      .where(eq(stockReconciliationItems.reconciliationId, id));

    const itemsWithVariance = reconciliationItems.filter(
      item => parseFloat(item.varianceQty || '0') !== 0
    );

    // Create stock adjustment entries for items with variances
    for (const item of itemsWithVariance) {
      if (parseFloat(item.varianceQty || '0') !== 0) {
        // Create adjustment entry for each item with variance
        const adjustmentEntry = await this.createStockEntry(
          {
            entryNumber: `RECON-ADJ-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            entryType: StockEntryType.ADJUSTMENT,
            referenceType: 'Stock Reconciliation',
            referenceNumber: existingReconciliation.reconciliationNumber || '',
            referenceId: existingReconciliation.id || '',
            transactionDate: new Date().toISOString(),
            postingDate: new Date().toISOString(),
            warehouseId: existingReconciliation.warehouseId || '',
            purpose: 'Stock Reconciliation Adjustment',
            remarks: `Reconciliation variance: ${item.varianceReason ? item.varianceReason : 'No reason provided'}`,
            items: [
              {
                itemId: item.itemId,
                ...(item.locationId && { locationId: item.locationId }),
                qty: Math.abs(parseFloat(item.varianceQty || '0')),
                uom: 'Nos', // This should come from item master
                valuationRate: parseFloat(item.valuationRate || '0'),
                ...(item.remarks && { remarks: item.remarks }),
              },
            ],
            companyId: existingReconciliation.companyId || '',
          },
          userId
        );

        await this.submitStockEntry(adjustmentEntry.id, userId);
      }
    }

    // Update reconciliation status
    const [submittedReconciliation] = await this.db.db
      .update(stockReconciliations)
      .set({
        status: 'Completed',
        itemsWithVariance: itemsWithVariance.length,
        totalVarianceValue: itemsWithVariance
          .reduce((sum, item) => sum + parseFloat(item.varianceValue || '0'), 0)
          .toString(),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(stockReconciliations.id, id))
      .returning();

    if (!submittedReconciliation) {
      throw new Error('Failed to submit stock reconciliation');
    }

    return submittedReconciliation;
  }

  async getStockReconciliations(
    filter: StockReconciliationFilterDto,
    companyId: string
  ): Promise<{ data: StockReconciliation[]; total: number }> {
    const whereConditions = [eq(stockReconciliations.companyId, companyId)];

    if (filter.search) {
      whereConditions.push(
        ilike(stockReconciliations.reconciliationNumber, `%${filter.search}%`)
      );
    }

    if (filter.warehouseId) {
      whereConditions.push(
        eq(stockReconciliations.warehouseId, filter.warehouseId)
      );
    }

    if (filter.status) {
      whereConditions.push(eq(stockReconciliations.status, filter.status));
    }

    if (filter.reconciliationType) {
      whereConditions.push(
        eq(stockReconciliations.reconciliationType, filter.reconciliationType)
      );
    }

    if (filter.fromDate && filter.toDate) {
      whereConditions.push(
        between(
          stockReconciliations.reconciliationDate,
          new Date(filter.fromDate),
          new Date(filter.toDate)
        )
      );
    }

    const whereClause = and(...whereConditions);

    // Get total count
    const countResult = await this.db.db
      .select({ count: count() })
      .from(stockReconciliations)
      .where(whereClause);

    const totalCount = Number(countResult[0]?.count) || 0;

    // Get paginated data
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const offset = (page - 1) * limit;

    const sortOrder = filter.sortOrder === 'asc' ? asc : desc;
    const sortColumn =
      filter.sortBy === 'createdAt'
        ? stockReconciliations.createdAt
        : filter.sortBy === 'reconciliationDate'
          ? stockReconciliations.reconciliationDate
          : filter.sortBy === 'reconciliationNumber'
            ? stockReconciliations.reconciliationNumber
            : stockReconciliations.createdAt;

    const reconciliationsList = await this.db.db
      .select()
      .from(stockReconciliations)
      .where(whereClause)
      .orderBy(sortOrder(sortColumn))
      .limit(limit)
      .offset(offset);

    return {
      data: reconciliationsList,
      total: totalCount,
    };
  }

  // Stock Level and Ledger Queries
  async getStockLevels(
    query: StockLevelQueryDto,
    companyId: string
  ): Promise<StockLevel[]> {
    const whereConditions = [eq(stockLevels.companyId, companyId)];

    if (query.itemId) {
      whereConditions.push(eq(stockLevels.itemId, query.itemId));
    }

    if (query.warehouseId) {
      whereConditions.push(eq(stockLevels.warehouseId, query.warehouseId));
    }

    const whereClause = and(...whereConditions);

    return this.db.db.select().from(stockLevels).where(whereClause);
  }

  async getStockLedger(
    query: StockLedgerQueryDto,
    companyId: string
  ): Promise<{ data: StockLedgerEntry[]; total: number }> {
    const whereConditions = [eq(stockLedgerEntries.companyId, companyId)];

    if (query.itemId) {
      whereConditions.push(eq(stockLedgerEntries.itemId, query.itemId));
    }

    if (query.warehouseId) {
      whereConditions.push(
        eq(stockLedgerEntries.warehouseId, query.warehouseId)
      );
    }

    if (query.voucherType) {
      whereConditions.push(
        eq(stockLedgerEntries.voucherType, query.voucherType)
      );
    }

    if (query.voucherNumber) {
      whereConditions.push(
        eq(stockLedgerEntries.voucherNumber, query.voucherNumber)
      );
    }

    if (query.fromDate && query.toDate) {
      whereConditions.push(
        between(
          stockLedgerEntries.postingDate,
          new Date(query.fromDate),
          new Date(query.toDate)
        )
      );
    }

    const whereClause = and(...whereConditions);

    // Get total count
    const countResult = await this.db.db
      .select({ count: count() })
      .from(stockLedgerEntries)
      .where(whereClause);

    const totalCount = Number(countResult[0]?.count) || 0;

    // Get paginated data
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    const sortOrder = query.sortOrder === 'asc' ? asc : desc;
    const sortColumn =
      query.sortBy === 'postingDate'
        ? stockLedgerEntries.postingDate
        : query.sortBy === 'voucherNumber'
          ? stockLedgerEntries.voucherNumber
          : query.sortBy === 'voucherType'
            ? stockLedgerEntries.voucherType
            : stockLedgerEntries.postingDate;

    const entriesList = await this.db.db
      .select()
      .from(stockLedgerEntries)
      .where(whereClause)
      .orderBy(sortOrder(sortColumn))
      .limit(limit)
      .offset(offset);

    return {
      data: entriesList,
      total: totalCount,
    };
  }

  async getStockReservation(id: string): Promise<StockReservation | null> {
    return this.db.db
      .select()
      .from(stockReservations)
      .where(eq(stockReservations.id, id))
      .limit(1)
      .then(rows => rows[0] || null);
  }

  async getStockReconciliation(
    id: string
  ): Promise<StockReconciliation | null> {
    return this.db.db
      .select()
      .from(stockReconciliations)
      .where(eq(stockReconciliations.id, id))
      .limit(1)
      .then(rows => rows[0] || null);
  }

  async updateStockReconciliation(
    id: string,
    updateReconciliationDto: UpdateStockReconciliationDto,
    userId: string
  ): Promise<StockReconciliation> {
    const existingReconciliation = await this.db.db
      .select()
      .from(stockReconciliations)
      .where(eq(stockReconciliations.id, id))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!existingReconciliation) {
      throw new NotFoundException('Stock reconciliation not found');
    }

    const updateData: any = {
      ...updateReconciliationDto,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    // Convert date string to Date object if present
    if (updateReconciliationDto.reconciliationDate) {
      updateData.reconciliationDate = new Date(
        updateReconciliationDto.reconciliationDate
      );
    }

    const [updatedReconciliation] = await this.db.db
      .update(stockReconciliations)
      .set(updateData)
      .where(eq(stockReconciliations.id, id))
      .returning();

    if (!updatedReconciliation) {
      throw new Error('Failed to update stock reconciliation');
    }

    return updatedReconciliation;
  }

  // Helper Methods
  async getAvailableStock(
    itemId: string,
    warehouseId: string,
    _locationId?: string
  ): Promise<{ actualQty: string; reservedQty: string; availableQty: number }> {
    const existingLevel = await this.db.db
      .select()
      .from(stockLevels)
      .where(
        and(
          eq(stockLevels.itemId, itemId),
          eq(stockLevels.warehouseId, warehouseId)
        )
      )
      .limit(1)
      .then(rows => rows[0] || null);

    if (!existingLevel) {
      return { actualQty: '0', reservedQty: '0', availableQty: 0 };
    }

    const actualQty = parseFloat(existingLevel.actualQty);
    const reservedQty = parseFloat(existingLevel.reservedQty || '0');
    const availableQty = actualQty - reservedQty;

    return {
      actualQty: existingLevel.actualQty,
      reservedQty: existingLevel.reservedQty || '0',
      availableQty,
    };
  }

  private async getCurrentStockLevel(
    itemId: string,
    warehouseId: string,
    _locationId?: string,
    companyId?: string
  ): Promise<StockLevel> {
    const existingLevel = await this.db.db
      .select()
      .from(stockLevels)
      .where(
        and(
          eq(stockLevels.itemId, itemId),
          eq(stockLevels.warehouseId, warehouseId)
        )
      )
      .limit(1)
      .then(rows => rows[0] || null);

    if (existingLevel) {
      return existingLevel;
    }

    // Create new stock level if it doesn't exist
    const [newLevel] = await this.db.db
      .insert(stockLevels)
      .values({
        itemId,
        warehouseId,
        actualQty: '0',
        reservedQty: '0',
        orderedQty: '0',
        plannedQty: '0',
        companyId: companyId || '', // This should be passed from the calling context
      })
      .returning();

    if (!newLevel) {
      throw new Error('Failed to create stock level');
    }

    return newLevel;
  }

  private async processStockMovement(stockEntry: StockEntry): Promise<void> {
    // Get stock entry items
    const entryItems = await this.db.db
      .select()
      .from(stockEntryItems)
      .where(eq(stockEntryItems.stockEntryId, stockEntry.id));

    for (const item of entryItems) {
      // Create stock ledger entry
      await this.db.db.insert(stockLedgerEntries).values({
        itemId: item.itemId,
        warehouseId: stockEntry.warehouseId,
        locationId: item.locationId,
        voucherType: 'Stock Entry',
        voucherNumber: stockEntry.entryNumber,
        voucherId: stockEntry.id,
        postingDate: stockEntry.postingDate,
        postingTime: new Date(),
        actualQty: item.stockUomQty,
        valuationRate: item.valuationRate,
        stockValue: item.amount,
        serialNo: Array.isArray(item.serialNumbers)
          ? item.serialNumbers[0]
          : null,
        batchNo: item.batchNumbers ? JSON.stringify(item.batchNumbers) : null,
        companyId: stockEntry.companyId,
      });

      // Update stock level
      await this.updateStockLevel(
        item.itemId,
        stockEntry.warehouseId,
        item.locationId,
        parseFloat(item.stockUomQty),
        stockEntry.entryType
      );
    }
  }

  private async updateStockLevel(
    itemId: string,
    warehouseId: string,
    locationId: string | null,
    qty: number,
    entryType: string
  ): Promise<void> {
    const currentLevel = await this.getCurrentStockLevel(
      itemId,
      warehouseId,
      locationId || undefined,
      '' // companyId - should be passed properly
    );

    let newQty = parseFloat(currentLevel.actualQty);

    if (entryType === 'Receipt' || entryType === 'Adjustment') {
      newQty += qty;
    } else if (entryType === 'Issue') {
      newQty -= qty;
    }

    await this.db.db
      .update(stockLevels)
      .set({
        actualQty: newQty.toString(),
        updatedAt: new Date(),
      })
      .where(eq(stockLevels.id, currentLevel.id));
  }
}

