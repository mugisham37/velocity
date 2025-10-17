'use client';

import React, { useState } from 'react';
import { ListView } from '@/components/lists';
import { Contact } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Mail, Phone, Building, User } from 'lucide-react';

interface ContactListProps {
  onCreateNew?: () => void;
  onView?: (contact: Contact) => void;
  onEdit?: (contact: Contact) => void;
}

const ContactList: React.FC<ContactListProps> = ({
  onCreateNew,
  onView,
  onEdit
}) => {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const getStatusBadgeVariant = (status: Contact['status']) => {
    switch (status) {
      case 'Open':
        return 'default';
      case 'Replied':
        return 'default';
      case 'Passive':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const columns = [
    {
      key: 'full_name',
      label: 'Name',
      sortable: true,
      render: (value: string, contact: Contact) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-full">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">
              {value || `${contact.first_name} ${contact.last_name || ''}`.trim()}
            </span>
            {contact.designation && (
              <span className="text-sm text-gray-500">{contact.designation}</span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'company_name',
      label: 'Company',
      sortable: true,
      render: (value: string) => (
        value ? (
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-gray-400" />
            <span>{value}</span>
          </div>
        ) : '-'
      )
    },
    {
      key: 'email_id',
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
      key: 'mobile_no',
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
      key: 'phone',
      label: 'Phone',
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
      key: 'department',
      label: 'Department',
      sortable: true,
      render: (value: string) => value || '-'
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: Contact['status']) => (
        <Badge variant={getStatusBadgeVariant(value)}>
          {value}
        </Badge>
      )
    },
    {
      key: 'unsubscribed',
      label: 'Subscription',
      sortable: true,
      render: (value: boolean) => (
        <Badge variant={value ? 'destructive' : 'default'}>
          {value ? 'Unsubscribed' : 'Subscribed'}
        </Badge>
      )
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
      render: (_: any, contact: Contact) => (
        <div className="flex items-center gap-1">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(contact)}
              title="View Contact"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(contact)}
              title="Edit Contact"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {contact.email_id && !contact.unsubscribed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`mailto:${contact.email_id}`, '_blank')}
              title="Send Email"
            >
              <Mail className="h-4 w-4" />
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
        { label: 'Passive', value: 'Passive' }
      ]
    },
    {
      fieldname: 'unsubscribed',
      label: 'Subscription Status',
      fieldtype: 'Select',
      options: [
        { label: 'All', value: '' },
        { label: 'Subscribed', value: '0' },
        { label: 'Unsubscribed', value: '1' }
      ]
    },
    {
      fieldname: 'company_name',
      label: 'Company',
      fieldtype: 'Data'
    },
    {
      fieldname: 'designation',
      label: 'Designation',
      fieldtype: 'Data'
    },
    {
      fieldname: 'department',
      label: 'Department',
      fieldtype: 'Data'
    },
    {
      fieldname: 'creation',
      label: 'Created Date',
      fieldtype: 'DateRange'
    }
  ];

  const bulkActions = [
    {
      label: 'Change Status',
      action: (selectedIds: string[]) => {
        console.log('Change status for contacts:', selectedIds);
      }
    },
    {
      label: 'Subscribe/Unsubscribe',
      action: (selectedIds: string[]) => {
        console.log('Toggle subscription for contacts:', selectedIds);
      }
    },
    {
      label: 'Send Email',
      action: (selectedIds: string[]) => {
        console.log('Send email to contacts:', selectedIds);
      }
    },
    {
      label: 'Export',
      action: (selectedIds: string[]) => {
        console.log('Export contacts:', selectedIds);
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Contacts</h1>
          <p className="text-gray-600">Manage contact information and communication history</p>
        </div>
        {onCreateNew && (
          <Button onClick={onCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Contact
          </Button>
        )}
      </div>

      <ListView
        doctype="Contact"
        columns={columns}
        filters={filters}
        bulkActions={bulkActions}
        selectedItems={selectedContacts}
        onSelectionChange={setSelectedContacts}
        searchFields={['first_name', 'last_name', 'full_name', 'email_id', 'mobile_no', 'company_name']}
        defaultSort={{ field: 'creation', direction: 'desc' }}
        pageSize={20}
      />
    </div>
  );
};

export default ContactList;