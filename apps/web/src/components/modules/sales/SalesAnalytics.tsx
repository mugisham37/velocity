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
import { SalesAnalytics as SalesAnalyticsType, SalesFunnel } from '@/types/sales';
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

interface SalesAnalyticsProps {
  dateRange?: {
    from: string;
    to: string;
  };
  company?: string;
  territory?: string;
  salesPerson?: string;
}

export default function SalesAnalytics({
  dateRange,
  company,
  territory,
  salesPerson
}: SalesAnalyticsProps) {
  const { getList } = useDocuments();
  const { showNotification } = useNotifications();
  
  const [analytics, setAnalytics] = useState<SalesAnalyticsType | null>(null);
  const [salesFunnel, setSalesFunnel] = useState<SalesFunnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, company, territory, salesPerson, selectedPeriod]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // In a real implementation, these would be API calls to get analytics data
      // For now, we'll simulate the data structure
      
      const mockAnalytics: SalesAnalyticsType = {
        total_sales: 1250000,
        total_orders: 156,
        average_order_value: 8012.82,
        top_customers: [
          { customer: 'CUST-001', customer_name: 'ABC Corporation', total_sales: 250000, order_count: 15 },
          { customer: 'CUST-002', customer_name: 'XYZ Industries', total_sales: 180000, order_count: 12 },
          { customer: 'CUST-003', customer_name: 'Tech Solutions Ltd', total_sales: 150000, order_count: 8 },
          { customer: 'CUST-004', customer_name: 'Global Enterprises', total_sales: 120000, order_count: 10 },
          { customer: 'CUST-005', customer_name: 'Innovation Inc', total_sales: 95000, order_count: 7 },
        ],
        sales_trend: [
          { period: 'Jan 2024', sales: 95000, orders: 12 },
          { period: 'Feb 2024', sales: 110000, orders: 14 },
          { period: 'Mar 2024', sales: 125000, orders: 16 },
          { period: 'Apr 2024', sales: 140000, orders: 18 },
          { period: 'May 2024', sales: 135000, orders: 17 },
          { period: 'Jun 2024', sales: 155000, orders: 20 },
          { period: 'Jul 2024', sales: 145000, orders: 19 },
          { period: 'Aug 2024', sales: 160000, orders: 21 },
          { period: 'Sep 2024', sales: 150000, orders: 19 },
          { period: 'Oct 2024', sales: 175000, orders: 23 },
        ],
        territory_wise_sales: [
          { territory: 'North', sales: 450000, percentage: 36 },
          { territory: 'South', sales: 350000, percentage: 28 },
          { territory: 'East', sales: 250000, percentage: 20 },
          { territory: 'West', sales: 200000, percentage: 16 },
        ],
      };

      const mockSalesFunnel: SalesFunnel = {
        leads: 500,
        opportunities: 200,
        quotations: 120,
        orders: 80,
        invoices: 75,
        conversion_rates: {
          lead_to_opportunity: 40,
          opportunity_to_quotation: 60,
          quotation_to_order: 66.7,
          order_to_invoice: 93.8,
        },
      };

      setAnalytics(mockAnalytics);
      setSalesFunnel(mockSalesFunnel);
    } catch (error) {
      console.error('Failed to load sales analytics:', error);
      showNotification('Failed to load sales analytics', 'error');
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

  if (!analytics || !salesFunnel) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  // Chart configurations
  const salesTrendData = {
    labels: analytics.sales_trend.map(item => item.period),
    datasets: [
      {
        label: 'Sales Amount',
        data: analytics.sales_trend.map(item => item.sales),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Number of Orders',
        data: analytics.sales_trend.map(item => item.orders),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const territoryData = {
    labels: analytics.territory_wise_sales.map(item => item.territory),
    datasets: [
      {
        data: analytics.territory_wise_sales.map(item => item.sales),
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

  const topCustomersData = {
    labels: analytics.top_customers.map(customer => customer.customer_name),
    datasets: [
      {
        label: 'Sales Amount',
        data: analytics.top_customers.map(customer => customer.total_sales),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
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

  return (
    <div className="sales-analytics space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Sales Analytics</h2>
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
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₹{analytics.total_sales.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {salesFunnel.conversion_rates.quotation_to_order.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
          <Line data={salesTrendData} options={chartOptions} />
        </div>

        {/* Territory-wise Sales */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Territory-wise Sales</h3>
          <Doughnut 
            data={territoryData} 
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
        {/* Top Customers */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h3>
          <Bar 
            data={topCustomersData} 
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

        {/* Sales Funnel */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Funnel</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
              <span className="font-medium">Leads</span>
              <span className="text-xl font-bold text-blue-600">{salesFunnel.leads}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
              <span className="font-medium">Opportunities</span>
              <div className="text-right">
                <span className="text-xl font-bold text-green-600">{salesFunnel.opportunities}</span>
                <span className="block text-sm text-gray-500">
                  {salesFunnel.conversion_rates.lead_to_opportunity}% conversion
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
              <span className="font-medium">Quotations</span>
              <div className="text-right">
                <span className="text-xl font-bold text-yellow-600">{salesFunnel.quotations}</span>
                <span className="block text-sm text-gray-500">
                  {salesFunnel.conversion_rates.opportunity_to_quotation}% conversion
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
              <span className="font-medium">Orders</span>
              <div className="text-right">
                <span className="text-xl font-bold text-purple-600">{salesFunnel.orders}</span>
                <span className="block text-sm text-gray-500">
                  {salesFunnel.conversion_rates.quotation_to_order}% conversion
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-indigo-50 rounded">
              <span className="font-medium">Invoices</span>
              <div className="text-right">
                <span className="text-xl font-bold text-indigo-600">{salesFunnel.invoices}</span>
                <span className="block text-sm text-gray-500">
                  {salesFunnel.conversion_rates.order_to_invoice}% conversion
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Customers Table */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top Customers Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Order Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.top_customers.map((customer, index) => (
                <tr key={customer.customer} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.customer_name}</div>
                      <div className="text-sm text-gray-500">{customer.customer}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{customer.total_sales.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.order_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{(customer.total_sales / customer.order_count).toLocaleString()}
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