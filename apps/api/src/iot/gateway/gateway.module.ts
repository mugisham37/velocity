import { Module } from '@nestjs/common';
import { IoTDevicesModule } from '../devices/devices.module';
import { DataProcessingService } from './data-processing.service';
import { IoTGatewayController } from './gateway.controller';
import { IoTGatewayService } from './gateway.service';
import { HttpGatewayService } from './http-gateway.service';
import { MqttGatewayService } from './mqtt-gateway.service';

@Module({
  imports: [IoTDevicesModule],
  providers: [
    IoTGatewayService,
    MqttGatewayService,
    HttpGatewayService,
    DataProcessingService,
  ],
  controllers: [IoTGatewayController],
  exports: [
    IoTGatewayService,
    MqttGatewayService,
    HttpGatewayService,
    DataProcessingService,
  ],
})
export class IoTGatewayModule {}

