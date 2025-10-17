'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { DynamicForm } from '@/components/forms';
import { Project, ProjectFormData } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: ProjectFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const form = useForm<ProjectFormData>({
    defaultValues: project ? {
      project_name: project.project_name,
      project_type: project.project_type,
      expected_start_date: project.expected_start_date,
      expected_end_date: project.expected_end_date,
      actual_start_date: project.actual_start_date,
      actual_end_date: project.actual_end_date,
      status: project.status,
      priority: project.priority,
      percent_complete: project.percent_complete,
      estimated_costing: project.estimated_costing,
      total_costing_amount: project.total_costing_amount,
      total_billable_amount: project.total_billable_amount,
      total_billed_amount: project.total_billed_amount,
      total_consumed_material_cost: project.total_consumed_material_cost,
      project_manager: project.project_manager,
      company: project.company,
      cost_center: project.cost_center,
      department: project.department,
      customer: project.customer,
      sales_order: project.sales_order,
      notes: project.notes
    } : {
      status: 'Open',
      priority: 'Medium',
      percent_complete: 0
    }
  });

  const projectFormSchema = {
    name: 'Project',
    fields: [
      // Basic Information Section
      {
        fieldname: 'project_name',
        fieldtype: 'Data',
        label: 'Project Name',
        reqd: 1,
        section_break: 1,
        section_label: 'Basic Information'
      },
      {
        fieldname: 'project_type',
        fieldtype: 'Link',
        label: 'Project Type',
        options: 'Project Type'
      },
      {
        fieldname: 'status',
        fieldtype: 'Select',
        label: 'Status',
        options: 'Open\nCompleted\nCancelled\nOn Hold',
        reqd: 1
      },
      {
        fieldname: 'priority',
        fieldtype: 'Select',
        label: 'Priority',
        options: 'Low\nMedium\nHigh\nCritical',
        reqd: 1
      },
      {
        fieldname: 'percent_complete',
        fieldtype: 'Percent',
        label: 'Percent Complete'
      },
      
      // Dates Section
      {
        fieldname: 'expected_start_date',
        fieldtype: 'Date',
        label: 'Expected Start Date',
        section_break: 1,
        section_label: 'Project Timeline'
      },
      {
        fieldname: 'expected_end_date',
        fieldtype: 'Date',
        label: 'Expected End Date'
      },
      {
        fieldname: 'actual_start_date',
        fieldtype: 'Date',
        label: 'Actual Start Date'
      },
      {
        fieldname: 'actual_end_date',
        fieldtype: 'Date',
        label: 'Actual End Date'
      },
      
      // Financial Information Section
      {
        fieldname: 'estimated_costing',
        fieldtype: 'Currency',
        label: 'Estimated Costing',
        section_break: 1,
        section_label: 'Financial Information'
      },
      {
        fieldname: 'total_costing_amount',
        fieldtype: 'Currency',
        label: 'Total Costing Amount',
        read_only: 1
      },
      {
        fieldname: 'total_billable_amount',
        fieldtype: 'Currency',
        label: 'Total Billable Amount',
        read_only: 1
      },
      {
        fieldname: 'total_billed_amount',
        fieldtype: 'Currency',
        label: 'Total Billed Amount',
        read_only: 1
      },
      {
        fieldname: 'total_consumed_material_cost',
        fieldtype: 'Currency',
        label: 'Total Consumed Material Cost',
        read_only: 1
      },
      
      // Assignment Section
      {
        fieldname: 'project_manager',
        fieldtype: 'Link',
        label: 'Project Manager',
        options: 'User',
        section_break: 1,
        section_label: 'Assignment'
      },
      
      // Company Information Section
      {
        fieldname: 'company',
        fieldtype: 'Link',
        label: 'Company',
        options: 'Company',
        reqd: 1,
        section_break: 1,
        section_label: 'Company Information'
      },
      {
        fieldname: 'cost_center',
        fieldtype: 'Link',
        label: 'Cost Center',
        options: 'Cost Center'
      },
      {
        fieldname: 'department',
        fieldtype: 'Link',
        label: 'Department',
        options: 'Department'
      },
      
      // Customer Information Section
      {
        fieldname: 'customer',
        fieldtype: 'Link',
        label: 'Customer',
        options: 'Customer',
        section_break: 1,
        section_label: 'Customer Information'
      },
      {
        fieldname: 'sales_order',
        fieldtype: 'Link',
        label: 'Sales Order',
        options: 'Sales Order'
      },
      
      // Additional Information Section
      {
        fieldname: 'notes',
        fieldtype: 'Text Editor',
        label: 'Notes',
        section_break: 1,
        section_label: 'Additional Information'
      }
    ]
  };

  const handleSubmit = (data: ProjectFormData) => {
    onSubmit(data);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          {project ? `Edit Project: ${project.project_name}` : 'New Project'}
        </h2>
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            form="project-form"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
          </Button>
        </div>
      </div>

      <DynamicForm
        id="project-form"
        schema={projectFormSchema}
        form={form}
        onSubmit={handleSubmit}
        className="space-y-6"
      />
    </Card>
  );
};

export default ProjectForm;