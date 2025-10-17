'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Clock, 
  DollarSign,
  Package,
  Settings,
  Target,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { ManufacturingAnalytics } from '@/types/manufacturing';

// Mock data - in real implementation, this would come from API
const mockAnalytics: ManufacturingAnalytics = {
  production_efficiency: 85.2,
  capacity_utilization: 78.5,
  on_time_delivery: 92.1,
  quality_rate: 96.8,
  cost_variance: -3.2, // negative means under budget
  total_production: 1250,
  total_work_orders: 45,
  completed_work_orders: 38,
  pending_work_orders: 7
};

const productionTrends = [
  { month: 'Jan', planned: 1000, actual: 950, efficiency: 85 },
  { month: 'Feb', planned: 1100, actual: 1080, efficiency: 87 },
  { month: 'Mar', planned: 1200, actual: 1150, efficiency: 89 },
  { month: 'Apr', planned: 1300, actual: 1250, efficiency: 85 },
  { month: 'May', planned: 1400, actual: 1380, efficiency: 91 },
  { month: 'Jun', planned: 1500, actual: 1420, efficiency: 88 }
];

const workstationUtilization = [
  { workstation: 'CNC-001', utilization: 85, status: 'Good', hours: 204 },
  { workstation: 'CNC-002', utilization: 92, status: 'High', hours: 221 },
  { workstation: 'DRILL-001', utilization: 78, status: 'Good', hours: 187 },
  { workstation: 'DRILL-002', utilization: 65, status: 'Low', hours: 156 },
  { workstation: 'ASSY-001', utilization: 88, status: 'Good', hours: 211 },
  { workstation: 'ASSY-002', utilization: 95, status: 'High', hours: 228 }
];

const qualityMetrics = [
  { parameter: 'First Pass Yield', value: 94.5, target: 95, status: 'Warning' },
  { parameter: 'Defect Rate', value: 2.1, target: 2.0, status: 'Warning' },
  { parameter: 'Rework Rate', value: 1.8, target: 2.5, status: 'Good' },
  { parameter: 'Customer Returns', value: 0.3, target: 0.5, status: 'Good' }
];

