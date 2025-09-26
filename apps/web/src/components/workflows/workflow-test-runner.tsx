'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CREATE_WORKFLOW_INSTANCE } from '@/graphql/workflows';
import { useMutation } from '@apollo/client';
import { AlertCircle, CheckCircle, Clock, Play, Square } from 'lucide-react';
import { useState } from 'react';

interface WorkflowTestRunnerProps {
  open: boolean;
  onClose: () => void;
  workflow: {
    id?: string;
    name: string;
    definition: any;
  };
}

export function WorkflowTestRunner({
  open,
  onClose,
  workflow,
}: WorkflowTestRunnerProps) {
  const [testData, setTestData] = useState('{}');
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const [createInstance] = useMutation(CREATE_WORKFLOW_INSTANCE);

  const runTest = async () => {
    if (!workflow.id) {
      alert('Please save the workflow before testing');
      return;
    }

    setIsRunning(true);
    setTestResults(null);

    try {
      const contextData = JSON.parse(testData);

      const result = await createInstance({
        es: {
          input: {
            workflowId: workflow.id,
            name: `Test Run - ${workflow.name}`,
            priority: 'NORMAL',
            contextData,
          },
        },
      });

      // Simulate test execution results
      const mockResults = {
        instanceId: result.data?.createWorkflowInstance?.id,
        status: 'completed',
        steps: workflow.definition.nodes.map((node: any, index: number) => ({
          id: node.id,
          name: node.label,
          type: node.type,
          status:
            index === 0 ? 'completed' : index === 1 ? 'running' : 'pending',
          duration: index === 0 ? 1.2 : null,
          output: index === 0 ? { result: 'success' } : null,
        })),
        totalDuration: 1.2,
        errors: [],
        warnings:
          node.type === 'condition' ? ['Condition evaluation may be slow'] : [],
      };

      setTestResults(mockResults);
    } catch (error) {
      setTestResults({
        status: 'failed',
        error: error.message,
        steps: [],
        totalDuration: 0,
        errors: [error.message],
        warnings: [],
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className='h-4 w-4 text-green-600' />;
      case 'running':
        return <Play className='h-4 w-4 text-blue-600' />;
      case 'failed':
        return <AlertCircle className='h-4 w-4 text-red-600' />;
      case 'pending':
        return <Clock className='h-4 w-4 text-gray-400' />;
      default:
        return <Square className='h-4 w-4 text-gray-400' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[80vh] overflow-hidden'>
        <DialogHeader>
          <DialogTitle>Test Workflow</DialogTitle>
          <DialogDescription>
            Run a test execution of your workflow with sample data
          </DialogDescription>
        </DialogHeader>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 h-[60vh]'>
          {/* Test Configuration */}
          <div className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='text-sm'>Test Configuration</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Label htmlFor='workflow-name'>Workflow</Label>
                  <Input
                    id='workflow-name'
                    value={workflow.name}
                    disabled
                    className='bg-gray-50'
                  />
                </div>

                <div>
                  <Label htmlFor='test-data'>Test Data (JSON)</Label>
                  <Textarea
                    id='test-data'
                    value={testData}
                    onChange={e => setTestData(e.target.value)}
                    placeholder='{"amount": 1000, "department": "finance"}'
                    rows={8}
                    className='font-mono text-sm'
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Provide JSON data that will be available to workflow steps
                  </p>
                </div>

                <Button
                  onClick={runTest}
                  disabled={isRunning || !workflow.id}
                  className='w-full'
                >
                  {isRunning ? (
                    <>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                      Running Test...
                    </>
                  ) : (
                    <>
                      <Play className='h-4 w-4 mr-2' />
                      Run Test
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Test Results */}
          <div className='space-y-4 overflow-y-auto'>
            {testResults ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-sm flex items-center gap-2'>
                      Test Results
                      <Badge className={getStatusColor(testResults.status)}>
                        {testResults.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {testResults.error ? (
                      <div className='text-red-600 text-sm'>
                        <p className='font-medium'>Error:</p>
                        <p>{testResults.error}</p>
                      </div>
                    ) : (
                      <div className='space-y-2 text-sm'>
                        <div className='flex justify-between'>
                          <span>Instance ID:</span>
                          <span className='font-mono'>
                            {testResults.instanceId}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span>Total Duration:</span>
                          <span>{testResults.totalDuration}s</span>
                        </div>
                        <div className='flex justify-between'>
                          <span>Steps Completed:</span>
                          <span>
                            {
                              testResults.steps.filter(
                                (s: any) => s.status === 'completed'
                              ).length
                            }{' '}
                            / {testResults.steps.length}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Step Results */}
                <Card>
                  <CardHeader>
                    <CardTitle className='text-sm'>Step Execution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      {testResults.steps.map((step: any, index: number) => (
                        <div
                          key={step.id}
                          className='flex items-center gap-3 p-2 border rounded'
                        >
                          {getStatusIcon(step.status)}
                          <div className='flex-1'>
                            <div className='flex items-center justify-between'>
                              <span className='font-medium text-sm'>
                                {step.name}
                              </span>
                              <Badge variant='outline' className='text-xs'>
                                {step.type}
                              </Badge>
                            </div>
                            {step.duration && (
                              <p className='text-xs text-gray-500'>
                                Completed in {step.duration}s
                              </p>
                            )}
                            {step.output && (
                              <pre className='text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto'>
                                {JSON.stringify(step.output, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Errors and Warnings */}
                {(testResults.errors.length > 0 ||
                  testResults.warnings.length > 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className='text-sm'>Issues</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-2'>
                        {testResults.errors.map(
                          (error: string, index: number) => (
                            <div
                              key={index}
                              className='flex items-start gap-2 text-red-600'
                            >
                              <AlertCircle className='h-4 w-4 mt-0.5' />
                              <span className='text-sm'>{error}</span>
                            </div>
                          )
                        )}
                        {testResults.warnings.map(
                          (warning: string, index: number) => (
                            <div
                              key={index}
                              className='flex items-start gap-2 text-orange-600'
                            >
                              <AlertCircle className='h-4 w-4 mt-0.5' />
                              <span className='text-sm'>{warning}</span>
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className='text-center py-8'>
                  <Play className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                  <p className='text-gray-600'>
                    Click "Run Test" to execute your workflow with the provided
                    test data
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className='flex justify-end gap-2 pt-4 border-t'>
          <Button variant='outline' onClick={onClose}>
            Close
          </Button>
          {testResults && <Button variant='outline'>View Full Instance</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
