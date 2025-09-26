import { DatabaseModule } from '@kiro/database';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { AssetResolver } from './resolvers/asset.resolver';
import { DepreciationResolver } from './resolvers/depreciation.resolver';
import { MaintenanceResolver } from './resolvers/maintenance.resolver';
import { AssetService } from './services/asset.service';
import { DepreciationService } from './services/depreciation.service';
import { MaintenanceService } from './services/maintenance.service';

@Module({
  imports: [
    DatabaseModule,
    GraphQLModule.forFeature({
      typePaths: ['./**/*.graphql'],
    }),
  ],
  providers: [
    // Services
    AssetService,
    DepreciationService,
    MaintenanceService,

    // Resolvers
    AssetResolver,
    DepreciationResolver,
    MaintenanceResolver,
  ],
  exports: [AssetService, DepreciationService, MaintenanceService],
})
export class AssetsModule {}
