'use client';

import React, { useState, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ArrowRightIcon,
  PlayIcon,
  StopIcon,
  CheckCircleIcon,
  XCircleIcon,
  Cog6ToothIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

// Workflow state interface
export interface WorkflowState {
  id: string;
  name: string;
  color: string;
  position: { x: number; y: number };
  isStart?: boolean;
  isEnd?: boolean;
  description?: string;
}

// Workflow transition interface
export interface WorkflowTransition {
  id: string;
  from_state: string;
  to_state: string;
  action: string;
  condition?: string;
  allowed_roles: string[];
  description?: string;
}

// Workflow interface
export interface Workflow {
  name: string;
  doctype: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  workflow_state_field?: string;
  is_active: boolean;
  send_email_alert: boolean;
  description?: string;
}

interface WorkflowDesignerProps {
  doctype: string;
  workflow?: Workflow;
  onSave: (workflow: Workflow) => void;
  onCancel: () => void;
}

// Predefined state colors
const STATE_COLORS = [
  { name: 'Blue', value: '#3B82F6', bg: 'bg-blue-500' },
  { name: 'Green', value: '#10B981', bg: 'bg-green-500' },
  { name: 'Yellow', value: '#F59E0B', bg: 'bg-yellow-500' },
  { name: 'Red', value: '#EF4444', bg: 'bg-red-500' },
  { name: 'Purple', value: '#8B5CF6', bg: 'bg-purple-500' },
  { name: 'Pink', value: '#EC4899', bg: 'bg-pink-500' },
  { name: 'Indigo', value: '#6366F1', bg: 'bg-indigo-500' },
  { name: 'Gray', value: '#6B7280', bg: 'bg-gray-500' },
];

// Common roles
const COMMON_ROLES = [
  'Administrator',
  'System Manager',
  'Sales User',
  'Sales Manager',
  'Purchase User',
  'Purchase Manager',
  'Accounts User',
  'Accounts Manager',
  'Stock User',
  'Stock Manager',
  'HR User',
  'HR Manager',
  'Employee',
  'Customer',
  'Supplier',
];

// Draggable state component
function DraggableState({ 
  state, 
  onEdit, 
  onDelete, 
  onMove 
}: { 
  state: WorkflowState;
  onEdit: (state: WorkflowState) => void;
  onDelete: (stateId: string) => void;
  onMove: (stateId: string, position: { x: number; y: number }) => void;
}) {
  const [{ isDragging }, drag] = useDrag({
    type: 'state',
    item: { id: state.id, type: 'state' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const dragRef = useCallback((node: HTMLDivElement | null) => {
    if (drag) {
      drag(node);
    }
  }, [drag]);

  return (
    <div
      ref={dragRef}
      className={`absolute cursor-move ${isDragging ? 'opacity-50' : ''}`}
      style={{
        left: state.position.x,
        top: state.position.y,
      }}
    >
      <Card className="p-3 min-w-[120px] shadow-lg border-2 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: state.color }}
          />
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(state)}
              className="h-6 w-6 p-0"
            >
              <PencilIcon className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(state.id)}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            >
              <TrashIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="text-sm font-medium text-gray-900 mb-1">
          {state.name}
        </div>
        
        {state.description && (
          <div className="text-xs text-gray-500 truncate">
            {state.description}
          </div>
        )}
        
        <div className="flex items-center space-x-1 mt-2">
          {state.isStart && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
              Start
            </Badge>
          )}
          {state.isEnd && (
            <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
              End
            </Badge>
          )}
        </div>
      </Card>
    </div>
  );
}

// Drop zone for the workflow canvas
function WorkflowCanvas({ 
  states, 
  transitions, 
  onStateMove, 
  onStateEdit, 
  onStateDelete,
  onTransitionAdd 
}: {
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  onStateMove: (stateId: string, position: { x: number; y: number }) => void;
  onStateEdit: (state: WorkflowState) => void;
  onStateDelete: (stateId: string) => void;
  onTransitionAdd: (fromState: string, toState: string) => void;
}) {
  const [{ isOver }, drop] = useDrop({
    accept: 'state',
    drop: (item: { id: string }, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = (monitor.getDropResult() as any)?.getBoundingClientRect?.() || 
                        document.querySelector('.workflow-canvas')?.getBoundingClientRect();
      
      if (offset && canvasRect) {
        const position = {
          x: offset.x - canvasRect.left,
          y: offset.y - canvasRect.top,
        };
        onStateMove(item.id, position);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Draw transitions as SVG arrows
  const renderTransitions = () => {
    return transitions.map((transition) => {
      const fromState = states.find(s => s.id === transition.from_state);
      const toState = states.find(s => s.id === transition.to_state);
      
      if (!fromState || !toState) return null;
      
      const fromX = fromState.position.x + 60; // Center of state card
      const fromY = fromState.position.y + 40;
      const toX = toState.position.x + 60;
      const toY = toState.position.y + 40;
      
      return (
        <g key={transition.id}>
          <defs>
            <marker
              id={`arrowhead-${transition.id}`}
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#6B7280"
              />
            </marker>
          </defs>
          <line
            x1={fromX}
            y1={fromY}
            x2={toX}
            y2={toY}
            stroke="#6B7280"
            strokeWidth="2"
            markerEnd={`url(#arrowhead-${transition.id})`}
          />
          <text
            x={(fromX + toX) / 2}
            y={(fromY + toY) / 2 - 5}
            textAnchor="middle"
            className="text-xs fill-gray-600"
          >
            {transition.action}
          </text>
        </g>
      );
    });
  };

  return (
    <div
      ref={(node) => {
        if (typeof drop === 'function') {
          drop(node);
        }
      }}
      className={`workflow-canvas relative w-full h-96 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 overflow-hidden ${
        isOver ? 'border-blue-400 bg-blue-50' : ''
      }`}
    >
      {/* SVG overlay for transitions */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {renderTransitions()}
      </svg>
      
      {/* States */}
      {states.map((state) => (
        <DraggableState
          key={state.id}
          state={state}
          onEdit={onStateEdit}
          onDelete={onStateDelete}
          onMove={onStateMove}
        />
      ))}
      
      {states.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <DocumentTextIcon className="h-12 w-12 mx-auto mb-2" />
            <p>Drag states here to build your workflow</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function WorkflowDesigner({ doctype, workflow, onSave, onCancel }: WorkflowDesignerProps): React.JSX.Element {
  const [workflowData, setWorkflowData] = useState<Workflow>(
    workflow || {
      name: '',
      doctype,
      states: [],
      transitions: [],
      is_active: true,
      send_email_alert: false,
    }
  );
  
  const [editingState, setEditingState] = useState<WorkflowState | null>(null);
  const [editingTransition, setEditingTransition] = useState<WorkflowTransition | null>(null);
  const [showStateForm, setShowStateForm] = useState(false);
  const [showTransitionForm, setShowTransitionForm] = useState(false);

  // Add new state
  const addState = () => {
    const newState: WorkflowState = {
      id: `state-${Date.now()}`,
      name: 'New State',
      color: STATE_COLORS[0].value,
      position: { x: 100, y: 100 },
    };
    
    setEditingState(newState);
    setShowStateForm(true);
  };

  // Save state
  const saveState = (state: WorkflowState) => {
    setWorkflowData(prev => ({
      ...prev,
      states: editingState?.id && prev.states.find(s => s.id === editingState.id)
        ? prev.states.map(s => s.id === editingState.id ? state : s)
        : [...prev.states, state],
    }));
    
    setEditingState(null);
    setShowStateForm(false);
  };

  // Delete state
  const deleteState = (stateId: string) => {
    if (!confirm('Are you sure you want to delete this state?')) return;
    
    setWorkflowData(prev => ({
      ...prev,
      states: prev.states.filter(s => s.id !== stateId),
      transitions: prev.transitions.filter(t => t.from_state !== stateId && t.to_state !== stateId),
    }));
  };

  // Move state
  const moveState = (stateId: string, position: { x: number; y: number }) => {
    setWorkflowData(prev => ({
      ...prev,
      states: prev.states.map(s => 
        s.id === stateId ? { ...s, position } : s
      ),
    }));
  };

  // Add transition
  const addTransition = () => {
    if (workflowData.states.length < 2) {
      alert('You need at least 2 states to create a transition');
      return;
    }
    
    const newTransition: WorkflowTransition = {
      id: `transition-${Date.now()}`,
      from_state: workflowData.states[0].id,
      to_state: workflowData.states[1].id,
      action: 'Submit',
      allowed_roles: [],
    };
    
    setEditingTransition(newTransition);
    setShowTransitionForm(true);
  };

  // Save transition
  const saveTransition = (transition: WorkflowTransition) => {
    setWorkflowData(prev => ({
      ...prev,
      transitions: editingTransition?.id && prev.transitions.find(t => t.id === editingTransition.id)
        ? prev.transitions.map(t => t.id === editingTransition.id ? transition : t)
        : [...prev.transitions, transition],
    }));
    
    setEditingTransition(null);
    setShowTransitionForm(false);
  };

  // Test workflow
  const testWorkflow = () => {
    // Validate workflow
    const errors = [];
    
    if (!workflowData.name) errors.push('Workflow name is required');
    if (workflowData.states.length === 0) errors.push('At least one state is required');
    if (workflowData.transitions.length === 0) errors.push('At least one transition is required');
    
    const startStates = workflowData.states.filter(s => s.isStart);
    if (startStates.length === 0) errors.push('At least one start state is required');
    if (startStates.length > 1) errors.push('Only one start state is allowed');
    
    if (errors.length > 0) {
      alert('Workflow validation failed:\n' + errors.join('\n'));
      return;
    }
    
    alert('Workflow validation passed! The workflow is ready to be saved.');
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Header */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Workflow Designer</h2>
              <p className="text-sm text-gray-600">
                DocType: <span className="font-medium">{doctype}</span>
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={testWorkflow}>
                <PlayIcon className="h-4 w-4 mr-2" />
                Test Workflow
              </Button>
              <Button onClick={() => onSave(workflowData)}>
                Save Workflow
              </Button>
            </div>
          </div>
        </Card>

        {/* Workflow Settings */}
        <Card className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Workflow Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Workflow Name *
              </label>
              <Input
                value={workflowData.name}
                onChange={(e) => setWorkflowData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Sales Order Approval"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Input
                value={workflowData.description || ''}
                onChange={(e) => setWorkflowData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the workflow"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-6 mt-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={workflowData.is_active}
                onChange={(e) => setWorkflowData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={workflowData.send_email_alert}
                onChange={(e) => setWorkflowData(prev => ({ ...prev, send_email_alert: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Send Email Alerts</span>
            </label>
          </div>
        </Card>

        {/* Toolbar */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button onClick={addState}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add State
              </Button>
              <Button onClick={addTransition} variant="outline">
                <ArrowRightIcon className="h-4 w-4 mr-2" />
                Add Transition
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              States: {workflowData.states.length} | Transitions: {workflowData.transitions.length}
            </div>
          </div>
        </Card>

        {/* Workflow Canvas */}
        <Card className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Workflow Diagram</h3>
          <WorkflowCanvas
            states={workflowData.states}
            transitions={workflowData.transitions}
            onStateMove={moveState}
            onStateEdit={(state) => {
              setEditingState(state);
              setShowStateForm(true);
            }}
            onStateDelete={deleteState}
            onTransitionAdd={(fromState, toState) => {
              // Implementation for adding transition by connecting states
            }}
          />
        </Card>

        {/* States List */}
        <Card className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">States</h3>
          {workflowData.states.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No states defined. Add states to build your workflow.
            </div>
          ) : (
            <div className="space-y-2">
              {workflowData.states.map((state) => (
                <div key={state.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: state.color }}
                    />
                    <div>
                      <div className="font-medium text-gray-900">{state.name}</div>
                      {state.description && (
                        <div className="text-sm text-gray-500">{state.description}</div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      {state.isStart && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Start
                        </Badge>
                      )}
                      {state.isEnd && (
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          End
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingState(state);
                        setShowStateForm(true);
                      }}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteState(state.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Transitions List */}
        <Card className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Transitions</h3>
          {workflowData.transitions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transitions defined. Add transitions to connect your states.
            </div>
          ) : (
            <div className="space-y-2">
              {workflowData.transitions.map((transition) => {
                const fromState = workflowData.states.find(s => s.id === transition.from_state);
                const toState = workflowData.states.find(s => s.id === transition.to_state);
                
                return (
                  <div key={transition.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {fromState?.name} → {toState?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Action: {transition.action}
                          {transition.allowed_roles.length > 0 && (
                            <span className="ml-2">
                              | Roles: {transition.allowed_roles.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTransition(transition);
                          setShowTransitionForm(true);
                        }}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setWorkflowData(prev => ({
                            ...prev,
                            transitions: prev.transitions.filter(t => t.id !== transition.id),
                          }));
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onSave(workflowData)}>
            Save Workflow
          </Button>
        </div>
      </div>

      {/* State Form Modal - This would be implemented as a modal */}
      {showStateForm && editingState && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {workflowData.states.find(s => s.id === editingState.id) ? 'Edit State' : 'Add State'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State Name *
                </label>
                <Input
                  value={editingState.name}
                  onChange={(e) => setEditingState(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="e.g., Draft, Pending Approval, Approved"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Input
                  value={editingState.description || ''}
                  onChange={(e) => setEditingState(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Brief description of this state"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {STATE_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setEditingState(prev => prev ? { ...prev, color: color.value } : null)}
                      className={`w-8 h-8 rounded-full ${color.bg} ${
                        editingState.color === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingState.isStart || false}
                    onChange={(e) => setEditingState(prev => prev ? { ...prev, isStart: e.target.checked } : null)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Start State</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingState.isEnd || false}
                    onChange={(e) => setEditingState(prev => prev ? { ...prev, isEnd: e.target.checked } : null)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">End State</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingState(null);
                  setShowStateForm(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={() => editingState && saveState(editingState)}>
                Save State
              </Button>
            </div>
          </Card>
        </div>
      )}
    </DndProvider>
  );
}