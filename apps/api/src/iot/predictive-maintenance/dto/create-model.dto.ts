import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum ModelType {
  REGRESSION = 'regression',
  CLASSIFICATION = 'classification',
  ANOMALY_DETECTION = 'anomaly_detection',
  TIME_SERIES = 'time_series',
}

export enum Algorithm {
  RANDOM_FOREST = 'random_forest',
  SVM = 'svm',
  NEURAL_NETWORK = 'neural_network',
  LINEAR_REGRESSION = 'linear_regression',
  LOGISTIC_REGRESSION = 'logistic_regression',
  ISOLATION_FOREST = 'isolation_forest',
  LSTM = 'lstm',
  ARIMA = 'arima',
}

export class CreatePredictiveMaintenanceModelDto {
  @ApiProperty({ description: 'Model name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Model description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Model type', enum: ModelType })
  @IsEnum(ModelType)
  modelType: ModelType;

  @ApiProperty({ description: 'Machine learning algorithm', enum: Algorithm })
  @IsEnum(Algorithm)
  algorithm: Algorithm;

  @ApiProperty({ description: 'Target variable to predict' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  targetVariable: string;

  @ApiProperty({
    description: 'Feature names used for prediction',
    type: [String],
    example: ['temperature', 'vibration', 'pressure', 'runtime_hours'],
  })
  @IsArray()
  @IsString({ each: true })
  features: string[];

  @ApiPropertyOptional({
    description: 'Model hyperparameters',
    example: { n_estimators: 100, max_depth: 10, learning_rate: 0.1 },
  })
  @IsOptional()
  @IsObject()
  hyperparameters?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Training data configuration',
    example: {
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      deviceIds: ['device1', 'device2'],
      sampleSize: 10000,
    },
  })
  @IsOptional()
  @IsObject()
  trainingData?: {
    startDate?: string;
    endDate?: string;
    deviceIds?: string[];
    sampleSize?: number;
    filters?: Record<string, any>;
  };
}

export class UpdatePredictiveMaintenanceModelDto {
  @ApiPropertyOptional({ description: 'Model name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Model description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Model hyperparameters' })
  @IsOptional()
  @IsObject()
  hyperparameters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Training data configuration' })
  @IsOptional()
  @IsObject()
  trainingData?: Record<string, any>;
}

export class TrainModelDto {
  @ApiPropertyOptional({
    description: 'Training data configuration override',
    example: {
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      deviceIds: ['device1', 'device2'],
    },
  })
  @IsOptional()
  @IsObject()
  trainingConfig?: {
    startDate?: string;
    endDate?: string;
    deviceIds?: string[];
    sampleSize?: number;
    testSplit?: number;
    validationSplit?: number;
  };

  @ApiPropertyOptional({
    description: 'Force retrain even if model is up to date',
  })
  @IsOptional()
  forceRetrain?: boolean;
}

export class PredictMaintenanceDto {
  @ApiProperty({ description: 'Asset ID to predict maintenance for' })
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @ApiPropertyOptional({ description: 'Device ID associated with the asset' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({
    description: 'Feature values for prediction',
    example: {
      temperature: 75.5,
      vibration: 2.3,
      pressure: 150.2,
      runtime_hours: 1250,
    },
  })
  @IsOptional()
  @IsObject()
  features?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Prediction horizon in days' })
  @IsOptional()
  predictionHorizon?: number;
}
