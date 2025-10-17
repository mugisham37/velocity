'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { ListViewContainer } from '@/components/lists';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Download, Upload } from 'lucide-react';
import Link from 'next/link';
import { BOM } from '@/types/manufacturing';

const bomColumns = [
  { key: 'name', label: 'BOM ID', sortable: true },
  { key: 'item', label: 'Item Code', sortable: true },
  { key: 'item_name', label: 'Item Name', sortable: true },
  { key: 'quantity', label: 'Quantity', sortable: true },
  { key: 'uom', label: 'UOM', sortable: false },
  { key: 'total_cost', label: 'Total Cost', sortable: true, type: 'currency' },
  { key: 'is_active', label: 'Active', sortable: true, type: 'boolean' },
  { key: 'is_default', label: 'Default', sortable: true, type: 'boolean' },
  { key: 'modified', label: 'Last Modified', sortable: true, type: 'datetime' }
];

const bomFilters = [
  {
    fieldname: 'item',
    label: 'Item',
    fieldtype: 'Link',
    options: 'Item'
  },
  {
    fieldname: 'is_active',
    label: 'Active',
    fieldtype: 'Check'
  },
  {
    fieldname: 'is_default',
    label: 'Default',
    fieldtype: 'Check'
  },
  {
    fieldname: 'with_operations',
    label: 'With Operations',
    fieldtype: 'Check'
  },
  {
    fieldname: 'total_cost',
    label: 'Total Cost',
    fieldtype: 'Currency'
  }
];

export default function BOMListPage() {
  const [selectedBOMs, setSelectedBOMs] = useState<string[]>([]);

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} on BOMs:`, selectedBOMs);
    // Implement bulk actions like activate/deactivate, export, etc.
  };

  const bulkActions = [
    {
      label: 'Activate',
      action: 'activate',
      icon: FileText,
      condition: (selected: string[]) => selected.length > 0
    },
    {
      label: 'Deactivate',
      action: 'deactivate',
      icon: FileText,
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
            <h1 className="text-3xl font-bold text-gray-900">Bill of Materials</h1>
            <p className="text-gray-600 mt-1">
              Manage BOMs with multi-level structure and costing
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
            <Link href="/manufacturing/bom/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New BOM
              </Button>
            </Link>
          </div>
        </div>

        {/* List View */}
        <ListViewContainer
          doctype="BOM"
          title="Bill of Materials"
          columns={bomColumns}
          filters={bomFilters}
          defaultSort={[{ fieldname: 'modified', direction: 'desc' }]}
          onSelectionChange={setSelectedBOMs}
          bulkActions={bulkActions}
          onBulkAction={handleBulkAction}
          searchFields={['name', 'item', 'item_name']}
          enableGrouping={true}
          groupByOptions={[
            { value: 'item', label: 'Item' },
            { value: 'is_active', label: 'Active Status' },
            { value: 'with_operations', label: 'With Operations' }
          ]}
          customViews={[
            {
              name: 'Active BOMs',
              filters: [{ fieldname: 'is_active', operator: '=', value: true }]
            },
            {
              name: 'Default BOMs',
              filters: [{ fieldname: 'is_default', operator: '=', value: true }]
            },
            {
              name: 'With Operations',
              filters: [{ fieldname: 'with_operations', operator: '=', value: true }]
            }
          ]}
        />
      </div>
    </AppLayout>
  );
}