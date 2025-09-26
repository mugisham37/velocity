import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { ForecastingService } from './services/forecasting.service';
import { IntelligentAutomationService } from './services/intelligent-automation.service';
import { MLPipelineService } from './services/ml-pipeline.service';
import { OCRService } from './services/ocr.service';
import { PredictiveAnalyticsService } from './services/predictive-analytics.service';
import { SmartCategorizationService } from './services/smart-categorization.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let predictiveAnalyticsService: PredictiveAnalyticsService;
  let intelligentAutomationService: IntelligentAutomationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        PredictiveAnalyticsService,
        IntelligentAutomationService,
        MLPipelineService,
        Foervice,
        AnomalyDetectionService,
        OCRService,
        SmartCategorizationService,
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    predictiveAnalyticsService = module.get<PredictiveAnalyticsService>(
      PredictiveAnalyticsService
    );
    intelligentAutomationService = module.get<IntelligentAutomationService>(
      IntelligentAutomationService
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAnalyticsSummary', () => {
    it('should return analytics summary', async () => {
      const result = await service.getAnalyticsSummary();

      expect(result).toHaveProperty('predictiveAnalytics');
      expect(result).toHaveProperty('intelligentAutomation');
      expect(result).toHaveProperty('timestamp');
      expect(result.predictiveAnalytics).toHaveProperty('activePredictions');
      expect(result.predictiveAnalytics).toHaveProperty('accuracy');
      expect(result.intelligentAutomation).toHaveProperty('activeAutomations');
    });
  });

  describe('generateInsights', () => {
    it('should generate insights for customer entity', async () => {
      const result = await service.generateInsights('customer', 'cust-123');

      expect(result).toHaveProperty('predictions');
      expect(result).toHaveProperty('automationSuggestions');
      expect(result).toHaveProperty('entityType', 'customer');
      expect(result).toHaveProperty('entityId', 'cust-123');
      expect(Array.isArray(result.predictions)).toBe(true);
      expect(Array.isArray(result.automationSuggestions)).toBe(true);
    });

    it('should generate insights for product entity', async () => {
      const result = await service.generateInsights('product', 'prod-456');

      expect(result).toHaveProperty('predictions');
      expect(result).toHaveProperty('automationSuggestions');
      expect(result.entityType).toBe('product');
      expect(result.entityId).toBe('prod-456');
    });
  });
});

describe('PredictiveAnalyticsService', () => {
  let service: PredictiveAnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PredictiveAnalyticsService,
        MLPipelineService,
        ForecastingService,
        AnomalyDetectionService,
      ],
    }).compile();

    service = module.get<PredictiveAnalyticsService>(
      PredictiveAnalyticsService
    );
  });

  it('should generate predictions for customer', async () => {
    const predictions = await service.generatePredictions(
      'customer',
      'cust-123'
    );

    expect(Array.isArray(predictions)).toBe(true);
    expect(predictions.length).toBeGreaterThan(0);

    const prediction = predictions[0];
    expect(prediction).toHaveProperty('type');
    expect(prediction).toHaveProperty('value');
    expect(prediction).toHaveProperty('confidence');
    expect(prediction).toHaveProperty('description');
  });
});

describe('IntelligentAutomationService', () => {
  let service: IntelligentAutomationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntelligentAutomationService,
        OCRService,
        SmartCategorizationService,
      ],
    }).compile();

    service = module.get<IntelligentAutomationService>(
      IntelligentAutomationService
    );
  });

  it('should generate automation suggestions', async () => {
    const suggestions = await service.generateSuggestions(
      'customer',
      'cust-123'
    );

    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeGreaterThan(0);

    const suggestion = suggestions[0];
    expect(suggestion).toHaveProperty('type');
    expect(suggestion).toHaveProperty('description');
    expect(suggestion).toHaveProperty('potentialSavings');
    expect(suggestion).toHaveProperty('implementationEffort');
    expect(suggestion).toHaveProperty('priority');
    expect(suggestion).toHaveProperty('category');
  });

  it('should process invoice with OCR', async () => {
    const mockBuffer = Buffer.from('mock invoice data');
    const result = await service.processInvoiceWithOCR(mockBuffer);

    expect(result).toHaveProperty('extractedData');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('suggestedCategory');
    expect(result).toHaveProperty('automationRecommendations');
    expect(Array.isArray(result.automationRecommendations)).toBe(true);
  });
});

