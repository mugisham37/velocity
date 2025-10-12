// Database imports temporarily disabled
import { Inject, Injectable } from '@nestjs/common';
// Schedule functionality temporarily disabled
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { NotificationService } from '../../common/services/notification.service';
import { SecurityMonitoringService } from './security-monitoring.service';

export interface ThreatSignature {
  id: string;
  name: string;
  pattern: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'SQL_INJECTION' | 'XSS' | 'BRUTE_FORCE' | 'DATA_EXFILTRATION' | 'MALWARE' | 'PHISHING'; // cspell:disable-line - Data exfiltration: unauthorized data transfer
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
      const pathTraversalThreat = this.detectPathTraversal(request);
      if (pathTraversalThreat) threats.push(pathTraversalThreat);

      // Log detected threats
      for (const threat of threats) {
        await this.logThreat(threat, request);
      }

      return threats;
    } catch (error) {
      this.logger.error('Failed to analyze request for threats', {
        error,
        request: { url: request.url, ip: request.ip },
      });
      return [];
    }
  }

  /**
   * Get threat statistics
   */
  async getThreatStatistics(companyId: string): Promise<{
    totalThreats: number;
    threatsByType: Record<string, number>;
    threatsBySeverity: Record<string, number>;
    topSourceIps: { ip: string; count: number }[];
  }> {
    try {
      // Mock implementation - replace with actual database queries
      return {
        totalThreats: 0,
        threatsByType: {},
        threatsBySeverity: {},
        topSourceIps: [],
      };
    } catch (error) {
      this.logger.error('Failed to get threat statistics', {
        error,
        companyId,
      });
      throw error;
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
            threatId: 'sql_injection',
            severity: 'HIGH',
            confidence: 0.8,
            details: {
              pattern: pattern.source,
              matchedString: testString,
              location: 'request_data',
            },
            recommendations: [
              'Use parameterized queries',
              'Implement input validation',
              'Apply principle of least privilege',
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
            threatId: 'xss',
            severity: 'MEDIUM',
            confidence: 0.7,
            details: {
              pattern: pattern.source,
              matchedString: testString,
              location: 'request_data',
            },
            recommendations: [
              'Implement output encoding',
              'Use Content Security Policy',
              'Validate and sanitize input',
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
      /(wget|curl|nc|netcat|telnet|ssh)/i, // cspell:disable-line - netcat: networking utility for TCP/UDP connections
      /(rm|del|format|fdisk)/i, // cspell:disable-line - fdisk: disk partitioning utility
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
            threatId: 'command_injection',
            severity: 'CRITICAL',
            confidence: 0.9,
            details: {
              pattern: pattern.source,
              matchedString: testString,
              location: 'request_data',
            },
            recommendations: [
              'Avoid system calls with user input',
              'Use allowlists for input validation',
              'Run with minimal privileges',
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
      /\.\.\\/g,
      /%2e%2e%2f/gi,
      /%2e%2e%5c/gi,
      /\.\.%2f/gi,
      /\.\.%5c/gi,
    ];

    const testString = request.url;

    for (const pattern of pathTraversalPatterns) {
      if (pattern.test(testString)) {
        return {
          threatId: 'path_traversal',
          severity: 'HIGH',
          confidence: 0.85,
          details: {
            pattern: pattern.source,
            matchedString: testString,
            location: 'url',
          },
          recommendations: [
            'Validate file paths',
            'Use allowlists for file access',
            'Implement proper access controls',
          ],
        };
      }
    }

    return null;
  }

  /**
   * Log detected threat
   */
  private async logThreat(
    threat: ThreatDetectionResult,
    request: any
  ): Promise<void> {
    try {
      // Store active threat for tracking
      const threatKey = `${request.ip}_${threat.threatId}`;
      this.activeThreats.set(threatKey, threat);

      await this.securityMonitoring.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: threat.severity,
        source: 'threat_detection',
        userId: request.userId,
        companyId: request.companyId,
        ipAddress: request.ip,
        userAgent: request.userAgent,
        details: {
          threatId: threat.threatId,
          confidence: threat.confidence,
          details: threat.details,
          url: request.url,
          method: request.method,
        },
      });

      // Send alert for high severity threats
      if (threat.severity === 'HIGH' || threat.severity === 'CRITICAL') {
        await this.notificationService.sendThreatAlert(
          request.companyId,
          threat
        );
      }

      // Clean up old threats (keep only last 100)
      if (this.activeThreats.size > 100) {
        const firstKey = this.activeThreats.keys().next().value;
        this.activeThreats.delete(firstKey);
      }
    } catch (error) {
      this.logger.error('Failed to log threat', { error, threat });
    }
  }

  /**
   * Initialize threat signatures
   */
  private initializeThreatSignatures(): void {
    // Initialize with basic threat signatures
    const signatures: ThreatSignature[] = [
      {
        id: 'sql_injection_basic',
        name: 'Basic SQL Injection',
        pattern: '(SELECT|INSERT|UPDATE|DELETE|DROP)',
        severity: 'HIGH',
        category: 'SQL_INJECTION',
        enabled: true,
      },
      {
        id: 'xss_basic',
        name: 'Basic XSS',
        pattern: '<script.*?>.*?</script>',
        severity: 'MEDIUM',
        category: 'XSS',
        enabled: true,
      },
    ];

    signatures.forEach(sig => this.threatSignatures.set(sig.id, sig));
  }
}