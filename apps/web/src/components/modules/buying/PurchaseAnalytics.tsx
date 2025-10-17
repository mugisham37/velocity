'use client';

import React, { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement,
  Title, 
  Tooltip, 
  Legend,
  ArcElement 
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { PurchaseAnalytics as PurchaseAnalyticsType, SupplierPerformance } from '@/types/buying';
import { useDocuments } from '@/hooks/useDocuments';
import { useNotifications } from '@/hooks/useNotifications';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface PurchaseAnalyticsProps {
  dateRange?: {
    from: string;
    to: string;
  };
  company?: string;
  supplier?: string;
  category?: string;
}

export default function PurchaseAnalytics({
  dateRange,
  company,
  supplier,
  category
}: PurchaseAnalyticsProps) {
  const { getList } = useDocuments();
  const { showNotification } = useNotifications();
  
  const [analytics, setAnalytics] = useState<PurchaseAnalyticsType | null>(null);
  const [supplierPerformance, setSupplierPerformance] = useState<SupplierPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, company, supplier, category, selectedPeriod]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // In a real implementation, these would be API calls to get analytics data
      // For now, we'll simulate the data structure
      
      const mockAnalytics: PurchaseAnalyticsType = {
        total_purchases: 850000,
        total_orders: 89,
        average_order_value: 9550.56,
        top_suppliers: [
          { supplier: 'SUP-001', supplier_name: 'Global Supplies Inc', total_purchases: 180000, order_count: 12 },
          { supplier: 'SUP-002', supplier_name: 'Tech Components Ltd', total_purchases: 150000, order_count: 10 },
          { supplier: 'SUP-003', supplier_name: 'Industrial Materials Co', total_purchases: 120000, order_count: 8 },
          { supplier: 'SUP-004', supplier_name: 'Quality Parts Supplier', total_purchases: 95000, order_count: 7 },
          { supplier: 'SUP-005', supplier_name: 'Reliable Vendors', total_purchases: 80000, order_count: 6 },
        ],
        purchase_trend: [
          { period: 'Jan 2024', purchases: 65000, orders: 8 },
          { period: 'Feb 2024', purchases: 72000, orders: 9 },
          { period: 'Mar 2024', purchases: 85000, orders: 11 },
          { period: 'Apr 2024', purchases: 78000, orders: 10 },
          { period: 'May 2024', purchases: 92000, orders: 12 },
          { period: 'Jun 2024', purchases: 88000, orders: 11 },
          { period: 'Jul 2024', purchases: 95000, orders: 13 },
          { period: 'Aug 2024', purchases: 82000, orders: 10 },
          { period: 'Sep 2024', purchases: 105000, orders: 14 },
          { period: 'Oct 2024', purchases: 98000, orders: 12 },
        ],
        category_wise_purchases: [
          { category: 'Raw Materials', purchases: 320000, percentage: 37.6 },
          { category: 'Components', purchases: 250000, percentage: 29.4 },
          { category: 'Equipment', purchases: 150000, percentage: 17.6 },
          { category: 'Services', purchases: 130000, percentage: 15.3 },
        ],
      };

      const mockSupplierPerformance: SupplierPerformance[] = [
        {
          supplier: 'SUP-001',
          supplier_name: 'Global Supplies Inc',
          total_orders: 12,
          total_amount: 180000,
          on_time_delivery_rate: 95.5,
          quality_rating: 4.8,
          average_lead_time: 7.2,
          last_purchase_date: '2024-10-15',
        },
        {
          supplier: 'SUP-002',
          supplier_name: 'Tech Components Ltd',
          total_orders: 10,
          total_amount: 150000,
          on_time_delivery_rate: 88.0,
          quality_rating: 4.6,
          average_lead_time: 9.5,
          last_purchase_date: '2024-10-12',
        },
        {
          supplier: 'SUP-003',
          supplier_name: 'Industrial Materials Co',
          total_orders: 8,
          total_amount: 120000,
          on_time_delivery_rate: 92.3,
          quality_rating: 4.7,
          average_lead_time: 6.8,
          last_purchase_date: '2024-10-10',
        },
        {
          supplier: 'SUP-004',
          supplier_name: 'Quality Parts Supplier',
          total_orders: 7,
          total_amount: 95000,
          on_time_delivery_rate: 85.7,
          quality_rating: 4.9,
          average_lead_time: 8.1,
          last_purchase_date: '2024-10-08',
        },
        {
          supplier: 'SUP-005',
          supplier_name: 'Reliable Vendors',
          total_orders: 6,
          total_amount: 80000,
          on_time_delivery_rate: 90.0,
          quality_rating: 4.5,
          average_lead_time: 10.2,
          last_purchase_date: '2024-10-05',
        },
      ];

      setAnalytics(mockAnalytics);
      setSupplierPerformance(mockSupplierPerformance);
    } catch (error) {
      console.error('Failed to load purchase analytics:', error);
      showNotification('Failed to load purchase analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  // Chart configurations
  const purchaseTrendData = {
    labels: analytics.purchase_trend.map(item => item.period),
    datasets: [
      {
        label: 'Purchase Amount',
        data: analytics.purchase_trend.map(item => item.purchases),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Number of Orders',
        data: analytics.purchase_trend.map(item => item.orders),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const categoryData = {
    labels: analytics.category_wise_purchases.map(item => item.category),
    datasets: [
      {
        data: analytics.category_wise_purchases.map(item => item.purchases),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const topSuppliersData = {
    labels: analytics.top_suppliers.map(supplier => supplier.supplier_name),
    datasets: [
      {
        label: 'Purchase Amount',
        data: analytics.top_suppliers.map(supplier => supplier.total_purchases),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const supplierPerformanceData = {
    labels: supplierPerformance.map(supplier => supplier.supplier_name),
    datasets: [
      {
        label: 'On-time Delivery Rate (%)',
        data: supplierPerformance.map(supplier => supplier.on_time_delivery_rate),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        label: 'Quality Rating',
        data: supplierPerformance.map(supplier => supplier.quality_rating),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const performanceChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        min: 0,
        max: 100,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: 0,
        max: 5,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="purchase-analytics space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Purchase Analytics</h2>
        <div className="flex space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Purchases</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₹{analytics.total_purchases.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.total_orders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₹{analytics.average_order_value.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Delivery Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {(supplierPerformance.reduce((sum, s) => sum + s.on_time_delivery_rate, 0) / supplierPerformance.length).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Purchase Trend */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Trend</h3>
          <Line data={purchaseTrendData} options={chartOptions} />
        </div>

        {/* Category-wise Purchases */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category-wise Purchases</h3>
          <Doughnut 
            data={categoryData} 
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom',
                },
              },
            }}
          />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Suppliers */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Suppliers</h3>
          <Bar 
            data={topSuppliersData} 
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>

        {/* Supplier Performance */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Performance</h3>
          <Bar data={supplierPerformanceData} options={performanceChartOptions} />
        </div>
      </div>

      {/* Supplier Performance Table */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Supplier Performance Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  On-time Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Lead Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Purchase
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {supplierPerformance.map((supplier, index) => (
                <tr key={supplier.supplier} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{supplier.supplier_name}</div>
                      <div className="text-sm text-gray-500">{supplier.supplier}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{supplier.total_amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {supplier.total_orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${supplier.on_time_delivery_rate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{supplier.on_time_delivery_rate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-4 w-4 ${i < Math.floor(supplier.quality_rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-900">{supplier.quality_rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {supplier.average_lead_time} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(supplier.last_purchase_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}