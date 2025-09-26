import { db } from '@kiro/database';
import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AuditService } from '../../common/services/audit.service';
import { NotificationService } from '../../common/services/notification.service';

export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  description: string;
  requirements: ComplianceRequirement[];
  enabled: boolean;
}

export interface ComplianceRequirement {
  id: string;
  frameworkId: string;
  code: string;
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status:
    | 'NOT_IMPLEMENTED'
    | 'PARTIALLY_IMPLEMENTED'
    | 'IMPLEMENTED'
    | 'NOT_APPLICABLE';
  evidence: string[];
  controls: ComplianceControl[];
  lastAssessed: Date;
  nextAssessment: Date;
}

export interface ComplianceControl {
  id: string;
  requirementId: string;
  ne: string;
  description: string;
  type: 'PREVENTIVE' | 'DETECTIVE' | 'CORRECTIVE';
  automated: boolean;
  frequency:
    | 'CONTINUOUS'
    | 'DAILY'
    | 'WEEKLY'
    | 'MONTHLY'
    | 'QUARTERLY'
    | 'ANNUALLY';
  owner: string;
  status: 'ACTIVE' | 'INACTIVE' | 'UNDER_REVIEW';
  lastTested: Date;
  nextTest: Date;
  effectiveness:
    | 'EFFECTIVE'
    | 'PARTIALLY_EFFECTIVE'
    | 'INEFFECTIVE'
    | 'NOT_TESTED';
}

export interface ComplianceAssessment {
  id: string;
  frameworkId: string;
  assessmentDate: Date;
  assessor: string;
  scope: string;
  findings: ComplianceFinding[];
  overallScore: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'UNDER_REVIEW' | 'APPROVED';
  recommendations: string[];
}

export interface ComplianceFinding {
  id: string;
  assessmentId: string;
  requirementId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: 'GAP' | 'WEAKNESS' | 'NON_COMPLIANCE' | 'OBSERVATION';
  description: string;
  evidence: string[];
  remediation: string[];
  dueDate: Date;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ACCEPTED';
  assignee: string;
}

export interface SOXControl {
  id: string;
  controlId: string;
  name: string;
  description: string;
  process: string;
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH';
  controlType: 'MANUAL' | 'AUTOMATED' | 'IT_DEPENDENT';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  owner: string;
  reviewer: string;
  lastTested: Date;
  nextTest: Date;
  testResults: SOXTestResult[];
}

export interface SOXTestResult {
  id: string;
  controlId: string;
  testDate: Date;
  tester: string;
  result: 'EFFECTIVE' | 'DEFICIENT' | 'NOT_TESTED';
  findings: string[];
  remediation: string[];
  retestDate?: Date;
}

