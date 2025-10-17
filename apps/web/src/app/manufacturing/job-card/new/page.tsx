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
  Pause,
  Square,
  FileText, 
  Clock,
  User,
  Settings,
  AlertCircle,
  Timer
} from 'lucide-react';
import { JobCard, JobCardTimeLog, JobCardScrapItem } from '@/types/manufacturing';
import { JobCardTimeTracker } from '@/components/modules/manufacturing/JobCardTimeTracker';
import { JobCardQualityControl } from '@/components/modules/manufacturing/JobCardQualityControl';

const jobCardSchema = {
  name: 'Job Card',
  module: 'Manufacturing',
  fields: [
    {
      fieldname: 'work_order',
      fieldtype: 'Link',
      label: 'Work Order',
      options: 'Work Order',
      reqd: true
    },
    {
      fieldname: 'production_item',
      fieldtype: 'Data',
      label: 'Production Item',
      readonly: true
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
      readonly: true
    },
    {
      fieldname: 'operation',
      fieldtype: 'Link',
      label: 'Operation',
      options: 'Operation',
      reqd: true
    },
    {
      fieldname: 'workstation',
      fieldtype: 'Link',
      label: 'Workstation',
      options: 'Workstation',
      reqd: true
    },
    {
      fieldname: 'for_quantity',
      fieldtype: 'Float',
      label: 'For Quantity',
      reqd: true
    },
    {
      fieldname: 'employee',
      fieldtype: 'Link',
      label: 'Employee',
      options: 'Employee'
    },
    {
      fieldname: 'employee_name',
      fieldtype: 'Data',
      label: 'Employee Name',
      readonly: true
    },
    {
      fieldname: 'posting_date',
      fieldtype: 'Date',
      label: 'Posting Date',
      reqd: true,
      default: new Date().toISOString().split('T')[0]
    },
    {
      fieldname: 'expected_start_date',
      fieldtype: 'Datetime',
      label: 'Expected Start Date'
    },
    {
      fieldname: 'expected_end_date',
      fieldtype: 'Datetime',
      label: 'Expected End Date'
    },
    {
      fieldname: 'wip_warehouse',
      fieldtype: 'Link',
      label: 'WIP Warehouse',
      options: 'Warehouse'
    },
    {
      fieldname: 'hour_rate',
      fieldtype: 'Currency',
      label: 'Hour Rate',
      readonly: true
    },
    {
      fieldname: 'quality_inspection_template',
      fieldtype: 'Link',
      label: 'Quality Inspection Template',
      options: 'Quality Inspection Template'
    }
  ],
  permissions: [],
  links: [],
  actions: [],
  listSettings: {
    columns: ['name', 'work_order', 'operation', 'status', 'posting_date'],
    filters: [],
    sort: []
  },
  formSettings: {
    layout: { columns: 2, sections: [] },
    sections: []
  }
};

