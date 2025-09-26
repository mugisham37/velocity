import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ComplianceService } from './services/compliance.service';
import { DataProtectionService } from './services/data-protection.service';
import { SecurityMonitoringService } from './services/security-monitoring.service';
import { ThreatDetectionService } from './services/threat-detection.service';
import { VulnerabilityService } from './services/vulnerability.service';

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SecurityResolver {
  constructor(
    private readonly securityMonitoring: SecurityMonitoringService,
    private readonly threatDetection: ThreatDetectionService,
    privatdonly vulnerabilityService: VulnerabilityService,
    private readonly complianceService: ComplianceService,
    private readonly dataProtectionService: DataProtectionService
  ) {}

  @Query(() => String)
  @Roles('SECURITY_ADMIN', 'SYSTEM_ADMIN')
  async securityDashboard(@Context() context: any) {
    const user = context.req.user;

    const [securityMetrics, threatStats, vulnerabilityStats, complianceDashboard, dataProtectionDashboard] = await Promise.all([
      this.securityMonitoring.getSecurityMetrics(user.companyId),
      this.threatDetection.getThreatStatistics(user.companyId),
      this.vulnerabilityService.getVulnerabilities({ page: 1, limit: 10 }),
      this.complianceService.getComplianceDashboard(user.companyId),
      this.dataProtectionService.getDataProtectionDashboard(user.companyId),
    ]);

    return JSON.stringify({
      security: securityMetrics,
      threats: threatStats,
      vulnerabilities: vulnerabilityStats,
      compliance: complianceDashboard,
      dataProtection: dataProtectionDashboard,
    });
  }

  @Query(() => String)
  @Roles('SECURITY_ADMIN', 'SYSTEM_ADMIN')
  async securityEvents(
    @Args('type', { nullable: true }) type?: string,
    @Args('severity', { nullable: true }) severity?: string,
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string,
    @Args('page', { nullable: true }) page?: number,
    @Args('limit', { nullable: true }) limit?: number,
    @Context() context?: any
  ) {
    const user = context.req.user;

    const events = await this.securityMonitoring.getSecurityEvents(user.companyId, {
      type,
      severity,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    });

    return JSON.stringify(events);
  }

  @Query(() => String)
  @Roles('SECURITY_ADMIN', 'SYSTEM_ADMIN')
  async vulnerabilities(
    @Args('severity', { nullable: true }) severity?: string,
    @Args('status', { nullable: true }) status?: string,
    @Args('category', { nullable: true }) category?: string,
    @Args('component', { nullable: true }) component?: string,
    @Args('page', { nullable: true }) page?: number,
    @Args('limit', { nullable: true }) limit?: number
  ) {
    const vulnerabilities = await this.vulnerabilityService.getVulnerabilities({
      severity,
      status,
      category,
      component,
      page,
      limit,
    });

    return JSON.stringify(vulnerabilities);
  }

  @Query(() => String)
  @Roles('SECURITY_ADMIN', 'SYSTEM_ADMIN')
  async vulnerabilityReport(@Context() context: any) {
    const user = context.req.user;
    const report = await this.vulnerabilityService.generateVulnerabilityReport(user.companyId);
    return JSON.stringify(report);
  }

  @Query(() => String)
  @Roles('COMPLIANCE_ADMIN', 'SYSTEM_ADMIN')
  async complianceReport(
    @Args('framework') framework: string,
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
    @Context() context: any
  ) {
    const user = context.req.user;
    const report = await this.complianceService.generateComplianceReport(
      user.companyId,
      framework,
      {
        start: new Date(startDate),
        end: new Date(endDate),
      }
    );

    return JSON.stringify(report);
  }

  @Mutation(() => String)
  @Roles('SECURITY_ADMIN', 'SYSTEM_ADMIN')
  async scanDependencies() {
    const result = await this.vulnerabilityService.scanDependencies();
    return JSON.stringify(result);
  }

  @Mutation(() => String)
  @Roles('SECURITY_ADMIN', 'SYSTEM_ADMIN')
  async performSastScan() {
    const result = await this.vulnerabilityService.performSastScan();
    return JSON.stringify(result);
  }

  @Mutation(() => String)
  @Roles('SECURITY_ADMIN', 'SYSTEM_ADMIN')
  async scanInfrastructure() {
    const result = await this.vulnerabilityService.scanInfrastructure();
    return JSON.stringify(result);
  }

  @Mutation(() => Boolean)
  @Roles('SECURITY_ADMIN', 'SYSTEM_ADMIN')
  async updateVulnerabilityStatus(
    @Args('id') id: string,
    @Args('status') status: string,
    @Args('notes', { nullable: true }) notes?: string,
    @Context() context?: any
  ) {
    const user = context.req.user;
    await this.vulnerabilityService.updateVulnerabilityStatus(
      id,
      status as any,
      user.id,
      notes
    );
    return true;
  }

  @Mutation(() => String)
  @Roles('COMPLIANCE_ADMIN', 'SYSTEM_ADMIN')
  async performSOXAssessment(@Context() context: any) {
    const user = context.req.user;
    const result = await this.complianceService.performSOXAssessment(user.companyId, user.id);
    return JSON.stringify(result);
  }

  @Mutation(() => Boolean)
  async recordConsent(
    @Args('email') email: string,
    @Args('marketing') marketing: boolean,
    @Args('analytics') analytics: boolean,
    @Args('functional') functional: boolean,
    @Args('necessary') necessary: boolean,
    @Context() context: any
  ) {
    const user = context.req.user;
    await this.dataProtectionService.recordConsent(
      email,
      {
        marketing,
        analytics,
        functional,
        necessary,
        lastUpdated: new Date(),
      },
      user.companyId
    );
    return true;
  }

  @Mutation(() => String)
  async processAccessRequest(
    @Args('email') email: string,
    @Context() context: any
  ) {
    const user = context.req.user;
    const result = await this.dataProtectionService.processAccessRequest(
      email,
      user.companyId,
      user.id
    );
    return JSON.stringify(result);
  }

  @Mutation(() => String)
  async processErasureRequest(
    @Args('email') email: string,
    @Args('reason', { nullable: true }) reason?: string,
    @Context() context?: any
  ) {
    const user = context.req.user;
    const result = await this.dataProtectionService.processErasureRequest(
      email,
      user.companyId,
      user.id,
      reason
    );
    return JSON.stringify(result);
  }

  @Mutation(() => String)
  async processPortabilityRequest(
    @Args('email') email: string,
    @Args('format', { nullable: true }) format?: string,
    @Context() context?: any
  ) {
    const user = context.req.user;
    const result = await this.dataProtectionService.processPortabilityRequest(
      email,
      user.companyId,
      user.id,
      (format as any) || 'JSON'
    );
    return JSON.stringify(result);
  }

  @Mutation(() => String)
  @Roles('SECURITY_ADMIN', 'COMPLIANCE_ADMIN', 'SYSTEM_ADMIN')
  async reportDataBreach(
    @Args('title') title: string,
    @Args('description') description: string,
    @Args('severity') severity: string,
    @Args('category') category: string,
    @Args('affectedRecords') affectedRecords: number,
    @Args('dataCategories', { type: () => [String] }) dataCategories: string[],
    @Args('cause') cause: string,
    @Args('notificationRequired') notificationRequired: boolean,
    @Args('authorityNotified') authorityNotified: boolean,
    @Args('subjectsNotified') subjectsNotified: boolean,
    @Args('remediation', { type: () => [String] }) remediation: string[],
    @Context() context: any
  ) {
    const user = context.req.user;
    const result = await this.dataProtectionService.reportDataBreach({
      title,
      description,
      severity: severity as any,
      category: category as any,
      affectedRecords,
      dataCategories,
      cause,
      notificationRequired,
      authorityNotified,
      subjectsNotified,
      remediation,
      companyId: user.companyId,
    });
    return JSON.stringify(result);
  }

  @Mutation(() => String)
  @Roles('COMPLIANCE_ADMIN', 'SYSTEM_ADMIN')
  async conductPIA(
    @Args('name') name: string,
    @Args('description') description: string,
    @Args('processingActivity') processingActivity: string,
    @Args('riskLevel') riskLevel: string,
    @Args('dataTypes', { type: () => [String] }) dataTypes: string[],
    @Args('risks') risks: string,
    @Args('mitigations') mitigations: string,
    @Args('status') status: string,
    @Context() context: any
  ) {
    const user = context.req.user;
    const result = await this.dataProtectionService.conductPIA({
      name,
      description,
      processingActivity,
      riskLevel: riskLevel as any,
      dataTypes,
      risks: JSON.parse(risks),
      mitigations: JSON.parse(mitigations),
      status: status as any,
      assessor: user.id,
      companyId: user.companyId,
    });
    return JSON.stringify(result);
  }

  @Mutation(() => Boolean)
  @Roles('SECURITY_ADMIN', 'SYSTEM_ADMIN')
  async unblockIp(
    @Args('ipAddress') ipAddress: string,
    @Context() context: any
  ) {
    const user = context.req.user;
    await this.securityMonitoring.unblockIp(ipAddress, user.id);
    return true;
  }
}
