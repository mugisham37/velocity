import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { db, and, desc, eq } from '@kiro/database';
import {
  predictiveMaintenanceModels,
  predictiveMaintenancePredictions,
  type NewPredictiveMaintenanceModel,
  type NewPredictiveMaintenancePrediction,
  type PredictiveMaintenanceModel,
  type PredictiveMaintenancePrediction,
} from '@kiro/database';
import { 
  CreatePredictiveMaintenanceModelDto,
  TrainModelDto,
  PredictMaintenanceDto 
} from './dto/create-model.dto';
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

      if (!model) {
        throw new Error('Failed to create predictive maintenance model');
      }

      this.logger.log(
        `Created predictive maintenance model: ${model.name} for company: ${companyId}`
      );
      return model;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to create predictive maintenance model: ${errorMessage}`,
        errorStack
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
          accuracy: trainedModel.metrics.accuracy?.toString() || null,
          precision: trainedModel.metrics.precision?.toString() || null,
          recall: trainedModel.metrics.recall?.toString() || null,
          f1Score: trainedModel.metrics.f1Score?.toString() || null,
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

      if (!updatedModel) {
        throw new Error('Failed to update model after training');
      }

      this.logger.log(`Trained predictive maintenance model: ${model.name}`);
      return updatedModel;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to train model ${modelId}: ${errorMessage}`,
        errorStack
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
      const modelFeatures = Array.isArray(model.features) ? model.features : [];
      const prediction = await this.mlService.predict(
        modelId,
        features,
        modelFeatures
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
        deviceId: predictDto.deviceId || null,
        predictionType,
        predictedValue: prediction.prediction.toString(),
        confidence: prediction.confidence?.toString() || null,
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

      if (!savedPrediction) {
        throw new Error('Failed to save prediction');
      }

      this.logger.log(
        `Made prediction for asset ${predictDto.assetId} using model ${model.name}`
      );
      return savedPrediction;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to make prediction: ${errorMessage}`,
        errorStack
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to fetch predictive maintenance models: ${errorMessage}`,
        errorStack
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to fetch predictive maintenance model ${id}: ${errorMessage}`,
        errorStack
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to fetch predictions for asset ${assetId}: ${errorMessage}`,
        errorStack
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
      const modelFeatures = Array.isArray(model.features) ? model.features : [];
      const featureRow = modelFeatures.map(() => Math.random() * 100);
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

    const modelFeatures = Array.isArray(model.features) ? model.features : [];
    return {
      features,
      targets,
      featureNames: modelFeatures,
    };
  }

  private async extractFeatures(
    _assetId: string,
    _deviceId?: string
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to delete model ${id}: ${errorMessage}`,
        errorStack
      );
      throw error;
    }
  }
}
