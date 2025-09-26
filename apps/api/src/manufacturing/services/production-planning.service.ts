import { db } from '@kiro/database';
import {
  CapacityPlan,
  CapacityPlanResult,
  MRPResult,
  MRPRun,
  NewCapacityPlan,
  NewCapacityPlanResult,
  NewMRPResult,
  NewMRPRun,
  NewProductionForecast,
  NewProductionPlan,
  NewProductionPlanItem,
  ProductionForecast,
  ProductionPlan,
  ProductionPlanItem,
  bomItems,
  capacityPlanResults,
  capacityPlans,
  mrpResults,
  mrpRuns,
  productionForecasts,
  productionPlanItems,
  productionPlans,
  workstations,
} from '@kiro/database/schema';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, gte, like, lte, or, sql } from 'drizzle-orm';
import {
  ActionRequired,
  CapacityPlanFilterDto,
  CapacityPlanStatus,
  CapacityUtilizationSummary,
  CreateCapacityPlanDto,
  CreateMRPRunDto,
  CreateProductionForecastDto,
  CreateProductionPlanDto,
  ForecastAccuracy,
  GanttChartItem,
  GenerateGanttChartDto,
  MRPResultFilterDto,
  MRPRunFilterDto,
  MRPRunStatus,
  MRPSummary,
  ProductionForecastFilterDto,
  ProductionPlanFilterDto,
  ProductionPlanStatus,
  ProductionPlanSummary,
  UpdateProductionForecastDto,
  UpdateProductionPlanDto,
} from '../dto/production-planning.dto';

@Injectable()
export class ProductionPlanningService {
  // Production Plan Methods
  async createProductionPlan(
    createDto: CreateProductionPlanDto,
    userId: string
  ): Promise<ProductionPlan> {
    // Validate date range
    if (new Date(createDto.toDate) <= new Date(createDto.fromDate)) {
      throw new BadRequestException('To date must be after from date');
    }

    // Check if plan name already exists for the company
    const existingPlan = await db
      .select()
      .from(productionPlans)
      .where(
        and(
          eq(productionPlans.planName, createDto.planName),
          eq(productionPlans.companyId, createDto.companyId)
        )
      )
      .limit(1);

    if (existingPlan.length > 0) {
      throw new ConflictException(
        `Production plan with name ${createDto.planName} already exists`
      );
    }

    return await db.transaction(async tx => {
      // Create the main production plan
      const planData: NewProductionPlan = {
        planName: createDto.planName,
        companyId: createDto.companyId,
        fromDate: new Date(createDto.fromDate),
        toDate: new Date(createDto.toDate),
        description: createDto.description,
        getItemsFromOpenSalesOrders:
          createDto.getItemsFromOpenSalesOrders || false,
        downloadMaterialsRequired: createDto.downloadMaterialsRequired || false,
        ignoreExistingOrderedQty: createDto.ignoreExistingOrderedQty || false,
        considerMinOrderQty: createDto.considerMinOrderQty || false,
        includeNonStockItems: createDto.includeNonStockItems || false,
        includeSubcontractedItems: createDto.includeSubcontractedItems || false,
        createdBy: userId,
      };

      const [newPlan] = await tx
        .insert(productionPlans)
        .values(planData)
        .returning();

      // Create production plan items if provided
      if (createDto.items && createDto.items.length > 0) {
        const itemsData: NewProductionPlanItem[] = createDto.items.map(
          (item, index) => ({
            productionPlanId: newPlan.id,
            itemId: item.itemId,
            itemCode: item.itemCode,
            itemName: item.itemName,
            bomId: item.bomId,
            bomNo: item.bomNo,
            plannedQty: item.plannedQty,
            uom: item.uom,
            warehouseId: item.warehouseId,
            plannedStartDate: item.plannedStartDate
              ? new Date(item.plannedStartDate)
              : null,
            plannedEndDate: item.plannedEndDate
              ? new Date(item.plannedEndDate)
              : null,
            description: item.description,
            salesOrderId: item.salesOrderId,
            salesOrderItem: item.salesOrderItem,
            idx: index,
          })
        );

        await tx.insert(productionPlanItems).values(itemsData);
      }

      return newPlan;
    });
  }

