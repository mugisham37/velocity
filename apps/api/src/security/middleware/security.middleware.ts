import { Injectable } from '@nestjs/common';
import type { NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { SecurityMonitoringService } from '../services/security-monitoring.service';
import { ThreatDetectionService } from '../services/threat-detection.service';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  constructor(
    private readonly threatDetection: ThreatDetectionService,
    private readonly securityMonitoring: SecurityMonitoringService
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract request information
      const requestInfo = {
        method: req.method,
        url: req.url,
        headers: req.headers as Record<string, string>,
        body: req.body,
        query: req.query as Record<string, string>,
        ip: this.getClientIp(req),
        userAgent: req.headers['user-agent'] || '',
        userId: (req as any).user?.id,
        companyId: (req as any).user?.companyId || 'unknown',
      };

      // Check if IP is blocked
      if (this.securityMonitoring.isIpBlocked(requestInfo.ip)) {
        res.status(403).json({
          error: 'Access denied',
          message: 'Your IP address has been blocked due to security concerns',
        });
        return;
      }

      // Analyze request for threats (async, don't block request)
      this.analyzeRequestAsync(requestInfo);

      // Continue with request
      next();
    } catch (error) {
      // Don't block requests due to security analysis errors
      next();
    }
  }

  private async analyzeRequestAsync(requestInfo: any): Promise<void> {
    try {
      const threats = await this.threatDetection.analyzeRequest(requestInfo);

      // Handle detected threats
      for (const threat of threats) {
        if (threat.severity === 'CRITICAL' || threat.severity === 'HIGH') {
          // Log security event
          await this.securityMonitoring.logSecurityEvent({
            type: 'SUSPICIOUS_ACTIVITY',
            severity: threat.severity,
            source: 'threat_detection',
            userId: requestInfo.userId,
            companyId: requestInfo.companyId,
            ipAddress: requestInfo.ip,
            userAgent: requestInfo.userAgent,
            details: {
              threatId: threat.threatId,
              confidence: threat.confidence,
              details: threat.details,
              url: requestInfo.url,
              method: requestInfo.method,
            },
          });
        }
      }
    } catch (error) {
      // Log error but don't throw to avoid blocking requests
      console.error('Security analysis error:', error);
    }
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      (req.socket as any)?.remoteAddress ||
      'unknown'
    );
  }
}

