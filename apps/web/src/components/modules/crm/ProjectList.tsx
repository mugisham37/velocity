'use client';

import React, { useState } from 'react';
import { ListView } from '@/components/lists';
import { Project } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Calendar, DollarSign, User, Target } from 'lucide-react';

interface ProjectListProps {
  onCreateNew?: () => void;
  onView?: (project: Project) => void;
  onEdit?: (project: Project) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
  onCreateNew,
  onView,
  onEdit
}) => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  const getStatusBadgeVariant = (status: Project['status']) => {
    switch (status) {
      case 'Open':
        return 'default';
      case 'Completed':
        return 'default';
      case 'Cancelled':
        return 'destructive';
      case 'On Hold':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: Project['priority']) => {
    switch (priority) {
      case 'Critical':
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

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const columns = [
    {
      key: 'project_name',
      label: 'Project Name',
      sortable: true,
      render: (value: string, project: Project) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Target className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{value}</span>
            {project.project_type && (
              <span className="text-sm text-gray-500">{project.project_type}</span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: Project['status']) => (
        <Badge variant={getStatusBadgeVariant(value)}>
          {value}
        </Badge>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (value: Project['priority']) => (
        <Badge variant={getPriorityBadgeVariant(value)}>
          {value}
        </Badge>
      )
    },
    {
      key: 'percent_complete',
      label: 'Progress',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${value || 0}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">{value || 0}%</span>
        </div>
      )
    },
    {
      key: 'project_manager',
      label: 'Manager',
      sortable: true,
      render: (value: string) => (
        value ? (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span>{value}</span>
          </div>
        ) : '-'
      )
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (value: string) => value || '-'
    },
    {
      key: 'estimated_costing',
      label: 'Estimated Cost',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{formatCurrency(value)}</span>
        </div>
      )
    },
    {
      key: 'expected_start_date',
      label: 'Start Date',
      sortable: true,
      render: (value: string) => (
        value ? (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>{new Date(value).toLocaleDateString()}</span>
          </div>
        ) : '-'
      )
    },
    {
      key: 'expected_end_date',
      label: 'End Date',
      sortable: true,
      render: (value: string) => (
        value ? (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>{new Date(value).toLocaleDateString()}</span>
          </div>
        ) : '-'
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, project: Project) => (
        <div className="flex items-center gap-1">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(project)}
              title="View Project"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(project)}
              title="Edit Project"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  const filters = [
    {
      fieldname: 'status',
      label: 'Status',
      fieldtype: 'Select',
      options: [
        { label: 'All', value: '' },
        { label: 'Open', value: 'Open' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Cancelled', value: 'Cancelled' },
        { label: 'On Hold', value: 'On Hold' }
      ]
    },
    {
      fieldname: 'priority',
      label: 'Priority',
      fieldtype: 'Select',
      options: [
        { label: 'All', value: '' },
        { label: 'Critical', value: 'Critical' },
        { label: 'High', value: 'High' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Low', value: 'Low' }
      ]
    },
    {
      fieldname: 'project_manager',
      label: 'Project Manager',
      fieldtype: 'Link',
      options: 'User'
    },
    {
      fieldname: 'customer',
      label: 'Customer',
      fieldtype: 'Link',
      options: 'Customer'
    },
    {
      fieldname: 'company',
      label: 'Company',
      fieldtype: 'Link',
      options: 'Company'
    },
    {
      fieldname: 'department',
      label: 'Department',
      fieldtype: 'Link',
      options: 'Department'
    },
    {
      fieldname: 'expected_start_date',
      label: 'Start Date Range',
      fieldtype: 'DateRange'
    },
    {
      fieldname: 'expected_end_date',
      label: 'End Date Range',
      fieldtype: 'DateRange'
    },
    {
      fieldname: 'estimated_costing',
      label: 'Cost Range',
      fieldtype: 'NumberRange'
    }
  ];

  const bulkActions = [
    {
      label: 'Change Status',
      action: (selectedIds: string[]) => {
        console.log('Change status for projects:', selectedIds);
      }
    },
    {
      label: 'Assign Manager',
      action: (selectedIds: string[]) => {
        console.log('Assign manager to projects:', selectedIds);
      }
    },
    {
      label: 'Update Priority',
      action: (selectedIds: string[]) => {
        console.log('Update priority for projects:', selectedIds);
      }
    },
    {
      label: 'Export',
      action: (selectedIds: string[]) => {
        console.log('Export projects:', selectedIds);
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage project planning and execution</p>
        </div>
        {onCreateNew && (
          <Button onClick={onCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      <ListView
        doctype="Project"
        columns={columns}
        filters={filters}
        bulkActions={bulkActions}
        selectedItems={selectedProjects}
        onSelectionChange={setSelectedProjects}
        searchFields={['project_name', 'customer', 'project_manager']}
        defaultSort={{ field: 'creation', direction: 'desc' }}
        pageSize={20}
      />
    </div>
  );
};

export default ProjectList;