import { UseGuards } from '@nestjs/common';
import {
  Args,
  ID,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { PubSub } from '../../collaboration/utils/pubsub';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { User } from '../../auth/entities/user.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CreateStockEntryDto,
  CreateStockReconciliationDto,
  CreateStockReservationDto,
  StockEntryFilterDto,
  StockEntryStatus,
  StockEntryType,
  StockLedgerQueryDto,
  StockLevelQueryDto,
  StockReconciliationFilterDto,
  StockReservationFilterDto,
  UpdateStockEntryDto,
  UpdateStockReconciliationDto,
  UpdateStockReservationDto,
} from '../dto/stock-transaction.dto';
import { StockTransactionService } from '../services/stock-transaction.service';

const pubSub = new PubSub();

@Resolver()
@UseGuards(JwtAuthGuard)
export class StockTransactionResolver {
  constructor(
    private readonly stockTransactionService: StockTransactionService
  ) {}

  // Stock Entry Queries
  @Query('stockEntry')
  async getStockEntry(@Args('id', { type: () => ID }) id: string) {
    return this.stockTransactionService.getStockEntry(id);
  }

  @Query('stockEntries')
  async getStockEntries(
    @Args('filter') filter: StockEntryFilterDto,
    @Args('companyId', { type: () => ID }) companyId: string
  ) {
    return this.stockTransactionService.getStockEntries(filter, companyId);
  }

  // Stock Reservation Queries
  @Query('stockReservation')
  async getStockReservation(@Args('id', { type: () => ID }) id: string) {
    return this.stockTransactionService.getStockReservation(id);
  }

  @Query('stockReservations')
  async getStockReservations(
    @Args('filter') filter: StockReservationFilterDto,
    @Args('companyId', { type: () => ID }) companyId: string
  ) {
    return this.stockTransactionService.getStockReservations(filter, companyId);
  }

  // Stock Reconciliation Queries
  @Query('stockReconciliation')
  async getStockReconciliation(@Args('id', { type: () => ID }) id: string) {
    return this.stockTransactionService.getStockReconciliation(id);
  }

  @Query('stockReconciliations')
  async getStockReconciliations(
    @Args('filter') filter: StockReconciliationFilterDto,
    @Args('companyId', { type: () => ID }) companyId: string
  ) {
    return this.stockTransactionService.getStockReconciliations(
      filter,
      companyId
    );
  }

  // Stock Level and Ledger Queries
  @Query('stockLevels')
  async getStockLevels(
    @Args('query') query: StockLevelQueryDto,
    @Args('companyId', { type: () => ID }) companyId: string
  ) {
    return this.stockTransactionService.getStockLevels(query, companyId);
  }

  @Query('stockLedger')
  async getStockLedger(
    @Args('query') query: StockLedgerQueryDto,
    @Args('companyId', { type: () => ID }) companyId: string
  ) {
    return this.stockTransactionService.getStockLedger(query, companyId);
  }

  @Query('availableStock')
  async getAvailableStock(
    @Args('itemId', { type: () => ID }) itemId: string,
    @Args('warehouseId', { type: () => ID }) warehouseId: string,
    @Args('locationId', { type: () => ID, nullable: true }) locationId?: string
  ) {
    return this.stockTransactionService.getAvailableStock(
      itemId,
      warehouseId,
      locationId
    );
  }

  // Stock Entry Mutations
  @Mutation('createStockEntry')
  async createStockEntry(
    @Args('input') input: CreateStockEntryDto,
    @CurrentUser() user: User
  ) {
    const stockEntry = await this.stockTransactionService.createStockEntry(
      input,
      user.id
    );

    // Publish real-time update
    pubSub.publish('stockEntryCreated', { stockEntryCreated: stockEntry });

    return stockEntry;
  }

  @Mutation('updateStockEntry')
  async updateStockEntry(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateStockEntryDto,
    @CurrentUser() user: User
  ) {
    const stockEntry = await this.stockTransactionService.updateStockEntry(
      id,
      input,
      user.id
    );

    // Publish real-time update
    pubSub.publish('stockEntryStatusChanged', {
      stockEntryStatusChanged: stockEntry,
    });

    return stockEntry;
  }

