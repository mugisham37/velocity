'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
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
  Settings, 
  Clock,
  Calculator,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { BOMOperation } from '@/types/manufacturing';

interface BOMOperationsTableProps {
  operations: BOMOperation[];
  onChange: (operations: BOMOperation[]) => void;
  routing?: string;
}

export function BOMOperationsTable({ operations, onChange, routing }: BOMOperationsTableProps) {
  const [newOperation, setNewOperation] = useState<Partial<BOMOperation>>({
    time_in_mins: 60,
    hour_rate: 100,
    batch_size: 1,
    fixed_time: false
  });

  const addOperation = () => {
    if (!newOperation.operation || !newOperation.workstation) return;

    const operation: BOMOperation = {
      operation: newOperation.operation,
      workstation: newOperation.workstation,
      description: newOperation.description || '',
      time_in_mins: newOperation.time_in_mins || 60,
      hour_rate: newOperation.hour_rate || 100,
      base_hour_rate: newOperation.hour_rate || 100,
      operating_cost: ((newOperation.time_in_mins || 60) / 60) * (newOperation.hour_rate || 100),
      base_operating_cost: ((newOperation.time_in_mins || 60) / 60) * (newOperation.hour_rate || 100),
      batch_size: newOperation.batch_size || 1,
      sequence_id: operations.length + 1,
      fixed_time: newOperation.fixed_time || false
    };

    onChange([...operations, operation]);
    setNewOperation({
      time_in_mins: 60,
      hour_rate: 100,
      batch_size: 1,
      fixed_time: false
    });
  };

  const updateOperation = (index: number, field: keyof BOMOperation, value: any) => {
    const updatedOperations = [...operations];
    updatedOperations[index] = { ...updatedOperations[index], [field]: value };

    // Recalculate operating cost when time or rate changes
    if (field === 'time_in_mins' || field === 'hour_rate') {
      const op = updatedOperations[index];
      op.operating_cost = ((op.time_in_mins || 0) / 60) * (op.hour_rate || 0);
      op.base_operating_cost = op.operating_cost;
    }

    onChange(updatedOperations);
  };

  const removeOperation = (index: number) => {
    const updatedOperations = operations.filter((_, i) => i !== index);
    // Resequence operations
    updatedOperations.forEach((op, i) => {
      op.sequence_id = i + 1;
    });
    onChange(updatedOperations);
  };

  const moveOperation = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= operations.length) return;

    const updatedOperations = [...operations];
    [updatedOperations[index], updatedOperations[newIndex]] = 
    [updatedOperations[newIndex], updatedOperations[index]];

    // Update sequence IDs
    updatedOperations.forEach((op, i) => {
      op.sequence_id = i + 1;
    });

    onChange(updatedOperations);
  };

  const totalOperatingCost = operations.reduce((sum, op) => sum + (op.operating_cost || 0), 0);
  const totalTime = operations.reduce((sum, op) => sum + (op.time_in_mins || 0), 0);

  return (
    <div className="space-y-4">
      {/* Add New Operation Form */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium mb-3 flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Operation
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label className="text-sm font-medium">Operation *</label>
            <Select
              value={newOperation.operation || ''}
              onValueChange={(value: any) => setNewOperation(prev => ({ ...prev, operation: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cutting">Cutting</SelectItem>
                <SelectItem value="Welding">Welding</SelectItem>
                <SelectItem value="Assembly">Assembly</SelectItem>
                <SelectItem value="Painting">Painting</SelectItem>
                <SelectItem value="Quality Check">Quality Check</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Workstation *</label>
            <Select
              value={newOperation.workstation || ''}
              onValueChange={(value: any) => setNewOperation(prev => ({ ...prev, workstation: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select workstation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cutting Station">Cutting Station</SelectItem>
                <SelectItem value="Welding Station">Welding Station</SelectItem>
                <SelectItem value="Assembly Line">Assembly Line</SelectItem>
                <SelectItem value="Paint Booth">Paint Booth</SelectItem>
                <SelectItem value="QC Station">QC Station</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Time (mins) *</label>
            <Input
              type="number"
              value={newOperation.time_in_mins || ''}
              onChange={(e) => setNewOperation(prev => ({ 
                ...prev, 
                time_in_mins: parseFloat(e.target.value) || 0 
              }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Hour Rate</label>
            <Input
              type="number"
              step="0.01"
              value={newOperation.hour_rate || ''}
              onChange={(e) => setNewOperation(prev => ({ 
                ...prev, 
                hour_rate: parseFloat(e.target.value) || 0 
              }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Batch Size</label>
            <Input
              type="number"
              value={newOperation.batch_size || ''}
              onChange={(e) => setNewOperation(prev => ({ 
                ...prev, 
                batch_size: parseFloat(e.target.value) || 1 
              }))}
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={addOperation} 
              disabled={!newOperation.operation || !newOperation.workstation}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Operations Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seq</TableHead>
              <TableHead>Operation</TableHead>
              <TableHead>Workstation</TableHead>
              <TableHead>Time (mins)</TableHead>
              <TableHead>Hour Rate</TableHead>
              <TableHead>Operating Cost</TableHead>
              <TableHead>Batch Size</TableHead>
              <TableHead>Fixed Time</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No operations added to BOM</p>
                  <p className="text-sm">Add operations using the form above</p>
                </TableCell>
              </TableRow>
            ) : (
              operations.map((operation, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-1">
                      <span>{operation.sequence_id}</span>
                      <div className="flex flex-col">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveOperation(index, 'up')}
                          disabled={index === 0}
                          className="h-4 w-4 p-0"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveOperation(index, 'down')}
                          disabled={index === operations.length - 1}
                          className="h-4 w-4 p-0"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{operation.operation}</TableCell>
                  <TableCell>{operation.workstation}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={operation.time_in_mins}
                      onChange={(e) => updateOperation(index, 'time_in_mins', parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={operation.hour_rate}
                      onChange={(e) => updateOperation(index, 'hour_rate', parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    ₹{operation.operating_cost?.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={operation.batch_size}
                      onChange={(e) => updateOperation(index, 'batch_size', parseFloat(e.target.value) || 1)}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={operation.fixed_time}
                      onCheckedChange={(checked: any) => updateOperation(index, 'fixed_time', checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOperation(index)}
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
      {operations.length > 0 && (
        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Total Operations: {operations.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">
                Total Time: {totalTime} mins ({(totalTime / 60).toFixed(2)} hrs)
              </span>
            </div>
          </div>
          <div className="text-lg font-semibold">
            Total Operating Cost: ₹{totalOperatingCost.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}