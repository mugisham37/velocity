'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { Edge, Node } from 'reactflow';

interface WorkflowNodePropertiesProps {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  onUpdateNode: (nodeId: string, data: any) => void;
  workflowName: string;
  workflowDescription: string;
  workflowCategory: string;
  workflowTags: string[];
  onUpdateWorkflow: (updates: {
    name?: string;
    description?: string;
    category?: string;
    tags?: string[];
  }) => void;
}

export function WorkflowNodeProperties({
  selectedNode,
  selectedEdge,
  onUpdateNode,
  workflowName,
  workflowDescription,
  workflowCategory,
  workflowTags,
  onUpdateWorkflow,
}: WorkflowNodePropertiesProps) {
  const [newTag, setNewTag] = useState('');

  const handleNodeUpdate = (field: string, value: any) => {
    if (selectedNode) {
      onUpdateNode(selectedNode.id, { [field]: value });
    }
  };

  const addTag = () => {
    if (newTag.trim() && !workflowTags.includes(newTag.trim())) {
      onUpdateWorkflow({ tags: [...workflowTags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onUpdateWorkflow({ tags: workflowTags.filter(tag => tag !== tagToRemove) });
  };

  const renderNodeProperties = () => {
    if (!selectedNode) return null;

    const nodeType = selectedNode.data.nodeType || selectedNode.type;
    const nodeData = selectedNode.data || {};

    return (
      <div className='space-y-4'>
        {/* Basic Properties */}
        <div className='space-y-3'>
          <div>
            <Label htmlFor='node-label'>Label</Label>
            <Input
              id='node-label'
              value={nodeData.label || ''}
              onChange={e => handleNodeUpdate('label', e.target.value)}
              placeholder='Enter node label'
            />
          </div>

          <div>
            <Label htmlFor='node-description'>Description</Label>
            <Textarea
              id='node-description'
              value={nodeData.description || ''}
              onChange={e => handleNodeUpdate('description', e.target.value)}
              placeholder='Enter node description'
              rows={2}
            />
          </div>
        </div>

        {/* Type-specific Properties */}
        {nodeType === 'approval' && (
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Approval Settings</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div>
                <Label htmlFor='approver'>Approver</Label>
                <Select
                  value={nodeData.approverId || ''}
                  onValueChange={value => handleNodeUpdate('approverId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select approver' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='manager'>Manager</SelectItem>
                    <SelectItem value='admin'>Administrator</SelectItem>
                    <SelectItem value='specific'>Specific User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='approval-type'>Approval Type</Label>
                <Select
                  value={nodeData.approvalType || 'single'}
                  onValueChange={value =>
                    handleNodeUpdate('approvalType', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='single'>Single Approval</SelectItem>
                    <SelectItem value='multiple'>Multiple Approvals</SelectItem>
                    <SelectItem value='unanimous'>Unanimous</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='flex items-center space-x-2'>
                <Switch
                  id='allow-delegation'
                  checked={nodeData.allowDelegation || false}
                  onCheckedChange={checked =>
                    handleNodeUpdate('allowDelegation', checked)
                  }
                />
                <Label htmlFor='allow-delegation'>Allow Delegation</Label>
              </div>

              <div>
                <Label htmlFor='due-days'>Due in (days)</Label>
                <Input
                  id='due-days'
                  type='number'
                  value={nodeData.dueDays || ''}
                  onChange={e =>
                    handleNodeUpdate('dueDays', parseInt(e.target.value) || 0)
                  }
                  placeholder='0'
                />
              </div>
            </CardContent>
          </Card>
        )}

        {nodeType === 'condition' && (
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Condition Settings</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div>
                <Label htmlFor='condition-field'>Field</Label>
                <Input
                  id='condition-field'
                  value={nodeData.conditionField || ''}
                  onChange={e =>
                    handleNodeUpdate('conditionField', e.target.value)
                  }
                  placeholder='e.g., amount, status'
                />
              </div>

              <div>
                <Label htmlFor='condition-operator'>Operator</Label>
                <Select
                  value={nodeData.conditionOperator || 'equals'}
                  onValueChange={value =>
                    handleNodeUpdate('conditionOperator', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='equals'>Equals</SelectItem>
                    <SelectItem value='not_equals'>Not Equals</SelectItem>
                    <SelectItem value='greater_than'>Greater Than</SelectItem>
                    <SelectItem value='less_than'>Less Than</SelectItem>
                    <SelectItem value='contains'>Contains</SelectItem>
                    <SelectItem value='starts_with'>Starts With</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='condition-value'>Value</Label>
                <Input
                  id='condition-value'
                  value={nodeData.conditionValue || ''}
                  onChange={e =>
                    handleNodeUpdate('conditionValue', e.target.value)
                  }
                  placeholder='Enter comparison value'
                />
              </div>
            </CardContent>
          </Card>
        )}

        {nodeType === 'notification' && (
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div>
                <Label htmlFor='notification-type'>Type</Label>
                <Select
                  value={nodeData.notificationType || 'email'}
                  onValueChange={value =>
                    handleNodeUpdate('notificationType', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='email'>Email</SelectItem>
                    <SelectItem value='sms'>SMS</SelectItem>
                    <SelectItem value='push'>Push Notification</SelectItem>
                    <SelectItem value='slack'>Slack</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='notification-recipients'>Recipients</Label>
                <Input
                  id='notification-recipients'
                  value={nodeData.notificationRecipients || ''}
                  onChange={e =>
                    handleNodeUpdate('notificationRecipients', e.target.value)
                  }
                  placeholder='user@example.com, manager'
                />
              </div>

              <div>
                <Label htmlFor='notification-subject'>Subject</Label>
                <Input
                  id='notification-subject'
                  value={nodeData.notificationSubject || ''}
                  onChange={e =>
                    handleNodeUpdate('notificationSubject', e.target.value)
                  }
                  placeholder='Notification subject'
                />
              </div>

              <div>
                <Label htmlFor='notification-message'>Message</Label>
                <Textarea
                  id='notification-message'
                  value={nodeData.notificationMessage || ''}
                  onChange={e =>
                    handleNodeUpdate('notificationMessage', e.target.value)
                  }
                  placeholder='Notification message'
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {nodeType === 'delay' && (
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Delay Settings</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div>
                <Label htmlFor='delay-duration'>Duration</Label>
                <Input
                  id='delay-duration'
                  type='number'
                  value={nodeData.delayDuration || ''}
                  onChange={e =>
                    handleNodeUpdate(
                      'delayDuration',
                      parseInt(e.target.value) || 0
                    )
                  }
                  placeholder='0'
                />
              </div>

              <div>
                <Label htmlFor='delay-unit'>Unit</Label>
                <Select
                  value={nodeData.delayUnit || 'minutes'}
                  onValueChange={value => handleNodeUpdate('delayUnit', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='minutes'>Minutes</SelectItem>
                    <SelectItem value='hours'>Hours</SelectItem>
                    <SelectItem value='days'>Days</SelectItem>
                    <SelectItem value='weeks'>Weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {nodeType === 'integration' && (
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Integration Settings</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div>
                <Label htmlFor='api-endpoint'>API Endpoint</Label>
                <Input
                  id='api-endpoint'
                  value={nodeData.apiEndpoint || ''}
                  onChange={e =>
                    handleNodeUpdate('apiEndpoint', e.target.value)
                  }
                  placeholder='https://api.example.com/endpoint'
                />
              </div>

              <div>
                <Label htmlFor='http-method'>HTTP Method</Label>
                <Select
                  value={nodeData.httpMethod || 'POST'}
                  onValueChange={value => handleNodeUpdate('httpMethod', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='GET'>GET</SelectItem>
                    <SelectItem value='POST'>POST</SelectItem>
                    <SelectItem value='PUT'>PUT</SelectItem>
                    <SelectItem value='DELETE'>DELETE</SelectItem>
                    <SelectItem value='PATCH'>PATCH</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='request-body'>Request Body</Label>
                <Textarea
                  id='request-body'
                  value={nodeData.requestBody || ''}
                  onChange={e =>
                    handleNodeUpdate('requestBody', e.target.value)
                  }
                  placeholder='{"key": "value"}'
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor='headers'>Headers</Label>
                <Textarea
                  id='headers'
                  value={nodeData.headers || ''}
                  onChange={e => handleNodeUpdate('headers', e.target.value)}
                  placeholder='{"Authorization": "Bearer token"}'
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>Assignment</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div>
              <Label htmlFor='assigned-to'>Assigned To</Label>
              <Select
                value={nodeData.assignedTo || ''}
                onValueChange={value => handleNodeUpdate('assignedTo', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select assignee' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='current_user'>Current User</SelectItem>
                  <SelectItem value='manager'>Manager</SelectItem>
                  <SelectItem value='admin'>Administrator</SelectItem>
                  <SelectItem value='role'>By Role</SelectItem>
                  <SelectItem value='specific'>Specific User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {nodeData.assignedTo === 'role' && (
              <div>
                <Label htmlFor='assigned-role'>Role</Label>
                <Input
                  id='assigned-role'
                  value={nodeData.assignedRole || ''}
                  onChange={e =>
                    handleNodeUpdate('assignedRole', e.target.value)
                  }
                  placeholder='Enter role name'
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderWorkflowProperties = () => (
    <div className='space-y-4'>
      <div>
        <Label htmlFor='workflow-name'>Workflow Name</Label>
        <Input
          id='workflow-name'
          value={workflowName}
          onChange={e => onUpdateWorkflow({ name: e.target.value })}
          placeholder='Enter workflow name'
        />
      </div>

      <div>
        <Label htmlFor='workflow-description'>Description</Label>
        <Textarea
          id='workflow-description'
          value={workflowDescription}
          onChange={e => onUpdateWorkflow({ description: e.target.value })}
          placeholder='Describe what this workflow does'
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor='workflow-category'>Category</Label>
        <Select
          value={workflowCategory}
          onValueChange={value => onUpdateWorkflow({ category: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder='Select category' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='approval'>Approval</SelectItem>
            <SelectItem value='automation'>Automation</SelectItem>
            <SelectItem value='notification'>Notification</SelectItem>
            <SelectItem value='integration'>Integration</SelectItem>
            <SelectItem value='hr'>Human Resources</SelectItem>
            <SelectItem value='finance'>Finance</SelectItem>
            <SelectItem value='sales'>Sales</SelectItem>
            <SelectItem value='support'>Support</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Tags</Label>
        <div className='flex flex-wrap gap-1 mb-2'>
          {workflowTags.map(tag => (
            <Badge
              key={tag}
              variant='secondary'
              className='flex items-center gap-1'
            >
              {tag}
              <X
                className='h-3 w-3 cursor-pointer'
                onClick={() => removeTag(tag)}
              />
            </Badge>
          ))}
        </div>
        <div className='flex gap-2'>
          <Input
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            placeholder='Add tag'
            onKeyPress={e => e.key === 'Enter' && addTag()}
          />
          <Button size='sm' onClick={addTag}>
            <Plus className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className='h-full flex flex-col'>
      <div className='p-4 border-b'>
        <h3 className='font-semibold text-sm'>Properties</h3>
      </div>

      <div className='flex-1 overflow-y-auto p-4'>
        {selectedNode || selectedEdge ? (
          <Tabs defaultValue='properties'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='properties'>Properties</TabsTrigger>
              <TabsTrigger value='workflow'>Workflow</TabsTrigger>
            </TabsList>

            <TabsContent value='properties' className='mt-4'>
              {selectedNode && (
                <div>
                  <div className='flex items-center justify-between mb-4'>
                    <div>
                      <h4 className='font-medium'>
                        {selectedNode.data.label || 'Untitled Node'}
                      </h4>
                      <p className='text-xs text-gray-500'>
                        {selectedNode.data.nodeType || selectedNode.type}
                      </p>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-red-600 hover:text-red-700'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                  {renderNodeProperties()}
                </div>
              )}

              {selectedEdge && (
                <div>
                  <h4 className='font-medium mb-4'>Edge Properties</h4>
                  <div className='space-y-3'>
                    <div>
                      <Label htmlFor='edge-label'>Label</Label>
                      <Input
                        id='edge-label'
                        value={String(selectedEdge.label || '')}
                        placeholder='Enter edge label'
                      />
                    </div>
                    <div>
                      <Label htmlFor='edge-condition'>Condition</Label>
                      <Input
                        id='edge-condition'
                        value={selectedEdge.data?.condition || ''}
                        placeholder='e.g., approved = true'
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value='workflow' className='mt-4'>
              {renderWorkflowProperties()}
            </TabsContent>
          </Tabs>
        ) : (
          <div>
            <h4 className='font-medium mb-4'>Workflow Properties</h4>
            {renderWorkflowProperties()}
          </div>
        )}
      </div>
    </div>
  );
}
