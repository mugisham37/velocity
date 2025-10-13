import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { 
  db,
  and, 
  asc, 
  desc, 
  eq, 
  like, 
  or, 
  sql,
  type Database,
  type BOM,
  type BOMAlternativeItem,
  type BOMItem,
  type BOMOperation,
  type BOMScrapItem,
  type NewBOM,
  type NewBOMItem,
  type NewBOMOperation,
  type NewBOMScrapItem,
  type NewBOMUpdateLog,
  bomAlternativeItems,
  bomItems,
  bomOperations,
  bomScrapItems,
  bomUpdateLog,
  boms,
  items,
} from '../../database';
import {
  BOMCostBreakdown,
  BOMCostCalculationDto,
  BOMExplosionDto,
  BOMExplosionItem,
  BOMExplosionResult,
  BOMFilterDto,
  CreateBOMDto,
  CreateBOMVersionDto,
  UpdateBOMDto,
} from '../dto/bom.dto';

@Injectable()
export class BOMService {
  async createBOM(createBomDto: CreateBOMDto, userId: string): Promise<BOM> {
    // Check if BOM number already exists for the company
    const existingBom = await db
      .select()
      .from(boms)
      .where(
        and(
          eq(boms.bomNo, createBomDto.bomNo),
          eq(boms.companyId, createBomDto.companyId)
        )
      )
      .limit(1);

    if (existingBom.length > 0) {
      throw new ConflictException(
        `BOM number ${createBomDto.bomNo} already exists`
      );
    }

    // Verify item exists
    const item = await db
      .select()
      .from(items)
      .where(eq(items.id, createBomDto.itemId))
      .limit(1);

    if (item.length === 0) {
      throw new NotFoundException(
        `Item with ID ${createBomDto.itemId} not found`
      );
    }

    return await db.transaction(async tx => {
      // Create the main BOM record
      const bomData: NewBOM = {
        bomNo: createBomDto.bomNo,
        itemId: createBomDto.itemId,
        companyId: createBomDto.companyId,
        version: createBomDto.version || '1.0',
        description: createBomDto.description || null,
        quantity: (createBomDto.quantity || 1).toString(),
        uom: createBomDto.uom,
        bomType: createBomDto.bomType || 'Manufacturing',
        withOperations: createBomDto.withOperations || false,
        transferMaterialAgainst:
          createBomDto.transferMaterialAgainst || 'Work Order',
        allowAlternativeItem: createBomDto.allowAlternativeItem || false,
        allowSameItemMultipleTimes:
          createBomDto.allowSameItemMultipleTimes || false,
        setRateOfSubAssemblyItemBasedOnBom:
          createBomDto.setRateOfSubAssemblyItemBasedOnBom ?? true,
        currency: createBomDto.currency || 'USD',
        inspectionRequired: createBomDto.inspectionRequired || false,
        qualityInspectionTemplate: createBomDto.qualityInspectionTemplate || null,
        projectId: createBomDto.projectId || null,
        routingId: createBomDto.routingId || null,
        createdBy: userId,
      };

      const [newBom] = await tx.insert(boms).values(bomData).returning();

      if (!newBom) {
        throw new Error('Failed to create BOM');
      }

      // Create BOM items if provided
      if (createBomDto.items && createBomDto.items.length > 0) {
        const bomItemsData: NewBOMItem[] = createBomDto.items.map(
          (item, index) => ({
            bomId: newBom.id,
            itemId: item.itemId,
            itemCode: item.itemCode,
            itemName: item.itemName,
            description: item.description || null,
            qty: item.qty.toString(),
            uom: item.uom,
            rate: (item.rate || 0).toString(),
            conversionFactor: (item.conversionFactor || 1).toString(),
            bomNo: item.bomNo || null,
            allowAlternativeItem: item.allowAlternativeItem || false,
            includeItemInManufacturing: item.includeItemInManufacturing ?? true,
            sourcedBySupplier: item.sourcedBySupplier || false,
            operationId: item.operationId || null,
            idx: index,
          })
        );

        await tx.insert(bomItems).values(bomItemsData);
      }

      // Create BOM operations if provided
      if (createBomDto.operations && createBomDto.operations.length > 0) {
        const bomOperationsData: NewBOMOperation[] =
          createBomDto.operations.map((operation, index) => ({
            bomId: newBom.id,
            operationNo: operation.operationNo,
            operationName: operation.operationName,
            description: operation.description || null,
            workstationId: operation.workstationId || null,
            workstationType: operation.workstationType || null,
            timeInMins: (operation.timeInMins || 0).toString(),
            hourRate: (operation.hourRate || 0).toString(),
            batchSize: operation.batchSize || 1,
            fixedTimeInMins: (operation.fixedTimeInMins || 0).toString(),
            setUpTime: (operation.setUpTime || 0).toString(),
            tearDownTime: (operation.tearDownTime || 0).toString(),
            sequenceId: operation.sequenceId || index,
            idx: index,
          }));

        await tx.insert(bomOperations).values(bomOperationsData);
      }

      // Create BOM scrap items if provided
      if (createBomDto.scrapItems && createBomDto.scrapItems.length > 0) {
        const bomScrapItemsData: NewBOMScrapItem[] =
          createBomDto.scrapItems.map((scrapItem, index) => ({
            bomId: newBom.id,
            itemId: scrapItem.itemId,
            itemCode: scrapItem.itemCode,
            itemName: scrapItem.itemName,
            stockQty: (scrapItem.stockQty || 0).toString(),
            rate: (scrapItem.rate || 0).toString(),
            stockUom: scrapItem.stockUom || null,
            idx: index,
          }));

        await tx.insert(bomScrapItems).values(bomScrapItemsData);
      }

      // Log the creation
      const logData: NewBOMUpdateLog = {
        bomId: newBom.id,
        updateType: 'created',
        changeDescription: 'BOM created',
        newData: bomData,
        updatedBy: userId,
      };

      await tx.insert(bomUpdateLog).values(logData);

      // Calculate and update costs
      await this.calculateAndUpdateBOMCosts(newBom.id, tx);

      return newBom;
    });
  }

