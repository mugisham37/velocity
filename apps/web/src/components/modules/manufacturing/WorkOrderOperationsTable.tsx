'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Plus,
  Trash2,
  Clock,
  Play,
  Pause,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { WorkOrderOperation, OperationStatus } from '@/types/manufacturing';

interface WorkOrderOperationsTableProps {
  operations: WorkOrderOperation[];
  onChange: (operations: WorkOrderOperation[]) => void;
  bomNo?: string;
  productionQty: number;
}

export function WorkOrderOperationsTable({ 
  operations, 
  onChange, 
  bomNo, 
  productionQty 
}: WorkOrderOperationsTableProps) {
  const [newOperation, setNewOperation] = useState<Partial<WorkOrderOperation>>({
    time_in_mins: 0,
    hour_rate: 0,
    completed_qty: 0,
    process_loss_qty: 0,
    sequence_id: operations.length + 1,
    status: 'Pending'
  });
  const [showAddOperation, setShowAddOperation] = useState(false);

  const handleAddOperation = () => {
    if (newOperation.operation && newOperation.workstation) {
      const operation: WorkOrderOperation = {
        operation: newOperation.operation,
        bom_operation: newOperation.bom_operation,
        workstation: newOperation.workstation,
        description: newOperation.description,
        planned_start_time: newOperation.planned_start_time,
        planned_end_time: newOperation.planned_end_time,
        planned_operating_cost: (newOperation.time_in_mins || 0) * (newOperation.hour_rate || 0) / 60,
        actual_operating_cost: 0,
        hour_rate: newOperation.hour_rate || 0,
        time_in_mins: newOperation.time_in_mins || 0,
        completed_qty: 0,
        process_loss_qty: 0,
        sequence_id: newOperation.sequence_id || operations.length + 1,
        status: 'Pending'
      };
      
      onChange([...operations, operation]);
      setNewOperation({
        time_in_mins: 0,
        hour_rate: 0,
        completed_qty: 0,
        process_loss_qty: 0,
        sequence_id: operations.length + 2,
        status: 'Pending'
      });
      setShowAddOperation(false);
    }
  };

  const handleRemoveOperation = (index: number) => {
    const updatedOperations = operations.filter((_, i) => i !== index);
    // Resequence operations
    const resequencedOperations = updatedOperations.map((op, i) => ({
      ...op,
      sequence_id: i + 1
    }));
    onChange(resequencedOperations);
  };

  const handleOperationChange = (index: number, field: keyof WorkOrderOperation, value: any) => {
    const updatedOperations = [...operations];
    updatedOperations[index] = { ...updatedOperations[index], [field]: value };
    
    // Recalculate planned operating cost if time or rate changes
    if (field === 'time_in_mins' || field === 'hour_rate') {
      const timeInHours = updatedOperations[index].time_in_mins / 60;
      updatedOperations[index].planned_operating_cost = timeInHours * updatedOperations[index].hour_rate;
    }
    
    onChange(updatedOperations);
  };

  const loadFromBOM = () => {
    if (bomNo) {
      // In a real implementation, this would fetch BOM operations from API
      console.log('Loading operations from BOM:', bomNo);
      // Mock BOM operations for demonstration
      const mockBOMOperations: WorkOrderOperation[] = [
        {
          operation: 'Cutting',
          workstation: 'CNC-001',
          description: 'Cut raw material to size',
          time_in_mins: 30,
          hour_rate: 100,
          planned_operating_cost: 50,
          actual_operating_cost: 0,
          completed_qty: 0,
          process_loss_qty: 0,
          sequence_id: 1,
          status: 'Pending'
        },
        {
          operation: 'Drilling',
          workstation: 'DRILL-001',
          description: 'Drill holes as per drawing',
          time_in_mins: 45,
          hour_rate: 80,
          planned_operating_cost: 60,
          actual_operating_cost: 0,
          completed_qty: 0,
          process_loss_qty: 0,
          sequence_id: 2,
          status: 'Pending'
        },
        {
          operation: 'Assembly',
          workstation: 'ASSY-001',
          description: 'Assemble components',
          time_in_mins: 60,
          hour_rate: 120,
          planned_operating_cost: 120,
          actual_operating_cost: 0,
          completed_qty: 0,
          process_loss_qty: 0,
          sequence_id: 3,
          status: 'Pending'
        }
      ];
      onChange(mockBOMOperations);
    }
  };

  const getStatusColor = (status: OperationStatus) => {
    switch (status) {
      case 'Pending': return 'bg-gray-100 text-gray-800';
      case 'Work in Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'On Hold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: OperationStatus) => {
    switch (status) {
      case 'Pending': return AlertCircle;
      case 'Work in Progress': return Play;
      case 'Completed': return CheckCircle;
      case 'On Hold': return Pause;
      default: return AlertCircle;
    }
  };

  const totalPlannedCost = operations.reduce((sum, op) => sum + (op.planned_operating_cost || 0), 0);
  const totalActualCost = operations.reduce((sum, op) => sum + (op.actual_operating_cost || 0), 0);
  const totalTime = operations.reduce((sum, op) => sum + (op.time_in_mins || 0), 0);
  const completedOperations = operations.filter(op => op.status === 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Settings className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-gray-600">Total Operations</p>
            <p className="text-2xl font-bold text-blue-600">{operations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">{completedOperations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <p className="text-sm text-gray-600">Total Time</p>
            <p className="text-2xl font-bold text-orange-600">{totalTime}m</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Settings className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <p className="text-sm text-gray-600">Planned Cost</p>
            <p className="text-2xl font-bold text-purple-600">₹{totalPlannedCost.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Operations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Operations</span>
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
                onClick={() => setShowAddOperation(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Operation
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Operation Form */}
          {showAddOperation && (
            <Card className="mb-4 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Operation
                    </label>
                    <Input
                      type="text"
                      placeholder="Operation Name"
                      value={newOperation.operation || ''}
                      onChange={(e) => setNewOperation(prev => ({ ...prev, operation: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Workstation
                    </label>
                    <Input
                      type="text"
                      placeholder="Workstation"
                      value={newOperation.workstation || ''}
                      onChange={(e) => setNewOperation(prev => ({ ...prev, workstation: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time (mins)
                    </label>
                    <Input
                      type="number"
                      value={newOperation.time_in_mins || ''}
                      onChange={(e) => setNewOperation(prev => ({ ...prev, time_in_mins: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hour Rate
                    </label>
                    <Input
                      type="number"
                      value={newOperation.hour_rate || ''}
                      onChange={(e) => setNewOperation(prev => ({ ...prev, hour_rate: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Input
                    type="text"
                    placeholder="Operation description"
                    value={newOperation.description || ''}
                    onChange={(e) => setNewOperation(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddOperation(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddOperation}
                  >
                    Add Operation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Operations List */}
          {operations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No operations added</p>
              <p className="text-sm">Add operations manually or load from BOM</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-center py-2">Seq</th>
                    <th className="text-left py-2">Operation</th>
                    <th className="text-left py-2">Workstation</th>
                    <th className="text-right py-2">Time (mins)</th>
                    <th className="text-right py-2">Hour Rate</th>
                    <th className="text-right py-2">Planned Cost</th>
                    <th className="text-center py-2">Status</th>
                    <th className="text-right py-2">Completed Qty</th>
                    <th className="text-center py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {operations
                    .sort((a, b) => a.sequence_id - b.sequence_id)
                    .map((operation, index) => {
                      const StatusIcon = getStatusIcon(operation.status);
                      
                      return (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 text-center font-medium">
                            {operation.sequence_id}
                          </td>
                          <td className="py-3">
                            <div>
                              <div className="font-medium">{operation.operation}</div>
                              {operation.description && (
                                <div className="text-xs text-gray-500">{operation.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-3">{operation.workstation}</td>
                          <td className="py-3 text-right">
                            <Input
                              type="number"
                              className="w-20 text-right"
                              value={operation.time_in_mins}
                              onChange={(e) => handleOperationChange(index, 'time_in_mins', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="py-3 text-right">
                            <Input
                              type="number"
                              className="w-24 text-right"
                              value={operation.hour_rate}
                              onChange={(e) => handleOperationChange(index, 'hour_rate', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="py-3 text-right font-medium">
                            ₹{operation.planned_operating_cost?.toFixed(2) || '0.00'}
                          </td>
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <StatusIcon className="h-4 w-4" />
                              <Badge className={getStatusColor(operation.status)}>
                                {operation.status}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <Input
                              type="number"
                              className="w-20 text-right"
                              value={operation.completed_qty}
                              onChange={(e) => handleOperationChange(index, 'completed_qty', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="py-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveOperation(index)}
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
                    <td colSpan={5} className="py-3 text-right">Total Planned Cost:</td>
                    <td className="py-3 text-right">₹{totalPlannedCost.toFixed(2)}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operation Timeline */}
      {operations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Operation Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {operations
                .sort((a, b) => a.sequence_id - b.sequence_id)
                .map((operation, index) => {
                  const StatusIcon = getStatusIcon(operation.status);
                  const isLast = index === operations.length - 1;
                  
                  return (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex flex-col items-center">
                        <div className={`p-2 rounded-full ${
                          operation.status === 'Completed' ? 'bg-green-100' :
                          operation.status === 'Work in Progress' ? 'bg-yellow-100' :
                          'bg-gray-100'
                        }`}>
                          <StatusIcon className={`h-4 w-4 ${
                            operation.status === 'Completed' ? 'text-green-600' :
                            operation.status === 'Work in Progress' ? 'text-yellow-600' :
                            'text-gray-600'
                          }`} />
                        </div>
                        {!isLast && (
                          <div className="w-px h-8 bg-gray-300 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {operation.sequence_id}. {operation.operation}
                            </p>
                            <p className="text-sm text-gray-600">
                              {operation.workstation} • {operation.time_in_mins} mins • ₹{operation.planned_operating_cost?.toFixed(2)}
                            </p>
                          </div>
                          <Badge className={getStatusColor(operation.status)}>
                            {operation.status}
                          </Badge>
                        </div>
                        {operation.description && (
                          <p className="text-sm text-gray-500 mt-1">{operation.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}