export default function NewJobCardPage() {
  const [jobCardData, setJobCardData] = useState<Partial<JobCard>>({
    posting_date: new Date().toISOString().split('T')[0],
    status: 'Open',
    job_started: false,
    total_completed_qty: 0,
    total_time_in_mins: 0,
    process_loss_qty: 0,
    transferred_qty: 0,
    time_logs: [],
    scrap_items: [],
    quality_inspections: []
  });
  
  const [activeTab, setActiveTab] = useState('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJobRunning, setIsJobRunning] = useState(false);
  const [currentTimeLog, setCurrentTimeLog] = useState<Partial<JobCardTimeLog> | null>(null);

  const handleFormChange = (data: Partial<JobCard>) => {
    setJobCardData(prev => ({ ...prev, ...data }));
  };

  const handleTimeLogsChange = (timeLogs: JobCardTimeLog[]) => {
    const totalTime = timeLogs.reduce((sum, log) => sum + (log.time_in_mins || 0), 0);
    const totalCompleted = timeLogs.reduce((sum, log) => sum + (log.completed_qty || 0), 0);
    
    setJobCardData(prev => ({
      ...prev,
      time_logs: timeLogs,
      total_time_in_mins: totalTime,
      total_completed_qty: totalCompleted
    }));
  };

  const handleScrapItemsChange = (scrapItems: JobCardScrapItem[]) => {
    setJobCardData(prev => ({
      ...prev,
      scrap_items: scrapItems
    }));
  };

  const handleStartJob = () => {
    const now = new Date().toISOString();
    const newTimeLog: Partial<JobCardTimeLog> = {
      from_time: now,
      employee: jobCardData.employee,
      employee_name: jobCardData.employee_name
    };
    
    setCurrentTimeLog(newTimeLog);
    setIsJobRunning(true);
    setJobCardData(prev => ({
      ...prev,
      job_started: true,
      status: 'Work in Progress',
      actual_start_date: prev.actual_start_date || now
    }));
  };

  const handlePauseJob = () => {
    if (currentTimeLog) {
      const now = new Date().toISOString();
      const startTime = new Date(currentTimeLog.from_time!);
      const endTime = new Date(now);
      const timeInMins = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      
      const completedTimeLog: JobCardTimeLog = {
        ...currentTimeLog,
        to_time: now,
        time_in_mins: timeInMins,
        completed_qty: 0 // This would be entered by user
      } as JobCardTimeLog;
      
      const updatedTimeLogs = [...(jobCardData.time_logs || []), completedTimeLog];
      handleTimeLogsChange(updatedTimeLogs);
      
      setCurrentTimeLog(null);
      setIsJobRunning(false);
      setJobCardData(prev => ({ ...prev, status: 'On Hold' }));
    }
  };

  const handleCompleteJob = () => {
    if (isJobRunning) {
      handlePauseJob();
    }
    
    const now = new Date().toISOString();
    setJobCardData(prev => ({
      ...prev,
      status: 'Completed',
      actual_end_date: now
    }));
  };

  const handleSave = async (submit = false) => {
    setIsSubmitting(true);
    try {
      // API call to save Job Card
      console.log('Saving Job Card:', { ...jobCardData, docstatus: submit ? 1 : 0 });
      // Redirect to Job Card list or show success message
    } catch (error) {
      console.error('Error saving Job Card:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = jobCardData.work_order && 
                   jobCardData.operation && 
                   jobCardData.workstation && 
                   jobCardData.for_quantity &&
                   jobCardData.posting_date;

  const canStartJob = jobCardData.status === 'Open' && canSubmit && !isJobRunning;
  const canPauseJob = isJobRunning;
  const canCompleteJob = jobCardData.status !== 'Completed';

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Job Card</h1>
            <p className="text-gray-600 mt-1">
              Create a new job card for shop floor operations
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
          </div>
        </div>

        {/* Job Control Panel */}
        {jobCardData.work_order && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Badge 
                    className={
                      jobCardData.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                      jobCardData.status === 'Work in Progress' ? 'bg-yellow-100 text-yellow-800' :
                      jobCardData.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }
                  >
                    {jobCardData.status}
                  </Badge>
                  {isJobRunning && (
                    <div className="flex items-center space-x-2 text-yellow-600">
                      <Timer className="h-4 w-4 animate-pulse" />
                      <span className="text-sm font-medium">Job Running</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartJob}
                    disabled={!canStartJob}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Job
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePauseJob}
                    disabled={!canPauseJob}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Job
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCompleteJob}
                    disabled={!canCompleteJob}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Complete Job
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Validation Messages */}
        {!canSubmit && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-orange-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Validation Required</span>
              </div>
              <ul className="mt-2 text-sm text-orange-700 list-disc list-inside">
                {!jobCardData.work_order && <li>Work Order is required</li>}
                {!jobCardData.operation && <li>Operation is required</li>}
                {!jobCardData.workstation && <li>Workstation is required</li>}
                {!jobCardData.for_quantity && <li>For Quantity is required</li>}
                {!jobCardData.posting_date && <li>Posting Date is required</li>}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Progress Summary */}
        {jobCardData.work_order && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">For Quantity</p>
                    <p className="text-2xl font-bold text-blue-600">{jobCardData.for_quantity || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Square className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{jobCardData.total_completed_qty || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Time (mins)</p>
                    <p className="text-2xl font-bold text-orange-600">{jobCardData.total_time_in_mins || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Efficiency</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {jobCardData.for_quantity && jobCardData.total_completed_qty ? 
                        ((jobCardData.total_completed_qty / jobCardData.for_quantity) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Form Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Details</span>
            </TabsTrigger>
            <TabsTrigger value="time-tracking" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Time Tracking ({jobCardData.time_logs?.length || 0})</span>
            </TabsTrigger>
            <TabsTrigger value="quality" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Quality Control</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Summary</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Job Card Details</CardTitle>
              </CardHeader>
              <CardContent>
                <DynamicForm
                  doctype="Job Card"
                  meta={jobCardSchema}
                  document={{ doctype: 'Job Card', name: '', data: jobCardData } as any}
                  onSubmit={handleFormChange}
                  onChange={handleFormChange}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="time-tracking">
            <JobCardTimeTracker
              timeLogs={jobCardData.time_logs || []}
              currentTimeLog={currentTimeLog}
              isJobRunning={isJobRunning}
              onTimeLogsChange={handleTimeLogsChange}
              onScrapItemsChange={handleScrapItemsChange}
              scrapItems={jobCardData.scrap_items || []}
            />
          </TabsContent>

          <TabsContent value="quality">
            <JobCardQualityControl
              jobCardData={jobCardData}
              onChange={handleFormChange}
            />
          </TabsContent>

          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Job Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Job Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Job Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Work Order:</span>
                          <span className="font-medium">{jobCardData.work_order || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Operation:</span>
                          <span className="font-medium">{jobCardData.operation || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Workstation:</span>
                          <span className="font-medium">{jobCardData.workstation || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Employee:</span>
                          <span className="font-medium">{jobCardData.employee_name || '-'}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Progress</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">For Quantity:</span>
                          <span className="font-medium">{jobCardData.for_quantity || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Completed:</span>
                          <span className="font-medium">{jobCardData.total_completed_qty || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Time:</span>
                          <span className="font-medium">{jobCardData.total_time_in_mins || 0} mins</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <Badge className="ml-2">
                            {jobCardData.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Time Logs Summary */}
                  {jobCardData.time_logs && jobCardData.time_logs.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Time Logs</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600">
                          Total Sessions: {jobCardData.time_logs.length} | 
                          Total Time: {jobCardData.total_time_in_mins || 0} mins ({((jobCardData.total_time_in_mins || 0) / 60).toFixed(1)} hrs)
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}