  async updateBOM(
    id: string,
    updateBomDto: UpdateBOMDto,
    userId: string
  ): Promise<BOM> {
    const existingBom = await this.findBOMById(id);

    return await db.transaction(async tx => {
      // Store previous data for logging
      const previousData = { ...existingBom };

      // Update the main BOM record
      const updateData: Partial<NewBOM> = {};
      
      if (updateBomDto.description !== undefined) {
        updateData.description = updateBomDto.description || null;
      }
      if (updateBomDto.quantity !== undefined) {
        updateData.quantity = updateBomDto.quantity.toString();
      }
      if (updateBomDto.uom !== undefined) {
        updateData.uom = updateBomDto.uom;
      }
      if (updateBomDto.isActive !== undefined) {
        updateData.isActive = updateBomDto.isActive;
      }
      if (updateBomDto.isDefault !== undefined) {
        updateData.isDefault = updateBomDto.isDefault;
      }
      if (updateBomDto.withOperations !== undefined) {
        updateData.withOperations = updateBomDto.withOperations;
      }
      if (updateBomDto.transferMaterialAgainst !== undefined) {
        updateData.transferMaterialAgainst = updateBomDto.transferMaterialAgainst;
      }
      if (updateBomDto.allowAlternativeItem !== undefined) {
        updateData.allowAlternativeItem = updateBomDto.allowAlternativeItem;
      }
      if (updateBomDto.allowSameItemMultipleTimes !== undefined) {
        updateData.allowSameItemMultipleTimes = updateBomDto.allowSameItemMultipleTimes;
      }
      if (updateBomDto.setRateOfSubAssemblyItemBasedOnBom !== undefined) {
        updateData.setRateOfSubAssemblyItemBasedOnBom = updateBomDto.setRateOfSubAssemblyItemBasedOnBom;
      }
      if (updateBomDto.inspectionRequired !== undefined) {
        updateData.inspectionRequired = updateBomDto.inspectionRequired;
      }
      if (updateBomDto.qualityInspectionTemplate !== undefined) {
        updateData.qualityInspectionTemplate = updateBomDto.qualityInspectionTemplate || null;
      }



      const [updatedBom] = await tx
        .update(boms)
        .set(updateData)
        .where(eq(boms.id, id))
        .returning();

      if (!updatedBom) {
        throw new Error('Failed to update BOM');
      }

      // Update BOM items if provided
      if (updateBomDto.items) {
        // Delete existing items
        await tx.delete(bomItems).where(eq(bomItems.bomId, id));

        // Insert new items
        if (updateBomDto.items.length > 0) {
          const bomItemsData: NewBOMItem[] = updateBomDto.items.map(
            (item, index) => ({
              bomId: id,
              itemId: item.itemId,
              itemCode: item.itemCode,
              itemName: item.itemName,
              description: item.description || null,
              qty: item.qty.toString(),
              uom: item.uom,
              rate: (item.rate || 0).toString(),
              conversionFactor: (item.conversionFactor || 1).toString(),
              bomNo: item.bomNo || null,
              allowAlternativeItem: item.allowAlternativeItem || false,
              includeItemInManufacturing:
                item.includeItemInManufacturing ?? true,
              sourcedBySupplier: item.sourcedBySupplier || false,
              operationId: item.operationId || null,
              idx: index,
            })
          );

          await tx.insert(bomItems).values(bomItemsData);
        }
      }

      // Update BOM operations if provided
      if (updateBomDto.operations) {
        // Delete existing operations
        await tx.delete(bomOperations).where(eq(bomOperations.bomId, id));

        // Insert new operations
        if (updateBomDto.operations.length > 0) {
          const bomOperationsData: NewBOMOperation[] =
            updateBomDto.operations.map((operation, index) => ({
              bomId: id,
              operationNo: operation.operationNo,
              operationName: operation.operationName,
              description: operation.description || null,
              workstationId: operation.workstationId || null,
              workstationType: operation.workstationType || null,
              timeInMins: (operation.timeInMins || 0).toString(),
              hourRate: (operation.hourRate || 0).toString(),
              batchSize: operation.batchSize || 1,
              fixedTimeInMins: (operation.fixedTimeInMins || 0).toString(),
              setUpTime: (operation.setUpTime || 0).toString(),
              tearDownTime: (operation.tearDownTime || 0).toString(),
              sequenceId: operation.sequenceId || index,
              idx: index,
            }));

          await tx.insert(bomOperations).values(bomOperationsData);
        }
      }

      // Update BOM scrap items if provided
      if (updateBomDto.scrapItems) {
        // Delete existing scrap items
        await tx.delete(bomScrapItems).where(eq(bomScrapItems.bomId, id));

        // Insert new scrap items
        if (updateBomDto.scrapItems.length > 0) {
          const bomScrapItemsData: NewBOMScrapItem[] =
            updateBomDto.scrapItems.map((scrapItem, index) => ({
              bomId: id,
              itemId: scrapItem.itemId,
              itemCode: scrapItem.itemCode,
              itemName: scrapItem.itemName,
              stockQty: (scrapItem.stockQty || 0).toString(),
              rate: (scrapItem.rate || 0).toString(),
              stockUom: scrapItem.stockUom || null,
              idx: index,
            }));

          await tx.insert(bomScrapItems).values(bomScrapItemsData);
        }
      }

      // Log the update
      const logData: NewBOMUpdateLog = {
        bomId: id,
        updateType: 'updated',
        changeDescription: 'BOM updated',
        previousData,
        newData: updateData,
        updatedBy: userId,
      };

      await tx.insert(bomUpdateLog).values(logData);

      // Recalculate costs
      await this.calculateAndUpdateBOMCosts(id, tx);

      return updatedBom;
    });
  }

