'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PricingRule, SalesOrderItem } from '@/types/sales';
import { useDocuments } from '@/hooks/useDocuments';
import { useNotifications } from '@/hooks/useNotifications';

interface PricingRuleEngineProps {
  customer?: string;
  customerGroup?: string;
  territory?: string;
  priceList?: string;
  currency?: string;
  transactionDate?: string;
  items: SalesOrderItem[];
  onPriceUpdate?: (itemIndex: number, newRate: number, appliedRule?: PricingRule) => void;
  disabled?: boolean;
}

interface AppliedRule {
  rule: PricingRule;
  itemIndex: number;
  originalRate: number;
  newRate: number;
  discountAmount?: number;
  discountPercentage?: number;
}

export default function PricingRuleEngine({
  customer,
  customerGroup,
  territory,
  priceList,
  currency,
  transactionDate,
  items,
  onPriceUpdate,
  disabled = false
}: PricingRuleEngineProps) {
  const { getList } = useDocuments();
  const { showNotification } = useNotifications();
  
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [appliedRules, setAppliedRules] = useState<AppliedRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoApply, setAutoApply] = useState(true);

  // Load pricing rules when dependencies change
  useEffect(() => {
    if (!disabled && (customer || customerGroup || territory || priceList)) {
      loadPricingRules();
    }
  }, [customer, customerGroup, territory, priceList, currency, transactionDate, disabled]);

  // Apply pricing rules when rules or items change
  useEffect(() => {
    if (!disabled && autoApply && pricingRules.length > 0 && items.length > 0) {
      applyPricingRules();
    }
  }, [pricingRules, items, autoApply, disabled]);

  const loadPricingRules = async () => {
    setLoading(true);
    try {
      const filters: Record<string, any> = {
        disable: 0,
      };

      // Add date filters
      if (transactionDate) {
        filters.valid_from = ['<=', transactionDate];
        filters.valid_upto = ['>=', transactionDate];
      }

      // Add customer/group/territory filters
      if (customer) {
        filters.customer = customer;
      } else if (customerGroup) {
        filters.customer_group = customerGroup;
      } else if (territory) {
        filters.territory = territory;
      }

      // Add price list filter
      if (priceList) {
        filters.for_price_list = priceList;
      }

      // Add currency filter
      if (currency) {
        filters.currency = currency;
      }

      const response = await getList('Pricing Rule', {
        filters,
        fields: [
          'name', 'title', 'apply_on', 'applicable_for',
          'item_code', 'item_group', 'brand',
          'customer', 'customer_group', 'territory',
          'min_qty', 'max_qty', 'min_amount', 'max_amount',
          'rate_or_discount', 'rate', 'discount_percentage', 'discount_amount',
          'valid_from', 'valid_upto', 'priority',
          'apply_multiple_pricing_rules', 'for_price_list', 'currency'
        ],
        order_by: 'priority desc, creation desc',
        limit: 100,
      });

      setPricingRules(response.data);
    } catch (error) {
      console.error('Failed to load pricing rules:', error);
      showNotification('Failed to load pricing rules', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyPricingRules = useCallback(() => {
    const newAppliedRules: AppliedRule[] = [];

    items.forEach((item, itemIndex) => {
      if (!item.item_code || item.qty <= 0) return;

      // Find applicable rules for this item
      const applicableRules = pricingRules.filter(rule => 
        isRuleApplicable(rule, item, itemIndex)
      );

      if (applicableRules.length === 0) return;

      // Sort by priority (higher priority first)
      applicableRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));

      // Apply the highest priority rule (or multiple if allowed)
      const rulesToApply = applicableRules[0].apply_multiple_pricing_rules 
        ? applicableRules 
        : [applicableRules[0]];

      rulesToApply.forEach(rule => {
        const appliedRule = applyRule(rule, item, itemIndex);
        if (appliedRule) {
          newAppliedRules.push(appliedRule);
        }
      });
    });

    setAppliedRules(newAppliedRules);

    // Notify parent component of price updates
    newAppliedRules.forEach(appliedRule => {
      onPriceUpdate?.(
        appliedRule.itemIndex, 
        appliedRule.newRate, 
        appliedRule.rule
      );
    });
  }, [pricingRules, items, onPriceUpdate]);

  const isRuleApplicable = (rule: PricingRule, item: SalesOrderItem, itemIndex: number): boolean => {
    // Check apply_on condition
    switch (rule.apply_on) {
      case 'Item Code':
        if (rule.item_code && rule.item_code !== item.item_code) return false;
        break;
      case 'Item Group':
        if (rule.item_group && rule.item_group !== item.item_group) return false;
        break;
      case 'Brand':
        if (rule.brand && rule.brand !== item.brand) return false;
        break;
    }

    // Check applicable_for condition
    if (rule.applicable_for) {
      switch (rule.applicable_for) {
        case 'Customer':
          if (rule.customer && rule.customer !== customer) return false;
          break;
        case 'Customer Group':
          if (rule.customer_group && rule.customer_group !== customerGroup) return false;
          break;
        case 'Territory':
          if (rule.territory && rule.territory !== territory) return false;
          break;
      }
    }

    // Check quantity conditions
    if (rule.min_qty && item.qty < rule.min_qty) return false;
    if (rule.max_qty && item.qty > rule.max_qty) return false;

    // Check amount conditions
    const itemAmount = item.qty * item.rate;
    if (rule.min_amount && itemAmount < rule.min_amount) return false;
    if (rule.max_amount && itemAmount > rule.max_amount) return false;

    return true;
  };

  const applyRule = (rule: PricingRule, item: SalesOrderItem, itemIndex: number): AppliedRule | null => {
    const originalRate = item.rate;
    let newRate = originalRate;
    let discountAmount = 0;
    let discountPercentage = 0;

    switch (rule.rate_or_discount) {
      case 'Rate':
        if (rule.rate !== undefined) {
          newRate = rule.rate;
        }
        break;
      
      case 'Discount Percentage':
        if (rule.discount_percentage !== undefined) {
          discountPercentage = rule.discount_percentage;
          discountAmount = (originalRate * discountPercentage) / 100;
          newRate = originalRate - discountAmount;
        }
        break;
      
      case 'Discount Amount':
        if (rule.discount_amount !== undefined) {
          discountAmount = rule.discount_amount;
          newRate = originalRate - discountAmount;
          discountPercentage = (discountAmount / originalRate) * 100;
        }
        break;
    }

    // Ensure new rate is not negative
    newRate = Math.max(0, newRate);

    if (newRate !== originalRate) {
      return {
        rule,
        itemIndex,
        originalRate,
        newRate,
        discountAmount,
        discountPercentage,
      };
    }

    return null;
  };

  const removeAppliedRule = (ruleIndex: number) => {
    const rule = appliedRules[ruleIndex];
    const newAppliedRules = appliedRules.filter((_, index) => index !== ruleIndex);
    setAppliedRules(newAppliedRules);

    // Restore original rate
    onPriceUpdate?.(rule.itemIndex, rule.originalRate);
  };

  const clearAllRules = () => {
    appliedRules.forEach(rule => {
      onPriceUpdate?.(rule.itemIndex, rule.originalRate);
    });
    setAppliedRules([]);
  };

  if (disabled) {
    return null;
  }

  return (
    <div className="pricing-rule-engine bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Pricing Rules</h3>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoApply}
              onChange={(e) => setAutoApply(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Auto Apply</span>
          </label>
          <button
            onClick={loadPricingRules}
            disabled={loading}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh Rules'}
          </button>
          {!autoApply && (
            <button
              onClick={applyPricingRules}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Apply Rules
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading pricing rules...</p>
        </div>
      )}

      {!loading && pricingRules.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <p>No applicable pricing rules found</p>
        </div>
      )}

      {!loading && pricingRules.length > 0 && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Available Rules ({pricingRules.length})
            </h4>
            <div className="max-h-32 overflow-y-auto">
              <div className="space-y-1">
                {pricingRules.map((rule, index) => (
                  <div key={rule.name} className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                    <span className="font-medium">{rule.title || rule.name}</span>
                    {' - '}
                    <span>{rule.apply_on}: {rule.item_code || rule.item_group || rule.brand || 'All'}</span>
                    {' - '}
                    <span>
                      {rule.rate_or_discount === 'Rate' && `Rate: ${rule.rate}`}
                      {rule.rate_or_discount === 'Discount Percentage' && `${rule.discount_percentage}% off`}
                      {rule.rate_or_discount === 'Discount Amount' && `${rule.discount_amount} off`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {appliedRules.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">
                  Applied Rules ({appliedRules.length})
                </h4>
                <button
                  onClick={clearAllRules}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-2">
                {appliedRules.map((appliedRule, index) => {
                  const item = items[appliedRule.itemIndex];
                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded text-xs">
                      <div>
                        <span className="font-medium">{item.item_name || item.item_code}</span>
                        <span className="text-gray-600 ml-2">
                          {appliedRule.originalRate.toFixed(2)} → {appliedRule.newRate.toFixed(2)}
                        </span>
                        {appliedRule.discountPercentage && (
                          <span className="text-green-600 ml-2">
                            ({appliedRule.discountPercentage.toFixed(1)}% off)
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeAppliedRule(index)}
                        className="text-red-600 hover:text-red-800 ml-2"
                        title="Remove rule"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}