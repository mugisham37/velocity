import { DatabaseModule } from '@kiro/database';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ItemResolver } from './resolvers/item.resolver';
import { SerialBatchTrackingResolver } from './resolvers/serial-batch-tracking.resolver';
import { StockTransactionResolver } from './resolvers/stock-transaction.resolver';
import { ItemService } from './services/item.service';
import { SerialBatchTrackingService } from './services/serial-batch-tracking.service';
import { StockTransactionService } from './services/stock-transaction.service';
import { WarehouseService } from './services/warehouse.service';

@Module({
  imports: [
    DatabaseModule,
    GraphQLModule.forFeature({
      typePaths: ['./**/*.graphql'],
    }),
  ],
  providers: [
    ItemService,
    StockTransactionService,
    WarehouseService,
    SerialBatchTrackingService,
    ItemResolver,
    StockTransactionResolver,
    SerialBatchTrackingResolver,
  ],
  exports: [
    ItemService,
    StockTransactionService,
    WarehouseService,
    SerialBatchTrackingService,
  ],
})
export class InventoryModule {}
