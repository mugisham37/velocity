'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Settings,
  Play,
  BarChart3
} from 'lucide-react';
import { WorkOrder } from '@/types/manufacturing';

interface WorkOrderSchedulingProps {
  workOrderData: Partial<WorkOrder>;
  onChange: (data: Partial<WorkOrder>) => void;
}

interface CapacityData {
  workstation: string;
  available_capacity: number;
  allocated_capacity: number;
  utilization_percentage: number;
  status: 'Available' | 'Overloaded' | 'Full';
}

export function WorkOrderScheduling({ workOrderData, onChange }: WorkOrderSchedulingProps) {
  const [capacityData, setCapacityData] = useState<CapacityData[]>([
    {
      workstation: 'CNC-001',
      available_capacity: 480, // minutes per day
      allocated_capacity: 360,
      utilization_percentage: 75,
      status: 'Available'
    },
    {
      workstation: 'DRILL-001',
      available_capacity: 480,
      allocated_capacity: 480,
      utilization_percentage: 100,
      status: 'Full'
    },
    {
      workstation: 'ASSY-001',
      available_capacity: 480,
      allocated_capacity: 520,
      utilization_percentage: 108,
      status: 'Overloaded'
    }
  ]);

  const [schedulingMode, setSchedulingMode] = useState<'manual' | 'auto'>('manual');
  const [leadTime, setLeadTime] = useState(0);

  const calculateLeadTime = () => {
    if (workOrderData.operations && workOrderData.operations.length > 0) {
      const totalTime = workOrderData.operations.reduce((sum, op) => sum + (op.time_in_mins || 0), 0);
      const leadTimeHours = Math.ceil(totalTime / 60);
      setLeadTime(leadTimeHours);
      
      // Auto-calculate end date based on start date and lead time
      if (workOrderData.planned_start_date) {
        const startDate = new Date(workOrderData.planned_start_date);
        const endDate = new Date(startDate.getTime() + leadTimeHours * 60 * 60 * 1000);
        onChange({ 
          planned_end_date: endDate.toISOString(),
          lead_time: leadTimeHours
        });
      }
    }
  };

  const autoSchedule = () => {
    // Auto-scheduling logic
    const now = new Date();
    const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Start tomorrow
    
    calculateLeadTime();
    
    onChange({
      planned_start_date: startDate.toISOString(),
      lead_time: leadTime
    });
  };

  const getCapacityStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Full': return 'bg-yellow-100 text-yellow-800';
      case 'Overloaded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCapacityStatusIcon = (status: string) => {
    switch (status) {
      case 'Available': return CheckCircle;
      case 'Full': return Clock;
      case 'Overloaded': return AlertTriangle;
      default: return Settings;
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (hours: number) => {
    if (hours < 24) {
      return `${hours} hours`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days} days ${remainingHours} hours` : `${days} days`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Scheduling Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Scheduling Mode</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <Button
              variant={schedulingMode === 'manual' ? 'default' : 'outline'}
              onClick={() => setSchedulingMode('manual')}
            >
              Manual Scheduling
            </Button>
            <Button
              variant={schedulingMode === 'auto' ? 'default' : 'outline'}
              onClick={() => setSchedulingMode('auto')}
            >
              Auto Scheduling
            </Button>
          </div>
          
          {schedulingMode === 'auto' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-800">Auto Scheduling Enabled</p>
                  <p className="text-sm text-blue-600">
                    System will automatically calculate optimal start and end dates based on capacity
                  </p>
                </div>
                <Button size="sm" onClick={autoSchedule}>
                  <Play className="h-4 w-4 mr-2" />
                  Schedule Now
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Schedule Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Planned Start Date & Time
              </label>
              <Input
                type="datetime-local"
                value={workOrderData.planned_start_date ? 
                  new Date(workOrderData.planned_start_date).toISOString().slice(0, 16) : ''}
                onChange={(e) => onChange({ planned_start_date: e.target.value })}
                disabled={schedulingMode === 'auto'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Planned End Date & Time
              </label>
              <Input
                type="datetime-local"
                value={workOrderData.planned_end_date ? 
                  new Date(workOrderData.planned_end_date).toISOString().slice(0, 16) : ''}
                onChange={(e) => onChange({ planned_end_date: e.target.value })}
                disabled={schedulingMode === 'auto'}
              />
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-gray-600" />
              <p className="text-sm text-gray-600">Lead Time</p>
              <p className="text-xl font-bold text-gray-900">
                {workOrderData.lead_time ? formatDuration(workOrderData.lead_time) : 'Not calculated'}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-600">Start Date</p>
              <p className="text-sm font-medium text-blue-900">
                {workOrderData.planned_start_date ? 
                  formatDateTime(workOrderData.planned_start_date) : 'Not set'}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-sm text-gray-600">End Date</p>
              <p className="text-sm font-medium text-green-900">
                {workOrderData.planned_end_date ? 
                  formatDateTime(workOrderData.planned_end_date) : 'Not set'}
              </p>
            </div>
          </div>
          
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={calculateLeadTime}
              disabled={!workOrderData.operations || workOrderData.operations.length === 0}
            >
              <Clock className="h-4 w-4 mr-2" />
              Calculate Lead Time
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Capacity Planning */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Capacity Planning</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {capacityData.map((capacity, index) => {
              const StatusIcon = getCapacityStatusIcon(capacity.status);
              
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <StatusIcon className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium">{capacity.workstation}</p>
                        <p className="text-sm text-gray-600">
                          {capacity.allocated_capacity} / {capacity.available_capacity} minutes allocated
                        </p>
                      </div>
                    </div>
                    <Badge className={getCapacityStatusColor(capacity.status)}>
                      {capacity.status}
                    </Badge>
                  </div>
                  
                  {/* Capacity Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full ${
                        capacity.utilization_percentage <= 80 ? 'bg-green-500' :
                        capacity.utilization_percentage <= 100 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(capacity.utilization_percentage, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Utilization: {capacity.utilization_percentage}%</span>
                    <span>
                      Available: {capacity.available_capacity - capacity.allocated_capacity} minutes
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Capacity Summary */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-sm text-green-600">Available Workstations</p>
              <p className="text-2xl font-bold text-green-800">
                {capacityData.filter(c => c.status === 'Available').length}
              </p>
            </div>
            <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
              <p className="text-sm text-yellow-600">Full Capacity</p>
              <p className="text-2xl font-bold text-yellow-800">
                {capacityData.filter(c => c.status === 'Full').length}
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
              <p className="text-sm text-red-600">Overloaded</p>
              <p className="text-2xl font-bold text-red-800">
                {capacityData.filter(c => c.status === 'Overloaded').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduling Conflicts */}
      {capacityData.some(c => c.status === 'Overloaded') && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Scheduling Conflicts Detected</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {capacityData
                .filter(c => c.status === 'Overloaded')
                .map((capacity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white border border-red-200 rounded-lg">
                    <div>
                      <p className="font-medium text-red-800">{capacity.workstation}</p>
                      <p className="text-sm text-red-600">
                        Overloaded by {capacity.allocated_capacity - capacity.available_capacity} minutes
                      </p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">
                      {capacity.utilization_percentage}% utilized
                    </Badge>
                  </div>
                ))}
              
              <div className="mt-4 p-3 bg-white border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  <strong>Recommendations:</strong>
                </p>
                <ul className="text-sm text-red-600 mt-2 list-disc list-inside space-y-1">
                  <li>Reschedule to a later date when capacity is available</li>
                  <li>Split the work order into smaller batches</li>
                  <li>Use alternative workstations if available</li>
                  <li>Consider overtime or additional shifts</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operation Schedule */}
      {workOrderData.operations && workOrderData.operations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Operation Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Sequence</th>
                    <th className="text-left py-2">Operation</th>
                    <th className="text-left py-2">Workstation</th>
                    <th className="text-center py-2">Duration</th>
                    <th className="text-center py-2">Planned Start</th>
                    <th className="text-center py-2">Planned End</th>
                    <th className="text-center py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrderData.operations
                    .sort((a, b) => a.sequence_id - b.sequence_id)
                    .map((operation, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 text-center font-medium">{operation.sequence_id}</td>
                        <td className="py-3">{operation.operation}</td>
                        <td className="py-3">{operation.workstation}</td>
                        <td className="py-3 text-center">{operation.time_in_mins} mins</td>
                        <td className="py-3 text-center text-sm">
                          {operation.planned_start_time ? 
                            formatDateTime(operation.planned_start_time) : 'Not scheduled'}
                        </td>
                        <td className="py-3 text-center text-sm">
                          {operation.planned_end_time ? 
                            formatDateTime(operation.planned_end_time) : 'Not scheduled'}
                        </td>
                        <td className="py-3 text-center">
                          <Badge className={
                            operation.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            operation.status === 'Work in Progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {operation.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}