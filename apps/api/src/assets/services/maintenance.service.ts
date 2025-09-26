import {
  DatabaseService,
  maintenanceSchedules,
  maintenanceWorkOrders,
  maintenanceHistory,
  spareParts,
  mainosts,
  type MaintenanceSchedule,
  type MaintenanceWorkOrder,
  type MaintenanceHistory,
  type SparePart,
  type MaintenanceCost,
} from '@kiro/database';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, or, sql, gte, lte } from 'drizzle-orm';
import {
  CreateMaintenanceScheduleDto,
  UpdateMaintenanceScheduleDto,
  CreateMaintenanceWorkOrderDto,
  UpdateMaintenanceWorkOrderDto,
  CompleteMaintenanceWorkOrderDto,
  CreateMaintenanceHistoryDto,
  UpdateMaintenanceHistoryDto,
  CreateSparePartDto,
  UpdateSparePartDto,
  CreateMaintenanceCostDto,
  UpdateMaintenanceCostDto,
  MaintenanceScheduleFilterDto,
  MaintenanceWorkOrderFilterDto,
  SparePartFilterDto,
  WorkOrderStatus,
  MaintenanceScheduleStatus,
  Priority,
} from '../dto/maintenance.dto';

@Injectable()
export class MaintenanceService {
  constructor(private readonly db: DatabaseService) {}

