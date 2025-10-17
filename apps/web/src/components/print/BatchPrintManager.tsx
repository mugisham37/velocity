'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Printer, 
  Download, 
  Mail, 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  Square,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Settings,
  FileText,
  Users
} from 'lucide-react';
import { PrintFormat } from './PrintFormatDesigner';
import { PDFGenerator } from '@/lib/pdf';

export interface BatchPrintJob {
  id: string;
  doctype: string;
  documentName: string;
  documentData: Record<string, any>;
  printFormat: PrintFormat;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface BatchPrintQueue {
  id: string;
  name: string;
  description?: string;
  jobs: BatchPrintJob[];
  status: 'idle' | 'running' | 'paused' | 'completed';
  createdAt: Date;
  settings: {
    outputFormat: 'PDF' | 'HTML';
    emailAfterCompletion: boolean;
    emailRecipients: string[];
    printerName?: string;
    copies: number;
    collate: boolean;
  };
}

interface BatchPrintManagerProps {
  onClose: () => void;
}

export const BatchPrintManager: React.FC<BatchPrintManagerProps> = ({ onClose }) => {
  const [queues, setQueues] = useState<BatchPrintQueue[]>([]);
  const [activeQueueId, setActiveQueueId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNewQueueDialog, setShowNewQueueDialog] = useState(false);

  const activeQueue = queues.find(q => q.id === activeQueueId);

  // Create new print queue
  const createQueue = useCallback((name: string, description?: string) => {
    const newQueue: BatchPrintQueue = {
      id: `queue_${Date.now()}`,
      name,
      description,
      jobs: [],
      status: 'idle',
      createdAt: new Date(),
      settings: {
        outputFormat: 'PDF',
        emailAfterCompletion: false,
        emailRecipients: [],
        copies: 1,
        collate: true,
      },
    };

    setQueues(prev => [...prev, newQueue]);
    setActiveQueueId(newQueue.id);
    setShowNewQueueDialog(false);
  }, []);

  // Add job to queue
  const addJobToQueue = useCallback((
    queueId: string,
    doctype: string,
    documentName: string,
    documentData: Record<string, any>,
    printFormat: PrintFormat
  ) => {
    const newJob: BatchPrintJob = {
      id: `job_${Date.now()}`,
      doctype,
      documentName,
      documentData,
      printFormat,
      status: 'pending',
      createdAt: new Date(),
    };

    setQueues(prev => prev.map(queue => 
      queue.id === queueId 
        ? { ...queue, jobs: [...queue.jobs, newJob] }
        : queue
    ));
  }, []);

  // Remove job from queue
  const removeJob = useCallback((queueId: string, jobId: string) => {
    setQueues(prev => prev.map(queue => 
      queue.id === queueId 
        ? { ...queue, jobs: queue.jobs.filter(job => job.id !== jobId) }
        : queue
    ));
  }, []);

  // Process queue
  const processQueue = useCallback(async (queueId: string) => {
    const queue = queues.find(q => q.id === queueId);
    if (!queue || queue.status === 'running') return;

    setIsProcessing(true);
    
    // Update queue status
    setQueues(prev => prev.map(q => 
      q.id === queueId ? { ...q, status: 'running' } : q
    ));

    try {
      for (const job of queue.jobs) {
        if (job.status !== 'pending') continue;

        // Update job status to processing
        setQueues(prev => prev.map(q => 
          q.id === queueId 
            ? {
                ...q,
                jobs: q.jobs.map(j => 
                  j.id === job.id ? { ...j, status: 'processing' } : j
                )
              }
            : q
        ));

        try {
          // Generate document
          await processJob(job, queue.settings);

          // Update job status to completed
          setQueues(prev => prev.map(q => 
            q.id === queueId 
              ? {
                  ...q,
                  jobs: q.jobs.map(j => 
                    j.id === job.id 
                      ? { ...j, status: 'completed', completedAt: new Date() }
                      : j
                  )
                }
              : q
          ));
        } catch (error) {
          // Update job status to failed
          setQueues(prev => prev.map(q => 
            q.id === queueId 
              ? {
                  ...q,
                  jobs: q.jobs.map(j => 
                    j.id === job.id 
                      ? { 
                          ...j, 
                          status: 'failed', 
                          error: error instanceof Error ? error.message : 'Unknown error',
                          completedAt: new Date()
                        }
                      : j
                  )
                }
              : q
          ));
        }

        // Small delay between jobs
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Update queue status to completed
      setQueues(prev => prev.map(q => 
        q.id === queueId ? { ...q, status: 'completed' } : q
      ));

      // Send email if configured
      if (queue.settings.emailAfterCompletion && queue.settings.emailRecipients.length > 0) {
        await sendCompletionEmail(queue);
      }

    } catch (error) {
      console.error('Queue processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [queues]);

  // Process individual job
  const processJob = async (job: BatchPrintJob, settings: BatchPrintQueue['settings']) => {
    const pdfGenerator = new PDFGenerator({
      format: job.printFormat,
      documentData: job.documentData,
      filename: `${job.documentName}.${settings.outputFormat.toLowerCase()}`,
      quality: 2,
    });

    if (settings.outputFormat === 'PDF') {
      // Generate PDF
      for (let copy = 0; copy < settings.copies; copy++) {
        await pdfGenerator.generatePDF({ 
          download: true,
          filename: `${job.documentName}${settings.copies > 1 ? `_copy_${copy + 1}` : ''}.pdf`
        });
      }
    } else {
      // Generate HTML (implementation would be similar to PDF)
      // For now, just simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // If printer is configured, send to printer
    if (settings.printerName) {
      await sendToPrinter(job, settings);
    }
  };

  // Send to printer (mock implementation)
  const sendToPrinter = async (job: BatchPrintJob, settings: BatchPrintQueue['settings']) => {
    // TODO: Implement actual printer integration
    console.log(`Sending ${job.documentName} to printer ${settings.printerName}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  // Send completion email (mock implementation)
  const sendCompletionEmail = async (queue: BatchPrintQueue) => {
    // TODO: Implement actual email sending
    console.log(`Sending completion email for queue ${queue.name} to:`, queue.settings.emailRecipients);
  };

  // Pause queue
  const pauseQueue = useCallback((queueId: string) => {
    setQueues(prev => prev.map(q => 
      q.id === queueId ? { ...q, status: 'paused' } : q
    ));
  }, []);

  // Stop queue
  const stopQueue = useCallback((queueId: string) => {
    setQueues(prev => prev.map(q => 
      q.id === queueId ? { ...q, status: 'idle' } : q
    ));
  }, []);

  // Delete queue
  const deleteQueue = useCallback((queueId: string) => {
    setQueues(prev => prev.filter(q => q.id !== queueId));
    if (activeQueueId === queueId) {
      setActiveQueueId(null);
    }
  }, [activeQueueId]);

  // Get status icon
  const getStatusIcon = (status: BatchPrintJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Batch Print Manager</h1>
          <p className="text-sm text-gray-600">Manage and process multiple print jobs</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowNewQueueDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Queue
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar - Queue List */}
        <div className="w-80 bg-white border-r border-gray-200 p-4">
          <h3 className="text-sm font-medium mb-3">Print Queues</h3>
          
          <div className="space-y-2">
            {queues.map(queue => (
              <Card 
                key={queue.id}
                className={`p-3 cursor-pointer transition-colors ${
                  activeQueueId === queue.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
                onClick={() => setActiveQueueId(queue.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{queue.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    queue.status === 'running' ? 'bg-blue-100 text-blue-800' :
                    queue.status === 'completed' ? 'bg-green-100 text-green-800' :
                    queue.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {queue.status}
                  </span>
                </div>
                
                <div className="text-xs text-gray-600">
                  {queue.jobs.length} jobs • Created {queue.createdAt.toLocaleDateString()}
                </div>
                
                {queue.description && (
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    {queue.description}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {queues.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <Printer className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No print queues yet</p>
              <p className="text-xs">Create a queue to get started</p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {activeQueue ? (
            <div>
              {/* Queue Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">{activeQueue.name}</h2>
                  {activeQueue.description && (
                    <p className="text-sm text-gray-600">{activeQueue.description}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {activeQueue.status === 'idle' && (
                    <Button 
                      onClick={() => processQueue(activeQueue.id)}
                      disabled={activeQueue.jobs.length === 0 || isProcessing}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Queue
                    </Button>
                  )}
                  
                  {activeQueue.status === 'running' && (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => pauseQueue(activeQueue.id)}
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => stopQueue(activeQueue.id)}
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                    </>
                  )}
                  
                  <Button variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => deleteQueue(activeQueue.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Queue Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <Card className="p-4">
                  <div className="text-2xl font-bold">{activeQueue.jobs.length}</div>
                  <div className="text-sm text-gray-600">Total Jobs</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {activeQueue.jobs.filter(j => j.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {activeQueue.jobs.filter(j => j.status === 'processing').length}
                  </div>
                  <div className="text-sm text-gray-600">Processing</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {activeQueue.jobs.filter(j => j.status === 'failed').length}
                  </div>
                  <div className="text-sm text-gray-600">Failed</div>
                </Card>
              </div>

              {/* Jobs List */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Print Jobs</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // TODO: Open dialog to add jobs
                      console.log('Add jobs dialog');
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Jobs
                  </Button>
                </div>

                <div className="space-y-2">
                  {activeQueue.jobs.map(job => (
                    <div 
                      key={job.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <div className="font-medium text-sm">{job.documentName}</div>
                          <div className="text-xs text-gray-600">
                            {job.doctype} • {job.printFormat.name}
                          </div>
                          {job.error && (
                            <div className="text-xs text-red-600 mt-1">{job.error}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {job.createdAt.toLocaleTimeString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeJob(activeQueue.id, job.id)}
                          disabled={job.status === 'processing'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {activeQueue.jobs.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No jobs in this queue</p>
                    <p className="text-xs">Add documents to start printing</p>
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-16">
              <Printer className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Select a Print Queue</h3>
              <p>Choose a queue from the sidebar to view and manage print jobs</p>
            </div>
          )}
        </div>
      </div>

      {/* New Queue Dialog */}
      {showNewQueueDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Create New Print Queue</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              const description = formData.get('description') as string;
              createQueue(name, description);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Queue Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter queue name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-20 resize-none"
                    placeholder="Enter queue description"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowNewQueueDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create Queue
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BatchPrintManager;