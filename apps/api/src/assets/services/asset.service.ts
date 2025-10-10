import {
  DatabaseService,
  assetCategories,
  assetDisposals,
  assetLocations,
  assetTransfers,
  assets,
  type Asset,
  type AssetCategory,
  type AssetDisposal,
  type AssetLocation,
  type AssetTransfer,
} from '@kiro/database';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, gte, ilike, lte, or } from '@kiro/database';
import {
  AssetFilterDto,
  AssetStatus,
  CreateAssetCategoryDto,
  CreateAssetDisposalDto,
  CreateAssetDto,
  CreateAssetLocationDto,
  CreateAssetTransferDto,
  DisposalStatus,
  TransferStatus,
  UpdateAssetDisposalDto,
  UpdateAssetDto,
  UpdateAssetLocationDto,
  UpdateAssetTransferDto,
} from '../dto/asset.dto';

@Injectable()
export class AssetService {
  constructor(private readonly db: DatabaseService) {}

  // Asset Management
  async createAsset(
    createAssetDto: CreateAssetDto,
    userId: string
  ): Promise<Asset> {
    // Check if asset code already exists
    const existingAsset = await this.db
      .select()
      .from(assets)
      .where(
        and(
          eq(assets.assetCode, createAssetDto.assetCode),
          eq(assets.companyId, createAssetDto.companyId)
        )
      )
      .limit(1);

    if (existingAsset.length > 0) {
      throw new ConflictException('Asset code already exists');
    }

    // Generate asset code if not provided
    let assetCode = createAssetDto.assetCode;
    if (!assetCode) {
      assetCode = await this.generateAssetCode(createAssetDto.companyId);
    }

    // Calculate depreciation end date if depreciation is configured
    let depreciationEndDate: Date | undefined;
    if (createAssetDto.depreciationStartDate && createAssetDto.usefulLife) {
      const startDate = new Date(createAssetDto.depreciationStartDate);
      depreciationEndDate = new Date(startDate);
      depreciationEndDate.setMonth(
        depreciationEndDate.getMonth() + createAssetDto.usefulLife
      );
    }

    const [newAsset] = await this.db
      .insert(assets)
      .values({
        ...createAssetDto,
        assetCode,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return newAsset;
  }

  async updateAsset(
    id: string,
    updateAssetDto: UpdateAssetDto,
    userId: string,
    companyId: string
  ): Promise<Asset> {
    const existingAsset = await this.findAssetById(id, companyId);

    const [updatedAsset] = await this.db
      .update(assets)
      .set({
        ...updateAssetDto,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(eq(assets.id, id), eq(assets.companyId, companyId)))
      .returning();

    return updatedAsset;
  }

  async findAssetById(id: string, companyId: string): Promise<Asset> {
    const [asset] = await this.db
      .select()
      .from(assets)
      .where(and(eq(assets.id, id), eq(assets.companyId, companyId)))
      .limit(1);

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    return asset;
  }

  async findAssets(filter: AssetFilterDto, companyId: string) {
    const conditions = [eq(assets.companyId, companyId)];

    // Apply filters
    if (filter.search) {
      conditions.push(
        or(
          ilike(assets.assetCode, `%${filter.search}%`),
          ilike(assets.assetName, `%${filter.search}%`),
          ilike(assets.serialNumber, `%${filter.search}%`),
          ilike(assets.manufacturer, `%${filter.search}%`)
        )
      );
    }

    if (filter.categoryId) {
      conditions.push(eq(assets.assetCategoryId, filter.categoryId));
    }

    if (filter.locationId) {
      conditions.push(eq(assets.currentLocationId, filter.locationId));
    }

    if (filter.custodianId) {
      conditions.push(eq(assets.custodianId, filter.custodianId));
    }

    if (filter.status) {
      conditions.push(eq(assets.status, filter.status));
    }

    if (filter.condition) {
      conditions.push(eq(assets.condition, filter.condition));
    }

    if (filter.manufacturer) {
      conditions.push(ilike(assets.manufacturer, `%${filter.manufacturer}%`));
    }

    if (filter.purchaseDateFrom) {
      conditions.push(
        gte(assets.purchaseDate, new Date(filter.purchaseDateFrom))
      );
    }

    if (filter.purchaseDateTo) {
      conditions.push(
        lte(assets.purchaseDate, new Date(filter.purchaseDateTo))
      );
    }

    if (filter.valueFrom) {
      conditions.push(gte(assets.currentValue, filter.valueFrom));
    }

    if (filter.valueTo) {
      conditions.push(lte(assets.currentValue, filter.valueTo));
    }

    const whereClause = and(...conditions);

    // Get total count
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(assets)
      .where(whereClause);

    // Get paginated results
    const offset = (filter.page - 1) * filter.limit;
    const orderBy =
      filter.sortOrder === 'ASC'
        ? asc(assets[filter.sortBy as keyof typeof assets] || assets.createdAt)
        : desc(
            assets[filter.sortBy as keyof typeof assets] || assets.createdAt
          );

    const results = await this.db
      .select()
      .from(assets)
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

  async deleteAsset(id: string, companyId: string): Promise<void> {
    const asset = await this.findAssetById(id, companyId);

    // Check if asset has any active depreciation schedules or maintenance schedules
    // This would require checking related tables - for now, we'll allow deletion

    await this.db
      .delete(assets)
      .where(and(eq(assets.id, id), eq(assets.companyId, companyId)));
  }

  // Asset Categories
  async createAssetCategory(
    createAssetCategoryDto: CreateAssetCategoryDto,
    userId: string
  ): Promise<AssetCategory> {
    // Check if category code already exists
    const existingCategory = await this.db
      .select()
      .from(assetCategories)
      .where(
        and(
          eq(assetCategories.categoryCode, createAssetCategoryDto.categoryCode),
          eq(assetCategories.companyId, createAssetCategoryDto.companyId)
        )
      )
      .limit(1);

    if (existingCategory.length > 0) {
      throw new ConflictException('Asset category code already exists');
    }

    const [newCategory] = await this.db
      .insert(assetCategories)
      .values({
        ...createAssetCategoryDto,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return newCategory;
  }

  async updateAssetCategory(
    id: string,
    updateAssetCategoryDto: UpdateAssetCategoryDto,
    userId: string,
    companyId: string
  ): Promise<AssetCategory> {
    const existingCategory = await this.findAssetCategoryById(id, companyId);

    const [updatedCategory] = await this.db
      .update(assetCategories)
      .set({
        ...updateAssetCategoryDto,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(assetCategories.id, id),
          eq(assetCategories.companyId, companyId)
        )
      )
      .returning();

    return updatedCategory;
  }

  async findAssetCategoryById(
    id: string,
    companyId: string
  ): Promise<AssetCategory> {
    const [category] = await this.db
      .select()
      .from(assetCategories)
      .where(
        and(
          eq(assetCategories.id, id),
          eq(assetCategories.companyId, companyId)
        )
      )
      .limit(1);

    if (!category) {
      throw new NotFoundException('Asset category not found');
    }

    return category;
  }

  async findAssetCategories(companyId: string): Promise<AssetCategory[]> {
    return await this.db
      .select()
      .from(assetCategories)
      .where(eq(assetCategories.companyId, companyId))
      .orderBy(asc(assetCategories.categoryName));
  }

  // Asset Locations
  async createAssetLocation(
    createAssetLocationDto: CreateAssetLocationDto,
    userId: string
  ): Promise<AssetLocation> {
    // Check if location code already exists
    const existingLocation = await this.db
      .select()
      .from(assetLocations)
      .where(
        and(
          eq(assetLocations.locationCode, createAssetLocationDto.locationCode),
          eq(assetLocations.companyId, createAssetLocationDto.companyId)
        )
      )
      .limit(1);

    if (existingLocation.length > 0) {
      throw new ConflictException('Asset location code already exists');
    }

    const [newLocation] = await this.db
      .insert(assetLocations)
      .values({
        ...createAssetLocationDto,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return newLocation;
  }

  async updateAssetLocation(
    id: string,
    updateAssetLocationDto: UpdateAssetLocationDto,
    userId: string,
    companyId: string
  ): Promise<AssetLocation> {
    const existingLocation = await this.findAssetLocationById(id, companyId);

    const [updatedLocation] = await this.db
      .update(assetLocations)
      .set({
        ...updateAssetLocationDto,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(eq(assetLocations.id, id), eq(assetLocations.companyId, companyId))
      )
      .returning();

    return updatedLocation;
  }

  async findAssetLocationById(
    id: string,
    companyId: string
  ): Promise<AssetLocation> {
    const [location] = await this.db
      .select()
      .from(assetLocations)
      .where(
        and(eq(assetLocations.id, id), eq(assetLocations.companyId, companyId))
      )
      .limit(1);

    if (!location) {
      throw new NotFoundException('Asset location not found');
    }

    return location;
  }

  async findAssetLocations(companyId: string): Promise<AssetLocation[]> {
    return await this.db
      .select()
      .from(assetLocations)
      .where(eq(assetLocations.companyId, companyId))
      .orderBy(asc(assetLocations.locationName));
  }

  // Asset Transfers
  async createAssetTransfer(
    createAssetTransferDto: CreateAssetTransferDto,
    userId: string
  ): Promise<AssetTransfer> {
    // Verify asset exists
    await this.findAssetById(
      createAssetTransferDto.assetId,
      createAssetTransferDto.companyId
    );

    // Generate transfer number
    const transferNumber = await this.generateTransferNumber(
      createAssetTransferDto.companyId
    );

    const [newTransfer] = await this.db
      .insert(assetTransfers)
      .values({
        ...createAssetTransferDto,
        transferNumber,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return newTransfer;
  }

  async updateAssetTransfer(
    id: string,
    updateAssetTransferDto: UpdateAssetTransferDto,
    userId: string,
    companyId: string
  ): Promise<AssetTransfer> {
    const existingTransfer = await this.findAssetTransferById(id, companyId);

    const [updatedTransfer] = await this.db
      .update(assetTransfers)
      .set({
        ...updateAssetTransferDto,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(eq(assetTransfers.id, id), eq(assetTransfers.companyId, companyId))
      )
      .returning();

    return updatedTransfer;
  }

  async approveAssetTransfer(
    id: string,
    userId: string,
    companyId: string
  ): Promise<AssetTransfer> {
    const transfer = await this.findAssetTransferById(id, companyId);

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Only pending transfers can be approved');
    }

    const [approvedTransfer] = await this.db
      .update(assetTransfers)
      .set({
        status: TransferStatus.APPROVED,
        approvedBy: userId,
        approvedAt: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(eq(assetTransfers.id, id), eq(assetTransfers.companyId, companyId))
      )
      .returning();

    return approvedTransfer;
  }

  async completeAssetTransfer(
    id: string,
    userId: string,
    companyId: string
  ): Promise<AssetTransfer> {
    const transfer = await this.findAssetTransferById(id, companyId);

    if (
      transfer.status !== TransferStatus.APPROVED &&
      transfer.status !== TransferStatus.IN_TRANSIT
    ) {
      throw new BadRequestException(
        'Only approved or in-transit transfers can be completed'
      );
    }

    // Update asset location and custodian
    await this.db
      .update(assets)
      .set({
        currentLocationId: transfer.toLocationId,
        custodianId: transfer.toCustodianId,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(eq(assets.id, transfer.assetId), eq(assets.companyId, companyId))
      );

    const [completedTransfer] = await this.db
      .update(assetTransfers)
      .set({
        status: TransferStatus.COMPLETED,
        completedAt: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(eq(assetTransfers.id, id), eq(assetTransfers.companyId, companyId))
      )
      .returning();

    return completedTransfer;
  }

  async findAssetTransferById(
    id: string,
    companyId: string
  ): Promise<AssetTransfer> {
    const [transfer] = await this.db
      .select()
      .from(assetTransfers)
      .where(
        and(eq(assetTransfers.id, id), eq(assetTransfers.companyId, companyId))
      )
      .limit(1);

    if (!transfer) {
      throw new NotFoundException('Asset transfer not found');
    }

    return transfer;
  }

  // Asset Disposals
  async createAssetDisposal(
    createAssetDisposalDto: CreateAssetDisposalDto,
    userId: string
  ): Promise<AssetDisposal> {
    // Verify asset exists
    await this.findAssetById(
      createAssetDisposalDto.assetId,
      createAssetDisposalDto.companyId
    );

    // Generate disposal number
    const disposalNumber = await this.generateDisposalNumber(
      createAssetDisposalDto.companyId
    );

    // Calculate gain/loss
    const disposalAmount = parseFloat(
      createAssetDisposalDto.disposalAmount || '0'
    );
    const bookValue = parseFloat(createAssetDisposalDto.bookValue);
    const gainLoss = disposalAmount - bookValue;

    const [newDisposal] = await this.db
      .insert(assetDisposals)
      .values({
        ...createAssetDisposalDto,
        disposalNumber,
        gainLoss: gainLoss.toString(),
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return newDisposal;
  }

  async updateAssetDisposal(
    id: string,
    updateAssetDisposalDto: UpdateAssetDisposalDto,
    userId: string,
    companyId: string
  ): Promise<AssetDisposal> {
    const existingDisposal = await this.findAssetDisposalById(id, companyId);

    // Recalculate gain/loss if amounts changed
    let gainLoss = existingDisposal.gainLoss;
    if (
      updateAssetDisposalDto.disposalAmount ||
      updateAssetDisposalDto.bookValue
    ) {
      const disposalAmount = parseFloat(
        updateAssetDisposalDto.disposalAmount ||
          existingDisposal.disposalAmount ||
          '0'
      );
      const bookValue = parseFloat(
        updateAssetDisposalDto.bookValue || existingDisposal.bookValue
      );
      gainLoss = (disposalAmount - bookValue).toString();
    }

    const [updatedDisposal] = await this.db
      .update(assetDisposals)
      .set({
        ...updateAssetDisposalDto,
        gainLoss,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(eq(assetDisposals.id, id), eq(assetDisposals.companyId, companyId))
      )
      .returning();

    return updatedDisposal;
  }

  async approveAssetDisposal(
    id: string,
    userId: string,
    companyId: string
  ): Promise<AssetDisposal> {
    const disposal = await this.findAssetDisposalById(id, companyId);

    if (disposal.status !== DisposalStatus.PENDING) {
      throw new BadRequestException('Only pending disposals can be approved');
    }

    const [approvedDisposal] = await this.db
      .update(assetDisposals)
      .set({
        status: DisposalStatus.APPROVED,
        approvedBy: userId,
        approvedAt: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(eq(assetDisposals.id, id), eq(assetDisposals.companyId, companyId))
      )
      .returning();

    return approvedDisposal;
  }

  async completeAssetDisposal(
    id: string,
    userId: string,
    companyId: string
  ): Promise<AssetDisposal> {
    const disposal = await this.findAssetDisposalById(id, companyId);

    if (disposal.status !== DisposalStatus.APPROVED) {
      throw new BadRequestException('Only approved disposals can be completed');
    }

    // Update asset status to disposed
    await this.db
      .update(assets)
      .set({
        status: AssetStatus.DISPOSED,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(eq(assets.id, disposal.assetId), eq(assets.companyId, companyId))
      );

    const [completedDisposal] = await this.db
      .update(assetDisposals)
      .set({
        status: DisposalStatus.COMPLETED,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(eq(assetDisposals.id, id), eq(assetDisposals.companyId, companyId))
      )
      .returning();

    return completedDisposal;
  }

  async findAssetDisposalById(
    id: string,
    companyId: string
  ): Promise<AssetDisposal> {
    const [disposal] = await this.db
      .select()
      .from(assetDisposals)
      .where(
        and(eq(assetDisposals.id, id), eq(assetDisposals.companyId, companyId))
      )
      .limit(1);

    if (!disposal) {
      throw new NotFoundException('Asset disposal not found');
    }

    return disposal;
  }

  // Helper methods
  private async generateAssetCode(companyId: string): Promise<string> {
    const [{ count: assetCount }] = await this.db
      .select({ count: count() })
      .from(assets)
      .where(eq(assets.companyId, companyId));

    return `AST-${String(assetCount + 1).padStart(6, '0')}`;
  }

  private async generateTransferNumber(companyId: string): Promise<string> {
    const [{ count: transferCount }] = await this.db
      .select({ count: count() })
      .from(assetTransfers)
      .where(eq(assetTransfers.companyId, companyId));

    return `TRF-${String(transferCount + 1).padStart(6, '0')}`;
  }

  private async generateDisposalNumber(companyId: string): Promise<string> {
    const [{ count: disposalCount }] = await this.db
      .select({ count: count() })
      .from(assetDisposals)
      .where(eq(assetDisposals.companyId, companyId));

    return `DSP-${String(disposalCount + 1).padStart(6, '0')}`;
  }
}