export default function ManufacturingAnalyticsPage() {
  const [dateRange, setDateRange] = useState('last-30-days');
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => setIsLoading(false), 1000);
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600';
    if (utilization >= 80) return 'text-green-600';
    if (utilization >= 70) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Good': return <Badge className="bg-green-100 text-green-800">Good</Badge>;
      case 'High': return <Badge className="bg-red-100 text-red-800">High</Badge>;
      case 'Low': return <Badge className="bg-yellow-100 text-yellow-800">Low</Badge>;
      case 'Warning': return <Badge className="bg-orange-100 text-orange-800">Warning</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manufacturing Analytics</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive manufacturing performance dashboard
            </p>
          </div>
          <div className="flex space-x-3">
            <select
              className="border rounded px-3 py-2 text-sm"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="last-7-days">Last 7 Days</option>
              <option value="last-30-days">Last 30 Days</option>
              <option value="last-90-days">Last 90 Days</option>
              <option value="last-year">Last Year</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Production Efficiency</p>
                  <p className="text-3xl font-bold text-blue-600">{mockAnalytics.production_efficiency}%</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+2.1% vs last month</span>
                  </div>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Capacity Utilization</p>
                  <p className="text-3xl font-bold text-green-600">{mockAnalytics.capacity_utilization}%</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+5.3% vs last month</span>
                  </div>
                </div>
                <Settings className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">On-Time Delivery</p>
                  <p className="text-3xl font-bold text-orange-600">{mockAnalytics.on_time_delivery}%</p>
                  <div className="flex items-center mt-2">
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-600">-1.2% vs last month</span>
                  </div>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Quality Rate</p>
                  <p className="text-3xl font-bold text-purple-600">{mockAnalytics.quality_rate}%</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+0.8% vs last month</span>
                  </div>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Production Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Production Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Production Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-blue-600">Total Production</p>
                    <p className="text-2xl font-bold text-blue-800">{mockAnalytics.total_production}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Completed Orders</p>
                    <p className="text-xl font-bold text-green-800">{mockAnalytics.completed_work_orders}</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-600">Pending Orders</p>
                    <p className="text-xl font-bold text-orange-800">{mockAnalytics.pending_work_orders}</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Work Order Completion Rate</span>
                    <span className="text-sm font-medium">
                      {((mockAnalytics.completed_work_orders / mockAnalytics.total_work_orders) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${(mockAnalytics.completed_work_orders / mockAnalytics.total_work_orders) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Cost Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div>
                    <p className="text-sm text-purple-600">Cost Variance</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {mockAnalytics.cost_variance > 0 ? '+' : ''}{mockAnalytics.cost_variance}%
                    </p>
                    <p className="text-xs text-purple-600">
                      {mockAnalytics.cost_variance < 0 ? 'Under budget' : 'Over budget'}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Material Cost</span>
                    <span className="font-medium">₹2,45,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Labor Cost</span>
                    <span className="font-medium">₹1,85,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Overhead Cost</span>
                    <span className="font-medium">₹95,000</span>
                  </div>
                  <hr />
                  <div className="flex justify-between items-center font-bold">
                    <span>Total Cost</span>
                    <span>₹5,25,000</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workstation Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Workstation Utilization</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Workstation</th>
                    <th className="text-center py-2">Utilization</th>
                    <th className="text-center py-2">Hours Used</th>
                    <th className="text-center py-2">Status</th>
                    <th className="text-center py-2">Utilization Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {workstationUtilization.map((ws, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 font-medium">{ws.workstation}</td>
                      <td className={`py-3 text-center font-bold ${getUtilizationColor(ws.utilization)}`}>
                        {ws.utilization}%
                      </td>
                      <td className="py-3 text-center">{ws.hours}h</td>
                      <td className="py-3 text-center">
                        {getStatusBadge(ws.status)}
                      </td>
                      <td className="py-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              ws.utilization >= 90 ? 'bg-red-500' :
                              ws.utilization >= 80 ? 'bg-green-500' :
                              ws.utilization >= 70 ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`}
                            style={{ width: `${ws.utilization}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quality Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Quality Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {qualityMetrics.map((metric, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{metric.parameter}</h4>
                    {getStatusBadge(metric.status)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Actual:</span>
                      <span className="font-medium">{metric.value}%</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Target:</span>
                      <span>{metric.target}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className={`h-2 rounded-full ${
                          metric.status === 'Good' ? 'bg-green-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${(metric.value / metric.target) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Production Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Production Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Month</th>
                    <th className="text-center py-2">Planned</th>
                    <th className="text-center py-2">Actual</th>
                    <th className="text-center py-2">Efficiency</th>
                    <th className="text-center py-2">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {productionTrends.map((trend, index) => {
                    const variance = ((trend.actual - trend.planned) / trend.planned * 100);
                    return (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-medium">{trend.month}</td>
                        <td className="py-3 text-center">{trend.planned}</td>
                        <td className="py-3 text-center font-medium">{trend.actual}</td>
                        <td className="py-3 text-center">
                          <Badge className={
                            trend.efficiency >= 90 ? 'bg-green-100 text-green-800' :
                            trend.efficiency >= 80 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {trend.efficiency}%
                          </Badge>
                        </td>
                        <td className="py-3 text-center">
                          <span className={variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Alerts and Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Alerts & Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">High Workstation Utilization</p>
                  <p className="text-sm text-red-600">
                    CNC-002 and ASSY-002 are running at over 90% capacity. Consider scheduling maintenance or redistributing workload.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">On-Time Delivery Declining</p>
                  <p className="text-sm text-yellow-600">
                    On-time delivery has decreased by 1.2% this month. Review production scheduling and capacity planning.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Cost Performance Excellent</p>
                  <p className="text-sm text-green-600">
                    Manufacturing costs are 3.2% under budget. Great job on cost control and efficiency improvements.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}