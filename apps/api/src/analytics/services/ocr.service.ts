import { Injectable, Logger } from '@nestjs/common';

export interface OCRResult {
  extractedData: any;
  confidence: number;
  processingTime: number;
  documentType: 'invoice' | 'receipt' | 'contract' | 'statement' | 'unknown';
}

export interface InvoiceData {
  vendor: {
    name: string;
    address: string;
    taxId?: string;
    isRecurring?: boolean;
  };
  invoice: {
    number: stri;
    date: string;
    dueDate?: string;
    amount: number;
    tax: number;
    currency: string;
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  confidence: number;
}

@Injectable()
export class OCRService {
  private readonly logger = new Logger(OCRService.name);

  async extractInvoiceData(documentBuffer: Buffer): Promise<OCRResult> {
    this.logger.log('Extracting invoice data using OCR');

    const startTime = Date.now();

    // Simulate OCR processing
    await this.simulateOCRProcessing();

    // Mock invoice data extraction
    const extractedData: InvoiceData = {
      vendor: {
        name: 'Acme Corp',
        address: '123 Business St, City, State 12345',
        taxId: 'TAX123456789',
        isRecurring: Math.random() > 0.5,
      },
      invoice: {
        number: `INV-${Math.floor(Math.random() * 10000)}`,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        amount: Math.round((Math.random() * 5000 + 100) * 100) / 100,
        tax: Math.round((Math.random() * 500 + 10) * 100) / 100,
        currency: 'USD',
      },
      lineItems: this.generateMockLineItems(),
      confidence: 0.85 + Math.random() * 0.1, // 85-95% confidence
    };

    const processingTime = Date.now() - startTime;

    return {
      extractedData,
      confidence: extractedData.confidence,
      processingTime,
      documentType: 'invoice',
    };
  }

  async extractReceiptData(documentBuffer: Buffer): Promise<OCRResult> {
    this.logger.log('Extracting receipt data using OCR');

    const startTime = Date.now();

    // Simulate OCR processing
    await this.simulateOCRProcessing();

    // Mock receipt data extraction
    const extractedData = {
      merchant: {
        name: 'Local Store',
        address: '456 Main St, City, State 12345',
      },
      transaction: {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        amount: Math.round((Math.random() * 200 + 10) * 100) / 100,
        tax: Math.round((Math.random() * 20 + 1) * 100) / 100,
        currency: 'USD',
        paymentMethod: Math.random() > 0.5 ? 'card' : 'cash',
      },
      items: this.generateMockReceiptItems(),
      confidence: 0.8 + Math.random() * 0.15, // 80-95% confidence
    };

    const processingTime = Date.now() - startTime;

    return {
      extractedData,
      confidence: extractedData.confidence,
      processingTime,
      documentType: 'receipt',
    };
  }

  async extractContractData(documentBuffer: Buffer): Promise<OCRResult> {
    this.logger.log('Extracting contract data using OCR');

    const startTime = Date.now();

    // Simulate OCR processing (contracts take longer)
    await this.simulateOCRProcessing(3000);

    // Mock contract data extraction
    const extractedData = {
      parties: [
        { name: 'Company A', role: 'client' },
        { name: 'Company B', role: 'vendor' },
      ],
      contract: {
        title: 'Service Agreement',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        value: Math.round((Math.random() * 100000 + 10000) * 100) / 100,
        currency: 'USD',
        renewalTerms: 'Annual renewal with 30-day notice',
      },
      keyTerms: [
        'Payment terms: Net 30',
        'Termination: 30-day notice required',
        'Liability cap: $50,000',
        'Confidentiality: 5 years post-termination',
      ],
      confidence: 0.75 + Math.random() * 0.15, // 75-90% confidence (contracts are more complex)
    };

    const processingTime = Date.now() - startTime;

    return {
      extractedData,
      confidence: extractedData.confidence,
      processingTime,
      documentType: 'contract',
    };
  }

  async extractBankStatementData(documentBuffer: Buffer): Promise<OCRResult> {
    this.logger.log('Extracting bank statement data using OCR');

    const startTime = Date.now();

    // Simulate OCR processing
    await this.simulateOCRProcessing(2000);

    // Mock bank statement data extraction
    const extractedData = {
      account: {
        number: '****1234',
        type: 'checking',
        bank: 'First National Bank',
      },
      statement: {
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          end: new Date().toISOString().split('T')[0],
        },
        openingBalance: Math.round((Math.random() * 10000 + 1000) * 100) / 100,
        closingBalance: Math.round((Math.random() * 10000 + 1000) * 100) / 100,
      },
      transactions: this.generateMockBankTransactions(),
      confidence: 0.88 + Math.random() * 0.1, // 88-98% confidence
    };

    const processingTime = Date.now() - startTime;

    return {
      extractedData,
      confidence: extractedData.confidence,
      processingTime,
      documentType: 'statement',
    };
  }

