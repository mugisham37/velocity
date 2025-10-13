import {
  type Customer,
  type CustomerContact,
  type NewCustomer,
  customerCommunicationPreferences,
  customerContacts,
  customerCreditLimits,
  customerPortalUsers,
  customerSegmentMemberships,
  customerSegments,
  customers
} from '../database';
import { Inject } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { and, eq, like, sql } from '../database';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AuditService } from '../common/services/audit.service';
import { BaseService } from '../common/services/base.service';
import { NotificationService } from '../common/services/notification.service';
import { Injectable, BadRequestException } from '@nestjs/common';

export interface CreateCustomerDto {
  customerName: string;
  customerType?: 'Individual' | 'Company';
  parentCustomerId?: string;
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
  contacts?: CreateCustomerContactDto[];
}

export interface UpdateCustomerDto extends Record<string, unknown> {
  customerName?: string;
  parentCustomerId?: string;
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

export interface CreateCustomerContactDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  designation?: string;
  department?: string;
  isPrimary?: boolean;
}

export interface CreateCreditLimitDto {
  customerId: string;
  creditLimit: number;
  effectiveDate: Date;
  expiryDate?: Date | null;
  notes?: string | null;
}

export interface CreateCustomerSegmentDto {
  name: string;
  description?: string;
  criteria: Record<string, any>;
}

export interface CustomerPortalUserDto {
  customerId: string;
  contactId?: string | null;
  username: string;
  email: string;
  password: string;
  permissions?: Record<string, any>;
}

