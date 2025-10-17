'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { DynamicForm } from '@/components/forms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Send, 
  Copy, 
  FileText, 
  Calculator,
  TreePine,
  Settings,
  AlertCircle
} from 'lucide-react';
import { BOM, BOMItem, BOMOperation } from '@/types/manufacturing';
import { BOMItemsTable } from '@/components/modules/manufacturing/BOMItemsTable';
import { BOMOperationsTable } from '@/components/modules/manufacturing/BOMOperationsTable';
import { BOMCostBreakdown } from '@/components/modules/manufacturing/BOMCostBreakdown';
import { BOMTreeView } from '@/components/modules/manufacturing/BOMTreeView';

const bomSchema = {
  name: 'BOM',
  module: 'Manufacturing',
  fields: [
    {
      fieldname: 'item',
      fieldtype: 'Link',
      label: 'Item',
      options: 'Item',
      reqd: true
    },
    {
      fieldname: 'item_name',
      fieldtype: 'Data',
      label: 'Item Name',
      readonly: true
    },
    {
      fieldname: 'quantity',
      fieldtype: 'Float',
      label: 'Quantity',
      reqd: true,
      default: 1
    },
    {
      fieldname: 'uom',
      fieldtype: 'Link',
      label: 'UOM',
      options: 'UOM',
      reqd: true
    },
    {
      fieldname: 'is_active',
      fieldtype: 'Check',
      label: 'Is Active',
      default: true
    },
    {
      fieldname: 'is_default',
      fieldtype: 'Check',
      label: 'Is Default'
    },
    {
      fieldname: 'with_operations',
      fieldtype: 'Check',
      label: 'With Operations'
    },
    {
      fieldname: 'transfer_material_against',
      fieldtype: 'Select',
      label: 'Transfer Material Against',
      options: 'Work Order\nJob Card',
      default: 'Work Order'
    },
    {
      fieldname: 'routing',
      fieldtype: 'Link',
      label: 'Routing',
      options: 'Routing',
      depends_on: 'with_operations'
    },
    {
      fieldname: 'project',
      fieldtype: 'Link',
      label: 'Project',
      options: 'Project'
    },
    {
      fieldname: 'description',
      fieldtype: 'Text',
      label: 'Description'
    }
  ],
  permissions: [],
  links: [],
  actions: [],
  listSettings: {
    columns: ['name', 'item', 'quantity', 'total_cost', 'is_active'],
    filters: [],
    sort: []
  },
  formSettings: {
    layout: { columns: 2, sections: [] },
    sections: []
  }
};

export default function NewBOMPage() {
  const [bomData, setBomData] = useState<Partial<BOM>>({
    quantity: 1,
    is_active: true,
    with_operations: false,
    transfer_material_against: 'Work Order',
    items: [],
    operations: [],
    total_cost: 0,
    raw_material_cost: 0,
    operating_cost: 0
  });
  
  const [activeTab, setActiveTab] = useState('details');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormChange = (data: Partial<BOM>) => {
    setBomData(prev => ({ ...prev, ...data }));
  };

  const handleItemsChange = (items: BOMItem[]) => {
    const rawMaterialCost = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    setBomData(prev => ({
      ...prev,
      items,
      raw_material_cost: rawMaterialCost,
      total_cost: rawMaterialCost + (prev.operating_cost || 0)
    }));
  };

  const handleOperationsChange = (operations: BOMOperation[]) => {
    const operatingCost = operations.reduce((sum, op) => sum + (op.operating_cost || 0), 0);
    setBomData(prev => ({
      ...prev,
      operations,
      operating_cost: operatingCost,
      total_cost: (prev.raw_material_cost || 0) + operatingCost
    }));
  };

  const handleSave = async (submit = false) => {
    setIsSubmitting(true);
    try {
      // API call to save BOM
      console.log('Saving BOM:', { ...bomData, docstatus: submit ? 1 : 0 });
      // Redirect to BOM list or show success message
    } catch (error) {
      console.error('Error saving BOM:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = bomData.item && bomData.quantity && bomData.items && bomData.items.length > 0;

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Bill of Materials</h1>
            <p className="text-gray-600 mt-1">
              Create a new BOM with items and operations
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Copy from Template
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleSave(false)}
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button 
              size="sm"
              onClick={() => handleSave(true)}
              disabled={isSubmitting || !canSubmit}
            >
              <Send className="h-4 w-4 mr-2" />
              Submit
            </Button>
          </div>
        </div>

        {/* Status and Validation */}
        {!canSubmit && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-orange-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Validation Required</span>
              </div>
              <ul className="mt-2 text-sm text-orange-700 list-disc list-inside">
                {!bomData.item && <li>Item is required</li>}
                {!bomData.quantity && <li>Quantity is required</li>}
                {(!bomData.items || bomData.items.length === 0) && <li>At least one BOM item is required</li>}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Form Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Details</span>
            </TabsTrigger>
            <TabsTrigger value="items" className="flex items-center space-x-2">
              <TreePine className="h-4 w-4" />
              <span>Items ({bomData.items?.length || 0})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="operations" 
              className="flex items-center space-x-2"
              disabled={!bomData.with_operations}
            >
              <Settings className="h-4 w-4" />
              <span>Operations ({bomData.operations?.length || 0})</span>
            </TabsTrigger>
            <TabsTrigger value="costing" className="flex items-center space-x-2">
              <Calculator className="h-4 w-4" />
              <span>Costing</span>
            </TabsTrigger>
            <TabsTrigger value="tree" className="flex items-center space-x-2">
              <TreePine className="h-4 w-4" />
              <span>Tree View</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>BOM Details</CardTitle>
              </CardHeader>
              <CardContent>
                <DynamicForm
                  schema={bomSchema}
                  data={bomData}
                  onChange={handleFormChange}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>BOM Items</CardTitle>
                  <Badge variant="secondary">
                    {bomData.items?.length || 0} items
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <BOMItemsTable
                  items={bomData.items || []}
                  onChange={handleItemsChange}
                  bomQuantity={bomData.quantity || 1}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operations">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>BOM Operations</CardTitle>
                  <Badge variant="secondary">
                    {bomData.operations?.length || 0} operations
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {bomData.with_operations ? (
                  <BOMOperationsTable
                    operations={bomData.operations || []}
                    onChange={handleOperationsChange}
                    routing={bomData.routing}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enable "With Operations" to add operations to this BOM</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costing">
            <BOMCostBreakdown
              bomData={bomData}
              items={bomData.items || []}
              operations={bomData.operations || []}
            />
          </TabsContent>

          <TabsContent value="tree">
            <Card>
              <CardHeader>
                <CardTitle>BOM Tree Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <BOMTreeView
                  bomData={bomData}
                  items={bomData.items || []}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}