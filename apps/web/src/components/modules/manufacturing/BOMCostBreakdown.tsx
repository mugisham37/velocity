'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
  Calculator, 
  Package, 
  Settings, 
  TrendingUp,
  PieChart,
  DollarSign
} from 'lucide-react';
import { BOM, BOMItem, BOMOperation } from '@/types/manufacturing';

interface BOMCostBreakdownProps {
  bomData: Partial<BOM>;
  items: BOMItem[];
  operations: BOMOperation[];
}

export function BOMCostBreakdown({ bomData, items, operations }: BOMCostBreakdownProps) {
  const rawMaterialCost = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const operatingCost = operations.reduce((sum, op) => sum + (op.operating_cost || 0), 0);
  const totalCost = rawMaterialCost + operatingCost;
  
  const rawMaterialPercentage = totalCost > 0 ? (rawMaterialCost / totalCost) * 100 : 0;
  const operatingPercentage = totalCost > 0 ? (operatingCost / totalCost) * 100 : 0;

  // Group items by category for better analysis
  const itemsByCategory = items.reduce((acc, item) => {
    const category = item.item_code?.split('-')[0] || 'Other';
    if (!acc[category]) {
      acc[category] = { items: [], totalCost: 0 };
    }
    acc[category].items.push(item);
    acc[category].totalCost += item.amount || 0;
    return acc;
  }, {} as Record<string, { items: BOMItem[], totalCost: number }>);

  const topCostItems = items
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Cost Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Raw Material Cost</p>
                <p className="text-2xl font-bold text-blue-600">₹{rawMaterialCost.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{rawMaterialPercentage.toFixed(1)}% of total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Operating Cost</p>
                <p className="text-2xl font-bold text-green-600">₹{operatingCost.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{operatingPercentage.toFixed(1)}% of total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-purple-600">₹{totalCost.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Per {bomData.quantity || 1} {bomData.uom || 'unit'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Unit Cost</p>
                <p className="text-2xl font-bold text-orange-600">
                  ₹{(totalCost / (bomData.quantity || 1)).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">Per unit</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Cost Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Raw Materials</span>
                <span className="text-sm text-gray-600">₹{rawMaterialCost.toFixed(2)}</span>
              </div>
              <Progress value={rawMaterialPercentage} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">{rawMaterialPercentage.toFixed(1)}%</p>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Operations</span>
                <span className="text-sm text-gray-600">₹{operatingCost.toFixed(2)}</span>
              </div>
              <Progress value={operatingPercentage} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">{operatingPercentage.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Top Cost Items</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCostItems.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No items to display</p>
              ) : (
                topCostItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{item.item_code}</p>
                      <p className="text-xs text-gray-600">{item.qty} {item.uom}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{item.amount?.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {totalCost > 0 ? ((item.amount || 0) / totalCost * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Material Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Material Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                      No items added
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.item_code}</TableCell>
                      <TableCell>{item.qty} {item.uom}</TableCell>
                      <TableCell>₹{item.rate?.toFixed(2)}</TableCell>
                      <TableCell>₹{item.amount?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {totalCost > 0 ? ((item.amount || 0) / totalCost * 100).toFixed(1) : 0}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Operation Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Operation Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operation</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                      No operations added
                    </TableCell>
                  </TableRow>
                ) : (
                  operations.map((operation, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{operation.operation}</TableCell>
                      <TableCell>{operation.time_in_mins} mins</TableCell>
                      <TableCell>₹{operation.hour_rate}/hr</TableCell>
                      <TableCell>₹{operation.operating_cost?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {totalCost > 0 ? ((operation.operating_cost || 0) / totalCost * 100).toFixed(1) : 0}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Cost Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-blue-600">{items.length}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Operations</p>
              <p className="text-2xl font-bold text-green-600">{operations.length}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Cost per Unit</p>
              <p className="text-2xl font-bold text-purple-600">
                ₹{(totalCost / (bomData.quantity || 1)).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}