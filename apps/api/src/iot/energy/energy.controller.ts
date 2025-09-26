import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentCompany } from '../../auth/decorators/current-company.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { EnergyMonitoringService } from './energy.service';

@ApiTags('Energy Monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('iot/energy')
export class EnergyMonitoringController {
  constructor(private readonly energyService: EnergyMonitoringService) {}

  @Get('meter/:meterId')
  async getByMeter(
    @Param('meterId') meterId: string,
    @Query('days') days: number = 7,
    @CurrentCompany() companyId: string
  ) {
    return this.energyService.getConsumptionByMeter(meterId, companyId, days);
  }

  @Get('total')
  async getTotalConsumption(
    @Query('meterType') meterType?: string,
    @CurrentCompany() companyId: string
  ) {
    return this.energyService.getTotalConsumption(companyId, meterType);
  }
}
