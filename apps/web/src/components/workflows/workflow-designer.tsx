'use client';

import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  MiniMap,
  Node,
  Panel,
  ReactFlowInstance,
  addEdge,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';

// Enhanced node types for the workflow
const nodeTypes = {
  start: 'Start',
  task: 'Task',
  approval: 'Approval',
  condition: 'Condition',
  parallel: 'Parallel Gateway',
  exclusive: 'Exclusive Gateway',
  notification: 'Notification',
  integration: 'API Integration',
  delay: 'Timer/Delay',
  script: 'Script Task',
  user_task: 'User Task',
  service_task: 'Service Task',
  subprocess: 'Sub Process',
  loop: 'Loop',
  escalation: 'Escalation',
  end: 'End',
};

// Node categories for better organization
const nodeCategories = {
  flow: ['start', 'end'],
  tasks: ['task', 'user_task', 'service_task', 'script'],
  gateways: ['condition', 'parallel', 'exclusive'],
  events: ['notification', 'escalation', 'delay'],
  integration: ['integration', 'subprocess'],
  advanced: ['loop'],
};

// Initial nodes and edges
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Start' },
    position: { x: 250, y: 25 },
  },
];

const initialEdges: Edge[] = [];

interface WorkflowDesignerProps {
  workflowId?: string;
  initialWorkflow?: any;
  onSave?: (workflow: any) => void;
  onValidate?: (errors: string[]) => void;
  readOnly?: boolean;
  showTemplates?: boolean;
}

