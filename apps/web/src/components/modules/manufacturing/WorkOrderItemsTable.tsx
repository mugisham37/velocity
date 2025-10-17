'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Warehouse
} from 'lucide-react';
import { WorkOrderItem } from '@/types/manufacturing';

interface WorkOrderItemsTableProps {
  items: WorkOrderItem[];
  onChange: (items: WorkOrderItem[]) => void;
  bomNo?: string;
  productionQty: number;
}

export function WorkOrderItemsTable({ 
  items, 
  onChange, 
  bomNo, 
  productionQty 
}: WorkOrderItemsTableProps) {
  const [newItem, setNewItem] = useState<Partial<WorkOrderItem>>({
    required_qty: 0,
    transferred_qty: 0,
    consumed_qty: 0,
    returned_qty: 0,
    rate: 0
  });
  const [showAddItem, setShowAddItem] = useState(false);

  const handleAddItem = () => {
    if (newItem.item_code && newItem.required_qty) {
      const item: WorkOrderItem = {
        item_code: newItem.item_code,
        item_name: newItem.item_name || newItem.item_code,
        description: newItem.description,
        source_warehouse: newItem.source_warehouse,
        uom: newItem.uom || 'Nos',
        item_group: newItem.item_group || 'Raw Material',
        allow_alternative_item: newItem.allow_alternative_item || false,
        include_item_in_manufacturing: newItem.include_item_in_manufacturing || true,
        required_qty: newItem.required_qty,
        transferred_qty: newItem.transferred_qty || 0,
        consumed_qty: newItem.consumed_qty || 0,
        returned_qty: newItem.returned_qty || 0,
        available_qty_at_source_warehouse: newItem.available_qty_at_source_warehouse || 0,
        available_qty_at_wip_warehouse: newItem.available_qty_at_wip_warehouse || 0,
        projected_qty: newItem.projected_qty || 0,
        actual_qty: newItem.actual_qty || 0,
        rate: newItem.rate || 0,
        amount: (newItem.required_qty || 0) * (newItem.rate || 0)
      };
      
      onChange([...items, item]);
      setNewItem({
        required_qty: 0,
        transferred_qty: 0,
        consumed_qty: 0,
        returned_qty: 0,
        rate: 0
      });
      setShowAddItem(false);
    }
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onChange(updatedItems);
  };

  const handleItemChange = (index: number, field: keyof WorkOrderItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate amount if qty or rate changes
    if (field === 'required_qty' || field === 'rate') {
      updatedItems[index].amount = updatedItems[index].required_qty * updatedItems[index].rate;
    }
    
    onChange(updatedItems);
  };

  const loadFromBOM = () => {
    if (bomNo) {
      // In a real implementation, this would fetch BOM items from API
      console.log('Loading items from BOM:', bomNo);
      // Mock BOM items for demonstration
      const mockBOMItems: WorkOrderItem[] = [
        {
          item_code: 'RAW-001',
          item_name: 'Steel Rod 10mm',
          description: 'High grade steel rod',
          uom: 'Meter',
          item_group: 'Raw Material',
          allow_alternative_item: false,
          include_item_in_manufacturing: true,
          required_qty: productionQty * 2, // 2 meters per unit
          transferred_qty: 0,
          consumed_qty: 0,
          returned_qty: 0,
          available_qty_at_source_warehouse: 100,
          available_qty_at_wip_warehouse: 0,
          projected_qty: 100,
          actual_qty: 100,
          rate: 50,
          amount: productionQty * 2 * 50
        },
        {
          item_code: 'RAW-002',
          item_name: 'Bolt M8x20',
          description: 'Stainless steel bolt',
          uom: 'Nos',
          item_group: 'Raw Material',
          allow_alternative_item: true,
          include_item_in_manufacturing: true,
          required_qty: productionQty * 4, // 4 bolts per unit
          transferred_qty: 0,
          consumed_qty: 0,
          returned_qty: 0,
          available_qty_at_source_warehouse: 500,
          available_qty_at_wip_warehouse: 0,
          projected_qty: 500,
          actual_qty: 500,
          rate: 5,
          amount: productionQty * 4 * 5
        }
      ];
      onChange(mockBOMItems);
    }
  };

  const getAvailabilityStatus = (item: WorkOrderItem) => {
    if (item.available_qty_at_source_warehouse >= item.required_qty) {
      return { status: 'available', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    } else if (item.projected_qty >= item.required_qty) {
      return { status: 'projected', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    } else {
      return { status: 'shortage', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalItems = items.length;
  const availableItems = items.filter(item => 
    item.available_qty_at_source_warehouse >= item.required_qty
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-gray-600">Total Items</p>
            <p className="text-2xl font-bold text-blue-600">{totalItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-sm text-gray-600">Available</p>
            <p className="text-2xl font-bold text-green-600">{availableItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
            <p className="text-sm text-gray-600">Shortage</p>
            <p className="text-2xl font-bold text-red-600">{totalItems - availableItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Warehouse className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-purple-600">₹{totalAmount.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Required Items</span>
            </CardTitle>
            <div className="flex space-x-2">
              {bomNo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadFromBOM}
                >
                  Load from BOM
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setShowAddItem(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Item Form */}
          {showAddItem && (
            <Card className="mb-4 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Code
                    </label>
                    <Input
                      type="text"
                      placeholder="Item Code"
                      value={newItem.item_code || ''}
                      onChange={(e) => setNewItem(prev => ({ ...prev, item_code: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Required Qty
                    </label>
                    <Input
                      type="number"
                      value={newItem.required_qty || ''}
                      onChange={(e) => setNewItem(prev => ({ ...prev, required_qty: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      UOM
                    </label>
                    <Input
                      type="text"
                      placeholder="UOM"
                      value={newItem.uom || 'Nos'}
                      onChange={(e) => setNewItem(prev => ({ ...prev, uom: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rate
                    </label>
                    <Input
                      type="number"
                      value={newItem.rate || ''}
                      onChange={(e) => setNewItem(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddItem(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddItem}
                  >
                    Add Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Items List */}
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No items added</p>
              <p className="text-sm">Add items manually or load from BOM</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Item Code</th>
                    <th className="text-left py-2">Item Name</th>
                    <th className="text-right py-2">Required Qty</th>
                    <th className="text-right py-2">Available Qty</th>
                    <th className="text-center py-2">Status</th>
                    <th className="text-right py-2">Rate</th>
                    <th className="text-right py-2">Amount</th>
                    <th className="text-center py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const availability = getAvailabilityStatus(item);
                    const StatusIcon = availability.icon;
                    
                    return (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-medium">{item.item_code}</td>
                        <td className="py-3">
                          <div>
                            <div className="font-medium">{item.item_name}</div>
                            {item.description && (
                              <div className="text-xs text-gray-500">{item.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <Input
                            type="number"
                            className="w-20 text-right"
                            value={item.required_qty}
                            onChange={(e) => handleItemChange(index, 'required_qty', parseFloat(e.target.value) || 0)}
                          />
                          <div className="text-xs text-gray-500 mt-1">{item.uom}</div>
                        </td>
                        <td className="py-3 text-right">
                          <div className="font-medium">{item.available_qty_at_source_warehouse}</div>
                          <div className="text-xs text-gray-500">
                            Projected: {item.projected_qty}
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <StatusIcon className="h-4 w-4" />
                            <Badge className={availability.color}>
                              {availability.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <Input
                            type="number"
                            className="w-20 text-right"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="py-3 text-right font-medium">
                          ₹{item.amount?.toFixed(2) || '0.00'}
                        </td>
                        <td className="py-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-medium">
                    <td colSpan={6} className="py-3 text-right">Total Amount:</td>
                    <td className="py-3 text-right">₹{totalAmount.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Material Availability Summary */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Material Availability Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.filter(item => item.available_qty_at_source_warehouse < item.required_qty).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">{item.item_code}</p>
                      <p className="text-sm text-red-600">
                        Shortage: {(item.required_qty - item.available_qty_at_source_warehouse).toFixed(2)} {item.uom}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-red-100 text-red-800">
                    Action Required
                  </Badge>
                </div>
              ))}
              
              {items.every(item => item.available_qty_at_source_warehouse >= item.required_qty) && (
                <div className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">All materials are available</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}