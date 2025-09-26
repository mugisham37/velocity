import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentCompany } from '../../auth/decorators/current-company.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { IoTAnalyticsService } from './analytics.service';

@ApiTags('IoT Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('iot/analytics')
export class IoTAnalyticsController {
  constructor(private readonly analyticsService: IoTAnalyticsService) {}

  @Get('device/:deviceId')
  async getDeviceAnalytics(
    @Param('deviceId') deviceId: string,
    @Query('timeRange') timeRange: string = '24h',
    @CurrentCompany() companyId: string
  ) {
    return this.analyticsService.getDeviceAnalytics(
      deviceId,
      companyId,
      timeRange
    );
  }

  @Get('equipment/:equipmentId/efficiency')
  async getEquipmentEfficiency(
    @Param('equipmentId') equipmentId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.analyticsService.getEquipmentEfficiency(equipmentId, companyId);
  }

  @Get('overview')
  async getOverview(@CurrentCompany() companyId: string) {
    return this.analyticsService.getCompanyIoTOverview(companyId);
  }
}
