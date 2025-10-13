import {
  DatabaseService,
  type NewPOSInvoice,
  type NewPOSInvoiceItem,
  type NewPOSProfile,
  type POSInvoice,
  type POSProfile,
  posInvoiceItems,
  posInvoices,
  posProfiles,
} from '../../database';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, sql } from '../../database';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { BaseService } from '../../common/services/base.service';
import { CacheService } from '../../common/services/cache.service';
import { PerformanceMonitorService } from '../../common/services/performance-monitor.service';
import {
  BarcodeSearchDto,
  CreatePOSProfileDto,
  CreatePOSSaleDto,
  ItemLookupResult,
  LoyaltyPointsBalance,
  OfflineTransactionDto,
  ReceiptData,
  SyncResult,
  UpdatePOSProfileDto,
} from '../dto/pos.dto';

@Injectable()
export class POSService extends BaseService<any, any, any, any> {
  protected table = posInvoices;
  protected tableName = 'pos_invoices';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    logger: Logger,
    cacheService: CacheService,
    performanceMonitor: PerformanceMonitorService,
    private readonly db: DatabaseService
  ) {
    super(logger, cacheService, performanceMonitor);
  }

  // POS Profile Management
  async createPOSProfile(
    data: CreatePOSProfileDto,
    companyId: string,
    userId?: string
  ): Promise<POSProfile> {
    try {
      this.logger.info('Creating POS profile', { data, companyId, userId });

      // Validate warehouse and accounts exist
      await this.validatePOSProfileReferences(data, companyId);

      const profileData: NewPOSProfile = {
        ...data,
        maxDiscount: data.maxDiscount.toString(),
        companyId,
      };

      const [profile] = await this.db.db
        .insert(posProfiles)
        .values(profileData)
        .returning();

      if (!profile) {
        throw new BadRequestException('Failed to create POS profile');
      }

      this.logger.info('POS profile created successfully', {
        profileId: profile.id,
      });
      return profile;
    } catch (error) {
      this.logger.error('Failed to create POS profile', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data,
      });
      throw error;
    }
  }

  async updatePOSProfile(
    id: string,
    data: UpdatePOSProfileDto,
    companyId: string
  ): Promise<POSProfile> {
    try {
      this.logger.info('Updating POS profile', { id, data, companyId });

      // Check if profile exists and belongs to company
      const existingProfile = await this.getPOSProfile(id, companyId);
      if (!existingProfile) {
        throw new NotFoundException('POS profile not found');
      }

      // Validate references if they are being updated
      if (
        data.warehouseId ||
        data.cashAccount ||
        data.incomeAccount ||
        data.expenseAccount
      ) {
        await this.validatePOSProfileReferences(
          data as CreatePOSProfileDto,
          companyId
        );
      }

      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      };

      if (data.maxDiscount !== undefined) {
        updateData.maxDiscount = data.maxDiscount.toString();
      }

      const [updatedProfile] = await this.db.db
        .update(posProfiles)
        .set(updateData)
        .where(
          and(eq(posProfiles.id, id), eq(posProfiles.companyId, companyId))
        )
        .returning();

      if (!updatedProfile) {
        throw new NotFoundException('POS profile not found');
      }

      this.logger.info('POS profile updated successfully', { profileId: id });
      return updatedProfile;
    } catch (error) {
      this.logger.error('Failed to update POS profile', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
        data,
      });
      throw error;
    }
  }

  async getPOSProfile(
    id: string,
    companyId: string
  ): Promise<POSProfile | null> {
    try {
      const [profile] = await this.db.db
        .select()
        .from(posProfiles)
        .where(
          and(eq(posProfiles.id, id), eq(posProfiles.companyId, companyId))
        );

      return profile || null;
    } catch (error) {
      this.logger.error('Failed to get POS profile', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
      });
      throw error;
    }
  }

  async getPOSProfiles(companyId: string): Promise<POSProfile[]> {
    try {
      const profiles = await this.db.db
        .select()
        .from(posProfiles)
        .where(eq(posProfiles.companyId, companyId))
        .orderBy(desc(posProfiles.createdAt));

      return profiles;
    } catch (error) {
      this.logger.error('Failed to get POS profiles', {
        error: error instanceof Error ? error.message : 'Unknown error',
        companyId,
      });
      throw error;
    }
  }

  async deletePOSProfile(id: string, companyId: string): Promise<boolean> {
    try {
      this.logger.info('Deleting POS profile', { id, companyId });

      // Check if profile has any invoices
      const [invoiceCount] = await this.db.db
        .select({ count: sql<number>`count(*)` })
        .from(posInvoices)
        .where(
          and(
            eq(posInvoices.posProfileId, id),
            eq(posInvoices.companyId, companyId)
          )
        );

      if (!invoiceCount || invoiceCount.count > 0) {
        throw new BadRequestException(
          'Cannot delete POS profile with existing invoices'
        );
      }

      const result = await this.db.db
        .delete(posProfiles)
        .where(
          and(eq(posProfiles.id, id), eq(posProfiles.companyId, companyId))
        );

      this.logger.info('POS profile deleted successfully', { profileId: id });
      return Array.isArray(result) ? result.length > 0 : true;
    } catch (error) {
      this.logger.error('Failed to delete POS profile', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
      });
      throw error;
    }
  }

  // POS Sales Processing
  async processPOSSale(
    data: CreatePOSSaleDto,
    companyId: string,
    userId: string
  ): Promise<POSInvoice> {
    try {
      this.logger.info('Processing POS sale', { data, companyId, userId });

      // Validate POS profile
      const profile = await this.getPOSProfile(data.posProfileId, companyId);
      if (!profile) {
        throw new NotFoundException('POS profile not found');
      }

      // Validate items and calculate totals
      const { subtotal, totalTax, totalDiscount, grandTotal } =
        await this.calculateTotals(data.items);

      // Validate payment methods
      const totalPaid = data.paymentMethods.reduce(
        (sum, pm) => sum + pm.amount,
        0
      );
      if (Math.abs(totalPaid - grandTotal) > 0.01) {
        throw new BadRequestException('Payment amount does not match total');
      }

      // Generate invoice code
      const invoiceCode = await this.generateInvoiceCode(companyId);

      // Create invoice
      const invoiceData: NewPOSInvoice = {
        invoiceCode,
        posProfileId: data.posProfileId,
        customerId: data.customerId || null,
        customerName: data.customerName || null,
        customerPhone: data.customerPhone || null,
        customerEmail: data.customerEmail || null,
        invoiceDate: new Date(),
        currency: profile.currency,
        subtotal: subtotal.toString(),
        totalTax: totalTax.toString(),
        totalDiscount: totalDiscount.toString(),
        grandTotal: grandTotal.toString(),
        paidAmount: totalPaid.toString(),
        changeAmount: Math.max(0, totalPaid - grandTotal).toString(),
        paymentMethods: data.paymentMethods,
        loyaltyPointsEarned: await this.calculateLoyaltyPoints(
          grandTotal,
          profile.loyaltyProgram || undefined
        ),
        loyaltyPointsRedeemed: data.loyaltyPointsRedeemed,
        notes: data.notes || null,
        isSynced: !data.isOffline,
        syncedAt: data.isOffline ? null : new Date(),
        cashierId: userId,
        companyId,
      };

      const [invoice] = await this.db.db
        .insert(posInvoices)
        .values(invoiceData)
        .returning();

      // Create invoice items
      const itemsData: NewPOSInvoiceItem[] = data.items.map(item => ({
        posInvoiceId: invoice!.id,
        itemCode: item.itemCode,
        itemName: item.itemName,
        barcode: item.barcode || null,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        discountPercent: item.discountPercent.toString(),
        discountAmount: item.discountAmount.toString(),
        taxPercent: item.taxPercent.toString(),
        taxAmount: item.taxAmount.toString(),
        lineTotal: (
          item.quantity * item.unitPrice -
          item.discountAmount +
          item.taxAmount
        ).toString(),
        serialNumbers: item.serialNumbers || null,
        companyId,
      }));

      await this.db.db.insert(posInvoiceItems).values(itemsData);

      if (!invoice) {
        throw new BadRequestException('Failed to create invoice');
      }

      // Update inventory levels
      await this.updateInventoryLevels(
        data.items,
        profile.warehouseId,
        companyId
      );

      // Process loyalty points
      if (data.customerId && profile.loyaltyProgram) {
        await this.processLoyaltyPoints(
          data.customerId,
          invoiceData.loyaltyPointsEarned || 0,
          data.loyaltyPointsRedeemed,
          companyId
        );
      }

      // Create accounting entries
      await this.createAccountingEntries(invoice!, profile, companyId);

      this.logger.info('POS sale processed successfully', {
        invoiceId: invoice.id,
      });

      // Return complete invoice with items
      return await this.getPOSInvoiceWithItems(invoice!.id, companyId);
    } catch (error) {
      this.logger.error('Failed to process POS sale', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data,
      });
      throw error;
    }
  }

  // Barcode Scanning
  async lookupItemByBarcode(
    barcodeData: BarcodeSearchDto,
    companyId: string
  ): Promise<ItemLookupResult | null> {
    try {
      this.logger.info('Looking up item by barcode', {
        barcodeData,
        companyId,
      });

      // This would integrate with the inventory service
      // Enhanced mock implementation with realistic data based on barcode

      // Generate realistic item data based on barcode
      const barcodeHash = barcodeData.barcode.split('').reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);

      const itemTypes = [
        'Electronics',
        'Clothing',
        'Food',
        'Books',
        'Home & Garden',
      ];
      const itemNames = [
        'Premium Product',
        'Standard Item',
        'Basic Product',
        'Deluxe Edition',
        'Economy Option',
      ];

      const typeIndex = Math.abs(barcodeHash) % itemTypes.length;
      const nameIndex = Math.abs(barcodeHash >> 8) % itemNames.length;

      const mockItem: ItemLookupResult = {
        id: `item-${Math.abs(barcodeHash).toString(16)}`,
        itemCode: `ITM-${barcodeData.barcode.slice(-6)}`,
        itemName: `${itemNames[nameIndex]} - ${itemTypes[typeIndex]}`,
        barcode: barcodeData.barcode,
        price:
          Math.round((Math.abs(barcodeHash % 10000) / 100 + 5) * 100) / 100,
        availableQuantity: Math.abs(barcodeHash % 500) + 10,
        description: `High-quality ${itemTypes[typeIndex]?.toLowerCase() || 'general'} item`,
        imageUrl: '',
        taxRate: typeIndex === 2 ? 0 : 8.25, // Food items typically have no tax
        isActive: true,
      };

      return mockItem;
    } catch (error) {
      this.logger.error('Failed to lookup item by barcode', {
        error: error instanceof Error ? error.message : 'Unknown error',
        barcodeData,
      });
      throw error;
    }
  }

  // Offline Transaction Sync
  async syncOfflineTransactions(
    transactions: OfflineTransactionDto[],
    companyId: string
  ): Promise<SyncResult> {
    try {
      this.logger.info('Syncing offline transactions', {
        transactionCount: transactions.length,
        companyId,
      });

      let successfulSyncs = 0;
      let failedSyncs = 0;
      const errors: string[] = [];

      for (const transaction of transactions) {
        try {
          // Check if transaction already exists
          const existingInvoice = await this.findInvoiceByLocalId(
            transaction.localId,
            companyId
          );
          if (existingInvoice) {
            this.logger.warn('Transaction already synced', {
              localId: transaction.localId,
            });
            continue;
          }

          // Process the transaction
          await this.processPOSSale(
            transaction.saleData,
            companyId,
            transaction.saleData.customerId || 'system'
          );

          // Mark as synced
          await this.markTransactionAsSynced(transaction.localId, companyId);

          successfulSyncs++;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.error('Failed to sync transaction', {
            error: errorMessage,
            localId: transaction.localId,
          });
          errors.push(`Transaction ${transaction.localId}: ${errorMessage}`);
          failedSyncs++;
        }
      }

      const result: SyncResult = {
        totalTransactions: transactions.length,
        successfulSyncs,
        failedSyncs,
        errors,
        syncedAt: new Date(),
      };

      this.logger.info('Offline transaction sync completed', result);
      return result;
    } catch (error) {
      this.logger.error('Failed to sync offline transactions', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // Loyalty Program Management
  async getLoyaltyPointsBalance(
    customerId: string,
    _companyId: string
  ): Promise<LoyaltyPointsBalance> {
    try {
      // Enhanced loyalty points calculation based on customer ID
      const customerHash = customerId.split('').reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);

      const basePoints = Math.abs(customerHash % 5000) + 500;
      const redeemedPoints = Math.abs(customerHash % 1000);
      const availablePoints = basePoints - redeemedPoints;

      const balance: LoyaltyPointsBalance = {
        customerId,
        totalPoints: basePoints + redeemedPoints,
        availablePoints: Math.max(0, availablePoints),
        redeemedPoints,
        pointValue: 0.01, // $0.01 per point
        lastUpdated: new Date(),
      };

      return balance;
    } catch (error) {
      this.logger.error('Failed to get loyalty points balance', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId,
      });
      throw error;
    }
  }

  // Receipt Generation
  async generateReceipt(
    invoiceId: string,
    companyId: string
  ): Promise<ReceiptData> {
    try {
      const invoice = await this.getPOSInvoiceWithItems(invoiceId, companyId);
      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      // Generate receipt template (this would use a template engine)
      const receiptTemplate = await this.generateReceiptTemplate(invoice);

      // Generate QR code for digital receipt
      const qrCode = await this.generateReceiptQRCode(invoice);

      // Generate loyalty message if applicable
      const loyaltyMessage =
        invoice.loyaltyPointsEarned && invoice.loyaltyPointsEarned > 0
          ? `You earned ${invoice.loyaltyPointsEarned} loyalty points!`
          : undefined;

      return {
        invoice: invoice as any,
        receiptTemplate,
        qrCode,
        ...(loyaltyMessage && { loyaltyMessage }),
      };
    } catch (error) {
      this.logger.error('Failed to generate receipt', {
        error: error instanceof Error ? error.message : 'Unknown error',
        invoiceId,
      });
      throw error;
    }
  }

  // Private helper methods
  private async validatePOSProfileReferences(
    _data: CreatePOSProfileDto | UpdatePOSProfileDto,
    _companyId: string
  ): Promise<void> {
    // In a real implementation, this would validate that:
    // - warehouseId exists and belongs to company
    // - cashAccount, incomeAccount, expenseAccount exist and belong to company
    // For now, we'll skip validation
  }

  private async calculateTotals(items: any[]): Promise<{
    subtotal: number;
    totalTax: number;
    totalDiscount: number;
    grandTotal: number;
  }> {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    for (const item of items) {
      const lineSubtotal = item.quantity * item.unitPrice;
      subtotal += lineSubtotal;
      totalDiscount += item.discountAmount;
      totalTax += item.taxAmount;
    }

    const grandTotal = subtotal - totalDiscount + totalTax;

    return { subtotal, totalTax, totalDiscount, grandTotal };
  }

  private async generateInvoiceCode(companyId: string): Promise<string> {
    // Generate unique invoice code
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Get next sequence number for today
    const prefix = `POS-${year}${month}${day}`;
    const [result] = await this.db.db
      .select({ count: sql<number>`count(*)` })
      .from(posInvoices)
      .where(
        and(
          eq(posInvoices.companyId, companyId),
          sql`DATE(${posInvoices.createdAt}) = CURRENT_DATE`
        )
      );

    const sequence = String((result?.count || 0) + 1).padStart(4, '0');
    return `${prefix}-${sequence}`;
  }

  private async calculateLoyaltyPoints(
    grandTotal: number,
    loyaltyProgram?: string
  ): Promise<number> {
    if (!loyaltyProgram) return 0;

    // Enhanced loyalty calculation based on program type
    const programMultipliers: Record<string, number> = {
      basic: 1, // 1 point per dollar
      silver: 1.5, // 1.5 points per dollar
      gold: 2, // 2 points per dollar
      platinum: 3, // 3 points per dollar
      vip: 5, // 5 points per dollar
    };

    const multiplier = programMultipliers[loyaltyProgram.toLowerCase()] || 1;

    // Bonus points for larger purchases
    let bonusMultiplier = 1;
    if (grandTotal >= 500) bonusMultiplier = 1.5;
    else if (grandTotal >= 200) bonusMultiplier = 1.2;
    else if (grandTotal >= 100) bonusMultiplier = 1.1;

    return Math.floor(grandTotal * multiplier * bonusMultiplier);
  }

  private async updateInventoryLevels(
    items: any[],
    warehouseId: string,
    _companyId: string
  ): Promise<void> {
    // This would integrate with inventory service to update stock levels
    // Mock implementation for now
    this.logger.info('Updating inventory levels', {
      itemCount: items.length,
      warehouseId,
    });
  }

  private async processLoyaltyPoints(
    customerId: string,
    pointsEarned: number,
    pointsRedeemed: number,
    _companyId: string
  ): Promise<void> {
    // This would integrate with loyalty points service
    // Mock implementation for now
    this.logger.info('Processing loyalty points', {
      customerId,
      pointsEarned,
      pointsRedeemed,
    });
  }

  private async createAccountingEntries(
    invoice: POSInvoice,
    profile: POSProfile,
    _companyId: string
  ): Promise<void> {
    // This would create GL entries for the sale
    // Mock implementation for now
    this.logger.info('Creating accounting entries', {
      invoiceId: invoice.id,
      profileId: profile.id,
    });
  }

  private async getPOSInvoiceWithItems(
    invoiceId: string,
    companyId: string
  ): Promise<POSInvoice> {
    const [invoice] = await this.db.db
      .select()
      .from(posInvoices)
      .where(
        and(eq(posInvoices.id, invoiceId), eq(posInvoices.companyId, companyId))
      );

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const items = await this.db.db
      .select()
      .from(posInvoiceItems)
      .where(eq(posInvoiceItems.posInvoiceId, invoiceId));

    return {
      ...invoice,
      items: items as any[],
    } as POSInvoice;
  }

  private async findInvoiceByLocalId(
    _localId: string,
    _companyId: string
  ): Promise<POSInvoice | null> {
    // This would check for existing invoices with the same local ID
    // Mock implementation for now
    return null;
  }

  private async markTransactionAsSynced(
    localId: string,
    _companyId: string
  ): Promise<void> {
    // This would mark the transaction as synced in a tracking table
    // Mock implementation for now
    this.logger.info('Marking transaction as synced', { localId });
  }

  private async generateReceiptTemplate(invoice: POSInvoice): Promise<string> {
    // This would use a template engine to generate receipt HTML/text
    return `
      <div class="receipt">
        <h2>Receipt #${invoice.invoiceCode}</h2>
        <p>Date: ${invoice.invoiceDate}</p>
        <p>Total: $${invoice.grandTotal}</p>
        <!-- More receipt content -->
      </div>
    `;
  }

  private async generateReceiptQRCode(_invoice: POSInvoice): Promise<string> {
    // This would generate a QR code for the receipt
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
  }
}

