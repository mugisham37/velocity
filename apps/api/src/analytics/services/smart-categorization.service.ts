import { Injectable, Logger } from '@nestjs/common';

export interface CategoryPrediction {
  category: string;
  confidence: number;
  subcategory?: string;
  reasoning: string[];
}

export interface ExpenseCategory {
  id: string;
  name: string;
  keywords: string[];
  rules: CategoryRule[];
  parentCategory?: string;
}

export interface CategoryRule {
  type: 'keyword' | 'amount_range' | 'vendor' | 'pattern';
  condition: any;
  weight: number;
}

@Injectable()
export class SmartCategorizationService {
  private readonly logger = new Logger(SmartCategorizationService.name);
  private expenseCategories: ExpenseCategory[] = [];

  constructor() {
    this.initializeCategories();
  }

  async categorizeExpense(expenseData: any): Promise<CategoryPrediction> {
    this.logger.log('Categorizing expense using machine learning');

    const features = this.extractFeatures(expenseData);
    const predictions = await this.predictCategories(features);

    // Get the best prediction
    const bestPrediction = predictions.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    return bestPrediction;
  }

  async categorizeTransaction(
    transactionData: any
  ): Promise<CategoryPrediction> {
    this.logger.log('Categorizing transaction');

    const features = this.extractTransactionFeatures(transactionData);
    const predictions = await this.predictCategories(features);

    return predictions.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );
  }

  async categorizeDocument(documentData: any): Promise<CategoryPrediction> {
    this.logger.log('Categorizing document');

    const features = this.extractDocumentFeatures(documentData);
    const predictions = await this.predictDocumentCategories(features);

    return predictions.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );
  }

  async suggestCategories(
    description: string,
    amount?: number
  ): Promise<CategoryPrediction[]> {
    this.logger.log(`Suggesting categories for: ${description}`);

    const features = {
      description: description.toLowerCase(),
      amount: amount || 0,
      keywords: this.extractKeywords(description),
    };

    const predictions = await this.predictCategories(features);

    return predictions.sort((a, b) => b.confidence - a.confidence).slice(0, 5); // Return top 5 suggestions
  }

  async learnFromFeedback(
    originalData: any,
    correctCategory: string,
    _userFeedback: string
  ): Promise<void> {
    this.logger.log(`Learning from feedback: ${correctCategory}`);

    // In a real implementation, this would:
    // 1. Update the ML model with the correct classification
    // 2. Adjust category rules based on feedback
    // 3. Update keyword associations

    // Mock learning process
    await this.updateCategoryRules(originalData, correctCategory, _userFeedback);

    this.logger.log('Category model updated with feedback');
  }

  async getCategories(): Promise<ExpenseCategory[]> {
    return this.expenseCategories;
  }

  async addCustomCategory(
    category: Omit<ExpenseCategory, 'id'>
  ): Promise<ExpenseCategory> {
    const newCategory: ExpenseCategory = {
      id: `custom_${Date.now()}`,
      ...category,
    };

    this.expenseCategories.push(newCategory);
    this.logger.log(`Added custom category: ${newCategory.name}`);

    return newCategory;
  }

  private async predictCategories(
    features: any
  ): Promise<CategoryPrediction[]> {
    const predictions: CategoryPrediction[] = [];

    for (const category of this.expenseCategories) {
      const confidence = this.calculateCategoryConfidence(features, category);

      if (confidence > 0.1) {
        // Only include predictions with some confidence
        const subcategory = this.getSubcategory(features, category);
        const prediction: CategoryPrediction = {
          category: category.name,
          confidence,
          reasoning: this.generateReasoning(features, category, confidence),
        };
        
        if (subcategory !== undefined) {
          prediction.subcategory = subcategory;
        }
        
        predictions.push(prediction);
      }
    }

    return predictions;
  }

  private async predictDocumentCategories(
    features: any
  ): Promise<CategoryPrediction[]> {
    const documentCategories = [
      {
        name: 'Invoice',
        keywords: ['invoice', 'bill', 'payment due', 'amount due'],
      },
      {
        name: 'Receipt',
        keywords: ['receipt', 'purchase', 'transaction', 'paid'],
      },
      {
        name: 'Contract',
        keywords: ['agreement', 'contract', 'terms', 'conditions'],
      },
      {
        name: 'Statement',
        keywords: ['statement', 'balance', 'account', 'period'],
      },
      {
        name: 'Report',
        keywords: ['report', 'analysis', 'summary', 'findings'],
      },
    ];

    const predictions: CategoryPrediction[] = [];

    for (const category of documentCategories) {
      const confidence = this.calculateDocumentConfidence(features, category);

      if (confidence > 0.1) {
        predictions.push({
          category: category.name,
          confidence,
          reasoning: [`Matched keywords: ${category.keywords.join(', ')}`],
        });
      }
    }

    return predictions;
  }

  private extractFeatures(expenseData: any): any {
    return {
      description: (expenseData.description || '').toLowerCase(),
      amount: expenseData.amount || 0,
      vendor: (expenseData.vendor?.name || '').toLowerCase(),
      keywords: this.extractKeywords(expenseData.description || ''),
      amountRange: this.getAmountRange(expenseData.amount || 0),
      date: expenseData.date,
    };
  }

  private extractTransactionFeatures(transactionData: any): any {
    return {
      description: (transactionData.description || '').toLowerCase(),
      amount: Math.abs(transactionData.amount || 0),
      type: transactionData.amount > 0 ? 'credit' : 'debit',
      keywords: this.extractKeywords(transactionData.description || ''),
      amountRange: this.getAmountRange(Math.abs(transactionData.amount || 0)),
    };
  }

  private extractDocumentFeatures(documentData: any): any {
    const text = this.extractTextFromDocument(documentData);

    return {
      text: text.toLowerCase(),
      keywords: this.extractKeywords(text),
      hasNumbers: /\d/.test(text),
      hasAmounts: /\$[\d,]+\.?\d*/.test(text),
      hasDates: /\d{1,2}\/\d{1,2}\/\d{4}/.test(text),
      length: text.length,
    };
  }

  private extractKeywords(text: string): string[] {
    if (!text) return [];

    // Simple keyword extraction
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    // Remove common stop words
    const stopWords = [
      'the',
      'and',
      'for',
      'are',
      'but',
      'not',
      'you',
      'all',
      'can',
      'had',
      'her',
      'was',
      'one',
      'our',
      'out',
      'day',
      'get',
      'has',
      'him',
      'his',
      'how',
      'man',
      'new',
      'now',
      'old',
      'see',
      'two',
      'way',
      'who',
      'boy',
      'did',
      'its',
      'let',
      'put',
      'say',
      'she',
      'too',
      'use',
    ];

    return words.filter(word => !stopWords.includes(word));
  }

  private extractTextFromDocument(documentData: any): string {
    // Extract text from various document formats
    if (typeof documentData === 'string') {
      return documentData;
    }

    if (documentData.extractedText) {
      return documentData.extractedText;
    }

    if (documentData.content) {
      return documentData.content;
    }

    // Try to extract from common OCR result formats
    if (documentData.vendor?.name || documentData.invoice?.number) {
      return `${documentData.vendor?.name || ''} ${documentData.invoice?.number || ''} ${documentData.lineItems?.map((item: any) => item.description).join(' ') || ''}`;
    }

    return '';
  }

  private calculateCategoryConfidence(
    features: any,
    category: ExpenseCategory
  ): number {
    let confidence = 0;

    // Keyword matching
    const keywordMatches = category.keywords.filter(
      (keyword: string) =>
        features.description.includes(keyword.toLowerCase()) ||
        features.vendor.includes(keyword.toLowerCase())
    );

    if (keywordMatches.length > 0) {
      confidence += (keywordMatches.length / category.keywords.length) * 0.4;
    }

    // Rule-based scoring
    for (const rule of category.rules) {
      const ruleScore = this.evaluateRule(rule, features);
      confidence += ruleScore * rule.weight;
    }

    // Amount-based heuristics
    if (category.name === 'Office Supplies' && features.amount < 500) {
      confidence += 0.1;
    } else if (category.name === 'Equipment' && features.amount > 1000) {
      confidence += 0.1;
    } else if (
      category.name === 'Travel' &&
      features.keywords.some((k: string) =>
        ['hotel', 'flight', 'uber', 'taxi'].includes(k)
      )
    ) {
      confidence += 0.2;
    }

    return Math.min(confidence, 0.95); // Cap at 95%
  }

  private calculateDocumentConfidence(features: any, category: any): number {
    let confidence = 0;

    // Keyword matching
    const keywordMatches = category.keywords.filter((keyword: string) =>
      features.text.includes(keyword.toLowerCase())
    );

    if (keywordMatches.length > 0) {
      confidence = (keywordMatches.length / category.keywords.length) * 0.8;
    }

    // Document structure heuristics
    if (
      category.name === 'Invoice' &&
      features.hasAmounts &&
      features.hasDates
    ) {
      confidence += 0.2;
    } else if (
      category.name === 'Statement' &&
      features.hasNumbers &&
      features.length > 1000
    ) {
      confidence += 0.15;
    }

    return Math.min(confidence, 0.95);
  }

  private evaluateRule(rule: CategoryRule, features: any): number {
    switch (rule.type) {
      case 'keyword':
        return features.keywords.some((k: string) => rule.condition.includes(k))
          ? 1
          : 0;

      case 'amount_range':
        const amount = features.amount;
        return amount >= rule.condition.min && amount <= rule.condition.max
          ? 1
          : 0;

      case 'vendor':
        return features.vendor.includes(rule.condition.toLowerCase()) ? 1 : 0;

      case 'pattern':
        const regex = new RegExp(rule.condition, 'i');
        return regex.test(features.description) ? 1 : 0;

      default:
        return 0;
    }
  }

  private getAmountRange(amount: number): string {
    if (amount < 50) return 'small';
    if (amount < 500) return 'medium';
    if (amount < 2000) return 'large';
    return 'very_large';
  }

  private getSubcategory(
    features: any,
    category: ExpenseCategory
  ): string | undefined {
    // Simple subcategory logic
    if (category.name === 'Travel') {
      if (features.keywords.includes('hotel')) return 'Accommodation';
      if (features.keywords.includes('flight')) return 'Transportation';
      if (features.keywords.includes('meal')) return 'Meals';
    }

    if (category.name === 'Office Supplies') {
      if (features.keywords.includes('software')) return 'Software';
      if (features.keywords.includes('furniture')) return 'Furniture';
    }

    return undefined;
  }

  private generateReasoning(
    features: any,
    category: ExpenseCategory,
    confidence: number
  ): string[] {
    const reasoning: string[] = [];

    // Keyword matches
    const keywordMatches = category.keywords.filter((keyword: string) =>
      features.description.includes(keyword.toLowerCase())
    );

    if (keywordMatches.length > 0) {
      reasoning.push(`Matched keywords: ${keywordMatches.join(', ')}`);
    }

    // Amount reasoning
    if (
      features.amountRange === 'small' &&
      category.name === 'Office Supplies'
    ) {
      reasoning.push('Small amount typical for office supplies');
    } else if (
      features.amountRange === 'large' &&
      category.name === 'Equipment'
    ) {
      reasoning.push('Large amount typical for equipment purchases');
    }

    // Vendor reasoning
    if (
      features.vendor &&
      category.keywords.some((k: string) => features.vendor.includes(k))
    ) {
      reasoning.push('Vendor name matches category');
    }

    // Confidence reasoning
    if (confidence > 0.8) {
      reasoning.push('High confidence match');
    } else if (confidence > 0.5) {
      reasoning.push('Moderate confidence match');
    } else {
      reasoning.push('Low confidence - manual review recommended');
    }

    return reasoning;
  }

  private async updateCategoryRules(
    originalData: any,
    correctCategory: string,
    _userFeedback: string
  ): Promise<void> {
    // Mock rule update process
    const category = this.expenseCategories.find(
      c => c.name === correctCategory
    );

    if (category) {
      // Extract new keywords from the original data
      const newKeywords = this.extractKeywords(originalData.description || '');

      // Add new keywords that aren't already in the category
      for (const keyword of newKeywords) {
        if (!category.keywords.includes(keyword) && keyword.length > 2) {
          category.keywords.push(keyword);
        }
      }

      this.logger.log(`Updated category ${correctCategory} with new keywords`);
    }
  }

  private initializeCategories(): void {
    this.expenseCategories = [
      {
        id: 'office_supplies',
        name: 'Office Supplies',
        keywords: [
          'office',
          'supplies',
          'paper',
          'pen',
          'stapler',
          'notebook',
          'stationery',
        ],
        rules: [
          {
            type: 'amount_range',
            condition: { min: 0, max: 500 },
            weight: 0.2,
          },
          {
            type: 'keyword',
            condition: ['office', 'supplies', 'stationery'],
            weight: 0.3,
          },
        ],
      },
      {
        id: 'travel',
        name: 'Travel',
        keywords: [
          'travel',
          'hotel',
          'flight',
          'uber',
          'taxi',
          'airline',
          'accommodation',
        ],
        rules: [
          {
            type: 'keyword',
            condition: ['travel', 'hotel', 'flight', 'uber', 'taxi'],
            weight: 0.4,
          },
          {
            type: 'amount_range',
            condition: { min: 50, max: 5000 },
            weight: 0.1,
          },
        ],
      },
      {
        id: 'meals',
        name: 'Meals & Entertainment',
        keywords: [
          'restaurant',
          'lunch',
          'dinner',
          'coffee',
          'meal',
          'catering',
          'food',
        ],
        rules: [
          {
            type: 'keyword',
            condition: ['restaurant', 'lunch', 'dinner', 'coffee', 'meal'],
            weight: 0.4,
          },
          {
            type: 'amount_range',
            condition: { min: 5, max: 200 },
            weight: 0.2,
          },
        ],
      },
      {
        id: 'equipment',
        name: 'Equipment',
        keywords: [
          'equipment',
          'computer',
          'laptop',
          'monitor',
          'printer',
          'hardware',
        ],
        rules: [
          {
            type: 'keyword',
            condition: ['equipment', 'computer', 'laptop', 'hardware'],
            weight: 0.4,
          },
          {
            type: 'amount_range',
            condition: { min: 200, max: 10000 },
            weight: 0.2,
          },
        ],
      },
      {
        id: 'software',
        name: 'Software & Subscriptions',
        keywords: [
          'software',
          'license',
          'subscription',
          'saas',
          'cloud',
          'app',
        ],
        rules: [
          {
            type: 'keyword',
            condition: ['software', 'license', 'subscription', 'saas'],
            weight: 0.4,
          },
          {
            type: 'pattern',
            condition: '(monthly|annual|yearly).*(subscription|license)',
            weight: 0.3,
          },
        ],
      },
      {
        id: 'utilities',
        name: 'Utilities',
        keywords: ['electric', 'gas', 'water', 'internet', 'phone', 'utility'],
        rules: [
          {
            type: 'keyword',
            condition: ['electric', 'gas', 'water', 'internet', 'phone'],
            weight: 0.4,
          },
          {
            type: 'amount_range',
            condition: { min: 50, max: 1000 },
            weight: 0.1,
          },
        ],
      },
      {
        id: 'marketing',
        name: 'Marketing & Advertising',
        keywords: [
          'marketing',
          'advertising',
          'promotion',
          'campaign',
          'social media',
          'ads',
        ],
        rules: [
          {
            type: 'keyword',
            condition: ['marketing', 'advertising', 'promotion', 'campaign'],
            weight: 0.4,
          },
        ],
      },
      {
        id: 'professional_services',
        name: 'Professional Services',
        keywords: [
          'consulting',
          'legal',
          'accounting',
          'professional',
          'service',
          'attorney',
        ],
        rules: [
          {
            type: 'keyword',
            condition: ['consulting', 'legal', 'accounting', 'professional'],
            weight: 0.4,
          },
          {
            type: 'amount_range',
            condition: { min: 100, max: 50000 },
            weight: 0.1,
          },
        ],
      },
    ];

    this.logger.log(
      `Initialized ${this.expenseCategories.length} expense categories`
    );
  }
}
