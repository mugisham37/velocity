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
  Play, 
  FileText, 
  Package,
  Settings,
  Clock,
  AlertCircle,
  Calculator
} from 'lucide-react';
import { WorkOrder, WorkOrderItem, WorkOrderOperation } from '@/types/manufacturing';
import { WorkOrderItemsTable } from '@/components/modules/manufacturing/WorkOrderItemsTable';
import { WorkOrderOperationsTable } from '@/components/modules/manufacturing/WorkOrderOperationsTable';
import { WorkOrderScheduling } from '@/components/modules/manufacturing/WorkOrderScheduling';

const workOrderSchema = {
  name: 'Work Order',
  module: 'Manufacturing',
  fields: [
    {
      fieldname: 'production_item',
      fieldtype: 'Link',
      label: 'Production Item',
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
      fieldname: 'bom_no',
      fieldtype: 'Link',
      label: 'BOM No',
      options: 'BOM',
      reqd: true
    },
    {
      fieldname: 'qty',
      fieldtype: 'Float',
      label: 'Qty to Produce',
      reqd: true
    },
    {
      fieldname: 'company',
      fieldtype: 'Link',
      label: 'Company',
      options: 'Company',
      reqd: true
    },
    {
      fieldname: 'fg_warehouse',
      fieldtype: 'Link',
      label: 'Target Warehouse',
      options: 'Warehouse',
      reqd: true
    },
    {
      fieldname: 'wip_warehouse',
      fieldtype: 'Link',
      label: 'Work-in-Progress Warehouse',
      options: 'Warehouse',
      reqd: true
    },
    {
      fieldname: 'source_warehouse',
      fieldtype: 'Link',
      label: 'Source Warehouse',
      options: 'Warehouse'
    },
    {
      fieldname: 'scrap_warehouse',
      fieldtype: 'Link',
      label: 'Scrap Warehouse',
      options: 'Warehouse'
    },
    {
      fieldname: 'planned_start_date',
      fieldtype: 'Datetime',
      label: 'Planned Start Date',
      reqd: true
    },
    {
      fieldname: 'planned_end_date',
      fieldtype: 'Datetime',
      label: 'Planned End Date',
      reqd: true
    },
    {
      fieldname: 'expected_delivery_date',
      fieldtype: 'Date',
      label: 'Expected Delivery Date'
    },
    {
      fieldname: 'sales_order',
      fieldtype: 'Link',
      label: 'Sales Order',
      options: 'Sales Order'
    },
    {
      fieldname: 'sales_order_item',
      fieldtype: 'Data',
      label: 'Sales Order Item',
      readonly: true,
      depends_on: 'sales_order'
    },
    {
      fieldname: 'project',
      fieldtype: 'Link',
      label: 'Project',
      options: 'Project'
    },
    {
      fieldname: 'use_multi_level_bom',
      fieldtype: 'Check',
      label: 'Use Multi-Level BOM',
      default: true
    },
    {
      fieldname: 'skip_transfer',
      fieldtype: 'Check',
      label: 'Skip Material Transfer to WIP Warehouse'
    },
    {
      fieldname: 'update_consumed_material_cost_in_project',
      fieldtype: 'Check',
      label: 'Update Consumed Material Cost In Project',
      depends_on: 'project'
    }
  ],
  permissions: [],
  links: [],
  actions: [],
  listSettings: {
    columns: ['name', 'production_item', 'qty', 'status', 'planned_start_date'],
    filters: [],
    sort: []
  },
  formSettings: {
    layout: { columns: 2, sections: [] },
    sections: []
  }
};

