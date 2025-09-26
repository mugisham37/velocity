import { Module } from '@nestjs/common';
import { BOMResolver } from './resolvers/bom.resolver';
import { WorkstationResolver } from './resolvers/workstation.resolver';
import { BOMService } from './services/bom.service';
import { WorkstationService } from './services/workstation.service';

@Module({
  providers: [BOMService, WorkstationService, BOMResolver, WorkstationResolver],
  exports: [BOMService, WorkstationService],
})
export class ManufacturingModule {}