@Injectable()
export class CustomersService extends BaseService<any, Customer, NewCustomer, Record<string, unknown>> {
  protected table: any = customers;
  protected tableName = 'customers';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    logger: Logger,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    cacheService: any, // TODO: Import proper CacheService
    performanceMonitor: any // TODO: Import proper PerformanceMonitorService
  ) {
    super(logger, cacheService, performanceMonitor);
  }

  /**
   * Create customer with auto-generated code
   */
  async createCustomer(data: CreateCustomerDto, companyId: string, userId?: string): Promise<Customer> {
    return await this.transaction(async (tx) => {
      // Generate customer code
      const customerCode = await this.generateCustomerCode(companyId);

      // Validate parent customer if provided
      if (data.parentCustomerId) {
        const parentCustomer = await this.findById(data.parentCustomerId, companyId);
        if (!parentCustomer) {
          throw new BadRequestException('Parent customer not found');
        }
      }

      // Create customer
      const [customer] = await tx
        .insert(customers)
        .values({
          customerCode,
          customerName: data.customerName,
          customerType: data.customerType || 'Individual',
          parentCustomerId: data.parentCustomerId || null,
          email: data.email || null,
          phone: data.phone || null,
          website: data.website || null,
          taxId: data.taxId || null,
          currency: data.currency || 'USD',
          paymentTerms: data.paymentTerms || null,
          creditLimit: data.creditLimit?.toString() || '0',
          billingAddress: data.billingAddress || null,
          shippingAddress: data.shippingAddress || null,
          notes: data.notes || null,
          companyId,
        })
        .returning();

      // Create contacts if provided
      if (data.contacts && data.contacts.length > 0) {
        const contactInserts = data.contacts.map(contact => ({
          customerId: customer!.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email || null,
          phone: contact.phone || null,
          designation: contact.designation || null,
          department: contact.department || null,
          isPrimary: contact.isPrimary || false,
        }));

        await tx.insert(customerContacts).values(contactInserts);
      }

      // Create default communication preferences
      await tx.insert(customerCommunicationPreferences).values({
        customerId: customer!.id,
        companyId,
      });

      // Log audit trail
      if (userId) {
        await this.auditService.logAudit({
          entityType: 'customers',
          entityId: customer!.id,
          action: 'CREATE',
          newValues: { ...customer!, contacts: data.contacts },
          companyId,
          userId,
        });
      }

      return customer!;
    });
  }

  /**
   * Update customer
   */
  async updateCustomer(id: string, data: UpdateCustomerDto, companyId: string, userId?: string): Promise<Customer> {
    const oldCustomer = await this.findByIdOrFail(id, companyId);

    // Validate parent customer change
    if (data.parentCustomerId && data.parentCustomerId !== oldCustomer.parentCustomerId) {
      const parentCustomer = await this.findById(data.parentCustomerId, companyId);
      if (!parentCustomer) {
        throw new BadRequestException('Parent customer not found');
      }

      // Check for circular reference
      if (await this.wouldCreateCircularReference(id, data.parentCustomerId, companyId)) {
        throw new BadRequestException('Cannot create circular reference in customer hierarchy');
      }
    }

    const updatedCustomer = await this.update(id, data, companyId);

    // Log audit trail
    if (userId) {
      await this.auditService.logAudit({
        entityType: 'customers',
        entityId: id,
        action: 'UPDATE',
        oldValues: oldCustomer,
        newValues: updatedCustomer,
        companyId,
        userId,
      });
    }

    return updatedCustomer;
  }

  /**
   * Get customer hierarchy
   */
  async getCustomerHierarchy(companyId: string): Promise<any[]> {
    const allCustomers = await this.database
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.companyId, companyId),
          eq(customers.isActive, true)
        )
      )
      .orderBy(customers.customerName);

    return this.buildHierarchy(allCustomers);
  }

  /**
   * Find customer by code
   */
  async findByCustomerCode(customerCode: string, companyId: string): Promise<Customer | null> {
    const [customer] = await this.database
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.customerCode, customerCode),
          eq(customers.companyId, companyId)
        )
      )
      .limit(1);

    return customer || null;
  }

  /**
   * Create customer contact
   */
  async createCustomerContact(data: CreateCustomerContactDto & { customerId: string }, companyId: string, userId?: string): Promise<CustomerContact> {
    // Validate customer exists
    await this.findByIdOrFail(data.customerId, companyId);

    // If this is primary contact, unset other primary contacts
    if (data.isPrimary) {
      await this.database
        .update(customerContacts)
        .set({ isPrimary: false })
        .where(
          and(
            eq(customerContacts.customerId, data.customerId),
            eq(customerContacts.isPrimary, true)
          )
        );
    }

    const [contact] = await this.database
      .insert(customerContacts)
      .values({
        customerId: data.customerId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        designation: data.designation || null,
        department: data.department || null,
        isPrimary: data.isPrimary || false,
      })
      .returning();

    // Log audit trail
    if (userId) {
      await this.auditService.logAudit({
        entityType: 'customer_contacts',
        entityId: contact!.id,
        action: 'CREATE',
        newValues: contact!,
        companyId,
        userId,
      });
    }

    return contact!;
  }

  /**
   * Set customer credit limit
   */
  async setCreditLimit(data: CreateCreditLimitDto, companyId: string, userId: string): Promise<void> {
    // Validate customer exists
    await this.findByIdOrFail(data.customerId, companyId);

    // Create credit limit record
    await this.database.insert(customerCreditLimits).values({
      customerId: data.customerId,
      creditLimit: data.creditLimit.toString(),
      effectiveDate: data.effectiveDate,
      expiryDate: data.expiryDate || null,
      approvedBy: userId,
      notes: data.notes || null,
      companyId,
    });

    // Update customer's credit limit
    await this.database
      .update(customers)
      .set({
        creditLimit: data.creditLimit.toString(),
        updatedAt: new Date(),
      })
      .where(eq(customers.id, data.customerId));

    // Send notification to customer if they have portal access
    const portalUsers = await this.database
      .select()
      .from(customerPortalUsers)
      .where(
        and(
          eq(customerPortalUsers.customerId, data.customerId),
          eq(customerPortalUsers.isActive, true)
        )
      );

    for (const portalUser of portalUsers) {
      await this.notificationService.sendNotification(
        {
          title: 'Credit Limit Updated',
          message: `Your credit limit has been updated to ${data.creditLimit}`,
          type: 'INFO',
          recipientId: portalUser.id,
          entityType: 'customers',
          entityId: data.customerId,
        },
        companyId,
        ['EMAIL', 'IN_APP']
      );
    }

    // Log audit trail
    await this.auditService.logAudit({
      entityType: 'customer_credit_limits',
      entityId: data.customerId,
      action: 'CREATE',
      newValues: data,
      companyId,
      userId,
    });
  }

  /**
   * Create customer segment
   */
  async createCustomerSegment(data: CreateCustomerSegmentDto, companyId: string, userId?: string): Promise<any> {
    const [segment] = await this.database
      .insert(customerSegments)
      .values({
        name: data.name,
        description: data.description || null,
        criteria: data.criteria,
        companyId,
      })
      .returning();

    // Auto-assign customers based on criteria
    await this.assignCustomersToSegment(segment!.id, data.criteria, companyId);

    // Log audit trail
    if (userId) {
      await this.auditService.logAudit({
        entityType: 'customer_segments',
        entityId: segment!.id,
        action: 'CREATE',
        newValues: segment!,
        companyId,
        userId,
      });
    }

    return segment!;
  }

  /**
   * Create customer portal user
   */
  async createPortalUser(data: CustomerPortalUserDto, companyId: string, userId?: string): Promise<any> {
    // Validate customer exists
    await this.findByIdOrFail(data.customerId, companyId);

    // Validate contact if provided
    if (data.contactId) {
      const [contact] = await this.database
        .select()
        .from(customerContacts)
        .where(
          and(
            eq(customerContacts.id, data.contactId),
            eq(customerContacts.customerId, data.customerId)
          )
        )
        .limit(1);

      if (!contact) {
        throw new BadRequestException('Contact not found for this customer');
      }
    }

    // Check if username already exists
    const [existingUser] = await this.database
      .select()
      .from(customerPortalUsers)
      .where(
        and(
          eq(customerPortalUsers.username, data.username),
          eq(customerPortalUsers.companyId, companyId)
        )
      )
      .limit(1);

    if (existingUser) {
      throw new BadRequestException('Username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    const [portalUser] = await this.database
      .insert(customerPortalUsers)
      .values({
        customerId: data.customerId,
        contactId: data.contactId || null,
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
        title: 'Welcome to Customer Portal',
        message: `Your customer portal account has been created. Username: ${data.username}`,
        type: 'INFO',
        recipientId: portalUser!.id,
        entityType: 'customers',
        entityId: data.customerId,
      },
      companyId,
      ['EMAIL']
    );

    // Log audit trail
    if (userId) {
      await this.auditService.logAudit({
        entityType: 'customer_portal_users',
        entityId: portalUser!.id,
        action: 'CREATE',
        newValues: { ...portalUser!, passwordHash: '[REDACTED]' },
        companyId,
        userId,
      });
    }

    return { ...portalUser!, passwordHash: undefined };
  }

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(companyId: string): Promise<any> {
    const analytics = await this.database
      .select({
        totalCustomers: sql<number>`COUNT(*)`,
        activeCustomers: sql<number>`COUNT(*) FILTER (WHERE ${customers.isActive} = true)`,
        blockedCustomers: sql<number>`COUNT(*) FILTER (WHERE ${customers.isBlocked} = true)`,
        individualCustomers: sql<number>`COUNT(*) FILTER (WHERE ${customers.customerType} = 'Individual')`,
        companyCustomers: sql<number>`COUNT(*) FILTER (WHERE ${customers.customerType} = 'Company')`,
        totalCreditLimit: sql<number>`SUM(CAST(${customers.creditLimit} AS DECIMAL))`,
      })
      .from(customers)
      .where(eq(customers.companyId, companyId));

    return analytics[0];
  }

  /**
   * Private helper methods
   */
  private async generateCustomerCode(companyId: string): Promise<string> {
    const prefix = 'CUST';

    const [result] = await this.database
      .select({
        maxCode: sql<string>`MAX(CAST(SUBSTRING(${customers.customerCode}, 5) AS INTEGER))`,
      })
      .from(customers)
      .where(
        and(
          eq(customers.companyId, companyId),
          like(customers.customerCode, `${prefix}%`)
        )
      );

    const nextNumber = result?.maxCode ? parseInt(result.maxCode) + 1 : 1;
    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }

  private buildHierarchy(customers: Customer[]): any[] {
    const customerMap = new Map<string, any>();
    const rootCustomers: any[] = [];

    // Create hierarchy objects
    customers.forEach(customer => {
      customerMap.set(customer.id, {
        ...customer,
        children: [],
      });
    });

    // Build hierarchy
    customers.forEach(customer => {
      const hierarchyCustomer = customerMap.get(customer.id)!;

      if (customer.parentCustomerId) {
        const parent = customerMap.get(customer.parentCustomerId);
        if (parent) {
          parent.children.push(hierarchyCustomer);
        } else {
          rootCustomers.push(hierarchyCustomer);
        }
      } else {
        rootCustomers.push(hierarchyCustomer);
      }
    });

    return rootCustomers;
  }

  private async wouldCreateCircularReference(
    customerId: string,
    newParentId: string,
    companyId: string
  ): Promise<boolean> {
    let currentParentId: string | null = newParentId;

    while (currentParentId) {
      if (currentParentId === customerId) {
        return true;
      }

      const parent = await this.findById(currentParentId, companyId);
      currentParentId = parent?.parentCustomerId ?? null;
    }

    return false;
  }

  private async assignCustomersToSegment(
    segmentId: string,
    criteria: Record<string, any>,
    companyId: string
  ): Promise<void> {
    // This is a simplified implementation
    // In a real system, you'd have a more sophisticated criteria evaluation engine

    let query = this.database
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.companyId, companyId));

    // Apply criteria filters (simplified example)
    if (criteria['customerType']) {
      query = (query as any).where(eq(customers.customerType, criteria['customerType']));
    }

    if (criteria['minCreditLimit']) {
      query = (query as any).where(sql`CAST(${customers.creditLimit} AS DECIMAL) >= ${criteria['minCreditLimit']}`);
    }

    const matchingCustomers = await query;

    if (matchingCustomers.length > 0) {
      const memberships = matchingCustomers.map(customer => ({
        customerId: customer.id,
        segmentId,
        companyId,
      }));

      await this.database.insert(customerSegmentMemberships).values(memberships);
    }
  }
}

