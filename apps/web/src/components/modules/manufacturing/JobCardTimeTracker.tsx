'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Play, 
  Pause, 
  Plus,
  Trash2,
  User,
  Timer,
  AlertCircle
} from 'lucide-react';
import { JobCardTimeLog, JobCardScrapItem } from '@/types/manufacturing';

interface JobCardTimeTrackerProps {
  timeLogs: JobCardTimeLog[];
  currentTimeLog: Partial<JobCardTimeLog> | null;
  isJobRunning: boolean;
  onTimeLogsChange: (timeLogs: JobCardTimeLog[]) => void;
  onScrapItemsChange: (scrapItems: JobCardScrapItem[]) => void;
  scrapItems: JobCardScrapItem[];
}

export function JobCardTimeTracker({
  timeLogs,
  currentTimeLog,
  isJobRunning,
  onTimeLogsChange,
  onScrapItemsChange,
  scrapItems
}: JobCardTimeTrackerProps) {
  const [newTimeLog, setNewTimeLog] = useState<Partial<JobCardTimeLog>>({
    completed_qty: 0
  });
  const [newScrapItem, setNewScrapItem] = useState<Partial<JobCardScrapItem>>({
    stock_qty: 0
  });
  const [showAddTimeLog, setShowAddTimeLog] = useState(false);
  const [showAddScrapItem, setShowAddScrapItem] = useState(false);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleAddTimeLog = () => {
    if (newTimeLog.from_time && newTimeLog.to_time && newTimeLog.completed_qty !== undefined) {
      const fromTime = new Date(newTimeLog.from_time);
      const toTime = new Date(newTimeLog.to_time);
      const timeInMins = Math.round((toTime.getTime() - fromTime.getTime()) / (1000 * 60));
      
      const timeLog: JobCardTimeLog = {
        from_time: newTimeLog.from_time,
        to_time: newTimeLog.to_time,
        time_in_mins: timeInMins,
        completed_qty: newTimeLog.completed_qty,
        employee: newTimeLog.employee,
        employee_name: newTimeLog.employee_name
      };
      
      onTimeLogsChange([...timeLogs, timeLog]);
      setNewTimeLog({ completed_qty: 0 });
      setShowAddTimeLog(false);
    }
  };

  const handleRemoveTimeLog = (index: number) => {
    const updatedTimeLogs = timeLogs.filter((_, i) => i !== index);
    onTimeLogsChange(updatedTimeLogs);
  };

  const handleAddScrapItem = () => {
    if (newScrapItem.item_code && newScrapItem.stock_qty) {
      const scrapItem: JobCardScrapItem = {
        item_code: newScrapItem.item_code,
        item_name: newScrapItem.item_name || newScrapItem.item_code,
        stock_qty: newScrapItem.stock_qty,
        stock_uom: newScrapItem.stock_uom || 'Nos'
      };
      
      onScrapItemsChange([...scrapItems, scrapItem]);
      setNewScrapItem({ stock_qty: 0 });
      setShowAddScrapItem(false);
    }
  };

  const handleRemoveScrapItem = (index: number) => {
    const updatedScrapItems = scrapItems.filter((_, i) => i !== index);
    onScrapItemsChange(updatedScrapItems);
  };

  const totalTime = timeLogs.reduce((sum, log) => sum + (log.time_in_mins || 0), 0);
  const totalCompleted = timeLogs.reduce((sum, log) => sum + (log.completed_qty || 0), 0);

  return (
    <div className="space-y-6">
      {/* Current Job Status */}
      {isJobRunning && currentTimeLog && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Timer className="h-5 w-5 text-yellow-600 animate-pulse" />
                <div>
                  <p className="font-medium text-yellow-800">Job Currently Running</p>
                  <p className="text-sm text-yellow-700">
                    Started at: {formatTime(currentTimeLog.from_time!)}
                  </p>
                </div>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">
                In Progress
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Time Logs</span>
            </CardTitle>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Total: {formatDuration(totalTime)} | Completed: {totalCompleted}
              </div>
              <Button
                size="sm"
                onClick={() => setShowAddTimeLog(true)}
                disabled={isJobRunning}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Time Log
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Time Log Form */}
          {showAddTimeLog && (
            <Card className="mb-4 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Time
                    </label>
                    <Input
                      type="datetime-local"
                      value={newTimeLog.from_time || ''}
                      onChange={(e) => setNewTimeLog(prev => ({ ...prev, from_time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To Time
                    </label>
                    <Input
                      type="datetime-local"
                      value={newTimeLog.to_time || ''}
                      onChange={(e) => setNewTimeLog(prev => ({ ...prev, to_time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Completed Qty
                    </label>
                    <Input
                      type="number"
                      value={newTimeLog.completed_qty || ''}
                      onChange={(e) => setNewTimeLog(prev => ({ ...prev, completed_qty: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee
                    </label>
                    <Input
                      type="text"
                      placeholder="Employee ID"
                      value={newTimeLog.employee || ''}
                      onChange={(e) => setNewTimeLog(prev => ({ ...prev, employee: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddTimeLog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddTimeLog}
                  >
                    Add Time Log
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Time Logs Table */}
          {timeLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No time logs recorded</p>
              <p className="text-sm">Start the job or add manual time logs</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">From Time</th>
                    <th className="text-left py-2">To Time</th>
                    <th className="text-right py-2">Duration</th>
                    <th className="text-right py-2">Completed Qty</th>
                    <th className="text-left py-2">Employee</th>
                    <th className="text-center py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timeLogs.map((log, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2">{formatTime(log.from_time)}</td>
                      <td className="py-2">{formatTime(log.to_time)}</td>
                      <td className="py-2 text-right font-medium">
                        {formatDuration(log.time_in_mins)}
                      </td>
                      <td className="py-2 text-right">{log.completed_qty}</td>
                      <td className="py-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{log.employee_name || log.employee || '-'}</span>
                        </div>
                      </td>
                      <td className="py-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTimeLog(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scrap Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Scrap Items</span>
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddScrapItem(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Scrap Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Scrap Item Form */}
          {showAddScrapItem && (
            <Card className="mb-4 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Code
                    </label>
                    <Input
                      type="text"
                      placeholder="Item Code"
                      value={newScrapItem.item_code || ''}
                      onChange={(e) => setNewScrapItem(prev => ({ ...prev, item_code: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <Input
                      type="number"
                      value={newScrapItem.stock_qty || ''}
                      onChange={(e) => setNewScrapItem(prev => ({ ...prev, stock_qty: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      UOM
                    </label>
                    <Input
                      type="text"
                      placeholder="UOM"
                      value={newScrapItem.stock_uom || 'Nos'}
                      onChange={(e) => setNewScrapItem(prev => ({ ...prev, stock_uom: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddScrapItem(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddScrapItem}
                  >
                    Add Scrap Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scrap Items Table */}
          {scrapItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No scrap items recorded</p>
              <p className="text-sm">Add items that were scrapped during production</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Item Code</th>
                    <th className="text-left py-2">Item Name</th>
                    <th className="text-right py-2">Quantity</th>
                    <th className="text-left py-2">UOM</th>
                    <th className="text-center py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scrapItems.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2 font-medium">{item.item_code}</td>
                      <td className="py-2">{item.item_name}</td>
                      <td className="py-2 text-right">{item.stock_qty}</td>
                      <td className="py-2">{item.stock_uom}</td>
                      <td className="py-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveScrapItem(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Time Tracking Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{timeLogs.length}</p>
              <p className="text-sm text-gray-600">Total Sessions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatDuration(totalTime)}</p>
              <p className="text-sm text-gray-600">Total Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{totalCompleted}</p>
              <p className="text-sm text-gray-600">Total Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{scrapItems.length}</p>
              <p className="text-sm text-gray-600">Scrap Items</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}