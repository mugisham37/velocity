'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GET_PENDING_APPROVALS,
  GET_WORKFLOW_INSTANCES,
  GET_WORKFLOW_METRICS,
} from '@/graphql/workflows';
import { useQuery } from '@apollo/client';
import {
  Activity,
  AlertTriangle,
  Calendar,
  Clock,
  Pause,
  Play,
  Square,
  TrendingUp,
  Users
} from 'lucide-react';
import React, { useState } from 'react';
import { WorkflowApprovalList } from './workflow-approval-list';
import { WorkflowExecutionChart } from './workflow-execution-chart';
import { WorkflowInstanceList } from './workflow-instance-list';

interface WorkflowExecutionDashboardProps {
  workflowId?: string;
  className?: string;
}

export function WorkflowExecutionDashboard({
  workflowId,
  className
}: WorkflowExecutionDashboardProps) {
  const [activeTab, setActiveTab] = useState('instances');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // Queries
  const { data: instancesData, loading: instancesLoading, refetch: refetchInstances } = useQuery(
    GET_WORKFLOW_INSTANCES,
    {
      variables: {
        workflowId: workflowId || '',
        status: statusFilter.length > 0 ? statusFilter : undefined,
        limit: 50,
      },
      skip: !workflowId,
    }
  );

  const { data: approvalsData, loading: approvalsLoading } = useQuery(GET_PENDING_APPROVALS);
  const { data: metricsData } = useQuery(GET_WORKFLOW_METRICS);

  const instances = instancesData?.workflowInstances || [];
  const approvals = approvalsData?.pendingApprovals || [];
  const metrics = metricsData?.workflowMetrics || {
    totalWorkflows: 0,
    activeInstances: 0,
    completedToday: 0,
    overdueTasks: 0,
    slaBreaches: 0,
    averageCompletionTime: 0,
  };

  // Calculate instance metrics
  const instanceMetrics = React.useMemo(() => {
    const total = instances.length;
    const running = instances.filter((i: any) => i.status === 'running').length;
    const completed = instances.filter((i: any) => i.status === 'completed').length;
    const failed = instances.filter((i: any) => i.status === 'failed').length;
    const pending = instances.filter((i: any) => i.status === 'pending').length;
    const overdue = instances.filter((i: any) => {
      return i.dueDate && new Date(i.dueDate) < new Date() &&
             ['pending', 'running'].includes(i.status);
    }).length;

    return { total, running, completed, failed, pending, overdue };
  }, [instances]);

  const statusOptions = [
    { value: 'pending', label: 'Pending', count: instanceMetrics.pending, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'running', label: 'Running', count: instanceMetrics.running, color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Completed', count: instanceMetrics.completed, color: 'bg-green-100 text-green-800' },
    { value: 'failed', label: 'Failed', count: instanceMetrics.failed, color: 'bg-red-100 text-red-800' },
  ];

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  if (instancesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={className}></div>
eader */}
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
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{instanceMetrics.running}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{instanceMetrics.completed}</div>
            <p className="text-xs text-muted-foreground">
              Successfully finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <Square className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{instanceMetrics.failed}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{instanceMetrics.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Past due date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageCompletionTime.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              Completion time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusOptions.map((option) => (
          <Button
            key={option.value}
            variant={statusFilter.includes(option.value) ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleStatusFilter(option.value)}
            className="flex items-center gap-2"
          >
            {option.label}
            <Badge variant="secondary" className="ml-1">
              {option.count}
            </Badge>
          </Button>
        ))}
        {statusFilter.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter([])}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="instances">Instances</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="instances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Instances</CardTitle>
            </CardHeader>
            <CardContent>
              {instances.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No instances found</h3>
                  <p className="text-gray-600">
                    {statusFilter.length > 0
                      ? "No instances match the selected filters"
                      : "No workflow instances have been created yet"
                    }
                  </p>
                </div>
              ) : (
                <WorkflowInstanceList
                  instances={instances}
                  onRefresh={refetchInstances}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              {approvals.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending approvals</h3>
                  <p className="text-gray-600">All approvals are up to date</p>
                </div>
              ) : (
                <WorkflowApprovalList approvals={approvals} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Execution Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <WorkflowExecutionChart workflowId={workflowId} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Success Rate</span>
                    <span className="text-sm text-gray-600">
                      {instanceMetrics.total > 0
                        ? Math.round((instanceMetrics.completed / instanceMetrics.total) * 100)
                        : 0}%
                    </span>
                  </div>
                  <Progress
                    value={instanceMetrics.total > 0
                      ? (instanceMetrics.completed / instanceMetrics.total) * 100
                      : 0}
                  />

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">On-Time Completion</span>
                    <span className="text-sm text-gray-600">
                      {instanceMetrics.total > 0
                        ? Math.round(((instanceMetrics.total - instanceMetrics.overdue) / instanceMetrics.total) * 100)
                        : 0}%
                    </span>
                  </div>
                  <Progress
                    value={instanceMetrics.total > 0
                      ? ((instanceMetrics.total - instanceMetrics.overdue) / instanceMetrics.total) * 100
                      : 0}
                  />

                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {metrics.averageCompletionTime.toFixed(1)}h
                        </div>
                        <div className="text-xs text-gray-500">Avg Completion</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">
                          {metrics.slaBreaches}
                        </div>
                        <div className="text-xs text-gray-500">SLA Breaches</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Workflow Engine</span>
                    <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database</span>
                    <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notifications</span>
                    <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Integrations</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">SLA Breach Warning</p>
                      <p className="text-xs text-gray-500">2 instances approaching deadline</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">High Load Detected</p>
                      <p className="text-xs text-gray-500">15 instances started in last hour</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause All Instances
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Play className="h-4 w-4 mr-2" />
                    Resume All Instances
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    View Failed Instances
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Maintenance
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