export default function WorkflowDesigner({
  workflowId,
  initialWorkflow,
  onSave,
  onValidate,
  readOnly = false,
  showTemplates = true,
}: WorkflowDesignerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialWorkflow?.definition?.nodes?.map((node: any) => ({
      id: node.id,
      type:
        node.type === 'start' || node.type === 'end' ? node.type : 'default',
      position: node.position || { x: 0, y: 0 },
      data: { ...node.data, nodeType: node.type, label: node.label },
    })) || initialNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialWorkflow?.definition?.edges || initialEdges
  );
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflowName, setWorkflowName] = useState(initialWorkflow?.name || '');
  const [workflowDescription, setWorkflowDescription] = useState(
    initialWorkflow?.description || ''
  );
  const [workflowCategory, setWorkflowCategory] = useState(
    initialWorkflow?.category || ''
  );
  const [workflowTags, setWorkflowTags] = useState<string[]>(
    initialWorkflow?.tags || []
  );
  const [workflowVersion, setWorkflowVersion] = useState(
    initialWorkflow?.version || 1
  );
  const [slaSettings, setSlaSettings] = useState(
    initialWorkflow?.slaSettings || {}
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('flow');
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      if (!reactFlowInstance || !reactFlowWrapper.current) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${nodes.length + 1}`,
        type: type === 'start' || type === 'end' ? type : 'default',
        position,
        data: {
          label: nodeTypes[type as keyof typeof nodeTypes] || type,
          nodeType: type,
        },
      };

      setNodes(nds => nds.concat(newNode));
    },
    [reactFlowInstance, nodes, setNodes]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes(nds =>
      nds.map(node =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
  };

  const deleteNode = (nodeId: string) => {
    setNodes(nds => nds.filter(node => node.id !== nodeId));
    setEdges(eds =>
      eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
    );
    setSelectedNode(null);
  };

  const saveWorkflow = () => {
    const validationErrors = validateWorkflow();
    if (validationErrors.length > 0) {
      alert(
        'Please fix validation errors before saving:\n' +
          validationErrors.join('\n')
      );
      return;
    }

    const workflow = {
      name: workflowName,
      description: workflowDescription,
      category: workflowCategory,
      tags: workflowTags,
      version: workflowVersion,
      definition: {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.data.nodeType || node.type,
          label: node.data.label,
          data: node.data,
          position: node.position,
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          data: edge.data,
        })),
        settings: {
          sla: slaSettings,
          autoStart: false,
          notifications: true,
        },
      },
    };

    onSave?.(workflow);
  };

  const loadTemplate = (templateType: string) => {
    const templates = {
      approval: {
        nodes: [
          {
            id: '1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: { label: 'Start', nodeType: 'start' },
          },
          {
            id: '2',
            type: 'default',
            position: { x: 300, y: 100 },
            data: { label: 'Submit Request', nodeType: 'user_task' },
          },
          {
            id: '3',
            type: 'default',
            position: { x: 500, y: 100 },
            data: {
              label: 'Manager Approval',
              nodeType: 'approval',
              approver: 'manager',
              slaHours: 24,
            },
          },
          {
            id: '4',
            type: 'default',
            position: { x: 700, y: 50 },
            data: { label: 'Approved', nodeType: 'notification' },
          },
          {
            id: '5',
            type: 'default',
            position: { x: 700, y: 150 },
            data: { label: 'Rejected', nodeType: 'notification' },
          },
          {
            id: '6',
            type: 'end',
            position: { x: 900, y: 100 },
            data: { label: 'End', nodeType: 'end' },
          },
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3' },
          { id: 'e3-4', source: '3', target: '4', label: 'Approved' },
          { id: 'e3-5', source: '3', target: '5', label: 'Rejected' },
          { id: 'e4-6', source: '4', target: '6' },
          { id: 'e5-6', source: '5', target: '6' },
        ],
      },
      notification: {
        nodes: [
          {
            id: '1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: { label: 'Start', nodeType: 'start' },
          },
          {
            id: '2',
            type: 'default',
            position: { x: 300, y: 100 },
            data: { label: 'Send Email', nodeType: 'notification' },
          },
          {
            id: '3',
            type: 'default',
            position: { x: 500, y: 100 },
            data: { label: 'Wait 1 hour', nodeType: 'delay', delayMinutes: 60 },
          },
          {
            id: '4',
            type: 'default',
            position: { x: 700, y: 100 },
            data: { label: 'Send Reminder', nodeType: 'notification' },
          },
          {
            id: '5',
            type: 'end',
            position: { x: 900, y: 100 },
            data: { label: 'End', nodeType: 'end' },
          },
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3' },
          { id: 'e3-4', source: '3', target: '4' },
          { id: 'e4-5', source: '4', target: '5' },
        ],
      },
      integration: {
        nodes: [
          {
            id: '1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: { label: 'Start', nodeType: 'start' },
          },
          {
            id: '2',
            type: 'default',
            position: { x: 300, y: 100 },
            data: { label: 'API Call', nodeType: 'integration' },
          },
          {
            id: '3',
            type: 'default',
            position: { x: 500, y: 100 },
            data: { label: 'Check Response', nodeType: 'condition' },
          },
          {
            id: '4',
            type: 'default',
            position: { x: 700, y: 50 },
            data: { label: 'Success Handler', nodeType: 'task' },
          },
          {
            id: '5',
            type: 'default',
            position: { x: 700, y: 150 },
            data: { label: 'Error Handler', nodeType: 'task' },
          },
          {
            id: '6',
            type: 'end',
            position: { x: 900, y: 100 },
            data: { label: 'End', nodeType: 'end' },
          },
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3' },
          { id: 'e3-4', source: '3', target: '4', label: 'Success' },
          { id: 'e3-5', source: '3', target: '5', label: 'Error' },
          { id: 'e4-6', source: '4', target: '6' },
          { id: 'e5-6', source: '5', target: '6' },
        ],
      },
    };

    const template = templates[templateType as keyof typeof templates];
    if (template) {
      setNodes(
        template.nodes.map(node => ({
          ...node,
          type:
            node.data.nodeType === 'start' || node.data.nodeType === 'end'
              ? node.data.nodeType
              : 'default',
        }))
      );
      setEdges(template.edges);
      setWorkflowName(
        `${templateType.charAt(0).toUpperCase() + templateType.slice(1)} Workflow`
      );
      setWorkflowCategory(templateType);
    }
  };

  const validateWorkflow = () => {
    const errors: string[] = [];

    // Check for start node
    const hasStart = nodes.some(
      node => node.data.nodeType === 'start' || node.type === 'input'
    );
    if (!hasStart) errors.push('Workflow must have a start node');

    // Check for end node
    const hasEnd = nodes.some(
      node => node.data.nodeType === 'end' || node.type === 'output'
    );
    if (!hasEnd) errors.push('Workflow must have an end node');

    // Check for disconnected nodes
    const connectedNodes = new Set();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    const disconnectedNodes = nodes.filter(
      node => !connectedNodes.has(node.id) && nodes.length > 1
    );

    if (disconnectedNodes.length > 0) {
      errors.push(
        `Disconnected nodes: ${disconnectedNodes.map(n => n.data.label).join(', ')}`
      );
    }

    // Validate approval nodes
    const approvalNodes = nodes.filter(
      node => node.data.nodeType === 'approval'
    );
    approvalNodes.forEach(node => {
      if (!node.data.approver) {
        errors.push(
          `Approval node "${node.data.label}" must have an approver assigned`
        );
      }
    });

    // Validate condition nodes
    const conditionNodes = nodes.filter(
      node =>
        node.data.nodeType === 'condition' || node.data.nodeType === 'exclusive'
    );
    conditionNodes.forEach(node => {
      if (!node.data.condition) {
        errors.push(
          `Condition node "${node.data.label}" must have condition logic defined`
        );
      }
    });

    // Validate integration nodes
    const integrationNodes = nodes.filter(
      node => node.data.nodeType === 'integration'
    );
    integrationNodes.forEach(node => {
      if (!node.data.apiEndpoint) {
        errors.push(
          `Integration node "${node.data.label}" must have an API endpoint defined`
        );
      }
    });

    // Check for cycles (basic check)
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingEdges = edges.filter(edge => edge.source === nodeId);
      for (const edge of outgoingEdges) {
        if (hasCycle(edge.target)) return true;
      }

      recursionStack.delete(nodeId);
      return false;
    };

    const startNodes = nodes.filter(node => node.data.nodeType === 'start');
    for (const startNode of startNodes) {
      if (hasCycle(startNode.id)) {
        errors.push('Workflow contains cycles which may cause infinite loops');
        break;
      }
    }

    setValidationErrors(errors);
    onValidate?.(errors);
    return errors;
  };

  return (
    <div className='h-screen flex'>
      {/* Sidebar */}
      <div className='w-80 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto'>
        <Tabs defaultValue='nodes' className='w-full'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='nodes'>Nodes</TabsTrigger>
            <TabsTrigger value='properties'>Properties</TabsTrigger>
            <TabsTrigger value='settings'>Settings</TabsTrigger>
          </TabsList>

          <TabsContent value='nodes' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='text-sm'>Workflow Settings</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div>
                  <Label htmlFor='workflow-name'>Name</Label>
                  <Input
                    id='workflow-name'
                    value={workflowName}
                    onChange={e => setWorkflowName(e.target.value)}
                    placeholder='Enter workflow name'
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label htmlFor='workflow-description'>Description</Label>
                  <Textarea
                    id='workflow-description'
                    value={workflowDescription}
                    onChange={e => setWorkflowDescription(e.target.value)}
                    placeholder='Enter workflow description'
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label htmlFor='workflow-category'>Category</Label>
                  <Select
                    value={workflowCategory}
                    onValueChange={setWorkflowCategory}
                    disabled={readOnly}
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
                      <SelectItem value='custom'>Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='workflow-tags'>Tags</Label>
                  <Input
                    id='workflow-tags'
                    value={workflowTags.join(', ')}
                    onChange={e =>
                      setWorkflowTags(
                        e.target.value
                          .split(',')
                          .map(tag => tag.trim())
                          .filter(Boolean)
                      )
                    }
                    placeholder='Enter tags separated by commas'
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label htmlFor='workflow-version'>Version</Label>
                  <Input
                    id='workflow-version'
                    type='number'
                    value={workflowVersion}
                    onChange={e =>
                      setWorkflowVersion(parseInt(e.target.value) || 1)
                    }
                    min='1'
                    disabled={readOnly}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-sm'>Node Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex flex-wrap gap-1'>
                    {Object.keys(nodeCategories).map(category => (
                      <Button
                        key={category}
                        variant={
                          activeCategory === category ? 'default' : 'outline'
                        }
                        size='sm'
                        onClick={() => setActiveCategory(category)}
                        className='text-xs'
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Button>
                    ))}
                  </div>
                  <div className='grid grid-cols-1 gap-2'>
                    {nodeCategories[
                      activeCategory as keyof typeof nodeCategories
                    ]?.map(type => (
                      <div
                        key={type}
                        className='p-2 border border-gray-300 rounded cursor-move text-center text-xs bg-white hover:bg-gray-50 flex items-center justify-center'
                        draggable={!readOnly}
                        onDragStart={event => onDragStart(event, type)}
                      >
                        <span className='mr-2'>
                          {type === 'start' && '▶️'}
                          {type === 'end' && '⏹️'}
                          {type === 'task' && '📋'}
                          {type === 'approval' && '✅'}
                          {type === 'condition' && '❓'}
                          {type === 'parallel' && '⚡'}
                          {type === 'notification' && '📧'}
                          {type === 'integration' && '🔗'}
                          {type === 'delay' && '⏰'}
                          {type === 'script' && '📜'}
                          {type === 'user_task' && '👤'}
                          {type === 'service_task' && '⚙️'}
                          {type === 'subprocess' && '📦'}
                          {type === 'exclusive' && '◆'}
                          {type === 'escalation' && '🚨'}
                          {type === 'loop' && '🔄'}
                        </span>
                        {nodeTypes[type as keyof typeof nodeTypes]}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {showTemplates && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-sm'>Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full text-xs'
                      onClick={() => loadTemplate('approval')}
                      disabled={readOnly}
                    >
                      📋 Approval Process
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full text-xs'
                      onClick={() => loadTemplate('notification')}
                      disabled={readOnly}
                    >
                      📧 Notification Flow
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full text-xs'
                      onClick={() => loadTemplate('integration')}
                      disabled={readOnly}
                    >
                      🔗 API Integration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value='properties' className='space-y-4'>
            {selectedNode ? (
              <Card>
                <CardHeader>
                  <CardTitle className='text-sm'>Node Properties</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div>
                    <Label htmlFor='node-label'>Label</Label>
                    <Input
                      id='node-label'
                      value={selectedNode.data.label || ''}
                      onChange={e =>
                        updateNodeData(selectedNode.id, {
                          label: e.target.value,
                        })
                      }
                      disabled={readOnly}
                    />
                  </div>

                  {selectedNode.data.nodeType === 'approval' && (
                    <>
                      <div>
                        <Label htmlFor='approver'>Approver</Label>
                        <Input
                          id='approver'
                          value={selectedNode.data.approver || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              approver: e.target.value,
                            })
                          }
                          placeholder='Enter approver ID or role'
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor='approval-type'>Approval Type</Label>
                        <Select
                          value={selectedNode.data.approvalType || 'single'}
                          onValueChange={value =>
                            updateNodeData(selectedNode.id, {
                              approvalType: value,
                            })
                          }
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='single'>
                              Single Approval
                            </SelectItem>
                            <SelectItem value='multiple'>
                              Multiple Approvals
                            </SelectItem>
                            <SelectItem value='unanimous'>Unanimous</SelectItem>
                            <SelectItem value='sequential'>
                              Sequential
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor='approval-sla'>SLA (hours)</Label>
                        <Input
                          id='approval-sla'
                          type='number'
                          value={selectedNode.data.slaHours || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              slaHours: parseInt(e.target.value),
                            })
                          }
                          placeholder='24'
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor='escalation-rule'>Escalation Rule</Label>
                        <Select
                          value={selectedNode.data.escalationRule || 'none'}
                          onValueChange={value =>
                            updateNodeData(selectedNode.id, {
                              escalationRule: value,
                            })
                          }
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='none'>No Escalation</SelectItem>
                            <SelectItem value='manager'>To Manager</SelectItem>
                            <SelectItem value='admin'>To Admin</SelectItem>
                            <SelectItem value='custom'>Custom Rule</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {(selectedNode.data.nodeType === 'condition' ||
                    selectedNode.data.nodeType === 'exclusive') && (
                    <>
                      <div>
                        <Label htmlFor='condition-type'>Condition Type</Label>
                        <Select
                          value={
                            selectedNode.data.conditionType || 'expression'
                          }
                          onValueChange={value =>
                            updateNodeData(selectedNode.id, {
                              conditionType: value,
                            })
                          }
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='expression'>
                              Expression
                            </SelectItem>
                            <SelectItem value='script'>Script</SelectItem>
                            <SelectItem value='rule'>Business Rule</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor='condition'>Condition Logic</Label>
                        <Textarea
                          id='condition'
                          value={selectedNode.data.condition || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              condition: e.target.value,
                            })
                          }
                          placeholder='e.g., amount > 1000 || priority === "high"'
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor='default-path'>Default Path</Label>
                        <Select
                          value={selectedNode.data.defaultPath || 'true'}
                          onValueChange={value =>
                            updateNodeData(selectedNode.id, {
                              defaultPath: value,
                            })
                          }
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='true'>True Path</SelectItem>
                            <SelectItem value='false'>False Path</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {selectedNode.data.nodeType === 'delay' && (
                    <>
                      <div>
                        <Label htmlFor='delay-type'>Delay Type</Label>
                        <Select
                          value={selectedNode.data.delayType || 'fixed'}
                          onValueChange={value =>
                            updateNodeData(selectedNode.id, {
                              delayType: value,
                            })
                          }
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='fixed'>Fixed Duration</SelectItem>
                            <SelectItem value='until_date'>Until Date</SelectItem>
                            <SelectItem value='business_days'>Business Days</SelectItem>
                            <SelectItem value='condition'>Until Condition</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor='delay-duration'>Duration (minutes)</Label>
                        <Input
                          id='delay-duration'
                          type='number'
                          value={selectedNode.data.delayMinutes || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              delayMinutes: parseInt(e.target.value),
                            })
                          }
                          placeholder='60'
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor='delay-until-date'>Until Date</Label>
                        <Input
                          id='delay-until-date'
                          type='datetime-local'
                          value={selectedNode.data.untilDate || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              untilDate: e.target.value,
                            })
                          }
                          disabled={readOnly || selectedNode.data.delayType !== 'until_date'}
                        />
                      </div>
                      <div>
                        <Label htmlFor='delay-condition'>Wait Condition</Label>
                        <Textarea
                          id='delay-condition'
                          value={selectedNode.data.waitCondition || ''}
                          onChange={e =>
           updateNodeData(selectedNode.id, {
                              waitCondition: e.target.value,
                            })
                          }
                          placeholder='e.g., status === "approved"'
                          disabled={readOnly || selectedNode.data.delayType !== 'condition'}
                        />
                      </div>
                    </>
                  )}

                  {selectedNode.data.nodeType === 'notification' && (
                    <>
                      <div>
                        <Label htmlFor='notification-type'>Notification Type</Label>
                        <Select
                          value={selectedNode.data.notificationType || 'email'}
                          onValueChange={value =>
                            updateNodeData(selectedNode.id, {
                              notificationType: value,
                            })
                          }
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='email'>Email</SelectItem>
                            <SelectItem value='sms'>SMS</SelectItem>
                            <SelectItem value='push'>Push Notification</SelectItem>
                            <SelectItem value='slack'>Slack</SelectItem>
                            <SelectItem value='teams'>Microsoft Teams</SelectItem>
                            <SelectItem value='webhook'>Webhook</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor='notification-recipients'>Recipients</Label>
                        <Input
                          id='notification-recipients'
                          value={selectedNode.data.recipients || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              recipients: e.target.value,
                            })
                          }
                          placeholder='user@example.com, role:manager'
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor='notification-subject'>Subject</Label>
                        <Input
                          id='notification-subject'
                          value={selectedNode.data.subject || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              subject: e.target.value,
                            })
                          }
                          placeholder='Workflow notification'
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor='notification-message'>Message</Label>
                        <Textarea
                          id='notification-message'
                          value={selectedNode.data.message || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              message: e.target.value,
                            })
                          }
                          placeholder='Enter notification message...'
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor='notification-template'>Template Variables</Label>
                        <Input
                          id='notification-template'
                          value={selectedNode.data.templateVars || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              templateVars: e.target.value,
                            })
                          }
                          placeholder='{{user.name}}, {{workflow.name}}'
                          disabled={readOnly}
                        />
                      </div>
                    </>
                  )}

                  {selectedNode.data.nodeType === 'integration' && (
                    <>
                      <div>
                        <Label htmlFor='api-method'>HTTP Method</Label>
                        <Select
                          value={selectedNode.data.httpMethod || 'POST'}
                          onValueChange={value =>
                            updateNodeData(selectedNode.id, {
                              httpMethod: value,
                            })
                          }
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='GET'>GET</SelectItem>
                            <SelectItem value='POST'>POST</SelectItem>
                            <SelectItem value='PUT'>PUT</SelectItem>
                            <SelectItem value='PATCH'>PATCH</SelectItem>
                            <SelectItem value='DELETE'>DELETE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor='api-endpoint'>API Endpoint</Label>
                        <Input
                          id='api-endpoint'
                          value={selectedNode.data.apiEndpoint || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              apiEndpoint: e.target.value,
                            })
                          }
                          placeholder='https://api.example.com/endpoint'
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor='api-headers'>Headers (JSON)</Label>
                        <Textarea
                          id='api-headers'
                          value={selectedNode.data.headers || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              headers: e.target.value,
                            })
                          }
                          placeholder='{"Authorization": "Bearer {{token}}", "Content-Type": "application/json"}'
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor='api-body'>Request Body (JSON)</Label>
                        <Textarea
                          id='api-body'
                          value={selectedNode.data.requestBody || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              requestBody: e.target.value,
                            })
                          }
                          placeholder='{"data": "{{workflow.data}}"}'
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor='api-timeout'>Timeout (seconds)</Label>
                        <Input
                          id='api-timeout'
                          type='number'
                          value={selectedNode.data.timeout || '30'}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              timeout: parseInt(e.target.value),
                            })
                          }
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor='api-retry'>Retry Attempts</Label>
                        <Input
                          id='api-retry'
                          type='number'
                          value={selectedNode.data.retryAttempts || '3'}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              retryAttempts: parseInt(e.target.value),
                            })
                          }
                          disabled={readOnly}
                        />
                      </div>
                    </>
                  )}

                  {selectedNode.data.nodeType === 'script' && (
                    <>
                      <div>
                        <Label htmlFor='script-language'>Script Language</Label>
                        <Select
                          value={selectedNode.data.scriptLanguage || 'javascript'}
                          onValueChange={value =>
                            updateNodeData(selectedNode.id, {
                              scriptLanguage: value,
                            })
                          }
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='javascript'>JavaScript</SelectItem>
                            <SelectItem value='python'>Python</SelectItem>
                            <SelectItem value='sql'>SQL</SelectItem>
                            <SelectItem value='groovy'>Groovy</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor='script-code'>Script Code</Label>
                        <Textarea
                          id='script-code'
                          value={selectedNode.data.scriptCode || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              scriptCode: e.target.value,
                            })
                          }
                          placeholder='// Enter your script code here\nreturn { result: "success" };'
                          rows={8}
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor='script-timeout'>Execution Timeout (seconds)</Label>
                        <Input
                          id='script-timeout'
                          type='number'
                          value={selectedNode.data.executionTimeout || '30'}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              executionTimeout: parseInt(e.target.value),
                            })
                          }
                          disabled={readOnly}
                        />
                      </div>
                    </>
                  )}

                  {selectedNode.data.nodeType === 'parallel' && (
                    <>
                      <div>
                        <Label htmlFor='parallel-type'>Parallel Type</Label>
                        <Select
                          value={selectedNode.data.parallelType || 'all'}
                          onValueChange={value =>
                            updateNodeData(selectedNode.id, {
                              parallelType: value,
                            })
                          }
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='all'>Wait for All</SelectItem>
                            <SelectItem value='any'>Wait for Any</SelectItem>
                            <SelectItem value='majority'>Wait for Majority</SelectItem>
                            <SelectItem value='count'>Wait for Count</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor='parallel-count'>Required Count</Label>
                        <Input
                          id='parallel-count'
                          type='number'
                          value={selectedNode.data.requiredCount || '1'}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              requiredCount: parseInt(e.target.value),
                            })
                          }
                          disabled={readOnly || selectedNode.data.parallelType !== 'count'}
                        />
                      </div>
                      <div>
                        <Label htmlFor='parallel-timeout'>Timeout (minutes)</Label>
                        <Input
                          id='parallel-timeout'
                          type='number'
                          value={selectedNode.data.parallelTimeout || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              parallelTimeout: parseInt(e.target.value),
                            })
                          }
                          placeholder='No timeout'
                          disabled={readOnly}
                        />
                      </div>
                    </>
                  )}

                  {selectedNode.data.nodeType === 'loop' && (
                    <>
                      <div>
                        <Label htmlFor='loop-type'>Loop Type</Label>
                        <Select
                          value={selectedNode.data.loopType || 'while'}
                          onValueChange={value =>
                            updateNodeData(selectedNode.id, {
                              loopType: value,
                            })
                          }
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='while'>While Loop</SelectItem>
                            <SelectItem value='for'>For Loop</SelectItem>
                            <SelectItem value='foreach'>For Each</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor='loop-condition'>Loop Condition</Label>
                        <Textarea
                          id='loop-condition'
                          value={selectedNode.data.loopCondition || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              loopCondition: e.target.value,
                            })
                          }
                          placeholder='e.g., counter < 10'
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor='loop-max-iterations'>Max Iterations</Label>
                        <Input
                          id='loop-max-iterations'
                          type='number'
                          value={selectedNode.data.maxIterations || '100'}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              maxIterations: parseInt(e.target.value),
                            })
                          }
                          disabled={readOnly}
                        />
                      </div>
                    </>
                  )}

                  {selectedNode.data.nodeType === 'user_task' && (
                    <>
                      <div>
                        <Label htmlFor='task-form'>Task Form</Label>
                        <Select
                          value={selectedNode.data.taskForm || 'simple'}
                          onValueChange={value =>
                            updateNodeData(selectedNode.id, {
                              taskForm: value,
                            })
                          }
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='simple'>Simple Form</SelectItem>
                            <SelectItem value='custom'>Custom Form</SelectItem>
                            <SelectItem value='external'>External Form</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor='task-instructions'>Instructions</Label>
                        <Textarea
                          id='task-instructions'
                          value={selectedNode.data.instructions || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              instructions: e.target.value,
                            })
                          }
                          placeholder='Enter task instructions...'
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor='task-priority'>Priority</Label>
                        <Select
                          value={selectedNode.data.taskPriority || 'normal'}
                          onValueChange={value =>
                            updateNodeData(selectedNode.id, {
                              taskPriority: value,
                            })
                          }
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='low'>Low</SelectItem>
                            <SelectItem value='normal'>Normal</SelectItem>
                            <SelectItem value='high'>High</SelectItem>
                            <SelectItem value='urgent'>Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor='task-due-date'>Due Date (hours from start)</Label>
                        <Input
                          id='task-due-date'
                          type='number'
                          value={selectedNode.data.dueDateHours || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              dueDateHours: parseInt(e.target.value),
                            })
                          }
                          placeholder='24'
                          disabled={readOnly}
                        />
                      </div>
                    </>
                  )}

                  {selectedNode.data.nodeType === 'service_task' && (
                    <>
                      <div>
                        <Label htmlFor='service-type'>Service Type</Label>
                        <Select
                          value={selectedNode.data.serviceType || 'internal'}
                          onValueChange={value =>
                            updateNodeData(selectedNode.id, {
                              serviceType: value,
                            })
                          }
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='internal'>Internal Service</SelectItem>
                            <SelectItem value='external'>External API</SelectItem>
                            <SelectItem value='database'>Database Query</SelectItem>
                            <SelectItem value='file'>File Operation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor='service-config'>Service Configuration</Label>
                        <Textarea
                          id='service-config'
                          value={selectedNode.data.serviceConfig || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              serviceConfig: e.target.value,
                            })
                          }
                          placeholder='{"service": "emailService", "method": "sendEmail"}'
                          disabled={readOnly}
                        />
                      </div>
                    </>
                  )}

                  {selectedNode.data.nodeType === 'escalation' && (
                    <>
                      <div>
                        <Label htmlFor='escalation-trigger'>Escalation Trigger</Label>
                        <Select
                          value={selectedNode.data.escalationTrigger || 'timeout'}
                          onValueChange={value =>
                            updateNodeData(selectedNode.id, {
                              escalationTrigger: value,
                            })
                          }
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='timeout'>Timeout</SelectItem>
                            <SelectItem value='condition'>Condition</SelectItem>
                            <SelectItem value='manual'>Manual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor='escalation-timeout'>Timeout (hours)</Label>
                        <Input
                          id='escalation-timeout'
                          type='number'
                          value={selectedNode.data.escalationTimeout || '24'}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              escalationTimeout: parseInt(e.target.value),
                            })
                          }
                          disabled={readOnly || selectedNode.data.escalationTrigger !== 'timeout'}
                        />
                      </div>
                      <div>
                        <Label htmlFor='escalation-to'>Escalate To</Label>
                        <Input
                          id='escalation-to'
                          value={selectedNode.data.escalateTo || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              escalateTo: e.target.value,
                            })
                          }
                          placeholder='user@example.com or role:manager'
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor='escalation-action'>Escalation Action</Label>
                        <Select
                          value={selectedNode.data.escalationAction || 'notify'}
                          onValueChange={value =>
                            updateNodeData(selectedNode.id, {
                              escalationAction: value,
                            })
                          }
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='notify'>Notify Only</SelectItem>
                            <SelectItem value='reassign'>Reassign Task</SelectItem>
                            <SelectItem value='auto_approve'>Auto Approve</SelectItem>
                            <SelectItem value='cancel'>Cancel Workflow</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <div className='pt-4 border-t'>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => deleteNode(selectedNode.id)}
                      disabled={readOnly}
                      className='w-full'
                    >
                      Delete Node
                    </Button>
                  </div>
                      <Label htmlFor='delay-duration'>
                        Delay Duration (minutes)
                      </Label>
                      <Input
                        id='delay-duration'
                        type='number'
                        value={selectedNode.data.delayMinutes || ''}
                        onChange={e =>
                          updateNodeData(selectedNode.id, {
                            delayMinutes: parseInt(e.target.value),
                          })
                        }
                        disabled={readOnly}
                      />
                    </div>
                  )}

                  {selectedNode.data.nodeType === 'notification' && (
                    <>
                      <div>
                        <Label htmlFor='notification-title'>Title</Label>
                        <Input
                          id='notification-title'
                          value={selectedNode.data.notificationTitle || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              notificationTitle: e.target.value,
                            })
                          }
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor='notification-message'>Message</Label>
                        <Textarea
                          id='notification-message'
                          value={selectedNode.data.notificationMessage || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              notificationMessage: e.target.value,
                            })
                          }
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor='notification-type'>Type</Label>
                        <Select
                          value={selectedNode.data.notificationType || 'email'}
                          onValueChange={value =>
                            updateNodeData(selectedNode.id, {
                              notificationType: value,
                            })
                          }
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='email'>Email</SelectItem>
                            <SelectItem value='sms'>SMS</SelectItem>
                            <SelectItem value='push'>
                              Push Notification
                            </SelectItem>
                            <SelectItem value='all'>All Methods</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {selectedNode.data.nodeType === 'integration' && (
                    <>
                      <div>
                        <Label htmlFor='api-endpoint'>API Endpoint</Label>
                        <Input
                          id='api-endpoint'
                          value={selectedNode.data.apiEndpoint || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              apiEndpoint: e.target.value,
                            })
                          }
                          placeholder='https://api.example.com/endpoint'
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor='http-method'>HTTP Method</Label>
                        <Select
                          value={selectedNode.data.httpMethod || 'POST'}
                          onValueChange={value =>
                            updateNodeData(selectedNode.id, {
                              httpMethod: value,
                            })
                          }
                          disabled={readOnly}
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
                          value={selectedNode.data.requestBody || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              requestBody: e.target.value,
                            })
                          }
                          placeholder='JSON request body'
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor='headers'>Headers</Label>
                        <Textarea
                          id='headers'
                          value={selectedNode.data.headers || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              headers: e.target.value,
                            })
                          }
                          placeholder='{"Authorization": "Bearer token"}'
                          disabled={readOnly}
                        />
                      </div>
                    </>
                  )}

                  {(selectedNode.data.nodeType === 'user_task' ||
                    selectedNode.data.nodeType === 'task') && (
                    <>
                      <div>
                        <Label htmlFor='assigned-to'>Assigned To</Label>
                        <Input
                          id='assigned-to'
                          value={selectedNode.data.assignedTo || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              assignedTo: e.target.value,
                            })
                          }
                          placeholder='User ID or role'
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor='task-priority'>Priority</Label>
                        <Select
                          value={selectedNode.data.priority || 'normal'}
                          onValueChange={value =>
                            updateNodeData(selectedNode.id, {
                              priority: value,
                            })
                          }
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='low'>Low</SelectItem>
                            <SelectItem value='normal'>Normal</SelectItem>
                            <SelectItem value='high'>High</SelectItem>
                            <SelectItem value='urgent'>Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor='task-sla'>SLA (hours)</Label>
                        <Input
                          id='task-sla'
                          type='number'
                          value={selectedNode.data.slaHours || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              slaHours: parseInt(e.target.value),
                            })
                          }
                          placeholder='24'
                          disabled={readOnly}
                        />
                      </div>
                    </>
                  )}

                  {selectedNode.data.nodeType === 'script' && (
                    <>
                      <div>
                        <Label htmlFor='script-language'>Language</Label>
                        <Select
                          value={
                            selectedNode.data.scriptLanguage || 'javascript'
                          }
                          onValueChange={value =>
                            updateNodeData(selectedNode.id, {
                              scriptLanguage: value,
                            })
                          }
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='javascript'>
                              JavaScript
                            </SelectItem>
                            <SelectItem value='python'>Python</SelectItem>
                            <SelectItem value='groovy'>Groovy</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor='script-code'>Script Code</Label>
                        <Textarea
                          id='script-code'
                          value={selectedNode.data.scriptCode || ''}
                          onChange={e =>
                            updateNodeData(selectedNode.id, {
                              scriptCode: e.target.value,
                            })
                          }
                          placeholder='// Your script code here'
                          disabled={readOnly}
                          rows={6}
                        />
                      </div>
                    </>
                  )}

                  {selectedNode.data.nodeType === 'parallel' && (
                    <div>
                      <Label htmlFor='parallel-type'>Parallel Type</Label>
                      <Select
                        value={selectedNode.data.parallelType || 'all'}
                        onValueChange={value =>
                          updateNodeData(selectedNode.id, {
                            parallelType: value,
                          })
                        }
                        disabled={readOnly}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='all'>Wait for All</SelectItem>
                          <SelectItem value='any'>Wait for Any</SelectItem>
                          <SelectItem value='count'>Wait for Count</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className='pt-2'>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => deleteNode(selectedNode.id)}
                      disabled={readOnly}
                    >
                      Delete Node
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className='p-6 text-center text-gray-500'>
                  Select a node to edit its properties
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value='settings' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='text-sm'>SLA Settings</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div>
                  <Label htmlFor='default-sla'>Default SLA (hours)</Label>
                  <Input
                    id='default-sla'
                    type='number'
                    value={slaSettings.defaultHours || ''}
                    onChange={e =>
                      setSlaSettings({
                        ...slaSettings,
                        defaultHours: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder='24'
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label htmlFor='escalation-enabled'>Enable Escalation</Label>
                  <Select
                    value={slaSettings.escalationEnabled ? 'true' : 'false'}
                    onValueChange={value =>
                      setSlaSettings({
                        ...slaSettings,
                        escalationEnabled: value === 'true',
                      })
                    }
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='true'>Enabled</SelectItem>
                      <SelectItem value='false'>Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='escalation-threshold'>
                    Escalation Threshold (%)
                  </Label>
                  <Input
                    id='escalation-threshold'
                    type='number'
                    value={slaSettings.escalationThreshold || ''}
                    onChange={e =>
                      setSlaSettings({
                        ...slaSettings,
                        escalationThreshold: parseInt(e.target.value) || 80,
                      })
                    }
                    placeholder='80'
                    min='1'
                    max='100'
                    disabled={readOnly}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-sm'>Workflow Settings</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div>
                  <Label htmlFor='auto-start'>Auto Start</Label>
                  <Select
                    value={slaSettings.autoStart ? 'true' : 'false'}
                    onValueChange={value =>
                      setSlaSettings({
                        ...slaSettings,
                        autoStart: value === 'true',
                      })
                    }
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='true'>Enabled</SelectItem>
                      <SelectItem value='false'>Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='notifications-enabled'>Notifications</Label>
                  <Select
                    value={slaSettings.notificationsEnabled ? 'true' : 'false'}
                    onValueChange={value =>
                      setSlaSettings({
                        ...slaSettings,
                        notificationsEnabled: value === 'true',
                      })
                    }
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='true'>Enabled</SelectItem>
                      <SelectItem value='false'>Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='retry-attempts'>Max Retry Attempts</Label>
                  <Input
                    id='retry-attempts'
                    type='number'
                    value={slaSettings.maxRetryAttempts || ''}
                    onChange={e =>
                      setSlaSettings({
                        ...slaSettings,
                        maxRetryAttempts: parseInt(e.target.value) || 3,
                      })
                    }
                    placeholder='3'
                    min='0'
                    max='10'
                    disabled={readOnly}
                  />
                </div>
              </CardContent>
            </Card>

            {validationErrors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-sm text-red-600'>
                    Validation Errors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className='text-sm text-red-600 space-y-1'>
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Main Canvas */}
      <div className='flex-1 relative'>
        <div ref={reactFlowWrapper} className='w-full h-full'>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

            <Panel position='top-right' className='space-x-2'>
              <Button
                onClick={() => {
                  const errors = validateWorkflow();
                  if (errors.length > 0) {
                    alert('Validation errors:\n' + errors.join('\n'));
                  } else {
                    alert('Workflow is valid!');
                  }
                }}
                variant='outline'
                size='sm'
              >
                Validate
              </Button>
              <Button
                onClick={saveWorkflow}
                disabled={readOnly || !workflowName}
                size='sm'
              >
                Save Workflow
              </Button>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
