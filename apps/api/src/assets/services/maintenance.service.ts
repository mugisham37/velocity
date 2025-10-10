import {
  DatabaseService,
  maintenanceSchedules,
  maintenanceWorkOrders,
  maintenanceHistory,
  spareParts,
  maintenanceCosts,
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
import { and, asc, count, desc, eq, ilike, or, sql, gte, lte } from '@kiro/database';
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
    const existingSchedule = await this.db.db
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

    // Convert string date to Date object
    const scheduleData = {
      ...createMaintenanceScheduleDto,
      startDate: new Date(createMaintenanceScheduleDto.startDate),
      endDate: createMaintenanceScheduleDto.endDate ? new Date(createMaintenanceScheduleDto.endDate) : null,
      nextDueDate,
      createdBy: userId,
      updatedBy: userId,
    };

    const [newSchedule] = await this.db.db
      .insert(maintenanceSchedules)
      .values(scheduleData)
      .returning();

    if (!newSchedule) {
      throw new BadRequestException('Failed to create maintenance schedule');
    }

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

    // Convert string dates to Date objects if provided, filter out undefined values
    const updateData: any = {
      ...updateMaintenanceScheduleDto,
      nextDueDate: updateMaintenanceScheduleDto.nextDueDate ? new Date(updateMaintenanceScheduleDto.nextDueDate) : nextDueDate,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    // Only add date fields if provided
    if (updateMaintenanceScheduleDto.startDate) {
      updateData.startDate = new Date(updateMaintenanceScheduleDto.startDate);
    }
    if (updateMaintenanceScheduleDto.endDate) {
      updateData.endDate = new Date(updateMaintenanceScheduleDto.endDate);
    }
    if (updateMaintenanceScheduleDto.lastMaintenanceDate) {
      updateData.lastMaintenanceDate = new Date(updateMaintenanceScheduleDto.lastMaintenanceDate);
    }

    const [updatedSchedule] = await this.db.db
      .update(maintenanceSchedules)
      .set(updateData)
      .where(and(eq(maintenanceSchedules.id, id), eq(maintenanceSchedules.companyId, companyId)))
      .returning();

    if (!updatedSchedule) {
      throw new NotFoundException('Maintenance schedule not found or update failed');
    }

    return updatedSchedule;
  }

  async findMaintenanceScheduleById(id: string, companyId: string): Promise<MaintenanceSchedule> {
    const [schedule] = await this.db.db
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
      const searchCondition = or(
        ilike(maintenanceSchedules.scheduleCode, `%${filter.search}%`),
        ilike(maintenanceSchedules.scheduleName, `%${filter.search}%`),
        ilike(maintenanceSchedules.description, `%${filter.search}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
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

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Get total count
    const countResult = await this.db.db
      .select({ total: count() })
      .from(maintenanceSchedules)
      .where(whereClause);

    const total = countResult[0]?.total ?? 0;

    // Get paginated results with proper defaults
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const offset = (page - 1) * limit;
    
    // Handle sorting with proper column validation
    const sortBy = filter.sortBy || 'nextDueDate';
    const sortOrder = filter.sortOrder === 'ASC' ? asc : desc;
    
    let orderBy;
    switch (sortBy) {
      case 'scheduleCode':
        orderBy = sortOrder(maintenanceSchedules.scheduleCode);
        break;
      case 'scheduleName':
        orderBy = sortOrder(maintenanceSchedules.scheduleName);
        break;
      case 'createdAt':
        orderBy = sortOrder(maintenanceSchedules.createdAt);
        break;
      case 'updatedAt':
        orderBy = sortOrder(maintenanceSchedules.updatedAt);
        break;
      default:
        orderBy = sortOrder(maintenanceSchedules.nextDueDate);
    }

    const results = await this.db.db
      .select()
      .from(maintenanceSchedules)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      data: results,
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    };
  }

  // Maintenance Work Orders
  async createMaintenanceWorkOrder(
    createMaintenanceWorkOrderDto: CreateMaintenanceWorkOrderDto,
    userId: string
  ): Promise<MaintenanceWorkOrder> {
    // Generate work order number
    const workOrderNumber = await this.generateWorkOrderNumber(createMaintenanceWorkOrderDto.companyId);

    // Convert string dates to Date objects
    const workOrderData = {
      ...createMaintenanceWorkOrderDto,
      workOrderNumber,
      scheduledStartDate: createMaintenanceWorkOrderDto.scheduledStartDate ? new Date(createMaintenanceWorkOrderDto.scheduledStartDate) : null,
      scheduledEndDate: createMaintenanceWorkOrderDto.scheduledEndDate ? new Date(createMaintenanceWorkOrderDto.scheduledEndDate) : null,
      createdBy: userId,
      updatedBy: userId,
    };

    const [newWorkOrder] = await this.db.db
      .insert(maintenanceWorkOrders)
      .values(workOrderData)
      .returning();

    if (!newWorkOrder) {
      throw new BadRequestException('Failed to create maintenance work order');
    }

    return newWorkOrder;
  }

  async updateMaintenanceWorkOrder(
    id: string,
    updateMaintenanceWorkOrderDto: UpdateMaintenanceWorkOrderDto,
    userId: string,
    companyId: string
  ): Promise<MaintenanceWorkOrder> {
    await this.findMaintenanceWorkOrderById(id, companyId);

    // Convert string dates to Date objects if provided, filter out undefined values
    const updateData: any = {
      ...updateMaintenanceWorkOrderDto,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    // Only add date fields if provided
    if (updateMaintenanceWorkOrderDto.scheduledStartDate) {
      updateData.scheduledStartDate = new Date(updateMaintenanceWorkOrderDto.scheduledStartDate);
    }
    if (updateMaintenanceWorkOrderDto.scheduledEndDate) {
      updateData.scheduledEndDate = new Date(updateMaintenanceWorkOrderDto.scheduledEndDate);
    }
    if (updateMaintenanceWorkOrderDto.actualStartDate) {
      updateData.actualStartDate = new Date(updateMaintenanceWorkOrderDto.actualStartDate);
    }
    if (updateMaintenanceWorkOrderDto.actualEndDate) {
      updateData.actualEndDate = new Date(updateMaintenanceWorkOrderDto.actualEndDate);
    }

    const [updatedWorkOrder] = await this.db.db
      .update(maintenanceWorkOrders)
      .set(updateData)
      .where(and(eq(maintenanceWorkOrders.id, id), eq(maintenanceWorkOrders.companyId, companyId)))
      .returning();

    if (!updatedWorkOrder) {
      throw new NotFoundException('Maintenance work order not found or update failed');
    }

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

    const [startedWorkOrder] = await this.db.db
      .update(maintenanceWorkOrders)
      .set({
        status: WorkOrderStatus.IN_PROGRESS,
        actualStartDate: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(eq(maintenanceWorkOrders.id, id), eq(maintenanceWorkOrders.companyId, companyId)))
      .returning();

    if (!startedWorkOrder) {
      throw new NotFoundException('Maintenance work order not found or start failed');
    }

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

    // Prepare completion data, filtering out undefined values
    const completionData: any = {
      status: WorkOrderStatus.COMPLETED,
      actualEndDate: new Date(),
      completionPercentage: 100,
      workPerformed: completeMaintenanceWorkOrderDto.workPerformed,
      completedBy: userId,
      completedAt: new Date(),
      updatedBy: userId,
      updatedAt: new Date(),
    };

    // Only add optional fields if they have values
    if (completeMaintenanceWorkOrderDto.partsUsed !== undefined) {
      completionData.partsUsed = completeMaintenanceWorkOrderDto.partsUsed;
    }
    if (completeMaintenanceWorkOrderDto.completionNotes !== undefined) {
      completionData.completionNotes = completeMaintenanceWorkOrderDto.completionNotes;
    }
    if (completeMaintenanceWorkOrderDto.actualCost !== undefined) {
      completionData.actualCost = completeMaintenanceWorkOrderDto.actualCost;
    }
    if (completeMaintenanceWorkOrderDto.laborCost !== undefined) {
      completionData.laborCost = completeMaintenanceWorkOrderDto.laborCost;
    }
    if (completeMaintenanceWorkOrderDto.materialCost !== undefined) {
      completionData.materialCost = completeMaintenanceWorkOrderDto.materialCost;
    }
    if (completeMaintenanceWorkOrderDto.externalServiceCost !== undefined) {
      completionData.externalServiceCost = completeMaintenanceWorkOrderDto.externalServiceCost;
    }
    if (completeMaintenanceWorkOrderDto.actualDuration !== undefined) {
      completionData.actualDuration = completeMaintenanceWorkOrderDto.actualDuration;
    }
    if (completeMaintenanceWorkOrderDto.qualityChecks !== undefined) {
      completionData.qualityChecks = completeMaintenanceWorkOrderDto.qualityChecks;
    }

    const [completedWorkOrder] = await this.db.db
      .update(maintenanceWorkOrders)
      .set(completionData)
      .where(and(eq(maintenanceWorkOrders.id, id), eq(maintenanceWorkOrders.companyId, completeMaintenanceWorkOrderDto.companyId)))
      .returning();

    if (!completedWorkOrder) {
      throw new NotFoundException('Maintenance work order not found or completion failed');
    }

    // Create maintenance history entry
    await this.createMaintenanceHistoryFromWorkOrder(completedWorkOrder, userId);

    // Update maintenance schedule next due date if this was a scheduled maintenance
    if (workOrder.scheduleId) {
      await this.updateScheduleNextDueDate(workOrder.scheduleId, completeMaintenanceWorkOrderDto.companyId);
    }

    return completedWorkOrder;
  }

  async findMaintenanceWorkOrderById(id: string, companyId: string): Promise<MaintenanceWorkOrder> {
    const [workOrder] = await this.db.db
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
      const searchCondition = or(
        ilike(maintenanceWorkOrders.workOrderNumber, `%${filter.search}%`),
        ilike(maintenanceWorkOrders.title, `%${filter.search}%`),
        ilike(maintenanceWorkOrders.description, `%${filter.search}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
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

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Get total count
    const countResult = await this.db.db
      .select({ total: count() })
      .from(maintenanceWorkOrders)
      .where(whereClause);

    const total = countResult[0]?.total ?? 0;

    // Get paginated results with proper defaults
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const offset = (page - 1) * limit;
    
    // Handle sorting with proper column validation
    const sortBy = filter.sortBy || 'scheduledStartDate';
    const sortOrder = filter.sortOrder === 'ASC' ? asc : desc;
    
    let orderBy;
    switch (sortBy) {
      case 'workOrderNumber':
        orderBy = sortOrder(maintenanceWorkOrders.workOrderNumber);
        break;
      case 'title':
        orderBy = sortOrder(maintenanceWorkOrders.title);
        break;
      case 'createdAt':
        orderBy = sortOrder(maintenanceWorkOrders.createdAt);
        break;
      case 'updatedAt':
        orderBy = sortOrder(maintenanceWorkOrders.updatedAt);
        break;
      default:
        orderBy = sortOrder(maintenanceWorkOrders.scheduledStartDate);
    }

    const results = await this.db.db
      .select()
      .from(maintenanceWorkOrders)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      data: results,
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    };
  }

  // Maintenance History
  async createMaintenanceHistory(
    createMaintenanceHistoryDto: CreateMaintenanceHistoryDto,
    userId: string
  ): Promise<MaintenanceHistory> {
    // Convert string dates to Date objects
    const historyData = {
      ...createMaintenanceHistoryDto,
      maintenanceDate: new Date(createMaintenanceHistoryDto.maintenanceDate),
      followUpDate: createMaintenanceHistoryDto.followUpDate ? new Date(createMaintenanceHistoryDto.followUpDate) : null,
      createdBy: userId,
      updatedBy: userId,
    };

    const [newHistory] = await this.db.db
      .insert(maintenanceHistory)
      .values(historyData)
      .returning();

    if (!newHistory) {
      throw new BadRequestException('Failed to create maintenance history');
    }

    return newHistory;
  }

  async updateMaintenanceHistory(
    id: string,
    updateMaintenanceHistoryDto: UpdateMaintenanceHistoryDto,
    userId: string,
    companyId: string
  ): Promise<MaintenanceHistory> {
    await this.findMaintenanceHistoryById(id, companyId);

    // Convert string dates to Date objects if provided, filter out undefined values
    const updateData: any = {
      ...updateMaintenanceHistoryDto,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    // Only add date fields if provided
    if (updateMaintenanceHistoryDto.maintenanceDate) {
      updateData.maintenanceDate = new Date(updateMaintenanceHistoryDto.maintenanceDate);
    }
    if (updateMaintenanceHistoryDto.followUpDate) {
      updateData.followUpDate = new Date(updateMaintenanceHistoryDto.followUpDate);
    }

    const [updatedHistory] = await this.db.db
      .update(maintenanceHistory)
      .set(updateData)
      .where(and(eq(maintenanceHistory.id, id), eq(maintenanceHistory.companyId, companyId)))
      .returning();

    if (!updatedHistory) {
      throw new NotFoundException('Maintenance history not found or update failed');
    }

    return updatedHistory;
  }

  async findMaintenanceHistoryById(id: string, companyId: string): Promise<MaintenanceHistory> {
    const [history] = await this.db.db
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
    return await this.db.db
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
    const existingPart = await this.db.db
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

    const [newPart] = await this.db.db
      .insert(spareParts)
      .values({
        ...createSparePartDto,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    if (!newPart) {
      throw new BadRequestException('Failed to create spare part');
    }

    return newPart;
  }

  async updateSparePart(
    id: string,
    updateSparePartDto: UpdateSparePartDto,
    userId: string,
    companyId: string
  ): Promise<SparePart> {
    await this.findSparePartById(id, companyId);

    const [updatedPart] = await this.db.db
      .update(spareParts)
      .set({
        ...updateSparePartDto,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(eq(spareParts.id, id), eq(spareParts.companyId, companyId)))
      .returning();

    if (!updatedPart) {
      throw new NotFoundException('Spare part not found or update failed');
    }

    return updatedPart;
  }

  async findSparePartById(id: string, companyId: string): Promise<SparePart> {
    const result = await this.db.db
      .select()
      .from(spareParts)
      .where(and(eq(spareParts.id, id), eq(spareParts.companyId, companyId)))
      .limit(1);

    const part = result[0];
    if (!part) {
      throw new NotFoundException('Spare part not found');
    }

    return part;
  }

  async findSpareParts(filter: SparePartFilterDto, companyId: string) {
    const conditions = [eq(spareParts.companyId, companyId)];

    // Apply filters
    if (filter.search) {
      const searchCondition = or(
        ilike(spareParts.partCode, `%${filter.search}%`),
        ilike(spareParts.partName, `%${filter.search}%`),
        ilike(spareParts.description, `%${filter.search}%`),
        ilike(spareParts.manufacturerPartNumber, `%${filter.search}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
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

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Get total count
    const countResult = await this.db.db
      .select({ total: count() })
      .from(spareParts)
      .where(whereClause);

    const total = countResult[0]?.total ?? 0;

    // Get paginated results with proper defaults
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const offset = (page - 1) * limit;
    
    // Handle sorting with proper column validation
    const sortBy = filter.sortBy || 'partName';
    const sortOrder = filter.sortOrder === 'ASC' ? asc : desc;
    
    let orderBy;
    switch (sortBy) {
      case 'partCode':
        orderBy = sortOrder(spareParts.partCode);
        break;
      case 'manufacturer':
        orderBy = sortOrder(spareParts.manufacturer);
        break;
      case 'createdAt':
        orderBy = sortOrder(spareParts.createdAt);
        break;
      case 'updatedAt':
        orderBy = sortOrder(spareParts.updatedAt);
        break;
      default:
        orderBy = sortOrder(spareParts.partName);
    }

    const results = await this.db.db
      .select()
      .from(spareParts)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      data: results,
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    };
  }

  // Maintenance Costs
  async createMaintenanceCost(
    createMaintenanceCostDto: CreateMaintenanceCostDto,
    userId: string
  ): Promise<MaintenanceCost> {
    // Convert string date to Date object
    const costData = {
      ...createMaintenanceCostDto,
      costDate: new Date(createMaintenanceCostDto.costDate),
      createdBy: userId,
      updatedBy: userId,
    };

    const [newCost] = await this.db.db
      .insert(maintenanceCosts)
      .values(costData)
      .returning();

    if (!newCost) {
      throw new BadRequestException('Failed to create maintenance cost');
    }

    return newCost;
  }

  async updateMaintenanceCost(
    id: string,
    updateMaintenanceCostDto: UpdateMaintenanceCostDto,
    userId: string,
    companyId: string
  ): Promise<MaintenanceCost> {
    await this.findMaintenanceCostById(id, companyId);

    // Convert string date to Date object if provided, filter out undefined values
    const updateData: any = {
      ...updateMaintenanceCostDto,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    // Only add costDate if provided
    if (updateMaintenanceCostDto.costDate) {
      updateData.costDate = new Date(updateMaintenanceCostDto.costDate);
    }

    const [updatedCost] = await this.db.db
      .update(maintenanceCosts)
      .set(updateData)
      .where(and(eq(maintenanceCosts.id, id), eq(maintenanceCosts.companyId, companyId)))
      .returning();

    if (!updatedCost) {
      throw new NotFoundException('Maintenance cost not found or update failed');
    }

    return updatedCost;
  }

  async findMaintenanceCostById(id: string, companyId: string): Promise<MaintenanceCost> {
    const [cost] = await this.db.db
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
    return await this.db.db
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
    const countResult = await this.db.db
      .select({ count: count() })
      .from(maintenanceWorkOrders)
      .where(eq(maintenanceWorkOrders.companyId, companyId));

    const workOrderCount = countResult[0]?.count ?? 0;
    return `WO-${String(Number(workOrderCount) + 1).padStart(6, '0')}`;
  }

  private async createMaintenanceHistoryFromWorkOrder(
    workOrder: MaintenanceWorkOrder,
    userId: string
  ): Promise<void> {
    await this.db.db
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
        await this.db.db
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
