
import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger } from 'winston';

export interface ApprovalRule {
  id: string;
  name: string;
  entityType: 'quotation' | 'sales_order';
  conditions: {
    minAmount?: number;
    maxAmount?: number;
    discountPercent?: number;
    customerIds?: string[];
    productIds?: string[];
  };
  approvers: {
    userId: string;
    role: string;
    order: number; // Sequential approval order
    isRequired: boolean;
  }[];
  isActive: boolean;
}

export interface ApprovalRequest {
  id: string;
  entityType: 'quotation' | 'sales_order';
  entityId: string;
  requestedBy: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  currentApproverIndex: number;
  approvals: {
    userId: string;
    status: 'pending' | 'approved' | 'rejected';
    comments?: string;
    approvedAt?: Date;
  }[];
  createdAt: Date;
  completedAt?: Date;
}

@Injectable()
export class ApprovalWorkflowService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  /**
   * Check if approval is required for an entity
   */
  async checkApprovalRequired(
    entityType: 'quotation' | 'sales_order',
    entityData: any,
    companyId: string
  ): Promise<{ required: boolean; rules: ApprovalRule[] }> {
    try {
      this.logger.info('Checking approval requirements', {
        entityType,
        entityId: entityData.id,
        companyId,
      });

      const applicableRules = await this.getApplicableApprovalRules(
        entityType,
        entityData,
        companyId
      );

      return {
        required: applicableRules.length > 0,
        rules: applicableRules,
      };
    } catch (error) {
      this.logger.error('Failed to check approval requirements', {
        error,
        entityType,
        entityData,
      });
      throw error;
    }
  }

  /**
   * Create approval request
   */
  async createApprovalRequest(
    entityType: 'quotation' | 'sales_order',
    entityId: string,
    requestedBy: string,
    reason: string,
    companyId: string
  ): Promise<ApprovalRequest> {
    try {
      this.logger.info('Creating approval request', {
        entityType,
        entityId,
        requestedBy,
        companyId,
      });

      // Get entity data to determine applicable rules
      const entityData = await this.getEntityData(entityType, entityId, companyId);

      const { rules } = await this.checkApprovalRequired(
        entityType,
        entityData,
        companyId
      );

      if (rules.length === 0) {
        throw new Error('No approval rules applicable for this entity');
      }

      // Get all required approvers from applicable rules
      const approvers = this.consolidateApprovers(rules);

      const approvalRequest: ApprovalRequest = {
        id: this.generateApprovalRequestId(),
        entityType,
        entityId,
        requestedBy,
        reason,
        status: 'pending',
        currentApproverIndex: 0,
        approvals: approvers.map(approver => ({
          userId: approver.userId,
          status: 'pending',
        })),
        createdAt: new Date(),
      };

      // Save approval request (in a real implementation, this would be saved to database)
      await this.saveApprovalRequest(approvalRequest, companyId);

      // Send notification to first approver
      const firstApproval = approvalRequest.approvals[0];
      if (firstApproval) {
        await this.notifyApprover(
          firstApproval.userId,
          approvalRequest,
          companyId
        );
      }

      this.logger.info('Created approval request', {
        approvalRequestId: approvalRequest.id,
        approversCount: approvers.length,
      });

      return approvalRequest;
    } catch (error) {
      this.logger.error('Failed to create approval request', {
        error,
        entityType,
        entityId,
      });
      throw error;
    }
  }

  /**
   * Process approval response
   */
  async processApproval(
    approvalRequestId: string,
    userId: string,
    decision: 'approved' | 'rejected',
    comments?: string,
    companyId: string = ''
  ): Promise<ApprovalRequest> {
    try {
      this.logger.info('Processing approval', {
        approvalRequestId,
        userId,
        decision,
        companyId,
      });

      const approvalRequest = await this.getApprovalRequest(
        approvalRequestId,
        companyId
      );

      if (!approvalRequest) {
        throw new Error('Approval request not found');
      }

      if (approvalRequest.status !== 'pending') {
        throw new Error('Approval request is not in pending status');
      }

      // Find the approval for this user
      const approvalIndex = approvalRequest.approvals.findIndex(
        approval => approval.userId === userId && approval.status === 'pending'
      );

      if (approvalIndex === -1) {
        throw new Error('User is not authorized to approve this request');
      }

      // Update the approval
      approvalRequest.approvals[approvalIndex] = {
        userId,
        status: decision,
        ...(comments && { comments }),
        approvedAt: new Date(),
      };

      // Check if request is completed
      if (decision === 'rejected') {
        // If rejected, mark entire request as rejected
        approvalRequest.status = 'rejected';
        approvalRequest.completedAt = new Date();

        // Notify requester of rejection
        await this.notifyRequester(approvalRequest, 'rejected', companyId);
      } else {
        // Check if all required approvals are complete
        const pendingApprovals = approvalRequest.approvals.filter(
          approval => approval.status === 'pending'
        );

        if (pendingApprovals.length === 0) {
          // All approvals complete
          approvalRequest.status = 'approved';
          approvalRequest.completedAt = new Date();

          // Update entity status
          await this.updateEntityAfterApproval(approvalRequest, companyId);

          // Notify requester of approval
          await this.notifyRequester(approvalRequest, 'approved', companyId);
        } else {
          // Move to next approver
          approvalRequest.currentApproverIndex++;

          // Notify next approver
          const nextApproval = pendingApprovals[0];
          if (nextApproval) {
            await this.notifyApprover(
              nextApproval.userId,
              approvalRequest,
              companyId
            );
          }
        }
      }

      // Save updated approval request
      await this.saveApprovalRequest(approvalRequest, companyId);

      this.logger.info('Processed approval', {
        approvalRequestId,
        decision,
        finalStatus: approvalRequest.status,
      });

      return approvalRequest;
    } catch (error) {
      this.logger.error('Failed to process approval', {
        error,
        approvalRequestId,
        userId,
        decision,
      });
      throw error;
    }
  }

  /**
   * Get approval requests for a user
   */
  async getApprovalRequestsForUser(
    userId: string,
    status: 'pending' | 'all' = 'pending',
    companyId: string
  ): Promise<ApprovalRequest[]> {
    try {
      this.logger.info('Getting approval requests for user', {
        userId,
        status,
        companyId,
      });
      
      // This would typically query the database
      // For now, return empty array
      return [];
    } catch (error) {
      this.logger.error('Failed to get approval requests for user', {
        error,
        userId,
        status,
      });
      throw error;
    }
  }

  /**
   * Cancel approval request
   */
  async cancelApprovalRequest(
    approvalRequestId: string,
    userId: string,
    reason: string,
    companyId: string
  ): Promise<ApprovalRequest> {
    try {
      this.logger.info('Cancelling approval request', {
        approvalRequestId,
        userId,
        reason,
        companyId,
      });

      const approvalRequest = await this.getApprovalRequest(
        approvalRequestId,
        companyId
      );

      if (!approvalRequest) {
        throw new Error('Approval request not found');
      }

      if (approvalRequest.requestedBy !== userId) {
        throw new Error('Only the requester can cancel the approval request');
      }

      if (approvalRequest.status !== 'pending') {
        throw new Error('Only pending approval requests can be cancelled');
      }

      approvalRequest.status = 'cancelled';
      approvalRequest.completedAt = new Date();

      // Save updated approval request
      await this.saveApprovalRequest(approvalRequest, companyId);

      // Notify all pending approvers of cancellation
      const pendingApprovers = approvalRequest.approvals
        .filter(approval => approval.status === 'pending')
        .map(approval => approval.userId);

      for (const approverId of pendingApprovers) {
        await this.notifyApprovalCancellation(
          approverId,
          approvalRequest,
          reason,
          companyId
        );
      }

      this.logger.info('Cancelled approval request', { approvalRequestId });

      return approvalRequest;
    } catch (error) {
      this.logger.error('Failed to cancel approval request', {
        error,
        approvalRequestId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get applicable approval rules for an entity
   */
  private async getApplicableApprovalRules(
    entityType: 'quotation' | 'sales_order',
    entityData: any,
    companyId: string
  ): Promise<ApprovalRule[]> {
    this.logger.debug('Getting applicable approval rules', {
      entityType,
      companyId,
    });
    // Mock approval rules - in a real implementation, these would come from database
    const mockRules: ApprovalRule[] = [
      {
        id: '1',
        name: 'High Value Orders',
        entityType,
        conditions: { minAmount: 10000 },
        approvers: [
          { userId: 'manager1', role: 'Sales Manager', order: 1, isRequired: true },
          { userId: 'director1', role: 'Sales Director', order: 2, isRequired: true },
        ],
        isActive: true,
      },
      {
        id: '2',
        name: 'High Discount Orders',
        entityType,
        conditions: { discountPercent: 15 },
        approvers: [
          { userId: 'manager1', role: 'Sales Manager', order: 1, isRequired: true },
        ],
        isActive: true,
      },
    ];

    return mockRules.filter(rule => this.isRuleApplicable(rule, entityData));
  }

  /**
   * Check if approval rule is applicable to entity
   */
  private isRuleApplicable(rule: ApprovalRule, entityData: any): boolean {
    if (!rule.isActive) return false;

    const { conditions } = rule;
    const grandTotal = parseFloat(entityData.grandTotal || '0');
    const totalDiscount = parseFloat(entityData.totalDiscount || '0');
    const subtotal = parseFloat(entityData.subtotal || '0');
    const discountPercent = subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0;

    // Check amount conditions
    if (conditions.minAmount && grandTotal < conditions.minAmount) {
      return false;
    }

    if (conditions.maxAmount && grandTotal > conditions.maxAmount) {
      return false;
    }

    // Check discount conditions
    if (conditions.discountPercent && discountPercent < conditions.discountPercent) {
      return false;
    }

    // Check customer conditions
    if (conditions.customerIds && !conditions.customerIds.includes(entityData.customerId)) {
      return false;
    }

    return true;
  }

  /**
   * Consolidate approvers from multiple rules
   */
  private consolidateApprovers(rules: ApprovalRule[]) {
    const approverMap = new Map();

    rules.forEach(rule => {
      rule.approvers.forEach(approver => {
        const key = `${approver.userId}-${approver.order}`;
        if (!approverMap.has(key) || approverMap.get(key).order > approver.order) {
          approverMap.set(key, approver);
        }
      });
    });

    return Array.from(approverMap.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * Get entity data
   */
  private async getEntityData(
    entityType: 'quotation' | 'sales_order',
    entityId: string,
    companyId: string
  ): Promise<any> {
    this.logger.debug('Getting entity data', {
      entityType,
      entityId,
      companyId,
    });
    
    // This would typically query the appropriate service
    // For now, return mock data
    return {
      id: entityId,
      grandTotal: '15000',
      totalDiscount: '2000',
      subtotal: '12000',
      customerId: 'customer1',
    };
  }

  /**
   * Generate approval request ID
   */
  private generateApprovalRequestId(): string {
    return `APR-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Save approval request
   */
  private async saveApprovalRequest(
    approvalRequest: ApprovalRequest,
    companyId: string
  ): Promise<void> {
    // In a real implementation, this would save to database
    this.logger.info('Saving approval request', {
      approvalRequestId: approvalRequest.id,
      companyId,
    });
  }

  /**
   * Get approval request
   */
  private async getApprovalRequest(
    approvalRequestId: string,
    companyId: string
  ): Promise<ApprovalRequest | null> {
    this.logger.debug('Getting approval request', {
      approvalRequestId,
      companyId,
    });
    
    // In a real implementation, this would query from database
    return null;
  }

  /**
   * Notify approver
   */
  private async notifyApprover(
    userId: string,
    approvalRequest: ApprovalRequest,
    companyId: string
  ): Promise<void> {
    this.logger.info('Notifying approver', {
      userId,
      approvalRequestId: approvalRequest.id,
      companyId,
    });

    // In a real implementation, this would send email/push notification
  }

  /**
   * Notify requester
   */
  private async notifyRequester(
    approvalRequest: ApprovalRequest,
    status: 'approved' | 'rejected',
    companyId: string
  ): Promise<void> {
    this.logger.info('Notifying requester', {
      requestedBy: approvalRequest.requestedBy,
      approvalRequestId: approvalRequest.id,
      status,
      companyId,
    });

    // In a real implementation, this would send email/push notification
  }

  /**
   * Notify approval cancellation
   */
  private async notifyApprovalCancellation(
    userId: string,
    approvalRequest: ApprovalRequest,
    reason: string,
    companyId: string
  ): Promise<void> {
    this.logger.info('Notifying approval cancellation', {
      userId,
      approvalRequestId: approvalRequest.id,
      reason,
      companyId,
    });

    // In a real implementation, this would send email/push notification
  }

  /**
   * Update entity after approval
   */
  private async updateEntityAfterApproval(
    approvalRequest: ApprovalRequest,
    companyId: string
  ): Promise<void> {
    this.logger.info('Updating entity after approval', {
      entityType: approvalRequest.entityType,
      entityId: approvalRequest.entityId,
      companyId,
    });

    // In a real implementation, this would update the entity status
    // For example, change quotation status from 'Draft' to 'Approved'
  }
}
