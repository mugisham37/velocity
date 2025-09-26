# Security & Compliance Module

This module implements comprehensive security measures and compliance frameworks for the KIRO ERP system, addressing Task 17 requirements.

## Overview

The Security & Compliance module provides:

- **End-to-end encryption** for data at rest and in transit
- **Real-time threat detection** and security monitoring
- **Vulnerability scanning** with automated remediation
- **GDPR compliance** with data protection and privacy controls
- **SOX compliance** with financial controls and audit trails
- **Comprehensive audit logging** with tamper-proof storage

## Architecture

### Core Services

1. **EncryptionService** - Handles all encryption/decryption operations
2. **SecurityMonitoringService** - Monitors security events and threats
3. **ThreatDetectionService** - Real-time threat analysis and detection
4. **VulnerabilityService** - Automated vulnerability scanning
5. **ComplianceService** - SOX andompliance frameworks
6. **DataProtectionService** - GDPR and data privacy compliance

### Security Features

#### 1. Encryption & Data Protection

- **AES-256-GCM encryption** for sensitive data
- **Field-level encryption** for database columns
- **Key derivation** using PBKDF2 with salt
- **API key management** with secure hashing
- **Digital signatures** for data integrity

```typescript
// Example: Encrypt sensitive field
const encryptedValue = await encryptionService.encryptField(
  'sensitive-data',
  'fieldName'
);

// Example: Generate secure API key
const apiKey = encryptionService.generateApiKey('kiro');
```

#### 2. Threat Detection

- **SQL injection detection** with pattern matching
- **XSS attack prevention** with input validation
- **Command injection protection**
- **Path traversal detection**
- **Suspicious header analysis**
- **Rate limiting violations**

```typescript
// Automatic threat analysis on all requests
const threats = await threatDetection.analyzeRequest({
  method: 'POST',
  url: '/api/users',
  headers: request.headers,
  body: request.body,
  ip: clientIp,
  userAgent: userAgent,
});
```

#### 3. Security Monitoring

- **Real-time event logging** with severity classification
- **Failed login attempt tracking**
- **Suspicious activity detection**
- **IP blocking and reputation management**
- **Security metrics and dashboards**

```typescript
// Log security event
await securityMonitoring.logSecurityEvent({
  type: 'LOGIN_FAILURE',
  severity: 'HIGH',
  source: 'authentication',
  userId: user.id,
  ipAddress: clientIp,
  details: { attemptCount: 5 },
});
```

#### 4. Vulnerability Management

- **Dependency scanning** with CVE database integration
- **Static Application Security Testing (SAST)**
- **Infrastructure security scanning**
- **Configuration security assessment**
- **Automated remediation recommendations**

```typescript
// Perform vulnerability scan
const scanResult = await vulnerabilityService.scanDependencies();
console.log(`Found ${scanResult.summary.critical} critical vulnerabilities`);
```

### Compliance Features

#### 1. GDPR Compliance

- **Data subject rights** (access, erasure, portability)
- **Consent management** with granular controls
- **Data breach reporting** with automated notifications
- **Privacy Impact Assessments (PIA)**
- **Data retention policies** with automated cleanup

```typescript
// Process GDPR data access request
const request = await dataProtectionService.processAccessRequest(
  'user@example.com',
  companyId,
  requesterId
);

// Record user consent
await dataProtectionService.recordConsent(
  'user@example.com',
  {
    marketing: true,
    analytics: false,
    functional: true,
    necessary: true,
  },
  companyId
);
```

#### 2. SOX Compliance

- **Financial controls testing**
- **Segregation of duties validation**
- **Authorization controls assessment**
- **IT general controls evaluation**
- **Compliance scoring and reporting**

```typescript
// Perform SOX compliance assessment
const assessment = await complianceService.performSOXAssessment(
  companyId,
  assessorId
);
console.log(`SOX compliance score: ${assessment.overallScore}%`);
```

## Database Schema

### Security Tables

- `security_events` - Security event logging
- `threat_intelligence` - IP reputation and threat data
- `threat_detections` - Real-time threat detection results
- `vulnerabilities` - Security vulnerability tracking
- `vulnerability_scans` - Scan results and history

### Compliance Tables

- `compliance_assessments` - Compliance framework assessments
- `compliance_findings` - Assessment findings and remediation
- `data_subjects` - GDPR data subjects and consent
- `data_requests` - GDPR data subject requests
- `data_breaches` - Data breach incident tracking
- `privacy_impact_assessments` - PIA documentation

## API Endpoints

### REST API

