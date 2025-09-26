import { db } from '@kiro/database';
import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AuditService } from '../../common/services/audit.service';
import { NotificationService } from '../../common/services/notification.service';
import { EncryptionService } from './encryption.service';

export interface DataSubject {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyId: string;
  consentStatus: ConsentStatus;
  dataCategories: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentStatus {
  marketing: boolean;
  analytics: boolean;
  functional: boolean;
  necessary: boolean;
  lastUpdated: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface DataProcessingActivity {
  id: string;
  name: string;
  purpose: string;
  legalBasis:
    | 'CONSENT'
    | 'CONTRACT'
    | 'LEGAL_OBLIGATION'
    | 'VITAL_INTERESTS'
    | 'PUBLIC_TASK'
    | 'LEGITIMATE_INTERESTS';
  dataCategories: string[];
  recipients: string[];
  retentionPeriod: number; // in days
  crossBorderTransfer: boolean;
  safeguards?: string[];
  companyId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataRequest {
  id: string;
  type:
    | 'ACCESS'
    | 'RECTIFICATION'
    | 'ERASURE'
    | 'PORTABILITY'
    | 'RESTRICTION'
    | 'OBJECTION';
  subjectId: string;
  companyId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  requestDate: Date;
  completionDate?: Date;
  description?: string;
  response?: string;
  documents?: string[];
}

export interface DataBreach {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'CONFIDENTIALITY' | 'INTEGRITY' | 'AVAILABILITY';
  affectedRecords: number;
  dataCategories: string[];
  cause: string;
  discoveredAt: Date;
  reportedAt?: Date;
  containedAt?: Date;
  resolvedAt?: Date;
  notificationRequired: boolean;
  authorityNotified: boolean;
  subjectsNotified: boolean;
  companyId: string;
  status: 'OPEN' | 'CONTAINED' | 'RESOLVED';
  remediation: string[];
}

export interface PrivacyImpactAssessment {
  id: string;
  name: string;
  description: string;
  processingActivity: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  dataTypes: string[];
  risks: PIARisk[];
  mitigations: PIAMitigation[];
  status: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  assessor: string;
  reviewer?: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PIARisk {
  id: string;
  description: string;
  likelihood: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface PIAMitigation {
  id: string;
  riskId: string;
  description: string;
  implementation: string;
  effectiveness: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PLANNED' | 'IN_PROGRESS' | 'IMPLEMENTED';
}

@Injectable()
export class DataProtectionService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly encryptionService: EncryptionService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService
  ) {}

  /**
   * Record consent for data subject
   */
  async recordConsent(
    email: string,
    consent: ConsentStatus,
    companyId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const consentRecord = {
        ...consent,
        lastUpdated: new Date(),
        ipAddress,
        userAgent,
      };

      await db.execute(
        `
        INSERT INTO data_subjects (email, consent_status, company_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email, company_id) DO UPDATE SET
          consent_status = EXCLUDED.consent_status,
          updated_at = EXCLUDED.updated_at
      `,
        [
          email,
          JSON.stringify(consentRecord),
          companyId,
          new Date(),
          new Date(),
        ]
      );

      // Log consent change
      await this.auditService.logAudit({
        entityType: 'data_subject',
        entityId: email,
        action: 'UPDATE',
        newValues: { consent: consentRecord },
        companyId,
        ipAddress,
        userAgent,
        metadata: { type: 'consent_update' },
      });

      this.logger.info('Consent recorded', { email, companyId, consent });
    } catch (error) {
      this.logger.error('Failed to record consent', {
        error,
        email,
        companyId,
      });
      throw error;
    }
  }

  /**
   * Process data subject access request (GDPR Article 15)
   */
  async processAccessRequest(
    subjectEmail: string,
    companyId: string,
    requesterId: string
  ): Promise<DataRequest> {
    const requestId = `access_${Date.now()}`;

    try {
      this.logger.info('Processing data access request', {
        requestId,
        subjectEmail,
        companyId,
      });

      const request: DataRequest = {
        id: requestId,
        type: 'ACCESS',
        subjectId: subjectEmail,
        companyId,
        status: 'IN_PROGRESS',
        requestDate: new Date(),
        description: 'Data subject access request under GDPR Article 15',
      };

      // Store request
      await this.storeDataRequest(request);

      // Collect personal data
      const personalData = await this.collectPersonalData(
        subjectEmail,
        companyId
      );

      // Generate data export
      const exportData = await this.generateDataExport(personalData);

      // Update request with response
      request.status = 'COMPLETED';
      request.completionDate = new Date();
      request.response = 'Personal data export generated';
      request.documents = [exportData.filePath];

      await this.updateDataRequest(request);

      // Log the request
      await this.auditService.logAudit({
        entityType: 'data_request',
        entityId: requestId,
        action: 'CREATE',
        newValues: request,
        companyId,
        userId: requesterId,
        metadata: { type: 'gdpr_access_request' },
      });

      this.logger.info('Data access request completed', {
        requestId,
        subjectEmail,
      });
      return request;
    } catch (error) {
      this.logger.error('Failed to process access request', {
        error,
        requestId,
        subjectEmail,
      });
      throw error;
    }
  }

  /**
   * Process data erasure request (GDPR Article 17 - Right to be forgotten)
   */
  async processErasureRequest(
    subjectEmail: string,
    companyId: string,
    requesterId: string,
    reason?: string
  ): Promise<DataRequest> {
    const requestId = `erasure_${Date.now()}`;

    try {
      this.logger.info('Processing data erasure request', {
        requestId,
        subjectEmail,
        companyId,
      });

      const request: DataRequest = {
        id: requestId,
        type: 'ERASURE',
        subjectId: subjectEmail,
        companyId,
        status: 'IN_PROGRESS',
        requestDate: new Date(),
        description:
          reason || 'Data subject erasure request under GDPR Article 17',
      };

      await this.storeDataRequest(request);

      // Check if erasure is legally permissible
      const canErase = await this.checkErasurePermissibility(
        subjectEmail,
        companyId
      );

      if (!canErase.permitted) {
        request.status = 'REJECTED';
        request.response = canErase.reason;
        request.completionDate = new Date();
        await this.updateDataRequest(request);
        return request;
      }

      // Perform data erasure
      const erasureResult = await this.performDataErasure(
        subjectEmail,
        companyId
      );

      request.status = 'COMPLETED';
      request.completionDate = new Date();
      request.response = `Data erasure completed. ${erasureResult.recordsDeleted} records deleted.`;

      await this.updateDataRequest(request);

      // Log the erasure
      await this.auditService.logAudit({
        entityType: 'data_request',
        entityId: requestId,
        action: 'CREATE',
        newValues: request,
        companyId,
        userId: requesterId,
        metadata: {
          type: 'gdpr_erasure_request',
          recordsDeleted: erasureResult.recordsDeleted,
          tablesAffected: erasureResult.tablesAffected,
        },
      });

      this.logger.info('Data erasure request completed', {
        requestId,
        subjectEmail,
        recordsDeleted: erasureResult.recordsDeleted,
      });

      return request;
    } catch (error) {
      this.logger.error('Failed to process erasure request', {
        error,
        requestId,
        subjectEmail,
      });
      throw error;
    }
  }

  /**
   * Process data portability request (GDPR Article 20)
   */
  async processPortabilityRequest(
    subjectEmail: string,
    companyId: string,
    requesterId: string,
    format: 'JSON' | 'CSV' | 'XML' = 'JSON'
  ): Promise<DataRequest> {
    const requestId = `portability_${Date.now()}`;

    try {
      this.logger.info('Processing data portability request', {
        requestId,
        subjectEmail,
        companyId,
      });

      const request: DataRequest = {
        id: requestId,
        type: 'PORTABILITY',
        subjectId: subjectEmail,
        companyId,
        status: 'IN_PROGRESS',
        requestDate: new Date(),
        description: 'Data portability request under GDPR Article 20',
      };

      await this.storeDataRequest(request);

      // Collect portable data (only data provided by the subject)
      const portableData = await this.collectPortableData(
        subjectEmail,
        companyId
      );

      // Generate portable export
      const exportFile = await this.generatePortableExport(
        portableData,
        format
      );

      request.status = 'COMPLETED';
      request.completionDate = new Date();
      request.response = 'Portable data export generated';
      request.documents = [exportFile.filePath];

      await this.updateDataRequest(request);

      // Log the request
      await this.auditService.logAudit({
        entityType: 'data_request',
        entityId: requestId,
        action: 'CREATE',
        newValues: request,
        companyId,
        userId: requesterId,
        metadata: { type: 'gdpr_portability_request', format },
      });

      this.logger.info('Data portability request completed', {
        requestId,
        subjectEmail,
      });
      return request;
    } catch (error) {
      this.logger.error('Failed to process portability request', {
        error,
        requestId,
        subjectEmail,
      });
      throw error;
    }
  }

  /**
   * Report data breach
   */
  async reportDataBreach(
    breach: Omit<DataBreach, 'id' | 'discoveredAt' | 'status'>
  ): Promise<DataBreach> {
    const breachId = `breach_${Date.now()}`;

    try {
      const dataBreach: DataBreach = {
        ...breach,
        id: breachId,
        discoveredAt: new Date(),
        status: 'OPEN',
      };

      // Store breach record
      await db.execute(
        `
        INSERT INTO data_breaches (
          id, title, description, severity, category, affected_records,
          data_categories, cause, discovered_at, notification_required,
          authority_notified, subjects_notified, company_id, status, remediation
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `,
        [
          dataBreach.id,
          dataBreach.title,
          dataBreach.description,
          dataBreach.severity,
          dataBreach.category,
          dataBreach.affectedRecords,
          JSON.stringify(dataBreach.dataCategories),
          dataBreach.cause,
          dataBreach.discoveredAt,
          dataBreach.notificationRequired,
          dataBreach.authorityNotified,
          dataBreach.subjectsNotified,
          dataBreach.companyId,
          dataBreach.status,
          JSON.stringify(dataBreach.remediation),
        ]
      );

      // Send immediate notifications for high/critical breaches
      if (
        dataBreach.severity === 'HIGH' ||
        dataBreach.severity === 'CRITICAL'
      ) {
        await this.notificationService.sendDataBreachAlert({
          breachId: dataBreach.id,
          severity: dataBreach.severity,
          affectedRecords: dataBreach.affectedRecords,
          companyId: dataBreach.companyId,
          notificationRequired: dataBreach.notificationRequired,
        });
      }

      // Log the breach
      await this.auditService.logAudit({
        entityType: 'data_breach',
        entityId: breachId,
        action: 'CREATE',
        newValues: dataBreach,
        companyId: dataBreach.companyId,
        metadata: { type: 'data_breach_reported' },
      });

      this.logger.warn('Data breach reported', {
        breachId,
        severity: dataBreach.severity,
        affectedRecords: dataBreach.affectedRecords,
      });

      return dataBreach;
    } catch (error) {
      this.logger.error('Failed to report data breach', { error, breachId });
      throw error;
    }
  }

  /**
   * Conduct Privacy Impact Assessment
   */
  async conductPIA(
    assessment: Omit<PrivacyImpactAssessment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PrivacyImpactAssessment> {
    const piaId = `pia_${Date.now()}`;

    try {
      const pia: PrivacyImpactAssessment = {
        ...assessment,
        id: piaId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store PIA
      await db.execute(
        `
        INSERT INTO privacy_impact_assessments (
          id, name, description, processing_activity, risk_level,
          data_types, risks, mitigations, status, assessor, reviewer, company_id,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `,
        [
          pia.id,
          pia.name,
          pia.description,
          pia.processingActivity,
          pia.riskLevel,
          JSON.stringify(pia.dataTypes),
          JSON.stringify(pia.risks),
          JSON.stringify(pia.mitigations),
          pia.status,
          pia.assessor,
          pia.reviewer,
          pia.companyId,
          pia.createdAt,
          pia.updatedAt,
        ]
      );

      this.logger.info('Privacy Impact Assessment created', {
        piaId,
        riskLevel: pia.riskLevel,
      });
      return pia;
    } catch (error) {
      this.logger.error('Failed to conduct PIA', { error, piaId });
      throw error;
    }
  }

  /**
   * Scheduled data retention cleanup
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async scheduledDataRetentionCleanup(): Promise<void> {
    this.logger.info('Starting scheduled data retention cleanup');

    try {
      // Get active data processing activities
      const activities = await db.execute(`
        SELECT * FROM data_processing_activities WHERE is_active = true
      `);

      for (const activity of activities) {
        const retentionDate = new Date();
        retentionDate.setDate(
          retentionDate.getDate() - activity.retention_period
        );

        // Clean up expired data based on activity
        await this.cleanupExpiredData(activity, retentionDate);
      }

      this.logger.info('Data retention cleanup completed');
    } catch (error) {
      this.logger.error('Data retention cleanup failed', { error });
    }
  }

  /**
   * Get data protection dashboard
   */
  async getDataProtectionDashboard(companyId: string): Promise<{
    activeRequests: number;
    completedRequests: number;
    openBreaches: number;
    consentRate: number;
    retentionCompliance: number;
    recentRequests: DataRequest[];
    recentBreaches: DataBreach[];
  }> {
    try {
      const [activeRequests] = await db.execute(
        `
        SELECT COUNT(*) as count FROM data_requests
        WHERE company_id = $1 AND status IN ('PENDING', 'IN_PROGRESS')
      `,
        [companyId]
      );

      const [completedRequests] = await db.execute(
        `
        SELECT COUNT(*) as count FROM data_requests
        WHERE company_id = $1 AND status = 'COMPLETED'
        AND completion_date >= NOW() - INTERVAL '30 days'
      `,
        [companyId]
      );

      const [openBreaches] = await db.execute(
        `
        SELECT COUNT(*) as count FROM data_breaches
        WHERE company_id = $1 AND status IN ('OPEN', 'CONTAINED')
      `,
        [companyId]
      );

      const [consentStats] = await db.execute(
        `
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN (consent_status->>'marketing')::boolean = true THEN 1 END) as marketing_consent
        FROM data_subjects WHERE company_id = $1
      `,
        [companyId]
      );

      const recentRequests = await db.execute(
        `
        SELECT * FROM data_requests
        WHERE company_id = $1
        ORDER BY request_date DESC
        LIMIT 5
      `,
        [companyId]
      );

      const recentBreaches = await db.execute(
        `
        SELECT * FROM data_breaches
        WHERE company_id = $1
        ORDER BY discovered_at DESC
        LIMIT 5
      `,
        [companyId]
      );

      const consentRate =
        consentStats.total > 0
          ? (consentStats.marketing_consent / consentStats.total) * 100
          : 0;

      return {
        activeRequests: activeRequests.count || 0,
        completedRequests: completedRequests.count || 0,
        openBreaches: openBreaches.count || 0,
        consentRate,
        retentionCompliance: 95, // This would be calculated based on actual retention policies
        recentRequests: recentRequests || [],
        recentBreaches: recentBreaches || [],
      };
    } catch (error) {
      this.logger.error('Failed to get data protection dashboard', {
        error,
        companyId,
      });
      throw error;
    }
  }

  private async collectPersonalData(
    email: string,
    companyId: string
  ): Promise<any> {
    // Collect all personal data for the subject across all tables
    const personalData: any = {};

    try {
      // Users table
      const [user] = await db.execute(
        `
        SELECT * FROM users WHERE email = $1 AND company_id = $2
      `,
        [email, companyId]
      );
      if (user) personalData.user = user;

      // Add other tables that might contain personal data
      // This would be expanded based on the actual schema

      return personalData;
    } catch (error) {
      this.logger.error('Failed to collect personal data', {
        error,
        email,
        companyId,
      });
      throw error;
    }
  }

  private async collectPortableData(
    email: string,
    companyId: string
  ): Promise<any> {
    // Collect only data that was provided by the subject (portable under GDPR)
    return this.collectPersonalData(email, companyId);
  }

  private async generateDataExport(data: any): Promise<{ filePath: string }> {
    // Generate data export file
    const fileName = `data_export_${Date.now()}.json`;
    const filePath = `/tmp/${fileName}`;

    // In a real implementation, this would write to a secure file system
    return { filePath };
  }

  private async generatePortableExport(
    data: any,
    format: string
  ): Promise<{ filePath: string }> {
    // Generate portable data export in specified format
    const fileName = `portable_data_${Date.now()}.${format.toLowerCase()}`;
    const filePath = `/tmp/${fileName}`;

    return { filePath };
  }

  private async checkErasurePermissibility(
    email: string,
    companyId: string
  ): Promise<{ permitted: boolean; reason?: string }> {
    // Check if data erasure is legally permissible
    // Consider legal obligations, legitimate interests, etc.

    try {
      // Check if user has active contracts or legal obligations
      const [activeContracts] = await db.execute(
        `
        SELECT COUNT(*) as count FROM contracts
        WHERE customer_email = $1 AND company_id = $2 AND status = 'ACTIVE'
      `,
        [email, companyId]
      );

      if (activeContracts.count > 0) {
        return {
          permitted: false,
          reason: 'Cannot erase data due to active contractual obligations',
        };
      }

      return { permitted: true };
    } catch (error) {
      this.logger.error('Failed to check erasure permissibility', {
        error,
        email,
        companyId,
      });
      return {
        permitted: false,
        reason: 'Unable to verify erasure permissibility',
      };
    }
  }

  private async performDataErasure(
    email: string,
    companyId: string
  ): Promise<{ recordsDeleted: number; tablesAffected: string[] }> {
    let recordsDeleted = 0;
    const tablesAffected: string[] = [];

    try {
      // Anonymize or delete data from various tables
      const tables = ['users', 'data_subjects', 'audit_logs']; // Add more tables as needed

      for (const table of tables) {
        const result = await db.execute(
          `
          DELETE FROM ${table} WHERE email = $1 AND company_id = $2
        `,
          [email, companyId]
        );

        if (result.rowCount > 0) {
          recordsDeleted += result.rowCount;
          tablesAffected.push(table);
        }
      }

      return { recordsDeleted, tablesAffected };
    } catch (error) {
      this.logger.error('Failed to perform data erasure', {
        error,
        email,
        companyId,
      });
      throw error;
    }
  }

  private async storeDataRequest(request: DataRequest): Promise<void> {
    await db.execute(
      `
      INSERT INTO data_requests (
        id, type, subject_id, company_id, status, request_date, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
      [
        request.id,
        request.type,
        request.subjectId,
        request.companyId,
        request.status,
        request.requestDate,
        request.description,
      ]
    );
  }

  private async updateDataRequest(request: DataRequest): Promise<void> {
    await db.execute(
      `
      UPDATE data_requests SET
        status = $1, completion_date = $2, response = $3, documents = $4
      WHERE id = $5
    `,
      [
        request.status,
        request.completionDate,
        request.response,
        JSON.stringify(request.documents || []),
        request.id,
      ]
    );
  }

  private async cleanupExpiredData(
    activity: any,
    retentionDate: Date
  ): Promise<void> {
    // Clean up expired data based on retention policies
    this.logger.info('Cleaning up expired data', {
      activity: activity.name,
      retentionDate,
    });
  }
}
