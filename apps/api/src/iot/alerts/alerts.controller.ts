import {
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentCompany } from '../../auth/decorators/current-company.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { IoTAlertsService } from './alerts.service';

@ApiTags('IoT Alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('iot/alerts')
export class IoTAlertsController {
  constructor(private readonly alertsService: IoTAlertsService) {}

  @Get()
  async findAll(
    @Query('limit') limit: number = 50,
    @CurrentCompany() companyId: string
  ) {
    return this.alertsService.findAll(companyId, limit);
  }

  @Post(':id/acknowledge')
  async acknowledge(
    @Param('id', ParseUUIDPipe) alertId: string,
    @CurrentUser('id') userId: string,
    @CurrentCompany() companyId: string
  ) {
    return this.alertsService.acknowledge(alertId, userId, companyId);
  }
}