  async validateExtractedData(ocrResult: OCRResult): Promise<{
    isValid: boolean;
    validationErrors: string[];
    confidence: number;
  }> {
    this.logger.log(`Validating extracted data for ${ocrResult.documentType}`);

    const validationErrors: string[] = [];
    let isValid = true;

    switch (ocrResult.documentType) {
      case 'invoice':
        const invoiceValidation = this.validateInvoiceData(
          ocrResult.extractedData
        );
        validationErrors.push(...invoiceValidation.errors);
        isValid = invoiceValidation.isValid;
        break;

      case 'receipt':
        const receiptValidation = this.validateReceiptData(
          ocrResult.extractedData
        );
        validationErrors.push(...receiptValidation.errors);
        isValid = receiptValidation.isValid;
        break;

      case 'contract':
        const contractValidation = this.validateContractData(
          ocrResult.extractedData
        );
        validationErrors.push(...contractValidation.errors);
        isValid = contractValidation.isValid;
        break;

      case 'statement':
        const statementValidation = this.validateStatementData(
          ocrResult.extractedData
        );
        validationErrors.push(...statementValidation.errors);
        isValid = statementValidation.isValid;
        break;
    }

    // Adjust confidence based on validation results
    const adjustedConfidence = isValid
      ? ocrResult.confidence
      : ocrResult.confidence * (1 - validationErrors.length * 0.1);

    return {
      isValid,
      validationErrors,
      confidence: Math.max(0.1, adjustedConfidence),
    };
  }

  async improveOCRAccuracy(
    documentBuffer: Buffer,
    feedback: {
      correctData: any;
      originalResult: OCRResult;
    }
  ): Promise<void> {
    this.logger.log('Improving OCR accuracy with user feedback');

    // In a real implementation, this would:
    // 1. Store the feedback for model retraining
    // 2. Update confidence scores for similar documents
    // 3. Adjust OCR parameters based on error patterns

    // Mock improvement process
    await new Promise(resolve => setTimeout(resolve, 500));

    this.logger.log('OCR model updated with feedback');
  }

  private async simulateOCRProcessing(baseTime: number = 1500): Promise<void> {
    // Simulate variable processing time
    const processingTime = baseTime + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, processingTime));
  }

  private generateMockLineItems() {
    const itemCount = Math.floor(Math.random() * 5) + 1;
    const items = [];

    const descriptions = [
      'Office Supplies',
      'Software License',
      'Consulting Services',
      'Equipment Rental',
      'Maintenance Service',
    ];

    for (let i = 0; i < itemCount; i++) {
      const quantity = Math.floor(Math.random() * 10) + 1;
      const unitPrice = Math.round((Math.random() * 200 + 10) * 100) / 100;
      const total = Math.round(quantity * unitPrice * 100) / 100;

      items.push({
        description:
          descriptions[Math.floor(Math.random() * descriptions.length)],
        quantity,
        unitPrice,
        total,
      });
    }

    return items;
  }

  private generateMockReceiptItems() {
    const itemCount = Math.floor(Math.random() * 8) + 1;
    const items = [];

    const descriptions = [
      'Coffee',
      'Sandwich',
      'Notebook',
      'Pen Set',
      'Lunch',
      'Snacks',
      'Beverages',
      'Stationery',
    ];

    for (let i = 0; i < itemCount; i++) {
      const price = Math.round((Math.random() * 50 + 2) * 100) / 100;

      items.push({
        description:
          descriptions[Math.floor(Math.random() * descriptions.length)],
        price,
      });
    }

    return items;
  }

  private generateMockBankTransactions() {
    const transactionCount = Math.floor(Math.random() * 20) + 10;
    const transactions = [];

    const descriptions = [
      'ATM Withdrawal',
      'Direct Deposit',
      'Online Purchase',
      'Check Payment',
      'Wire Transfer',
      'Service Fee',
      'Interest Payment',
    ];

    for (let i = 0; i < transactionCount; i++) {
      const amount = Math.round((Math.random() * 2000 - 1000) * 100) / 100; // Can be negative
      const date = new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      );

      transactions.push({
        date: date.toISOString().split('T')[0],
        description:
          descriptions[Math.floor(Math.random() * descriptions.length)],
        amount,
        balance: Math.round((Math.random() * 10000 + 1000) * 100) / 100,
      });
    }

    return transactions.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  private validateInvoiceData(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.vendor?.name) {
      errors.push('Vendor name is missing');
    }

    if (!data.invoice?.number) {
      errors.push('Invoice number is missing');
    }

    if (!data.invoice?.amount || data.invoice.amount <= 0) {
      errors.push('Invalid invoice amount');
    }

    if (!data.invoice?.date) {
      errors.push('Invoice date is missing');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateReceiptData(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.merchant?.name) {
      errors.push('Merchant name is missing');
    }

    if (!data.transaction?.amount || data.transaction.amount <= 0) {
      errors.push('Invalid transaction amount');
    }

    if (!data.transaction?.date) {
      errors.push('Transaction date is missing');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateContractData(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.parties || data.parties.length < 2) {
      errors.push('Contract must have at least two parties');
    }

    if (!data.contract?.startDate) {
      errors.push('Contract start date is missing');
    }

    if (!data.contract?.value || data.contract.value <= 0) {
      errors.push('Invalid contract value');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateStatementData(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.account?.number) {
      errors.push('Account number is missing');
    }

    if (!data.statement?.period?.start || !data.statement?.period?.end) {
      errors.push('Statement period is incomplete');
    }

    if (
      data.statement?.openingBalance === undefined ||
      data.statement?.closingBalance === undefined
    ) {
      errors.push('Account balances are missing');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
