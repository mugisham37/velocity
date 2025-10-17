'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronRight, 
  Package, 
  TreePine,
  Layers,
  Calculator,
  Eye,
  Download
} from 'lucide-react';
import { BOM, BOMItem } from '@/types/manufacturing';

interface BOMTreeViewProps {
  bomData: Partial<BOM>;
  items: BOMItem[];
}

interface TreeNode {
  id: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
  level: number;
  has_bom: boolean;
  bom_no?: string;
  children: TreeNode[];
  expanded: boolean;
  parent_qty: number;
  total_qty: number;
}

export function BOMTreeView({ bomData, items }: BOMTreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showCosts, setShowCosts] = useState(true);

  // Build tree structure from BOM items
  const buildTreeNodes = (items: BOMItem[], parentQty = 1, level = 1): TreeNode[] => {
    return items.map((item, index) => {
      const nodeId = `${level}-${index}-${item.item_code}`;
      const totalQty = (item.qty || 0) * parentQty;
      
      const node: TreeNode = {
        id: nodeId,
        item_code: item.item_code,
        item_name: item.item_name,
        qty: item.qty || 0,
        uom: item.uom,
        rate: item.rate || 0,
        amount: item.amount || 0,
        level,
        has_bom: !!item.bom_no,
        bom_no: item.bom_no,
        children: [],
        expanded: expandedNodes.has(nodeId),
        parent_qty: parentQty,
        total_qty: totalQty
      };

      // If item has sub-BOM, we would fetch and add children here
      // For now, we'll simulate some sub-items for demonstration
      if (item.bom_no && level < 3) {
        node.children = [
          {
            id: `${nodeId}-sub-1`,
            item_code: `${item.item_code}-PART-1`,
            item_name: `${item.item_name} Part 1`,
            qty: 2,
            uom: 'Nos',
            rate: (item.rate || 0) * 0.3,
            amount: (item.rate || 0) * 0.3 * 2,
            level: level + 1,
            has_bom: false,
            children: [],
            expanded: false,
            parent_qty: totalQty,
            total_qty: totalQty * 2
          },
          {
            id: `${nodeId}-sub-2`,
            item_code: `${item.item_code}-PART-2`,
            item_name: `${item.item_name} Part 2`,
            qty: 1,
            uom: 'Nos',
            rate: (item.rate || 0) * 0.7,
            amount: (item.rate || 0) * 0.7,
            level: level + 1,
            has_bom: false,
            children: [],
            expanded: false,
            parent_qty: totalQty,
            total_qty: totalQty * 1
          }
        ];
      }

      return node;
    });
  };

  const treeNodes = buildTreeNodes(items);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    const allNodeIds = new Set<string>();
    const collectNodeIds = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.has_bom || node.children.length > 0) {
          allNodeIds.add(node.id);
        }
        collectNodeIds(node.children);
      });
    };
    collectNodeIds(treeNodes);
    setExpandedNodes(allNodeIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const renderTreeNode = (node: TreeNode): React.ReactNode => {
    const hasChildren = node.has_bom || node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const indentLevel = (node.level - 1) * 24;

    return (
      <div key={node.id} className="select-none">
        <div 
          className="flex items-center py-2 px-2 hover:bg-gray-50 rounded cursor-pointer"
          style={{ paddingLeft: `${indentLevel + 8}px` }}
        >
          {/* Expand/Collapse Button */}
          <div className="w-6 h-6 flex items-center justify-center mr-2">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-4 h-4 p-0"
                onClick={() => toggleNode(node.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>

          {/* Item Icon */}
          <div className="mr-3">
            {node.has_bom ? (
              <Layers className="h-4 w-4 text-blue-600" />
            ) : (
              <Package className="h-4 w-4 text-gray-600" />
            )}
          </div>

          {/* Item Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm">{node.item_code}</span>
              {node.has_bom && (
                <Badge variant="secondary" className="text-xs">
                  BOM
                </Badge>
              )}
            </div>
            <div className="text-xs text-gray-600 truncate">
              {node.item_name}
            </div>
          </div>

          {/* Quantity */}
          <div className="text-right mr-4 min-w-0">
            <div className="text-sm font-medium">
              {node.qty} {node.uom}
            </div>
            <div className="text-xs text-gray-600">
              Total: {node.total_qty.toFixed(3)}
            </div>
          </div>

          {/* Cost (if enabled) */}
          {showCosts && (
            <div className="text-right min-w-0">
              <div className="text-sm font-medium">
                ₹{node.rate.toFixed(2)}
              </div>
              <div className="text-xs text-gray-600">
                ₹{node.amount.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  const totalItems = items.length;
  const totalCost = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const maxLevel = Math.max(...items.map(() => 1)); // Would be calculated from actual tree depth

  return (
    <div className="space-y-4">
      {/* Tree Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <TreePine className="h-5 w-5 text-gray-600" />
            <span className="font-medium">BOM Tree Structure</span>
          </div>
          <Badge variant="outline">
            {totalItems} items
          </Badge>
          <Badge variant="outline">
            Level {maxLevel}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCosts(!showCosts)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showCosts ? 'Hide' : 'Show'} Costs
          </Button>
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Tree View */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {bomData.item} - {bomData.item_name}
            </CardTitle>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Qty: {bomData.quantity} {bomData.uom}</span>
              {showCosts && <span>Total Cost: ₹{totalCost.toFixed(2)}</span>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tree Header */}
          <div className="flex items-center py-2 px-2 bg-gray-50 rounded text-sm font-medium text-gray-700 mb-2">
            <div className="w-6 mr-2"></div>
            <div className="w-6 mr-3"></div>
            <div className="flex-1">Item</div>
            <div className="text-right mr-4 w-20">Quantity</div>
            {showCosts && <div className="text-right w-20">Cost</div>}
          </div>

          {/* Tree Nodes */}
          <div className="max-h-96 overflow-y-auto">
            {treeNodes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <TreePine className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No items to display in tree view</p>
                <p className="text-sm">Add items to see the BOM structure</p>
              </div>
            ) : (
              treeNodes.map(node => renderTreeNode(node))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tree Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-gray-600">Total Items</p>
            <p className="text-xl font-bold">{totalItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Layers className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-sm text-gray-600">Sub-BOMs</p>
            <p className="text-xl font-bold">
              {items.filter(item => item.bom_no).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TreePine className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <p className="text-sm text-gray-600">Max Level</p>
            <p className="text-xl font-bold">{maxLevel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calculator className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-xl font-bold">₹{totalCost.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}