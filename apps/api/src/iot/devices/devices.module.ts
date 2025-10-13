import { Module } from '@nestjs/common';
import { IoTDevicesController } from './devices.controller';
import { IoTDevicesResolver } from './devices.resolver';
import { IoTDevicesService } from './devices.service';

@Module({
  providers: [IoTDevicesService, IoTDevicesResolver],
  controllers: [IoTDevicesController],
  exports: [IoTDevicesService],
})
export class IoTDevicesModule {}

