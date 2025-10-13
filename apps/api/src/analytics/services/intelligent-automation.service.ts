import { Injectable, Logger } from '@nestjs/common';
import { OCRService } from './ocr.service';
import { SmartCategorizationService } from './smart-categorization.service';

export interface AutomationSuggestion {
  type: string;
  description: string;
  potentialSavings: number;
  implementationEffort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
  category: 'process' | 'document' | 'notification' | 'reconciliation';
}

export interface ProcessOptimization {
  processName: string;
  currentEfficiency: number;
  potentialEfficiency: number;
  bottlenecks: string[];
  recommendations: string[];
}

@Injectable()
export class IntelligentAutomationService {
  private readonly logger = new Logger(IntelligentAutomationService.name);

  constructor(
    private readonly ocrService: OCRService,
    private readonly smartCategorization: SmartCategorizationService
  ) {}

  async getSummary() {
    this.logger.log('Generating intelligent automation summary');

    return {
      activeAutomations: await this.getActiveAutomationsCount(),
      processedDocuments: await this.getProcessedDocumentsCount(),
      automationSavings: await this.calculateAutomationSavings(),
    };
  }

  async generateSuggestions(
    entityType: string,
    entityId: string
  ): Promise<AutomationSuggestion[]> {
    this.logger.log(
      `Generating automation suggestions for ${entityType}:${entityId}`
    );

    const suggestions: AutomationSuggestion[] = [];

    // Document processing suggestions
    const documentSuggestions =
      await this.generateDocumentAutomationSuggestions(entityType, entityId);
    suggestions.push(...documentSuggestions);

    // Process optimization suggestions
    const processSuggestions =
      await this.generateProcessOptimizationSuggestions(entityType, entityId);
    suggestions.push(...processSuggestions);

    // Notification automation suggestions
    const notificationSuggestions =
      await this.generateNotificationAutomationSuggestions(
        entityType,
        entityId
      );
    suggestions.push(...notificationSuggestions);

    // Reconciliation automation suggestions
    const reconciliationSuggestions =
      await this.generateReconciliationSuggestions(entityType, entityId);
    suggestions.push(...reconciliationSuggestions);

    return suggestions.sort(
      (a, b) =>
        this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority)
    );
  }

  async processInvoiceWithOCR(invoiceBuffer: Buffer): Promise<{
    extractedData: any;
    confidence: number;
    suggestedCategory: string;
    automationRecommendations: string[];
  }> {
    this.logger.log('Processing invoice with OCR');

    // Extract data using OCR
    const ocrResult = await this.ocrService.extractInvoiceData(invoiceBuffer);

    // Categorize the expense
    const category = await this.smartCategorization.categorizeExpense(
      ocrResult.extractedData
    );

    // Generate automation recommendations
    const recommendations =
      this.generateInvoiceAutomationRecommendations(ocrResult);

    return {
      extractedData: ocrResult.extractedData,
      confidence: ocrResult.confidence,
      suggestedCategory: category.category,
      automationRecommendations: recommendations,
    };
  }

  async automateReconciliation(
    _accountId: string,
    transactionData: any[]
  ): Promise<{
    matchedTransactions: number;
    unmatchedTransactions: number;
    suggestedMatches: any[];
    confidence: number;
  }> {
    this.logger.log(`Automating reconciliation for account ${_accountId}`);

    // Get existing transactions
    const existingTransactions = await this.getExistingTransactions(_accountId);

    // Pattern matching algorithm
    const matchResults = this.performPatternMatching(
      transactionData,
      existingTransactions
    );

    return {
      matchedTransactions: matchResults.matched.length,
      unmatchedTransactions: matchResults.unmatched.length,
      suggestedMatches: matchResults.suggestions,
      confidence: matchResults.confidence,
    };
  }

  async generateSmartNotifications(_userId: string): Promise<{
    notifications: any[];
    priority: 'low' | 'medium' | 'high';
    contextualRelevance: number;
  }> {
    this.logger.log(`Generating smart notifications for user ${_userId}`);

    // Analyze user behavior and preferences
    const userContext = await this.analyzeUserContext(_userId);

    // Generate contextual notifications
    const notifications =
      await this.generateContextualNotifications(userContext);

    return {
      notifications,
      priority: this.calculateNotificationPriority(notifications),
      contextualRelevance: userContext.relevanceScore,
    };
  }

  async optimizeProcess(_processName: string): Promise<ProcessOptimization> {
    this.logger.log(`Optimizing process: ${_processName}`);

    // Analyze current process performance
    const processData = await this.analyzeProcessPerformance(_processName);

    // Identify bottlenecks
    const bottlenecks = this.identifyBottlenecks(processData);

    // Generate optimization recommendations
    const recommendations = this.generateOptimizationRecommendations(
      processData,
      bottlenecks
    );

    return {
      processName: _processName,
      currentEfficiency: processData.efficiency,
      potentialEfficiency: processData.efficiency * 1.3, // 30% improvement potential
      bottlenecks,
      recommendations,
    };
  }

  private async generateDocumentAutomationSuggestions(
    _entityType: string,
    _entityId: string
  ): Promise<AutomationSuggestion[]> {
    const suggestions: AutomationSuggestion[] = [];

    // Invoice processing automation
    suggestions.push({
      type: 'invoice_ocr_automation',
      description:
        'Automate invoice data extraction using OCR and machine learning',
      potentialSavings: 2400, // Hours saved per year
      implementationEffort: 'medium',
      priority: 'high',
      category: 'document',
    });

    // Receipt processing
    suggestions.push({
      type: 'receipt_processing',
      description: 'Automatically categorize and process expense receipts',
      potentialSavings: 1200,
      implementationEffort: 'low',
      priority: 'medium',
      category: 'document',
    });

    // Contract analysis
    if (_entityType === 'vendor' || _entityType === 'customer') {
      suggestions.push({
        type: 'contract_analysis',
        description: 'Automatically extract key terms and dates from contracts',
        potentialSavings: 800,
        implementationEffort: 'high',
        priority: 'medium',
        category: 'document',
      });
    }

    return suggestions;
  }

  private async generateProcessOptimizationSuggestions(
    _entityType: string,
    _entityId: string
  ): Promise<AutomationSuggestion[]> {
    const suggestions: AutomationSuggestion[] = [];

    // Approval workflow optimization
    suggestions.push({
      type: 'approval_workflow_optimization',
      description: 'Streamline approval processes with intelligent routing',
      potentialSavings: 1800,
      implementationEffort: 'medium',
      priority: 'high',
      category: 'process',
    });

    // Inventory reorder automation
    if (_entityType === 'product' || _entityType === 'warehouse') {
      suggestions.push({
        type: 'inventory_reorder_automation',
        description:
          'Automatically generate purchase orders based on inventory levels',
        potentialSavings: 3200,
        implementationEffort: 'low',
        priority: 'high',
        category: 'process',
      });
    }

    // Customer onboarding automation
    if (_entityType === 'customer') {
      suggestions.push({
        type: 'customer_onboarding_automation',
        description: 'Automate customer onboarding workflow and documentation',
        potentialSavings: 1600,
        implementationEffort: 'medium',
        priority: 'medium',
        category: 'process',
      });
    }

    return suggestions;
  }

  private async generateNotificationAutomationSuggestions(
    _entityType: string,
    _entityId: string
  ): Promise<AutomationSuggestion[]> {
    const suggestions: AutomationSuggestion[] = [];

    // Smart alert system
    suggestions.push({
      type: 'smart_alert_system',
      description:
        'Context-aware notifications based on user behavior and priorities',
      potentialSavings: 600,
      implementationEffort: 'low',
      priority: 'medium',
      category: 'notification',
    });

    // Predictive maintenance alerts
    if (_entityType === 'equipment' || _entityType === 'asset') {
      suggestions.push({
        type: 'predictive_maintenance_alerts',
        description:
          'Proactive maintenance notifications based on equipment data',
        potentialSavings: 4800,
        implementationEffort: 'medium',
        priority: 'high',
        category: 'notification',
      });
    }

    return suggestions;
  }

  private async generateReconciliationSuggestions(
    _entityType: string,
    _entityId: string
  ): Promise<AutomationSuggestion[]> {
    const suggestions: AutomationSuggestion[] = [];

    // Bank reconciliation automation
    if (_entityType === 'bank_account') {
      suggestions.push({
        type: 'bank_reconciliation_automation',
        description:
          'Automatically match bank transactions with accounting records',
        potentialSavings: 2000,
        implementationEffort: 'medium',
        priority: 'high',
        category: 'reconciliation',
      });
    }

    // Three-way matching automation
    suggestions.push({
      type: 'three_way_matching',
      description: 'Automate purchase order, receipt, and invoice matching',
      potentialSavings: 1500,
      implementationEffort: 'medium',
      priority: 'medium',
      category: 'reconciliation',
    });

    return suggestions;
  }

  private generateInvoiceAutomationRecommendations(ocrResult: any): string[] {
    const recommendations = [];

    if (ocrResult.confidence > 0.9) {
      recommendations.push(
        'Enable automatic posting for high-confidence invoices'
      );
    }

    if (
      ocrResult.extractedData.vendor &&
      ocrResult.extractedData.vendor.isRecurring
    ) {
      recommendations.push(
        'Set up recurring invoice automation for this vendor'
      );
    }

    if (ocrResult.extractedData.amount > 1000) {
      recommendations.push(
        'Route high-value invoices through approval workflow'
      );
    }

    return recommendations;
  }

  private performPatternMatching(
    newTransactions: any[],
    existingTransactions: any[]
  ) {
    const matched = [];
    const unmatched = [];
    const suggestions = [];

    for (const newTx of newTransactions) {
      let bestMatch = null;
      let bestScore = 0;

      for (const existingTx of existingTransactions) {
        const score = this.calculateMatchScore(newTx, existingTx);
        if (score > bestScore && score > 0.8) {
          bestScore = score;
          bestMatch = existingTx;
        }
      }

      if (bestMatch) {
        matched.push({ new: newTx, existing: bestMatch, score: bestScore });
      } else {
        unmatched.push(newTx);
        // Generate suggestions for unmatched transactions
        const suggestion = this.generateMatchSuggestion(
          newTx,
          existingTransactions
        );
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    }

    return {
      matched,
      unmatched,
      suggestions,
      confidence: matched.length / newTransactions.length,
    };
  }

  private calculateMatchScore(tx1: any, tx2: any): number {
    let score = 0;

    // Amount matching (exact match gets high score)
    if (Math.abs(tx1.amount - tx2.amount) < 0.01) {
      score += 0.4;
    } else if (
      Math.abs(tx1.amount - tx2.amount) / Math.max(tx1.amount, tx2.amount) <
      0.05
    ) {
      score += 0.2;
    }

    // Date matching (within 3 days)
    const daysDiff =
      Math.abs(new Date(tx1.date).getTime() - new Date(tx2.date).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysDiff <= 1) {
      score += 0.3;
    } else if (daysDiff <= 3) {
      score += 0.15;
    }

    // Description similarity
    const descSimilarity = this.calculateStringSimilarity(
      tx1.description,
      tx2.description
    );
    score += descSimilarity * 0.3;

    return score;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const rows = str2.length + 1;
    const cols = str1.length + 1;
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i < rows; i++) {
      matrix[i] = new Array(cols).fill(0);
    }

    // Initialize first row and column
    for (let i = 0; i < rows; i++) {
      matrix[i]![0] = i;
    }

    for (let j = 0; j < cols; j++) {
      matrix[0]![j] = j;
    }

    // Fill the matrix
    for (let i = 1; i < rows; i++) {
      for (let j = 1; j < cols; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i]![j] = matrix[i - 1]![j - 1]!;
        } else {
          matrix[i]![j] = Math.min(
            matrix[i - 1]![j - 1]! + 1,
            matrix[i]![j - 1]! + 1,
            matrix[i - 1]![j]! + 1
          );
        }
      }
    }

    return matrix[str2.length]![str1.length]!;
  }

  private generateMatchSuggestion(
    transaction: any,
    existingTransactions: any[]
  ) {
    // Find potential matches with lower confidence
    const potentialMatches = existingTransactions
      .map(tx => ({ tx, score: this.calculateMatchScore(transaction, tx) }))
      .filter(match => match.score > 0.5 && match.score < 0.8)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (potentialMatches.length > 0) {
      return {
        transaction,
        suggestions: potentialMatches.map(match => match.tx),
        reason: 'Partial match found - manual review recommended',
      };
    }

    return null;
  }

  private async analyzeUserContext(_userId: string) {
    // Mock user context analysis
    return {
      preferences: {
        notificationFrequency: 'medium',
        categories: ['finance', 'operations'],
      },
      behavior: { activeHours: [9, 17], responseRate: 0.8 },
      relevanceScore: 0.85,
    };
  }

  private async generateContextualNotifications(_userContext: any) {
    // Mock contextual notification generation
    return [
      {
        type: 'approval_required',
        message: 'Invoice approval needed',
        priority: 'high',
      },
      {
        type: 'anomaly_detected',
        message: 'Unusual expense pattern detected',
        priority: 'medium',
      },
    ];
  }

  private calculateNotificationPriority(
    notifications: any[]
  ): 'low' | 'medium' | 'high' {
    const highPriorityCount = notifications.filter(
      n => n.priority === 'high'
    ).length;
    if (highPriorityCount > 0) return 'high';

    const mediumPriorityCount = notifications.filter(
      n => n.priority === 'medium'
    ).length;
    if (mediumPriorityCount > 0) return 'medium';

    return 'low';
  }

  private async analyzeProcessPerformance(_processName: string) {
    // Mock process performance analysis
    return {
      efficiency: 0.7 + Math.random() * 0.2,
      averageTime: 120 + Math.random() * 60, // minutes
      steps: ['step1', 'step2', 'step3'],
      bottleneckSteps: ['step2'],
    };
  }

  private identifyBottlenecks(processData: any): string[] {
    return processData.bottleneckSteps || [];
  }

  private generateOptimizationRecommendations(
    processData: any,
    bottlenecks: string[]
  ): string[] {
    const recommendations = [];

    if (bottlenecks.length > 0) {
      recommendations.push(
        `Optimize bottleneck steps: ${bottlenecks.join(', ')}`
      );
    }

    if (processData.efficiency < 0.8) {
      recommendations.push(
        'Implement parallel processing for independent steps'
      );
    }

    recommendations.push('Add automation for repetitive manual tasks');

    return recommendations;
  }

  private getPriorityScore(priority: 'low' | 'medium' | 'high'): number {
    const scores = { high: 3, medium: 2, low: 1 };
    return scores[priority];
  }

  // Mock data getters
  private async getActiveAutomationsCount(): Promise<number> {
    return 15;
  }

  private async getProcessedDocumentsCount(): Promise<number> {
    return 1247;
  }

  private async calculateAutomationSavings(): Promise<number> {
    return 12500; // Hours saved
  }

  private async getExistingTransactions(_accountId: string): Promise<any[]> {
    // Mock existing transactions
    return [
      {
        id: '1',
        amount: 100.5,
        date: '2024-01-15',
        description: 'Office supplies',
      },
      {
        id: '2',
        amount: 250.0,
        date: '2024-01-16',
        description: 'Software license',
      },
    ];
  }
}