describe('MLPipelineService', () => {
  let service: MLPipelineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MLPipelineService],
    }).compile();

    service = module.get<MLPipelineService>(MLPipelineService);
  });

  it('should train a model', async () => {
    const trainingData = {
      features: [
        { feature1: 1, feature2: 2 },
        { feature1: 3, feature2: 4 },
      ],
      labels: [0, 1],
    };

    const model = await service.trainModel('test-model', trainingData);

    expect(model).toHaveProperty('id', 'test-model');
    expect(model).toHaveProperty('name');
    expect(model).toHaveProperty('type');
    expect(model).toHaveProperty('accuracy');
    expect(model).toHaveProperty('lastTrained');
    expect(model).toHaveProperty('features');
    expect(model.accuracy).toBeGreaterThan(0);
    expect(model.accuracy).toBeLessThanOrEqual(1);
  });

  it('should make predictions', async () => {
    const features = { feature1: 5, feature2: 6 };
    const prediction = await service.predict('sales_forecast', features);

    expect(prediction).toHaveProperty('confidence');
    expect(prediction.confidence).toBeGreaterThan(0);
    expect(prediction.confidence).toBeLessThanOrEqual(1);
  });

  it('should get all models', () => {
    const models = service.getAllModels();

    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);

    const model = models[0];
    expect(model).toHaveProperty('id');
    expect(model).toHaveProperty('name');
    expect(model).toHaveProperty('type');
  });
});

describe('AnomalyDetectionService', () => {
  let service: AnomalyDetectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnomalyDetectionService],
    }).compile();

    service = module.get<AnomalyDetectionService>(AnomalyDetectionService);
  });

  it('should detect anomalies', async () => {
    const anomalies = await service.detectAnomalies('customer', 'cust-123');

    expect(Array.isArray(anomalies)).toBe(true);

    if (anomalies.length > 0) {
      const anomaly = anomalies[0];
      expect(anomaly).toHaveProperty('id');
      expect(anomaly).toHaveProperty('type');
      expect(anomaly).toHaveProperty('severity');
      expect(anomaly).toHaveProperty('description');
      expect(anomaly).toHaveProperty('value');
      expect(anomaly).toHaveProperty('expectedValue');
      expect(anomaly).toHaveProperty('deviation');
      expect(['low', 'medium', 'high', 'critical']).toContain(anomaly.severity);
      expect(['financial', 'operational', 'behavioral']).toContain(
        anomaly.type
      );
    }
  });
});

describe('SmartCategorizationService', () => {
  let service: SmartCategorizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SmartCategorizationService],
    }).compile();

    service = module.get<SmartCategorizationService>(
      SmartCategorizationService
    );
  });

  it('should categorize expense', async () => {
    const expenseData = {
      description: 'Office supplies from Staples',
      amount: 45.99,
      vendor: { name: 'Staples' },
    };

    const result = await service.categorizeExpense(expenseData);

    expect(result).toHaveProperty('category');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('reasoning');
    expect(Array.isArray(result.reasoning)).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('should suggest categories', async () => {
    const suggestions = await service.suggestCategories(
      'laptop computer',
      1200
    );

    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(5);

    const suggestion = suggestions[0];
    expect(suggestion).toHaveProperty('category');
    expect(suggestion).toHaveProperty('confidence');
    expect(suggestion).toHaveProperty('reasoning');
  });

  it('should get all categories', async () => {
    const categories = await service.getCategories();

    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);

    const category = categories[0];
    expect(category).toHaveProperty('id');
    expect(category).toHaveProperty('name');
    expect(category).toHaveProperty('keywords');
    expect(category).toHaveProperty('rules');
    expect(Array.isArray(category.keywords)).toBe(true);
    expect(Array.isArray(category.rules)).toBe(true);
  });
});
