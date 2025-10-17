'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckSquare, 
  Clock, 
  User, 
  Calendar,
  Plus,
  Edit,
  Eye,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { Task } from '@/types/crm';

interface TaskManagementProps {
  projectId?: string;
  onCreateTask?: () => void;
  onEditTask?: (task: Task) => void;
  onViewTask?: (task: Task) => void;
}

const TaskManagement: React.FC<TaskManagementProps> = ({
  projectId,
  onCreateTask,
  onEditTask,
  onViewTask
}) => {
  const [activeTab, setActiveTab] = useState('kanban');

  // Mock data - in real implementation, this would come from API
  const tasks: Task[] = [
    {
      name: 'TASK-001',
      subject: 'Design user interface mockups',
      project: 'PRJ-001',
      exp_start_date: '2024-01-15',
      exp_end_date: '2024-01-20',
      act_start_date: '2024-01-15',
      status: 'Working',
      priority: 'High',
      progress: 75,
      assigned_to: 'john.doe@example.com',
      expected_time: 40,
      actual_time: 30,
      description: 'Create detailed UI mockups for the customer portal',
      creation: '2024-01-10T10:00:00Z',
      modified: '2024-01-15T14:30:00Z'
    },
    {
      name: 'TASK-002',
      subject: 'Implement authentication system',
      project: 'PRJ-001',
      exp_start_date: '2024-01-18',
      exp_end_date: '2024-01-25',
      status: 'Open',
      priority: 'Urgent',
      progress: 0,
      assigned_to: 'jane.smith@example.com',
      expected_time: 60,
      actual_time: 0,
      description: 'Set up user authentication and authorization',
      creation: '2024-01-10T10:00:00Z',
      modified: '2024-01-10T10:00:00Z'
    },
    {
      name: 'TASK-003',
      subject: 'Database schema design',
      project: 'PRJ-001',
      exp_start_date: '2024-01-12',
      exp_end_date: '2024-01-16',
      act_start_date: '2024-01-12',
      act_end_date: '2024-01-16',
      status: 'Completed',
      priority: 'Medium',
      progress: 100,
      assigned_to: 'mike.wilson@example.com',
      expected_time: 32,
      actual_time: 28,
      description: 'Design and implement database schema',
      creation: '2024-01-08T09:00:00Z',
      modified: '2024-01-16T16:00:00Z'
    },
    {
      name: 'TASK-004',
      subject: 'API integration testing',
      project: 'PRJ-001',
      exp_start_date: '2024-01-20',
      exp_end_date: '2024-01-22',
      status: 'Pending Review',
      priority: 'Medium',
      progress: 90,
      assigned_to: 'sarah.johnson@example.com',
      expected_time: 16,
      actual_time: 14,
      description: 'Test all API endpoints and integration points',
      creation: '2024-01-12T11:00:00Z',
      modified: '2024-01-20T15:00:00Z'
    }
  ];

  const getStatusBadgeVariant = (status: Task['status']) => {
    switch (status) {
      case 'Open':
        return 'outline';
      case 'Working':
        return 'default';
      case 'Pending Review':
        return 'secondary';
      case 'Completed':
        return 'default';
      case 'Cancelled':
        return 'destructive';
      case 'Overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: Task['priority']) => {
    switch (priority) {
      case 'Urgent':
        return 'destructive';
      case 'High':
        return 'destructive';
      case 'Medium':
        return 'secondary';
      case 'Low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'Open':
        return <Clock className="h-4 w-4" />;
      case 'Working':
        return <Play className="h-4 w-4" />;
      case 'Pending Review':
        return <Pause className="h-4 w-4" />;
      case 'Completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'Overdue':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <CheckSquare className="h-4 w-4" />;
    }
  };

  const tasksByStatus = {
    'Open': tasks.filter(t => t.status === 'Open'),
    'Working': tasks.filter(t => t.status === 'Working'),
    'Pending Review': tasks.filter(t => t.status === 'Pending Review'),
    'Completed': tasks.filter(t => t.status === 'Completed')
  };

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'Completed').length,
    inProgress: tasks.filter(t => t.status === 'Working').length,
    overdue: tasks.filter(t => {
      const today = new Date();
      const endDate = new Date(t.exp_end_date || '');
      return endDate < today && t.status !== 'Completed';
    }).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Task Management</h1>
          <p className="text-gray-600">
            {projectId ? `Tasks for project ${projectId}` : 'Manage tasks and track progress'}
          </p>
        </div>
        {onCreateTask && (
          <Button onClick={onCreateTask} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CheckSquare className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-orange-600">{taskStats.inProgress}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Play className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{taskStats.overdue}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
              <Card key={status} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status as Task['status'])}
                    <h3 className="font-semibold text-gray-900">{status}</h3>
                  </div>
                  <Badge variant="outline">{statusTasks.length}</Badge>
                </div>
                <div className="space-y-3">
                  {statusTasks.map((task) => (
                    <Card key={task.name} className="p-3 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm">{task.subject}</h4>
                          <Badge variant={getPriorityBadgeVariant(task.priority)} className="text-xs">
                            {task.priority}
                          </Badge>
                        </div>
                        
                        {task.assigned_to && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <User className="h-3 w-3" />
                            <span>{task.assigned_to.split('@')[0]}</span>
                          </div>
                        )}
                        
                        {task.exp_end_date && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(task.exp_end_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        
                        {task.progress !== undefined && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Progress</span>
                              <span>{task.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-1 pt-2">
                          {onViewTask && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewTask(task)}
                              className="h-6 w-6 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                          {onEditTask && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditTask(task)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getStatusIcon(task.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{task.subject}</h4>
                        <Badge variant={getStatusBadgeVariant(task.status)}>
                          {task.status}
                        </Badge>
                        <Badge variant={getPriorityBadgeVariant(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {task.assigned_to && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{task.assigned_to.split('@')[0]}</span>
                          </div>
                        )}
                        {task.exp_end_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {new Date(task.exp_end_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {task.expected_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{task.expected_time}h estimated</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${task.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{task.progress || 0}%</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {task.actual_time || 0}h / {task.expected_time || 0}h
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {onViewTask && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewTask(task)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onEditTask && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditTask(task)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Project Timeline</h3>
              <Button variant="outline" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Gantt View
              </Button>
            </div>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Timeline visualization would go here</p>
                <p className="text-sm text-gray-400">Gantt chart or timeline view</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskManagement;