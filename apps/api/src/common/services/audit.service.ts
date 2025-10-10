import { Injectable, Inject } from '@nestjs/common';
import { auditLogs, dataRetentionPolicies, db } from '@kiro/database';
import { and, desc, eq, gte, lte } from '@kiro/database';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export interface AuditLogEntry {
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changes?: Record<string, { from: any; to: any }>;
  userId?: string;
  companyId: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface AuditQueryOptions {
  entityType?: string;
  entityId?: string;
  action?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  /**
   * Log an audit entry
   */
  async logAudit(entry: AuditLogEntry): Promise<void> {
    try {
      // Calculate changes if both old and new values are provided
      let changes: Record<string, { from: any; to: any }> | undefined;
      if (entry.oldValues && entry.newValues) {
        changes = this.calculateChanges(entry.oldValues, entry.newValues);
      }

      await db.insert(auditLogs).values({
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        oldValues: entry.oldValues,
        newValues: entry.newValues,
        changes: changes || entry.changes,
        userId: entry.userId,
        companyId: entry.companyId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        metadata: entry.metadata,
      });

      this.logger.info('Audit log created', {
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        userId: entry.userId,
        companyId: entry.companyId,
      });
    } catch (error) {
      this.logger.error('Failed to create audit log', { error, entry });
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(
    companyId: string,
    options: AuditQueryOptions = {}
  ): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const {
      entityType,
      entityId,
      action,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = options;

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(auditLogs.companyId, companyId)];

    if (entityType) {
      conditions.push(eq(auditLogs.entityType, entityType));
    }
    if (entityId) {
      conditions.push(eq(auditLogs.entityId, entityId));
    }
    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }
    if (userId) {
      conditions.push(eq(auditLogs.userId, userId));
    }
    if (startDate) {
      conditions.push(gte(auditLogs.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(auditLogs.createdAt, endDate));
    }

    const whereClause = and(...conditions);

    // Get total count
    const [{ count: total }] = await db
      .select({ count: db.$count(auditLogs) })
      .from(auditLogs)
      .where(whereClause);

    // Get data with pagination
    const data = await db
      .select({
        id: auditLogs.id,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        action: auditLogs.action,
        oldValues: auditLogs.oldValues,
        newValues: auditLogs.newValues,
        changes: auditLogs.changes,
        userId: auditLogs.userId,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get audit trail for a specific entity
   */
  async getEntityAuditTrail(
    entityType: string,
    entityId: string,
    companyId: string
  ): Promise<any[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityType, entityType),
          eq(auditLogs.entityId, entityId),
          eq(auditLogs.companyId, companyId)
        )
      )
      .orderBy(desc(auditLogs.createdAt));
  }

  /**
   * Set data retention policy
   */
  async setRetentionPolicy(
    entityType: string,
    retentionPeriodDays: string,
    companyId: string
  ): Promise<void> {
    await db
      .insert(dataRetentionPolicies)
      .values({
        entityType,
        retentionPeriodDays,
        companyId,
      })
      .onConflictDoUpdate({
        target: [dataRetentionPolicies.entityType, dataRetentionPolicies.companyId],
        set: {
          retentionPeriodDays,
          updatedAt: new Date(),
        },
      });

    this.logger.info('Data retention policy set', {
      entityType,
      retentionPeriodDays,
      companyId,
    });
  }

  /**
   * Clean up old audit logs based on retention policies
   */
  async cleanupOldAuditLogs(): Promise<void> {
    try {
      const policies = await db
        .select()
        .from(dataRetentionPolicies)
        .where(eq(dataRetentionPolicies.isActive, 'true'));

      for (const policy of policies) {
        if (policy.retentionPeriodDays === 'FOREVER') {
          continue;
        }

        const retentionDays = parseInt(policy.retentionPeriodDays);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        const deletedCount = await db
          .delete(auditLogs)
          .where(
            and(
              eq(auditLogs.entityType, policy.entityType),
              eq(auditLogs.companyId, policy.companyId),
              lte(auditLogs.createdAt, cutoffDate)
            )
          );

        this.logger.info('Cleaned up old audit logs', {
          entityType: policy.entityType,
          companyId: policy.companyId,
          deletedCount,
          cutoffDate,
        });
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old audit logs', { error });
    }
  }

  /**
   * Calculate changes between old and new values
   */
  private calculateChanges(
    oldValues: Record<string, any>,
    newValues: Record<string, any>
  ): Record<string, { from: any; to: any }> {
    const changes: Record<string, { from: any; to: any }> = {};

    // Check for changed and new fields
    for (const [key, newValue] of Object.entries(newValues)) {
      const oldValue = oldValues[key];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = { from: oldValue, to: newValue };
      }
    }

    // Check for deleted fields
    for (const [key, oldValue] of Object.entries(oldValues)) {
      if (!(key in newValues)) {
        changes[key] = { from: oldValue, to: undefined };
      }
    }

    return changes;
  }

  /**
   * Create audit decorator for automatic logging
   */
  static createAuditDecorator(entityType: string) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const auditService = this.auditService as AuditService;
        const result = await method.apply(this, args);

        // Extract audit information from method context
        const context = this.getAuditContext?.() || {};

        await auditService.logAudit({
          entityType,
          entityId: result?.id || args[0],
          action: propertyName.toUpperCase() as any,
          newValues: result,
          companyId: context.companyId,
          userId: context.userId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return result;
      };
    };
  }
}