export default function NewWorkOrderPage() {
  const [workOrderData, setWorkOrderData] = useState<Partial<WorkOrder>>({
    qty: 1,
    use_multi_level_bom: true,
    skip_transfer: false,
    update_consumed_material_cost_in_project: false,
    status: 'Draft',
    required_items: [],
    operations: [],
    produced_qty: 0,
    pending_qty: 0,
    material_transferred_for_manufacturing: 0
  });
  
  const [activeTab, setActiveTab] = useState('details');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormChange = (data: Partial<WorkOrder>) => {
    setWorkOrderData(prev => {
      const updated = { ...prev, ...data };
      
      // Calculate pending quantity when qty changes
      if (data.qty !== undefined) {
        updated.pending_qty = data.qty - (updated.produced_qty || 0);
      }
      
      return updated;
    });
  };

  const handleItemsChange = (items: WorkOrderItem[]) => {
    setWorkOrderData(prev => ({
      ...prev,
      required_items: items
    }));
  };

  const handleOperationsChange = (operations: WorkOrderOperation[]) => {
    setWorkOrderData(prev => ({
      ...prev,
      operations
    }));
  };

  const handleSave = async (submit = false) => {
    setIsSubmitting(true);
    try {
      // API call to save Work Order
      console.log('Saving Work Order:', { ...workOrderData, docstatus: submit ? 1 : 0 });
      // Redirect to Work Order list or show success message
    } catch (error) {
      console.error('Error saving Work Order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartProduction = async () => {
    setIsSubmitting(true);
    try {
      // API call to start production
      console.log('Starting production for Work Order:', workOrderData.name);
      setWorkOrderData(prev => ({ ...prev, status: 'In Process' }));
    } catch (error) {
      console.error('Error starting production:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = workOrderData.production_item && 
                   workOrderData.bom_no && 
                   workOrderData.qty && 
                   workOrderData.fg_warehouse && 
                   workOrderData.wip_warehouse &&
                   workOrderData.planned_start_date &&
                   workOrderData.planned_end_date;

  const canStartProduction = workOrderData.status === 'Not Started' && canSubmit;

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Work Order</h1>
            <p className="text-gray-600 mt-1">
              Create a new work order for production planning
            </p>
          </div>
          <div className="flex space-x-3">
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
              variant="outline"
              size="sm"
              onClick={() => handleSave(true)}
              disabled={isSubmitting || !canSubmit}
            >
              <Send className="h-4 w-4 mr-2" />
              Submit
            </Button>
            <Button 
              size="sm"
              onClick={handleStartProduction}
              disabled={isSubmitting || !canStartProduction}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Production
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
                {!workOrderData.production_item && <li>Production Item is required</li>}
                {!workOrderData.bom_no && <li>BOM No is required</li>}
                {!workOrderData.qty && <li>Quantity to Produce is required</li>}
                {!workOrderData.fg_warehouse && <li>Target Warehouse is required</li>}
                {!workOrderData.wip_warehouse && <li>WIP Warehouse is required</li>}
                {!workOrderData.planned_start_date && <li>Planned Start Date is required</li>}
                {!workOrderData.planned_end_date && <li>Planned End Date is required</li>}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Production Summary */}
        {workOrderData.production_item && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">To Produce</p>
                    <p className="text-2xl font-bold text-blue-600">{workOrderData.qty || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Produced</p>
                    <p className="text-2xl font-bold text-green-600">{workOrderData.produced_qty || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-orange-600">{workOrderData.pending_qty || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Progress</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {workOrderData.qty ? ((workOrderData.produced_qty || 0) / workOrderData.qty * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Form Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Details</span>
            </TabsTrigger>
            <TabsTrigger value="items" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Required Items ({workOrderData.required_items?.length || 0})</span>
            </TabsTrigger>
            <TabsTrigger value="operations" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Operations ({workOrderData.operations?.length || 0})</span>
            </TabsTrigger>
            <TabsTrigger value="scheduling" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Scheduling</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center space-x-2">
              <Calculator className="h-4 w-4" />
              <span>Progress</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Work Order Details</CardTitle>
              </CardHeader>
              <CardContent>
                <DynamicForm
                  schema={workOrderSchema}
                  data={workOrderData}
                  onChange={handleFormChange}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Required Items</CardTitle>
                  <Badge variant="secondary">
                    {workOrderData.required_items?.length || 0} items
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <WorkOrderItemsTable
                  items={workOrderData.required_items || []}
                  onChange={handleItemsChange}
                  bomNo={workOrderData.bom_no}
                  productionQty={workOrderData.qty || 1}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operations">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Operations</CardTitle>
                  <Badge variant="secondary">
                    {workOrderData.operations?.length || 0} operations
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <WorkOrderOperationsTable
                  operations={workOrderData.operations || []}
                  onChange={handleOperationsChange}
                  bomNo={workOrderData.bom_no}
                  productionQty={workOrderData.qty || 1}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduling">
            <WorkOrderScheduling
              workOrderData={workOrderData}
              onChange={handleFormChange}
            />
          </TabsContent>

          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>Production Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Production progress will be shown here</p>
                  <p className="text-sm">Start production to track progress</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}