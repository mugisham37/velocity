'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { ListViewContainer } from '@/components/lists';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Pause, Square, Download, Upload } from 'lucide-react';
import Link from 'next/link';
import { WorkOrder, WorkOrderStatus } from '@/types/manufacturing';

const workOrderColumns = [
  { key: 'name', label: 'Work Order', sortable: true },
  { key: 'production_item', label: 'Item', sortable: true },
  { key: 'item_name', label: 'Item Name', sortable: true },
  { key: 'qty', label: 'Qty to Produce', sortable: true },
  { key: 'produced_qty', label: 'Produced Qty', sortable: true },
  { key: 'pending_qty', label: 'Pending Qty', sortable: true },
  { key: 'status', label: 'Status', sortable: true, type: 'badge' },
  { key: 'planned_start_date', label: 'Start Date', sortable: true, type: 'date' },
  { key: 'planned_end_date', label: 'End Date', sortable: true, type: 'date' },
  { key: 'modified', label: 'Last Modified', sortable: true, type: 'datetime' }
];

const workOrderFilters = [
  {
    fieldname: 'production_item',
    label: 'Production Item',
    fieldtype: 'Link',
    options: 'Item'
  },
  {
    fieldname: 'status',
    label: 'Status',
    fieldtype: 'Select',
    options: 'Draft\nNot Started\nIn Process\nCompleted\nStopped\nCancelled'
  },
  {
    fieldname: 'planned_start_date',
    label: 'Planned Start Date',
    fieldtype: 'Date'
  },
  {
    fieldname: 'planned_end_date',
    label: 'Planned End Date',
    fieldtype: 'Date'
  },
  {
    fieldname: 'fg_warehouse',
    label: 'Target Warehouse',
    fieldtype: 'Link',
    options: 'Warehouse'
  },
  {
    fieldname: 'wip_warehouse',
    label: 'WIP Warehouse',
    fieldtype: 'Link',
    options: 'Warehouse'
  }
];

const getStatusColor = (status: WorkOrderStatus) => {
  switch (status) {
    case 'Draft': return 'bg-gray-100 text-gray-800';
    case 'Not Started': return 'bg-blue-100 text-blue-800';
    case 'In Process': return 'bg-yellow-100 text-yellow-800';
    case 'Completed': return 'bg-green-100 text-green-800';
    case 'Stopped': return 'bg-red-100 text-red-800';
    case 'Cancelled': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function WorkOrderListPage() {
  const [selectedWorkOrders, setSelectedWorkOrders] = useState<string[]>([]);

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} on Work Orders:`, selectedWorkOrders);
    // Implement bulk actions like start, stop, complete, etc.
  };

  const bulkActions = [
    {
      label: 'Start Production',
      action: 'start',
      icon: Play,
      condition: (selected: string[]) => selected.length > 0
    },
    {
      label: 'Stop Production',
      action: 'stop',
      icon: Pause,
      condition: (selected: string[]) => selected.length > 0
    },
    {
      label: 'Complete',
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
            <h1 className="text-3xl font-bold text-gray-900">Work Orders</h1>
            <p className="text-gray-600 mt-1">
              Production planning and scheduling
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Link href="/manufacturing/work-order/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Work Order
              </Button>
            </Link>
          </div>
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          {[
            { status: 'Draft', count: 0, color: 'bg-gray-100 text-gray-800' },
            { status: 'Not Started', count: 0, color: 'bg-blue-100 text-blue-800' },
            { status: 'In Process', count: 0, color: 'bg-yellow-100 text-yellow-800' },
            { status: 'Completed', count: 0, color: 'bg-green-100 text-green-800' },
            { status: 'Stopped', count: 0, color: 'bg-red-100 text-red-800' },
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
          doctype="Work Order"
          title="Work Orders"
          columns={workOrderColumns}
          filters={workOrderFilters}
          defaultSort={[{ fieldname: 'planned_start_date', direction: 'desc' }]}
          onSelectionChange={setSelectedWorkOrders}
          bulkActions={bulkActions}
          onBulkAction={handleBulkAction}
          searchFields={['name', 'production_item', 'item_name']}
          enableGrouping={true}
          groupByOptions={[
            { value: 'status', label: 'Status' },
            { value: 'production_item', label: 'Production Item' },
            { value: 'fg_warehouse', label: 'Target Warehouse' },
            { value: 'planned_start_date', label: 'Start Date' }
          ]}
          customViews={[
            {
              name: 'In Progress',
              filters: [{ fieldname: 'status', operator: '=', value: 'In Process' }]
            },
            {
              name: 'Not Started',
              filters: [{ fieldname: 'status', operator: '=', value: 'Not Started' }]
            },
            {
              name: 'Overdue',
              filters: [
                { fieldname: 'planned_end_date', operator: '<', value: new Date().toISOString().split('T')[0] },
                { fieldname: 'status', operator: 'in', value: ['Not Started', 'In Process'] }
              ]
            },
            {
              name: 'This Week',
              filters: [
                { fieldname: 'planned_start_date', operator: '>=', value: new Date().toISOString().split('T')[0] },
                { fieldname: 'planned_start_date', operator: '<=', value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
              ]
            }
          ]}
          customRowRenderer={(workOrder: WorkOrder) => ({
            ...workOrder,
            status: (
              <Badge className={getStatusColor(workOrder.status)}>
                {workOrder.status}
              </Badge>
            ),
            pending_qty: (
              <div className="text-right">
                <div className="font-medium">{workOrder.pending_qty}</div>
                <div className="text-xs text-gray-500">
                  {workOrder.qty > 0 ? ((workOrder.produced_qty / workOrder.qty) * 100).toFixed(1) : 0}% complete
                </div>
              </div>
            )
          })}
        />
      </div>
    </AppLayout>
  );
}