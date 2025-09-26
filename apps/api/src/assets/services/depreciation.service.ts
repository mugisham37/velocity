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
} from '@kiro/database';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, gte, lte } from 'drizzle-orm';
import {
  AssetRevaluationFilterDto,
  CreateDepreciationEntryDto,
  CreateDepreciationMethodDto,
  CreateDepreciationScheduleDto,
  DepreciationEntryFilterDto,
  DepreciationScheduleFilterDto,
  RevaluationStatus,
  ReverseDepreciationEntryDto,
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
    const existingSchedule = await this.db
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

    const [newSchedule] = await this.db
      .insert(depreciationSchedules)
      .values({
        ...createDepreciationScheduleDto,
        scheduleNumber,
        depreciableAmount: depreciableAmount.toString(),
        endDate,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

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

    const [updatedSchedule] = await this.db
      .update(depreciationSchedules)
      .set({
        ...updateDepreciationScheduleDto,
        depreciableAmount,
        endDate,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(depreciationSchedules.id, id),
          eq(depreciationSchedules.companyId, companyId)
        )
      )
      .returning();

    return updatedSchedule;
  }

  async findDepreciationScheduleById(
    id: string,
    companyId: string
  ): Promise<DepreciationSchedule> {
    const [schedule] = await this.db
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

    const whereClause = and(...conditions);

    // Get total count
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(depreciationSchedules)
      .where(whereClause);

    // Get paginated results
    const offset = (filter.page - 1) * filter.limit;
    const orderBy =
      filter.sortOrder === 'ASC'
        ? asc(
            depreciationSchedules[
              filter.sortBy as keyof typeof depreciationSchedules
            ] || depreciationSchedules.createdAt
          )
        : desc(
            depreciationSchedules[
              filter.sortBy as keyof typeof depreciationSchedules
            ] || depreciationSchedules.createdAt
          );

    const results = await this.db
      .select()
      .from(depreciationSchedules)
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
    const [previousEntry] = await this.db
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

    const [newEntry] = await this.db
      .insert(depreciationEntries)
      .values({
        ...createDepreciationEntryDto,
        entryNumber,
        accumulatedDepreciation: accumulatedDepreciation.toString(),
        bookValue: bookValue.toString(),
        taxAccumulatedDepreciation,
        taxBookValue,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

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

    const [updatedEntry] = await this.db
      .update(depreciationEntries)
      .set({
        ...updateDepreciationEntryDto,
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
    const [postedEntry] = await this.db
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

    const [reversedEntry] = await this.db
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

    return reversedEntry;
  }

  async findDepreciationEntryById(
    id: string,
    companyId: string
  ): Promise<DepreciationEntry> {
    const [entry] = await this.db
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

    const whereClause = and(...conditions);

    // Get total count
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(depreciationEntries)
      .where(whereClause);

    // Get paginated results
    const offset = (filter.page - 1) * filter.limit;
    const orderBy =
      filter.sortOrder === 'ASC'
        ? asc(
            depreciationEntries[
              filter.sortBy as keyof typeof depreciationEntries
            ] || depreciationEntries.depreciationDate
          )
        : desc(
            depreciationEntries[
              filter.sortBy as keyof typeof depreciationEntries
            ] || depreciationEntries.depreciationDate
          );

    const results = await this.db
      .select()
      .from(depreciationEntries)
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

    const [newRevaluation] = await this.db
      .insert(assetRevaluations)
      .values({
        ...createAssetRevaluationDto,
        revaluationNumber,
        revaluationSurplus: revaluationSurplus.toString(),
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

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

    const [updatedRevaluation] = await this.db
      .update(assetRevaluations)
      .set({
        ...updateAssetRevaluationDto,
        revaluationSurplus,
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

    const [approvedRevaluation] = await this.db
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
    const [postedRevaluation] = await this.db
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

    // Update asset current value
    await this.db
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
    const [revaluation] = await this.db
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

    const whereClause = and(...conditions);

    // Get total count
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(assetRevaluations)
      .where(whereClause);

    // Get paginated results
    const offset = (filter.page - 1) * filter.limit;
    const orderBy =
      filter.sortOrder === 'ASC'
        ? asc(
            assetRevaluations[
              filter.sortBy as keyof typeof assetRevaluations
            ] || assetRevaluations.revaluationDate
          )
        : desc(
            assetRevaluations[
              filter.sortBy as keyof typeof assetRevaluations
            ] || assetRevaluations.revaluationDate
          );

    const results = await this.db
      .select()
      .from(assetRevaluations)
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

  // Depreciation Methods
  async createDepreciationMethod(
    createDepreciationMethodDto: CreateDepreciationMethodDto,
    userId: string
  ): Promise<DepreciationMethod> {
    // Check if method code already exists
    const existingMethod = await this.db
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

    const [newMethod] = await this.db
      .insert(depreciationMethods)
      .values({
        ...createDepreciationMethodDto,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return newMethod;
  }

  async updateDepreciationMethod(
    id: string,
    updateDepreciationMethodDto: UpdateDepreciationMethodDto,
    userId: string,
    companyId: string
  ): Promise<DepreciationMethod> {
    const existingMethod = await this.findDepreciationMethodById(id, companyId);

    const [updatedMethod] = await this.db
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

    return updatedMethod;
  }

  async findDepreciationMethodById(
    id: string,
    companyId: string
  ): Promise<DepreciationMethod> {
    const [method] = await this.db
      .select()
      .from(depreciationMethods)
      .where(
        and(
          eq(depreciationMethods.id, id),
          eq(depreciationMethods.companyId, companyId)
        )
      )
      .limit(1);

    if (!method) {
      throw new NotFoundException('Depreciation method not found');
    }

    return method;
  }

  async findDepreciationMethods(
    companyId: string
  ): Promise<DepreciationMethod[]> {
    return await this.db
      .select()
      .from(depreciationMethods)
      .where(eq(depreciationMethods.companyId, companyId))
      .orderBy(asc(depreciationMethods.methodName));
  }

  // Helper methods
  private async generateScheduleNumber(companyId: string): Promise<string> {
    const [{ count: scheduleCount }] = await this.db
      .select({ count: count() })
      .from(depreciationSchedules)
      .where(eq(depreciationSchedules.companyId, companyId));

    return `DEP-SCH-${String(scheduleCount + 1).padStart(6, '0')}`;
  }

  private async generateEntryNumber(companyId: string): Promise<string> {
    const [{ count: entryCount }] = await this.db
      .select({ count: count() })
      .from(depreciationEntries)
      .where(eq(depreciationEntries.companyId, companyId));

    return `DEP-ENT-${String(entryCount + 1).padStart(6, '0')}`;
  }

  private async generateRevaluationNumber(companyId: string): Promise<string> {
    const [{ count: revaluationCount }] = await this.db
      .select({ count: count() })
      .from(assetRevaluations)
      .where(eq(assetRevaluations.companyId, companyId));

    return `REV-${String(revaluationCount + 1).padStart(6, '0')}`;
  }
}
