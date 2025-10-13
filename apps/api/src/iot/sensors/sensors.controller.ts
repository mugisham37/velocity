import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '../../swagger';
import { CurrentCompany } from '../../auth/decorators/current-company.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { IoTSensorsService } from './sensors.service';

@ApiTags('IoT Sensors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('iot/sensors')
export class IoTSensorsController {
  constructor(private readonly sensorsService: IoTSensorsService) {}

  @Get('device/:deviceId')
  async findByDevice(
    @Param('deviceId') deviceId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.sensorsService.findByDevice(deviceId, companyId);
  }
}

