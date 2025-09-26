'use client';

import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  AlertCircle,
  Bell,
  CheckCircle,
  Clock,
  Code,
  GitBranch,
  Mail,
  Play,
  Search,
  Settings,
  Shuffle,
  Square,
  Users,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';

interface NodeType {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  color: string;
}

const nodeTypes: NodeType[] = [
  // Flow Control
  {
    id: 'start',
    label: 'Start',
    description: 'Starting point of the workflow',
    icon: <Play className='h-4 w-4' />,
    category: 'flow',
    color: 'bg-green-100 border-green-300 text-green-800',
  },
  {
    id: 'end',
    label: 'End',
    description: 'End point of the workflow',
    icon: <Square className='h-4 w-4' />,
    category: 'flow',
    color: 'bg-red-100 border-red-300 text-red-800',
  },

  // Tasks
  {
    id: 'task',
    label: 'Task',
    description: 'Generic task or action',
    icon: <CheckCircle className='h-4 w-4' />,
    category: 'tasks',
    color: 'bg-blue-100 border-blue-300 text-blue-800',
  },
  {
    id: 'user_task',
    label: 'User Task',
    description: 'Task requiring user interaction',
    icon: <Users className='h-4 w-4' />,
    category: 'tasks',
    color: 'bg-purple-100 border-purple-300 text-purple-800',
  },
  {
    id: 'service_task',
    label: 'Service Task',
    description: 'Automated service call',
    icon: <Zap className='h-4 w-4' />,
    category: 'tasks',
    color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  },
  {
    id: 'script',
    label: 'Script Task',
    description: 'Execute custom script',
    icon: <Code className='h-4 w-4' />,
    category: 'tasks',
    color: 'bg-gray-100 border-gray-300 text-gray-800',
  },

  // Gateways
  {
    id: 'condition',
    label: 'Condition',
    description: 'Conditional branching',
    icon: <GitBranch className='h-4 w-4' />,
    category: 'gateways',
    color: 'bg-orange-100 border-orange-300 text-orange-800',
  },
  {
    id: 'parallel',
    label: 'Parallel Gateway',
    description: 'Split into parallel paths',
    icon: <Shuffle className='h-4 w-4' />,
    category: 'gateways',
    color: 'bg-indigo-100 border-indigo-300 text-indigo-800',
  },
  {
    id: 'exclusive',
    label: 'Exclusive Gateway',
    description: 'Choose one path',
    icon: <AlertCircle className='h-4 w-4' />,
    category: 'gateways',
    color: 'bg-pink-100 border-pink-300 text-pink-800',
  },

  // Events
  {
    id: 'notification',
    label: 'Notification',
    description: 'Send notification',
    icon: <Bell className='h-4 w-4' />,
    category: 'events',
    color: 'bg-cyan-100 border-cyan-300 text-cyan-800',
  },
  {
    id: 'delay',
    label: 'Timer/Delay',
    description: 'Wait for specified time',
    icon: <Clock className='h-4 w-4' />,
    category: 'events',
    color: 'bg-teal-100 border-teal-300 text-teal-800',
  },
  {
    id: 'escalation',
    label: 'Escalation',
    description: 'Escalate to higher authority',
    icon: <AlertCircle className='h-4 w-4' />,
    category: 'events',
    color: 'bg-red-100 border-red-300 text-red-800',
  },

  // Integration
  {
    id: 'integration',
    label: 'API Integration',
    description: 'Call external API',
    icon: <Activity className='h-4 w-4' />,
    category: 'integration',
    color: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  },
  {
    id: 'email',
    label: 'Email',
    description: 'Send email notification',
    icon: <Mail className='h-4 w-4' />,
    category: 'integration',
    color: 'bg-blue-100 border-blue-300 text-blue-800',
  },

  // Approval
  {
    id: 'approval',
    label: 'Approval',
    description: 'Require approval from user',
    icon: <CheckCircle className='h-4 w-4' />,
    category: 'approval',
    color: 'bg-green-100 border-green-300 text-green-800',
  },

  // Advanced
  {
    id: 'subprocess',
    label: 'Sub Process',
    description: 'Call another workflow',
    icon: <Settings className='h-4 w-4' />,
    category: 'advanced',
    color: 'bg-violet-100 border-violet-300 text-violet-800',
  },
  {
    id: 'loop',
    label: 'Loop',
    description: 'Repeat until condition met',
    icon: <Activity className='h-4 w-4' />,
    category: 'advanced',
    color: 'bg-amber-100 border-amber-300 text-amber-800',
  },
];

const categories = [
  { id: 'all', label: 'All', icon: <Settings className='h-4 w-4' /> },
  { id: 'flow', label: 'Flow Control', icon: <Play className='h-4 w-4' /> },
  { id: 'tasks', label: 'Tasks', icon: <CheckCircle className='h-4 w-4' /> },
  {
    id: 'gateways',
    label: 'Gateways',
    icon: <GitBranch className='h-4 w-4' />,
  },
  { id: 'events', label: 'Events', icon: <Bell className='h-4 w-4' /> },
  {
    id: 'integration',
    label: 'Integration',
    icon: <Activity className='h-4 w-4' />,
  },
  { id: 'approval', label: 'Approval', icon: <Users className='h-4 w-4' /> },
  { id: 'advanced', label: 'Advanced', icon: <Code className='h-4 w-4' /> },
];

export function WorkflowNodePalette() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const filteredNodes = nodeTypes.filter(node => {
    const matchesSearch =
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || node.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className='h-full flex flex-col'>
      <div className='p-4 border-b'>
        <h3 className='font-semibold text-sm mb-3'>Node Palette</h3>

        {/* Search */}
        <div className='relative mb-3'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
          <Input
            placeholder='Search nodes...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='pl-10 text-sm'
          />
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className='grid grid-cols-2 gap-1 h-auto p-1'>
            {categories.slice(0, 8).map(category => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className='text-xs px-2 py-1 data-[state=active]:bg-blue-100'
              >
                {category.icon}
                <span className='ml-1 hidden sm:inline'>{category.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Node List */}
      <div className='flex-1 overflow-y-auto p-2'>
        <div className='space-y-2'>
          {filteredNodes.map(node => (
            <div
              key={node.id}
              className={`p-3 rounded-lg border-2 border-dashed cursor-move hover:shadow-md transition-shadow ${node.color}`}
              draggable
              onDragStart={event => onDragStart(event, node.id)}
            >
              <div className='flex items-center gap-2 mb-1'>
                {node.icon}
                <span className='font-medium text-sm'>{node.label}</span>
              </div>
              <p className='text-xs opacity-75 leading-tight'>
                {node.description}
              </p>
            </div>
          ))}
        </div>

        {filteredNodes.length === 0 && (
          <div className='text-center py-8 text-gray-500'>
            <Search className='h-8 w-8 mx-auto mb-2 opacity-50' />
            <p className='text-sm'>No nodes found</p>
            <p className='text-xs'>
              Try adjusting your search or category filter
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className='p-4 border-t bg-gray-50'>
        <p className='text-xs text-gray-600'>
          💡 Drag and drop nodes onto the canvas to build your workflow
        </p>
      </div>
    </div>
  );
}
