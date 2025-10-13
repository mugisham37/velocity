import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '../../swagger';
import { CurrentCompany } from '../../auth/decorators/current-company.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { EnvironmentalMonitoringService } from './environmental.service';

@ApiTags('Environmental Monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('iot/environmental')
export class EnvironmentalMonitoringController {
  constructor(
    private readonly environmentalService: EnvironmentalMonitoringService
  ) {}

  @Get('location/:locationId')
  async getByLocation(
    @Param('locationId') locationId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.environmentalService.getLatestByLocation(locationId, companyId);
  }
}

