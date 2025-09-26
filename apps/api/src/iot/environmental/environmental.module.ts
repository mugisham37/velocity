import { Module } from '@nestjs/common';
import { EnvironmentalMonitoringController } from './environmental.controller';
import { EnvironmentalMonitoringService } from './environmental.service';

@Module({
  providers: [EnvironmentalMonitoringService],
  controllers: [EnvironmentalMonitoringController],
  exports: [EnvironmentalMonitoringService],
})
export class EnvironmentalMonitoringModule {}
