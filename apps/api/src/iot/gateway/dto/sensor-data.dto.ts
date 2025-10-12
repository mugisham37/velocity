import { ApiProperty, ApiPropertyOptional } from '../../../swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class SensorDataDto {
  @ApiProperty({ description: 'Device identifier' })
  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @ApiProperty({ description: 'Sensor type' })
  @IsString()
  @IsNotEmpty()
  sensorType!: string;

  @ApiProperty({ description: 'Measurement type' })
  @IsString()
  @IsNotEmpty()
  measurementType!: string;

  @ApiProperty({ description: 'Sensor value' })
  @IsNumber()
  value!: number;

  @ApiPropertyOptional({ description: 'Unit of measurement' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Location data' })
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

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Timestamp of the reading' })
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}

export class BulkSensorDataDto {
  @ApiProperty({
    description: 'Array of sensor readings',
    type: [SensorDataDto],
  })
  readings!: SensorDataDto[];
}

export class EquipmentMetricDto {
  @ApiProperty({ description: 'Equipment identifier' })
  @IsString()
  @IsNotEmpty()
  equipmentId!: string;

  @ApiProperty({ description: 'Metric name' })
  @IsString()
  @IsNotEmpty()
  metricName!: string;

  @ApiProperty({ description: 'Metric value' })
  @IsNumber()
  metricValue!: number;

  @ApiPropertyOptional({ description: 'Unit of measurement' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Status indicator' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Alert threshold' })
  @IsOptional()
  @IsNumber()
  alertThreshold?: number;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Timestamp of the metric' })
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}
