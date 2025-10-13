import { Module } from '@nestjs/common';
import { IoTAnalyticsController } from './analytics.controller';
import { IoTAnalyticsService } from './analytics.service';

@Module({
  providers: [IoTAnalyticsService],
  controllers: [IoTAnalyticsController],
  exports: [IoTAnalyticsService],
})
export class IoTAnalyticsModule {}

