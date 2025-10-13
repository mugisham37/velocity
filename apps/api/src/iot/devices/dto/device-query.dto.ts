import { ApiPropertyOptional } from '../../../swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { DeviceStatus } from './create-device.dto';

export class DeviceQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by device status',
    enum: DeviceStatus,
  })
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @ApiPropertyOptional({ description: 'Filter by device type' })
  @IsOptional()
  @IsString()
  deviceType?: string;

  @ApiPropertyOptional({ description: 'Filter by manufacturer' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Filter by associated asset ID' })
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @ApiPropertyOptional({ description: 'Search by device name or ID' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter devices last seen after this date',
  })
  @IsOptional()
  @IsDateString()
  lastSeenAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter devices last seen before this date',
  })
  @IsOptional()
  @IsDateString()
  lastSeenBefore?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

