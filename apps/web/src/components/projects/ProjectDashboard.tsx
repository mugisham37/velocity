'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GET_PROJECTS } from '@/graphql/projects';
import { useQuery } from '@apollo/client';
import { Project, ProjectStatusType } from '@packages/shared/types/projects';
import { Calendar, Plus, Target, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';
import { CreateProjectModal } from './CreateProjectModal';
import { ProjectList } from './ProjectList';

interface ProjectDashboardProps {
  className?: string;
}

export function ProjectDashboard({ className }: ProjectDashboardProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatusType | 'all'>('all');

  const { data, loading, error, refetch } = useQuery(GET_PROJECTS, {
    variables: {
      filter: selectedStatus !== 'all' ? { status: selectedStatus } : {},
    },
  });

  const projects: Project[] = data?.projects || [];

  // Calculate dashboard metrics
  const metrics = React.useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'Active').length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const overdueProjects = projects.filter(p => {
      if (p.status === 'Completed') return false;
      const endDate = p.endDate || p.expectedEndDate;
      return endDate && new Date(endDate) < new Date();
    }).length;

    const avgProgress = totalProjects > 0
      ? projects.reduce((sum, p) => sum + p.percentComplete, 0) / totalProjects
      : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      overdueProjects,
      avgProgress,
    };
  }, [projects]);

  const statusOptions = [
    { value: 'all', label: 'All Projects', count: metrics.totalProjects },
    { value: 'Active', label: 'Active', count: metrics.activeProjects },
    { value: 'Planning', label: 'Planning', count: projects.filter(p => p.status === 'Planning').length },
    { value: 'On Hold', label: 'On Hold', count: projects.filter(p => p.status === 'On Hold').length },
    { value: 'Completed', label: 'Completed', count: metrics.completedProjects },
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      Draft: 'bg-gray-100 text-gray-800',
      Planning: 'bg-blue-100 text-blue-800',
      Active: 'bg-green-100 text-green-800',
      'On Hold': 'bg-yellow-100 text-yellow-800',
      Completed: 'bg-purple-100 text-purple-800',
      Cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      Low: 'bg-green-100 text-green-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      High: 'bg-orange-100 text-orange-800',
      Urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading projects: {error.message}</p>
        <Button onClick={() => refetch()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={className}></div>
  {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-600">Manage your projects, tasks, and team collaboration</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeProjects} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.overdueProjects} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completedProjects}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalProjects > 0
                ? Math.round((metrics.completedProjects / metrics.totalProjects) * 100)
                : 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.avgProgress)}%</div>
            <Progress value={metrics.avgProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusOptions.map((option) => (
          <Button
            key={option.value}
            variant={selectedStatus === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus(option.value as any)}
            className="flex items-center gap-2"
          >
            {option.label}
            <Badge variant="secondary" className="ml-1">
              {option.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-600 mb-4">
                {selectedStatus === 'all'
                  ? "Get started by creating your first project"
                  : `No projects with status "${selectedStatus}"`
                }
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                Create Project
              </Button>
            </div>
          ) : (
            <ProjectList
              projects={projects}
              onProjectClick={(project) => {
                // Navigate to project detail
                window.location.href = `/projects/${project.id}`;
              }}
              getStatusColor={getStatusColor}
              getPriorityColor={getPriorityColor}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Project Modal */}
      <CreateProjectModal
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
