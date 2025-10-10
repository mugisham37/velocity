import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentCompany } from '../../auth/decorators/current-company.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  AssetRevaluationFilterDto,
  CreateAssetRevaluationDto,
  CreateDepreciationEntryDto,
  CreateDepreciationMethodDto,
  CreateDepreciationScheduleDto,
  DepreciationEntryFilterDto,
  DepreciationScheduleFilterDto,
  ReverseDepreciationEntryDto,
  UpdateAssetRevaluationDto,
  UpdateDepreciationEntryDto,
  UpdateDepreciationMethodDto,
  UpdateDepreciationScheduleDto,
} from '../dto/depreciation.dto';
import { DepreciationService } from '../services/depreciation.service';

@Resolver('DepreciationSchedule')
@UseGuards(JwtAuthGuard)
export class DepreciationResolver {
  constructor(private readonly depreciationService: DepreciationService) {}

  // Depreciation Schedule Queries
  @Query('depreciationSchedule')
  async depreciationSchedule(
    @Args('id') id: string,
    @CurrentCompany() companyId: string
  ) {
    return this.depreciationService.findDepreciationScheduleById(id, companyId);
  }

  @Query('depreciationSchedules')
  async depreciationSchedules(
    @Args('filter') filter: DepreciationScheduleFilterDto,
    @CurrentCompany() companyId: string
  ) {
    return this.depreciationService.findDepreciationSchedules(
      filter,
      companyId
    );
  }

  // Depreciation Entry Queries
  @Query('depreciationEntry')
  async depreciationEntry(
    @Args('id') id: string,
    @CurrentCompany() companyId: string
  ) {
    return this.depreciationService.findDepreciationEntryById(id, companyId);
  }

  @Query('depreciationEntries')
  async depreciationEntries(
    @Args('filter') filter: DepreciationEntryFilterDto,
    @CurrentCompany() companyId: string
  ) {
    return this.depreciationService.findDepreciationEntries(filter, companyId);
  }

  // Asset Revaluation Queries
  @Query('assetRevaluation')
  async assetRevaluation(
    @Args('id') id: string,
    @CurrentCompany() companyId: string
  ) {
    return this.depreciationService.findAssetRevaluationById(id, companyId);
  }

  @Query('assetRevaluations')
  async assetRevaluations(
    @Args('filter') filter: AssetRevaluationFilterDto,
    @CurrentCompany() companyId: string
  ) {
    return this.depreciationService.findAssetRevaluations(filter, companyId);
  }

  // Depreciation Method Queries
  @Query('depreciationMethod')
  async depreciationMethod(
    @Args('id') id: string,
    @CurrentCompany() companyId: string
  ) {
    return this.depreciationService.findDepreciationMethodById(id, companyId);
  }

  @Query('depreciationMethods')
  async depreciationMethods(@CurrentCompany() companyId: string) {
    return this.depreciationService.findDepreciationMethods(companyId);
  }

  // Depreciation Schedule Mutations
  @Mutation('createDepreciationSchedule')
  async createDepreciationSchedule(
    @Args('input') input: CreateDepreciationScheduleDto,
    @CurrentUser() userId: string
  ) {
    return this.depreciationService.createDepreciationSchedule(input, userId);
  }

  @Mutation('updateDepreciationSchedule')
  async updateDepreciationSchedule(
    @Args('id') id: string,
    @Args('input') input: UpdateDepreciationScheduleDto,
    @CurrentUser() userId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.depreciationService.updateDepreciationSchedule(
      id,
      input,
      userId,
      companyId
    );
  }

  // Depreciation Entry Mutations
  @Mutation('createDepreciationEntry')
  async createDepreciationEntry(
    @Args('input') input: CreateDepreciationEntryDto,
    @CurrentUser() userId: string
  ) {
    return this.depreciationService.createDepreciationEntry(input, userId);
  }

  @Mutation('updateDepreciationEntry')
  async updateDepreciationEntry(
    @Args('id') id: string,
    @Args('input') input: UpdateDepreciationEntryDto,
    @CurrentUser() userId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.depreciationService.updateDepreciationEntry(
      id,
      input,
      userId,
      companyId
    );
  }

  @Mutation('postDepreciationEntry')
  async postDepreciationEntry(
    @Args('id') id: string,
    @CurrentUser() userId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.depreciationService.postDepreciationEntry(
      id,
      userId,
      companyId
    );
  }

  @Mutation('reverseDepreciationEntry')
  async reverseDepreciationEntry(
    @Args('id') id: string,
    @Args('input') input: ReverseDepreciationEntryDto,
    @CurrentUser() userId: string
  ) {
    return this.depreciationService.reverseDepreciationEntry(id, input, userId);
  }

  // Asset Revaluation Mutations
  @Mutation('createAssetRevaluation')
  async createAssetRevaluation(
    @Args('input') input: CreateAssetRevaluationDto,
    @CurrentUser() userId: string
  ) {
    return this.depreciationService.createAssetRevaluation(input, userId);
  }

  @Mutation('updateAssetRevaluation')
  async updateAssetRevaluation(
    @Args('id') id: string,
    @Args('input') input: UpdateAssetRevaluationDto,
    @CurrentUser() userId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.depreciationService.updateAssetRevaluation(
      id,
      input,
      userId,
      companyId
    );
  }

  @Mutation('approveAssetRevaluation')
  async approveAssetRevaluation(
    @Args('id') id: string,
    @CurrentUser() userId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.depreciationService.approveAssetRevaluation(
      id,
      userId,
      companyId
    );
  }

  @Mutation('postAssetRevaluation')
  async postAssetRevaluation(
    @Args('id') id: string,
    @CurrentUser() userId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.depreciationService.postAssetRevaluation(id, userId, companyId);
  }

  // Depreciation Method Mutations
  @Mutation('createDepreciationMethod')
  async createDepreciationMethod(
    @Args('input') input: CreateDepreciationMethodDto,
    @CurrentUser() userId: string
  ) {
    return this.depreciationService.createDepreciationMethod(input, userId);
  }

  @Mutation('updateDepreciationMethod')
  async updateDepreciationMethod(
    @Args('id') id: string,
    @Args('input') input: UpdateDepreciationMethodDto,
    @CurrentUser() userId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.depreciationService.updateDepreciationMethod(
      id,
      input,
      userId,
      companyId
    );
  }
}
