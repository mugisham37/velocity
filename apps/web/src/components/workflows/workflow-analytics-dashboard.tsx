'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@apollo/client';
import { Activity, ArrowLeft, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { GET_WORKFLOW_METRICS } from '@/graphql/workflows';

interface WorkflowAnalyticsDashboardProps {
  className?: string;
}

export function WorkflowAnalyticsDashboard({
  className,
}: WorkflowAnalyticsDashboardProps) {
  const { data: metricsData, loading: metricsLoading } = useQuery(
    GET_WORKFLOW_METRICS
  );

  const metrics = metricsData?.workflowMetrics || {
    totalWorkflows: 0,
    activeInstances: 0,
    completedToday: 0,
    overdueTasks: 0,
    slaBreaches: 0,
    averageCompletionTime: 0,
    byCategory: [],
  };

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/workflows">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workflows
            </Button>
          </Link>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Analytics</h1>
          <p className="text-gray-600">Insights and performance metrics for your workflows</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeInstances + metrics.completedToday}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94.2%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+2.1%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Completion Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.averageCompletionTime.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600">+0.3h</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87.5%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600">-1.2%</span> from last month
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Execution Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
                    <p className="text-gray-500">Chart placeholder - Execution trends over time</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
                    <p className="text-gray-500">Chart placeholder - Status distribution pie chart</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Average Completion Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Current Average</span>
                      <span className="font-medium">{metrics.averageCompletionTime.toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Target SLA</span>
                      <span className="font-medium">24h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SLA Breaches</span>
                      <span className="font-medium text-red-600">{metrics.slaBreaches}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
                    <p className="text-gray-500">Chart placeholder - Performance metrics over time</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Workflows by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.byCategory.map((category: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{category.category}</div>
                        <div className="text-sm text-gray-500">
                          Average time: {category.averageTime}h
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{category.count}</div>
                        <div className="text-sm text-gray-500">workflows</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}