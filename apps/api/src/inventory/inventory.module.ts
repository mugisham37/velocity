import { DatabaseModule } from '@kiro/database';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ItemResolver } from './resolvers/item.resolver';
import { ItemService } from './services/item.service';

@Module({
  imports: [
    DatabaseModule,
    GraphQLModule.forFeature({
      typePaths: ['./**/*.graphql'],
    }),
  ],
  providers: [ItemService, ItemResolver],
  exports: [ItemService],
})
export class InventoryModule {}
