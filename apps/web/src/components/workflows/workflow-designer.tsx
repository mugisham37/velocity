'use client';

import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  addEdge,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import type { Connection, Edge, Node, ReactFlowInstance } from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
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
  workflowId: _workflowId,
  initialWorkflow,
  onSave,
  onValidate,
  readOnly = false,
  showTemplates: _showTemplates = true,
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
  const [workflowTags] = useState<string[]>(initialWorkflow?.tags || []);
  const [workflowVersion] = useState(initialWorkflow?.version || 1);
  const [slaSettings, setSlaSettings] = useState(
    initialWorkflow?.slaSettings || {}
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds: Edge[]) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData('application/reactflow');
      if (!nodeType || !reactFlowInstance || !reactFlowWrapper.current) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType === 'start' || nodeType === 'end' ? nodeType : 'default',
        position,
        data: {
          label: nodeTypes[nodeType as keyof typeof nodeTypes] || nodeType,
          nodeType,
        },
      };

      setNodes((nds: Node[]) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds: Node[]) =>
      nds.map(node =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
  };

  const deleteNode = (nodeId: string) => {
    setNodes((nds: Node[]) => nds.filter(node => node.id !== nodeId));
    setEdges((eds: Edge[]) =>
      eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
    );
    setSelectedNode(null);
  };

  const validateWorkflow = () => {
    const errors: string[] = [];

    if (!workflowName.trim()) {
      errors.push('Workflow name is required');
    }

    if (nodes.length === 0) {
      errors.push('Workflow must have at least one node');
    }

    const startNodes = nodes.filter(node => node.data.nodeType === 'start');
    if (startNodes.length === 0) {
      errors.push('Workflow must have a start node');
    }

    const endNodes = nodes.filter(node => node.data.nodeType === 'end');
    if (endNodes.length === 0) {
      errors.push('Workflow must have an end node');
    }

    setValidationErrors(errors);
    if (onValidate) {
      onValidate(errors);
    }

    return errors;
  };

  const saveWorkflow = () => {
    const errors = validateWorkflow();
    if (errors.length > 0) {
      return;
    }

    const workflow = {
      name: workflowName,
      description: workflowDescription,
      category: workflowCategory,
      tags: workflowTags,
      version: workflowVersion,
      slaSettings,
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
          data: edge.data,
        })),
      },
    };

    if (onSave) {
      onSave(workflow);
    }
  };

  return (
    <div className='h-screen flex'>
      {/* Left Sidebar - Node Palette */}
      <div className='w-64 border-r bg-gray-50 overflow-y-auto'>
        <div className='p-4'>
          <h3 className='text-sm font-medium text-gray-900 mb-3'>
            Workflow Nodes
          </h3>

          {Object.entries(nodeCategories).map(([category, nodeTypeList]) => (
            <div key={category} className='mb-4'>
              <h4 className='text-xs font-medium text-gray-700 uppercase tracking-wide mb-2'>
                {category}
              </h4>
              <div className='space-y-1'>
                {nodeTypeList.map(nodeType => (
                  <div
                    key={nodeType}
                    className='p-2 bg-white border rounded cursor-move hover:bg-gray-50'
                    draggable
                    onDragStart={event => onDragStart(event, nodeType)}
                  >
                    <div className='text-sm font-medium'>
                      {nodeTypes[nodeType as keyof typeof nodeTypes]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Sidebar - Properties */}
      <div className='w-80 border-l bg-white overflow-y-auto'>
        <Tabs defaultValue='properties' className='h-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='properties'>Properties</TabsTrigger>
            <TabsTrigger value='settings'>Settings</TabsTrigger>
          </TabsList>

          <TabsContent value='properties' className='p-4 space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='text-sm'>Workflow Details</CardTitle>
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
                  <Input
                    id='workflow-category'
                    value={workflowCategory}
                    onChange={e => setWorkflowCategory(e.target.value)}
                    placeholder='Enter category'
                    disabled={readOnly}
                  />
                </div>
              </CardContent>
            </Card>

            {selectedNode ? (
              <Card>
                <CardHeader>
                  <CardTitle className='text-sm'>
                    Node Properties: {selectedNode.data.label}
                  </CardTitle>
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

                  {selectedNode.data.nodeType === 'task' && (
                    <div>
                      <Label htmlFor='task-description'>Description</Label>
                      <Textarea
                        id='task-description'
                        value={selectedNode.data.description || ''}
                        onChange={e =>
                          updateNodeData(selectedNode.id, {
                            description: e.target.value,
                          })
                        }
                        disabled={readOnly}
                      />
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

          <TabsContent value='settings' className='p-4 space-y-4'>
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