  async findBOMById(id: string): Promise<BOM> {
    const [bom] = await db.select().from(boms).where(eq(boms.id, id)).limit(1);

    if (!bom) {
      throw new NotFoundException(`BOM with ID ${id} not found`);
    }

    return bom;
  }

  async findBOMs(filter: BOMFilterDto): Promise<BOM[]> {
    let query = db.select().from(boms);

    const conditions = [];

    if (filter.companyId) {
      conditions.push(eq(boms.companyId, filter.companyId));
    }

    if (filter.itemId) {
      conditions.push(eq(boms.itemId, filter.itemId));
    }

    if (filter.bomNo) {
      conditions.push(like(boms.bomNo, `%${filter.bomNo}%`));
    }

    if (filter.version) {
      conditions.push(eq(boms.version, filter.version));
    }

    if (filter.isActive !== undefined) {
      conditions.push(eq(boms.isActive, filter.isActive));
    }

    if (filter.isDefault !== undefined) {
      conditions.push(eq(boms.isDefault, filter.isDefault));
    }

    if (filter.bomType) {
      conditions.push(eq(boms.bomType, filter.bomType));
    }

    if (filter.search) {
      conditions.push(
        or(
          like(boms.bomNo, `%${filter.search}%`),
          like(boms.description, `%${filter.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(boms.createdAt));
  }

  async createBOMVersion(
    createVersionDto: CreateBOMVersionDto,
    userId: string
  ): Promise<BOM> {
    const originalBom = await this.findBOMById(createVersionDto.bomId);

    // Check if version already exists
    const existingVersion = await db
      .select()
      .from(boms)
      .where(
        and(
          eq(boms.bomNo, originalBom.bomNo),
          eq(boms.companyId, originalBom.companyId),
          eq(boms.version, createVersionDto.newVersion)
        )
      )
      .limit(1);

    if (existingVersion.length > 0) {
      throw new ConflictException(
        `Version ${createVersionDto.newVersion} already exists for BOM ${originalBom.bomNo}`
      );
    }

    return await db.transaction(async tx => {
      // If making this version default, unset other defaults
      if (createVersionDto.makeDefault) {
        await tx
          .update(boms)
          .set({ isDefault: false })
          .where(
            and(
              eq(boms.bomNo, originalBom.bomNo),
              eq(boms.companyId, originalBom.companyId)
            )
          );
      }

      // Create new BOM version
      const { id, createdAt, updatedAt, ...bomDataWithoutMeta } = originalBom;
      const newBomData: NewBOM = {
        ...bomDataWithoutMeta,
        version: createVersionDto.newVersion,
        isDefault: createVersionDto.makeDefault || false,
        createdBy: userId,
      };

      const [newBom] = await tx.insert(boms).values(newBomData).returning();

      if (!newBom) {
        throw new Error('Failed to create BOM version');
      }

      // Copy BOM items
      const originalItems = await tx
        .select()
        .from(bomItems)
        .where(eq(bomItems.bomId, createVersionDto.bomId));

      if (originalItems.length > 0) {
        const newItemsData: NewBOMItem[] = originalItems.map((item: BOMItem) => {
          const { id, createdAt, updatedAt, ...itemData } = item;
          return {
            ...itemData,
            bomId: newBom.id,
          };
        });

        await tx.insert(bomItems).values(newItemsData);
      }

      // Copy BOM operations
      const originalOperations = await tx
        .select()
        .from(bomOperations)
        .where(eq(bomOperations.bomId, createVersionDto.bomId));

      if (originalOperations.length > 0) {
        const newOperationsData: NewBOMOperation[] = originalOperations.map(
          (operation: BOMOperation) => {
            const { id, createdAt, updatedAt, ...operationData } = operation;
            return {
              ...operationData,
              bomId: newBom.id,
            };
          }
        );

        await tx.insert(bomOperations).values(newOperationsData);
      }

      // Copy BOM scrap items
      const originalScrapItems = await tx
        .select()
        .from(bomScrapItems)
        .where(eq(bomScrapItems.bomId, createVersionDto.bomId));

      if (originalScrapItems.length > 0) {
        const newScrapItemsData: NewBOMScrapItem[] = originalScrapItems.map(
          (scrapItem: BOMScrapItem) => {
            const { id, createdAt, updatedAt, ...scrapItemData } = scrapItem;
            return {
              ...scrapItemData,
              bomId: newBom.id,
            };
          }
        );

        await tx.insert(bomScrapItems).values(newScrapItemsData);
      }

      // Log the version creation
      const logData: NewBOMUpdateLog = {
        bomId: newBom.id,
        updateType: 'version_created',
        changeDescription:
          createVersionDto.changeDescription ||
          `Version ${createVersionDto.newVersion} created`,
        newData: {
          version: createVersionDto.newVersion,
          originalBomId: createVersionDto.bomId,
        },
        updatedBy: userId,
      };

      await tx.insert(bomUpdateLog).values(logData);

      return newBom;
    });
  }

  async calculateBOMCost(
    calculationDto: BOMCostCalculationDto
  ): Promise<BOMCostBreakdown> {
    const bom = await this.findBOMById(calculationDto.bomId);
    const quantity = calculationDto.quantity || parseFloat(bom.quantity);

    // Get BOM items
    const bomItemsList = await db
      .select()
      .from(bomItems)
      .where(eq(bomItems.bomId, calculationDto.bomId))
      .orderBy(asc(bomItems.idx));

    // Calculate material cost
    let materialCost = 0;
    for (const item of bomItemsList) {
      const itemCost = (parseFloat(item.rate || '0')) * (parseFloat(item.qty || '0')) * quantity;
      materialCost += itemCost;
    }

    // Calculate operating cost if requested
    let operatingCost = 0;
    if (calculationDto.includeOperations) {
      const operations = await db
        .select()
        .from(bomOperations)
        .where(eq(bomOperations.bomId, calculationDto.bomId))
        .orderBy(asc(bomOperations.sequenceId));

      for (const operation of operations) {
        const timeInMins = parseFloat(operation.timeInMins || '0');
        const hourRate = parseFloat(operation.hourRate || '0');
        const opCost = (timeInMins / 60) * hourRate * quantity;
        operatingCost += opCost;
      }
    }

    // Calculate scrap cost if requested
    let scrapCost = 0;
    if (calculationDto.includeScrap) {
      const scrapItems = await db
        .select()
        .from(bomScrapItems)
        .where(eq(bomScrapItems.bomId, calculationDto.bomId));

      for (const scrapItem of scrapItems) {
        const scrapItemCost =
          (parseFloat(scrapItem.rate || '0')) * (parseFloat(scrapItem.stockQty || '0')) * quantity;
        scrapCost += scrapItemCost;
      }
    }

    const totalCost = materialCost + operatingCost + scrapCost;

    return {
      materialCost,
      operatingCost,
      scrapCost,
      totalCost,
      currency: bom.currency,
    };
  }

  async explodeBOM(explosionDto: BOMExplosionDto): Promise<BOMExplosionResult> {
    const explosionItems: BOMExplosionItem[] = [];
    const processedBOMs = new Set<string>();

    await this.explodeBOMRecursive(
      explosionDto.bomId,
      explosionDto.quantity,
      0,
      explosionItems,
      processedBOMs,
      explosionDto.includeSubAssemblies || false
    );

    // Calculate cost breakdown
    const costBreakdown = await this.calculateBOMCost({
      bomId: explosionDto.bomId,
      includeOperations: explosionDto.includeOperations ?? false,
      includeScrap: explosionDto.includeScrap ?? false,
      quantity: explosionDto.quantity,
    });

    return {
      items: explosionItems,
      costBreakdown,
      totalQuantity: explosionDto.quantity,
    };
  }

  private async explodeBOMRecursive(
    bomId: string,
    quantity: number,
    level: number,
    explosionItems: BOMExplosionItem[],
    processedBOMs: Set<string>,
    includeSubAssemblies: boolean
  ): Promise<void> {
    if (processedBOMs.has(bomId)) {
      return; // Prevent infinite recursion
    }

    processedBOMs.add(bomId);

    const bomItemsList = await db
      .select()
      .from(bomItems)
      .where(eq(bomItems.bomId, bomId))
      .orderBy(asc(bomItems.idx));

    for (const item of bomItemsList) {
      const requiredQty = (parseFloat(item.qty || '0')) * quantity;
      const amount = (parseFloat(item.rate || '0')) * requiredQty;

      explosionItems.push({
        itemId: item.itemId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        requiredQty,
        uom: item.uom,
        rate: parseFloat(item.rate || '0'),
        amount,
        level,
        parentBomId: bomId,
        bomNo: item.bomNo || '',
      });

      // If this item has its own BOM and we want to include sub-assemblies
      if (includeSubAssemblies && item.bomNo) {
        const subBom = await db
          .select()
          .from(boms)
          .where(
            and(
              eq(boms.bomNo, item.bomNo),
              eq(boms.isActive, true),
              eq(boms.isDefault, true)
            )
          )
          .limit(1);

        if (subBom.length > 0 && subBom[0]) {
          await this.explodeBOMRecursive(
            subBom[0].id,
            requiredQty,
            level + 1,
            explosionItems,
            processedBOMs,
            includeSubAssemblies
          );
        }
      }
    }
  }

  private async calculateAndUpdateBOMCosts(
    bomId: string,
    tx: Parameters<Parameters<Database['transaction']>[0]>[0]
  ): Promise<void> {
    // Calculate material cost
    const materialCostResult = await tx
      .select({
        totalCost: sql<number>`COALESCE(SUM(${bomItems.amount}), 0)`,
      })
      .from(bomItems)
      .where(eq(bomItems.bomId, bomId));

    const materialCost = materialCostResult[0]?.totalCost || 0;

    // Calculate operating cost
    const operatingCostResult = await tx
      .select({
        totalCost: sql<number>`COALESCE(SUM(${bomOperations.operatingCost}), 0)`,
      })
      .from(bomOperations)
      .where(eq(bomOperations.bomId, bomId));

    const operatingCost = operatingCostResult[0]?.totalCost || 0;

    const totalCost = materialCost + operatingCost;

    // Update BOM with calculated costs
    await tx
      .update(boms)
      .set({
        rawMaterialCost: materialCost.toString(),
        operatingCost: operatingCost.toString(),
        totalCost: totalCost.toString(),
      })
      .where(eq(boms.id, bomId));
  }

  async deleteBOM(id: string, userId: string): Promise<void> {
    const bom = await this.findBOMById(id);

    await db.transaction(async tx => {
      // Log the deletion
      const logData: NewBOMUpdateLog = {
        bomId: id,
        updateType: 'deleted',
        changeDescription: 'BOM deleted',
        previousData: bom,
        updatedBy: userId,
      };

      await tx.insert(bomUpdateLog).values(logData);

      // Delete the BOM (cascade will handle related records)
      await tx.delete(boms).where(eq(boms.id, id));
    });
  }

  async getBOMItems(bomId: string): Promise<BOMItem[]> {
    return await db
      .select()
      .from(bomItems)
      .where(eq(bomItems.bomId, bomId))
      .orderBy(asc(bomItems.idx));
  }

  async getBOMOperations(bomId: string): Promise<BOMOperation[]> {
    return await db
      .select()
      .from(bomOperations)
      .where(eq(bomOperations.bomId, bomId))
      .orderBy(asc(bomOperations.sequenceId));
  }

  async getBOMScrapItems(bomId: string): Promise<BOMScrapItem[]> {
    return await db
      .select()
      .from(bomScrapItems)
      .where(eq(bomScrapItems.bomId, bomId))
      .orderBy(asc(bomScrapItems.idx));
  }

  async getBOMAlternativeItems(
    bomItemId: string
  ): Promise<BOMAlternativeItem[]> {
    return await db
      .select()
      .from(bomAlternativeItems)
      .where(eq(bomAlternativeItems.bomItemId, bomItemId))
      .orderBy(asc(bomAlternativeItems.priority));
  }
}

