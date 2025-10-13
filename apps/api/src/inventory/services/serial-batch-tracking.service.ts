import {
  DatabaseService,
  batchHistory,
  batchLocations,
  batchNumbers,
  items,
  productRecalls,
  qualityInspections,
  recallItems,
  serialNumberHistory,
  serialNumbers,
  type BatchLocation,
  type BatchNumber,
  type ProductRecall,
  type QualityInspection,
  type SerialNumber,
} from '../../database';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  isNull,
  lte,
  sql,
  count,
  sum,
} from '../../database';
import {
  BatchNumberFilterDto,
  BatchQualityStatus,
  CreateBatchLocationDto,
  CreateBatchNumberDto,
  CreateProductRecallDto,
  CreateQualityInspectionDto,
  CreateSerialNumberDto,
  ExpiryAlertDto,
  ProductRecallFilterDto,
  RecallAnalyticsDto,
  RecallStatus,
  SerialNumberFilterDto,
  TraceabilityQueryDto,
  TraceabilityReportDto,
  UpdateBatchNumberDto,
  UpdateProductRecallDto,
  UpdateQualityInspectionDto,
  UpdateSerialNumberDto,
} from '../dto/serial-batch-tracking.dto';

@Injectable()
export class SerialBatchTrackingService {
  private readonly logger = new Logger(SerialBatchTrackingService.name);

  constructor(private readonly db: DatabaseService) {}