  @Mutation('submitStockEntry')
  async submitStockEntry(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ) {
    const stockEntry = await this.stockTransactionService.submitStockEntry(
      id,
      user.id
    );

    // Publish real-time updates for affected stock levels
    // Note: stockEntryItems would need to be fetched separately or included in the service response
    pubSub.publish('stockLevelUpdated', {
      stockLevelUpdated: {
        warehouseId: stockEntry.warehouseId,
      },
    });

    pubSub.publish('stockEntryStatusChanged', {
      stockEntryStatusChanged: stockEntry,
    });

    return stockEntry;
  }

  @Mutation('cancelStockEntry')
  async cancelStockEntry(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ) {
    const stockEntry = await this.stockTransactionService.updateStockEntry(
      id,
      { status: StockEntryStatus.CANCELLED },
      user.id
    );

    pubSub.publish('stockEntryStatusChanged', {
      stockEntryStatusChanged: stockEntry,
    });

    return stockEntry;
  }

  // Stock Reservation Mutations
  @Mutation('createStockReservation')
  async createStockReservation(
    @Args('input') input: CreateStockReservationDto,
    @CurrentUser() user: User
  ) {
    const reservation =
      await this.stockTransactionService.createStockReservation(input, user.id);

    // Publish real-time updates
    pubSub.publish('stockReservationUpdated', {
      stockReservationUpdated: reservation,
    });

    pubSub.publish('stockLevelUpdated', {
      stockLevelUpdated: {
        itemId: reservation.itemId,
        warehouseId: reservation.warehouseId,
      },
    });

    return reservation;
  }

  @Mutation('updateStockReservation')
  async updateStockReservation(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateStockReservationDto,
    @CurrentUser() user: User
  ) {
    const reservation =
      await this.stockTransactionService.updateStockReservation(
        id,
        input,
        user.id
      );

    pubSub.publish('stockReservationUpdated', {
      stockReservationUpdated: reservation,
    });

    return reservation;
  }

  @Mutation('releaseStockReservation')
  async releaseStockReservation(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ) {
    const reservation =
      await this.stockTransactionService.releaseStockReservation(id, user.id);

    pubSub.publish('stockReservationUpdated', {
      stockReservationUpdated: reservation,
    });

    pubSub.publish('stockLevelUpdated', {
      stockLevelUpdated: {
        itemId: reservation.itemId,
        warehouseId: reservation.warehouseId,
      },
    });

    return reservation;
  }

  // Stock Reconciliation Mutations
  @Mutation('createStockReconciliation')
  async createStockReconciliation(
    @Args('input') input: CreateStockReconciliationDto,
    @CurrentUser() user: User
  ) {
    return this.stockTransactionService.createStockReconciliation(
      input,
      user.id
    );
  }

  @Mutation('updateStockReconciliation')
  async updateStockReconciliation(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateStockReconciliationDto,
    @CurrentUser() user: User
  ) {
    return this.stockTransactionService.updateStockReconciliation(
      id,
      input,
      user.id
    );
  }

  @Mutation('submitStockReconciliation')
  async submitStockReconciliation(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User
  ) {
    const reconciliation =
      await this.stockTransactionService.submitStockReconciliation(id, user.id);

    // Publish real-time updates for affected stock levels
    // Note: reconciliationItems would need to be fetched separately or included in the service response
    pubSub.publish('stockLevelUpdated', {
      stockLevelUpdated: {
        warehouseId: reconciliation.warehouseId,
      },
    });

    return reconciliation;
  }

