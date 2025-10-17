'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Calendar,
  Download,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { usePOSStore } from '@/stores/pos';

interface POSAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SalesData {
  date: string;
  transactions: number;
  revenue: number;
  items_sold: number;
  avg_transaction: number;
}

interface TopItem {
  item_name: string;
  quantity: number;
  revenue: number;
}

interface PaymentMethodData {
  method: string;
  amount: number;
  percentage: number;
}

export function POSAnalytics({ isOpen, onClose }: POSAnalyticsProps) {
  const { currentProfile } = usePOSStore();
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    summary: {
      totalRevenue: 0,
      totalTransactions: 0,
      totalItems: 0,
      avgTransaction: 0,
      growth: {
        revenue: 0,
        transactions: 0,
      },
    },
    dailySales: [] as SalesData[],
    topItems: [] as TopItem[],
    paymentMethods: [] as PaymentMethodData[],
    hourlyDistribution: [] as {
      hour: number;
      transactions: number;
      revenue: number;
    }[],
  });

  useEffect(() => {
    if (isOpen) {
      loadAnalyticsData();
    }
  }, [isOpen, dateRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // TODO: Fetch actual analytics data from API
      // For now, using mock data
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      setAnalyticsData({
        summary: {
          totalRevenue: 125430.5,
          totalTransactions: 342,
          totalItems: 1247,
          avgTransaction: 366.75,
          growth: {
            revenue: 12.5,
            transactions: 8.3,
          },
        },
        dailySales: [
          {
            date: '2024-01-15',
            transactions: 45,
            revenue: 16420.3,
            items_sold: 156,
            avg_transaction: 365.12,
          },
          {
            date: '2024-01-16',
            transactions: 52,
            revenue: 18950.75,
            items_sold: 189,
            avg_transaction: 364.44,
          },
          {
            date: '2024-01-17',
            transactions: 38,
            revenue: 13875.2,
            items_sold: 142,
            avg_transaction: 365.14,
          },
          {
            date: '2024-01-18',
            transactions: 61,
            revenue: 22340.8,
            items_sold: 234,
            avg_transaction: 366.24,
          },
          {
            date: '2024-01-19',
            transactions: 48,
            revenue: 17650.45,
            items_sold: 178,
            avg_transaction: 367.72,
          },
          {
            date: '2024-01-20',
            transactions: 55,
            revenue: 20193.0,
            items_sold: 201,
            avg_transaction: 367.15,
          },
          {
            date: '2024-01-21',
            transactions: 43,
            revenue: 16000.0,
            items_sold: 147,
            avg_transaction: 372.09,
          },
        ],
        topItems: [
          { item_name: 'Coffee - Espresso', quantity: 156, revenue: 7800.0 },
          { item_name: 'Sandwich - Club', quantity: 89, revenue: 6230.0 },
          { item_name: 'Pastry - Croissant', quantity: 134, revenue: 4020.0 },
          { item_name: 'Juice - Orange', quantity: 78, revenue: 3120.0 },
          { item_name: 'Salad - Caesar', quantity: 45, revenue: 2925.0 },
        ],
        paymentMethods: [
          { method: 'Cash', amount: 45230.5, percentage: 36.1 },
          { method: 'Card', amount: 62150.75, percentage: 49.5 },
          { method: 'UPI', amount: 18049.25, percentage: 14.4 },
        ],
        hourlyDistribution: [
          { hour: 9, transactions: 12, revenue: 4320.5 },
          { hour: 10, transactions: 18, revenue: 6540.75 },
          { hour: 11, transactions: 25, revenue: 9125.3 },
          { hour: 12, transactions: 35, revenue: 12850.6 },
          { hour: 13, transactions: 42, revenue: 15420.8 },
          { hour: 14, transactions: 38, revenue: 13950.45 },
          { hour: 15, transactions: 32, revenue: 11740.2 },
          { hour: 16, transactions: 28, revenue: 10230.75 },
          { hour: 17, transactions: 45, revenue: 16540.3 },
          { hour: 18, transactions: 52, revenue: 19120.85 },
          { hour: 19, transactions: 38, revenue: 13950.2 },
          { hour: 20, transactions: 17, revenue: 6230.75 },
        ],
      });
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = () => {
    // TODO: Implement data export functionality
    console.warn('Export functionality not yet implemented');
  };

  if (!isOpen) return null;

  return (
    <div className='bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black'>
      <div className='max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-xl'>
        {/* Header */}
        <div className='border-b border-gray-200 bg-gray-50 p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-xl font-semibold text-gray-900'>
                POS Analytics
              </h2>
              <p className='mt-1 text-sm text-gray-600'>
                Sales performance and insights for{' '}
                {currentProfile?.pos_profile_name}
              </p>
            </div>
            <div className='flex items-center space-x-3'>
              <Button variant='outline' size='sm' onClick={exportData}>
                <Download className='mr-2 h-4 w-4' />
                Export
              </Button>
              <Button variant='ghost' size='sm' onClick={onClose}>
                ×
              </Button>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className='mt-4 flex items-center space-x-4'>
            <div className='flex items-center space-x-2'>
              <Calendar className='h-4 w-4 text-gray-500' />
              <span className='text-sm text-gray-600'>Date Range:</span>
            </div>
            <Input
              type='date'
              value={dateRange.from}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, from: e.target.value }))
              }
              className='w-auto'
            />
            <span className='text-gray-500'>to</span>
            <Input
              type='date'
              value={dateRange.to}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, to: e.target.value }))
              }
              className='w-auto'
            />
            <Button
              variant='outline'
              size='sm'
              onClick={loadAnalyticsData}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className='h-4 w-4 animate-spin' />
              ) : (
                <Filter className='h-4 w-4' />
              )}
            </Button>
          </div>
        </div>

        <div className='max-h-[calc(90vh-140px)] overflow-y-auto p-6'>
          {isLoading ? (
            <div className='flex h-64 items-center justify-center'>
              <div className='text-center'>
                <RefreshCw className='mx-auto mb-2 h-8 w-8 animate-spin text-gray-400' />
                <p className='text-gray-600'>Loading analytics data...</p>
              </div>
            </div>
          ) : (
            <div className='space-y-6'>
              {/* Summary Cards */}
              <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
                <SummaryCard
                  title='Total Revenue'
                  value={`₹${analyticsData.summary.totalRevenue.toLocaleString()}`}
                  growth={analyticsData.summary.growth.revenue}
                  icon={<DollarSign className='h-5 w-5' />}
                  color='green'
                />
                <SummaryCard
                  title='Transactions'
                  value={analyticsData.summary.totalTransactions.toLocaleString()}
                  growth={analyticsData.summary.growth.transactions}
                  icon={<ShoppingBag className='h-5 w-5' />}
                  color='blue'
                />
                <SummaryCard
                  title='Items Sold'
                  value={analyticsData.summary.totalItems.toLocaleString()}
                  icon={<BarChart3 className='h-5 w-5' />}
                  color='purple'
                />
                <SummaryCard
                  title='Avg Transaction'
                  value={`₹${analyticsData.summary.avgTransaction.toFixed(2)}`}
                  icon={<TrendingUp className='h-5 w-5' />}
                  color='orange'
                />
              </div>

              <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                {/* Daily Sales Chart */}
                <div className='rounded-lg border border-gray-200 bg-white p-4'>
                  <h3 className='mb-4 font-semibold text-gray-900'>
                    Daily Sales Trend
                  </h3>
                  <div className='flex h-64 items-end justify-between space-x-2'>
                    {analyticsData.dailySales.map((day) => (
                      <div
                        key={day.date}
                        className='flex flex-1 flex-col items-center'
                      >
                        <div
                          className='w-full rounded-t bg-blue-500'
                          style={{
                            height: `${(day.revenue / Math.max(...analyticsData.dailySales.map((d) => d.revenue))) * 200}px`,
                            minHeight: '4px',
                          }}
                        />
                        <div className='mt-2 text-center text-xs text-gray-600'>
                          {new Date(day.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                          })}
                        </div>
                        <div className='text-xs font-medium text-gray-900'>
                          ₹{(day.revenue / 1000).toFixed(1)}k
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Items */}
                <div className='rounded-lg border border-gray-200 bg-white p-4'>
                  <h3 className='mb-4 font-semibold text-gray-900'>
                    Top Selling Items
                  </h3>
                  <div className='space-y-3'>
                    {analyticsData.topItems.map((item, index) => (
                      <div
                        key={item.item_name}
                        className='flex items-center justify-between'
                      >
                        <div className='flex items-center space-x-3'>
                          <div className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600'>
                            {index + 1}
                          </div>
                          <div>
                            <div className='font-medium text-gray-900'>
                              {item.item_name}
                            </div>
                            <div className='text-sm text-gray-600'>
                              {item.quantity} units
                            </div>
                          </div>
                        </div>
                        <div className='text-right'>
                          <div className='font-medium text-gray-900'>
                            ₹{item.revenue.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Methods */}
                <div className='rounded-lg border border-gray-200 bg-white p-4'>
                  <h3 className='mb-4 font-semibold text-gray-900'>
                    Payment Methods
                  </h3>
                  <div className='space-y-3'>
                    {analyticsData.paymentMethods.map((method) => (
                      <div
                        key={method.method}
                        className='flex items-center justify-between'
                      >
                        <div className='flex items-center space-x-3'>
                          <div className='font-medium text-gray-900'>
                            {method.method}
                          </div>
                        </div>
                        <div className='text-right'>
                          <div className='font-medium text-gray-900'>
                            ₹{method.amount.toLocaleString()}
                          </div>
                          <div className='text-sm text-gray-600'>
                            {method.percentage}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hourly Distribution */}
                <div className='rounded-lg border border-gray-200 bg-white p-4'>
                  <h3 className='mb-4 font-semibold text-gray-900'>
                    Hourly Sales Distribution
                  </h3>
                  <div className='flex h-32 items-end justify-between space-x-1'>
                    {analyticsData.hourlyDistribution.map((hour) => (
                      <div
                        key={hour.hour}
                        className='flex flex-1 flex-col items-center'
                      >
                        <div
                          className='w-full rounded-t bg-green-500'
                          style={{
                            height: `${(hour.transactions / Math.max(...analyticsData.hourlyDistribution.map((h) => h.transactions))) * 100}px`,
                            minHeight: '2px',
                          }}
                        />
                        <div className='mt-1 text-xs text-gray-600'>
                          {hour.hour}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  growth?: number;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'purple' | 'orange';
}

function SummaryCard({ title, value, growth, icon, color }: SummaryCardProps) {
  const colorClasses = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className='rounded-lg border border-gray-200 bg-white p-4'>
      <div className='flex items-center justify-between'>
        <div className={`rounded-lg p-2 ${colorClasses[color]}`}>{icon}</div>
        {growth !== undefined && (
          <div
            className={`flex items-center text-sm ${
              growth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <TrendingUp className='mr-1 h-3 w-3' />
            {growth >= 0 ? '+' : ''}
            {growth}%
          </div>
        )}
      </div>
      <div className='mt-3'>
        <div className='text-2xl font-semibold text-gray-900'>{value}</div>
        <div className='text-sm text-gray-600'>{title}</div>
      </div>
    </div>
  );
}
