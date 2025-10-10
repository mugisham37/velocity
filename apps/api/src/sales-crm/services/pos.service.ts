import {
  DatabaseService,
  NewPOSInvoice,
  NewPOSInvoiceItem,
  NewPOSProfile,
  POSInvoice,
  POSProfile,
  posInvoiceItems,
  posInvoices,
  posProfiles,
} from '@kiro/database';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, sql } from '@kiro/database';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { BaseService } from '../../common/services/base.service';
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
    private readonly db: DatabaseService
  ) {
    super(logger);
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
        companyId,
      };

      const [profile] = await this.db.db
        .insert(posProfiles)
        .values(profileData)
        .returning();

      this.logger.info('POS profile created successfully', {
        profileId: profile.id,
      });
      return profile;
    } catch (error) {
      this.logger.error('Failed to create POS profile', {
        error: error.message,
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

      const [updatedProfile] = await this.db.db
        .update(posProfiles)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(eq(posProfiles.id, id), eq(posProfiles.companyId, companyId))
        )
        .returning();

      this.logger.info('POS profile updated successfully', { profileId: id });
      return updatedProfile;
    } catch (error) {
      this.logger.error('Failed to update POS profile', {
        error: error.message,
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
        error: error.message,
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
        error: error.message,
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

      if (invoiceCount.count > 0) {
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
      return result.rowCount > 0;
    } catch (error) {
      this.logger.error('Failed to delete POS profile', {
        error: error.message,
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
        customerId: data.customerId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
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
          profile.loyaltyProgram
        ),
        loyaltyPointsRedeemed: data.loyaltyPointsRedeemed,
        notes: data.notes,
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
        posInvoiceId: invoice.id,
        itemCode: item.itemCode,
        itemName: item.itemName,
        barcode: item.barcode,
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
        serialNumbers: item.serialNumbers,
        companyId,
      }));

      await this.db.db.insert(posInvoiceItems).values(itemsData);

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
          invoiceData.loyaltyPointsEarned,
          data.loyaltyPointsRedeemed,
          companyId
        );
      }

      // Create accounting entries
      await this.createAccountingEntries(invoice, profile, companyId);

      this.logger.info('POS sale processed successfully', {
        invoiceId: invoice.id,
      });

      // Return complete invoice with items
      return await this.getPOSInvoiceWithItems(invoice.id, companyId);
    } catch (error) {
      this.logger.error('Failed to process POS sale', {
        error: error.message,
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
      // For now, returning a mock implementation
      // In real implementation, this would query the items table

      const mockItem: ItemLookupResult = {
        id: 'mock-item-id',
        itemCode: 'ITEM001',
        itemName: 'Sample Item',
        barcode: barcodeData.barcode,
        price: 10.99,
        availableQuantity: 100,
        description: 'Sample item description',
        imageUrl: null,
        taxRate: 8.25,
        isActive: true,
      };

      return mockItem;
    } catch (error) {
      this.logger.error('Failed to lookup item by barcode', {
        error: error.message,
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
          this.logger.error('Failed to sync transaction', {
            error: error.message,
            localId: transaction.localId,
          });
          errors.push(`Transaction ${transaction.localId}: ${error.message}`);
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
        error: error.message,
      });
      throw error;
    }
  }

  // Loyalty Program Management
  async getLoyaltyPointsBalance(
    customerId: string,
    companyId: string
  ): Promise<LoyaltyPointsBalance> {
    try {
      // This would integrate with a loyalty points service
      // Mock implementation for now
      const balance: LoyaltyPointsBalance = {
        customerId,
        totalPoints: 1000,
        availablePoints: 850,
        redeemedPoints: 150,
        pointValue: 0.01, // $0.01 per point
        lastUpdated: new Date(),
      };

      return balance;
    } catch (error) {
      this.logger.error('Failed to get loyalty points balance', {
        error: error.message,
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
        invoice.loyaltyPointsEarned > 0
          ? `You earned ${invoice.loyaltyPointsEarned} loyalty points!`
          : undefined;

      return {
        invoice,
        receiptTemplate,
        qrCode,
        loyaltyMessage,
      };
    } catch (error) {
      this.logger.error('Failed to generate receipt', {
        error: error.message,
        invoiceId,
      });
      throw error;
    }
  }

  // Private helper methods
  private async validatePOSProfileReferences(
    data: CreatePOSProfileDto | UpdatePOSProfileDto,
    companyId: string
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

    const sequence = String(result.count + 1).padStart(4, '0');
    return `${prefix}-${sequence}`;
  }

  private async calculateLoyaltyPoints(
    grandTotal: number,
    loyaltyProgram?: string
  ): Promise<number> {
    if (!loyaltyProgram) return 0;

    // Simple calculation: 1 point per dollar spent
    return Math.floor(grandTotal);
  }

  private async updateInventoryLevels(
    items: any[],
    warehouseId: string,
    companyId: string
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
    companyId: string
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
    companyId: string
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
    localId: string,
    companyId: string
  ): Promise<POSInvoice | null> {
    // This would check for existing invoices with the same local ID
    // Mock implementation for now
    return null;
  }

  private async markTransactionAsSynced(
    localId: string,
    companyId: string
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

  private async generateReceiptQRCode(invoice: POSInvoice): Promise<string> {
    // This would generate a QR code for the receipt
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
  }
}
