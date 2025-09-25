import { User } from '@kiro/database';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  BarcodeSearchDto,
  CreatePOSProfileDto,
  CreatePOSSaleDto,
  ItemLookupResult,
  LoyaltyPointsBalance,
  OfflineTransactionDto,
  POSInvoice,
  POSProfile,
  ReceiptData,
  SyncResult,
  UpdatePOSProfileDto,
} from '../dto/pos.dto';
import { POSService } from '../services/pos.service';

@Resolver()
@UseGuards(JwtAuthGuard)
export class POSResolver {
  constructor(private readonly posService: POSService) {}

  // POS Profile Management
  @Mutation(() => POSProfile)
  async createPOSProfile(
    @Args('data') data: CreatePOSProfileDto,
    @CurrentUser() user: User
  ): Promise<POSProfile> {
    return this.posService.createPOSProfile(data, user.companyId, user.id);
  }

  @Mutation(() => POSProfile)
  async updatePOSProfile(
    @Args('id', { type: () => ID }) id: string,
    @Args('data') data: UpdatePOSProfileDto,
    @CurrentUser() user: User
  ): Promise<POSProfile> {
    return this.posService.updatePOSProfile(id, data, user.companyId);
  }

  @Query(() => POSProfile, { nullable: true })
  async posProfile(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<POSProfile | null> {
    return this.posService.getPOSProfile(id, user.companyId);
  }

  @Query(() => [POSProfile])
  async posProfiles(@CurrentUser() user: User): Promise<POSProfile[]> {
    return this.posService.getPOSProfiles(user.companyId);
  }

  @Mutation(() => Boolean)
  async deletePOSProfile(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ): Promise<boolean> {
    return this.posService.deletePOSProfile(id, user.companyId);
  }

  // POS Sales Processing
  @Mutation(() => POSInvoice)
  async processPOSSale(
    @Args('data') data: CreatePOSSaleDto,
    @CurrentUser() user: User
  ): Promise<POSInvoice> {
    return this.posService.processPOSSale(data, user.companyId, user.id);
  }

  // Barcode Scanning
  @Query(() => ItemLookupResult, { nullable: true })
  async lookupItemByBarcode(
    @Args('data') data: BarcodeSearchDto,
    @CurrentUser() user: User
  ): Promise<ItemLookupResult | null> {
    return this.posService.lookupItemByBarcode(data, user.companyId);
  }

  // Offline Transaction Sync
  @Mutation(() => SyncResult)
  async syncOfflineTransactions(
    @Args('transactions', { type: () => [OfflineTransactionDto] })
    transactions: OfflineTransactionDto[],
    @CurrentUser() user: User
  ): Promise<SyncResult> {
    return this.posService.syncOfflineTransactions(
      transactions,
      user.companyId
    );
  }

  // Loyalty Program
  @Query(() => LoyaltyPointsBalance)
  async loyaltyPointsBalance(
    @Args('customerId', { type: () => ID }) customerId: string,
    @CurrentUser() user: User
  ): Promise<LoyaltyPointsBalance> {
    return this.posService.getLoyaltyPointsBalance(customerId, user.companyId);
  }

  // Receipt Generation
  @Query(() => ReceiptData)
  async generateReceipt(
    @Args('invoiceId', { type: () => ID }) invoiceId: string,
    @CurrentUser() user: User
  ): Promise<ReceiptData> {
    return this.posService.generateReceipt(invoiceId, user.companyId);
  }

  // POS Analytics Queries
  @Query(() => [POSInvoice])
  async posInvoices(
    @Args('profileId', { type: () => ID, nullable: true }) profileId?: string,
    @Args('startDate', { nullable: true }) startDate?: Date,
    @Args('endDate', { nullable: true }) endDate?: Date,
    @CurrentUser() user?: User
  ): Promise<POSInvoice[]> {
    // This would implement filtering and pagination
    // Mock implementation for now
    return [];
  }

  @Query(() => String)
  async posDailySalesReport(
    @Args('profileId', { type: () => ID }) profileId: string,
    @Args('date') date: Date,
    @CurrentUser() user: User
  ): Promise<string> {
    // This would generate daily sales report
    return 'Daily sales report data';
  }
}
