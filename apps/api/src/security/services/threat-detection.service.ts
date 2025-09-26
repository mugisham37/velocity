import { db } from '@kiro/database';
import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { NotificationService } from '../../common/services/notification.service';
import { SecurityMonitoringService } from './security-monitoring.service';

export interface ThreatSignature {
  id: string;
  name: string;
  pattern: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'SQL_INJECTION' | 'XSS' | 'BRUTE_FORCE' | 'DATA_EXFILTRATION' | 'MALWARE' | 'PHISHING';
  enabled: boolean;
}

export interface ThreatDetectionResult {
  threatId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  details: Record<string, any>;
  recommendations: string[];
}

export interface NetworkAnomaly {
  type: 'UNUSUAL_TRAFFIC' | 'PORT_SCAN' | 'DDoS' | 'DATA_LEAK';
  source: string;
  destination?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
  details: Record<string, any>;
}

@Injectable()
export class ThreatDetectionService {
  private readonly threatSignatures: Map<string, ThreatSignature> = new Map();
  private readonly activeThreats: Map<string, ThreatDetectionResult> = new Map();

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly securityMonitoring: SecurityMonitoringService,
    private readonly notificationService: NotificationService
  ) {
    this.initializeThreatSignatures();
  }

  /**
   * Analyze request for threats
   */
  async analyzeRequest(
    request: {
      method: string;
      url: string;
      headers: Record<string, string>;
      body?: any;
      query?: Record<string, string>;
      ip: string;
      userAgent: string;
      userId?: string;
      companyId: string;
    }
  ): Promise<ThreatDetectionResult[]> {
    const threats: ThreatDetectionResult[] = [];

    try {
      // SQL Injection Detection
      const sqlInjectionThreat = this.detectSqlInjection(request);
      if (sqlInjectionThreat) threats.push(sqlInjectionThreat);

      // XSS Detection
      const xssThreat = this.detectXss(request);
      if (xssThreat) threats.push(xssThreat);

      // Command Injection Detection
      const commandInjectionThreat = this.detectCommandInjection(request);
      if (commandInjectionThreat) threats.push(commandInjectionThreat);

      // Path Traversal Detection
hTraversalThreat = this.detectPathTraversal(request);
      if (pathTraversalThreat) threats.push(pathTraversalThreat);

      // Suspicious Headers Detection
      const suspiciousHeadersThreat = this.detectSuspiciousHeaders(request);
      if (suspiciousHeadersThreat) threats.push(suspiciousHeadersThreat);

      // Rate Limiting Violations
      const rateLimitThreat = await this.detectRateLimitViolation(request);
      if (rateLimitThreat) threats.push(rateLimitThreat);

      // Log detected threats
      for (const threat of threats) {
        await this.logThreat(threat, request);
      }

      return threats;
    } catch (error) {
      this.logger.error('Failed to analyze request for threats', { error, request: { url: request.url, ip: request.ip } });
      return [];
    }
  }

  /**
   * Detect SQL injection attempts
   */
  private detectSqlInjection(request: any): ThreatDetectionResult | null {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\'|\"|;|--|\*|\||\^|&)/,
      /(\bOR\b|\bAND\b).*(\=|\<|\>)/i,
      /(UNION.*SELECT|SELECT.*FROM|INSERT.*INTO)/i,
      /(DROP.*TABLE|DELETE.*FROM|UPDATE.*SET)/i,
    ];

    const testStrings = [
      request.url,
      JSON.stringify(request.query || {}),
      JSON.stringify(request.body || {}),
    ];

    for (const testString of testStrings) {
      for (const pattern of sqlPatterns) {
        if (pattern.test(testString)) {
          return {
            threatId: 'SQL_INJECTION',
            severity: 'HIGH',
            confidence: 0.8,
            details: {
              pattern: pattern.source,
              matchedString: testString,
              location: this.getMatchLocation(testString, request),
            },
            recommendations: [
              'Use parameterized queries',
              'Implement input validation',
              'Apply principle of least privilege to database access',
            ],
          };
        }
      }
    }

    return null;
  }

  /**
   * Detect XSS attempts
   */
  private detectXss(request: any): ThreatDetectionResult | null {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>/gi,
      /expression\s*\(/gi,
    ];

    const testStrings = [
      request.url,
      JSON.stringify(request.query || {}),
      JSON.stringify(request.body || {}),
    ];

    for (const testString of testStrings) {
      for (const pattern of xssPatterns) {
        if (pattern.test(testString)) {
          return {
            threatId: 'XSS',
            severity: 'MEDIUM',
            confidence: 0.7,
            details: {
              pattern: pattern.source,
              matchedString: testString,
              location: this.getMatchLocation(testString, request),
            },
            recommendations: [
              'Implement output encoding',
              'Use Content Security Policy (CSP)',
              'Validate and sanitize all user inputs',
            ],
          };
        }
      }
    }

    return null;
  }

  /**
   * Detect command injection attempts
   */
  private detectCommandInjection(request: any): ThreatDetectionResult | null {
    const commandPatterns = [
      /(\||&|;|`|\$\(|\$\{)/,
      /(wget|curl|nc|netcat|telnet|ssh)/i,
      /(rm|del|format|fdisk)/i,
      /(\/bin\/|\/usr\/bin\/|cmd\.exe|powershell)/i,
    ];

    const testStrings = [
      request.url,
      JSON.stringify(request.query || {}),
      JSON.stringify(request.body || {}),
    ];

    for (const testString of testStrings) {
      for (const pattern of commandPatterns) {
        if (pattern.test(testString)) {
          return {
            threatId: 'COMMAND_INJECTION',
            severity: 'CRITICAL',
            confidence: 0.9,
            details: {
              pattern: pattern.source,
              matchedString: testString,
              location: this.getMatchLocation(testString, request),
            },
            recommendations: [
              'Never execute user input as system commands',
              'Use allowlists for permitted values',
              'Implement strict input validation',
            ],
          };
        }
      }
    }

    return null;
  }

  /**
   * Detect path traversal attempts
   */
  private detectPathTraversal(request: any): ThreatDetectionResult | null {
    const pathTraversalPatterns = [
      /\.\.\//g,
      /\.\.\\\/g,
      /%2e%2e%2f/gi,
      /%2e%2e%5c/gi,
      /\.\.%2f/gi,
      /\.\.%5c/gi,
    ];

    const testString = request.url;

    for (const pattern of pathTraversalPatterns) {
      if (pattern.test(testString)) {
        return {
          threatId: 'PATH_TRAVERSAL',
          severity: 'HIGH',
          confidence: 0.8,
          details: {
            pattern: pattern.source,
            matchedString: testString,
            url: request.url,
          },
          recommendations: [
            'Validate file paths against allowlist',
            'Use absolute paths instead of relative paths',
            'Implement proper access controls',
          ],
        };
      }
    }

    return null;
  }

  /**
   * Detect suspicious headers
   */
  private detectSuspiciousHeaders(request: any): ThreatDetectionResult | null {
    const suspiciousHeaders = {
      'x-forwarded-for': /(\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b.*,.*){5,}/, // Multiple IPs (potential proxy chain)
      'user-agent': /(sqlmap|nikto|nmap|masscan|zap|burp|w3af)/i, // Security tools
      'referer': /(javascript:|data:|vbscript:)/i, // Suspicious schemes
    };

    for (const [headerName, pattern] of Object.entries(suspiciousHeaders)) {
      const headerValue = request.headers[headerName];
      if (headerValue && pattern.test(headerValue)) {
        return {
          threatId: 'SUSPICIOUS_HEADERS',
          severity: 'MEDIUM',
          confidence: 0.6,
          details: {
            header: headerName,
            value: headerValue,
            pattern: pattern.source,
          },
          recommendations: [
            'Monitor suspicious user agents',
            'Implement header validation',
            'Consider blocking known attack tools',
          ],
        };
      }
    }

    return null;
  }

  /**
   * Detect rate limiting violations
   */
  private async detectRateLimitViolation(request: any): Promise<ThreatDetectionResult | null> {
    const key = `${request.ip}:${request.userId || 'anonymous'}`;
    const windowMs = 60000; // 1 minute
    const maxRequests = 100;

    // This would integrate with Redis or in-memory rate limiting
    // For now, return null (implement with actual rate limiting logic)
    return null;
  }

  /**
   * Analyze network traffic for anomalies
   */
  async analyzeNetworkTraffic(
    traffic: {
      sourceIp: string;
      destinationIp?: string;
      port: number;
      protocol: string;
      bytes: number;
      packets: number;
      timestamp: Date;
    }
  ): Promise<NetworkAnomaly[]> {
    const anomalies: NetworkAnomaly[] = [];

    // Port scanning detection
    const portScanAnomaly = this.detectPortScan(traffic);
    if (portScanAnomaly) anomalies.push(portScanAnomaly);

    // Unusual traffic volume
    const trafficAnomaly = await this.detectUnusualTraffic(traffic);
    if (trafficAnomaly) anomalies.push(trafficAnomaly);

    // DDoS detection
    const ddosAnomaly = await this.detectDDoS(traffic);
    if (ddosAnomaly) anomalies.push(ddosAnomaly);

    return anomalies;
  }

  /**
   * Scheduled threat intelligence update
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async updateThreatIntelligence(): Promise<void> {
    this.logger.info('Updating threat intelligence');

    try {
      // Update threat signatures from external sources
      await this.fetchThreatSignatures();

      // Update IP reputation database
      await this.updateIpReputation();

      // Clean up old threat data
      await this.cleanupOldThreats();

      this.logger.info('Threat intelligence updated successfully');
    } catch (error) {
      this.logger.error('Failed to update threat intelligence', { error });
    }
  }

  /**
   * Get threat statistics
   */
  async getThreatStatistics(companyId: string, timeRange: number = 24): Promise<{
    totalThreats: number;
    threatsByType: Record<string, number>;
    threatsBySeverity: Record<string, number>;
    topSourceIps: Array<{ ip: string; count: number }>;
  }> {
    const since = new Date(Date.now() - timeRange * 60 * 60 * 1000);

    try {
      const [totalResult] = await db.execute(`
        SELECT COUNT(*) as count FROM threat_detections
        WHERE company_id = $1 AND created_at >= $2
      `, [companyId, since]);

      const threatsByType = await db.execute(`
        SELECT threat_type, COUNT(*) as count FROM threat_detections
        WHERE company_id = $1 AND created_at >= $2
        GROUP BY threat_type
      `, [companyId, since]);

      const threatsBySeverity = await db.execute(`
        SELECT severity, COUNT(*) as count FROM threat_detections
        WHERE company_id = $1 AND created_at >= $2
        GROUP BY severity
      `, [companyId, since]);

      const topSourceIps = await db.execute(`
        SELECT source_ip, COUNT(*) as count FROM threat_detections
        WHERE company_id = $1 AND created_at >= $2
        GROUP BY source_ip
        ORDER BY count DESC
        LIMIT 10
      `, [companyId, since]);

      return {
        totalThreats: totalResult.count || 0,
        threatsByType: this.arrayToObject(threatsByType, 'threat_type', 'count'),
        threatsBySeverity: this.arrayToObject(threatsBySeverity, 'severity', 'count'),
        topSourceIps: topSourceIps || [],
      };
    } catch (error) {
      this.logger.error('Failed to get threat statistics', { error, companyId });
      return {
        totalThreats: 0,
        threatsByType: {},
        threatsBySeverity: {},
        topSourceIps: [],
      };
    }
  }

  /**
   * Initialize threat signatures
   */
  private initializeThreatSignatures(): void {
    const signatures: ThreatSignature[] = [
      {
        id: 'SQL_INJECTION_BASIC',
        name: 'Basic SQL Injection',
        pattern: '(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)',
        severity: 'HIGH',
        category: 'SQL_INJECTION',
        enabled: true,
      },
      {
        id: 'XSS_SCRIPT_TAG',
        name: 'XSS Script Tag',
        pattern: '<script[^>]*>.*?</script>',
        severity: 'MEDIUM',
        category: 'XSS',
        enabled: true,
      },
      {
        id: 'BRUTE_FORCE_LOGIN',
        name: 'Brute Force Login',
        pattern: 'multiple_failed_logins',
        severity: 'HIGH',
        category: 'BRUTE_FORCE',
        enabled: true,
      },
    ];

    for (const signature of signatures) {
      this.threatSignatures.set(signature.id, signature);
    }
  }

  private async logThreat(threat: ThreatDetectionResult, request: any): Promise<void> {
    try {
      await db.execute(`
        INSERT INTO threat_detections (
          threat_id, severity, confidence, source_ip, user_id, company_id,
          details, recommendations, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        threat.threatId,
        threat.severity,
        threat.confidence,
        request.ip,
        request.userId,
        request.companyId,
        JSON.stringify(threat.details),
        JSON.stringify(threat.recommendations),
        new Date()
      ]);

      // Send alert for high severity threats
      if (threat.severity === 'HIGH' || threat.severity === 'CRITICAL') {
        await this.notificationService.sendThreatAlert({
          threatId: threat.threatId,
          severity: threat.severity,
          sourceIp: request.ip,
          companyId: request.companyId,
          details: threat.details,
        });
      }
    } catch (error) {
      this.logger.error('Failed to log threat', { error, threat });
    }
  }

  private getMatchLocation(matchedString: string, request: any): string {
    if (request.url.includes(matchedString)) return 'url';
    if (JSON.stringify(request.query || {}).includes(matchedString)) return 'query';
    if (JSON.stringify(request.body || {}).includes(matchedString)) return 'body';
    return 'unknown';
  }

  private detectPortScan(traffic: any): NetworkAnomaly | null {
    // Implement port scan detection logic
    return null;
  }

  private async detectUnusualTraffic(traffic: any): Promise<NetworkAnomaly | null> {
    // Implement unusual traffic detection logic
    return null;
  }

  private async detectDDoS(traffic: any): Promise<NetworkAnomaly | null> {
    // Implement DDoS detection logic
    return null;
  }

  private async fetchThreatSignatures(): Promise<void> {
    // Fetch threat signatures from external threat intelligence feeds
  }

  private async updateIpReputation(): Promise<void> {
    // Update IP reputation database from external sources
  }

  private async cleanupOldThreats(): Promise<void> {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days

    try {
      await db.execute(`
        DELETE FROM threat_detections WHERE created_at < $1
      `, [cutoffDate]);
    } catch (error) {
      this.logger.error('Failed to cleanup old threats', { error });
    }
  }

  private arrayToObject(array: any[], keyField: string, valueField: string): Record<string, number> {
    const result: Record<string, number> = {};
    for (const item of array) {
      result[item[keyField]] = item[valueField];
    }
    return result;
  }
}
