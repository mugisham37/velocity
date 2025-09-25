import { Module } from '@nestjs/common';
import { AuditService } from '../common/services/audit.service';
import { NotificationService } from '../common/services/notification.service';
import { VendorsResolver } from './vendors.resolver';
import { VendorsService } from './vendors.service';

@Module({
  providers: [
    VendorsService,
    VendorsResolver,
    AuditService,
    NotificationService,
  ],
  exports: [VendorsService],
})
export class VendorsModule {}
