import { PartialType } from '@nestjs/swagger';
import { CreateIoTDeviceDto } from './create-device.dto';

export class UpdateIoTDeviceDto extends PartialType(CreateIoTDeviceDto) {}
