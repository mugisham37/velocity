import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ComplianceService } from './services/compliance.service';
import { DataProtectionService } from './services/data-protection.service';
import { EncryptionService } from './services/encryption.service';
import { SecurityMonitoringService } from './services/security-monitoring.service';
import { ThreatDetectionService } from './services/threat-detection.service';
import { VulnerabilityService } from './services/vulnerability.service';

@Controller('security')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SecurityController {
  constructor(
    private readonly securityMonitoring: SecurityMonitoringService,
    private readonly thrion: ThreatDetectionService,
    private readonly vulnerabilityService: VulnerabilityService,
    private readonly complianceService: ComplianceService,
    private readonly dataProtectionService: DataProtectionService,
    private readonly encryptionService: EncryptionService
  ) {}

  @Get('dashboard')
  @Roles('SECURITY_ADMIN', 'SYSTEM_ADMIN')
  async getSecurityDashboard(@CurrentUser() user: any) {
    const [
      securityMetrics,
      threatStats,
      vulnerabilityStats,
      complianceDashboard,
      dataProtectionDashboard,
    ] = await Promise.all([
      this.securityMonitoring.getSecurityMetrics(user.companyId),
      this.threatDetection.getThreatStatistics(user.companyId),
      this.vulnerabilityService.getVulnerabilities({ page: 1, limit: 10 }),
      this.complianceService.getComplianceDashboard(user.companyId),
      this.dataProtectionService.getDataProtectionDashboard(user.companyId),
    ]);

    return {
      security: securityMetrics,
      threats: threatStats,
      vulnerabilities: vulnerabilityStats,
      compliance: complianceDashboard,
      dataProtection: dataProtectionDashboard,
    };
  }

  @Get('events')
  @Roles('SECURITY_ADMIN', 'SYSTEM_ADMIN')
  async getSecurityEvents(
    @CurrentUser() user: any,
    @Query('type') type?: string,
    @Query('severity') severity?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.securityMonitoring.getSecurityEvents(user.companyId, {
      type,
      severity,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    });
  }

  @Post('scan/dependencies')
  @Roles('SECURITY_ADMIN', 'SYSTEM_ADMIN')
  async scanDependencies() {
    return this.vulnerabilityService.scanDependencies();
  }

  @Post('scan/sast')
  @Roles('SECURITY_ADMIN', 'SYSTEM_ADMIN')
  async performSastScan() {
    return this.vulnerabilityService.performSastScan();
  }

  @Post('scan/infrastructure')
  @Roles('SECURITY_ADMIN', 'SYSTEM_ADMIN')
  async scanInfrastructure() {
    return this.vulnerabilityService.scanInfrastructure();
  }

  @Get('vulnerabilities')
  @Roles('SECURITY_ADMIN', 'SYSTEM_ADMIN')
  async getVulnerabilities(
    @Query('severity') severity?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('component') component?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.vulnerabilityService.getVulnerabilities({
      severity,
      status,
      category,
      component,
      page,
      limit,
    });
  }

  @Put('vulnerabilities/:id/status')
  @Roles('SECURITY_ADMIN', 'SYSTEM_ADMIN')
  async updateVulnerabilityStatus(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
    @CurrentUser() user: any
  ) {
    await this.vulnerabilityService.updateVulnerabilityStatus(
      id,
      body.status as any,
      user.id,
      body.notes
    );
    return { success: true };
  }

  @Get('vulnerabilities/report')
  @Roles('SECURITY_ADMIN', 'SYSTEM_ADMIN')
  async generateVulnerabilityReport(@CurrentUser() user: any) {
    return this.vulnerabilityService.generateVulnerabilityReport(
      user.companyId
    );
  }

  @Post('compliance/sox/assess')
  @Roles('COMPLIANCE_ADMIN', 'SYSTEM_ADMIN')
  async performSOXAssessment(@CurrentUser() user: any) {
    return this.complianceService.performSOXAssessment(user.companyId, user.id);
  }

  @Get('compliance/report')
  @Roles('COMPLIANCE_ADMIN', 'SYSTEM_ADMIN')
  async generateComplianceReport(
    @CurrentUser() user: any,
    @Query('framework') framework: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.complianceService.generateComplianceReport(
      user.companyId,
      framework,
      {
        start: new Date(startDate),
        end: new Date(endDate),
      }
    );
  }

  @Post('data-protection/consent')
  async recordConsent(
    @Body()
    body: {
      email: string;
      consent: {
        marketing: boolean;
        analytics: boolean;
        functional: boolean;
        necessary: boolean;
      };
    },
    @CurrentUser() user: any
  ) {
    await this.dataProtectionService.recordConsent(
      body.email,
      {
        ...body.consent,
        lastUpdated: new Date(),
      },
      user.companyId
    );
    return { success: true };
  }

  @Post('data-protection/request/access')
  async processAccessRequest(
    @Body() body: { email: string },
    @CurrentUser() user: any
  ) {
    return this.dataProtectionService.processAccessRequest(
      body.email,
      user.companyId,
      user.id
    );
  }

  @Post('data-protection/request/erasure')
  async processErasureRequest(
    @Body() body: { email: string; reason?: string },
    @CurrentUser() user: any
  ) {
    return this.dataProtectionService.processErasureRequest(
      body.email,
      user.companyId,
      user.id,
      body.reason
    );
  }

  @Post('data-protection/request/portability')
  async processPortabilityRequest(
    @Body() body: { email: string; format?: 'JSON' | 'CSV' | 'XML' },
    @CurrentUser() user: any
  ) {
    return this.dataProtectionService.processPortabilityRequest(
      body.email,
      user.companyId,
      user.id,
      body.format
    );
  }

  @Post('data-protection/breach')
  @Roles('SECURITY_ADMIN', 'COMPLIANCE_ADMIN', 'SYSTEM_ADMIN')
  async reportDataBreach(
    @Body()
    body: {
      title: string;
      description: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      category: 'CONFIDENTIALITY' | 'INTEGRITY' | 'AVAILABILITY';
      affectedRecords: number;
      dataCategories: string[];
      cause: string;
      notificationRequired: boolean;
      authorityNotified: boolean;
      subjectsNotified: boolean;
      remediation: string[];
    },
    @CurrentUser() user: any
  ) {
    return this.dataProtectionService.reportDataBreach({
      ...body,
      companyId: user.companyId,
    });
  }

  @Post('data-protection/pia')
  @Roles('COMPLIANCE_ADMIN', 'SYSTEM_ADMIN')
  async conductPIA(
    @Body()
    body: {
      name: string;
      description: string;
      processingActivity: string;
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
      dataTypes: string[];
      risks: any[];
      mitigations: any[];
      status: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
    },
    @CurrentUser() user: any
  ) {
    return this.dataProtectionService.conductPIA({
      ...body,
      assessor: user.id,
      companyId: user.companyId,
    });
  }

  @Post('ip/unblock')
  @Roles('SECURITY_ADMIN', 'SYSTEM_ADMIN')
  async unblockIp(
    @Body() body: { ipAddress: string },
    @CurrentUser() user: any
  ) {
    await this.securityMonitoring.unblockIp(body.ipAddress, user.id);
    return { success: true };
  }

  @Get('configurations')
  @Roles('SECURITY_ADMIN', 'SYSTEM_ADMIN')
  async getSecurityConfigurations() {
    return this.vulnerabilityService.getSecurityConfigurations();
  }

  @Post('keys/rotate')
  @Roles('SYSTEM_ADMIN')
  async rotateEncryptionKeys() {
    return this.encryptionService.rotateKeys();
  }

  @Post('keys/generate')
  @Roles('SYSTEM_ADMIN')
  async generateApiKey(@Body() body: { prefix?: string }) {
    const apiKey = this.encryptionService.generateApiKey(body.prefix);
    const hashedKey = await this.encryptionService.hashApiKey(apiKey);

    return {
      apiKey, // Return this once to the user
      hashedKey, // Store this in the database
    };
  }
}