  // Serial Number Management
  async createSerialNumber(
    createDto: CreateSerialNumberDto,
    companyId: string,
    userId: string
  ): Promise<SerialNumber> {
    try {
      // Check if serial number already exists for this company
      const existing = await this.db.db
        .select()
        .from(serialNumbers)
        .where(
          and(
            eq(serialNumbers.serialNumber, createDto.serialNumber),
            eq(serialNumbers.companyId, companyId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new BadRequestException(
          `Serial number ${createDto.serialNumber} already exists`
        );
      }

      // Verify item exists and has serial number tracking enabled
      const item = await this.db.db
        .select()
        .from(items)
        .where(
          and(
            eq(items.id, createDto.itemId),
            eq(items.companyId, companyId),
            eq(items.hasSerialNo, true)
          )
        )
        .limit(1);

      if (item.length === 0) {
        throw new NotFoundException(
          'Item not found or does not have serial number tracking enabled'
        );
      }

      // Convert data types for database insertion
      const insertData = {
        ...createDto,
        companyId,
        purchaseDate: createDto.purchaseDate ? new Date(createDto.purchaseDate) : null,
        purchaseRate: createDto.purchaseRate?.toString() || null,
        warrantyExpiryDate: createDto.warrantyExpiryDate ? new Date(createDto.warrantyExpiryDate) : null,
      };

      const [newSerialNumber] = await this.db.db
        .insert(serialNumbers)
        .values(insertData)
        .returning();

      if (!newSerialNumber) {
        throw new Error('Failed to create serial number');
      }

      // Create history entry
      await this.createSerialNumberHistory({
        serialNumberId: newSerialNumber.id,
        transactionType: 'Purchase',
        transactionDate: new Date(),
        toWarehouseId: createDto.warehouseId,
        newStatus: createDto.status,
        newCondition: createDto.condition,
        notes: 'Serial number created',
        createdBy: userId,
        companyId,
      });

      this.logger.log(`Created serial number: ${createDto.serialNumber}`);
      return newSerialNumber;
    } catch (error) {
      this.logger.error(
        `Failed to create serial number: ${(error as Error).message}`
      );
      throw error;
    }
  }

  async updateSerialNumber(
    id: string,
    updateDto: UpdateSerialNumberDto,
    companyId: string,
    userId: string
  ): Promise<SerialNumber> {
    try {
      const existing = await this.db.db
        .select()
        .from(serialNumbers)
        .where(
          and(eq(serialNumbers.id, id), eq(serialNumbers.companyId, companyId))
        )
        .limit(1);

      if (existing.length === 0) {
        throw new NotFoundException('Serial number not found');
      }

      if (!existing[0]) {
        throw new NotFoundException('Serial number not found');
      }

      // Convert data types for database update
      const updateData = {
        ...updateDto,
        deliveryDate: updateDto.deliveryDate ? new Date(updateDto.deliveryDate) : null,
        maintenanceDueDate: updateDto.maintenanceDueDate ? new Date(updateDto.maintenanceDueDate) : null,
        lastMaintenanceDate: updateDto.lastMaintenanceDate ? new Date(updateDto.lastMaintenanceDate) : null,
        updatedAt: new Date(),
      };

      const [updated] = await this.db.db
        .update(serialNumbers)
        .set(updateData)
        .where(eq(serialNumbers.id, id))
        .returning();

      if (!updated) {
        throw new Error('Failed to update serial number');
      }

      // Create history entry for significant changes
      if (
        updateDto.status ||
        updateDto.condition ||
        updateDto.warehouseId ||
        updateDto.customerId
      ) {
        await this.createSerialNumberHistory({
          serialNumberId: id,
          transactionType: updateDto.customerId ? 'Sale' : 'Transfer',
          transactionDate: new Date(),
          fromWarehouseId: existing[0].warehouseId,
          toWarehouseId: updateDto.warehouseId || existing[0].warehouseId,
          fromCustomerId: existing[0].customerId || undefined,
          toCustomerId: updateDto.customerId || undefined,
          previousStatus: existing[0].status,
          newStatus: updateDto.status || existing[0].status,
          previousCondition: existing[0].condition,
          newCondition: updateDto.condition || existing[0].condition,
          notes: 'Serial number updated',
          createdBy: userId,
          companyId,
        });
      }

      this.logger.log(`Updated serial number: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(
        `Failed to update serial number: ${(error as Error).message}`
      );
      throw error;
    }
  }

  async getSerialNumbers(
    filter: SerialNumberFilterDto,
    companyId: string,
    limit = 50,
    offset = 0
  ): Promise<SerialNumber[]> {
    try {
      const conditions = [eq(serialNumbers.companyId, companyId)];

      if (filter.itemId) {
        conditions.push(eq(serialNumbers.itemId, filter.itemId));
      }
      if (filter.warehouseId) {
        conditions.push(eq(serialNumbers.warehouseId, filter.warehouseId));
      }
      if (filter.customerId) {
        conditions.push(eq(serialNumbers.customerId, filter.customerId));
      }
      if (filter.status) {
        conditions.push(eq(serialNumbers.status, filter.status));
      }
      if (filter.condition) {
        conditions.push(eq(serialNumbers.condition, filter.condition));
      }
      if (filter.warrantyExpiringBefore) {
        conditions.push(
          lte(
            serialNumbers.warrantyExpiryDate,
            new Date(filter.warrantyExpiringBefore)
          )
        );
      }
      if (filter.maintenanceDueBefore) {
        conditions.push(
          lte(
            serialNumbers.maintenanceDueDate,
            new Date(filter.maintenanceDueBefore)
          )
        );
      }

      return await this.db.db
        .select()
        .from(serialNumbers)
        .where(and(...conditions))
        .orderBy(desc(serialNumbers.createdAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      this.logger.error(
        `Failed to get serial numbers: ${(error as Error).message}`
      );
      throw error;
    }
  }

  // Batch Number Management
  async createBatchNumber(
    createDto: CreateBatchNumberDto,
    companyId: string,
    userId: string
  ): Promise<BatchNumber> {
    try {
      // Check if batch number already exists for this item and company
      const existing = await this.db.db
        .select()
        .from(batchNumbers)
        .where(
          and(
            eq(batchNumbers.batchNumber, createDto.batchNumber),
            eq(batchNumbers.itemId, createDto.itemId),
            eq(batchNumbers.companyId, companyId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new BadRequestException(
          `Batch number ${createDto.batchNumber} already exists for this item`
        );
      }

      // Verify item exists and has batch tracking enabled
      const item = await this.db.db
        .select()
        .from(items)
        .where(
          and(
            eq(items.id, createDto.itemId),
            eq(items.companyId, companyId),
            eq(items.hasBatchNo, true)
          )
        )
        .limit(1);

      if (item.length === 0) {
        throw new NotFoundException(
          'Item not found or does not have batch tracking enabled'
        );
      }

      // Convert data types for database insertion
      const insertData = {
        ...createDto,
        manufacturingDate: createDto.manufacturingDate ? new Date(createDto.manufacturingDate) : null,
        expiryDate: createDto.expiryDate ? new Date(createDto.expiryDate) : null,
        totalQty: createDto.totalQty.toString(),
        availableQty: createDto.totalQty.toString(),
        companyId,
      };

      const [newBatch] = await this.db.db
        .insert(batchNumbers)
        .values(insertData)
        .returning();

      if (!newBatch) {
        throw new Error('Failed to create batch number');
      }

      // Create history entry
      await this.createBatchHistory({
        batchId: newBatch.id,
        transactionType: 'Receipt',
        transactionDate: new Date(),
        qtyChange: createDto.totalQty.toString(),
        qtyBefore: '0',
        qtyAfter: createDto.totalQty.toString(),
        reason: 'Batch created',
        notes: 'Initial batch receipt',
        createdBy: userId,
        companyId,
      });

      this.logger.log(`Created batch number: ${createDto.batchNumber}`);
      return newBatch;
    } catch (error) {
      this.logger.error(
        `Failed to create batch number: ${(error as Error).message}`
      );
      throw error;
    }
  }

  async updateBatchNumber(
    id: string,
    updateDto: UpdateBatchNumberDto,
    companyId: string,
    userId: string
  ): Promise<BatchNumber> {
    try {
      const existing = await this.db.db
        .select()
        .from(batchNumbers)
        .where(
          and(eq(batchNumbers.id, id), eq(batchNumbers.companyId, companyId))
        )
        .limit(1);

      if (existing.length === 0) {
        throw new NotFoundException('Batch number not found');
      }

      if (!existing[0]) {
        throw new NotFoundException('Batch number not found');
      }

      // Convert data types for database update
      const updateData = {
        ...updateDto,
        availableQty: updateDto.availableQty?.toString() || null,
        reservedQty: updateDto.reservedQty?.toString() || null,
        consumedQty: updateDto.consumedQty?.toString() || null,
        qualityInspectionDate: updateDto.qualityInspectionDate ? new Date(updateDto.qualityInspectionDate) : null,
        updatedAt: new Date(),
      };

      const [updated] = await this.db.db
        .update(batchNumbers)
        .set(updateData)
        .where(eq(batchNumbers.id, id))
        .returning();

      if (!updated) {
        throw new Error('Failed to update batch number');
      }

      // Create history entry for quantity changes
      if (updateDto.availableQty !== undefined) {
        const qtyChange =
          updateDto.availableQty -
          parseFloat(existing[0].availableQty?.toString() || '0');
        if (qtyChange !== 0) {
          await this.createBatchHistory({
            batchId: id,
            transactionType: qtyChange > 0 ? 'Adjustment' : 'Issue',
            transactionDate: new Date(),
            qtyChange: qtyChange.toString(),
            qtyBefore: existing[0].availableQty?.toString() || '0',
            qtyAfter: updateDto.availableQty.toString(),
            reason: 'Batch quantity adjustment',
            notes: 'Batch updated',
            createdBy: userId,
            companyId,
          });
        }
      }

      this.logger.log(`Updated batch number: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(
        `Failed to update batch number: ${(error as Error).message}`
      );
      throw error;
    }
  }

  async getBatchNumbers(
    filter: BatchNumberFilterDto,
    companyId: string,
    limit = 50,
    offset = 0
  ): Promise<BatchNumber[]> {
    try {
      const conditions = [eq(batchNumbers.companyId, companyId)];

      if (filter.itemId) {
        conditions.push(eq(batchNumbers.itemId, filter.itemId));
      }
      if (filter.qualityStatus) {
        conditions.push(eq(batchNumbers.qualityStatus, filter.qualityStatus));
      }
      if (filter.expiringBefore) {
        conditions.push(
          lte(batchNumbers.expiryDate, new Date(filter.expiringBefore))
        );
      }
      if (filter.manufacturedAfter) {
        conditions.push(
          gte(
            batchNumbers.manufacturingDate,
            new Date(filter.manufacturedAfter)
          )
        );
      }
      if (filter.manufacturedBefore) {
        conditions.push(
          lte(
            batchNumbers.manufacturingDate,
            new Date(filter.manufacturedBefore)
          )
        );
      }
      if (filter.isActive !== undefined) {
        conditions.push(eq(batchNumbers.isActive, filter.isActive));
      }
      if (filter.supplierId) {
        conditions.push(eq(batchNumbers.supplierId, filter.supplierId));
      }

      return await this.db.db
        .select()
        .from(batchNumbers)
        .where(and(...conditions))
        .orderBy(desc(batchNumbers.createdAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      this.logger.error(
        `Failed to get batch numbers: ${(error as Error).message}`
      );
      throw error;
    }
  }

  // Batch Location Management
  async createBatchLocation(
    createDto: CreateBatchLocationDto
  ): Promise<BatchLocation> {
    try {
      // Check if batch location already exists
      const existing = await this.db.db
        .select()
        .from(batchLocations)
        .where(
          and(
            eq(batchLocations.batchId, createDto.batchId),
            eq(batchLocations.warehouseId, createDto.warehouseId),
            createDto.locationId
              ? eq(batchLocations.locationId, createDto.locationId)
              : isNull(batchLocations.locationId)
          )
        )
        .limit(1);

      if (existing.length > 0 && existing[0]) {
        // Update existing location
        const [updated] = await this.db.db
          .update(batchLocations)
          .set({
            qty: sql`${batchLocations.qty} + ${createDto.qty.toString()}`,
            reservedQty: createDto.reservedQty?.toString() || existing[0].reservedQty,
            lastTransactionDate: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(batchLocations.id, existing[0].id))
          .returning();

        if (!updated) {
          throw new Error('Failed to update batch location');
        }

        return updated;
      }

      // Convert data types for database insertion
      const insertData = {
        ...createDto,
        qty: createDto.qty.toString(),
        reservedQty: createDto.reservedQty?.toString() || null,
        lastTransactionDate: new Date(),
      };

      const [newLocation] = await this.db.db
        .insert(batchLocations)
        .values(insertData)
        .returning();

      if (!newLocation) {
        throw new Error('Failed to create batch location');
      }

      this.logger.log(`Created batch location for batch: ${createDto.batchId}`);
      return newLocation;
    } catch (error) {
      this.logger.error(
        `Failed to create batch location: ${(error as Error).message}`
      );
      throw error;
    }
  }

  // Product Recall Management
  async createProductRecall(
    createDto: CreateProductRecallDto,
    companyId: string,
    userId: string
  ): Promise<ProductRecall> {
    try {
      // Check if recall number already exists
      const existing = await this.db.db
        .select()
        .from(productRecalls)
        .where(
          and(
            eq(productRecalls.recallNumber, createDto.recallNumber),
            eq(productRecalls.companyId, companyId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new BadRequestException(
          `Recall number ${createDto.recallNumber} already exists`
        );
      }

      // Convert data types for database insertion
      const insertData = {
        ...createDto,
        recallDate: new Date(createDto.recallDate),
        effectiveDate: new Date(createDto.effectiveDate),
        expiryDate: createDto.expiryDate ? new Date(createDto.expiryDate) : null,
        dateRangeFrom: createDto.dateRangeFrom ? new Date(createDto.dateRangeFrom) : null,
        dateRangeTo: createDto.dateRangeTo ? new Date(createDto.dateRangeTo) : null,
        createdBy: userId,
        companyId,
      };

      const [newRecall] = await this.db.db
        .insert(productRecalls)
        .values(insertData)
        .returning();

      if (!newRecall) {
        throw new Error('Failed to create product recall');
      }

      // Create recall items for affected items
      if (createDto.affectedItems.length > 0) {
        await this.createRecallItemsForAffectedItems(
          newRecall.id,
          createDto.affectedItems,
          createDto.affectedBatches,
          createDto.affectedSerials,
          companyId
        );
      }

      this.logger.log(`Created product recall: ${createDto.recallNumber}`);
      return newRecall;
    } catch (error) {
      this.logger.error(
        `Failed to create product recall: ${(error as Error).message}`
      );
      throw error;
    }
  }

  async updateProductRecall(
    id: string,
    updateDto: UpdateProductRecallDto,
    companyId: string,
    userId: string
  ): Promise<ProductRecall> {
    try {
      const existing = await this.db.db
        .select()
        .from(productRecalls)
        .where(
          and(
            eq(productRecalls.id, id),
            eq(productRecalls.companyId, companyId)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        throw new NotFoundException('Product recall not found');
      }

      if (!existing[0]) {
        throw new NotFoundException('Product recall not found');
      }

      // Convert data types for database update
      const updateData = {
        ...updateDto,
        recoveredQty: updateDto.recoveredQty?.toString() || null,
        destroyedQty: updateDto.destroyedQty?.toString() || null,
        returnedQty: updateDto.returnedQty?.toString() || null,
        updatedBy: userId,
        updatedAt: new Date(),
      };

      const [updated] = await this.db.db
        .update(productRecalls)
        .set(updateData)
        .where(eq(productRecalls.id, id))
        .returning();

      if (!updated) {
        throw new Error('Failed to update product recall');
      }

      this.logger.log(`Updated product recall: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(
        `Failed to update product recall: ${(error as Error).message}`
      );
      throw error;
    }
  }

  async getProductRecalls(
    filter: ProductRecallFilterDto,
    companyId: string,
    limit = 50,
    offset = 0
  ): Promise<ProductRecall[]> {
    try {
      const conditions = [eq(productRecalls.companyId, companyId)];

      if (filter.recallType) {
        conditions.push(eq(productRecalls.recallType, filter.recallType));
      }
      if (filter.severityLevel) {
        conditions.push(eq(productRecalls.severityLevel, filter.severityLevel));
      }
      if (filter.status) {
        conditions.push(eq(productRecalls.status, filter.status));
      }
      if (filter.recallDateFrom) {
        conditions.push(
          gte(productRecalls.recallDate, new Date(filter.recallDateFrom))
        );
      }
      if (filter.recallDateTo) {
        conditions.push(
          lte(productRecalls.recallDate, new Date(filter.recallDateTo))
        );
      }

      return await this.db.db
        .select()
        .from(productRecalls)
        .where(and(...conditions))
        .orderBy(desc(productRecalls.recallDate))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      this.logger.error(
        `Failed to get product recalls: ${(error as Error).message}`
      );
      throw error;
    }
  }

  // Quality Inspection Management
  async createQualityInspection(
    createDto: CreateQualityInspectionDto,
    companyId: string
  ): Promise<QualityInspection> {
    try {
      // Check if inspection number already exists
      const existing = await this.db.db
        .select()
        .from(qualityInspections)
        .where(
          and(
            eq(qualityInspections.inspectionNumber, createDto.inspectionNumber),
            eq(qualityInspections.companyId, companyId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new BadRequestException(
          `Inspection number ${createDto.inspectionNumber} already exists`
        );
      }

      // Convert data types for database insertion
      const insertData = {
        ...createDto,
        inspectionDate: new Date(createDto.inspectionDate),
        sampleSize: createDto.sampleSize?.toString() || null,
        totalQtyInspected: createDto.totalQtyInspected?.toString() || null,
        companyId,
      };

      const [newInspection] = await this.db.db
        .insert(qualityInspections)
        .values(insertData)
        .returning();

      if (!newInspection) {
        throw new Error('Failed to create quality inspection');
      }

      this.logger.log(
        `Created quality inspection: ${createDto.inspectionNumber}`
      );
      return newInspection;
    } catch (error) {
      this.logger.error(
        `Failed to create quality inspection: ${(error as Error).message}`
      );
      throw error;
    }
  }

  async updateQualityInspection(
    id: string,
    updateDto: UpdateQualityInspectionDto,
    companyId: string
  ): Promise<QualityInspection> {
    try {
      const existing = await this.db.db
        .select()
        .from(qualityInspections)
        .where(
          and(
            eq(qualityInspections.id, id),
            eq(qualityInspections.companyId, companyId)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        throw new NotFoundException('Quality inspection not found');
      }

      if (!existing[0]) {
        throw new NotFoundException('Quality inspection not found');
      }

      // Convert data types for database update
      const updateData = {
        ...updateDto,
        passedQty: updateDto.passedQty?.toString() || null,
        failedQty: updateDto.failedQty?.toString() || null,
        approvedAt: updateDto.approvedAt ? new Date(updateDto.approvedAt) : null,
        updatedAt: new Date(),
      };

      const [updated] = await this.db.db
        .update(qualityInspections)
        .set(updateData)
        .where(eq(qualityInspections.id, id))
        .returning();

      if (!updated) {
        throw new Error('Failed to update quality inspection');
      }

      // Update batch quality status if inspection is for a batch
      if (existing[0].batchId && updateDto.overallStatus) {
        await this.updateBatchQualityStatus(
          existing[0].batchId,
          updateDto.overallStatus,
          companyId
        );
      }

      this.logger.log(`Updated quality inspection: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(
        `Failed to update quality inspection: ${(error as Error).message}`
      );
      throw error;
    }
  }

  // Traceability
  async getTraceabilityReport(
    query: TraceabilityQueryDto,
    companyId: string
  ): Promise<TraceabilityReportDto> {
    try {
      const report: TraceabilityReportDto = {
        itemId: query.itemId,
        serialNumber: query.serialNumber || '',
        batchNumber: query.batchNumber || '',
        forwardTrace: [],
        backwardTrace: [],
        affectedCustomers: [],
        affectedSuppliers: [],
        relatedDocuments: [],
      };

      // Get forward trace (where the item went)
      if (query.includeForwardTrace) {
        if (query.serialNumber) {
          report.forwardTrace = await this.getSerialNumberForwardTrace(
            query.serialNumber,
            companyId,
            query.fromDate,
            query.toDate
          );
        }
        if (query.batchNumber) {
          report.forwardTrace = await this.getBatchNumberForwardTrace(
            query.batchNumber,
            query.itemId,
            companyId,
            query.fromDate,
            query.toDate
          );
        }
      }

      // Get backward trace (where the item came from)
      if (query.includeBackwardTrace) {
        if (query.serialNumber) {
          report.backwardTrace = await this.getSerialNumberBackwardTrace(
            query.serialNumber,
            companyId,
            query.fromDate,
            query.toDate
          );
        }
        if (query.batchNumber) {
          report.backwardTrace = await this.getBatchNumberBackwardTrace(
            query.batchNumber,
            query.itemId,
            companyId,
            query.fromDate,
            query.toDate
          );
        }
      }

      return report;
    } catch (error) {
      this.logger.error(
        `Failed to get traceability report: ${(error as Error).message}`
      );
      throw error;
    }
  }

  // Analytics and Reporting
  async getRecallAnalytics(companyId: string): Promise<RecallAnalyticsDto> {
    try {
      const totalRecalls = await this.db.db
        .select({ count: count() })
        .from(productRecalls)
        .where(eq(productRecalls.companyId, companyId));

      const activeRecalls = await this.db.db
        .select({ count: count() })
        .from(productRecalls)
        .where(
          and(
            eq(productRecalls.companyId, companyId),
            eq(productRecalls.status, RecallStatus.ACTIVE)
          )
        );

      const completedRecalls = await this.db.db
        .select({ count: count() })
        .from(productRecalls)
        .where(
          and(
            eq(productRecalls.companyId, companyId),
            eq(productRecalls.status, RecallStatus.COMPLETED)
          )
        );

      const totalAffectedItems = await this.db.db
        .select({ count: count() })
        .from(recallItems)
        .innerJoin(productRecalls, eq(recallItems.recallId, productRecalls.id))
        .where(eq(productRecalls.companyId, companyId));

      const recoveryStats = await this.db.db
        .select({
          totalRecovered: sum(productRecalls.recoveredQty),
          totalAffected: sum(productRecalls.totalAffectedQty),
        })
        .from(productRecalls)
        .where(eq(productRecalls.companyId, companyId));

      const totalRecoveredNum = Number(recoveryStats[0]?.totalRecovered) || 0;
      const totalAffectedNum = Number(recoveryStats[0]?.totalAffected) || 0;
      const recoveryRate =
        totalAffectedNum > 0 ? (totalRecoveredNum / totalAffectedNum) * 100 : 0;

      return {
        totalRecalls: Number(totalRecalls[0]?.count) || 0,
        activeRecalls: Number(activeRecalls[0]?.count) || 0,
        completedRecalls: Number(completedRecalls[0]?.count) || 0,
        totalAffectedItems: Number(totalAffectedItems[0]?.count) || 0,
        totalRecoveredQty: totalRecoveredNum,
        recoveryRate,
        recallsBySeverity: [],
        recallsByType: [],
      };
    } catch (error) {
      this.logger.error(
        `Failed to get recall analytics: ${(error as Error).message}`
      );
      throw error;
    }
  }

  async getExpiryAlerts(
    companyId: string,
    daysAhead = 30
  ): Promise<ExpiryAlertDto[]> {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + daysAhead);

      const expiringBatches = await this.db.db
        .select({
          batchId: batchNumbers.id,
          batchNumber: batchNumbers.batchNumber,
          itemId: batchNumbers.itemId,
          itemName: items.itemName,
          expiryDate: batchNumbers.expiryDate,
          availableQty: batchNumbers.availableQty,
        })
        .from(batchNumbers)
        .innerJoin(items, eq(batchNumbers.itemId, items.id))
        .where(
          and(
            eq(batchNumbers.companyId, companyId),
            eq(batchNumbers.isActive, true),
            lte(batchNumbers.expiryDate, expiryDate),
            gte(batchNumbers.availableQty, '0')
          )
        )
        .orderBy(asc(batchNumbers.expiryDate));

      return expiringBatches.map((batch: any) => ({
        batchId: batch.batchId,
        batchNumber: batch.batchNumber,
        itemId: batch.itemId,
        itemName: batch.itemName,
        expiryDate: batch.expiryDate?.toISOString() || '',
        daysToExpiry: Math.ceil(
          (new Date(batch.expiryDate || '').getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        ),
        availableQty: parseFloat(batch.availableQty?.toString() || '0'),
        warehouseLocations: [], // TODO: Get warehouse locations
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get expiry alerts: ${(error as Error).message}`
      );
      throw error;
    }
  }

  // Private helper methods
  private async createSerialNumberHistory(data: any): Promise<void> {
    await this.db.db.insert(serialNumberHistory).values(data);
  }

  private async createBatchHistory(data: any): Promise<void> {
    await this.db.db.insert(batchHistory).values(data);
  }

  private async createRecallItemsForAffectedItems(
    recallId: string,
    affectedItems: string[],
    affectedBatches: string[] | undefined,
    affectedSerials: string[] | undefined,
    companyId: string
  ): Promise<void> {
    // Implementation for creating recall items
    // This would involve querying serial numbers and batches for affected items
    // and creating recall item records
    // For now, this is a placeholder
    console.log('Creating recall items for:', {
      recallId,
      affectedItems,
      affectedBatches,
      affectedSerials,
      companyId,
    });
  }

  private async updateBatchQualityStatus(
    batchId: string,
    inspectionStatus: string,
    companyId: string
  ): Promise<void> {
    let qualityStatus: BatchQualityStatus;

    switch (inspectionStatus) {
      case 'Passed':
        qualityStatus = BatchQualityStatus.APPROVED;
        break;
      case 'Failed':
        qualityStatus = BatchQualityStatus.REJECTED;
        break;
      case 'Conditional':
        qualityStatus = BatchQualityStatus.QUARANTINE;
        break;
      default:
        qualityStatus = BatchQualityStatus.PENDING;
    }

    await this.db.db
      .update(batchNumbers)
      .set({
        qualityStatus,
        updatedAt: new Date(),
      })
      .where(
        and(eq(batchNumbers.id, batchId), eq(batchNumbers.companyId, companyId))
      );
  }

  private async getSerialNumberForwardTrace(
    serialNumber: string,
    companyId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<any[]> {
    // Implementation for serial number forward traceability
    // For now, return empty array as placeholder
    console.log('Getting forward trace for serial:', {
      serialNumber,
      companyId,
      fromDate,
      toDate,
    });
    return [];
  }

  private async getBatchNumberForwardTrace(
    batchNumber: string,
    itemId: string,
    companyId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<any[]> {
    // Implementation for batch number forward traceability
    // For now, return empty array as placeholder
    console.log('Getting forward trace for batch:', {
      batchNumber,
      itemId,
      companyId,
      fromDate,
      toDate,
    });
    return [];
  }

  private async getSerialNumberBackwardTrace(
    serialNumber: string,
    companyId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<any[]> {
    // Implementation for serial number backward traceability
    // For now, return empty array as placeholder
    console.log('Getting backward trace for serial:', {
      serialNumber,
      companyId,
      fromDate,
      toDate,
    });
    return [];
  }

  private async getBatchNumberBackwardTrace(
    batchNumber: string,
    itemId: string,
    companyId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<any[]> {
    // Implementation for batch number backward traceability
    // For now, return empty array as placeholder
    console.log('Getting backward trace for batch:', {
      batchNumber,
      itemId,
      companyId,
      fromDate,
      toDate,
    });
    return [];
  }
}

