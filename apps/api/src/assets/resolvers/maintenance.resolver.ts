import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentCompany } from '../../auth/decorators/current-company.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CompleteMaintenanceWorkOrderDto,
  CreateMaintenanceCostDto,
  CreateMaintenanceHistoryDto,
  CreateMaintenanceScheduleDto,
  CreateMaintenanceWorkOrderDto,
  CreateSparePartDto,
  MaintenanceScheduleFilterDto,
  MaintenanceWorkOrderFilterDto,
  SparePartFilterDto,
  UpdateMaintenanceCostDto,
  UpdateMaintenanceHistoryDto,
  UpdateMaintenanceScheduleDto,
  UpdateMaintenanceWorkOrderDto,
  UpdateSparePartDto,
} from '../dto/maintenance.dto';
import { MaintenanceService } from '../services/maintenance.service';

@Resolver('MaintenanceSchedule')
@UseGuards(JwtAuthGuard)
export class MaintenanceResolver {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  // Maintenance Schedule Queries
  @Query('maintenanceSchedule')
  async maintenanceSchedule(
    @Args('id') id: string,
    @CurrentCompany() companyId: string
  ) {
    return this.maintenanceService.findMaintenanceScheduleById(id, companyId);
  }

  @Query('maintenanceSchedules')
  async maintenanceSchedules(
    @Args('filter') filter: MaintenanceScheduleFilterDto,
    @CurrentCompany() companyId: string
  ) {
    return this.maintenanceService.findMaintenanceSchedules(filter, companyId);
  }

  // Maintenance Work Order Queries
  @Query('maintenanceWorkOrder')
  async maintenanceWorkOrder(
    @Args('id') id: string,
    @CurrentCompany() companyId: string
  ) {
    return this.maintenanceService.findMaintenanceWorkOrderById(id, companyId);
  }

  @Query('maintenanceWorkOrders')
  async maintenanceWorkOrders(
    @Args('filter') filter: MaintenanceWorkOrderFilterDto,
    @CurrentCompany() companyId: string
  ) {
    return this.maintenanceService.findMaintenanceWorkOrders(filter, companyId);
  }

  // Maintenance History Queries
  @Query('maintenanceHistory')
  async maintenanceHistory(
    @Args('id') id: string,
    @CurrentCompany() companyId: string
  ) {
    return this.maintenanceService.findMaintenanceHistoryById(id, companyId);
  }

  @Query('maintenanceHistoryByAsset')
  async maintenanceHistoryByAsset(
    @Args('assetId') assetId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.maintenanceService.findMaintenanceHistoryByAsset(
      assetId,
      companyId
    );
  }

  // Spare Part Queries
  @Query('sparePart')
  async sparePart(@Args('id') id: string, @CurrentCompany() companyId: string) {
    return this.maintenanceService.findSparePartById(id, companyId);
  }

  @Query('spareParts')
  async spareParts(
    @Args('filter') filter: SparePartFilterDto,
    @CurrentCompany() companyId: string
  ) {
    return this.maintenanceService.findSpareParts(filter, companyId);
  }

  // Maintenance Cost Queries
  @Query('maintenanceCost')
  async maintenanceCost(
    @Args('id') id: string,
    @CurrentCompany() companyId: string
  ) {
    return this.maintenanceService.findMaintenanceCostById(id, companyId);
  }

  @Query('maintenanceCostsByWorkOrder')
  async maintenanceCostsByWorkOrder(
    @Args('workOrderId') workOrderId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.maintenanceService.findMaintenanceCostsByWorkOrder(
      workOrderId,
      companyId
    );
  }

  // Maintenance Schedule Mutations
  @Mutation('createMaintenanceSchedule')
  async createMaintenanceSchedule(
    @Args('input') input: CreateMaintenanceScheduleDto,
    @CurrentUser() userId: string
  ) {
    return this.maintenanceService.createMaintenanceSchedule(input, userId);
  }

  @Mutation('updateMaintenanceSchedule')
  async updateMaintenanceSchedule(
    @Args('id') id: string,
    @Args('input') input: UpdateMaintenanceScheduleDto,
    @CurrentUser() userId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.maintenanceService.updateMaintenanceSchedule(
      id,
      input,
      userId,
      companyId
    );
  }

  // Maintenance Work Order Mutations
  @Mutation('createMaintenanceWorkOrder')
  async createMaintenanceWorkOrder(
    @Args('input') input: CreateMaintenanceWorkOrderDto,
    @CurrentUser() userId: string
  ) {
    return this.maintenanceService.createMaintenanceWorkOrder(input, userId);
  }

  @Mutation('updateMaintenanceWorkOrder')
  async updateMaintenanceWorkOrder(
    @Args('id') id: string,
    @Args('input') input: UpdateMaintenanceWorkOrderDto,
    @CurrentUser() userId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.maintenanceService.updateMaintenanceWorkOrder(
      id,
      input,
      userId,
      companyId
    );
  }

  @Mutation('startMaintenanceWorkOrder')
  async startMaintenanceWorkOrder(
    @Args('id') id: string,
    @CurrentUser() userId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.maintenanceService.startMaintenanceWorkOrder(
      id,
      userId,
      companyId
    );
  }

  @Mutation('completeMaintenanceWorkOrder')
  async completeMaintenanceWorkOrder(
    @Args('id') id: string,
    @Args('input') input: CompleteMaintenanceWorkOrderDto,
    @CurrentUser() userId: string
  ) {
    return this.maintenanceService.completeMaintenanceWorkOrder(
      id,
      input,
      userId
    );
  }

  // Maintenance History Mutations
  @Mutation('createMaintenanceHistory')
  async createMaintenanceHistory(
    @Args('input') input: CreateMaintenanceHistoryDto,
    @CurrentUser() userId: string
  ) {
    return this.maintenanceService.createMaintenanceHistory(input, userId);
  }

  @Mutation('updateMaintenanceHistory')
  async updateMaintenanceHistory(
    @Args('id') id: string,
    @Args('input') input: UpdateMaintenanceHistoryDto,
    @CurrentUser() userId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.maintenanceService.updateMaintenanceHistory(
      id,
      input,
      userId,
      companyId
    );
  }

  // Spare Part Mutations
  @Mutation('createSparePart')
  async createSparePart(
    @Args('input') input: CreateSparePartDto,
    @CurrentUser() userId: string
  ) {
    return this.maintenanceService.createSparePart(input, userId);
  }

  @Mutation('updateSparePart')
  async updateSparePart(
    @Args('id') id: string,
    @Args('input') input: UpdateSparePartDto,
    @CurrentUser() userId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.maintenanceService.updateSparePart(
      id,
      input,
      userId,
      companyId
    );
  }

  // Maintenance Cost Mutations
  @Mutation('createMaintenanceCost')
  async createMaintenanceCost(
    @Args('input') input: CreateMaintenanceCostDto,
    @CurrentUser() userId: string
  ) {
    return this.maintenanceService.createMaintenanceCost(input, userId);
  }

  @Mutation('updateMaintenanceCost')
  async updateMaintenanceCost(
    @Args('id') id: string,
    @Args('input') input: UpdateMaintenanceCostDto,
    @CurrentUser() userId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.maintenanceService.updateMaintenanceCost(
      id,
      input,
      userId,
      companyId
    );
  }
}

