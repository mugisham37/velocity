import {
  DatabaseService,
  assetRevaluations,
  assets,
  depreciationEntries,
  depreciationMethods,
  depreciationSchedules,
  type AssetRevaluation,
  type DepreciationEntry,
  type DepreciationMethod,
  type DepreciationSchedule,
} from '../../database';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, gte, lte } from '../../database';
import {
  AssetRevaluationFilterDto,
  CreateAssetRevaluationDto,
  CreateDepreciationEntryDto,
  CreateDepreciationMethodDto,
  CreateDepreciationScheduleDto,
  DepreciationEntryFilterDto,
  DepreciationScheduleFilterDto,
  RevaluationStatus,
  ReverseDepreciationEntryDto,
  UpdateAssetRevaluationDto,
  UpdateDepreciationEntryDto,
  UpdateDepreciationMethodDto,
  UpdateDepreciationScheduleDto,
} from '../dto/depreciation.dto';

@Injectable()
export class DepreciationService {
  constructor(private readonly db: DatabaseService) {}

  // Depreciation Schedules
  async createDepreciationSchedule(
    createDepreciationScheduleDto: CreateDepreciationScheduleDto,
    userId: string
  ): Promise<DepreciationSchedule> {
    // Check if asset already has an active depreciation schedule
    const existingSchedule = await this.db.db
      .select()
      .from(depreciationSchedules)
      .where(
        and(
          eq(
            depreciationSchedules.assetId,
            createDepreciationScheduleDto.assetId
          ),
          eq(
            depreciationSchedules.companyId,
            createDepreciationScheduleDto.companyId
          ),
          eq(depreciationSchedules.isActive, true)
        )
      )
      .limit(1);

    if (existingSchedule.length > 0) {
      throw new ConflictException(
        'Asset already has an active depreciation schedule'
      );
    }

    // Generate schedule number
    const scheduleNumber = await this.generateScheduleNumber(
      createDepreciationScheduleDto.companyId
    );

    // Calculate depreciable amount
    const assetCost = parseFloat(createDepreciationScheduleDto.assetCost);
    const salvageValue = parseFloat(
      createDepreciationScheduleDto.salvageValue || '0'
    );
    const depreciableAmount = assetCost - salvageValue;

    // Calculate end date
    const startDate = new Date(createDepreciationScheduleDto.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(
      endDate.getMonth() + createDepreciationScheduleDto.usefulLife
    );

    // Convert string date to Date object
    const scheduleData = {
      ...createDepreciationScheduleDto,
      scheduleNumber,
      startDate: new Date(createDepreciationScheduleDto.startDate),
      depreciableAmount: depreciableAmount.toString(),
      endDate,
      createdBy: userId,
      updatedBy: userId,
    };

    const [newSchedule] = await this.db.db
      .insert(depreciationSchedules)
      .values(scheduleData)
      .returning();

    if (!newSchedule) {
      throw new BadRequestException('Failed to create depreciation schedule');
    }

    return newSchedule;
  }

  async updateDepreciationSchedule(
    id: string,
    updateDepreciationScheduleDto: UpdateDepreciationScheduleDto,
    userId: string,
    companyId: string
  ): Promise<DepreciationSchedule> {
    const existingSchedule = await this.findDepreciationScheduleById(
      id,
      companyId
    );

    // Recalculate depreciable amount if asset cost or salvage value changed
    let depreciableAmount = existingSchedule.depreciableAmount;
    if (
      updateDepreciationScheduleDto.assetCost ||
      updateDepreciationScheduleDto.salvageValue
    ) {
      const assetCost = parseFloat(
        updateDepreciationScheduleDto.assetCost || existingSchedule.assetCost
      );
      const salvageValue = parseFloat(
        updateDepreciationScheduleDto.salvageValue ||
          existingSchedule.salvageValue ||
          '0'
      );
      depreciableAmount = (assetCost - salvageValue).toString();
    }

    // Recalculate end date if start date or useful life changed
    let endDate = existingSchedule.endDate;
    if (
      updateDepreciationScheduleDto.startDate ||
      updateDepreciationScheduleDto.usefulLife
    ) {
      const startDate = new Date(
        updateDepreciationScheduleDto.startDate || existingSchedule.startDate
      );
      const usefulLife =
        updateDepreciationScheduleDto.usefulLife || existingSchedule.usefulLife;
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + usefulLife);
    }

    // Convert string date to Date object if provided, filter out undefined values
    const updateData: any = {
      ...updateDepreciationScheduleDto,
      depreciableAmount,
      endDate,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    // Only add startDate if provided
    if (updateDepreciationScheduleDto.startDate) {
      updateData.startDate = new Date(updateDepreciationScheduleDto.startDate);
    }

    const [updatedSchedule] = await this.db.db
      .update(depreciationSchedules)
      .set(updateData)
      .where(
        and(
          eq(depreciationSchedules.id, id),
          eq(depreciationSchedules.companyId, companyId)
        )
      )
      .returning();

    if (!updatedSchedule) {
      throw new NotFoundException('Depreciation schedule not found or update failed');
    }

    return updatedSchedule;
  }

  async findDepreciationScheduleById(
    id: string,
    companyId: string
  ): Promise<DepreciationSchedule> {
    const [schedule] = await this.db.db
      .select()
      .from(depreciationSchedules)
      .where(
        and(
          eq(depreciationSchedules.id, id),
          eq(depreciationSchedules.companyId, companyId)
        )
      )
      .limit(1);

    if (!schedule) {
      throw new NotFoundException('Depreciation schedule not found');
    }

    return schedule;
  }

  async findDepreciationSchedules(
    filter: DepreciationScheduleFilterDto,
    companyId: string
  ) {
    const conditions = [eq(depreciationSchedules.companyId, companyId)];

    // Apply filters
    if (filter.assetId) {
      conditions.push(eq(depreciationSchedules.assetId, filter.assetId));
    }

    if (filter.depreciationMethod) {
      conditions.push(
        eq(depreciationSchedules.depreciationMethod, filter.depreciationMethod)
      );
    }

    if (filter.status) {
      conditions.push(eq(depreciationSchedules.status, filter.status));
    }

    if (filter.isActive !== undefined) {
      conditions.push(eq(depreciationSchedules.isActive, filter.isActive));
    }

    if (filter.startDateFrom) {
      conditions.push(
        gte(depreciationSchedules.startDate, new Date(filter.startDateFrom))
      );
    }

    if (filter.startDateTo) {
      conditions.push(
        lte(depreciationSchedules.startDate, new Date(filter.startDateTo))
      );
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Get total count
    const countResult = await this.db.db
      .select({ total: count() })
      .from(depreciationSchedules)
      .where(whereClause);

    const total = countResult[0]?.total ?? 0;

    // Get paginated results with proper defaults
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const offset = (page - 1) * limit;
    
    // Handle sorting with proper column validation
    const sortBy = filter.sortBy || 'createdAt';
    const sortOrder = filter.sortOrder === 'ASC' ? asc : desc;
    
    let orderBy;
    switch (sortBy) {
      case 'scheduleNumber':
        orderBy = sortOrder(depreciationSchedules.scheduleNumber);
        break;
      case 'startDate':
        orderBy = sortOrder(depreciationSchedules.startDate);
        break;
      case 'endDate':
        orderBy = sortOrder(depreciationSchedules.endDate);
        break;
      case 'updatedAt':
        orderBy = sortOrder(depreciationSchedules.updatedAt);
        break;
      default:
        orderBy = sortOrder(depreciationSchedules.createdAt);
    }

    const results = await this.db.db
      .select()
      .from(depreciationSchedules)
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

  // Depreciation Entries
  async createDepreciationEntry(
    createDepreciationEntryDto: CreateDepreciationEntryDto,
    userId: string
  ): Promise<DepreciationEntry> {
    // Get the depreciation schedule
    const schedule = await this.findDepreciationScheduleById(
      createDepreciationEntryDto.scheduleId,
      createDepreciationEntryDto.companyId
    );

    // Generate entry number
    const entryNumber = await this.generateEntryNumber(
      createDepreciationEntryDto.companyId
    );

    // Calculate accumulated depreciation and book value
    const depreciationAmount = parseFloat(
      createDepreciationEntryDto.depreciationAmount
    );

    // Get previous accumulated depreciation
    const [previousEntry] = await this.db.db
      .select()
      .from(depreciationEntries)
      .where(
        and(
          eq(
            depreciationEntries.scheduleId,
            createDepreciationEntryDto.scheduleId
          ),
          eq(
            depreciationEntries.companyId,
            createDepreciationEntryDto.companyId
          )
        )
      )
      .orderBy(desc(depreciationEntries.depreciationDate))
      .limit(1);

    const previousAccumulated = previousEntry
      ? parseFloat(previousEntry.accumulatedDepreciation)
      : 0;
    const accumulatedDepreciation = previousAccumulated + depreciationAmount;
    const assetCost = parseFloat(schedule.assetCost);
    const bookValue = assetCost - accumulatedDepreciation;

    // Calculate tax depreciation if provided
    let taxAccumulatedDepreciation: string | undefined;
    let taxBookValue: string | undefined;
    if (createDepreciationEntryDto.taxDepreciationAmount) {
      const taxDepreciationAmount = parseFloat(
        createDepreciationEntryDto.taxDepreciationAmount
      );
      const previousTaxAccumulated = previousEntry
        ? parseFloat(previousEntry.taxAccumulatedDepreciation || '0')
        : 0;
      taxAccumulatedDepreciation = (
        previousTaxAccumulated + taxDepreciationAmount
      ).toString();
      taxBookValue = (
        assetCost - parseFloat(taxAccumulatedDepreciation)
      ).toString();
    }

    // Convert string dates to Date objects
    const entryData: any = {
      ...createDepreciationEntryDto,
      entryNumber,
      depreciationDate: new Date(createDepreciationEntryDto.depreciationDate),
      periodStartDate: new Date(createDepreciationEntryDto.periodStartDate),
      periodEndDate: new Date(createDepreciationEntryDto.periodEndDate),
      accumulatedDepreciation: accumulatedDepreciation.toString(),
      bookValue: bookValue.toString(),
      createdBy: userId,
      updatedBy: userId,
    };

    // Only add tax fields if they have values
    if (taxAccumulatedDepreciation !== undefined) {
      entryData.taxAccumulatedDepreciation = taxAccumulatedDepreciation;
    }
    if (taxBookValue !== undefined) {
      entryData.taxBookValue = taxBookValue;
    }

    const [newEntry] = await this.db.db
      .insert(depreciationEntries)
      .values(entryData)
      .returning();

    if (!newEntry) {
      throw new BadRequestException('Failed to create depreciation entry');
    }

    return newEntry;
  }

  async updateDepreciationEntry(
    id: string,
    updateDepreciationEntryDto: UpdateDepreciationEntryDto,
    userId: string,
    companyId: string
  ): Promise<DepreciationEntry> {
    const existingEntry = await this.findDepreciationEntryById(id, companyId);

    if (existingEntry.isPosted) {
      throw new BadRequestException('Cannot update posted depreciation entry');
    }

    // Convert string dates to Date objects if provided, filter out undefined values
    const updateData: any = {
      ...updateDepreciationEntryDto,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    // Only add date fields if provided
    if (updateDepreciationEntryDto.depreciationDate) {
      updateData.depreciationDate = new Date(updateDepreciationEntryDto.depreciationDate);
    }
    if (updateDepreciationEntryDto.periodStartDate) {
      updateData.periodStartDate = new Date(updateDepreciationEntryDto.periodStartDate);
    }
    if (updateDepreciationEntryDto.periodEndDate) {
      updateData.periodEndDate = new Date(updateDepreciationEntryDto.periodEndDate);
    }

    const [updatedEntry] = await this.db.db
      .update(depreciationEntries)
      .set(updateData)
      .where(
        and(
          eq(depreciationEntries.id, id),
          eq(depreciationEntries.companyId, companyId)
        )
      )
      .returning();

    if (!updatedEntry) {
      throw new NotFoundException('Depreciation entry not found or update failed');
    }

    return updatedEntry;
  }

  async postDepreciationEntry(
    id: string,
    userId: string,
    companyId: string
  ): Promise<DepreciationEntry> {
    const entry = await this.findDepreciationEntryById(id, companyId);

    if (entry.isPosted) {
      throw new BadRequestException('Depreciation entry is already posted');
    }

    // Here you would create the GL entry
    // For now, we'll just mark it as posted
    const [postedEntry] = await this.db.db
      .update(depreciationEntries)
      .set({
        isPosted: true,
        postedAt: new Date(),
        postedBy: userId,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(depreciationEntries.id, id),
          eq(depreciationEntries.companyId, companyId)
        )
      )
      .returning();

    if (!postedEntry) {
      throw new NotFoundException('Depreciation entry not found or posting failed');
    }

    return postedEntry;
  }

  async reverseDepreciationEntry(
    id: string,
    reverseDepreciationEntryDto: ReverseDepreciationEntryDto,
    userId: string
  ): Promise<DepreciationEntry> {
    const entry = await this.findDepreciationEntryById(
      id,
      reverseDepreciationEntryDto.companyId
    );

    if (!entry.isPosted) {
      throw new BadRequestException('Only posted entries can be reversed');
    }

    if (entry.isReversed) {
      throw new BadRequestException('Entry is already reversed');
    }

    const [reversedEntry] = await this.db.db
      .update(depreciationEntries)
      .set({
        isReversed: true,
        reversedAt: new Date(),
        reversedBy: userId,
        reversalReason: reverseDepreciationEntryDto.reversalReason,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(depreciationEntries.id, id),
          eq(
            depreciationEntries.companyId,
            reverseDepreciationEntryDto.companyId
          )
        )
      )
      .returning();

    if (!reversedEntry) {
      throw new NotFoundException('Depreciation entry not found or reversal failed');
    }

    return reversedEntry;
  }

  async findDepreciationEntryById(
    id: string,
    companyId: string
  ): Promise<DepreciationEntry> {
    const [entry] = await this.db.db
      .select()
      .from(depreciationEntries)
      .where(
        and(
          eq(depreciationEntries.id, id),
          eq(depreciationEntries.companyId, companyId)
        )
      )
      .limit(1);

    if (!entry) {
      throw new NotFoundException('Depreciation entry not found');
    }

    return entry;
  }

  async findDepreciationEntries(
    filter: DepreciationEntryFilterDto,
    companyId: string
  ) {
    const conditions = [eq(depreciationEntries.companyId, companyId)];

    // Apply filters
    if (filter.scheduleId) {
      conditions.push(eq(depreciationEntries.scheduleId, filter.scheduleId));
    }

    if (filter.isPosted !== undefined) {
      conditions.push(eq(depreciationEntries.isPosted, filter.isPosted));
    }

    if (filter.isReversed !== undefined) {
      conditions.push(eq(depreciationEntries.isReversed, filter.isReversed));
    }

    if (filter.depreciationDateFrom) {
      conditions.push(
        gte(
          depreciationEntries.depreciationDate,
          new Date(filter.depreciationDateFrom)
        )
      );
    }

    if (filter.depreciationDateTo) {
      conditions.push(
        lte(
          depreciationEntries.depreciationDate,
          new Date(filter.depreciationDateTo)
        )
      );
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Get total count
    const countResult = await this.db.db
      .select({ total: count() })
      .from(depreciationEntries)
      .where(whereClause);

    const total = countResult[0]?.total ?? 0;

    // Get paginated results with proper defaults
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const offset = (page - 1) * limit;
    
    // Handle sorting with proper column validation
    const sortBy = filter.sortBy || 'depreciationDate';
    const sortOrder = filter.sortOrder === 'ASC' ? asc : desc;
    
    let orderBy;
    switch (sortBy) {
      case 'entryNumber':
        orderBy = sortOrder(depreciationEntries.entryNumber);
        break;
      case 'createdAt':
        orderBy = sortOrder(depreciationEntries.createdAt);
        break;
      case 'updatedAt':
        orderBy = sortOrder(depreciationEntries.updatedAt);
        break;
      default:
        orderBy = sortOrder(depreciationEntries.depreciationDate);
    }

    const results = await this.db.db
      .select()
      .from(depreciationEntries)
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

  // Asset Revaluations
  async createAssetRevaluation(
    createAssetRevaluationDto: CreateAssetRevaluationDto,
    userId: string
  ): Promise<AssetRevaluation> {
    // Generate revaluation number
    const revaluationNumber = await this.generateRevaluationNumber(
      createAssetRevaluationDto.companyId
    );

    // Calculate revaluation surplus
    const newFairValue = parseFloat(createAssetRevaluationDto.newFairValue);
    const previousBookValue = parseFloat(
      createAssetRevaluationDto.previousBookValue
    );
    const revaluationSurplus = newFairValue - previousBookValue;

    // Convert string date to Date object
    const revaluationData = {
      ...createAssetRevaluationDto,
      revaluationNumber,
      revaluationDate: new Date(createAssetRevaluationDto.revaluationDate),
      revaluationSurplus: revaluationSurplus.toString(),
      createdBy: userId,
      updatedBy: userId,
    };

    const [newRevaluation] = await this.db.db
      .insert(assetRevaluations)
      .values(revaluationData)
      .returning();

    if (!newRevaluation) {
      throw new BadRequestException('Failed to create asset revaluation');
    }

    return newRevaluation;
  }

  async updateAssetRevaluation(
    id: string,
    updateAssetRevaluationDto: UpdateAssetRevaluationDto,
    userId: string,
    companyId: string
  ): Promise<AssetRevaluation> {
    const existingRevaluation = await this.findAssetRevaluationById(
      id,
      companyId
    );

    if (existingRevaluation.isPosted) {
      throw new BadRequestException('Cannot update posted revaluation');
    }

    // Recalculate revaluation surplus if values changed
    let revaluationSurplus = existingRevaluation.revaluationSurplus;
    if (
      updateAssetRevaluationDto.newFairValue ||
      updateAssetRevaluationDto.previousBookValue
    ) {
      const newFairValue = parseFloat(
        updateAssetRevaluationDto.newFairValue ||
          existingRevaluation.newFairValue
      );
      const previousBookValue = parseFloat(
        updateAssetRevaluationDto.previousBookValue ||
          existingRevaluation.previousBookValue
      );
      revaluationSurplus = (newFairValue - previousBookValue).toString();
    }

    // Convert string date to Date object if provided, filter out undefined values
    const updateData: any = {
      ...updateAssetRevaluationDto,
      revaluationSurplus,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    // Only add revaluationDate if provided
    if (updateAssetRevaluationDto.revaluationDate) {
      updateData.revaluationDate = new Date(updateAssetRevaluationDto.revaluationDate);
    }

    const [updatedRevaluation] = await this.db.db
      .update(assetRevaluations)
      .set(updateData)
      .where(
        and(
          eq(assetRevaluations.id, id),
          eq(assetRevaluations.companyId, companyId)
        )
      )
      .returning();

    if (!updatedRevaluation) {
      throw new NotFoundException('Asset revaluation not found or update failed');
    }

    return updatedRevaluation;
  }

  async approveAssetRevaluation(
    id: string,
    userId: string,
    companyId: string
  ): Promise<AssetRevaluation> {
    const revaluation = await this.findAssetRevaluationById(id, companyId);

    if (revaluation.status !== RevaluationStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        'Only pending revaluations can be approved'
      );
    }

    const [approvedRevaluation] = await this.db.db
      .update(assetRevaluations)
      .set({
        status: RevaluationStatus.APPROVED,
        approvedBy: userId,
        approvedAt: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(assetRevaluations.id, id),
          eq(assetRevaluations.companyId, companyId)
        )
      )
      .returning();

    if (!approvedRevaluation) {
      throw new NotFoundException('Asset revaluation not found or approval failed');
    }

    return approvedRevaluation;
  }

  async postAssetRevaluation(
    id: string,
    userId: string,
    companyId: string
  ): Promise<AssetRevaluation> {
    const revaluation = await this.findAssetRevaluationById(id, companyId);

    if (revaluation.status !== RevaluationStatus.APPROVED) {
      throw new BadRequestException('Only approved revaluations can be posted');
    }

    // Here you would create the GL entry and update asset value
    // For now, we'll just mark it as posted
    const [postedRevaluation] = await this.db.db
      .update(assetRevaluations)
      .set({
        status: RevaluationStatus.POSTED,
        isPosted: true,
        postedAt: new Date(),
        postedBy: userId,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(assetRevaluations.id, id),
          eq(assetRevaluations.companyId, companyId)
        )
      )
      .returning();

    if (!postedRevaluation) {
      throw new NotFoundException('Asset revaluation not found or posting failed');
    }

    // Update asset current value
    await this.db.db
      .update(assets)
      .set({
        currentValue: revaluation.newFairValue,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(eq(assets.id, revaluation.assetId), eq(assets.companyId, companyId))
      );

    return postedRevaluation;
  }

  async findAssetRevaluationById(
    id: string,
    companyId: string
  ): Promise<AssetRevaluation> {
    const [revaluation] = await this.db.db
      .select()
      .from(assetRevaluations)
      .where(
        and(
          eq(assetRevaluations.id, id),
          eq(assetRevaluations.companyId, companyId)
        )
      )
      .limit(1);

    if (!revaluation) {
      throw new NotFoundException('Asset revaluation not found');
    }

    return revaluation;
  }

  async findAssetRevaluations(
    filter: AssetRevaluationFilterDto,
    companyId: string
  ) {
    const conditions = [eq(assetRevaluations.companyId, companyId)];

    // Apply filters
    if (filter.assetId) {
      conditions.push(eq(assetRevaluations.assetId, filter.assetId));
    }

    if (filter.revaluationMethod) {
      conditions.push(
        eq(assetRevaluations.revaluationMethod, filter.revaluationMethod)
      );
    }

    if (filter.status) {
      conditions.push(eq(assetRevaluations.status, filter.status));
    }

    if (filter.isPosted !== undefined) {
      conditions.push(eq(assetRevaluations.isPosted, filter.isPosted));
    }

    if (filter.revaluationDateFrom) {
      conditions.push(
        gte(
          assetRevaluations.revaluationDate,
          new Date(filter.revaluationDateFrom)
        )
      );
    }

    if (filter.revaluationDateTo) {
      conditions.push(
        lte(
          assetRevaluations.revaluationDate,
          new Date(filter.revaluationDateTo)
        )
      );
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Get total count
    const countResult = await this.db.db
      .select({ total: count() })
      .from(assetRevaluations)
      .where(whereClause);

    const total = countResult[0]?.total ?? 0;

    // Get paginated results with proper defaults
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const offset = (page - 1) * limit;
    
    // Handle sorting with proper column validation
    const sortBy = filter.sortBy || 'revaluationDate';
    const sortOrder = filter.sortOrder === 'ASC' ? asc : desc;
    
    let orderBy;
    switch (sortBy) {
      case 'revaluationNumber':
        orderBy = sortOrder(assetRevaluations.revaluationNumber);
        break;
      case 'createdAt':
        orderBy = sortOrder(assetRevaluations.createdAt);
        break;
      case 'updatedAt':
        orderBy = sortOrder(assetRevaluations.updatedAt);
        break;
      default:
        orderBy = sortOrder(assetRevaluations.revaluationDate);
    }

    const results = await this.db.db
      .select()
      .from(assetRevaluations)
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

  // Depreciation Methods
  async createDepreciationMethod(
    createDepreciationMethodDto: CreateDepreciationMethodDto,
    userId: string
  ): Promise<DepreciationMethod> {
    // Check if method code already exists
    const existingMethod = await this.db.db
      .select()
      .from(depreciationMethods)
      .where(
        and(
          eq(
            depreciationMethods.methodCode,
            createDepreciationMethodDto.methodCode
          ),
          eq(
            depreciationMethods.companyId,
            createDepreciationMethodDto.companyId
          )
        )
      )
      .limit(1);

    if (existingMethod.length > 0) {
      throw new ConflictException('Depreciation method code already exists');
    }

    const [newMethod] = await this.db.db
      .insert(depreciationMethods)
      .values({
        ...createDepreciationMethodDto,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    if (!newMethod) {
      throw new BadRequestException('Failed to create depreciation method');
    }

    return newMethod;
  }

  async updateDepreciationMethod(
    id: string,
    updateDepreciationMethodDto: UpdateDepreciationMethodDto,
    userId: string,
    companyId: string
  ): Promise<DepreciationMethod> {
    await this.findDepreciationMethodById(id, companyId);

    const [updatedMethod] = await this.db.db
      .update(depreciationMethods)
      .set({
        ...updateDepreciationMethodDto,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(depreciationMethods.id, id),
          eq(depreciationMethods.companyId, companyId)
        )
      )
      .returning();

    if (!updatedMethod) {
      throw new NotFoundException('Depreciation method not found or update failed');
    }

    return updatedMethod;
  }

  async findDepreciationMethodById(
    id: string,
    companyId: string
  ): Promise<DepreciationMethod> {
    const result = await this.db.db
      .select()
      .from(depreciationMethods)
      .where(
        and(
          eq(depreciationMethods.id, id),
          eq(depreciationMethods.companyId, companyId)
        )
      )
      .limit(1);

    const method = result[0];
    if (!method) {
      throw new NotFoundException('Depreciation method not found');
    }

    return method;
  }

  async findDepreciationMethods(
    companyId: string
  ): Promise<DepreciationMethod[]> {
    return await this.db.db
      .select()
      .from(depreciationMethods)
      .where(eq(depreciationMethods.companyId, companyId))
      .orderBy(asc(depreciationMethods.methodName));
  }

  // Helper methods
  private async generateScheduleNumber(companyId: string): Promise<string> {
    const countResult = await this.db.db
      .select({ count: count() })
      .from(depreciationSchedules)
      .where(eq(depreciationSchedules.companyId, companyId));

    const scheduleCount = countResult[0]?.count ?? 0;
    return `DEP-SCH-${String(Number(scheduleCount) + 1).padStart(6, '0')}`;
  }

  private async generateEntryNumber(companyId: string): Promise<string> {
    const countResult = await this.db.db
      .select({ count: count() })
      .from(depreciationEntries)
      .where(eq(depreciationEntries.companyId, companyId));

    const entryCount = countResult[0]?.count ?? 0;
    return `DEP-ENT-${String(Number(entryCount) + 1).padStart(6, '0')}`;
  }

  private async generateRevaluationNumber(companyId: string): Promise<string> {
    const countResult = await this.db.db
      .select({ count: count() })
      .from(assetRevaluations)
      .where(eq(assetRevaluations.companyId, companyId));

    const revaluationCount = countResult[0]?.count ?? 0;
    return `REV-${String(Number(revaluationCount) + 1).padStart(6, '0')}`;
  }
}

