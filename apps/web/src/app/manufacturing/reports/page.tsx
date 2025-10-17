'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Package,
  Settings,
  FileText,
  Download,
  Calendar,
  Target
} from 'lucide-react';
import Link from 'next/link';

const manufacturingReports = [
  {
    title: 'Production Planning Report',
    description: 'Analyze production planning with capacity and scheduling',
    icon: Calendar,
    href: '/manufacturing/reports/production-planning',
    color: 'bg-blue-500',
    category: 'Planning'
  },
  {
    title: 'Work Order Status Report',
    description: 'Track work order progress and status',
    icon: FileText,
    href: '/manufacturing/reports/work-order-status',
    color: 'bg-green-500',
    category: 'Operations'
  },
  {
    title: 'BOM Cost Analysis',
    description: 'Analyze BOM costs and material pricing',
    icon: DollarSign,
    href: '/manufacturing/reports/bom-cost-analysis',
    color: 'bg-purple-500',
    category: 'Costing'
  },
  {
    title: 'Capacity Planning Report',
    description: 'Workstation capacity utilization and planning',
    icon: Settings,
    href: '/manufacturing/reports/capacity-planning',
    color: 'bg-orange-500',
    category: 'Capacity'
  },
  {
    title: 'Production Efficiency Report',
    description: 'Track production efficiency and performance metrics',
    icon: TrendingUp,
    href: '/manufacturing/reports/production-efficiency',
    color: 'bg-indigo-500',
    category: 'Performance'
  },
  {
    title: 'Job Card Summary',
    description: 'Summary of job card activities and time tracking',
    icon: Clock,
    href: '/manufacturing/reports/job-card-summary',
    color: 'bg-red-500',
    category: 'Operations'
  },
  {
    title: 'Material Consumption Report',
    description: 'Track material consumption vs planned quantities',
    icon: Package,
    href: '/manufacturing/reports/material-consumption',
    color: 'bg-teal-500',
    category: 'Materials'
  },
  {
    title: 'Manufacturing Analytics',
    description: 'Comprehensive manufacturing performance dashboard',
    icon: BarChart3,
    href: '/manufacturing/reports/analytics',
    color: 'bg-pink-500',
    category: 'Analytics'
  }
];

const reportCategories = [
  'All',
  'Planning',
  'Operations', 
  'Costing',
  'Capacity',
  'Performance',
  'Materials',
  'Analytics'
];

export default function ManufacturingReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredReports = selectedCategory === 'All' 
    ? manufacturingReports 
    : manufacturingReports.filter(report => report.category === selectedCategory);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manufacturing Reports</h1>
            <p className="text-gray-600 mt-1">
              Analytics and reports for manufacturing operations
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
            <Button size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Custom Report
            </Button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {reportCategories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Key Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Production Efficiency</p>
                  <p className="text-2xl font-bold text-blue-600">85.2%</p>
                  <p className="text-xs text-gray-500">+2.1% from last month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Capacity Utilization</p>
                  <p className="text-2xl font-bold text-green-600">78.5%</p>
                  <p className="text-xs text-gray-500">+5.3% from last month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">On-Time Delivery</p>
                  <p className="text-2xl font-bold text-orange-600">92.1%</p>
                  <p className="text-xs text-gray-500">-1.2% from last month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Cost Variance</p>
                  <p className="text-2xl font-bold text-purple-600">-3.2%</p>
                  <p className="text-xs text-gray-500">Better than planned</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <Link key={report.title} href={report.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${report.color} text-white`}>
                      <report.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {report.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Category: {report.category}</span>
                    <Button variant="ghost" size="sm">
                      View Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common manufacturing report actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Monthly Report
              </Button>
              <Button variant="outline" className="justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Performance Dashboard
              </Button>
              <Button variant="outline" className="justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>
              Recently generated manufacturing reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent reports</p>
              <p className="text-sm">Generate your first report to see it here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}