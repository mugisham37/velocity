'use client';

import React, { useState } from 'react';
import { ListView } from '@/components/lists';
import { Lead } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, ArrowRight } from 'lucide-react';
import { useListView } from '@/hooks/useListView';

interface LeadListProps {
  onCreateNew?: () => void;
  onView?: (lead: Lead) => void;
  onEdit?: (lead: Lead) => void;
  onConvert?: (lead: Lead) => void;
}

const LeadList: React.FC<LeadListProps> = ({
  onCreateNew,
  onView,
  onEdit,
  onConvert
}) => {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  
  const {
    data,
    totalCount,
    isLoading,
    filters,
    setFilters,
    selection,
    setSelection
  } = useListView({
    doctype: 'Lead',
    initialSort: [{ fieldname: 'creation', direction: 'desc' }]
  });

  const getStatusBadgeVariant = (status: Lead['status']) => {
    switch (status) {
      case 'Open':
        return 'default';
      case 'Replied':
        return 'secondary';
      case 'Opportunity':
        return 'outline';
      case 'Quotation':
        return 'secondary';
      case 'Lost Quotation':
        return 'destructive';
      case 'Interested':
        return 'default';
      case 'Converted':
        return 'default';
      case 'Do Not Contact':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      fieldname: 'lead_name',
      fieldtype: 'Data',
      label: 'Lead Name',
      sortable: true,
      render: (value: string, lead: Lead) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{value}</span>
          {lead.company_name && (
            <span className="text-sm text-gray-500">{lead.company_name}</span>
          )}
        </div>
      )
    },
    {
      fieldname: 'status',
      fieldtype: 'Select',
      label: 'Status',
      sortable: true,
      render: (value: Lead['status']) => (
        <Badge variant={getStatusBadgeVariant(value)}>
          {value}
        </Badge>
      )
    },
    {
      fieldname: 'source',
      fieldtype: 'Data',
      label: 'Source',
      sortable: true
    },
    {
      fieldname: 'lead_type',
      fieldtype: 'Data',
      label: 'Type',
      sortable: true
    },
    {
      fieldname: 'email_id',
      fieldtype: 'Data',
      label: 'Email',
      render: (value: string) => (
        <span className="text-blue-600">{value}</span>
      )
    },
    {
      fieldname: 'mobile_no',
      fieldtype: 'Data',
      label: 'Mobile',
      render: (value: string) => value || '-'
    },
    {
      fieldname: 'territory',
      fieldtype: 'Link',
      label: 'Territory',
      sortable: true,
      render: (value: string) => value || '-'
    },
    {
      fieldname: 'lead_owner',
      fieldtype: 'Link',
      label: 'Owner',
      sortable: true,
      render: (value: string) => value || 'Unassigned'
    },
    {
      fieldname: 'creation',
      fieldtype: 'Datetime',
      label: 'Created',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      fieldname: 'actions',
      fieldtype: 'Data',
      label: 'Actions',
      render: (_: any, lead: Lead) => (
        <div className="flex items-center gap-1">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(lead)}
              title="View Lead"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(lead)}
              title="Edit Lead"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onConvert && lead.status !== 'Converted' && lead.status !== 'Do Not Contact' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onConvert(lead)}
              title="Convert to Opportunity"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  const filterOptions = [
    {
      fieldname: 'status',
      operator: '=' as const,
      value: '',
      label: 'Status',
      fieldtype: 'Select',
      options: [
        { label: 'All', value: '' },
        { label: 'Open', value: 'Open' },
        { label: 'Replied', value: 'Replied' },
        { label: 'Opportunity', value: 'Opportunity' },
        { label: 'Quotation', value: 'Quotation' },
        { label: 'Lost Quotation', value: 'Lost Quotation' },
        { label: 'Interested', value: 'Interested' },
        { label: 'Converted', value: 'Converted' },
        { label: 'Do Not Contact', value: 'Do Not Contact' }
      ]
    },
    {
      fieldname: 'source',
      operator: '=' as const,
      value: '',
      label: 'Source',
      fieldtype: 'Link',
      options: 'Lead Source'
    },
    {
      fieldname: 'lead_type',
      operator: '=' as const,
      value: '',
      label: 'Lead Type',
      fieldtype: 'Select',
      options: [
        { label: 'All', value: '' },
        { label: 'Client', value: 'Client' },
        { label: 'Channel Partner', value: 'Channel Partner' },
        { label: 'Consultant', value: 'Consultant' }
      ]
    },
    {
      fieldname: 'territory',
      operator: '=' as const,
      value: '',
      label: 'Territory',
      fieldtype: 'Link',
      options: 'Territory'
    },
    {
      fieldname: 'lead_owner',
      operator: '=' as const,
      value: '',
      label: 'Lead Owner',
      fieldtype: 'Link',
      options: 'User'
    },
    {
      fieldname: 'creation',
      operator: '>=' as const,
      value: '',
      label: 'Created Date',
      fieldtype: 'DateRange'
    }
  ];

  const bulkActions = [
    {
      label: 'Assign to User',
      action: (selectedIds: string[]) => {
        console.log('Assign leads:', selectedIds);
      }
    },
    {
      label: 'Change Status',
      action: (selectedIds: string[]) => {
        console.log('Change status for leads:', selectedIds);
      }
    },
    {
      label: 'Export',
      action: (selectedIds: string[]) => {
        console.log('Export leads:', selectedIds);
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
          <p className="text-gray-600">Manage and track your sales leads</p>
        </div>
        {onCreateNew && (
          <Button onClick={onCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Lead
          </Button>
        )}
      </div>

      <ListView
        doctype="Lead"
        data={data}
        totalCount={totalCount}
        isLoading={isLoading}
        columns={columns}
        filters={filterOptions}
        onFilter={setFilters}
        onBulkAction={(action, selection) => {
          const actionItem = bulkActions.find(a => a.label === action);
          if (actionItem) actionItem.action(selection);
        }}
        selection={selection}
        onSelect={setSelection}
      />
    </div>
  );
};

export default LeadList;