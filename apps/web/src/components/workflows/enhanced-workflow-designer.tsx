'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  GET_WORKFLOW,
  UPDATE_WORKFLOW,
  VALIDATE_WORKFLOW_DEFINITION,
} from '@/graphql/workflows';
import { useMutation, useQuery } from '@apollo/client';
import { ArrowLeft, Check, Eye, GitBranch, Save, TestTube } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { WorkflowNodePalette } from './workflow-node-palette';
import { WorkflowNodeProperties } from './workflow-node-properties';
import { WorkflowTemplateSelector } from './workflow-template-selector';
import { WorkflowTestRunner } from './workflow-test-runner';

interface EnhancedWorkflowDesignerProps {
  className?: string;
}

export function EnhancedWorkflowDesigner({
  className,
}: EnhancedWorkflowDesignerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('id');

  // State
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [workflowCategory, setWorkflowCategory] = useState('');
  const [workflowTags, setWorkflowTags] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showTestRunner, setShowTestRunner] = useState(false);
  const [activeTab, setActiveTab] = useState('design');
  const [isDirty, setIsDirty] = useState(false);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  // Load existing workflow if editing
  const { data: workflowData, loading: workflowLoading } = useQuery(
    GET_WORKFLOW,
    {
      variables: { id: workflowId },
      skip: !workflowId,
    }
  );

  const [updateWorkflow, { loading: saving }] = useMutation(UPDATE_WORKFLOW);
  const [validateDefinition] = useMutation(VALIDATE_WORKFLOW_DEFINITION);

  // Initialize nodes and edges
  const initialNodes: Node[] = workflowData?.workflow?.definition?.nodes?.map(
    (node: any) => ({
      id: node.id,
      type: getReactFlowNodeType(node.type),
      position: node.position,
      data: { ...node.data, nodeType: node.type, label: node.label },
    })
  ) || [
    {
      id: 'start',
      type: 'input',
      data: { label: 'Start', nodeType: 'start' },
      position: { x: 250, y: 50 },
    },
  ];

  const initialEdges: Edge[] = workflowData?.workflow?.definition?.edges || [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Load workflow data when available
  useEffect(() => {
    if (workflowData?.workflow) {
      const workflow = workflowData.workflow;
      setWorkflowName(workflow.name);
      setWorkflowDescription(workflow.description || '');
      setWorkflowCategory(workflow.category);
      setWorkflowTags(workflow.tags || []);

      if (workflow.definition?.nodes) {
        const flowNodes = workflow.definition.nodes.map((node: any) => ({
          id: node.id,
          type: getReactFlowNodeType(node.type),
          position: node.position,
          data: { ...node.data, nodeType: node.type, label: node.label },
        }));
        setNodes(flowNodes);
      }

      if (workflow.definition?.edges) {
        setEdges(workflow.definition.edges);
      }
    }
  }, [workflowData, setNodes, setEdges]);

  // Helper function to map workflow node types to ReactFlow types
  function getReactFlowNodeType(nodeType: string): string {
    const typeMap: Record<string, string> = {
      start: 'input',
      end: 'output',
      task: 'default',
      approval: 'default',
      condition: 'default',
      parallel: 'default',
      notification: 'default',
      integration: 'default',
      delay: 'default',
    };
    return typeMap[nodeType] || 'default';
  }

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges(eds => addEdge(params, eds));
      setIsDirty(true);
    },
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
        type: getReactFlowNodeType(nodeType),
        position,
        data: {
          label: getNodeLabel(nodeType),
          nodeType,
        },
      };

      setNodes(nds => nds.concat(newNode));
      setIsDirty(true);
    },
    [reactFlowInstance, setNodes]
  );

  const getNodeLabel = (nodeType: string): string => {
    const labels: Record<string, string> = {
      start: 'Start',
      end: 'End',
      task: 'Task',
      approval: 'Approval',
      condition: 'Condition',
      parallel: 'Parallel Gateway',
      notification: 'Notification',
      integration: 'Integration',
      delay: 'Delay',
    };
    return labels[nodeType] || nodeType;
  };

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes(nds =>
      nds.map(node =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
    setIsDirty(true);
  };

  const deleteSelectedElement = () => {
    if (selectedNode) {
      setNodes(nds => nds.filter(node => node.id !== selectedNode.id));
      setEdges(eds =>
        eds.filter(
          edge =>
            edge.source !== selectedNode.id && edge.target !== selectedNode.id
        )
      );
      setSelectedNode(null);
      setIsDirty(true);
    } else if (selectedEdge) {
      setEdges(eds => eds.filter(edge => edge.id !== selectedEdge.id));
      setSelectedEdge(null);
      setIsDirty(true);
    }
  };

  const validateWorkflow = async () => {
    const definition = {
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
      settings: {},
    };

    try {
      const result = await validateDefinition({
        variables: { definition },
      });

      const errors = result.data?.validateWorkflowDefinition
        ? JSON.parse(result.data.validateWorkflowDefinition).errors || []
        : [];

      setValidationErrors(errors);
      return errors.length === 0;
    } catch (error) {
      console.error('Validation error:', error);
      setValidationErrors(['Failed to validate workflow']);
      return false;
    }
  };

  const saveWorkflow = async () => {
    if (!workflowId) return;

    const isValid = await validateWorkflow();
    if (!isValid) {
      alert('Please fix validation errors before saving');
      return;
    }

    try {
      const definition = {
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
        settings: {},
      };

      await updateWorkflow({
        variables: {
          id: workflowId,
          input: {
            name: workflowName,
            description: workflowDescription,
            category: workflowCategory,
            tags: workflowTags,
            definition,
          },
        },
      });

      setIsDirty(false);
      alert('Workflow saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save workflow');
    }
  };

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        deleteSelectedElement();
      }
    },
    [selectedNode, selectedEdge]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (workflowLoading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col ${className}`}>
      {/* Header */}
      <div className='border-b bg-white px-4 py-3 flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Link href='/workflows'>
            <Button variant='ghost' size='sm'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back to Workflows
            </Button>
          </Link>
          <div>
            <h1 className='text-lg font-semibold'>
              {workflowName || 'Untitled Workflow'}
              {isDirty && <span className='text-orange-500 ml-2'>*</span>}
            </h1>
            <p className='text-sm text-gray-500'>
              {workflowDescription || 'No description'}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowTemplateSelector(true)}
          >
            <GitBranch className='h-4 w-4 mr-2' />
            Templates
          </Button>
          <Button variant='outline' size='sm' onClick={validateWorkflow}>
            <Check className='h-4 w-4 mr-2' />
            Validate
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowTestRunner(true)}
          >
            <TestTube className='h-4 w-4 mr-2' />
            Test
          </Button>
          <Button variant='outline' size='sm'>
            <Eye className='h-4 w-4 mr-2' />
            Preview
          </Button>
          <Button onClick={saveWorkflow} disabled={saving || !isDirty}>
            <Save className='h-4 w-4 mr-2' />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className='flex-1 flex'>
        {/* Left Sidebar - Node Palette */}
        <div className='w-64 border-r bg-gray-50 overflow-y-auto'>
          <WorkflowNodePalette />
        </div>

        {/* Main Canvas */}
        <div className='flex-1 relative' ref={reactFlowWrapper}>
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
            onEdgeClick={onEdgeClick}
            onPaneClick={() => {
              setSelectedNode(null);
              setSelectedEdge(null);
            }}
            fitView
            attributionPosition='bottom-left'
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls />
            <MiniMap />

            {/* Validation Errors Panel */}
            {validationErrors.length > 0 && (
              <Panel position='top-center'>
                <Card className='bg-red-50 border-red-200'>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-sm text-red-800'>
                      Validation Errors
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='pt-0'>
                    <ul className='text-xs text-red-700 space-y-1'>
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Right Sidebar - Properties */}
        <div className='w-80 border-l bg-white overflow-y-auto'>
          <WorkflowNodeProperties
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            onUpdateNode={updateNodeData}
            workflowName={workflowName}
            workflowDescription={workflowDescription}
            workflowCategory={workflowCategory}
            workflowTags={workflowTags}
            onUpdateWorkflow={updates => {
              if (updates.name !== undefined) setWorkflowName(updates.name);
              if (updates.description !== undefined)
                setWorkflowDescription(updates.description);
              if (updates.category !== undefined)
                setWorkflowCategory(updates.category);
              if (updates.tags !== undefined) setWorkflowTags(updates.tags);
              setIsDirty(true);
            }}
          />
        </div>
      </div>

      {/* Template Selector Modal */}
      <WorkflowTemplateSelector
        open={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={template => {
          // Apply template to current workflow
          if (template.definition?.nodes) {
            setNodes(
              template.definition.nodes.map((node: any) => ({
                id: node.id,
                type: getReactFlowNodeType(node.type),
                position: node.position,
                data: { ...node.data, nodeType: node.type, label: node.label },
              }))
            );
          }
          if (template.definition?.edges) {
            setEdges(template.definition.edges);
          }
          setIsDirty(true);
          setShowTemplateSelector(false);
        }}
      />

      {/* Test Runner Modal */}
      <WorkflowTestRunner
        open={showTestRunner}
        onClose={() => setShowTestRunner(false)}
        workflow={{
          id: workflowId,
          name: workflowName,
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
            settings: {},
          },
        }}
      />
    </div>
  );
}
