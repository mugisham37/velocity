'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { ListViewContainer } from '@/components/lists';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Pause, Square, Download } from 'lucide-react';
import Link from 'next/link';
import { JobCard, JobCardStatus } from '@/types/manufacturing';

const jobCardColumns = [
  { key: 'name', label: 'Job Card', sortable: true },
  { key: 'work_order', label: 'Work Order', sortable: true },
  { key: 'production_item', label: 'Item', sortable: true },
  { key: 'operation', label: 'Operation', sortable: true },
  { key: 'workstation', label: 'Workstation', sortable: true },
  { key: 'for_quantity', label: 'For Qty', sortable: true },
  { key: 'total_completed_qty', label: 'Completed Qty', sortable: true },
  { key: 'total_time_in_mins', label: 'Time (mins)', sortable: true },
  { key: 'status', label: 'Status', sortable: true, type: 'badge' },
  { key: 'posting_date', label: 'Date', sortable: true, type: 'date' }
];

const jobCardFilters = [
  {
    fieldname: 'work_order',
    label: 'Work Order',
    fieldtype: 'Link',
    options: 'Work Order'
  },
  {
    fieldname: 'production_item',
    label: 'Production Item',
    fieldtype: 'Link',
    options: 'Item'
  },
  {
    fieldname: 'operation',
    label: 'Operation',
    fieldtype: 'Link',
    options: 'Operation'
  },
  {
    fieldname: 'workstation',
    label: 'Workstation',
    fieldtype: 'Link',
    options: 'Workstation'
  },
  {
    fieldname: 'status',
    label: 'Status',
    fieldtype: 'Select',
    options: 'Open\nWork in Progress\nMaterial Transferred\nOn Hold\nCompleted\nCancelled'
  },
  {
    fieldname: 'employee',
    label: 'Employee',
    fieldtype: 'Link',
    options: 'Employee'
  },
  {
    fieldname: 'posting_date',
    label: 'Posting Date',
    fieldtype: 'Date'
  }
];

const getStatusColor = (status: JobCardStatus) => {
  switch (status) {
    case 'Open': return 'bg-blue-100 text-blue-800';
    case 'Work in Progress': return 'bg-yellow-100 text-yellow-800';
    case 'Material Transferred': return 'bg-purple-100 text-purple-800';
    case 'On Hold': return 'bg-orange-100 text-orange-800';
    case 'Completed': return 'bg-green-100 text-green-800';
    case 'Cancelled': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function JobCardListPage() {
  const [selectedJobCards, setSelectedJobCards] = useState<string[]>([]);

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} on Job Cards:`, selectedJobCards);
    // Implement bulk actions like start, pause, complete, etc.
  };

  const bulkActions = [
    {
      label: 'Start Job',
      action: 'start',
      icon: Play,
      condition: (selected: string[]) => selected.length > 0
    },
    {
      label: 'Pause Job',
      action: 'pause',
      icon: Pause,
      condition: (selected: string[]) => selected.length > 0
    },
    {
      label: 'Complete Job',
      action: 'complete',
      icon: Square,
      condition: (selected: string[]) => selected.length > 0
    },
    {
      label: 'Export',
      action: 'export',
      icon: Download,
      condition: (selected: string[]) => selected.length > 0
    }
  ];

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Cards</h1>
            <p className="text-gray-600 mt-1">
              Shop floor operations and time tracking
            </p>
          </div>
          <div className="flex space-x-3">
            <Link href="/manufacturing/job-card/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Job Card
              </Button>
            </Link>
          </div>
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          {[
            { status: 'Open', count: 0, color: 'bg-blue-100 text-blue-800' },
            { status: 'Work in Progress', count: 0, color: 'bg-yellow-100 text-yellow-800' },
            { status: 'Material Transferred', count: 0, color: 'bg-purple-100 text-purple-800' },
            { status: 'On Hold', count: 0, color: 'bg-orange-100 text-orange-800' },
            { status: 'Completed', count: 0, color: 'bg-green-100 text-green-800' },
            { status: 'Cancelled', count: 0, color: 'bg-gray-100 text-gray-800' }
          ].map((item) => (
            <div key={item.status} className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{item.status}</p>
                  <p className="text-2xl font-bold">{item.count}</p>
                </div>
                <Badge className={item.color}>
                  {item.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* List View */}
        <ListViewContainer
          doctype="Job Card"
          title="Job Cards"
          columns={jobCardColumns}
          filters={jobCardFilters}
          defaultSort={[{ fieldname: 'posting_date', direction: 'desc' }]}
          onSelectionChange={setSelectedJobCards}
          bulkActions={bulkActions}
          onBulkAction={handleBulkAction}
          searchFields={['name', 'work_order', 'production_item', 'operation']}
          enableGrouping={true}
          groupByOptions={[
            { value: 'status', label: 'Status' },
            { value: 'work_order', label: 'Work Order' },
            { value: 'operation', label: 'Operation' },
            { value: 'workstation', label: 'Workstation' },
            { value: 'employee', label: 'Employee' }
          ]}
          customViews={[
            {
              name: 'In Progress',
              filters: [{ fieldname: 'status', operator: '=', value: 'Work in Progress' }]
            },
            {
              name: 'Open Jobs',
              filters: [{ fieldname: 'status', operator: '=', value: 'Open' }]
            },
            {
              name: 'On Hold',
              filters: [{ fieldname: 'status', operator: '=', value: 'On Hold' }]
            },
            {
              name: 'Today\'s Jobs',
              filters: [
                { fieldname: 'posting_date', operator: '=', value: new Date().toISOString().split('T')[0] }
              ]
            }
          ]}
          customRowRenderer={(jobCard: JobCard) => ({
            ...jobCard,
            status: (
              <Badge className={getStatusColor(jobCard.status)}>
                {jobCard.status}
              </Badge>
            ),
            total_time_in_mins: (
              <div className="text-right">
                <div className="font-medium">{jobCard.total_time_in_mins}</div>
                <div className="text-xs text-gray-500">
                  {(jobCard.total_time_in_mins / 60).toFixed(1)} hrs
                </div>
              </div>
            ),
            total_completed_qty: (
              <div className="text-right">
                <div className="font-medium">{jobCard.total_completed_qty}</div>
                <div className="text-xs text-gray-500">
                  of {jobCard.for_quantity}
                </div>
              </div>
            )
          })}
        />
      </div>
    </AppLayout>
  );
}