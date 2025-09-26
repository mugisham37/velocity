import { db } from '@kiro/database';
import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { NotificationService } from '../../common/services/notification.service';

export interface SecurityEvent {
  type: 'LOGIN_FAILURE' | 'SUSPICIOUS_ACTIVITY' | 'DATA_BREACH' | 'UNAUTHORIZED_ACCESS' | 'SYSTEM_INTRUSION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  userId?: string;
  companyId: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp: Date;
}

export interface SecurityMetrics {
  failedLogins: number;
  suspiciousActivities: number;
  blockedIps: number;
  activeThreats: number;
  lastScanTime: Date;
}

export interface ThreatIntelligence {
  ipAddress: string;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  description: string;
  firstSeen: Date;
  lastSeen: Date;
}

@Injectable()
export class SecurityMonitoringService {
  private readonly suspiciousIps = new Set<string>();
  private readonly blockedIps = new Set<string>();
  private readonly rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly notificationService: NotificationService
  ) {}

  /**
   * Log security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Store in database (assuming we have a security_events table)
      await db.execute(`
        INSERT INTO security_events (
          type, severity, source, user_id, company_id,
          ip_address, user_agent, details, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        event.type,
        event.severity,
        event.source,
        event.userId,
        event.companyId,
        event.ipAddress,
        event.userAgent,
        JSON.stringify(event.details),
        event.timestamp
      ]);

      this.logger.warn('Security event logged', {
        type: event.type,
        severity: event.severity,
        source: event.source,
        userId: event.userId,
        ipAddress: event.ipAddress,
      });

      // Handle high severity events immediately
      if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
        await this.handleHighSeverityEvent(event);
      }

      // Update threat intelligence
      if (event.ipAddress) {
        await this.updateThreatIntelliipAddress, event);
      }

    } catch (error) {
      this.logger.error('Failed to log security event', { error, event });
    }
  }

  /**
   * Monitor failed login attempts
   */
  async monitorFailedLogin(
    email: string,
    ipAddress: string,
    userAgent: string,
    companyId: string
  ): Promise<boolean> {
    const key = `${email}:${ipAddress}`;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;

    // Get or create rate limit entry
    let rateLimit = this.rateLimitMap.get(key);
    if (!rateLimit || now > rateLimit.resetTime) {
      rateLimit = { count: 0, resetTime: now + windowMs };
    }

    rateLimit.count++;
    this.rateLimitMap.set(key, rateLimit);

    // Log security event
    await this.logSecurityEvent({
      type: 'LOGIN_FAILURE',
      severity: rateLimit.count > maxAttempts ? 'HIGH' : 'MEDIUM',
      source: 'authentication',
      companyId,
      ipAddress,
      userAgent,
      details: {
        email,
        attemptCount: rateLimit.count,
        windowStart: new Date(rateLimit.resetTime - windowMs),
      },
      timestamp: new Date(),
    });

    // Block IP if too many attempts
    if (rateLimit.count > maxAttempts) {
      this.blockedIps.add(ipAddress);
      this.logger.warn('IP blocked due to excessive failed login attempts', {
        ipAddress,
        email,
        attemptCount: rateLimit.count,
      });
      return true; // Blocked
    }

    return false; // Not blocked
  }

  /**
   * Detect suspicious activity patterns
   */
  async detectSuspiciousActivity(
    userId: string,
    ipAddress: string,
    userAgent: string,
    companyId: string,
    activity: string
  ): Promise<void> {
    const suspiciousPatterns = [
      // Multiple rapid requests
      { pattern: 'rapid_requests', threshold: 100, windowMs: 60000 },
      // Unusual time access
      { pattern: 'unusual_time', threshold: 1, windowMs: 0 },
      // Geographic anomaly
      { pattern: 'geo_anomaly', threshold: 1, windowMs: 0 },
      // Privilege escalation attempts
      { pattern: 'privilege_escalation', threshold: 3, windowMs: 300000 },
    ];

    for (const pattern of suspiciousPatterns) {
      const isSuspicious = await this.checkPattern(
        pattern.pattern,
        userId,
        ipAddress,
        activity,
        pattern.threshold,
        pattern.windowMs
      );

      if (isSuspicious) {
        await this.logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'MEDIUM',
          source: 'activity_monitor',
          userId,
          companyId,
          ipAddress,
          userAgent,
          details: {
            pattern: pattern.pattern,
            activity,
            threshold: pattern.threshold,
          },
          timestamp: new Date(),
        });

        this.suspiciousIps.add(ipAddress);
      }
    }
  }

  /**
   * Check if IP is blocked
   */
  isIpBlocked(ipAddress: string): boolean {
    return this.blockedIps.has(ipAddress);
  }

  /**
   * Check if IP is suspicious
   */
  isIpSuspicious(ipAddress: string): boolean {
    return this.suspiciousIps.has(ipAddress);
  }

  /**
   * Unblock IP address
   */
  async unblockIp(ipAddress: string, adminUserId: string): Promise<void> {
    this.blockedIps.delete(ipAddress);
    this.suspiciousIps.delete(ipAddress);

    this.logger.info('IP address unblocked', {
      ipAddress,
      adminUserId,
    });
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(companyId: string, timeRange: number = 24): Promise<SecurityMetrics> {
    const since = new Date(Date.now() - timeRange * 60 * 60 * 1000);

    try {
      const [failedLogins] = await db.execute(`
        SELECT COUNT(*) as count FROM security_events
        WHERE company_id = $1 AND type = 'LOGIN_FAILURE' AND created_at >= $2
      `, [companyId, since]);

      const [suspiciousActivities] = await db.execute(`
        SELECT COUNT(*) as count FROM security_events
        WHERE company_id = $1 AND type = 'SUSPICIOUS_ACTIVITY' AND created_at >= $2
      `, [companyId, since]);

      return {
        failedLogins: failedLogins.count || 0,
        suspiciousActivities: suspiciousActivities.count || 0,
        blockedIps: this.blockedIps.size,
        activeThreats: this.suspiciousIps.size,
        lastScanTime: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to get security metrics', { error, companyId });
      return {
        failedLogins: 0,
        suspiciousActivities: 0,
        blockedIps: 0,
        activeThreats: 0,
        lastScanTime: new Date(),
      };
    }
  }

  /**
   * Get security events with filtering
   */
  async getSecurityEvents(
    companyId: string,
    filters: {
      type?: string;
      severity?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ data: any[]; total: number }> {
    const { type, severity, startDate, endDate, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    try {
      let whereClause = 'WHERE company_id = $1';
      const params: any[] = [companyId];
      let paramIndex = 2;

      if (type) {
        whereClause += ` AND type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      if (severity) {
        whereClause += ` AND severity = $${paramIndex}`;
        params.push(severity);
        paramIndex++;
      }

      if (startDate) {
        whereClause += ` AND created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereClause += ` AND created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      // Get total count
      const [totalResult] = await db.execute(`
        SELECT COUNT(*) as count FROM security_events ${whereClause}
      `, params);

      // Get data
      const data = await db.execute(`
        SELECT * FROM security_events ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, limit, offset]);

      return {
        data: data || [],
        total: totalResult.count || 0,
      };
    } catch (error) {
      this.logger.error('Failed to get security events', { error, companyId, filters });
      return { data: [], total: 0 };
    }
  }

  /**
   * Scheduled security scan
   */
  @Cron(CronExpression.EVERY_HOUR)
  async performSecurityScan(): Promise<void> {
    this.logger.info('Starting scheduled security scan');

    try {
      // Clean up old rate limit entries
      this.cleanupRateLimits();

      // Check for anomalies in recent activity
      await this.scanForAnomalies();

      // Update threat intelligence
      await this.updateThreatIntelligenceDatabase();

      // Generate security reports for critical events
      await this.generateSecurityReports();

      this.logger.info('Security scan completed successfully');
    } catch (error) {
      this.logger.error('Security scan failed', { error });
    }
  }

  /**
   * Handle high severity security events
   */
  private async handleHighSeverityEvent(event: SecurityEvent): Promise<void> {
    // Send immediate notifications to security team
    await this.notificationService.sendSecurityAlert({
      type: 'SECURITY_INCIDENT',
      severity: event.severity,
      title: `Security Event: ${event.type}`,
      message: `High severity security event detected: ${event.type}`,
      details: event.details,
      companyId: event.companyId,
    });

    // Auto-block IP for critical events
    if (event.severity === 'CRITICAL' && event.ipAddress) {
      this.blockedIps.add(event.ipAddress);
      this.logger.warn('IP auto-blocked due to critical security event', {
        ipAddress: event.ipAddress,
        eventType: event.type,
      });
    }
  }

  /**
   * Check suspicious activity patterns
   */
  private async checkPattern(
    pattern: string,
    userId: string,
    ipAddress: string,
    activity: string,
    threshold: number,
    windowMs: number
  ): Promise<boolean> {
    switch (pattern) {
      case 'rapid_requests':
        return this.checkRapidRequests(userId, ipAddress, threshold, windowMs);
      case 'unusual_time':
        return this.checkUnusualTimeAccess(userId);
      case 'geo_anomaly':
        return this.checkGeographicAnomaly(userId, ipAddress);
      case 'privilege_escalation':
        return this.checkPrivilegeEscalation(userId, activity, threshold, windowMs);
      default:
        return false;
    }
  }

  private checkRapidRequests(userId: string, ipAddress: string, threshold: number, windowMs: number): boolean {
    const key = `rapid_${userId}_${ipAddress}`;
    const now = Date.now();

    let rateLimit = this.rateLimitMap.get(key);
    if (!rateLimit || now > rateLimit.resetTime) {
      rateLimit = { count: 0, resetTime: now + windowMs };
    }

    rateLimit.count++;
    this.rateLimitMap.set(key, rateLimit);

    return rateLimit.count > threshold;
  }

  private checkUnusualTimeAccess(userId: string): boolean {
    const hour = new Date().getHours();
    // Consider access between 11 PM and 5 AM as unusual
    return hour >= 23 || hour <= 5;
  }

  private async checkGeographicAnomaly(userId: string, ipAddress: string): Promise<boolean> {
    // This would integrate with IP geolocation service
    // For now, return false (implement with actual geolocation service)
    return false;
  }

  private checkPrivilegeEscalation(userId: string, activity: string, threshold: number, windowMs: number): boolean {
    const privilegeActions = ['role_change', 'permission_grant', 'admin_access'];
    if (!privilegeActions.some(action => activity.includes(action))) {
      return false;
    }

    const key = `privilege_${userId}`;
    const now = Date.now();

    let rateLimit = this.rateLimitMap.get(key);
    if (!rateLimit || now > rateLimit.resetTime) {
      rateLimit = { count: 0, resetTime: now + windowMs };
    }

    rateLimit.count++;
    this.rateLimitMap.set(key, rateLimit);

    return rateLimit.count > threshold;
  }

  private cleanupRateLimits(): void {
    const now = Date.now();
    for (const [key, rateLimit] of this.rateLimitMap.entries()) {
      if (now > rateLimit.resetTime) {
        this.rateLimitMap.delete(key);
      }
    }
  }

  private async scanForAnomalies(): Promise<void> {
    // Implement anomaly detection algorithms
    // This could include ML-based detection in the future
  }

  private async updateThreatIntelligence(ipAddress: string, event: SecurityEvent): Promise<void> {
    // Update threat intelligence database with new IP information
    try {
      await db.execute(`
        INSERT INTO threat_intelligence (ip_address, threat_level, source, description, first_seen, last_seen)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (ip_address) DO UPDATE SET
          threat_level = CASE
            WHEN EXCLUDED.threat_level::text > threat_intelligence.threat_level::text
            THEN EXCLUDED.threat_level
            ELSE threat_intelligence.threat_level
          END,
          last_seen = EXCLUDED.last_seen,
          description = EXCLUDED.description
      `, [
        ipAddress,
        event.severity,
        event.source,
        `${event.type}: ${JSON.stringify(event.details)}`,
        event.timestamp,
        event.timestamp
      ]);
    } catch (error) {
      this.logger.error('Failed to update threat intelligence', { error, ipAddress });
    }
  }

  private async updateThreatIntelligenceDatabase(): Promise<void> {
    // Periodic update of threat intelligence from external sources
    // This would integrate with threat intelligence feeds
  }

  private async generateSecurityReports(): Promise<void> {
    // Generate and send security reports to administrators
    const companies = await db.execute('SELECT DISTINCT company_id FROM security_events WHERE created_at >= NOW() - INTERVAL \'24 hours\'');

    for (const company of companies) {
      const metrics = await this.getSecurityMetrics(company.company_id, 24);

      if (metrics.failedLogins > 50 || metrics.suspiciousActivities > 10) {
        await this.notificationService.sendSecurityReport({
          companyId: company.company_id,
          metrics,
          period: '24 hours',
        });
      }
    }
  }
}