  // Bulk Operations
  @Mutation('bulkUpdateStockLevels')
  async bulkUpdateStockLevels(
    @Args('updates') updates: any[],
    @CurrentUser() user: User
  ) {
    // Implementation for bulk stock level updates
    const results = [];

    for (const update of updates) {
      // Create adjustment entry for each update
      const adjustmentEntry =
        await this.stockTransactionService.createStockEntry(
          {
            entryNumber: `BULK-ADJ-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            entryType: StockEntryType.ADJUSTMENT,
            referenceType: 'Bulk Update',
            referenceNumber: `BULK-${Date.now()}`,
            transactionDate: new Date().toISOString(),
            postingDate: new Date().toISOString(),
            warehouseId: update.warehouseId,
            purpose: 'Bulk Stock Update',
            remarks: update.reason,
            items: [
              {
                itemId: update.itemId,
                locationId: update.locationId,
                qty: update.newQty,
                uom: 'Nos', // This should come from item master
                valuationRate: update.valuationRate || 0,
                remarks: update.reason,
              },
            ],
            companyId: user.companyId,
          },
          user.id
        );

      await this.stockTransactionService.submitStockEntry(
        adjustmentEntry.id,
        user.id
      );

      // Publish real-time update
      pubSub.publish('stockLevelUpdated', {
        stockLevelUpdated: {
          itemId: update.itemId,
          warehouseId: update.warehouseId,
        },
      });

      results.push(adjustmentEntry);
    }

    return results;
  }

  @Mutation('processStockAdjustment')
  async processStockAdjustment(
    @Args('adjustments') adjustments: any[],
    @Args('companyId', { type: () => ID }) companyId: string,
    @CurrentUser() user: User
  ) {
    // Create a single stock adjustment entry with multiple items
    const adjustmentItems = adjustments.map(adj => ({
      itemId: adj.itemId,
      locationId: adj.locationId,
      qty: Math.abs(adj.adjustmentQty),
      uom: 'Nos', // This should come from item master
      valuationRate: adj.valuationRate || 0,
      remarks: adj.remarks || adj.reason,
    }));

    const adjustmentEntry = await this.stockTransactionService.createStockEntry(
      {
        entryNumber: `ADJ-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        entryType: StockEntryType.ADJUSTMENT,
        referenceType: 'Stock Adjustment',
        referenceNumber: `ADJ-${Date.now()}`,
        transactionDate: new Date().toISOString(),
        postingDate: new Date().toISOString(),
        warehouseId: adjustments[0].warehouseId, // Assuming all adjustments are for the same warehouse
        purpose: 'Stock Adjustment',
        remarks: 'Bulk stock adjustment',
        items: adjustmentItems,
        companyId,
      },
      user.id
    );

    const submittedEntry = await this.stockTransactionService.submitStockEntry(
      adjustmentEntry.id,
      user.id
    );

    // Publish real-time updates
    for (const adjustment of adjustments) {
      pubSub.publish('stockLevelUpdated', {
        stockLevelUpdated: {
          itemId: adjustment.itemId,
          warehouseId: adjustment.warehouseId,
        },
      });
    }

    return submittedEntry;
  }

  // Subscriptions
  @Subscription('stockLevelUpdated', {
    filter: (payload, variables) => {
      if (
        variables.itemId &&
        payload.stockLevelUpdated.itemId !== variables.itemId
      ) {
        return false;
      }
      if (
        variables.warehouseId &&
        payload.stockLevelUpdated.warehouseId !== variables.warehouseId
      ) {
        return false;
      }
      return true;
    },
  })
  stockLevelUpdated(
    @Args('itemId', { type: () => ID, nullable: true }) _itemId?: string,
    @Args('warehouseId', { type: () => ID, nullable: true })
    _warehouseId?: string
  ) {
    return pubSub.asyncIterator('stockLevelUpdated');
  }

  @Subscription('stockEntryStatusChanged')
  stockEntryStatusChanged(
    @Args('entryId', { type: () => ID }) _entryId: string
  ) {
    return pubSub.asyncIterator('stockEntryStatusChanged');
  }

  @Subscription('stockReservationUpdated')
  stockReservationUpdated(
    @Args('reservationId', { type: () => ID }) _reservationId: string
  ) {
    return pubSub.asyncIterator('stockReservationUpdated');
  }


}

