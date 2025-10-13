import { Module } from '@nestjs/common';
import { IoTSensorsController } from './sensors.controller';
import { IoTSensorsService } from './sensors.service';

@Module({
  providers: [IoTSensorsService],
  controllers: [IoTSensorsController],
  exports: [IoTSensorsService],
})
export class IoTSensorsModule {}