```
GET    /security/dashboard           - Security overview dashboard
GET    /security/events              - Security events with filtering
POST   /security/scan/dependencies   - Trigger dependency scan
POST   /security/scan/sast           - Trigger SAST scan
GET    /security/vulnerabilities     - List vulnerabilities
PUT    /security/vulnerabilities/:id/status - Update vulnerability status
POST   /security/compliance/sox/assess - Perform SOX assessment
POST   /security/data-protection/consent - Record user consent
POST   /security/data-protection/request/access - Process access request
POST   /security/data-protection/request/erasure - Process erasure request
POST   /security/data-protection/breach - Report data breach
```

### GraphQL API

```graphql
query {
  securityDashboard
  securityEvents(type: "LOGIN_FAILURE", severity: "HIGH")
  vulnerabilities(status: "OPEN", severity: "CRITICAL")
  complianceReport(
    framework: "SOX"
    startDate: "2024-01-01"
    endDate: "2024-12-31"
  )
}

mutation {
  scanDependencies
  performSOXAssessment
  recordConsent(email: "user@example.com", marketing: true)
  processAccessRequest(email: "user@example.com")
  reportDataBreach(title: "Data Exposure", severity: "HIGH")
}
```

## Configuration

### Environment Variables

```bash
# Encryption keys (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_MASTER_KEY="64_character_hex_key"
FIELD_ENCRYPTION_KEY="64_character_hex_key"

# Security monitoring
SECURITY_MONITORING_ENABLED="true"
THREAT_DETECTION_ENABLED="true"
VULNERABILITY_SCANNING_ENABLED="true"

# Compliance settings
SOX_COMPLIANCE_ENABLED="true"
GDPR_COMPLIANCE_ENABLED="true"
DATA_RETENTION_ENABLED="true"
```

### Key Generation

```bash
# Generate encryption keys
node -e "console.log('ENCRYPTION_MASTER_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('FIELD_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

## Security Best Practices

### 1. Key Management

- Store encryption keys securely (use AWS KMS, Azure Key Vault, etc.)
- Rotate keys regularly (quarterly recommended)
- Use different keys for different environments
- Never commit keys to version control

### 2. Access Control

- Implement principle of least privilege
- Use role-based access control (RBAC)
- Enable multi-factor authentication (MFA)
- Regular access reviews and cleanup

### 3. Monitoring & Alerting

- Monitor all security events in real-time
- Set up alerts for critical security incidents
- Regular security metrics review
- Incident response procedures

### 4. Compliance

- Regular compliance assessments
- Document all security controls
- Maintain audit trails
- Staff security training

## Scheduled Tasks

The module includes several scheduled tasks:

- **Security Scan** (hourly) - Anomaly detection and threat intelligence updates
- **Vulnerability Scan** (daily at 2 AM) - Automated vulnerability scanning
- **Compliance Monitoring** (daily at 6 AM) - Compliance control effectiveness
- **Data Retention Cleanup** (daily at 3 AM) - Automated data cleanup

## Integration Points

### Authentication Module

- Enhanced with MFA and session security
- Failed login monitoring and IP blocking
- OAuth2 and SAML security validation

### Audit Module

- Comprehensive audit logging for all operations
- Tamper-proof audit trail storage
- Compliance-ready audit reports

### Notification Module

- Security incident alerts
- Compliance violation notifications
- Data breach notifications

## Testing

### Unit Tests

```bash
npm test security
```

### Security Tests

```bash
# Run SAST scan
npm run security:sast

# Run dependency scan
npm run security:deps

# Run infrastructure scan
npm run security:infra
```

## Deployment Considerations

### Production Setup

1. **Encryption Keys**: Use secure key management service
2. **Database**: Enable encryption at rest and in transit
3. **Network**: Implement proper firewall rules and VPN
4. **Monitoring**: Set up security monitoring and alerting
5. **Backup**: Secure backup with encryption
6. **Compliance**: Regular compliance assessments

### High Availability

- Multiple security service instances
- Distributed threat intelligence
- Redundant audit logging
- Failover procedures

## Troubleshooting

### Common Issues

1. **Encryption Errors**: Check key configuration and format
2. **High False Positives**: Tune threat detection patterns
3. **Performance Impact**: Optimize security middleware
4. **Compliance Gaps**: Review control implementations

### Monitoring

- Security event volume and patterns
- Threat detection accuracy
- Vulnerability scan coverage
- Compliance score trends

## Future Enhancements

- Machine learning-based anomaly detection
- Advanced persistent threat (APT) detection
- Zero-trust architecture implementation
- Automated incident response
- Integration with external SIEM systems

## Support

For security-related issues or questions:

1. Check the logs in `security_events` table
2. Review security metrics dashboard
3. Consult compliance assessment reports
4. Contact security team for critical issues

---

**Note**: This module handles sensitive security data. Ensure proper access controls and follow security best practices when working with this code.
