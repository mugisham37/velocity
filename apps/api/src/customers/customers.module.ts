import { Module } from '@nestjs/common';
import { AuditService } from '../common/services/audit.service';
import { NotificationService } from '../common/services/notification.service';
import { CustomersResolver } from './customers.resolver';
import { CustomersService } from './customers.service';

@Module({
  providers: [
    CustomersService,
    CustomersResolver,
    AuditService,
    NotificationService,
  ],
  exports: [CustomersService],
})
export class CustomersModule {}

