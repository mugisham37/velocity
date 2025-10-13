import { Injectable } from '@nestjs/common';

export interface AuditLogEntry {
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  oldValues?: any;
  newValues?: any;
  userId?: string | null;
  companyId: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
  metadata?: any;
}

@Injectable()
export class AuditService {
  async logActivity(entry: AuditLogEntry): Promise<void> {
    // Implementation for logging audit activities
    console.log('Audit log:', entry);
  }

  async logAudit(entry: AuditLogEntry): Promise<void> {
    // Implementation for logging audit activities
    const auditEntry = {
      ...entry,
      timestamp: entry.timestamp || new Date(),
    };
    console.log('Audit log:', auditEntry);
  }
}
