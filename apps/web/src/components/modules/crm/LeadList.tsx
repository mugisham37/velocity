'use client';

import React, { useState } from 'react';
import { ListView } from '@/components/lists';
import { Lead } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, ArrowRight } from 'lucide-react';

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
      key: 'lead_name',
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
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: Lead['status']) => (
        <Badge variant={getStatusBadgeVariant(value)}>
          {value}
        </Badge>
      )
    },
    {
      key: 'source',
      label: 'Source',
      sortable: true
    },
    {
      key: 'lead_type',
      label: 'Type',
      sortable: true
    },
    {
      key: 'email_id',
      label: 'Email',
      render: (value: string) => (
        <span className="text-blue-600">{value}</span>
      )
    },
    {
      key: 'mobile_no',
      label: 'Mobile',
      render: (value: string) => value || '-'
    },
    {
      key: 'territory',
      label: 'Territory',
      sortable: true,
      render: (value: string) => value || '-'
    },
    {
      key: 'lead_owner',
      label: 'Owner',
      sortable: true,
      render: (value: string) => value || 'Unassigned'
    },
    {
      key: 'creation',
      label: 'Created',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
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

  const filters = [
    {
      fieldname: 'status',
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
      label: 'Source',
      fieldtype: 'Link',
      options: 'Lead Source'
    },
    {
      fieldname: 'lead_type',
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
      label: 'Territory',
      fieldtype: 'Link',
      options: 'Territory'
    },
    {
      fieldname: 'lead_owner',
      label: 'Lead Owner',
      fieldtype: 'Link',
      options: 'User'
    },
    {
      fieldname: 'creation',
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
        columns={columns}
        filters={filters}
        bulkActions={bulkActions}
        selectedItems={selectedLeads}
        onSelectionChange={setSelectedLeads}
        searchFields={['lead_name', 'company_name', 'email_id', 'mobile_no']}
        defaultSort={{ field: 'creation', direction: 'desc' }}
        pageSize={20}
      />
    </div>
  );
};

export default LeadList;