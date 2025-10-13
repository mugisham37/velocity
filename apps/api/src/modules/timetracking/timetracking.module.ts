import { Module } from '@nestjs/common';
import { TimeTrackingResolver } from './timetracking.resolver';
import { TimeTrackingService } from './timetracking.service';

@Module({
  providers: [TimeTrackingService, TimeTrackingResolver],
  exports: [TimeTrackingService],
})
export class TimeTrackingModule {}

