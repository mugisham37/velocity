import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum DeviceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
  OFFLINE = 'offline',
}

export class CreateIoTDeviceDto {
  @ApiProperty({ description: 'Unique device identifier' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  deviceId: string;

  @ApiProperty({ description: 'Device name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Device description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Device type' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  deviceType: string;

  @ApiPropertyOptional({ description: 'Device manufacturer' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Device model' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({ description: 'Firmware version' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firmwareVersion?: string;

  @ApiPropertyOptional({
    description: 'Device status',
    enum: DeviceStatus,
    default: DeviceStatus.INACTIVE,
  })
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @ApiPropertyOptional({
    description: 'Device location',
    example: {
      lat: 40.7128,
      lng: -74.006,
      address: '123 Main St',
      building: 'A',
      floor: '2',
      room: '201',
    },
  })
  @IsOptional()
  @IsObject()
  location?: {
    lat?: number;
    lng?: number;
    address?: string;
    building?: string;
    floor?: string;
    room?: string;
  };

  @ApiPropertyOptional({ description: 'Device configuration' })
  @IsOptional()
  @IsObject()
  configuration?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional device metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Associated asset ID' })
  @IsOptional()
  @IsUUID()
  assetId?: string;
}
