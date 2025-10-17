'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Download,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { ProductionPlanningReport } from '@/types/manufacturing';

// Mock data - in real implementation, this would come from API
const mockProductionData: ProductionPlanningReport[] = [
  {
    item_code: 'PROD-001',
    item_name: 'Steel Bracket Assembly',
    planned_qty: 100,
    produced_qty: 85,
    pending_qty: 15,
    planned_start_date: '2024-01-15',
    planned_end_date: '2024-01-20',
    actual_start_date: '2024-01-15',
    actual_end_date: '2024-01-22',
    status: 'In Progress',
    delay_days: 2
  },
  {
    item_code: 'PROD-002',
    item_name: 'Motor Housing',
    planned_qty: 50,
    produced_qty: 50,
    pending_qty: 0,
    planned_start_date: '2024-01-10',
    planned_end_date: '2024-01-18',
    actual_start_date: '2024-01-10',
    actual_end_date: '2024-01-17',
    status: 'Completed',
    delay_days: -1
  },
  {
    item_code: 'PROD-003',
    item_name: 'Gear Box Cover',
    planned_qty: 75,
    produced_qty: 45,
    pending_qty: 30,
    planned_start_date: '2024-01-12',
    planned_end_date: '2024-01-25',
    actual_start_date: '2024-01-14',
    actual_end_date: undefined,
    status: 'In Progress',
    delay_days: 3
  },
  {
    item_code: 'PROD-004',
    item_name: 'Shaft Assembly',
    planned_qty: 120,
    produced_qty: 0,
    pending_qty: 120,
    planned_start_date: '2024-01-20',
    planned_end_date: '2024-02-05',
    actual_start_date: undefined,
    actual_end_date: undefined,
    status: 'Not Started',
    delay_days: 0
  },
  {
    item_code: 'PROD-005',
    item_name: 'Control Panel',
    planned_qty: 30,
    produced_qty: 28,
    pending_qty: 2,
    planned_start_date: '2024-01-08',
    planned_end_date: '2024-01-15',
    actual_start_date: '2024-01-08',
    actual_end_date: '2024-01-16',
    status: 'Completed',
    delay_days: 1
  }
];

