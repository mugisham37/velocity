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
} from '../../database';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, gte, ilike, lte, or } from '../../database';
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
  UpdateAssetCategoryDto,
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
    const existingAsset = await this.db.db
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

    // Convert string dates to Date objects
    const assetData = {
      ...createAssetDto,
      assetCode,
      purchaseDate: createAssetDto.purchaseDate
        ? new Date(createAssetDto.purchaseDate)
        : null,
      depreciationStartDate: createAssetDto.depreciationStartDate
        ? new Date(createAssetDto.depreciationStartDate)
        : null,
      warrantyExpiryDate: createAssetDto.warrantyExpiryDate
        ? new Date(createAssetDto.warrantyExpiryDate)
        : null,
      insuranceExpiryDate: createAssetDto.insuranceExpiryDate
        ? new Date(createAssetDto.insuranceExpiryDate)
        : null,
      createdBy: userId,
      updatedBy: userId,
    };

    const [newAsset] = await this.db.db
      .insert(assets)
      .values(assetData)
      .returning();

    if (!newAsset) {
      throw new BadRequestException('Failed to create asset');
    }

    return newAsset;
  }

  async updateAsset(
    id: string,
    updateAssetDto: UpdateAssetDto,
    userId: string,
    companyId: string
  ): Promise<Asset> {
    await this.findAssetById(id, companyId);

    // Convert string dates to Date objects, filter out undefined values
    const updateData: any = {
      ...updateAssetDto,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    // Only add date fields if they are provided
    if (updateAssetDto.purchaseDate) {
      updateData.purchaseDate = new Date(updateAssetDto.purchaseDate);
    }
    if (updateAssetDto.depreciationStartDate) {
      updateData.depreciationStartDate = new Date(
        updateAssetDto.depreciationStartDate
      );
    }
    if (updateAssetDto.warrantyExpiryDate) {
      updateData.warrantyExpiryDate = new Date(
        updateAssetDto.warrantyExpiryDate
      );
    }
    if (updateAssetDto.insuranceExpiryDate) {
      updateData.insuranceExpiryDate = new Date(
        updateAssetDto.insuranceExpiryDate
      );
    }

    const [updatedAsset] = await this.db.db
      .update(assets)
      .set(updateData)
      .where(and(eq(assets.id, id), eq(assets.companyId, companyId)))
      .returning();

    if (!updatedAsset) {
      throw new NotFoundException('Asset not found or update failed');
    }

    return updatedAsset;
  }

  async findAssetById(id: string, companyId: string): Promise<Asset> {
    const [asset] = await this.db.db
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
      const searchCondition = or(
        ilike(assets.assetCode, `%${filter.search}%`),
        ilike(assets.assetName, `%${filter.search}%`),
        ilike(assets.serialNumber, `%${filter.search}%`),
        ilike(assets.manufacturer, `%${filter.search}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
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

    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0];

    // Get total count
    const countResult = await this.db.db
      .select({ total: count() })
      .from(assets)
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
      case 'assetCode':
        orderBy = sortOrder(assets.assetCode);
        break;
      case 'assetName':
        orderBy = sortOrder(assets.assetName);
        break;
      case 'purchaseDate':
        orderBy = sortOrder(assets.purchaseDate);
        break;
      case 'currentValue':
        orderBy = sortOrder(assets.currentValue);
        break;
      case 'updatedAt':
        orderBy = sortOrder(assets.updatedAt);
        break;
      default:
        orderBy = sortOrder(assets.createdAt);
    }

    const results = await this.db.db
      .select()
      .from(assets)
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

  async deleteAsset(id: string, companyId: string): Promise<void> {
    await this.findAssetById(id, companyId);

    // Check if asset has any active depreciation schedules or maintenance schedules
    // This would require checking related tables - for now, we'll allow deletion

    await this.db.db
      .delete(assets)
      .where(and(eq(assets.id, id), eq(assets.companyId, companyId)));
  }

  // Asset Categories
  async createAssetCategory(
    createAssetCategoryDto: CreateAssetCategoryDto,
    userId: string
  ): Promise<AssetCategory> {
    // Check if category code already exists
    const existingCategory = await this.db.db
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

    const [newCategory] = await this.db.db
      .insert(assetCategories)
      .values({
        ...createAssetCategoryDto,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    if (!newCategory) {
      throw new BadRequestException('Failed to create asset category');
    }

    return newCategory;
  }

  async updateAssetCategory(
    id: string,
    updateAssetCategoryDto: UpdateAssetCategoryDto,
    userId: string,
    companyId: string
  ): Promise<AssetCategory> {
    await this.findAssetCategoryById(id, companyId);

    const [updatedCategory] = await this.db.db
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

    if (!updatedCategory) {
      throw new NotFoundException('Asset category not found or update failed');
    }

    return updatedCategory;
  }

  async findAssetCategoryById(
    id: string,
    companyId: string
  ): Promise<AssetCategory> {
    const result = await this.db.db
      .select()
      .from(assetCategories)
      .where(
        and(
          eq(assetCategories.id, id),
          eq(assetCategories.companyId, companyId)
        )
      )
      .limit(1);

    const category = result[0];
    if (!category) {
      throw new NotFoundException('Asset category not found');
    }

    return category;
  }

  async findAssetCategories(companyId: string): Promise<AssetCategory[]> {
    return await this.db.db
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
    const existingLocation = await this.db.db
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

    const [newLocation] = await this.db.db
      .insert(assetLocations)
      .values({
        ...createAssetLocationDto,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    if (!newLocation) {
      throw new BadRequestException('Failed to create asset location');
    }

    return newLocation;
  }

  async updateAssetLocation(
    id: string,
    updateAssetLocationDto: UpdateAssetLocationDto,
    userId: string,
    companyId: string
  ): Promise<AssetLocation> {
    await this.findAssetLocationById(id, companyId);

    const [updatedLocation] = await this.db.db
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

    if (!updatedLocation) {
      throw new NotFoundException('Asset location not found');
    }

    return updatedLocation;
  }

  async findAssetLocationById(
    id: string,
    companyId: string
  ): Promise<AssetLocation> {
    const result = await this.db.db
      .select()
      .from(assetLocations)
      .where(
        and(eq(assetLocations.id, id), eq(assetLocations.companyId, companyId))
      )
      .limit(1);

    const location = result[0];
    if (!location) {
      throw new NotFoundException('Asset location not found');
    }

    return location;
  }

  async findAssetLocations(companyId: string): Promise<AssetLocation[]> {
    return await this.db.db
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

    // Convert string date to Date object
    const transferData = {
      ...createAssetTransferDto,
      transferNumber,
      transferDate: new Date(createAssetTransferDto.transferDate),
      createdBy: userId,
      updatedBy: userId,
    };

    const [newTransfer] = await this.db.db
      .insert(assetTransfers)
      .values(transferData)
      .returning();

    if (!newTransfer) {
      throw new BadRequestException('Failed to create asset transfer');
    }

    return newTransfer;
  }

  async updateAssetTransfer(
    id: string,
    updateAssetTransferDto: UpdateAssetTransferDto,
    userId: string,
    companyId: string
  ): Promise<AssetTransfer> {
    await this.findAssetTransferById(id, companyId);

    // Convert string date to Date object if provided, filter out undefined values
    const updateData: any = {
      ...updateAssetTransferDto,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    // Only add transferDate if provided
    if (updateAssetTransferDto.transferDate) {
      updateData.transferDate = new Date(updateAssetTransferDto.transferDate);
    }

    const [updatedTransfer] = await this.db.db
      .update(assetTransfers)
      .set(updateData)
      .where(
        and(eq(assetTransfers.id, id), eq(assetTransfers.companyId, companyId))
      )
      .returning();

    if (!updatedTransfer) {
      throw new NotFoundException('Asset transfer not found or update failed');
    }

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

    const [approvedTransfer] = await this.db.db
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

    if (!approvedTransfer) {
      throw new NotFoundException(
        'Asset transfer not found or approval failed'
      );
    }

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
    await this.db.db
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

    const [completedTransfer] = await this.db.db
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

    if (!completedTransfer) {
      throw new NotFoundException(
        'Asset transfer not found or completion failed'
      );
    }

    return completedTransfer;
  }

  async findAssetTransferById(
    id: string,
    companyId: string
  ): Promise<AssetTransfer> {
    const [transfer] = await this.db.db
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

    // Convert string date to Date object
    const disposalData = {
      ...createAssetDisposalDto,
      disposalNumber,
      disposalDate: new Date(createAssetDisposalDto.disposalDate),
      gainLoss: gainLoss.toString(),
      createdBy: userId,
      updatedBy: userId,
    };

    const [newDisposal] = await this.db.db
      .insert(assetDisposals)
      .values(disposalData)
      .returning();

    if (!newDisposal) {
      throw new BadRequestException('Failed to create asset disposal');
    }

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

    // Convert string date to Date object if provided, filter out undefined values
    const updateData: any = {
      ...updateAssetDisposalDto,
      gainLoss,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    // Only add disposalDate if provided
    if (updateAssetDisposalDto.disposalDate) {
      updateData.disposalDate = new Date(updateAssetDisposalDto.disposalDate);
    }

    const [updatedDisposal] = await this.db.db
      .update(assetDisposals)
      .set(updateData)
      .where(
        and(eq(assetDisposals.id, id), eq(assetDisposals.companyId, companyId))
      )
      .returning();

    if (!updatedDisposal) {
      throw new NotFoundException('Asset disposal not found or update failed');
    }

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

    const [approvedDisposal] = await this.db.db
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

    if (!approvedDisposal) {
      throw new NotFoundException(
        'Asset disposal not found or approval failed'
      );
    }

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
    await this.db.db
      .update(assets)
      .set({
        status: AssetStatus.DISPOSED,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(eq(assets.id, disposal.assetId), eq(assets.companyId, companyId))
      );

    const [completedDisposal] = await this.db.db
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

    if (!completedDisposal) {
      throw new NotFoundException(
        'Asset disposal not found or completion failed'
      );
    }

    return completedDisposal;
  }

  async findAssetDisposalById(
    id: string,
    companyId: string
  ): Promise<AssetDisposal> {
    const [disposal] = await this.db.db
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
    const countResult = await this.db.db
      .select({ count: count() })
      .from(assets)
      .where(eq(assets.companyId, companyId));

    const assetCount = countResult[0]?.count ?? 0;
    return `AST-${String(Number(assetCount) + 1).padStart(6, '0')}`;
  }

  private async generateTransferNumber(companyId: string): Promise<string> {
    const countResult = await this.db.db
      .select({ count: count() })
      .from(assetTransfers)
      .where(eq(assetTransfers.companyId, companyId));

    const transferCount = countResult[0]?.count ?? 0;
    return `TRF-${String(Number(transferCount) + 1).padStart(6, '0')}`;
  }

  private async generateDisposalNumber(companyId: string): Promise<string> {
    const countResult = await this.db.db
      .select({ count: count() })
      .from(assetDisposals)
      .where(eq(assetDisposals.companyId, companyId));

    const disposalCount = countResult[0]?.count ?? 0;
    return `DSP-${String(Number(disposalCount) + 1).padStart(6, '0')}`;
  }
}

