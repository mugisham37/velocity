'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Plus, 
  Trash2, 
  Search, 
  Package, 
  AlertTriangle,
  Calculator
} from 'lucide-react';
import { BOMItem } from '@/types/manufacturing';

interface BOMItemsTableProps {
  items: BOMItem[];
  onChange: (items: BOMItem[]) => void;
  bomQuantity: number;
}

export function BOMItemsTable({ items, onChange, bomQuantity }: BOMItemsTableProps) {
  const [newItem, setNewItem] = useState<Partial<BOMItem>>({
    qty: 1,
    conversion_factor: 1,
    sourced_by_supplier: false,
    include_item_in_manufacturing: true,
    allow_alternative_item: false
  });

  const addItem = () => {
    if (!newItem.item_code) return;

    const item: BOMItem = {
      item_code: newItem.item_code,
      item_name: newItem.item_name || newItem.item_code,
      description: newItem.description || '',
      qty: newItem.qty || 1,
      uom: newItem.uom || 'Nos',
      stock_uom: newItem.stock_uom || newItem.uom || 'Nos',
      conversion_factor: newItem.conversion_factor || 1,
      rate: newItem.rate || 0,
      base_rate: newItem.rate || 0,
      amount: (newItem.qty || 1) * (newItem.rate || 0),
      base_amount: (newItem.qty || 1) * (newItem.rate || 0),
      stock_qty: (newItem.qty || 1) * (newItem.conversion_factor || 1),
      sourced_by_supplier: newItem.sourced_by_supplier || false,
      include_item_in_manufacturing: newItem.include_item_in_manufacturing !== false,
      allow_alternative_item: newItem.allow_alternative_item || false,
      source_warehouse: newItem.source_warehouse,
      operation: newItem.operation,
      bom_no: newItem.bom_no
    };

    onChange([...items, item]);
    setNewItem({
      qty: 1,
      conversion_factor: 1,
      sourced_by_supplier: false,
      include_item_in_manufacturing: true,
      allow_alternative_item: false
    });
  };

  const updateItem = (index: number, field: keyof BOMItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Recalculate amounts when qty or rate changes
    if (field === 'qty' || field === 'rate') {
      const item = updatedItems[index];
      item.amount = (item.qty || 0) * (item.rate || 0);
      item.base_amount = item.amount;
      item.stock_qty = (item.qty || 0) * (item.conversion_factor || 1);
    }

    onChange(updatedItems);
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onChange(updatedItems);
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalStockQty = items.reduce((sum, item) => sum + (item.stock_qty || 0), 0);

  return (
    <div className="space-y-4">
      {/* Add New Item Form */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium mb-3 flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add BOM Item
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label className="text-sm font-medium">Item Code *</label>
            <div className="relative">
              <Input
                placeholder="Search item..."
                value={newItem.item_code || ''}
                onChange={(e) => setNewItem(prev => ({ ...prev, item_code: e.target.value }))}
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Qty *</label>
            <Input
              type="number"
              step="0.001"
              value={newItem.qty || ''}
              onChange={(e) => setNewItem(prev => ({ ...prev, qty: parseFloat(e.target.value) || 0 }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">UOM</label>
            <Select
              value={newItem.uom || ''}
              onValueChange={(value) => setNewItem(prev => ({ ...prev, uom: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select UOM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nos">Nos</SelectItem>
                <SelectItem value="Kg">Kg</SelectItem>
                <SelectItem value="Meter">Meter</SelectItem>
                <SelectItem value="Liter">Liter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Rate</label>
            <Input
              type="number"
              step="0.01"
              value={newItem.rate || ''}
              onChange={(e) => setNewItem(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Source Warehouse</label>
            <Select
              value={newItem.source_warehouse || ''}
              onValueChange={(value) => setNewItem(prev => ({ ...prev, source_warehouse: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Stores - Main">Stores - Main</SelectItem>
                <SelectItem value="Raw Material - Main">Raw Material - Main</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={addItem} disabled={!newItem.item_code}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Code</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead>Stock Qty</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Source Warehouse</TableHead>
              <TableHead>Options</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No items added to BOM</p>
                  <p className="text-sm">Add items using the form above</p>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <span>{item.item_code}</span>
                      {item.bom_no && (
                        <Badge variant="secondary" className="text-xs">
                          Sub-BOM
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{item.item_name}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.001"
                      value={item.qty}
                      onChange={(e) => updateItem(index, 'qty', parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>{item.uom}</TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {item.stock_qty?.toFixed(3)} {item.stock_uom}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.amount?.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.source_warehouse || ''}
                      onValueChange={(value) => updateItem(index, 'source_warehouse', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Stores - Main">Stores - Main</SelectItem>
                        <SelectItem value="Raw Material - Main">Raw Material - Main</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={item.sourced_by_supplier}
                          onCheckedChange={(checked) => updateItem(index, 'sourced_by_supplier', checked)}
                        />
                        <span className="text-xs">Supplier</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={item.include_item_in_manufacturing}
                          onCheckedChange={(checked) => updateItem(index, 'include_item_in_manufacturing', checked)}
                        />
                        <span className="text-xs">Include</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      {items.length > 0 && (
        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calculator className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Total Items: {items.length}</span>
            </div>
            <div className="text-sm text-gray-600">
              Total Stock Qty: {totalStockQty.toFixed(3)}
            </div>
          </div>
          <div className="text-lg font-semibold">
            Total Amount: ₹{totalAmount.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}