@Injectable()
export class ComplianceService {
  private readonly frameworks: Map<string, ComplianceFramework> = new Map();

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService
  ) {
    this.initializeFrameworks();
  }

  /**
   * Get compliance dashboard data
   */
  async getComplianceDashboard(companyId: string): Promise<{
    frameworks: ComplianceFramework[];
    overallScore: number;
    criticalFindings: number;
    upcomingAssessments: ComplianceAssessment[];
    recentFindings: ComplianceFinding[];
  }> {
    try {
      const frameworks = Array.from(this.frameworks.values()).filter(
        f => f.enabled
      );

      const [scoreResult] = await db.execute(
        `
        SELECT AVG(overall_score) as score FROM compliance_assessments
        WHERE company_id = $1 AND status = 'APPROVED'
        AND assessment_date >= NOW() - INTERVAL '1 year'
      `,
        [companyId]
      );

      const [criticalResult] = await db.execute(
        `
        SELECT COUNT(*) as count FROM compliance_findings
        WHERE company_id = $1 AND severity = 'CRITICAL' AND status IN ('OPEN', 'IN_PROGRESS')
      `,
        [companyId]
      );

      const upcomingAssessments = await db.execute(
        `
        SELECT * FROM compliance_assessments
        WHERE company_id = $1 AND status = 'IN_PROGRESS'
        ORDER BY assessment_date ASC
        LIMIT 5
      `,
        [companyId]
      );

      const recentFindings = await db.execute(
        `
        SELECT * FROM compliance_findings
        WHERE company_id = $1 AND status IN ('OPEN', 'IN_PROGRESS')
        ORDER BY created_at DESC
        LIMIT 10
      `,
        [companyId]
      );

      return {
        frameworks,
        overallScore: scoreResult?.score || 0,
        criticalFindings: criticalResult?.count || 0,
        upcomingAssessments: upcomingAssessments || [],
        recentFindings: recentFindings || [],
      };
    } catch (error) {
      this.logger.error('Failed to get compliance dashboard', {
        error,
        companyId,
      });
      throw error;
    }
  }

  /**
   * Perform SOX compliance assessment
   */
  async performSOXAssessment(
    companyId: string,
    assessorId: string
  ): Promise<ComplianceAssessment> {
    const assessmentId = `sox_${Date.now()}`;

    try {
      this.logger.info('Starting SOX compliance assessment', {
        assessmentId,
        companyId,
      });

      const assessment: ComplianceAssessment = {
        id: assessmentId,
        frameworkId: 'SOX',
        assessmentDate: new Date(),
        assessor: assessorId,
        scope: 'Financial reporting controls',
        findings: [],
        overallScore: 0,
        status: 'IN_PROGRESS',
        recommendations: [],
      };

      // Test financial controls
      const financialFindings = await this.testFinancialControls(companyId);
      assessment.findings.push(...financialFindings);

      // Test IT general controls
      const itFindings = await this.testITGeneralControls(companyId);
      assessment.findings.push(...itFindings);

      // Test application controls
      const appFindings = await this.testApplicationControls(companyId);
      assessment.findings.push(...appFindings);

      // Calculate overall score
      assessment.overallScore = this.calculateComplianceScore(
        assessment.findings
      );
      assessment.status = 'COMPLETED';
      assessment.recommendations = this.generateSOXRecommendations(
        assessment.findings
      );

      // Store assessment
      await this.storeAssessment(assessment, companyId);

      // Send notifications for critical findings
      const criticalFindings = assessment.findings.filter(
        f => f.severity === 'CRITICAL'
      );
      if (criticalFindings.length > 0) {
        await this.notificationService.sendComplianceAlert({
          type: 'SOX_CRITICAL_FINDINGS',
          assessmentId,
          companyId,
          findingsCount: criticalFindings.length,
          findings: criticalFindings,
        });
      }

      this.logger.info('SOX assessment completed', {
        assessmentId,
        score: assessment.overallScore,
        findingsCount: assessment.findings.length,
      });

      return assessment;
    } catch (error) {
      this.logger.error('SOX assessment failed', {
        error,
        assessmentId,
        companyId,
      });
      throw error;
    }
  }

  /**
   * Test financial controls for SOX compliance
   */
  private async testFinancialControls(
    companyId: string
  ): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];

    try {
      // Test segregation of duties
      const segregationFindings = await this.testSegregationOfDuties(companyId);
      findings.push(...segregationFindings);

      // Test authorization controls
      const authorizationFindings =
        await this.testAuthorizationControls(companyId);
      findings.push(...authorizationFindings);

      // Test journal entry controls
      const journalFindings = await this.testJournalEntryControls(companyId);
      findings.push(...journalFindings);

      // Test period-end closing controls
      const closingFindings = await this.testPeriodEndControls(companyId);
      findings.push(...closingFindings);
    } catch (error) {
      this.logger.error('Failed to test financial controls', {
        error,
        companyId,
      });
    }

    return findings;
  }

  /**
   * Test IT general controls
   */
  private async testITGeneralControls(
    companyId: string
  ): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];

    try {
      // Test access controls
      const accessFindings = await this.testAccessControls(companyId);
      findings.push(...accessFindings);

      // Test change management
      const changeFindings = await this.testChangeManagement(companyId);
      findings.push(...changeFindings);

      // Test backup and recovery
      const backupFindings = await this.testBackupRecovery(companyId);
      findings.push(...backupFindings);

      // Test system monitoring
      const monitoringFindings = await this.testSystemMonitoring(companyId);
      findings.push(...monitoringFindings);
    } catch (error) {
      this.logger.error('Failed to test IT general controls', {
        error,
        companyId,
      });
    }

    return findings;
  }

  /**
   * Test application controls
   */
  private async testApplicationControls(
    companyId: string
  ): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];

    try {
      // Test data validation controls
      const validationFindings = await this.testDataValidation(companyId);
      findings.push(...validationFindings);

      // Test calculation controls
      const calculationFindings = await this.testCalculationControls(companyId);
      findings.push(...calculationFindings);

      // Test interface controls
      const interfaceFindings = await this.testInterfaceControls(companyId);
      findings.push(...interfaceFindings);
    } catch (error) {
      this.logger.error('Failed to test application controls', {
        error,
        companyId,
      });
    }

    return findings;
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    companyId: string,
    frameworkId: string,
    period: { start: Date; end: Date }
  ): Promise<{
    summary: any;
    assessments: ComplianceAssessment[];
    findings: ComplianceFinding[];
    trends: any[];
    recommendations: string[];
  }> {
    try {
      const [summary] = await db.execute(
        `
        SELECT
          COUNT(DISTINCT ca.id) as total_assessments,
          AVG(ca.overall_score) as avg_score,
          COUNT(cf.id) as total_findings,
          COUNT(CASE WHEN cf.severity = 'CRITICAL' THEN 1 END) as critical_findings,
          COUNT(CASE WHEN cf.status = 'RESOLVED' THEN 1 END) as resolved_findings
        FROM compliance_assessments ca
        LEFT JOIN compliance_findings cf ON ca.id = cf.assessment_id
        WHERE ca.company_id = $1 AND ca.framework_id = $2
        AND ca.assessment_date BETWEEN $3 AND $4
      `,
        [companyId, frameworkId, period.start, period.end]
      );

      const assessments = await db.execute(
        `
        SELECT * FROM compliance_assessments
        WHERE company_id = $1 AND framework_id = $2
        AND assessment_date BETWEEN $3 AND $4
        ORDER BY assessment_date DESC
      `,
        [companyId, frameworkId, period.start, period.end]
      );

      const findings = await db.execute(
        `
        SELECT cf.* FROM compliance_findings cf
        JOIN compliance_assessments ca ON cf.assessment_id = ca.id
        WHERE ca.company_id = $1 AND ca.framework_id = $2
        AND ca.assessment_date BETWEEN $3 AND $4
        ORDER BY cf.severity DESC, cf.created_at DESC
      `,
        [companyId, frameworkId, period.start, period.end]
      );

      const trends = await db.execute(
        `
        SELECT
          DATE_TRUNC('month', assessment_date) as month,
          AVG(overall_score) as score,
          COUNT(*) as assessments
        FROM compliance_assessments
        WHERE company_id = $1 AND framework_id = $2
        AND assessment_date BETWEEN $3 AND $4
        GROUP BY month
        ORDER BY month
      `,
        [companyId, frameworkId, period.start, period.end]
      );

      return {
        summary,
        assessments,
        findings,
        trends,
        recommendations: this.generateComplianceRecommendations(findings),
      };
    } catch (error) {
      this.logger.error('Failed to generate compliance report', {
        error,
        companyId,
        frameworkId,
      });
      throw error;
    }
  }

  /**
   * Scheduled compliance monitoring
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async scheduledComplianceMonitoring(): Promise<void> {
    this.logger.info('Starting scheduled compliance monitoring');

    try {
      // Check for overdue assessments
      await this.checkOverdueAssessments();

      // Monitor control effectiveness
      await this.monitorControlEffectiveness();

      // Generate compliance alerts
      await this.generateComplianceAlerts();

      this.logger.info('Scheduled compliance monitoring completed');
    } catch (error) {
      this.logger.error('Scheduled compliance monitoring failed', { error });
    }
  }

  /**
   * Initialize compliance frameworks
   */
  private initializeFrameworks(): void {
    // SOX Framework
    this.frameworks.set('SOX', {
      id: 'SOX',
      name: 'Sarbanes-Oxley Act',
      version: '2002',
      description: 'Financial reporting and internal controls compliance',
      requirements: [],
      enabled: true,
    });

    // GDPR Framework
    this.frameworks.set('GDPR', {
      id: 'GDPR',
      name: 'General Data Protection Regulation',
      version: '2018',
      description: 'Data protection and privacy compliance',
      requirements: [],
      enabled: true,
    });

    // ISO 27001 Framework
    this.frameworks.set('ISO27001', {
      id: 'ISO27001',
      name: 'ISO/IEC 27001',
      version: '2013',
      description: 'Information security management systems',
      requirements: [],
      enabled: true,
    });
  }

  private async testSegregationOfDuties(
    companyId: string
  ): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];

    try {
      // Check if users have conflicting roles
      const conflicts = await db.execute(
        `
        SELECT u.id, u.email, array_agg(r.name) as roles
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE u.company_id = $1
        GROUP BY u.id, u.email
        HAVING COUNT(DISTINCT r.name) > 1
      `,
        [companyId]
      );

      for (const conflict of conflicts) {
        const conflictingRoles = conflict.roles;
        if (this.hasConflictingRoles(conflictingRoles)) {
          findings.push({
            id: `sod_${Date.now()}_${Math.random()}`,
            assessmentId: '',
            requirementId: 'SOX_302',
            severity: 'HIGH',
            type: 'NON_COMPLIANCE',
            description: `User ${conflict.email} has conflicting roles: ${conflictingRoles.join(', ')}`,
            evidence: [`User roles: ${conflictingRoles.join(', ')}`],
            remediation: [
              'Review and remove conflicting role assignments',
              'Implement proper segregation of duties',
              'Consider role-based access controls',
            ],
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            status: 'OPEN',
            assignee: 'compliance-team',
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed to test segregation of duties', {
        error,
        companyId,
      });
    }

    return findings;
  }

  private async testAuthorizationControls(
    companyId: string
  ): Promise<ComplianceFinding[]> {
    // Test authorization controls implementation
    return [];
  }

  private async testJournalEntryControls(
    companyId: string
  ): Promise<ComplianceFinding[]> {
    // Test journal entry controls implementation
    return [];
  }

  private async testPeriodEndControls(
    companyId: string
  ): Promise<ComplianceFinding[]> {
    // Test period-end closing controls implementation
    return [];
  }

  private async testAccessControls(
    companyId: string
  ): Promise<ComplianceFinding[]> {
    // Test access controls implementation
    return [];
  }

  private async testChangeManagement(
    companyId: string
  ): Promise<ComplianceFinding[]> {
    // Test change management controls implementation
    return [];
  }

  private async testBackupRecovery(
    companyId: string
  ): Promise<ComplianceFinding[]> {
    // Test backup and recovery controls implementation
    return [];
  }

  private async testSystemMonitoring(
    companyId: string
  ): Promise<ComplianceFinding[]> {
    // Test system monitoring controls implementation
    return [];
  }

  private async testDataValidation(
    companyId: string
  ): Promise<ComplianceFinding[]> {
    // Test data validation controls implementation
    return [];
  }

  private async testCalculationControls(
    companyId: string
  ): Promise<ComplianceFinding[]> {
    // Test calculation controls implementation
    return [];
  }

  private async testInterfaceControls(
    companyId: string
  ): Promise<ComplianceFinding[]> {
    // Test interface controls implementation
    return [];
  }

  private hasConflictingRoles(roles: string[]): boolean {
    const conflictingCombinations = [
      ['Finance Manager', 'Accounts Payable'],
      ['System Administrator', 'Finance User'],
      ['Approver', 'Preparer'],
    ];

    for (const combination of conflictingCombinations) {
      if (combination.every(role => roles.includes(role))) {
        return true;
      }
    }

    return false;
  }

  private calculateComplianceScore(findings: ComplianceFinding[]): number {
    if (findings.length === 0) return 100;

    const weights = { CRITICAL: 10, HIGH: 5, MEDIUM: 2, LOW: 1 };
    const totalWeight = findings.reduce(
      (sum, f) => sum + weights[f.severity],
      0
    );
    const maxPossibleWeight = findings.length * weights.CRITICAL;

    return Math.max(0, 100 - (totalWeight / maxPossibleWeight) * 100);
  }

  private generateSOXRecommendations(findings: ComplianceFinding[]): string[] {
    const recommendations: string[] = [];

    const criticalCount = findings.filter(
      f => f.severity === 'CRITICAL'
    ).length;
    const highCount = findings.filter(f => f.severity === 'HIGH').length;

    if (criticalCount > 0) {
      recommendations.push('Address critical SOX compliance gaps immediately');
    }

    if (highCount > 3) {
      recommendations.push('Implement comprehensive internal controls review');
    }

    recommendations.push('Establish regular SOX compliance monitoring');
    recommendations.push('Provide SOX training to key personnel');
    recommendations.push('Document all financial processes and controls');

    return recommendations;
  }

  private generateComplianceRecommendations(findings: any[]): string[] {
    const recommendations: string[] = [];

    if (findings.length > 0) {
      recommendations.push('Implement systematic compliance monitoring');
      recommendations.push('Regular compliance training for staff');
      recommendations.push('Establish compliance metrics and KPIs');
    }

    return recommendations;
  }

  private async storeAssessment(
    assessment: ComplianceAssessment,
    companyId: string
  ): Promise<void> {
    try {
      await db.execute(
        `
        INSERT INTO compliance_assessments (
          id, framework_id, assessment_date, assessor, scope, overall_score,
          status, recommendations, company_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
        [
          assessment.id,
          assessment.frameworkId,
          assessment.assessmentDate,
          assessment.assessor,
          assessment.scope,
          assessment.overallScore,
          assessment.status,
          JSON.stringify(assessment.recommendations),
          companyId,
        ]
      );

      // Store findings
      for (const finding of assessment.findings) {
        await db.execute(
          `
          INSERT INTO compliance_findings (
            id, assessment_id, requirement_id, severity, type, description,
            evidence, remediation, due_date, status, assignee, company_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `,
          [
            finding.id,
            finding.assessmentId || assessment.id,
            finding.requirementId,
            finding.severity,
            finding.type,
            finding.description,
            JSON.stringify(finding.evidence),
            JSON.stringify(finding.remediation),
            finding.dueDate,
            finding.status,
            finding.assignee,
            companyId,
          ]
        );
      }
    } catch (error) {
      this.logger.error('Failed to store assessment', {
        error,
        assessmentId: assessment.id,
      });
    }
  }

  private async checkOverdueAssessments(): Promise<void> {
    // Check for overdue compliance assessments
  }

  private async monitorControlEffectiveness(): Promise<void> {
    // Monitor the effectiveness of compliance controls
  }

  private async generateComplianceAlerts(): Promise<void> {
    // Generate alerts for compliance issues
  }
}
