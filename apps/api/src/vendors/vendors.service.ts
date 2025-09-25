import {
  NewVendor,
  Vendor,
  VendorContact,
  vendorCategories,
  vendorCategoryMemberships,
  vendorContacts,
  vendorEvaluations,
  vendorPerformanceMetrics,
  vendorPortalUsers,
  vendors
} from '@kiro/database';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AuditService } from '../common/services/audit.service';
import { BaseService } from '../common/services/base.service';
import { NotificationService } from '../common/services/notification.service';
import { eq, and, like, sql, desc, asc, avg, sum } from frrizzle - orm;
';

export interface CreateVendorDto {
  vendorName: string;
  vendorType?: 'Individual' | 'Company';
  parentVendorId?: string;
  email?: string;
  phone?: string;
  website?: string;
  taxId?: string;
  currency?: string;
  paymentTerms?: string;
  creditLimit?: number;
  billingAddress?: any;
  shippingAddress?: any;
  notes?: string;
  contacts?: CreateVendorContactDto[];
  categoryIds?: string[];
}

export interface UpdateVendorDto {
  vendorName?: string;
  parentVendorId?: string;
  email?: string;
  phone?: string;
  website?: string;
  taxId?: string;
  currency?: string;
  paymentTerms?: string;
  creditLimit?: number;
  billingAddress?: any;
  shippingAddress?: any;
  notes?: string;
  isActive?: boolean;
  isBlocked?: boolean;
}

export interface CreateVendorContactDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  designation?: string;
  department?: string;
  isPrimary?: boolean;
}

export interface CreatePerformanceMetricDto {
  vendorId: string;
  metricType: 'QUALITY' | 'DELIVERY' | 'COST' | 'SERVICE';
  metricName: string;
  value: number;
  target?: number;
  unit?: string;
  period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  periodStart: Date;
  periodEnd: Date;
}

export interface CreateVendorEvaluationDto {
  vendorId: string;
  evaluationDate: Date;
  overallScore: number;
  qualityScore?: number;
  deliveryScore?: number;
  costScore?: number;
  serviceScore?: number;
  comments?: string;
  recommendations?: string;
  nextEvaluationDate?: Date;
}

export interface CreateVendorCategoryDto {
  name: string;
  description?: string;
  parentCategoryId?: string;
}

export interface VendorPortalUserDto {
  vendorId: string;
  contactId?: string;
  username: string;
  email: string;
  password: string;
  permissions?: Record<string, any>;
}

