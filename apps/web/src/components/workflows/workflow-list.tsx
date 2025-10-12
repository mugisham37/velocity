'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Activity,
  Calendar,
  Copy,
  Edit,
  GitBranch,
  MoreHorizontal,
  Play,
  Settings,
  Trash2,
  Users,
} from 'lucide-react';
import Link from 'next/link';

interface WorkflowListProps {
  workflows: any[];
  onWorkflowClick?: (workflow: any) => void;
}

export function WorkflowList({
  workflows,
  onWorkflowClick,
}: WorkflowListProps) {
  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      approval: 'bg-blue-100 text-blue-800',
      automation: 'bg-purple-100 text-purple-800',
      notification: 'bg-yellow-100 text-yellow-800',
      integration: 'bg-orange-100 text-orange-800',
      hr: 'bg-pink-100 text-pink-800',
      finance: 'bg-green-100 text-green-800',
      sales: 'bg-indigo-100 text-indigo-800',
      support: 'bg-red-100 text-red-800',
    };
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className='space-y-4'>
      {workflows.map(workflow => (
        <div
          key={workflow.id}
          className='border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer'
          onClick={() => onWorkflowClick?.(workflow)}
        >
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-2'>
                <Link
                  href={`/workflows/${workflow.id}`}
                  className='text-lg font-semibold text-gray-900 hover:text-blue-600'
                  onClick={e => e.stopPropagation()}
                >
                  {workflow.name}
                </Link>
                <Badge className={getStatusColor(workflow.isActive)}>
                  {workflow.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Badge
                  variant='outline'
                  className={getCategoryColor(workflow.category)}
                >
                  {workflow.category}
                </Badge>
                {workflow.isTemplate && (
                  <Badge variant='secondary'>
                    <GitBranch className='h-3 w-3 mr-1' />
                    Template
                  </Badge>
                )}
              </div>

              {workflow.description && (
                <p className='text-gray-600 mb-3 line-clamp-2'>
                  {workflow.description}
                </p>
              )}

              <div className='flex items-center gap-6 text-sm text-gray-500'>
                <div className='flex items-center gap-1'>
                  <Calendar className='h-4 w-4' />
                  <span>Created {formatDate(workflow.createdAt)}</span>
                </div>
                <div className='flex items-center gap-1'>
                  <Activity className='h-4 w-4' />
                  <span>Version {workflow.version}</span>
                </div>
                {workflow.definition?.nodes && (
                  <div className='flex items-center gap-1'>
                    <Settings className='h-4 w-4' />
                    <span>{workflow.definition.nodes.length} steps</span>
                  </div>
                )}
              </div>

              {workflow.tags && workflow.tags.length > 0 && (
                <div className='flex flex-wrap gap-1 mt-3'>
                  {workflow.tags.map((tag: string) => (
                    <Badge key={tag} variant='outline' className='text-xs'>
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className='flex items-center gap-2'>
              <Link href={`/workflows/designer?id=${workflow.id}`}>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={e => e.stopPropagation()}
                >
                  <Edit className='h-4 w-4 mr-1' />
                  Edit
                </Button>
              </Link>

              <Button
                variant='outline'
                size='sm'
                onClick={e => e.stopPropagation()}
              >
                <Play className='h-4 w-4 mr-1' />
                Run
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                  <Button variant='ghost' size='sm'>
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem>
                    <Copy className='h-4 w-4 mr-2' />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <GitBranch className='h-4 w-4 mr-2' />
                    Create Version
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Users className='h-4 w-4 mr-2' />
                    Manage Access
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className='text-red-600'>
                    <Trash2 className='h-4 w-4 mr-2' />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