  async updateProductionPlan(
    id: string,
    updateDto: UpdateProductionPlanDto,
    userId: string
  ): Promise<ProductionPlan> {
    const existingPlan = await this.findProductionPlanById(id);

    // Validate date range if both dates are provided
    if (updateDto.fromDate && updateDto.toDate) {
      if (new Date(updateDto.toDate) <= new Date(updateDto.fromDate)) {
        throw new BadRequestException('To date must be after from date');
      }
    }

    return await db.transaction(async tx => {
      // Update the main production plan
      const updateData: Partial<NewProductionPlan> = {};

      if (updateDto.planName) updateData.planName = updateDto.planName;
      if (updateDto.fromDate)
        updateData.fromDate = new Date(updateDto.fromDate);
      if (updateDto.toDate) updateData.toDate = new Date(updateDto.toDate);
      if (updateDto.status) updateData.status = updateDto.status;
      if (updateDto.description !== undefined)
        updateData.description = updateDto.description;
      if (updateDto.getItemsFromOpenSalesOrders !== undefined) {
        updateData.getItemsFromOpenSalesOrders =
          updateDto.getItemsFromOpenSalesOrders;
      }
      if (updateDto.downloadMaterialsRequired !== undefined) {
        updateData.downloadMaterialsRequired =
          updateDto.downloadMaterialsRequired;
      }
      if (updateDto.ignoreExistingOrderedQty !== undefined) {
        updateData.ignoreExistingOrderedQty =
          updateDto.ignoreExistingOrderedQty;
      }
      if (updateDto.considerMinOrderQty !== undefined) {
        updateData.considerMinOrderQty = updateDto.considerMinOrderQty;
      }
      if (updateDto.includeNonStockItems !== undefined) {
        updateData.includeNonStockItems = updateDto.includeNonStockItems;
      }
      if (updateDto.includeSubcontractedItems !== undefined) {
        updateData.includeSubcontractedItems =
          updateDto.includeSubcontractedItems;
      }

      const [updatedPlan] = await tx
        .update(productionPlans)
        .set(updateData)
        .where(eq(productionPlans.id, id))
        .returning();

      // Update items if provided
      if (updateDto.items) {
        // Delete existing items
        await tx
          .delete(productionPlanItems)
          .where(eq(productionPlanItems.productionPlanId, id));

        // Insert new items
        if (updateDto.items.length > 0) {
          const itemsData: NewProductionPlanItem[] = updateDto.items.map(
            (item, index) => ({
              productionPlanId: id,
              itemId: item.itemId,
              itemCode: item.itemCode,
              itemName: item.itemName,
              bomId: item.bomId,
              bomNo: item.bomNo,
              plannedQty: item.plannedQty,
              uom: item.uom,
              warehouseId: item.warehouseId,
              plannedStartDate: item.plannedStartDate
                ? new Date(item.plannedStartDate)
                : null,
              plannedEndDate: item.plannedEndDate
                ? new Date(item.plannedEndDate)
                : null,
              description: item.description,
              salesOrderId: item.salesOrderId,
              salesOrderItem: item.salesOrderItem,
              idx: index,
            })
          );

          await tx.insert(productionPlanItems).values(itemsData);
        }
      }

      return updatedPlan;
    });
  }

  async findProductionPlanById(id: string): Promise<ProductionPlan> {
    const [plan] = await db
      .select()
      .from(productionPlans)
      .where(eq(productionPlans.id, id))
      .limit(1);

    if (!plan) {
      throw new NotFoundException(`Production plan with ID ${id} not found`);
    }

    return plan;
  }