@Injectable()
export class VendorsService extends BaseService<typeof vendors, Vendor, NewVendor, UpdateVendorDto> {
  protected table = vendors;
  protected tableName = 'vendors';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    logger: Logger,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService
  ) {
    super(logger);
  }

  /**
   * Create vendor with auto-generated code
   */
  async createVendor(data: CreateVendorDto, companyId: string, userId?: string): Promise<Vendor> {
    return await this.transaction(async (tx) => {
      // Generate vendor code
      const vendorCode = await this.generateVendorCode(companyId);

      // Validate parent vendor if provided
      if (data.parentVendorId) {
        const parentVendor = await this.findById(data.parentVendorId, companyId);
        if (!parentVendor) {
          throw new BadRequestException('Parent vendor not found');
        }
      }

      // Create vendor
      const [vendor] = await tx
        .insert(vendors)
        .values({
          vendorCode,
          vendorName: data.vendorName,
          vendorType: data.vendorType || 'Company',
          parentVendorId: data.parentVendorId,
          email: data.email,
          phone: data.phone,
          website: data.website,
          taxId: data.taxId,
          currency: data.currency || 'USD',
          paymentTerms: data.paymentTerms,
          creditLimit: data.creditLimit?.toString() || '0',
          billingAddress: data.billingAddress,
          shippingAddress: data.shippingAddress,
          notes: data.notes,
          companyId,
        })
        .returning();

      // Create contacts if provided
      if (data.contacts && data.contacts.length > 0) {
        const contactInserts = data.contacts.map(contact => ({
          vendorId: vendor.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
          designation: contact.designation,
          department: contact.department,
          isPrimary: contact.isPrimary || false,
        }));

        await tx.insert(vendorContacts).values(contactInserts);
      }

      // Assign to categories if provided
      if (data.categoryIds && data.categoryIds.length > 0) {
        const categoryMemberships = data.categoryIds.map((categoryId, index) => ({
          vendorId: vendor.id,
          categoryId,
          isPrimary: index === 0, // First category is primary
          companyId,
        }));

        await tx.insert(vendorCategoryMemberships).values(categoryMemberships);
      }

      // Log audit trail
      await this.auditService.logAudit({
        entityType: 'vendors',
        entityId: vendor.id,
        action: 'CREATE',
        newValues: { ...vendor, contacts: data.contacts, categoryIds: data.categoryIds },
        companyId,
        userId,
      });

      return vendor;
    });
  }

  /**
   * Update vendor
   */
  async updateVendor(id: string, data: UpdateVendorDto, companyId: string, userId?: string): Promise<Vendor> {
    const oldVendor = await this.findByIdOrFail(id, companyId);

    // Validate parent vendor change
    if (data.parentVendorId && data.parentVendorId !== oldVendor.parentVendorId) {
      const parentVendor = await this.findById(data.parentVendorId, companyId);
      if (!parentVendor) {
        throw new BadRequestException('Parent vendor not found');
      }

      // Check for circular reference
      if (await this.wouldCreateCircularReference(id, data.parentVendorId, companyId)) {
        throw new BadRequestException('Cannot create circular reference in vendor hierarchy');
      }
    }

    const updatedVendor = await this.update(id, data, companyId);

    // Log audit trail
    await this.auditService.logAudit({
      entityType: 'vendors',
      entityId: id,
      action: 'UPDATE',
      oldValues: oldVendor,
      newValues: updatedVendor,
      companyId,
      userId,
    });

    return updatedVendor;
  }

  /**
   * Find vendor by code
   */
  async findByVendorCode(vendorCode: string, companyId: string): Promise<Vendor | null> {
    const [vendor] = await this.database
      .select()
      .from(vendors)
      .where(
        and(
          eq(vendors.vendorCode, vendorCode),
          eq(vendors.companyId, companyId)
        )
      )
      .limit(1);

    return vendor || null;
  }

  /**
   * Create vendor contact
   */
  async createVendorContact(data: CreateVendorContactDto & { vendorId: string }, companyId: string, userId?: string): Promise<VendorContact> {
    // Validate vendor exists
    await this.findByIdOrFail(data.vendorId, companyId);

    // If this is primary contact, unset other primary contacts
    if (data.isPrimary) {
      await this.database
        .update(vendorContacts)
        .set({ isPrimary: false })
        .where(
          and(
            eq(vendorContacts.vendorId, data.vendorId),
            eq(vendorContacts.isPrimary, true)
          )
        );
    }

    const [contact] = await this.database
      .insert(vendorContacts)
      .values({
        vendorId: data.vendorId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        designation: data.designation,
        department: data.department,
        isPrimary: data.isPrimary || false,
      })
      .returning();

    // Log audit trail
    await this.auditService.logAudit({
      entityType: 'vendor_contacts',
      entityId: contact.id,
      action: 'CREATE',
      newValues: contact,
      companyId,
      userId,
    });

    return contact;
  }

  /**
   * Record performance metric
   */
  async recordPerformanceMetric(data: CreatePerformanceMetricDto, companyId: string, userId?: string): Promise<void> {
    // Validate vendor exists
    await this.findByIdOrFail(data.vendorId, companyId);

    await this.database.insert(vendorPerformanceMetrics).values({
      vendorId: data.vendorId,
      metricType: data.metricType,
      metricName: data.metricName,
      value: data.value.toString(),
      target: data.target?.toString(),
      unit: data.unit,
      period: data.period,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      companyId,
    });

    // Log audit trail
    await this.auditService.logAudit({
      entityType: 'vendor_performance_metrics',
      entityId: data.vendorId,
      action: 'CREATE',
      newValues: data,
      companyId,
      userId,
    });
  }

  /**
   * Create vendor evaluation
   */
  async createVendorEvaluation(data: CreateVendorEvaluationDto, companyId: string, userId: string): Promise<any> {
    // Validate vendor exists
    await this.findByIdOrFail(data.vendorId, companyId);

    const [evaluation] = await this.database
      .insert(vendorEvaluations)
      .values({
        vendorId: data.vendorId,
        evaluationDate: data.evaluationDate,
        evaluatedBy: userId,
        overallScore: data.overallScore.toString(),
        qualityScore: data.qualityScore?.toString(),
        deliveryScore: data.deliveryScore?.toString(),
        costScore: data.costScore?.toString(),
        serviceScore: data.serviceScore?.toString(),
        comments: data.comments,
        recommendations: data.recommendations,
        nextEvaluationDate: data.nextEvaluationDate,
        companyId,
      })
      .returning();

    // Send notification to vendor if they have portal access
    const portalUsers = await this.database
      .select()
      .from(vendorPortalUsers)
      .where(
        and(
          eq(vendorPortalUsers.vendorId, data.vendorId),
          eq(vendorPortalUsers.isActive, true)
        )
      );

    for (const portalUser of portalUsers) {
      await this.notificationService.sendNotification(
        {
          title: 'Performance Evaluation Completed',
          message: `Your performance evaluation has been completed with an overall score of ${data.overallScore}`,
          type: 'INFO',
          recipientId: portalUser.id,
          entityType: 'vendors',
          entityId: data.vendorId,
        },
        companyId,
        ['EMAIL', 'IN_APP']
      );
    }

    // Log audit trail
    await this.auditService.logAudit({
      entityType: 'vendor_evaluations',
      entityId: evaluation.id,
      action: 'CREATE',
      newValues: evaluation,
      companyId,
      userId,
    });

    return evaluation;
  }

  /**
   * Create vendor category
   */
  async createVendorCategory(data: CreateVendorCategoryDto, companyId: string, userId?: string): Promise<any> {
    // Validate parent category if provided
    if (data.parentCategoryId) {
      const [parentCategory] = await this.database
        .select()
        .from(vendorCategories)
        .where(
          and(
            eq(vendorCategories.id, data.parentCategoryId),
            eq(vendorCategories.companyId, companyId)
          )
        )
        .limit(1);

      if (!parentCategory) {
        throw new BadRequestException('Parent category not found');
      }
    }

    const [category] = await this.database
      .insert(vendorCategories)
      .values({
        name: data.name,
        description: data.description,
        parentCategoryId: data.parentCategoryId,
        companyId,
      })
      .returning();

    // Log audit trail
    await this.auditService.logAudit({
      entityType: 'vendor_categories',
      entityId: category.id,
      action: 'CREATE',
      newValues: category,
      companyId,
      userId,
    });

    return category;
  }

  /**
   * Create vendor portal user
   */
  async createPortalUser(data: VendorPortalUserDto, companyId: string, userId?: string): Promise<any> {
    // Validate vendor exists
    await this.findByIdOrFail(data.vendorId, companyId);

    // Validate contact if provided
    if (data.contactId) {
      const [contact] = await this.database
        .select()
        .from(vendorContacts)
        .where(
          and(
            eq(vendorContacts.id, data.contactId),
            eq(vendorContacts.vendorId, data.vendorId)
          )
        )
        .limit(1);

      if (!contact) {
        throw new BadRequestException('Contact not found for this vendor');
      }
    }

    // Check if username already exists
    const [existingUser] = await this.database
      .select()
      .from(vendorPortalUsers)
      .where(
        and(
          eq(vendorPortalUsers.username, data.username),
          eq(vendorPortalUsers.companyId, companyId)
        )
      )
      .limit(1);

    if (existingUser) {
      throw new BadRequestException('Username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    const [portalUser] = await this.database
      .insert(vendorPortalUsers)
      .values({
        vendorId: data.vendorId,
        contactId: data.contactId,
        username: data.username,
        email: data.email,
        passwordHash,
        permissions: data.permissions || {},
        companyId,
      })
      .returning();

    // Send welcome notification
    await this.notificationService.sendNotification(
      {
        title: 'Welcome to Vendor Portal',
        message: `Your vendor portal account has been created. Username: ${data.username}`,
        type: 'INFO',
        recipientId: portalUser.id,
        entityType: 'vendors',
        entityId: data.vendorId,
      },
      companyId,
      ['EMAIL']
    );

    // Log audit trail
    await this.auditService.logAudit({
      entityType: 'vendor_portal_users',
      entityId: portalUser.id,
      action: 'CREATE',
      newValues: { ...portalUser, passwordHash: '[REDACTED]' },
      companyId,
      userId,
    });

    return { ...portalUser, passwordHash: undefined };
  }

  /**
   * Get vendor performance summary
   */
  async getVendorPerformanceSummary(vendorId: string, companyId: string): Promise<any> {
    // Validate vendor exists
    await this.findByIdOrFail(vendorId, companyId);

    const performanceSummary = await this.database
      .select({
        metricType: vendorPerformanceMetrics.metricType,
        avgValue: avg(sql`CAST(${vendorPerformanceMetrics.value} AS DECIMAL)`),
        avgTarget: avg(sql`CAST(${vendorPerformanceMetrics.target} AS DECIMAL)`),
        metricCount: sql<number>`COUNT(*)`,
      })
      .from(vendorPerformanceMetrics)
      .where(
        and(
          eq(vendorPerformanceMetrics.vendorId, vendorId),
          eq(vendorPerformanceMetrics.companyId, companyId)
        )
      )
      .groupBy(vendorPerformanceMetrics.metricType);

    const latestEvaluation = await this.database
      .select()
      .from(vendorEvaluations)
      .where(
        and(
          eq(vendorEvaluations.vendorId, vendorId),
          eq(vendorEvaluations.companyId, companyId)
        )
      )
      .orderBy(desc(vendorEvaluations.evaluationDate))
      .limit(1);

    return {
      performanceMetrics: performanceSummary,
      latestEvaluation: latestEvaluation[0] || null,
    };
  }

  /**
   * Get vendor analytics
   */
  async getVendorAnalytics(companyId: string): Promise<any> {
    const analytics = await this.database
      .select({
        totalVendors: sql<number>`COUNT(*)`,
        activeVendors: sql<number>`COUNT(*) FILTER (WHERE ${vendors.isActive} = true)`,
        blockedVendors: sql<number>`COUNT(*) FILTER (WHERE ${vendors.isBlocked} = true)`,
        individualVendors: sql<number>`COUNT(*) FILTER (WHERE ${vendors.vendorType} = 'Individual')`,
        companyVendors: sql<number>`COUNT(*) FILTER (WHERE ${vendors.vendorType} = 'Company')`,
        totalCreditLimit: sql<number>`SUM(CAST(${vendors.creditLimit} AS DECIMAL))`,
      })
      .from(vendors)
      .where(eq(vendors.companyId, companyId));

    return analytics[0];
  }

  /**
   * Private helper methods
   */
  private async generateVendorCode(companyId: string): Promise<string> {
    const prefix = 'VEND';

    const [result] = await this.database
      .select({
        maxCode: sql<string>`MAX(CAST(SUBSTRING(${vendors.vendorCode}, 5) AS INTEGER))`,
      })
      .from(vendors)
      .where(
        and(
          eq(vendors.companyId, companyId),
          like(vendors.vendorCode, `${prefix}%`)
        )
      );

    const nextNumber = result.maxCode ? parseInt(result.maxCode) + 1 : 1;
    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }

  private async wouldCreateCircularReference(
    vendorId: string,
    newParentId: string,
    companyId: string
  ): Promise<boolean> {
    let currentParentId = newParentId;

    while (currentParentId) {
      if (currentParentId === vendorId) {
        return true;
      }

      const parent = await this.findById(currentParentId, companyId);
      currentParentId = parent?.parentVendorId || null;
    }

    return false;
  }
}
