import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { SecurityController } from './security.controller';
import { SecurityResolver } from './security.resolver';
import { ComplianceService } from './services/compliance.service';
import { DataProtectionService } from './services/data-protection.service';
import { EncryptionService } from './services/encryption.service';
import { SecurityMonitoringService } from './services/security-monitoring.service';
import { ThreatDetectionService } from './services/threat-detection.service';
import { VulnerabilityService } from './services/vulnerability.service';

@Module({
  imports: [CommonModule],
  controllers: [SecurityController],
  providers: [
    SecurityResolver,
    EncryptionService,
    SecurityMonitoringService,
    ThreatDetectionService,
    VulnerabilityService,
    ComplianceService,
    DataProtectionService,
  ],
  exports: [
    EncryptionService,
    SecurityMonitoringService,
    ThreatDetectionService,
    ComplianceService,
    DataProtectionService,
  ],
})
export class SecurityModule {}
