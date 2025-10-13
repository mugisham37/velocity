import { Module } from '@nestjs/common';
import { BOMResolver } from './resolvers/bom.resolver';
import { ProductionPlanningResolver } from './resolvers/production-planning.resolver';
import { WorkstationResolver } from './resolvers/workstation.resolver';
import { BOMService } from './services/bom.service';
import { ProductionPlanningService } from './services/production-planning.service';
import { WorkstationService } from './services/workstation.service';

@Module({
  providers: [
    BOMService,
    WorkstationService,
    ProductionPlanningService,
    BOMResolver,
    WorkstationResolver,
    ProductionPlanningResolver,
  ],
  exports: [BOMService, WorkstationService, ProductionPlanningService],
})
export class ManufacturingModule {}

