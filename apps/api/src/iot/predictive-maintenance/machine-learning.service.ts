import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

interface TrainingData {
  features: number[][];
  targets: number[];
  featureNames: string[];
}

interface ModelMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  mse?: number;
  rmse?: number;
  mae?: number;
  r2Score?: number;
}

interface TrainedModel {
  modelPath: string;
  metrics: ModelMetrics;
  featureImportance?: Record<string, number>;
  trainingInfo: {
    trainingSize: number;
    testSize: number;
    trainingTime: number;
    algorithm: string;
    hyperparameters: Record<string, any>;
  };
}

@Injectable()
export class MachineLearningService {
  private readonly logger = new Logger(MachineLearningService.name);
  private readonly modelsPath: string;

  constructor(private readonly configService: ConfigService) {
    this.modelsPath = this.configService.get<string>(
      'ML_MODELS_PATH',
      './ml-models'
    );
    this.ensureModelsDirectory();
  }

  private async ensureModelsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.modelsPath, { recursive: true });
    } catch (error) {
      this.logger.error(`Failed to create models directory: ${error.message}`);
    }
  }

  async trainModel(
    modelId: string,
    algorithm: string,
    modelType: string,
    trainingData: TrainingData,
    hyperparameters: Record<string, any> = {}
  ): Promise<TrainedModel> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Starting training for model ${modelId} using ${algorithm}`
      );

      // Validate training data
      this.validateTrainingData(trainingData);

      // Split data into training and test sets
      const { trainData, testData } = this.splitData(trainingData, 0.8);

      // Train model based on algorithm
      const trdel = await this.trainByAlgorithm(
        algorithm,
        modelType,
        trainData,
        testData,
        hyperparameters
      );

      // Save model to disk
      const modelPath = path.join(this.modelsPath, `${modelId}.json`);
      await this.saveModel(trainedModel, modelPath);

      const trainingTime = Date.now() - startTime;

      const result: TrainedModel = {
        modelPath,
        metrics: trainedModel.metrics,
        featureImportance: trainedModel.featureImportance,
        trainingInfo: {
          trainingSize: trainData.features.length,
          testSize: testData.features.length,
          trainingTime,
          algorithm,
          hyperparameters,
        },
      };

      this.logger.log(
        `Model ${modelId} trained successfully in ${trainingTime}ms`
      );
      return result;
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
    features: Record<string, number>,
    featureNames: string[]
  ): Promise<{
    prediction: number;
    confidence?: number;
    featureContributions?: Record<string, number>;
  }> {
    try {
      const modelPath = path.join(this.modelsPath, `${modelId}.json`);
      const model = await this.loadModel(modelPath);

      // Convert features object to array in correct order
      const featureArray = featureNames.map(name => features[name] || 0);

      // Make prediction
      const prediction = await this.makePrediction(model, featureArray);

      this.logger.debug(
        `Prediction made for model ${modelId}: ${prediction.prediction}`
      );

      return prediction;
    } catch (error) {
      this.logger.error(
        `Failed to make prediction with model ${modelId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  private validateTrainingData(data: TrainingData): void {
    if (!data.features || !data.targets || !data.featureNames) {
      throw new Error(
        'Training data must include features, targets, and featureNames'
      );
    }

    if (data.features.length !== data.targets.length) {
      throw new Error('Features and targets must have the same length');
    }

    if (data.features.length === 0) {
      throw new Error('Training data cannot be empty');
    }

    if (data.features[0].length !== data.featureNames.length) {
      throw new Error('Feature array length must match featureNames length');
    }
  }

  private splitData(
    data: TrainingData,
    trainRatio: number
  ): { trainData: TrainingData; testData: TrainingData } {
    const totalSize = data.features.length;
    const trainSize = Math.floor(totalSize * trainRatio);

    // Shuffle data
    const indices = Array.from({ length: totalSize }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const trainIndices = indices.slice(0, trainSize);
    const testIndices = indices.slice(trainSize);

    return {
      trainData: {
        features: trainIndices.map(i => data.features[i]),
        targets: trainIndices.map(i => data.targets[i]),
        featureNames: data.featureNames,
      },
      testData: {
        features: testIndices.map(i => data.features[i]),
        targets: testIndices.map(i => data.targets[i]),
        featureNames: data.featureNames,
      },
    };
  }

  private async trainByAlgorithm(
    algorithm: string,
    modelType: string,
    trainData: TrainingData,
    testData: TrainingData,
    hyperparameters: Record<string, any>
  ): Promise<any> {
    // This is a simplified implementation
    // In a real-world scenario, you would integrate with actual ML libraries
    // like scikit-learn (via Python bridge), TensorFlow.js, or ML.js

    switch (algorithm) {
      case 'random_forest':
        return this.trainRandomForest(trainData, testData, hyperparameters);
      case 'linear_regression':
        return this.trainLinearRegression(trainData, testData, hyperparameters);
      case 'neural_network':
        return this.trainNeuralNetwork(trainData, testData, hyperparameters);
      case 'isolation_forest':
        return this.trainIsolationForest(trainData, testData, hyperparameters);
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }
  }

  private async trainRandomForest(
    trainData: TrainingData,
    testData: TrainingData,
    hyperparameters: Record<string, any>
  ): Promise<any> {
    // Mock implementation - replace with actual Random Forest training
    this.logger.log('Training Random Forest model (mock implementation)');

    // Simulate training time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock metrics
    const metrics: ModelMetrics = {
      accuracy: 0.85 + Math.random() * 0.1,
      precision: 0.82 + Math.random() * 0.1,
      recall: 0.88 + Math.random() * 0.1,
      f1Score: 0.85 + Math.random() * 0.1,
    };

    // Mock feature importance
    const featureImportance: Record<string, number> = {};
    trainData.featureNames.forEach(name => {
      featureImportance[name] = Math.random();
    });

    return {
      algorithm: 'random_forest',
      metrics,
      featureImportance,
      hyperparameters,
      modelData: {
        // Mock model data
        trees: hyperparameters.n_estimators || 100,
        maxDepth: hyperparameters.max_depth || 10,
      },
    };
  }

  private async trainLinearRegression(
    trainData: TrainingData,
    testData: TrainingData,
    hyperparameters: Record<string, any>
  ): Promise<any> {
    // Mock implementation - replace with actual Linear Regression training
    this.logger.log('Training Linear Regression model (mock implementation)');

    await new Promise(resolve => setTimeout(resolve, 500));

    const metrics: ModelMetrics = {
      mse: 0.1 + Math.random() * 0.05,
      rmse: Math.sqrt(0.1 + Math.random() * 0.05),
      mae: 0.08 + Math.random() * 0.04,
      r2Score: 0.75 + Math.random() * 0.2,
    };

    return {
      algorithm: 'linear_regression',
      metrics,
      hyperparameters,
      modelData: {
        // Mock coefficients
        coefficients: trainData.featureNames.map(() => Math.random() * 2 - 1),
        intercept: Math.random() * 2 - 1,
      },
    };
  }

  private async trainNeuralNetwork(
    trainData: TrainingData,
    testData: TrainingData,
    hyperparameters: Record<string, any>
  ): Promise<any> {
    // Mock implementation - replace with actual Neural Network training
    this.logger.log('Training Neural Network model (mock implementation)');

    await new Promise(resolve => setTimeout(resolve, 2000));

    const metrics: ModelMetrics = {
      accuracy: 0.88 + Math.random() * 0.1,
      precision: 0.85 + Math.random() * 0.1,
      recall: 0.9 + Math.random() * 0.08,
      f1Score: 0.87 + Math.random() * 0.1,
    };

    return {
      algorithm: 'neural_network',
      metrics,
      hyperparameters,
      modelData: {
        // Mock network structure
        layers: hyperparameters.layers || [64, 32, 16],
        activation: hyperparameters.activation || 'relu',
        optimizer: hyperparameters.optimizer || 'adam',
      },
    };
  }

  private async trainIsolationForest(
    trainData: TrainingData,
    testData: TrainingData,
    hyperparameters: Record<string, any>
  ): Promise<any> {
    // Mock implementation for anomaly detection
    this.logger.log('Training Isolation Forest model (mock implementation)');

    await new Promise(resolve => setTimeout(resolve, 800));

    const metrics: ModelMetrics = {
      precision: 0.78 + Math.random() * 0.15,
      recall: 0.82 + Math.random() * 0.12,
      f1Score: 0.8 + Math.random() * 0.13,
    };

    return {
      algorithm: 'isolation_forest',
      metrics,
      hyperparameters,
      modelData: {
        contamination: hyperparameters.contamination || 0.1,
        n_estimators: hyperparameters.n_estimators || 100,
      },
    };
  }

  private async saveModel(model: any, modelPath: string): Promise<void> {
    try {
      await fs.writeFile(modelPath, JSON.stringify(model, null, 2));
      this.logger.debug(`Model saved to ${modelPath}`);
    } catch (error) {
      this.logger.error(`Failed to save model: ${error.message}`);
      throw error;
    }
  }

  private async loadModel(modelPath: string): Promise<any> {
    try {
      const modelData = await fs.readFile(modelPath, 'utf-8');
      return JSON.parse(modelData);
    } catch (error) {
      this.logger.error(
        `Failed to load model from ${modelPath}: ${error.message}`
      );
      throw error;
    }
  }

  private async makePrediction(
    model: any,
    features: number[]
  ): Promise<{
    prediction: number;
    confidence?: number;
    featureContributions?: Record<string, number>;
  }> {
    // Mock prediction logic - replace with actual model inference

    switch (model.algorithm) {
      case 'random_forest':
        return {
          prediction: Math.random() * 100, // Mock failure probability
          confidence: 0.7 + Math.random() * 0.3,
        };

      case 'linear_regression':
        // Simple linear combination for mock
        const prediction = features.reduce((sum, feature, index) => {
          const coeff = model.modelData.coefficients[index] || 0;
          return sum + feature * coeff;
        }, model.modelData.intercept || 0);

        return {
          prediction,
          confidence: 0.8 + Math.random() * 0.2,
        };

      case 'neural_network':
        return {
          prediction: Math.random() * 100,
          confidence: 0.75 + Math.random() * 0.25,
        };

      case 'isolation_forest':
        return {
          prediction: Math.random() > 0.9 ? 1 : 0, // Anomaly score
          confidence: 0.6 + Math.random() * 0.4,
        };

      default:
        throw new Error(
          `Prediction not implemented for algorithm: ${model.algorithm}`
        );
    }
  }

  async deleteModel(modelId: string): Promise<void> {
    try {
      const modelPath = path.join(this.modelsPath, `${modelId}.json`);
      await fs.unlink(modelPath);
      this.logger.log(`Model ${modelId} deleted successfully`);
    } catch (error) {
      this.logger.error(`Failed to delete model ${modelId}: ${error.message}`);
      throw error;
    }
  }

  async getModelInfo(modelId: string): Promise<any> {
    try {
      const modelPath = path.join(this.modelsPath, `${modelId}.json`);
      return await this.loadModel(modelPath);
    } catch (error) {
      this.logger.error(
        `Failed to get model info for ${modelId}: ${error.message}`
      );
      throw error;
    }
  }
}