export default function ProductionPlanningReportPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState('this-month');
  const [isLoading, setIsLoading] = useState(false);

  const filteredData = mockProductionData.filter(item => {
    const matchesSearch = item.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Not Started': return 'bg-blue-100 text-blue-800';
      case 'Delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDelayColor = (delayDays?: number) => {
    if (!delayDays) return 'text-gray-600';
    if (delayDays > 0) return 'text-red-600';
    if (delayDays < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate summary statistics
  const totalPlanned = filteredData.reduce((sum, item) => sum + item.planned_qty, 0);
  const totalProduced = filteredData.reduce((sum, item) => sum + item.produced_qty, 0);
  const totalPending = filteredData.reduce((sum, item) => sum + item.pending_qty, 0);
  const completedItems = filteredData.filter(item => item.status === 'Completed').length;
  const delayedItems = filteredData.filter(item => (item.delay_days || 0) > 0).length;
  const onTimeItems = filteredData.filter(item => (item.delay_days || 0) <= 0 && item.status === 'Completed').length;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Production Planning Report</h1>
            <p className="text-gray-600 mt-1">
              Track production planning with capacity analysis and scheduling
            </p>
          </div>
          <div className="flex space-x-3">
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-blue-600">{filteredData.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedItems}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-orange-600">
                {filteredData.filter(item => item.status === 'In Progress').length}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <p className="text-sm text-gray-600">On Time</p>
              <p className="text-2xl font-bold text-purple-600">{onTimeItems}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
              <p className="text-sm text-gray-600">Delayed</p>
              <p className="text-2xl font-bold text-red-600">{delayedItems}</p>
            </CardContent>
          </Card>
        </div>

        {/* Production Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Planned</p>
                <p className="text-3xl font-bold text-blue-600">{totalPlanned}</p>
                <p className="text-xs text-gray-500">units</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Produced</p>
                <p className="text-3xl font-bold text-green-600">{totalProduced}</p>
                <p className="text-xs text-gray-500">units</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Pending Production</p>
                <p className="text-3xl font-bold text-orange-600">{totalPending}</p>
                <p className="text-xs text-gray-500">units</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  className="border rounded px-3 py-2"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <select
                  className="border rounded px-3 py-2"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                  <option value="next-month">Next Month</option>
                  <option value="this-quarter">This Quarter</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Production Planning Table */}
        <Card>
          <CardHeader>
            <CardTitle>Production Planning Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Item Code</th>
                    <th className="text-left py-3">Item Name</th>
                    <th className="text-center py-3">Planned Qty</th>
                    <th className="text-center py-3">Produced Qty</th>
                    <th className="text-center py-3">Pending Qty</th>
                    <th className="text-center py-3">Progress</th>
                    <th className="text-center py-3">Planned Dates</th>
                    <th className="text-center py-3">Actual Dates</th>
                    <th className="text-center py-3">Status</th>
                    <th className="text-center py-3">Delay</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => {
                    const progress = item.planned_qty > 0 ? (item.produced_qty / item.planned_qty) * 100 : 0;
                    
                    return (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-medium">{item.item_code}</td>
                        <td className="py-3">{item.item_name}</td>
                        <td className="py-3 text-center">{item.planned_qty}</td>
                        <td className="py-3 text-center font-medium text-green-600">{item.produced_qty}</td>
                        <td className="py-3 text-center text-orange-600">{item.pending_qty}</td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium">{progress.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="py-3 text-center text-xs">
                          <div>{formatDate(item.planned_start_date)}</div>
                          <div className="text-gray-500">to</div>
                          <div>{formatDate(item.planned_end_date)}</div>
                        </td>
                        <td className="py-3 text-center text-xs">
                          <div>{formatDate(item.actual_start_date)}</div>
                          <div className="text-gray-500">to</div>
                          <div>{formatDate(item.actual_end_date)}</div>
                        </td>
                        <td className="py-3 text-center">
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`font-medium ${getDelayColor(item.delay_days)}`}>
                            {item.delay_days === 0 ? 'On Time' :
                             item.delay_days && item.delay_days > 0 ? `+${item.delay_days}d` :
                             item.delay_days && item.delay_days < 0 ? `${item.delay_days}d` : '-'}
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

        {/* Performance Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* On-Time Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>On-Time Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {completedItems > 0 ? ((onTimeItems / completedItems) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-sm text-gray-600">On-Time Delivery Rate</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>On Time:</span>
                    <span className="font-medium text-green-600">{onTimeItems} items</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delayed:</span>
                    <span className="font-medium text-red-600">{delayedItems} items</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Early:</span>
                    <span className="font-medium text-blue-600">
                      {filteredData.filter(item => (item.delay_days || 0) < 0).length} items
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Production Efficiency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Production Efficiency</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {totalPlanned > 0 ? ((totalProduced / totalPlanned) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-sm text-gray-600">Overall Production Rate</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Planned:</span>
                    <span className="font-medium">{totalPlanned} units</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Produced:</span>
                    <span className="font-medium text-green-600">{totalProduced} units</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pending:</span>
                    <span className="font-medium text-orange-600">{totalPending} units</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        {delayedItems > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                <span>Production Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-white border border-orange-200 rounded-lg">
                  <p className="font-medium text-orange-800">Delayed Items Detected</p>
                  <p className="text-sm text-orange-600">
                    {delayedItems} items are behind schedule. Consider reviewing capacity allocation and resource planning.
                  </p>
                </div>
                
                <div className="p-3 bg-white border border-orange-200 rounded-lg">
                  <p className="font-medium text-orange-800">Recommendations:</p>
                  <ul className="text-sm text-orange-600 mt-2 list-disc list-inside space-y-1">
                    <li>Review workstation capacity and availability</li>
                    <li>Consider overtime or additional shifts for critical items</li>
                    <li>Evaluate material availability and supply chain issues</li>
                    <li>Reassess production priorities and scheduling</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}