  async findProductionPlans(
    filter: ProductionPlanFilterDto
  ): Promise<ProductionPlan[]> {
    let query = db.select().from(productionPlans);

    const conditions = [];

    if (filter.companyId) {
      conditions.push(eq(productionPlans.companyId, filter.companyId));
    }

    if (filter.status) {
      conditions.push(eq(productionPlans.status, filter.status));
    }

    if (filter.planName) {
      conditions.push(like(productionPlans.planName, `%${filter.planName}%`));
    }

    if (filter.fromDate) {
      conditions.push(gte(productionPlans.fromDate, new Date(filter.fromDate)));
    }

    if (filter.toDate) {
      conditions.push(lte(productionPlans.toDate, new Date(filter.toDate)));
    }

    if (filter.search) {
      conditions.push(
        or(
          like(productionPlans.planName, `%${filter.search}%`),
          like(productionPlans.description, `%${filter.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(productionPlans.createdAt));
  }

  async getProductionPlanItems(planId: string): Promise<ProductionPlanItem[]> {
    return await db
      .select()
      .from(productionPlanItems)
      .where(eq(productionPlanItems.productionPlanId, planId))
      .orderBy(asc(productionPlanItems.idx));
  }

  async getProductionPlanSummary(
    companyId: string
  ): Promise<ProductionPlanSummary> {
    const summaryQuery = await db
      .select({
        totalPlans: sql<number>`COUNT(*)`,
        draftPlans: sql<number>`COUNT(CASE WHEN status = 'Draft' THEN 1 END)`,
        submittedPlans: sql<number>`COUNT(CASE WHEN status = 'Submitted' THEN 1 END)`,
        completedPlans: sql<number>`COUNT(CASE WHEN status = 'Completed' THEN 1 END)`,
      })
      .from(productionPlans)
      .where(eq(productionPlans.companyId, companyId));

    const itemsQuery = await db
      .select({
        totalItems: sql<number>`COUNT(*)`,
        totalPlannedQuantity: sql<number>`COALESCE(SUM(planned_qty), 0)`,
        totalProducedQuantity: sql<number>`COALESCE(SUM(produced_qty), 0)`,
      })
      .from(productionPlanItems)
      .innerJoin(
        productionPlans,
        eq(productionPlanItems.productionPlanId, productionPlans.id)
      )
      .where(eq(productionPlans.companyId, companyId));

    const summary = summaryQuery[0];
    const items = itemsQuery[0];

    const completionPercentage =
      items.totalPlannedQuantity > 0
        ? (items.totalProducedQuantity / items.totalPlannedQuantity) * 100
        : 0;

    return {
      totalPlans: summary.totalPlans,
      draftPlans: summary.draftPlans,
      submittedPlans: summary.submittedPlans,
      completedPlans: summary.completedPlans,
      totalItems: items.totalItems,
      totalPlannedQuantity: items.totalPlannedQuantity,
      totalProducedQuantity: items.totalProducedQuantity,
      completionPercentage,
    };
  }

  // MRP Methods
  async createMRPRun(
    createDto: CreateMRPRunDto,
    userId: string
  ): Promise<MRPRun> {
    // Validate date range
    if (new Date(createDto.toDate) <= new Date(createDto.fromDate)) {
      throw new BadRequestException('To date must be after from date');
    }

    const runData: NewMRPRun = {
      runName: createDto.runName,
      companyId: createDto.companyId,
      fromDate: new Date(createDto.fromDate),
      toDate: new Date(createDto.toDate),
      includeNonStockItems: createDto.includeNonStockItems || false,
      includeSubcontractedItems: createDto.includeSubcontractedItems || false,
      ignoreExistingOrderedQty: createDto.ignoreExistingOrderedQty || false,
      considerMinOrderQty: createDto.considerMinOrderQty || false,
      considerSafetyStock: createDto.considerSafetyStock ?? true,
      warehouseId: createDto.warehouseId,
      itemGroupId: createDto.itemGroupId,
      buyerId: createDto.buyerId,
      projectId: createDto.projectId,
      createdBy: userId,
    };

    const [newRun] = await db.insert(mrpRuns).values(runData).returning();
    return newRun;
  }

  async executeMRPRun(runId: string): Promise<void> {
    const run = await this.findMRPRunById(runId);

    if (run.status !== MRPRunStatus.DRAFT) {
      throw new BadRequestException(
        'MRP run must be in Draft status to execute'
      );
    }

    await db.transaction(async tx => {
      // Update run status to Running
      await tx
        .update(mrpRuns)
        .set({
          status: MRPRunStatus.RUNNING,
          runStartTime: new Date(),
        })
        .where(eq(mrpRuns.id, runId));

      try {
        // Clear existing results
        await tx.delete(mrpResults).where(eq(mrpResults.mrpRunId, runId));

        // Execute MRP logic
        await this.performMRPCalculation(runId, run, tx);

        // Update run status to Completed
        await tx
          .update(mrpRuns)
          .set({
            status: MRPRunStatus.COMPLETED,
            runEndTime: new Date(),
          })
          .where(eq(mrpRuns.id, runId));
      } catch (error) {
        // Update run status to Failed
        await tx
          .update(mrpRuns)
          .set({
            status: MRPRunStatus.FAILED,
            runEndTime: new Date(),
            errorLog: error.message,
          })
          .where(eq(mrpRuns.id, runId));

        throw error;
      }
    });
  }

  private async performMRPCalculation(
    runId: string,
    run: MRPRun,
    tx: any
  ): Promise<void> {
    // Get all production plan items within the date range
    const planItems = await tx
      .select()
      .from(productionPlanItems)
      .innerJoin(
        productionPlans,
        eq(productionPlanItems.productionPlanId, productionPlans.id)
      )
      .where(
        and(
          eq(productionPlans.companyId, run.companyId),
          gte(productionPlanItems.plannedStartDate, run.fromDate),
          lte(productionPlanItems.plannedEndDate, run.toDate)
        )
      );

    // Process each item and explode BOMs
    for (const planItem of planItems) {
      await this.calculateMRPForItem(runId, planItem, run, tx);
    }
  }

  private async calculateMRPForItem(
    runId: string,
    planItem: any,
    run: MRPRun,
    tx: any
  ): Promise<void> {
    // Get BOM for the item if it exists
    if (planItem.bomId) {
      const bomItemsList = await tx
        .select()
        .from(bomItems)
        .where(eq(bomItems.bomId, planItem.bomId));

      // Calculate requirements for each BOM component
      for (const bomItem of bomItemsList) {
        const grossRequirement = bomItem.qty * planItem.plannedQty;

        // TODO: Get current stock levels, scheduled receipts, safety stock
        // For now, using simplified calculation
        const projectedAvailableBalance = 0; // Would come from inventory
        const scheduledReceipts = 0; // Would come from purchase orders
        const safetyStock = 0; // Would come from item master

        const netRequirement = Math.max(
          0,
          grossRequirement -
            projectedAvailableBalance -
            scheduledReceipts +
            safetyStock
        );

        let actionRequired: ActionRequired | null = null;
        if (netRequirement > 0) {
          // Determine action based on item type
          actionRequired = ActionRequired.PURCHASE; // Simplified logic
        }

        const resultData: NewMRPResult = {
          mrpRunId: runId,
          itemId: bomItem.itemId,
          itemCode: bomItem.itemCode,
          itemName: bomItem.itemName,
          warehouseId: run.warehouseId,
          requiredDate: planItem.plannedStartDate,
          grossRequirement,
          scheduledReceipts,
          projectedAvailableBalance,
          netRequirement,
          plannedOrderQuantity: netRequirement,
          uom: bomItem.uom,
          leadTimeDays: 0, // Would come from item master
          safetyStock,
          actionRequired,
          sourceDocument: 'Production Plan',
          sourceDocumentId: planItem.productionPlanId,
        };

        await tx.insert(mrpResults).values(resultData);
      }
    }
  }

  async findMRPRunById(id: string): Promise<MRPRun> {
    const [run] = await db
      .select()
      .from(mrpRuns)
      .where(eq(mrpRuns.id, id))
      .limit(1);

    if (!run) {
      throw new NotFoundException(`MRP run with ID ${id} not found`);
    }

    return run;
  }

  async findMRPRuns(filter: MRPRunFilterDto): Promise<MRPRun[]> {
    let query = db.select().from(mrpRuns);

    const conditions = [];

    if (filter.companyId) {
      conditions.push(eq(mrpRuns.companyId, filter.companyId));
    }

    if (filter.status) {
      conditions.push(eq(mrpRuns.status, filter.status));
    }

    if (filter.runName) {
      conditions.push(like(mrpRuns.runName, `%${filter.runName}%`));
    }

    if (filter.fromDate) {
      conditions.push(gte(mrpRuns.fromDate, new Date(filter.fromDate)));
    }

    if (filter.toDate) {
      conditions.push(lte(mrpRuns.toDate, new Date(filter.toDate)));
    }

    if (filter.search) {
      conditions.push(or(like(mrpRuns.runName, `%${filter.search}%`)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(mrpRuns.createdAt));
  }

  async getMRPResults(filter: MRPResultFilterDto): Promise<MRPResult[]> {
    let query = db.select().from(mrpResults);

    const conditions = [eq(mrpResults.mrpRunId, filter.mrpRunId)];

    if (filter.itemId) {
      conditions.push(eq(mrpResults.itemId, filter.itemId));
    }

    if (filter.warehouseId) {
      conditions.push(eq(mrpResults.warehouseId, filter.warehouseId));
    }

    if (filter.actionRequired) {
      conditions.push(eq(mrpResults.actionRequired, filter.actionRequired));
    }

    if (filter.search) {
      conditions.push(
        or(
          like(mrpResults.itemCode, `%${filter.search}%`),
          like(mrpResults.itemName, `%${filter.search}%`)
        )
      );
    }

    return await query
      .where(and(...conditions))
      .orderBy(asc(mrpResults.requiredDate), asc(mrpResults.itemCode));
  }

  async getMRPSummary(runId: string): Promise<MRPSummary> {
    const summaryQuery = await db
      .select({
        totalItems: sql<number>`COUNT(*)`,
        itemsRequiringPurchase: sql<number>`COUNT(CASE WHEN action_required = 'Purchase' THEN 1 END)`,
        itemsRequiringManufacture: sql<number>`COUNT(CASE WHEN action_required = 'Manufacture' THEN 1 END)`,
        itemsRequiringTransfer: sql<number>`COUNT(CASE WHEN action_required = 'Transfer' THEN 1 END)`,
        totalRequiredValue: sql<number>`COALESCE(SUM(net_requirement), 0)`,
      })
      .from(mrpResults)
      .where(eq(mrpResults.mrpRunId, runId));

    const summary = summaryQuery[0];

    return {
      totalRuns: 1,
      completedRuns: 1,
      totalItems: summary.totalItems,
      itemsRequiringPurchase: summary.itemsRequiringPurchase,
      itemsRequiringManufacture: summary.itemsRequiringManufacture,
      itemsRequiringTransfer: summary.itemsRequiringTransfer,
      totalRequiredValue: summary.totalRequiredValue,
    };
  }

  // Capacity Planning Methods
  async createCapacityPlan(
    createDto: CreateCapacityPlanDto,
    userId: string
  ): Promise<CapacityPlan> {
    // Validate date range
    if (new Date(createDto.toDate) <= new Date(createDto.fromDate)) {
      throw new BadRequestException('To date must be after from date');
    }

    const planData: NewCapacityPlan = {
      planName: createDto.planName,
      companyId: createDto.companyId,
      fromDate: new Date(createDto.fromDate),
      toDate: new Date(createDto.toDate),
      workstationId: createDto.workstationId,
      includeWorkOrders: createDto.includeWorkOrders ?? true,
      includeProductionPlans: createDto.includeProductionPlans ?? true,
      includeMaintenanceSchedule: createDto.includeMaintenanceSchedule || false,
      capacityUom: createDto.capacityUom || 'Hours',
      createdBy: userId,
    };

    const [newPlan] = await db
      .insert(capacityPlans)
      .values(planData)
      .returning();
    return newPlan;
  }

  async executeCapacityPlan(planId: string): Promise<void> {
    const plan = await this.findCapacityPlanById(planId);

    if (plan.status !== CapacityPlanStatus.DRAFT) {
      throw new BadRequestException(
        'Capacity plan must be in Draft status to execute'
      );
    }

    await db.transaction(async tx => {
      // Update plan status to Running
      await tx
        .update(capacityPlans)
        .set({
          status: CapacityPlanStatus.RUNNING,
          runStartTime: new Date(),
        })
        .where(eq(capacityPlans.id, planId));

      try {
        // Clear existing results
        await tx
          .delete(capacityPlanResults)
          .where(eq(capacityPlanResults.capacityPlanId, planId));

        // Execute capacity planning logic
        await this.performCapacityCalculation(planId, plan, tx);

        // Update plan status to Completed
        await tx
          .update(capacityPlans)
          .set({
            status: CapacityPlanStatus.COMPLETED,
            runEndTime: new Date(),
          })
          .where(eq(capacityPlans.id, planId));
      } catch (error) {
        // Update plan status to Failed
        await tx
          .update(capacityPlans)
          .set({
            status: CapacityPlanStatus.FAILED,
            runEndTime: new Date(),
            errorLog: error.message,
          })
          .where(eq(capacityPlans.id, planId));

        throw error;
      }
    });
  }

  private async performCapacityCalculation(
    planId: string,
    plan: CapacityPlan,
    tx: any
  ): Promise<void> {
    // Get workstations to analyze
    let workstationQuery = tx.select().from(workstations);

    if (plan.workstationId) {
      workstationQuery = workstationQuery.where(
        eq(workstations.id, plan.workstationId)
      );
    } else {
      workstationQuery = workstationQuery.where(
        eq(workstations.companyId, plan.companyId)
      );
    }

    const workstationsList = await workstationQuery;

    // Calculate capacity for each workstation
    for (const workstation of workstationsList) {
      await this.calculateWorkstationCapacity(planId, workstation, plan, tx);
    }
  }

  private async calculateWorkstationCapacity(
    planId: string,
    workstation: any,
    plan: CapacityPlan,
    tx: any
  ): Promise<void> {
    // Calculate available capacity (simplified - would need working hours, holidays, etc.)
    const daysDiff = Math.ceil(
      (plan.toDate.getTime() - plan.fromDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const availableCapacity = daysDiff * 8; // 8 hours per day (simplified)

    // Calculate planned capacity from production plans and work orders
    let plannedCapacity = 0;

    if (plan.includeProductionPlans) {
      // Get operations for this workstation from production plans
      // This would involve joining production plans -> BOM operations
      // Simplified for now
      plannedCapacity += 0;
    }

    const utilizationPercentage =
      availableCapacity > 0 ? (plannedCapacity / availableCapacity) * 100 : 0;
    const overloadHours = Math.max(0, plannedCapacity - availableCapacity);
    const underloadHours = Math.max(0, availableCapacity - plannedCapacity);

    const resultData: NewCapacityPlanResult = {
      capacityPlanId: planId,
      workstationId: workstation.id,
      workstationName: workstation.workstationName,
      planningDate: plan.fromDate,
      availableCapacity,
      plannedCapacity,
      capacityUtilization: utilizationPercentage,
      overloadHours,
      underloadHours,
      capacityUom: plan.capacityUom,
    };

    await tx.insert(capacityPlanResults).values(resultData);
  }

  async findCapacityPlanById(id: string): Promise<CapacityPlan> {
    const [plan] = await db
      .select()
      .from(capacityPlans)
      .where(eq(capacityPlans.id, id))
      .limit(1);

    if (!plan) {
      throw new NotFoundException(`Capacity plan with ID ${id} not found`);
    }

    return plan;
  }

  async findCapacityPlans(
    filter: CapacityPlanFilterDto
  ): Promise<CapacityPlan[]> {
    let query = db.select().from(capacityPlans);

    const conditions = [];

    if (filter.companyId) {
      conditions.push(eq(capacityPlans.companyId, filter.companyId));
    }

    if (filter.status) {
      conditions.push(eq(capacityPlans.status, filter.status));
    }

    if (filter.planName) {
      conditions.push(like(capacityPlans.planName, `%${filter.planName}%`));
    }

    if (filter.workstationId) {
      conditions.push(eq(capacityPlans.workstationId, filter.workstationId));
    }

    if (filter.fromDate) {
      conditions.push(gte(capacityPlans.fromDate, new Date(filter.fromDate)));
    }

    if (filter.toDate) {
      conditions.push(lte(capacityPlans.toDate, new Date(filter.toDate)));
    }

    if (filter.search) {
      conditions.push(or(like(capacityPlans.planName, `%${filter.search}%`)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(capacityPlans.createdAt));
  }

  async getCapacityPlanResults(planId: string): Promise<CapacityPlanResult[]> {
    return await db
      .select()
      .from(capacityPlanResults)
      .where(eq(capacityPlanResults.capacityPlanId, planId))
      .orderBy(
        asc(capacityPlanResults.planningDate),
        asc(capacityPlanResults.workstationName)
      );
  }

  async getCapacityUtilizationSummary(
    planId: string
  ): Promise<CapacityUtilizationSummary[]> {
    const results = await db
      .select({
        workstationId: capacityPlanResults.workstationId,
        workstationName: capacityPlanResults.workstationName,
        totalAvailableCapacity: sql<number>`SUM(${capacityPlanResults.availableCapacity})`,
        totalPlannedCapacity: sql<number>`SUM(${capacityPlanResults.plannedCapacity})`,
        overloadHours: sql<number>`SUM(${capacityPlanResults.overloadHours})`,
        underloadHours: sql<number>`SUM(${capacityPlanResults.underloadHours})`,
        capacityUom: capacityPlanResults.capacityUom,
      })
      .from(capacityPlanResults)
      .where(eq(capacityPlanResults.capacityPlanId, planId))
      .groupBy(
        capacityPlanResults.workstationId,
        capacityPlanResults.workstationName,
        capacityPlanResults.capacityUom
      );

    return results.map(result => ({
      workstationId: result.workstationId,
      workstationName: result.workstationName,
      totalAvailableCapacity: result.totalAvailableCapacity,
      totalPlannedCapacity: result.totalPlannedCapacity,
      utilizationPercentage:
        result.totalAvailableCapacity > 0
          ? (result.totalPlannedCapacity / result.totalAvailableCapacity) * 100
          : 0,
      overloadHours: result.overloadHours,
      underloadHours: result.underloadHours,
      capacityUom: result.capacityUom,
    }));
  }

  // Production Forecast Methods
  async createProductionForecast(
    createDto: CreateProductionForecastDto,
    userId: string
  ): Promise<ProductionForecast> {
    const forecastData: NewProductionForecast = {
      forecastName: createDto.forecastName,
      companyId: createDto.companyId,
      itemId: createDto.itemId,
      itemCode: createDto.itemCode,
      itemName: createDto.itemName,
      forecastDate: new Date(createDto.forecastDate),
      forecastQuantity: createDto.forecastQuantity,
      uom: createDto.uom,
      warehouseId: createDto.warehouseId,
      salesOrderId: createDto.salesOrderId,
      forecastType: createDto.forecastType || 'Manual',
      confidenceLevel: createDto.confidenceLevel || 0,
      seasonalFactor: createDto.seasonalFactor || 1,
      trendFactor: createDto.trendFactor || 1,
      notes: createDto.notes,
      createdBy: userId,
    };

    const [newForecast] = await db
      .insert(productionForecasts)
      .values(forecastData)
      .returning();
    return newForecast;
  }

  async updateProductionForecast(
    id: string,
    updateDto: UpdateProductionForecastDto
  ): Promise<ProductionForecast> {
    const existingForecast = await this.findProductionForecastById(id);

    const updateData: Partial<NewProductionForecast> = {};

    if (updateDto.forecastName)
      updateData.forecastName = updateDto.forecastName;
    if (updateDto.forecastDate)
      updateData.forecastDate = new Date(updateDto.forecastDate);
    if (updateDto.forecastQuantity !== undefined)
      updateData.forecastQuantity = updateDto.forecastQuantity;
    if (updateDto.forecastType)
      updateData.forecastType = updateDto.forecastType;
    if (updateDto.confidenceLevel !== undefined)
      updateData.confidenceLevel = updateDto.confidenceLevel;
    if (updateDto.seasonalFactor !== undefined)
      updateData.seasonalFactor = updateDto.seasonalFactor;
    if (updateDto.trendFactor !== undefined)
      updateData.trendFactor = updateDto.trendFactor;
    if (updateDto.actualQuantity !== undefined) {
      updateData.actualQuantity = updateDto.actualQuantity;
      // Calculate variance
      const variance =
        updateDto.actualQuantity - existingForecast.forecastQuantity;
      const variancePercentage =
        existingForecast.forecastQuantity > 0
          ? (variance / existingForecast.forecastQuantity) * 100
          : 0;
      updateData.variance = variance;
      updateData.variancePercentage = variancePercentage;
    }
    if (updateDto.notes !== undefined) updateData.notes = updateDto.notes;
    if (updateDto.isActive !== undefined)
      updateData.isActive = updateDto.isActive;

    const [updatedForecast] = await db
      .update(productionForecasts)
      .set(updateData)
      .where(eq(productionForecasts.id, id))
      .returning();

    return updatedForecast;
  }

  async findProductionForecastById(id: string): Promise<ProductionForecast> {
    const [forecast] = await db
      .select()
      .from(productionForecasts)
      .where(eq(productionForecasts.id, id))
      .limit(1);

    if (!forecast) {
      throw new NotFoundException(
        `Production forecast with ID ${id} not found`
      );
    }

    return forecast;
  }

  async findProductionForecasts(
    filter: ProductionForecastFilterDto
  ): Promise<ProductionForecast[]> {
    let query = db.select().from(productionForecasts);

    const conditions = [];

    if (filter.companyId) {
      conditions.push(eq(productionForecasts.companyId, filter.companyId));
    }

    if (filter.itemId) {
      conditions.push(eq(productionForecasts.itemId, filter.itemId));
    }

    if (filter.warehouseId) {
      conditions.push(eq(productionForecasts.warehouseId, filter.warehouseId));
    }

    if (filter.forecastType) {
      conditions.push(
        eq(productionForecasts.forecastType, filter.forecastType)
      );
    }

    if (filter.fromDate) {
      conditions.push(
        gte(productionForecasts.forecastDate, new Date(filter.fromDate))
      );
    }

    if (filter.toDate) {
      conditions.push(
        lte(productionForecasts.forecastDate, new Date(filter.toDate))
      );
    }

    if (filter.isActive !== undefined) {
      conditions.push(eq(productionForecasts.isActive, filter.isActive));
    }

    if (filter.search) {
      conditions.push(
        or(
          like(productionForecasts.forecastName, `%${filter.search}%`),
          like(productionForecasts.itemCode, `%${filter.search}%`),
          like(productionForecasts.itemName, `%${filter.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(productionForecasts.forecastDate));
  }

  async getForecastAccuracy(companyId: string): Promise<ForecastAccuracy[]> {
    const results = await db
      .select({
        itemId: productionForecasts.itemId,
        itemCode: productionForecasts.itemCode,
        itemName: productionForecasts.itemName,
        totalForecasts: sql<number>`COUNT(*)`,
        totalForecastedQuantity: sql<number>`SUM(${productionForecasts.forecastQuantity})`,
        totalActualQuantity: sql<number>`SUM(${productionForecasts.actualQuantity})`,
        totalVariance: sql<number>`SUM(${productionForecasts.variance})`,
        averageVariancePercentage: sql<number>`AVG(${productionForecasts.variancePercentage})`,
      })
      .from(productionForecasts)
      .where(
        and(
          eq(productionForecasts.companyId, companyId),
          eq(productionForecasts.isActive, true)
        )
      )
      .groupBy(
        productionForecasts.itemId,
        productionForecasts.itemCode,
        productionForecasts.itemName
      );

    return results.map(result => ({
      itemId: result.itemId,
      itemCode: result.itemCode,
      itemName: result.itemName,
      totalForecasts: result.totalForecasts,
      averageAccuracy: 100 - Math.abs(result.averageVariancePercentage || 0),
      totalForecastedQuantity: result.totalForecastedQuantity,
      totalActualQuantity: result.totalActualQuantity,
      totalVariance: result.totalVariance,
      averageVariancePercentage: result.averageVariancePercentage || 0,
    }));
  }

  // Gantt Chart Methods
  async generateGanttChart(
    generateDto: GenerateGanttChartDto
  ): Promise<GanttChartItem[]> {
    const ganttItems: GanttChartItem[] = [];

    if (generateDto.includeProductionPlans) {
      const plans = await this.getProductionPlansForGantt(generateDto);
      ganttItems.push(...plans);
    }

    // TODO: Add work orders and operations when those modules are implemented

    return ganttItems.sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }

  private async getProductionPlansForGantt(
    generateDto: GenerateGanttChartDto
  ): Promise<GanttChartItem[]> {
    let query = db
      .select()
      .from(productionPlanItems)
      .innerJoin(
        productionPlans,
        eq(productionPlanItems.productionPlanId, productionPlans.id)
      )
      .where(
        and(
          gte(
            productionPlanItems.plannedStartDate,
            new Date(generateDto.fromDate)
          ),
          lte(productionPlanItems.plannedEndDate, new Date(generateDto.toDate))
        )
      );

    if (generateDto.productionPlanId) {
      query = query.where(eq(productionPlans.id, generateDto.productionPlanId));
    }

    const planItems = await query;

    return planItems.map(item => ({
      id: item.production_plan_items.id,
      name: `${item.production_plan_items.itemCode} - ${item.production_plan_items.itemName}`,
      startDate:
        item.production_plan_items.plannedStartDate?.toISOString() ||
        generateDto.fromDate,
      endDate:
        item.production_plan_items.plannedEndDate?.toISOString() ||
        generateDto.toDate,
      progress:
        item.production_plan_items.producedQty > 0
          ? (item.production_plan_items.producedQty /
              item.production_plan_items.plannedQty) *
            100
          : 0,
      parentId: item.production_plans.id,
      type: 'production_plan',
    }));
  }

  async deleteProductionPlan(id: string): Promise<void> {
    const plan = await this.findProductionPlanById(id);

    if (plan.status === ProductionPlanStatus.COMPLETED) {
      throw new BadRequestException('Cannot delete completed production plan');
    }

    await db.delete(productionPlans).where(eq(productionPlans.id, id));
  }

  async deleteMRPRun(id: string): Promise<void> {
    await db.delete(mrpRuns).where(eq(mrpRuns.id, id));
  }

  async deleteCapacityPlan(id: string): Promise<void> {
    await db.delete(capacityPlans).where(eq(capacityPlans.id, id));
  }

  async deleteProductionForecast(id: string): Promise<void> {
    await db.delete(productionForecasts).where(eq(productionForecasts.id, id));
  }
}
