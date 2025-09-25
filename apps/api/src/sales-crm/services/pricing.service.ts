import { Database, db } from '@kiro/database';
import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export interface PricingRule {
  id: str;
  e: string;
  type: 'volume' | 'customer' | 'product' | 'seasonal' | 'promotional';
  conditions: {
    minQuantity?: number;
    maxQuantity?: number;
    customerIds?: string[];
    productIds?: string[];
    startDate?: Date;
    endDate?: Date;
  };
  discount: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  priority: number;
  isActive: boolean;
}

export interface PricingContext {
  customerId: string;
  itemCode: string;
  quantity: number;
  basePrice: number;
  currency: string;
  orderDate: Date;
}

export interface PricingResult {
  basePrice: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
  appliedRules: string[];
}

@Injectable()
export class PricingService {
  private database: Database;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.database = db;
  }

  /**
   * Calculate dynamic pricing for an item
   */
  async calculatePrice(
    context: PricingContext,
    companyId: string
  ): Promise<PricingResult> {
    try {
      this.logger.info('Calculating dynamic pricing', { context, companyId });

      // Get applicable pricing rules
      const applicableRules = await this.getApplicablePricingRules(
        context,
        companyId
      );

      // Sort rules by priority (higher priority first)
      applicableRules.sort((a, b) => b.priority - a.priority);

      let finalPrice = context.basePrice;
      let totalDiscountPercent = 0;
      let totalDiscountAmount = 0;
      const appliedRules: string[] = [];

      // Apply pricing rules
      for (const rule of applicableRules) {
        const ruleDiscount = this.calculateRuleDiscount(
          rule,
          context,
          finalPrice
        );

        if (ruleDiscount.amount > 0) {
          if (rule.discount.type === 'percentage') {
            totalDiscountPercent += ruleDiscount.percent;
          }
          totalDiscountAmount += ruleDiscount.amount;
          finalPrice -= ruleDiscount.amount;
          appliedRules.push(rule.name);

          this.logger.info('Applied pricing rule', {
            ruleName: rule.name,
            discountAmount: ruleDiscount.amount,
            discountPercent: ruleDiscount.percent,
          });
        }
      }

      // Ensure final price is not negative
      finalPrice = Math.max(0, finalPrice);

      const result: PricingResult = {
        basePrice: context.basePrice,
        discountPercent: totalDiscountPercent,
        discountAmount: totalDiscountAmount,
        finalPrice,
        appliedRules,
      };

      this.logger.info('Calculated pricing result', { result });

      return result;
    } catch (error) {
      this.logger.error('Failed to calculate pricing', { error, context });
      throw error;
    }
  }

  /**
   * Calculate bulk pricing for multiple items
   */
  async calculateBulkPricing(
    items: PricingContext[],
    companyId: string
  ): Promise<PricingResult[]> {
    try {
      this.logger.info('Calculating bulk pricing', {
        itemCount: items.length,
        companyId,
      });

      const results = await Promise.all(
        items.map(item => this.calculatePrice(item, companyId))
      );

      // Apply bulk discounts if applicable
      const bulkDiscountRules = await this.getBulkDiscountRules(
        items,
        companyId
      );

      if (bulkDiscountRules.length > 0) {
        const totalOrderValue = results.reduce(
          (sum, result) => sum + result.finalPrice,
          0
        );

        for (const rule of bulkDiscountRules) {
          if (this.isBulkRuleApplicable(rule, items, totalOrderValue)) {
            const bulkDiscount = this.calculateBulkDiscount(
              rule,
              totalOrderValue
            );

            // Distribute bulk discount proportionally across items
            results.forEach(result => {
              const proportion = result.finalPrice / totalOrderValue;
              const itemBulkDiscount = bulkDiscount * proportion;

              result.discountAmount += itemBulkDiscount;
              result.finalPrice -= itemBulkDiscount;
              result.appliedRules.push(`Bulk: ${rule.name}`);
            });

            this.logger.info('Applied bulk discount rule', {
              ruleName: rule.name,
              totalDiscount: bulkDiscount,
            });
          }
        }
      }

      return results;
    } catch (error) {
      this.logger.error('Failed to calculate bulk pricing', { error, items });
      throw error;
    }
  }

  /**
   * Get customer-specific pricing
   */
  async getCustomerPricing(
    customerId: string,
    itemCode: string,
    companyId: string
  ): Promise<{ basePrice: number; currency: string } | null> {
    try {
      // This would typically query a customer-specific price list
      // For now, we'll return null to use standard pricing
      return null;
    } catch (error) {
      this.logger.error('Failed to get customer pricing', {
        error,
        customerId,
        itemCode,
      });
      throw error;
    }
  }

  /**
   * Validate discount limits
   */
  async validateDiscountLimits(
    discountPercent: number,
    discountAmount: number,
    userId: string,
    companyId: string
  ): Promise<{
    isValid: boolean;
    requiresApproval: boolean;
    message?: string;
  }> {
    try {
      // Get user's discount limits (this would come from user roles/permissions)
      const userDiscountLimit = await this.getUserDiscountLimit(
        userId,
        companyId
      );

      if (discountPercent > userDiscountLimit.maxDiscountPercent) {
        return {
          isValid: false,
          requiresApproval: true,
          message: `Discount of ${discountPercent}% exceeds your limit of ${userDiscountLimit.maxDiscountPercent}%. Approval required.`,
        };
      }

      if (discountAmount > userDiscountLimit.maxDiscountAmount) {
        return {
          isValid: false,
          requiresApproval: true,
          message: `Discount amount of ${discountAmount} exceeds your limit of ${userDiscountLimit.maxDiscountAmount}. Approval required.`,
        };
      }

      return { isValid: true, requiresApproval: false };
    } catch (error) {
      this.logger.error('Failed to validate discount limits', {
        error,
        discountPercent,
        discountAmount,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get applicable pricing rules for a context
   */
  private async getApplicablePricingRules(
    context: PricingContext,
    companyId: string
  ): Promise<PricingRule[]> {
    // This would typically query the database for pricing rules
    // For now, we'll return some mock rules
    const mockRules: PricingRule[] = [
      {
        id: '1',
        name: 'Volume Discount 10+',
        type: 'volume',
        conditions: { minQuantity: 10 },
        discount: { type: 'percentage', value: 5 },
        priority: 10,
        isActive: true,
      },
      {
        id: '2',
        name: 'Volume Discount 50+',
        type: 'volume',
        conditions: { minQuantity: 50 },
        discount: { type: 'percentage', value: 10 },
        priority: 20,
        isActive: true,
      },
      {
        id: '3',
        name: 'VIP Customer Discount',
        type: 'customer',
        conditions: { customerIds: [context.customerId] },
        discount: { type: 'percentage', value: 15 },
        priority: 30,
        isActive: true,
      },
    ];

    return mockRules.filter(rule => this.isRuleApplicable(rule, context));
  }

  /**
   * Check if a pricing rule is applicable to the context
   */
  private isRuleApplicable(
    rule: PricingRule,
    context: PricingContext
  ): boolean {
    if (!rule.isActive) return false;

    const { conditions } = rule;

    // Check quantity conditions
    if (conditions.minQuantity && context.quantity < conditions.minQuantity) {
      return false;
    }

    if (conditions.maxQuantity && context.quantity > conditions.maxQuantity) {
      return false;
    }

    // Check customer conditions
    if (
      conditions.customerIds &&
      !conditions.customerIds.includes(context.customerId)
    ) {
      return false;
    }

    // Check product conditions
    if (
      conditions.productIds &&
      !conditions.productIds.includes(context.itemCode)
    ) {
      return false;
    }

    // Check date conditions
    if (conditions.startDate && context.orderDate < conditions.startDate) {
      return false;
    }

    if (conditions.endDate && context.orderDate > conditions.endDate) {
      return false;
    }

    return true;
  }

  /**
   * Calculate discount for a specific rule
   */
  private calculateRuleDiscount(
    rule: PricingRule,
    context: PricingContext,
    currentPrice: number
  ): { amount: number; percent: number } {
    const { discount } = rule;

    if (discount.type === 'percentage') {
      const amount = (currentPrice * discount.value) / 100;
      return { amount, percent: discount.value };
    } else {
      // Fixed discount
      const amount = Math.min(discount.value, currentPrice);
      const percent = currentPrice > 0 ? (amount / currentPrice) * 100 : 0;
      return { amount, percent };
    }
  }

  /**
   * Get bulk discount rules
   */
  private async getBulkDiscountRules(
    items: PricingContext[],
    companyId: string
  ): Promise<PricingRule[]> {
    // Mock bulk discount rules
    return [
      {
        id: 'bulk1',
        name: 'Order Value $1000+',
        type: 'volume',
        conditions: { minQuantity: 1000 }, // Using minQuantity as minOrderValue for simplicity
        discount: { type: 'percentage', value: 3 },
        priority: 5,
        isActive: true,
      },
    ];
  }

  /**
   * Check if bulk rule is applicable
   */
  private isBulkRuleApplicable(
    rule: PricingRule,
    items: PricingContext[],
    totalOrderValue: number
  ): boolean {
    if (!rule.isActive) return false;

    // For simplicity, using minQuantity as minOrderValue
    if (
      rule.conditions.minQuantity &&
      totalOrderValue < rule.conditions.minQuantity
    ) {
      return false;
    }

    return true;
  }

  /**
   * Calculate bulk discount
   */
  private calculateBulkDiscount(
    rule: PricingRule,
    totalOrderValue: number
  ): number {
    if (rule.discount.type === 'percentage') {
      return (totalOrderValue * rule.discount.value) / 100;
    } else {
      return Math.min(rule.discount.value, totalOrderValue);
    }
  }

  /**
   * Get user's discount limits
   */
  private async getUserDiscountLimit(
    userId: string,
    companyId: string
  ): Promise<{ maxDiscountPercent: number; maxDiscountAmount: number }> {
    // This would typically query user roles and permissions
    // For now, return default limits
    return {
      maxDiscountPercent: 20,
      maxDiscountAmount: 1000,
    };
  }
}
