'use client';

import React, { useState } from 'react';
import { ListView } from '@/components/lists';
import { Customer } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Building, User, Globe, Phone, Mail } from 'lucide-react';

interface CustomerListProps {
  onCreateNew?: () => void;
  onView?: (customer: Customer) => void;
  onEdit?: (customer: Customer) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({
  onCreateNew,
  onView,
  onEdit
}) => {
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  const getCustomerTypeIcon = (type: Customer['customer_type']) => {
    return type === 'Company' ? (
      <Building className="h-4 w-4 text-blue-600" />
    ) : (
      <User className="h-4 w-4 text-green-600" />
    );
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
      fieldname: 'customer_name',
      fieldtype: 'Data',
      label: 'Customer Name',
      sortable: true,
      render: (value: string, customer: Customer) => (
        <div className="flex items-center gap-3">
          {getCustomerTypeIcon(customer.customer_type)}
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{value}</span>
            <span className="text-sm text-gray-500">{customer.customer_type}</span>
          </div>
        </div>
      )
    },
    {
      fieldname: 'customer_group',
      fieldtype: 'Link',
      label: 'Customer Group',
      sortable: true
    },
    {
      fieldname: 'territory',
      fieldtype: 'Link',
      label: 'Territory',
      sortable: true
    },
    {
      fieldname: 'email_id',
      fieldtype: 'Data',
      label: 'Email',
      render: (value: string) => (
        value ? (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-blue-600">{value}</span>
          </div>
        ) : '-'
      )
    },
    {
      fieldname: 'mobile_no',
      fieldtype: 'Data',
      label: 'Mobile',
      render: (value: string) => (
        value ? (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <span>{value}</span>
          </div>
        ) : '-'
      )
    },
    {
      fieldname: 'website',
      fieldtype: 'Data',
      label: 'Website',
      render: (value: string) => (
        value ? (
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-400" />
            <a 
              href={value.startsWith('http') ? value : `https://${value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {value}
            </a>
          </div>
        ) : '-'
      )
    },
    {
      fieldname: 'default_currency',
      fieldtype: 'Link',
      label: 'Currency',
      sortable: true
    },
    {
      fieldname: 'credit_limit',
      fieldtype: 'Currency',
      label: 'Credit Limit',
      sortable: true,
      render: (value: number, customer: Customer) => (
        <span className="font-medium">
          {formatCurrency(value, customer.default_currency)}
        </span>
      )
    },
    {
      fieldname: 'disabled',
      fieldtype: 'Check',
      label: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <Badge variant={value ? 'destructive' : 'default'}>
          {value ? 'Disabled' : 'Active'}
        </Badge>
      )
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
      render: (_: any, customer: Customer) => (
        <div className="flex items-center gap-1">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(customer)}
              title="View Customer"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(customer)}
              title="Edit Customer"
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
      fieldname: 'customer_type',
      operator: '=' as const,
      value: '',
      label: 'Customer Type',
      fieldtype: 'Select',
      options: [
        { label: 'All', value: '' },
        { label: 'Company', value: 'Company' },
        { label: 'Individual', value: 'Individual' }
      ]
    },
    {
      fieldname: 'customer_group',
      operator: '=' as const,
      value: '',
      label: 'Customer Group',
      fieldtype: 'Link',
      options: 'Customer Group'
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
      fieldname: 'default_currency',
      operator: '=' as const,
      value: '',
      label: 'Currency',
      fieldtype: 'Link',
      options: 'Currency'
    },
    {
      fieldname: 'market_segment',
      operator: '=' as const,
      value: '',
      label: 'Market Segment',
      fieldtype: 'Link',
      options: 'Market Segment'
    },
    {
      fieldname: 'industry',
      operator: '=' as const,
      value: '',
      label: 'Industry',
      fieldtype: 'Link',
      options: 'Industry Type'
    },
    {
      fieldname: 'disabled',
      operator: '=' as const,
      value: '',
      label: 'Status',
      fieldtype: 'Select',
      options: [
        { label: 'All', value: '' },
        { label: 'Active', value: '0' },
        { label: 'Disabled', value: '1' }
      ]
    },
    {
      fieldname: 'credit_limit',
      operator: '>=' as const,
      value: '',
      label: 'Credit Limit Range',
      fieldtype: 'NumberRange'
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
      label: 'Enable/Disable',
      action: (selectedIds: string[]) => {
        console.log('Toggle status for customers:', selectedIds);
      }
    },
    {
      label: 'Assign Territory',
      action: (selectedIds: string[]) => {
        console.log('Assign territory to customers:', selectedIds);
      }
    },
    {
      label: 'Update Customer Group',
      action: (selectedIds: string[]) => {
        console.log('Update customer group for:', selectedIds);
      }
    },
    {
      label: 'Export',
      action: (selectedIds: string[]) => {
        console.log('Export customers:', selectedIds);
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage customer information and relationships</p>
        </div>
        {onCreateNew && (
          <Button onClick={onCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Customer
          </Button>
        )}
      </div>

      <ListView
        doctype="Customer"
        data={[]}
        totalCount={0}
        columns={columns}
        filters={filters}
        onBulkAction={(action, selection) => {
          const actionItem = bulkActions.find(a => a.label === action);
          if (actionItem) actionItem.action(selection);
        }}
        selection={selectedCustomers}
        onSelect={setSelectedCustomers}
      />
    </div>
  );
};

export default CustomerList;