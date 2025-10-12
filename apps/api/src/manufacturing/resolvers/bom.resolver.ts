import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import type {
  BOM,
  BOMAlternativeItem,
  BOMItem,
  BOMOperation,
  BOMScrapItem,
} from '@kiro/database';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  BOMCostBreakdown,
  BOMCostCalculationDto,
  BOMExplosionDto,
  BOMExplosionResult,
  BOMFilterDto,
  CreateBOMDto,
  CreateBOMVersionDto,
  UpdateBOMDto,
} from '../dto/bom.dto';
import { BOMService } from '../services/bom.service';

@Resolver('BOM')
@UseGuards(JwtAuthGuard)
export class BOMResolver {
  constructor(private readonly bomService: BOMService) {}

  @Query('bom')
  async getBOM(@Args('id') id: string): Promise<BOM> {
    return this.bomService.findBOMById(id);
  }

  @Query('boms')
  async getBOMs(@Args('filter') filter: BOMFilterDto): Promise<BOM[]> {
    return this.bomService.findBOMs(filter);
  }

  @Query('bomItems')
  async getBOMItems(@Args('bomId') bomId: string): Promise<BOMItem[]> {
    return this.bomService.getBOMItems(bomId);
  }

  @Query('bomOperations')
  async getBOMOperations(
    @Args('bomId') bomId: string
  ): Promise<BOMOperation[]> {
    return this.bomService.getBOMOperations(bomId);
  }

  @Query('bomScrapItems')
  async getBOMScrapItems(
    @Args('bomId') bomId: string
  ): Promise<BOMScrapItem[]> {
    return this.bomService.getBOMScrapItems(bomId);
  }

  @Query('bomAlternativeItems')
  async getBOMAlternativeItems(
    @Args('bomItemId') bomItemId: string
  ): Promise<BOMAlternativeItem[]> {
    return this.bomService.getBOMAlternativeItems(bomItemId);
  }

  @Query('bomCostCalculation')
  async calculateBOMCost(
    @Args('input') input: BOMCostCalculationDto
  ): Promise<BOMCostBreakdown> {
    return this.bomService.calculateBOMCost(input);
  }

  @Query('bomExplosion')
  async explodeBOM(
    @Args('input') input: BOMExplosionDto
  ): Promise<BOMExplosionResult> {
    return this.bomService.explodeBOM(input);
  }

  @Mutation('createBOM')
  async createBOM(
    @Args('input') createBomDto: CreateBOMDto,
    @Context() context: any
  ): Promise<BOM> {
    const userId = context.req.user.id;
    return this.bomService.createBOM(createBomDto, userId);
  }

  @Mutation('updateBOM')
  async updateBOM(
    @Args('id') id: string,
    @Args('input') updateBomDto: UpdateBOMDto,
    @Context() context: any
  ): Promise<BOM> {
    const userId = context.req.user.id;
    return this.bomService.updateBOM(id, updateBomDto, userId);
  }

  @Mutation('deleteBOM')
  async deleteBOM(
    @Args('id') id: string,
    @Context() context: any
  ): Promise<boolean> {
    const userId = context.req.user.id;
    await this.bomService.deleteBOM(id, userId);
    return true;
  }

  @Mutation('createBOMVersion')
  async createBOMVersion(
    @Args('input') createVersionDto: CreateBOMVersionDto,
    @Context() context: any
  ): Promise<BOM> {
    const userId = context.req.user.id;
    return this.bomService.createBOMVersion(createVersionDto, userId);
  }
}
