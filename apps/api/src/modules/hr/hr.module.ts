import { DatabaseModule } from '../../database';
import { Module } from '@nestjs/common';
import { HRController } from './hr.controller';
import { HRResolver } from './hr.resolver';
import { HRService } from './hr.service';

@Module({
  imports: [DatabaseModule],
  controllers: [HRController],
  providers: [HRService, HRResolver],
  exports: [HRService],
})
export class HRModule {}