  // Maintenance Schedules
  async createMaintenanceSchedule(
    createMaintenanceScheduleDto: CreateMaintenanceScheduleDto,
    userId: string
  ): Promise<MaintenanceSchedule> {
    // Check if schedule code already exists
    const existingSchedule = await this.db
      .select()
      .from(maintenanceSchedules)
      .where(
        and(
          eq(maintenanceSchedules.scheduleCode, createMaintenanceScheduleDto.scheduleCode),
          eq(maintenanceSchedules.companyId, createMaintenanceScheduleDto.companyId)
        )
      )
      .limit(1);

    if (existingSchedule.length > 0) {
      throw new ConflictException('Maintenance schedule code already exists');
    }

    // Calculate next due date based on schedule type
    const nextDueDate = this.calculateNextDueDate(
      new Date(createMaintenanceScheduleDto.startDate),
      createMaintenanceScheduleDto.frequency,
      createMaintenanceScheduleDto.frequencyUnit
    );

    const [newSchedule] = await this.db
      .insert(maintenanceSchedules)
      .values({
        ...createMaintenanceScheduleDto,
        nextDueDate,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return newSchedule;
  }

  async updateMaintenanceSchedule(
    id: string,
    updateMaintenanceScheduleDto: UpdateMaintenanceScheduleDto,
    userId: string,
    companyId: string
  ): Promise<MaintenanceSchedule> {
    const existingSchedule = await this.findMaintenanceScheduleById(id, companyId);

    // Recalculate next due date if frequency or start date changed
    let nextDueDate = existingSchedule.nextDueDate;
    if (updateMaintenanceScheduleDto.frequency || updateMaintenanceScheduleDto.frequencyUnit || updateMaintenanceScheduleDto.startDate) {
      const startDate = new Date(updateMaintenanceScheduleDto.startDate || existingSchedule.startDate);
      const frequency = updateMaintenanceScheduleDto.frequency || existingSchedule.frequency;
      const frequencyUnit = updateMaintenanceScheduleDto.frequencyUnit || existingSchedule.frequencyUnit;

      if (frequency && frequencyUnit) {
        nextDueDate = this.calculateNextDueDate(startDate, frequency, frequencyUnit);
      }
    }

    const [updatedSchedule] = await this.db
      .update(maintenanceSchedules)
      .set({
        ...updateMaintenanceScheduleDto,
        nextDueDate,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(eq(maintenanceSchedules.id, id), eq(maintenanceSchedules.companyId, companyId)))
      .returning();

    return updatedSchedule;
  }

  async findMaintenanceScheduleById(id: string, companyId: string): Promise<MaintenanceSchedule> {
    const [schedule] = await this.db
      .select()
      .from(maintenanceSchedules)
      .where(and(eq(maintenanceSchedules.id, id), eq(maintenanceSchedules.companyId, companyId)))
      .limit(1);

    if (!schedule) {
      throw new NotFoundException('Maintenance schedule not found');
    }

    return schedule;
  }

  async findMaintenanceSchedules(filter: MaintenanceScheduleFilterDto, companyId: string) {
    const conditions = [eq(maintenanceSchedules.companyId, companyId)];

    // Apply filters
    if (filter.search) {
      conditions.push(
        or(
          ilike(maintenanceSchedules.scheduleCode, `%${filter.search}%`),
          ilike(maintenanceSchedules.scheduleName, `%${filter.search}%`),
          ilike(maintenanceSchedules.description, `%${filter.search}%`)
        )
      );
    }

    if (filter.assetId) {
      conditions.push(eq(maintenanceSchedules.assetId, filter.assetId));
    }

    if (filter.maintenanceType) {
      conditions.push(eq(maintenanceSchedules.maintenanceType, filter.maintenanceType));
    }

    if (filter.scheduleType) {
      conditions.push(eq(maintenanceSchedules.scheduleType, filter.scheduleType));
    }

    if (filter.status) {
      conditions.push(eq(maintenanceSchedules.status, filter.status));
    }

    if (filter.priority) {
      conditions.push(eq(maintenanceSchedules.priority, filter.priority));
    }

    if (filter.isActive !== undefined) {
      conditions.push(eq(maintenanceSchedules.isActive, filter.isActive));
    }

    if (filter.nextDueDateFrom) {
      conditions.push(gte(maintenanceSchedules.nextDueDate, new Date(filter.nextDueDateFrom)));
    }

    if (filter.nextDueDateTo) {
      conditions.push(lte(maintenanceSchedules.nextDueDate, new Date(filter.nextDueDateTo)));
    }

    const whereClause = and(...conditions);

    // Get total count
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(maintenanceSchedules)
      .where(whereClause);

    // Get paginated results
    const offset = (filter.page - 1) * filter.limit;
    const orderBy = filter.sortOrder === 'ASC'
      ? asc(maintenanceSchedules[filter.sortBy as keyof typeof maintenanceSchedules] || maintenanceSchedules.nextDueDate)
      : desc(maintenanceSchedules[filter.sortBy as keyof typeof maintenanceSchedules] || maintenanceSchedules.nextDueDate);

    const results = await this.db
      .select()
      .from(maintenanceSchedules)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(filter.limit)
      .offset(offset);

    return {
      data: results,
      total,
      page: filter.page,
      limit: filter.limit,
      totalPages: Math.ceil(total / filter.limit),
    };
  }

  // Maintenance Work Orders
  async createMaintenanceWorkOrder(
    createMaintenanceWorkOrderDto: CreateMaintenanceWorkOrderDto,
    userId: string
  ): Promise<MaintenanceWorkOrder> {
    // Generate work order number
    const workOrderNumber = await this.generateWorkOrderNumber(createMaintenanceWorkOrderDto.companyId);

    const [newWorkOrder] = await this.db
      .insert(maintenanceWorkOrders)
      .values({
        ...createMaintenanceWorkOrderDto,
        workOrderNumber,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return newWorkOrder;
  }

  async updateMaintenanceWorkOrder(
    id: string,
    updateMaintenanceWorkOrderDto: UpdateMaintenanceWorkOrderDto,
    userId: string,
    companyId: string
  ): Promise<MaintenanceWorkOrder> {
    const existingWorkOrder = await this.findMaintenanceWorkOrderById(id, companyId);

    const [updatedWorkOrder] = await this.db
      .update(maintenanceWorkOrders)
      .set({
        ...updateMaintenanceWorkOrderDto,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(eq(maintenanceWorkOrders.id, id), eq(maintenanceWorkOrders.companyId, companyId)))
      .returning();

    return updatedWorkOrder;
  }

  async startMaintenanceWorkOrder(
    id: string,
    userId: string,
    companyId: string
  ): Promise<MaintenanceWorkOrder> {
    const workOrder = await this.findMaintenanceWorkOrderById(id, companyId);

    if (workOrder.status !== WorkOrderStatus.OPEN) {
      throw new BadRequestException('Only open work orders can be started');
    }

    const [startedWorkOrder] = await this.db
      .update(maintenanceWorkOrders)
      .set({
        status: WorkOrderStatus.IN_PROGRESS,
        actualStartDate: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(eq(maintenanceWorkOrders.id, id), eq(maintenanceWorkOrders.companyId, companyId)))
      .returning();

    return startedWorkOrder;
  }

  async completeMaintenanceWorkOrder(
    id: string,
    completeMaintenanceWorkOrderDto: CompleteMaintenanceWorkOrderDto,
    userId: string
  ): Promise<MaintenanceWorkOrder> {
    const workOrder = await this.findMaintenanceWorkOrderById(id, completeMaintenanceWorkOrderDto.companyId);

    if (workOrder.status !== WorkOrderStatus.IN_PROGRESS) {
      throw new BadRequestException('Only in-progress work orders can be completed');
    }

    const [completedWorkOrder] = await this.db
      .update(maintenanceWorkOrders)
      .set({
        status: WorkOrderStatus.COMPLETED,
        actualEndDate: new Date(),
        completionPercentage: 100,
        workPerformed: completeMaintenanceWorkOrderDto.workPerformed,
        partsUsed: completeMaintenanceWorkOrderDto.partsUsed,
        completionNotes: completeMaintenanceWorkOrderDto.completionNotes,
        actualCost: completeMaintenanceWorkOrderDto.actualCost,
        laborCost: completeMaintenanceWorkOrderDto.laborCost,
        materialCost: completeMaintenanceWorkOrderDto.materialCost,
        externalServiceCost: completeMaintenanceWorkOrderDto.externalServiceCost,
        actualDuration: completeMaintenanceWorkOrderDto.actualDuration,
        qualityChecks: completeMaintenanceWorkOrderDto.qualityChecks,
        completedBy: userId,
        completedAt: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(eq(maintenanceWorkOrders.id, id), eq(maintenanceWorkOrders.companyId, completeMaintenanceWorkOrderDto.companyId)))
      .returning();

    // Create maintenance history entry
    await this.createMaintenanceHistoryFromWorkOrder(completedWorkOrder, userId);

    // Update maintenance schedule next due date if this was a scheduled maintenance
    if (workOrder.scheduleId) {
      await this.updateScheduleNextDueDate(workOrder.scheduleId, completeMaintenanceWorkOrderDto.companyId);
    }

    return completedWorkOrder;
  }

  async findMaintenanceWorkOrderById(id: string, companyId: string): Promise<MaintenanceWorkOrder> {
    const [workOrder] = await this.db
      .select()
      .from(maintenanceWorkOrders)
      .where(and(eq(maintenanceWorkOrders.id, id), eq(maintenanceWorkOrders.companyId, companyId)))
      .limit(1);

    if (!workOrder) {
      throw new NotFoundException('Maintenance work order not found');
    }

    return workOrder;
  }

  async findMaintenanceWorkOrders(filter: MaintenanceWorkOrderFilterDto, companyId: string) {
    const conditions = [eq(maintenanceWorkOrders.companyId, companyId)];

    // Apply filters
    if (filter.search) {
      conditions.push(
        or(
          ilike(maintenanceWorkOrders.workOrderNumber, `%${filter.search}%`),
          ilike(maintenanceWorkOrders.title, `%${filter.search}%`),
          ilike(maintenanceWorkOrders.description, `%${filter.search}%`)
        )
      );
    }

    if (filter.assetId) {
      conditions.push(eq(maintenanceWorkOrders.assetId, filter.assetId));
    }

    if (filter.scheduleId) {
      conditions.push(eq(maintenanceWorkOrders.scheduleId, filter.scheduleId));
    }

    if (filter.workOrderType) {
      conditions.push(eq(maintenanceWorkOrders.workOrderType, filter.workOrderType));
    }

    if (filter.status) {
      conditions.push(eq(maintenanceWorkOrders.status, filter.status));
    }

    if (filter.priority) {
      conditions.push(eq(maintenanceWorkOrders.priority, filter.priority));
    }

    if (filter.assignedToId) {
      conditions.push(eq(maintenanceWorkOrders.assignedToId, filter.assignedToId));
    }

    if (filter.scheduledStartDateFrom) {
      conditions.push(gte(maintenanceWorkOrders.scheduledStartDate, new Date(filter.scheduledStartDateFrom)));
    }

    if (filter.scheduledStartDateTo) {
      conditions.push(lte(maintenanceWorkOrders.scheduledStartDate, new Date(filter.scheduledStartDateTo)));
    }

    const whereClause = and(...conditions);

    // Get total count
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(maintenanceWorkOrders)
      .where(whereClause);

    // Get paginated results
    const offset = (filter.page - 1) * filter.limit;
    const orderBy = filter.sortOrder === 'ASC'
      ? asc(maintenanceWorkOrders[filter.sortBy as keyof typeof maintenanceWorkOrders] || maintenanceWorkOrders.scheduledStartDate)
      : desc(maintenanceWorkOrders[filter.sortBy as keyof typeof maintenanceWorkOrders] || maintenanceWorkOrders.scheduledStartDate);

    const results = await this.db
      .select()
      .from(maintenanceWorkOrders)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(filter.limit)
      .offset(offset);

    return {
      data: results,
      total,
      page: filter.page,
      limit: filter.limit,
      totalPages: Math.ceil(total / filter.limit),
    };
  }

  // Maintenance History
  async createMaintenanceHistory(
    createMaintenanceHistoryDto: CreateMaintenanceHistoryDto,
    userId: string
  ): Promise<MaintenanceHistory> {
    const [newHistory] = await this.db
      .insert(maintenanceHistory)
      .values({
        ...createMaintenanceHistoryDto,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return newHistory;
  }

  async updateMaintenanceHistory(
    id: string,
    updateMaintenanceHistoryDto: UpdateMaintenanceHistoryDto,
    userId: string,
    companyId: string
  ): Promise<MaintenanceHistory> {
    const existingHistory = await this.findMaintenanceHistoryById(id, companyId);

    const [updatedHistory] = await this.db
      .update(maintenanceHistory)
      .set({
        ...updateMaintenanceHistoryDto,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(eq(maintenanceHistory.id, id), eq(maintenanceHistory.companyId, companyId)))
      .returning();

    return updatedHistory;
  }

  async findMaintenanceHistoryById(id: string, companyId: string): Promise<MaintenanceHistory> {
    const [history] = await this.db
      .select()
      .from(maintenanceHistory)
      .where(and(eq(maintenanceHistory.id, id), eq(maintenanceHistory.companyId, companyId)))
      .limit(1);

    if (!history) {
      throw new NotFoundException('Maintenance history not found');
    }

    return history;
  }

  async findMaintenanceHistoryByAsset(assetId: string, companyId: string): Promise<MaintenanceHistory[]> {
    return await this.db
      .select()
      .from(maintenanceHistory)
      .where(and(eq(maintenanceHistory.assetId, assetId), eq(maintenanceHistory.companyId, companyId)))
      .orderBy(desc(maintenanceHistory.maintenanceDate));
  }

  // Spare Parts
  async createSparePart(
    createSparePartDto: CreateSparePartDto,
    userId: string
  ): Promise<SparePart> {
    // Check if part code already exists
    const existingPart = await this.db
      .select()
      .from(spareParts)
      .where(
        and(
          eq(spareParts.partCode, createSparePartDto.partCode),
          eq(spareParts.companyId, createSparePartDto.companyId)
        )
      )
      .limit(1);

    if (existingPart.length > 0) {
      throw new ConflictException('Spare part code already exists');
    }

    const [newPart] = await this.db
      .insert(spareParts)
      .values({
        ...createSparePartDto,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return newPart;
  }

  async updateSparePart(
    id: string,
    updateSparePartDto: UpdateSparePartDto,
    userId: string,
    companyId: string
  ): Promise<SparePart> {
    const existingPart = await this.findSparePartById(id, companyId);

    const [updatedPart] = await this.db
      .update(spareParts)
      .set({
        ...updateSparePartDto,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(eq(spareParts.id, id), eq(spareParts.companyId, companyId)))
      .returning();

    return updatedPart;
  }

  async findSparePartById(id: string, companyId: string): Promise<SparePart> {
    const [part] = await this.db
      .select()
      .from(spareParts)
      .where(and(eq(spareParts.id, id), eq(spareParts.companyId, companyId)))
      .limit(1);

    if (!part) {
      throw new NotFoundException('Spare part not found');
    }

    return part;
  }

  async findSpareParts(filter: SparePartFilterDto, companyId: string) {
    const conditions = [eq(spareParts.companyId, companyId)];

    // Apply filters
    if (filter.search) {
      conditions.push(
        or(
          ilike(spareParts.partCode, `%${filter.search}%`),
          ilike(spareParts.partName, `%${filter.search}%`),
          ilike(spareParts.description, `%${filter.search}%`),
          ilike(spareParts.manufacturerPartNumber, `%${filter.search}%`)
        )
      );
    }

    if (filter.itemId) {
      conditions.push(eq(spareParts.itemId, filter.itemId));
    }

    if (filter.manufacturer) {
      conditions.push(ilike(spareParts.manufacturer, `%${filter.manufacturer}%`));
    }

    if (filter.status) {
      conditions.push(eq(spareParts.status, filter.status));
    }

    if (filter.isActive !== undefined) {
      conditions.push(eq(spareParts.isActive, filter.isActive));
    }

    if (filter.lowStock) {
      conditions.push(sql`${spareParts.currentStock} <= ${spareParts.minimumStock}`);
    }

    const whereClause = and(...conditions);

    // Get total count
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(spareParts)
      .where(whereClause);

    // Get paginated results
    const offset = (filter.page - 1) * filter.limit;
    const orderBy = filter.sortOrder === 'ASC'
      ? asc(spareParts[filter.sortBy as keyof typeof spareParts] || spareParts.partName)
      : desc(spareParts[filter.sortBy as keyof typeof spareParts] || spareParts.partName);

    const results = await this.db
      .select()
      .from(spareParts)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(filter.limit)
      .offset(offset);

    return {
      data: results,
      total,
      page: filter.page,
      limit: filter.limit,
      totalPages: Math.ceil(total / filter.limit),
    };
  }

  // Maintenance Costs
  async createMaintenanceCost(
    createMaintenanceCostDto: CreateMaintenanceCostDto,
    userId: string
  ): Promise<MaintenanceCost> {
    const [newCost] = await this.db
      .insert(maintenanceCosts)
      .values({
        ...createMaintenanceCostDto,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return newCost;
  }

  async updateMaintenanceCost(
    id: string,
    updateMaintenanceCostDto: UpdateMaintenanceCostDto,
    userId: string,
    companyId: string
  ): Promise<MaintenanceCost> {
    const existingCost = await this.findMaintenanceCostById(id, companyId);

    const [updatedCost] = await this.db
      .update(maintenanceCosts)
      .set({
        ...updateMaintenanceCostDto,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(eq(maintenanceCosts.id, id), eq(maintenanceCosts.companyId, companyId)))
      .returning();

    return updatedCost;
  }

  async findMaintenanceCostById(id: string, companyId: string): Promise<MaintenanceCost> {
    const [cost] = await this.db
      .select()
      .from(maintenanceCosts)
      .where(and(eq(maintenanceCosts.id, id), eq(maintenanceCosts.companyId, companyId)))
      .limit(1);

    if (!cost) {
      throw new NotFoundException('Maintenance cost not found');
    }

    return cost;
  }

  async findMaintenanceCostsByWorkOrder(workOrderId: string, companyId: string): Promise<MaintenanceCost[]> {
    return await this.db
      .select()
      .from(maintenanceCosts)
      .where(and(eq(maintenanceCosts.workOrderId, workOrderId), eq(maintenanceCosts.companyId, companyId)))
      .orderBy(asc(maintenanceCosts.costDate));
  }

  // Helper methods
  private calculateNextDueDate(startDate: Date, frequency?: number, frequencyUnit?: string): Date | null {
    if (!frequency || !frequencyUnit) {
      return null;
    }

    const nextDate = new Date(startDate);

    switch (frequencyUnit.toLowerCase()) {
      case 'days':
        nextDate.setDate(nextDate.getDate() + frequency);
        break;
      case 'weeks':
        nextDate.setDate(nextDate.getDate() + (frequency * 7));
        break;
      case 'months':
        nextDate.setMonth(nextDate.getMonth() + frequency);
        break;
      case 'years':
        nextDate.setFullYear(nextDate.getFullYear() + frequency);
        break;
      default:
        return null;
    }

    return nextDate;
  }

  private async generateWorkOrderNumber(companyId: string): Promise<string> {
    const [{ count: workOrderCount }] = await this.db
      .select({ count: count() })
      .from(maintenanceWorkOrders)
      .where(eq(maintenanceWorkOrders.companyId, companyId));

    return `WO-${String(workOrderCount + 1).padStart(6, '0')}`;
  }

  private async createMaintenanceHistoryFromWorkOrder(
    workOrder: MaintenanceWorkOrder,
    userId: string
  ): Promise<void> {
    await this.db
      .insert(maintenanceHistory)
      .values({
        assetId: workOrder.assetId,
        workOrderId: workOrder.id,
        maintenanceDate: workOrder.actualEndDate || new Date(),
        maintenanceType: workOrder.workOrderType as any,
        description: workOrder.workPerformed || workOrder.description || '',
        downtime: workOrder.actualDuration,
        totalCost: workOrder.actualCost,
        laborCost: workOrder.laborCost,
        materialCost: workOrder.materialCost,
        performedBy: workOrder.completedBy,
        technicianNotes: workOrder.completionNotes,
        partsUsed: workOrder.partsUsed,
        companyId: workOrder.companyId,
        createdBy: userId,
        updatedBy: userId,
      });
  }

  private async updateScheduleNextDueDate(scheduleId: string, companyId: string): Promise<void> {
    const schedule = await this.findMaintenanceScheduleById(scheduleId, companyId);

    if (schedule.frequency && schedule.frequencyUnit) {
      const nextDueDate = this.calculateNextDueDate(
        new Date(),
        schedule.frequency,
        schedule.frequencyUnit
      );

      if (nextDueDate) {
        await this.db
          .update(maintenanceSchedules)
          .set({
            nextDueDate,
            lastMaintenanceDate: new Date(),
            updatedAt: new Date(),
          })
          .where(and(eq(maintenanceSchedules.id, scheduleId), eq(maintenanceSchedules.companyId, companyId)));
      }
    }
  }
}
