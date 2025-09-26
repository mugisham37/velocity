import { Module } from '@nestjs/common';
import { EnergyMonitoringController } from './energy.controller';
import { EnergyMonitoringService } from './energy.service';

@Module({
  providers: [EnergyMonitoringService],
  controllers: [EnergyMonitoringController],
  exports: [EnergyMonitoringService],
})
export class EnergyMonitoringModule {}
