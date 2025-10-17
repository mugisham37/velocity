'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Target, 
  DollarSign,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

const CRMAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('last_30_days');

  // Mock data - in real implementation, this would come from API
  const analyticsData = {
    overview: {
      totalLeads: 1250,
      leadGrowth: 12.5,
      totalOpportunities: 89,
      opportunityGrowth: 8.3,
      totalCustomers: 456,
      customerGrowth: 15.2,
      totalRevenue: 2850000,
      revenueGrowth: 22.1,
      conversionRate: 18.5,
      conversionGrowth: 2.3,
      avgDealSize: 32000,
      dealSizeGrowth: -5.2
    },
    salesFunnel: {
      leads: 1250,
      qualified: 890,
      opportunities: 89,
      quotations: 45,
      customers: 23
    },
    leadSources: [
      { source: 'Website', count: 450, conversion: 22.1, revenue: 850000 },
      { source: 'Email Campaign', count: 320, conversion: 18.5, revenue: 620000 },
      { source: 'Referral', count: 280, conversion: 28.3, revenue: 780000 },
      { source: 'Social Media', count: 150, conversion: 12.8, revenue: 320000 },
      { source: 'Trade Show', count: 50, conversion: 35.2, revenue: 280000 }
    ],
    territoryPerformance: [
      { territory: 'North America', leads: 520, opportunities: 35, customers: 180, revenue: 1200000 },
      { territory: 'Europe', leads: 380, opportunities: 28, customers: 145, revenue: 890000 },
      { territory: 'Asia Pacific', leads: 250, opportunities: 18, customers: 95, revenue: 560000 },
      { territory: 'Latin America', leads: 100, opportunities: 8, customers: 36, revenue: 200000 }
    ],
    monthlyTrends: [
      { month: 'Oct', leads: 95, opportunities: 8, customers: 4, revenue: 180000 },
      { month: 'Nov', leads: 110, opportunities: 12, customers: 6, revenue: 240000 },
      { month: 'Dec', leads: 125, opportunities: 15, customers: 8, revenue: 320000 },
      { month: 'Jan', leads: 140, opportunities: 18, customers: 10, revenue: 380000 }
    ]
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (growth: number) => {
    return growth > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getTrendColor = (growth: number) => {
    return growth > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">CRM Analytics</h1>
          <p className="text-gray-600">Sales performance insights and reports</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="last_90_days">Last 90 Days</option>
            <option value="last_year">Last Year</option>
          </select>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnel">Sales Funnel</TabsTrigger>
          <TabsTrigger value="sources">Lead Sources</TabsTrigger>
          <TabsTrigger value="territory">Territory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalLeads.toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(analyticsData.overview.leadGrowth)}
                    <span className={`text-sm ${getTrendColor(analyticsData.overview.leadGrowth)}`}>
                      {formatPercentage(analyticsData.overview.leadGrowth)}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Opportunities</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalOpportunities}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(analyticsData.overview.opportunityGrowth)}
                    <span className={`text-sm ${getTrendColor(analyticsData.overview.opportunityGrowth)}`}>
                      {formatPercentage(analyticsData.overview.opportunityGrowth)}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analyticsData.overview.totalRevenue)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(analyticsData.overview.revenueGrowth)}
                    <span className={`text-sm ${getTrendColor(analyticsData.overview.revenueGrowth)}`}>
                      {formatPercentage(analyticsData.overview.revenueGrowth)}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.conversionRate}%</p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(analyticsData.overview.conversionGrowth)}
                    <span className={`text-sm ${getTrendColor(analyticsData.overview.conversionGrowth)}`}>
                      {formatPercentage(analyticsData.overview.conversionGrowth)}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Deal Size</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analyticsData.overview.avgDealSize)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(analyticsData.overview.dealSizeGrowth)}
                    <span className={`text-sm ${getTrendColor(analyticsData.overview.dealSizeGrowth)}`}>
                      {formatPercentage(analyticsData.overview.dealSizeGrowth)}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalCustomers}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(analyticsData.overview.customerGrowth)}
                    <span className={`text-sm ${getTrendColor(analyticsData.overview.customerGrowth)}`}>
                      {formatPercentage(analyticsData.overview.customerGrowth)}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-teal-100 rounded-lg">
                  <Users className="h-6 w-6 text-teal-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Monthly trend chart would go here</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Distribution</h3>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Revenue pie chart would go here</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Sales Funnel Analysis</h3>
            <div className="space-y-4">
              {Object.entries(analyticsData.salesFunnel).map(([stage, count], index) => {
                const percentage = (count / analyticsData.salesFunnel.leads) * 100;
                const conversionRate = index > 0 ? 
                  (count / Object.values(analyticsData.salesFunnel)[index - 1]) * 100 : 100;
                
                return (
                  <div key={stage} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-green-500' :
                          index === 2 ? 'bg-yellow-500' :
                          index === 3 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`} />
                        <span className="font-medium capitalize">{stage}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{count.toLocaleString()}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({percentage.toFixed(1)}% of total)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div
                        className={`h-3 rounded-full ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-green-500' :
                          index === 2 ? 'bg-yellow-500' :
                          index === 3 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    {index > 0 && (
                      <p className="text-xs text-gray-500">
                        Conversion rate: {conversionRate.toFixed(1)}%
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Funnel Visualization</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Funnel chart visualization would go here</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Source Performance</h3>
            <div className="space-y-4">
              {analyticsData.leadSources.map((source, index) => (
                <div key={source.source} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-yellow-500' :
                      index === 3 ? 'bg-purple-500' :
                      'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium">{source.source}</p>
                      <p className="text-sm text-gray-500">{source.count} leads</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Conversion</p>
                      <p className="font-semibold">{source.conversion}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Revenue</p>
                      <p className="font-semibold">{formatCurrency(source.revenue)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">ROI</p>
                      <Badge variant="default">
                        {((source.revenue / (source.count * 100)) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Source Distribution</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Source distribution chart would go here</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="territory" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Territory Performance</h3>
            <div className="space-y-4">
              {analyticsData.territoryPerformance.map((territory, index) => (
                <div key={territory.territory} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-yellow-500' :
                      'bg-purple-500'
                    }`} />
                    <div>
                      <p className="font-medium">{territory.territory}</p>
                      <p className="text-sm text-gray-500">{territory.customers} customers</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Leads</p>
                      <p className="font-semibold">{territory.leads}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Opportunities</p>
                      <p className="font-semibold">{territory.opportunities}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Revenue</p>
                      <p className="font-semibold">{formatCurrency(territory.revenue)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Conversion</p>
                      <Badge variant="default">
                        {((territory.customers / territory.leads) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Territory Comparison</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Territory comparison chart would go here</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CRMAnalytics;