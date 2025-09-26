import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Workstation } from '@velocity/database/schema';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CreateWorkstationDto,
  UpdateWorkstationDto,
  WorkstationCapacityInfo,
  WorkstationCostBreakdown,
  WorkstationFilterDto,
} from '../dto/workstation.dto';
import { WorkstationService } from '../services/workstation.service';

@Resolver('Workstation')
@UseGuards(JwtAuthGuard)
export class WorkstationResolver {
  constructor(private readonly workstationService: WorkstationService) {}

  @Query('workstation')
  async getWorkstation(@Args('id') id: string): Promise<Workstation> {
    return this.workstationService.findWorkstationById(id);
  }

  @Query('workstations')
  async getWorkstations(
    @Args('filter') filter: WorkstationFilterDto
  ): Promise<Workstation[]> {
    return this.workstationService.findWorkstations(filter);
  }

  @Query('workstationsByCompany')
  async getWorkstationsByCompany(
    @Args('companyId') companyId: string
  ): Promise<Workstation[]> {
    return this.workstationService.getWorkstationsByCompany(companyId);
  }

  @Query('workstationsByType')
  async getWorkstationsByType(
    @Args('companyId') companyId: string,
    @Args('workstationType') workstationType: string
  ): Promise<Workstation[]> {
    return this.workstationService.getWorkstationsByType(
      companyId,
      workstationType
    );
  }

  @Query('workstationCapacity')
  async getWorkstationCapacity(
    @Args('id') id: string
  ): Promise<WorkstationCapacityInfo> {
    return this.workstationService.getWorkstationCapacityInfo(id);
  }

  @Query('workstationCostBreakdown')
  async getWorkstationCostBreakdown(
    @Args('id') id: string
  ): Promise<WorkstationCostBreakdown> {
    return this.workstationService.getWorkstationCostBreakdown(id);
  }

  @Mutation('createWorkstation')
  async createWorkstation(
    @Args('input') createWorkstationDto: CreateWorkstationDto
  ): Promise<Workstation> {
    return this.workstationService.createWorkstation(createWorkstationDto);
  }

  @Mutation('updateWorkstation')
  async updateWorkstation(
    @Args('id') id: string,
    @Args('input') updateWorkstationDto: UpdateWorkstationDto
  ): Promise<Workstation> {
    return this.workstationService.updateWorkstation(id, updateWorkstationDto);
  }

  @Mutation('deleteWorkstation')
  async deleteWorkstation(@Args('id') id: string): Promise<boolean> {
    await this.workstationService.deleteWorkstation(id);
    return true;
  }
}
