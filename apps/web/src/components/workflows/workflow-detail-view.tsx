'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GET_WORKFLOW } from '@/graphql/workflows';
import { useQuery } from '@apollo/client';
import { ArrowLeft, Edit, Play } from 'lucide-react';
import Link from 'next/link';
import { WorkflowExecutionDashboard } from './workflow-execution-dashboard';

interface WorkflowDetailViewProps {
  workflowId: string;
}

export function WorkflowDetailView({ workflowId }: WorkflowDetailViewProps) {
  const { data, loading, error } = useQuery(GET_WORKFLOW, {
    variables: { id: workflowId },
  });

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error || !data?.workflow) {
    return (
      <div className='text-center py-8'>
        <p className='text-red-600'>
          Error loading workflow: {error?.message || 'Workflow not found'}
        </p>
      </div>
    );
  }

  const workflow = data.workflow;

  return (
    <div>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-4'>
          <Link href='/workflows'>
            <Button variant='ghost' size='sm'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back to Workflows
            </Button>
          </Link>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>
              {workflow.name}
            </h1>
            <p className='text-gray-600'>{workflow.description}</p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Link href={`/workflows/designer?id=${workflow.id}`}>
            <Button variant='outline'>
              <Edit className='h-4 w-4 mr-2' />
              Edit
            </Button>
          </Link>
          <Button>
            <Play className='h-4 w-4 mr-2' />
            Run Workflow
          </Button>
        </div>
      </div>

      {/* Workflow Info */}
      <Card className='mb-6'>
        <CardHeader>
          <CardTitle>Workflow Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div>
              <h4 className='font-medium mb-2'>Status</h4>
              <Badge
                className={
                  workflow.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }
              >
                {workflow.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <h4 className='font-medium mb-2'>Category</h4>
              <Badge variant='outline'>{workflow.category}</Badge>
            </div>
            <div>
              <h4 className='font-medium mb-2'>Version</h4>
              <span className='text-sm'>{workflow.version}</span>
            </div>
          </div>

          {workflow.tags && workflow.tags.length > 0 && (
            <div className='mt-4'>
              <h4 className='font-medium mb-2'>Tags</h4>
              <div className='flex flex-wrap gap-1'>
                {workflow.tags.map((tag: string) => (
                  <Badge key={tag} variant='outline' className='text-xs'>
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600'>
            <div>
              <strong>Created:</strong>{' '}
              {new Date(workflow.createdAt).toLocaleDateString()}
            </div>
            <div>
              <strong>Last Updated:</strong>{' '}
              {new Date(workflow.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue='execution'>
        <TabsList>
          <TabsTrigger value='execution'>Execution</TabsTrigger>
          <TabsTrigger value='definition'>Definition</TabsTrigger>
          <TabsTrigger value='settings'>Settings</TabsTrigger>
        </TabsList>

        <TabsContent value='execution'>
          <WorkflowExecutionDashboard workflowId={workflowId} />
        </TabsContent>

        <TabsContent value='definition'>
          <Card>
            <CardHeader>
              <CardTitle>Workflow Definition</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div>
                  <h4 className='font-medium mb-2'>
                    Nodes ({workflow.definition?.nodes?.length || 0})
                  </h4>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
                    {workflow.definition?.nodes?.map((node: any) => (
                      <div key={node.id} className='border rounded p-2 text-sm'>
                        <div className='font-medium'>{node.label}</div>
                        <div className='text-gray-500'>{node.type}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className='font-medium mb-2'>
                    Connections ({workflow.definition?.edges?.length || 0})
                  </h4>
                  <div className='space-y-1'>
                    {workflow.definition?.edges?.map((edge: any) => (
                      <div key={edge.id} className='text-sm text-gray-600'>
                        {edge.source} → {edge.target}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='settings'>
          <Card>
            <CardHeader>
              <CardTitle>Workflow Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h4 className='font-medium'>Active Status</h4>
                    <p className='text-sm text-gray-600'>
                      Enable or disable this workflow
                    </p>
                  </div>
                  <Badge
                    className={
                      workflow.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {workflow.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <h4 className='font-medium'>Template Status</h4>
                    <p className='text-sm text-gray-600'>
                      Whether this workflow can be used as a template
                    </p>
                  </div>
                  <Badge variant={workflow.isTemplate ? 'default' : 'outline'}>
                    {workflow.isTemplate ? 'Template' : 'Regular Workflow'}
                  </Badge>
                </div>

                <div>
                  <h4 className='font-medium mb-2'>Permissions</h4>
                  <div className='bg-gray-50 rounded p-3 text-sm'>
                    {workflow.permissions ? (
                      <pre>{JSON.stringify(workflow.permissions, null, 2)}</pre>
                    ) : (
                      <span className='text-gray-500'>
                        No specific permissions set
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
