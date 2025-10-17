'use client';

import React, { useState } from 'react';
import { ListView } from '@/components/lists';
import { Opportunity } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, TrendingUp } from 'lucide-react';

interface OpportunityListProps {
  onCreateNew?: () => void;
  onView?: (opportunity: Opportunity) => void;
  onEdit?: (opportunity: Opportunity) => void;
  onConvert?: (opportunity: Opportunity) => void;
}

const OpportunityList: React.FC<OpportunityListProps> = ({
  onCreateNew,
  onView,
  onEdit,
  onConvert
}) => {
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([]);

  const getStatusBadgeVariant = (status: Opportunity['status']) => {
    switch (status) {
      case 'Open':
        return 'default';
      case 'Quotation':
        return 'secondary';
      case 'Reply':
        return 'outline';
      case 'Closed':
        return 'default';
      case 'Lost':
        return 'destructive';
      case 'Converted':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number | undefined, currency: string = 'USD') => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const columns = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (value: string, opportunity: Opportunity) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">
            {value || opportunity.name}
          </span>
          <span className="text-sm text-gray-500">
            {opportunity.customer_name || opportunity.party_name}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: Opportunity['status']) => (
        <Badge variant={getStatusBadgeVariant(value)}>
          {value}
        </Badge>
      )
    },
    {
      key: 'opportunity_type',
      label: 'Type',
      sortable: true
    },
    {
      key: 'opportunity_amount',
      label: 'Amount',
      sortable: true,
      render: (value: number, opportunity: Opportunity) => (
        <span className="font-medium">
          {formatCurrency(value, opportunity.currency)}
        </span>
      )
    },
    {
      key: 'probability',
      label: 'Probability',
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
      key: 'sales_stage',
      label: 'Sales Stage',
      sortable: true,
      render: (value: string) => value || '-'
    },
    {
      key: 'expected_closing',
      label: 'Expected Closing',
      sortable: true,
      render: (value: string) => value ? new Date(value).toLocaleDateString() : '-'
    },
    {
      key: 'territory',
      label: 'Territory',
      sortable: true,
      render: (value: string) => value || '-'
    },
    {
      key: 'transaction_date',
      label: 'Created',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, opportunity: Opportunity) => (
        <div className="flex items-center gap-1">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(opportunity)}
              title="View Opportunity"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(opportunity)}
              title="Edit Opportunity"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onConvert && opportunity.status === 'Open' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onConvert(opportunity)}
              title="Convert to Quotation"
            >
              <TrendingUp className="h-4 w-4" />
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
        { label: 'Quotation', value: 'Quotation' },
        { label: 'Reply', value: 'Reply' },
        { label: 'Closed', value: 'Closed' },
        { label: 'Lost', value: 'Lost' },
        { label: 'Converted', value: 'Converted' }
      ]
    },
    {
      fieldname: 'opportunity_type',
      label: 'Type',
      fieldtype: 'Select',
      options: [
        { label: 'All', value: '' },
        { label: 'Sales', value: 'Sales' },
        { label: 'Support', value: 'Support' },
        { label: 'Maintenance', value: 'Maintenance' }
      ]
    },
    {
      fieldname: 'sales_stage',
      label: 'Sales Stage',
      fieldtype: 'Link',
      options: 'Sales Stage'
    },
    {
      fieldname: 'territory',
      label: 'Territory',
      fieldtype: 'Link',
      options: 'Territory'
    },
    {
      fieldname: 'opportunity_amount',
      label: 'Amount Range',
      fieldtype: 'NumberRange'
    },
    {
      fieldname: 'probability',
      label: 'Probability Range',
      fieldtype: 'NumberRange'
    },
    {
      fieldname: 'expected_closing',
      label: 'Expected Closing',
      fieldtype: 'DateRange'
    },
    {
      fieldname: 'transaction_date',
      label: 'Created Date',
      fieldtype: 'DateRange'
    }
  ];

  const bulkActions = [
    {
      label: 'Change Status',
      action: (selectedIds: string[]) => {
        console.log('Change status for opportunities:', selectedIds);
      }
    },
    {
      label: 'Assign Territory',
      action: (selectedIds: string[]) => {
        console.log('Assign territory to opportunities:', selectedIds);
      }
    },
    {
      label: 'Export',
      action: (selectedIds: string[]) => {
        console.log('Export opportunities:', selectedIds);
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Opportunities</h1>
          <p className="text-gray-600">Track and manage sales opportunities</p>
        </div>
        {onCreateNew && (
          <Button onClick={onCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Opportunity
          </Button>
        )}
      </div>

      <ListView
        doctype="Opportunity"
        columns={columns}
        filters={filters}
        bulkActions={bulkActions}
        selectedItems={selectedOpportunities}
        onSelectionChange={setSelectedOpportunities}
        searchFields={['title', 'customer_name', 'party_name']}
        defaultSort={{ field: 'transaction_date', direction: 'desc' }}
        pageSize={20}
      />
    </div>
  );
};

export default OpportunityList;