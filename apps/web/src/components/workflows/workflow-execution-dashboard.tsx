'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@apollo/client';
import { Activity, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { GET_WORKFLOW_INSTANCES, GET_WORKFLOW_METRICS } from '@/graphql/workflows';
import { WorkflowExecutionChart } from './workflow-execution-chart';

interface WorkflowExecutionDashboardProps {
  workflowId?: string;
  className?: string;
}

export function WorkflowExecutionDashboard({
  workflowId,
  className,
}: WorkflowExecutionDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: instancesData, loading: instancesLoading } = useQuery(
    GET_WORKFLOW_INSTANCES,
    {
      variables: { workflowId },
      skip: !workflowId,
    }
  );

  const { data: metricsData, loading: metricsLoading } = useQuery(
    GET_WORKFLOW_METRICS
  );

  const instances = instancesData?.workflowInstances || [];
  const metrics = metricsData?.workflowMetrics || {
    totalWorkflows: 0,
    activeInstances: 0,
    completedToday: 0,
    overdueTasks: 0,
    slaBreaches: 0,
    averageCompletionTime: 0,
  };

  const instanceMetrics = {
    total: instances.length,
    running: instances.filter((i: any) => i.status === 'RUNNING').length,
    completed: instances.filter((i: any) => i.status === 'COMPLETED').length,
    failed: instances.filter((i: any) => i.status === 'FAILED').length,
    pending: instances.filter((i: any) => i.status === 'PENDING').length,
    cancelled: instances.filter((i: any) => i.status === 'CANCELLED').length,
  };

  if (instancesLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Execution</h1>
          <p className="text-gray-600">Monitor and manage workflow instances</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Instances</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{instanceMetrics.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{instanceMetrics.running}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{instanceMetrics.completed}</div>
            <p className="text-xs text-muted-foreground">Successfully finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{instanceMetrics.failed}</div>
            <p className="text-xs text-muted-foreground">Error occurred</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{instanceMetrics.pending}</div>
            <p className="text-xs text-muted-foreground">Waiting to start</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{instanceMetrics.cancelled}</div>
            <p className="text-xs text-muted-foreground">User cancelled</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="instances">Instances</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Execution Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {workflowId && (
                  <WorkflowExecutionChart workflowId={workflowId} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {instances.slice(0, 5).map((instance: any) => (
                    <div key={instance.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">{instance.name}</div>
                        <div className="text-sm text-gray-500">
                          Started {new Date(instance.startedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        instance.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        instance.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                        instance.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {instance.status}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="instances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Instances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {instances.map((instance: any) => (
                  <div key={instance.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="font-medium">{instance.name}</div>
                      <div className="text-sm text-gray-500">
                        ID: {instance.id} • Started: {new Date(instance.startedAt).toLocaleString()}
                      </div>
                      {instance.completedAt && (
                        <div className="text-sm text-gray-500">
                          Completed: {new Date(instance.completedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        instance.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        instance.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                        instance.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {instance.status}
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium">Average Completion Time</div>
                    <div className="text-2xl font-bold">{metrics.averageCompletionTime.toFixed(1)}h</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Success Rate</div>
                    <div className="text-2xl font-bold">
                      {instanceMetrics.total > 0 
                        ? ((instanceMetrics.completed / instanceMetrics.total) * 100).toFixed(1)
                        : 0}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(instanceMetrics).map(([status, count]) => (
                    <div key={status} className="flex justify-between">
                      <span className="capitalize">{status}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}