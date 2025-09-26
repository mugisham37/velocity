import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { db } from '@velocity/database';
import {
  predictiveMaintenanceModels,
  predictiveMaintenancePredictions,
  type NewPredictiveMaintenanceModel,
  type NewPredictiveMaintenancePrediction,
  type PredictiveMaintenanceModel,
  type PredictiveMaintenancePrediction,
} from '@velocity/database/schema';
import { and, desc, eq } from 'drizzle-orm';
import { PredictMaintenanceDto } from './dto/create-model.dto';
import { MachineLearningService } from './machine-learning.service';

@Injectable()
export class PredictiveMaintenanceService {
  private readonly logger = new Logger(PredictiveMaintenanceService.name);

  constructor(private readonly mlService: MachineLearningService) {}

  async createModel(
    createModelDto: CreatePredictiveMaintenanceModelDto,
    companyId: string,
    userId: string
  ): Promise<PredictiveMaintenanceModel> {
    try {
      const newModel: NewPredictiveMaintenanceModel = {
        ...createModelDto,
        companyId,
        createdBy: userId,
        isActive: false, // Model needs to be trained first
      };

      const [model] = await db
        .insert(predictiveMaintenanceModels)
        .values(newModel)
        .returning();

      this.logger.log(
        `Created predictive maintenance model: ${model.name} for company: ${companyId}`
      );
      return model;
    } catch (error) {
      this.logger.error(
        `Failed to create predictive maintenance model: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async trainModel(
    modelId: string,
    trainDto: TrainModelDto,
    companyId: string
  ): Promise<PredictiveMaintenanceModel> {
    try {
      // Get model details
      const model = await this.findOne(modelId, companyId);

      // Prepare training data
      const trainingData = await this.prepareTrainingData(
        model,
        trainDto.trainingConfig
      );

      // Train the model using ML service
      const trainedModel = await this.mlService.trainModel(
        modelId,
        model.algorithm,
        model.modelType,
        trainingData,
        model.hyperparameters || {}
      );

      // Update model with training results
      const [updatedModel] = await db
        .update(predictiveMaintenanceModels)
        .set({
          modelPath: trainedModel.modelPath,
          accuracy: trainedModel.metrics.accuracy?.toString(),
          precision: trainedModel.metrics.precision?.toString(),
          recall: trainedModel.metrics.recall?.toString(),
          f1Score: trainedModel.metrics.f1Score?.toString(),
          isActive: true,
          lastTrainedAt: new Date(),
          nextTrainingAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(predictiveMaintenanceModels.id, modelId),
            eq(predictiveMaintenanceModels.companyId, companyId)
          )
        )
        .returning();

      this.logger.log(`Trained predictive maintenance model: ${model.name}`);
      return updatedModel;
    } catch (error) {
      this.logger.error(
        `Failed to train model ${modelId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async predict(
    modelId: string,
    predictDto: PredictMaintenanceDto,
    companyId: string
  ): Promise<PredictiveMaintenancePrediction> {
    try {
      const model = await this.findOne(modelId, companyId);

      if (!model.isActive || !model.modelPath) {
        throw new Error('Model is not trained or not active');
      }

      // Get features for prediction
      const features =
        predictDto.features ||
        (await this.extractFeatures(predictDto.assetId, predictDto.deviceId));

      // Make prediction using ML service
      const prediction = await this.mlService.predict(
        modelId,
        features,
        model.features
      );

      // Determine prediction type based on model
      let predictionType = 'failure_probability';
      if (model.modelType === 'regression') {
        predictionType = 'remaining_useful_life';
      } else if (model.modelType === 'anomaly_detection') {
        predictionType = 'anomaly_score';
      }

      // Save prediction to database
      const newPrediction: NewPredictiveMaintenancePrediction = {
        modelId,
        assetId: predictDto.assetId,
        deviceId: predictDto.deviceId,
        predictionType,
        predictedValue: prediction.prediction.toString(),
        confidence: prediction.confidence?.toString(),
        features,
        companyId,
        validUntil: new Date(
          Date.now() + (predictDto.predictionHorizon || 7) * 24 * 60 * 60 * 1000
        ),
      };

      const [savedPrediction] = await db
        .insert(predictiveMaintenancePredictions)
        .values(newPrediction)
        .returning();

      this.logger.log(
        `Made prediction for asset ${predictDto.assetId} using model ${model.name}`
      );
      return savedPrediction;
    } catch (error) {
      this.logger.error(
        `Failed to make prediction: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async findAll(companyId: string): Promise<PredictiveMaintenanceModel[]> {
    try {
      return await db
        .select()
        .from(predictiveMaintenanceModels)
        .where(eq(predictiveMaintenanceModels.companyId, companyId))
        .orderBy(desc(predictiveMaintenanceModels.createdAt));
    } catch (error) {
      this.logger.error(
        `Failed to fetch predictive maintenance models: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async findOne(
    id: string,
    companyId: string
  ): Promise<PredictiveMaintenanceModel> {
    try {
      const [model] = await db
        .select()
        .from(predictiveMaintenanceModels)
        .where(
          and(
            eq(predictiveMaintenanceModels.id, id),
            eq(predictiveMaintenanceModels.companyId, companyId)
          )
        )
        .limit(1);

      if (!model) {
        throw new NotFoundException(
          `Predictive maintenance model with ID ${id} not found`
        );
      }

      return model;
    } catch (error) {
      this.logger.error(
        `Failed to fetch predictive maintenance model ${id}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async getPredictions(
    assetId: string,
    companyId: string,
    limit: number = 10
  ): Promise<PredictiveMaintenancePrediction[]> {
    try {
      return await db
        .select()
        .from(predictiveMaintenancePredictions)
        .where(
          and(
            eq(predictiveMaintenancePredictions.assetId, assetId),
            eq(predictiveMaintenancePredictions.companyId, companyId)
          )
        )
        .orderBy(desc(predictiveMaintenancePredictions.predictedAt))
        .limit(limit);
    } catch (error) {
      this.logger.error(
        `Failed to fetch predictions for asset ${assetId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  private async prepareTrainingData(
    model: PredictiveMaintenanceModel,
    trainingConfig?: any
  ): Promise<any> {
    // This is a simplified implementation
    // In a real scenario, you would query historical sensor data, maintenance records, etc.

    this.logger.log(`Preparing training data for model: ${model.name}`);

    // Mock training data preparation
    const sampleSize = trainingConfig?.sampleSize || 1000;
    const features: number[][] = [];
    const targets: number[] = [];

    for (let i = 0; i < sampleSize; i++) {
      // Generate mock feature data
      const featureRow = model.features.map(() => Math.random() * 100);
      features.push(featureRow);

      // Generate mock target based on model type
      let target: number;
      if (model.modelType === 'classification') {
        target = Math.random() > 0.8 ? 1 : 0; // 20% failure rate
      } else if (model.modelType === 'regression') {
        target = Math.random() * 1000; // Remaining useful life in hours
      } else {
        target = Math.random(); // Anomaly score
      }
      targets.push(target);
    }

    return {
      features,
      targets,
      featureNames: model.features,
    };
  }

  private async extractFeatures(
    assetId: string,
    deviceId?: string
  ): Promise<Record<string, number>> {
    // This would extract current feature values from sensor data
    // For now, return mock features

    return {
      temperature: 75.5 + Math.random() * 10,
      vibration: 2.0 + Math.random() * 2,
      pressure: 150 + Math.random() * 50,
      runtime_hours: 1000 + Math.random() * 500,
      efficiency: 0.8 + Math.random() * 0.2,
    };
  }

  async deleteModel(id: string, companyId: string): Promise<void> {
    try {
      const model = await this.findOne(id, companyId);

      // Delete the ML model file
      if (model.modelPath) {
        await this.mlService.deleteModel(id);
      }

      // Delete from database
      await db
        .delete(predictiveMaintenanceModels)
        .where(
          and(
            eq(predictiveMaintenanceModels.id, id),
            eq(predictiveMaintenanceModels.companyId, companyId)
          )
        );

      this.logger.log(`Deleted predictive maintenance model: ${model.name}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete model ${id}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
