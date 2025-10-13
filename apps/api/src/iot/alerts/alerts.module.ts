import { Module } from '@nestjs/common';
import { IoTAlertsController } from './alerts.controller';
import { IoTAlertsService } from './alerts.service';

@Module({
  providers: [IoTAlertsService],
  controllers: [IoTAlertsController],
  exports: [IoTAlertsService],
})
export class IoTAlertsModule {}

