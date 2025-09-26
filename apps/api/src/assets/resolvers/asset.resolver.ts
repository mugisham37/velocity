import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentCompany } from '../../auth/decorators/current-company.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  AssetFilterDto,
  CreateAssetCategoryDto,
  CreateAssetDisposalDto,
  CreateAssetDto,
  CreateAssetLocationDto,
  CreateAssetTransferDto,
  UpdateAssetCategoryDto,
  UpdateAssetDisposalDto,
  UpdateAssetDto,
  UpdateAssetLocationDto,
  UpdateAssetTransferDto,
} from '../dto/asset.dto';
import { AssetService } from '../services/asset.service';

@Resolver('Asset')
@UseGuards(JwtAuthGuard)
export class AssetResolver {
  constructor(private readonly assetService: AssetService) {}

  // Asset Queries
  @Query('asset')
  async asset(@Args('id') id: string, @CurrentCompany() companyId: string) {
    return this.assetService.findAssetById(id, companyId);
  }

  @Query('assets')
  async assets(
    @Args('filter') filter: AssetFilterDto,
    @CurrentCompany() companyId: string
  ) {
    return this.assetService.findAssets(filter, companyId);
  }

  // Asset Category Queries
  @Query('assetCategory')
  async assetCategory(
    @Args('id') id: string,
    @CurrentCompany() companyId: string
  ) {
    return this.assetService.findAssetCategoryById(id, companyId);
  }

  @Query('assetCategories')
  async assetCategories(@CurrentCompany() companyId: string) {
    return this.assetService.findAssetCategories(companyId);
  }

  // Asset Location Queries
  @Query('assetLocation')
  async assetLocation(
    @Args('id') id: string,
    @CurrentCompany() companyId: string
  ) {
    return this.assetService.findAssetLocationById(id, companyId);
  }

  @Query('assetLocations')
  async assetLocations(@CurrentCompany() companyId: string) {
    return this.assetService.findAssetLocations(companyId);
  }

  // Asset Transfer Queries
  @Query('assetTransfer')
  async assetTransfer(
    @Args('id') id: string,
    @CurrentCompany() companyId: string
  ) {
    return this.assetService.findAssetTransferById(id, companyId);
  }

  // Asset Disposal Queries
  @Query('assetDisposal')
  async assetDisposal(
    @Args('id') id: string,
    @CurrentCompany() companyId: string
  ) {
    return this.assetService.findAssetDisposalById(id, companyId);
  }

  // Asset Mutations
  @Mutation('createAsset')
  async createAsset(
    @Args('input') input: CreateAssetDto,
    @CurrentUser() userId: string
  ) {
    return this.assetService.createAsset(input, userId);
  }

  @Mutation('updateAsset')
  async updateAsset(
    @Args('id') id: string,
    @Args('input') input: UpdateAssetDto,
    @CurrentUser() userId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.assetService.updateAsset(id, input, userId, companyId);
  }

  @Mutation('deleteAsset')
  async deleteAsset(
    @Args('id') id: string,
    @CurrentCompany() companyId: string
  ): Promise<boolean> {
    await this.assetService.deleteAsset(id, companyId);
    return true;
  }

  // Asset Category Mutations
  @Mutation('createAssetCategory')
  async createAssetCategory(
    @Args('input') input: CreateAssetCategoryDto,
    @CurrentUser() userId: string
  ) {
    return this.assetService.createAssetCategory(input, userId);
  }

  @Mutation('updateAssetCategory')
  async updateAssetCategory(
    @Args('id') id: string,
    @Args('input') input: UpdateAssetCategoryDto,
    @CurrentUser() userId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.assetService.updateAssetCategory(id, input, userId, companyId);
  }

  // Asset Location Mutations
  @Mutation('createAssetLocation')
  async createAssetLocation(
    @Args('input') input: CreateAssetLocationDto,
    @CurrentUser() userId: string
  ) {
    return this.assetService.createAssetLocation(input, userId);
  }

  @Mutation('updateAssetLocation')
  async updateAssetLocation(
    @Args('id') id: string,
    @Args('input') input: UpdateAssetLocationDto,
    @CurrentUser() userId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.assetService.updateAssetLocation(id, input, userId, companyId);
  }

  // Asset Transfer Mutations
  @Mutation('createAssetTransfer')
  async createAssetTransfer(
    @Args('input') input: CreateAssetTransferDto,
    @CurrentUser() userId: string
  ) {
    return this.assetService.createAssetTransfer(input, userId);
  }

  @Mutation('updateAssetTransfer')
  async updateAssetTransfer(
    @Args('id') id: string,
    @Args('input') input: UpdateAssetTransferDto,
    @CurrentUser() userId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.assetService.updateAssetTransfer(id, input, userId, companyId);
  }

  @Mutation('approveAssetTransfer')
  async approveAssetTransfer(
    @Args('id') id: string,
    @CurrentUser() userId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.assetService.approveAssetTransfer(id, userId, companyId);
  }

  @Mutation('completeAssetTransfer')
  async completeAssetTransfer(
    @Args('id') id: string,
    @CurrentUser() userId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.assetService.completeAssetTransfer(id, userId, companyId);
  }

  // Asset Disposal Mutations
  @Mutation('createAssetDisposal')
  async createAssetDisposal(
    @Args('input') input: CreateAssetDisposalDto,
    @CurrentUser() userId: string
  ) {
    return this.assetService.createAssetDisposal(input, userId);
  }

  @Mutation('updateAssetDisposal')
  async updateAssetDisposal(
    @Args('id') id: string,
    @Args('input') input: UpdateAssetDisposalDto,
    @CurrentUser() userId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.assetService.updateAssetDisposal(id, input, userId, companyId);
  }

  @Mutation('approveAssetDisposal')
  async approveAssetDisposal(
    @Args('id') id: string,
    @CurrentUser() userId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.assetService.approveAssetDisposal(id, userId, companyId);
  }

  @Mutation('completeAssetDisposal')
  async completeAssetDisposal(
    @Args('id') id: string,
    @CurrentUser() userId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.assetService.completeAssetDisposal(id, userId, companyId);
  }
}
