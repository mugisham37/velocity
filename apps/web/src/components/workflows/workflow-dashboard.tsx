'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GET_WORKFLOWS,
  GET_WORKFLOW_CATEGORIES,
  GET_WORKFLOW_METRICS,
} from '@/graphql/workflows';
import { useQuery } from '@apollo/client';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  GitBranch,
  Plus,
  Search,
  TrendingUp,
  Users,
  Workflow
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { CreateWorkflowModal } from './create-workflow-modal';
import { WorkflowList } from './workflow-list';

interface WorkflowDashboardProps {
  className?: string;
}

export function WorkflowDashboard({ className }: WorkflowDashboardProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('workflows');

  // Queries
  const { data: workflowsData, loading: workflowsLoading, error: workflowsError, refetch } = useQuery(GET_WORKFLOWS, {
    variables: {
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      isActive: true,
      limit: 50,
    },
  });

  const { data: categoriesData } = useQuery(GET_WORKFLOW_CATEGORIES);
  const { data: metricsData } = useQuery(GET_WORKFLOW_METRICS);

  const workflows = workflowsData?.workflows || [];
  const categories = categoriesData?.workflowCategories || [];
  const metrics = metricsData?.workflowMetrics || {
    totalWorkflows: 0,
    activeInstances: 0,
    completedToday: 0,
    overdueTasks: 0,
    slaBreaches: 0,
    averageCompletionTime: 0,
    byCategory: [],
  };

  // Filter workflows based on search
  const filteredWorkflows = workflows.filter((workflow: any) =>
    workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workflow.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workflow.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoryOptions = [
    { value: 'all', label: 'All Categories', count: workflows.length },
    ...categories.map((category: string) => ({
      value: category,
      label: category.charAt(0).toUpperCase() + category.slice(1),
      count: workflows.filter((w: any) => w.category === category).length,
    })),
  ];

  if (workflowsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (workflowsError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading workflows: {workflowsError.message}</p>
        <Button onClick={() => refetch()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Management</h1>
          <p className="text-gray-600">Design, execute, and monitor business workflows</p>
        </div>
        <div className="flex gap-2">
          <Link href="/workflows/templates">
            <Button variant="outline" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Templates
            </Button>
          </Link>
          <Link href="/workflows/analytics">
            <Button variant="outline" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </Button>
          </Link>
          <Link href="/workflows/designer">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Workflow
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              {workflows.filter((w: any) => w.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Instances</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeInstances}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completedToday}</div>
            <p className="text-xs text-muted-foreground">
              Finished workflows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Breaches</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.slaBreaches}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageCompletionTime.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              Average time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Performance */}
      {metrics.byCategory.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Performance by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.byCategory.map((category: any) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{category.category}</Badge>
                    <span className="text-sm text-gray-600">{category.count} workflows</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{category.averageTime.toFixed(1)}h avg</span>
                    <Progress
                      value={Math.min((category.averageTime / 24) * 100, 100)}
                      className="w-20"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="instances">Active Instances</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {categoryOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedCategory === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(option.value)}
                  className="flex items-center gap-2"
                >
                  {option.label}
                  <Badge variant="secondary" className="ml-1">
                    {option.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Workflows List */}
          <Card>
            <CardHeader>
              <CardTitle>Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredWorkflows.length === 0 ? (
                <div className="text-center py-8">
                  <Workflow className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery || selectedCategory !== 'all'
                      ? "Try adjusting your search or filters"
                      : "Get started by creating your first workflow"
                    }
                  </p>
                  <Link href="/workflows/designer">
                    <Button>Create Workflow</Button>
                  </Link>
                </div>
              ) : (
                <WorkflowList workflows={filteredWorkflows} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instances">
          <Card>
            <CardHeader>
              <CardTitle>Active Workflow Instances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Active instances will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Pending approvals will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Workflow Modal */}
      <CreateWorkflowModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          refetch();
        }}
      />
    </div>
  );
}
