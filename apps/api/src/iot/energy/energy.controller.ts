import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '../../swagger';
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
    @CurrentCompany() companyId: string,
    @Query('days') days: number = 7
  ) {
    return this.energyService.getConsumptionByMeter(meterId, companyId, days);
  }

  @Get('total')
  async getTotalConsumption(
    @CurrentCompany() companyId: string,
    @Query('meterType') meterType?: string
  ) {
    return this.energyService.getTotalConsumption(companyId, meterType);
  }
}

