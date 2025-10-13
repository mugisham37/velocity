import { Module } from '@nestjs/common';
import { AuditService } from './services/audit.service';
import { NotificationService } from './services/notification.service';

@Module({
  providers: [AuditService, NotificationService],
  exports: [AuditService, NotificationService],
})
export class CommonModule {}
