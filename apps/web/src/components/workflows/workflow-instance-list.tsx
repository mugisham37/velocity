'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Play, Square, User } from 'lucide-react';

interface WorkflowInstanceListProps {
  instances: any[];
  onRefresh: () => void;
}

export function WorkflowInstanceList({
  instances,
  onRefresh,
}: WorkflowInstanceListProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      running: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateProgress = (instance: any) => {
    if (!instance.steps || instance.steps.length === 0) return 0;
    const completedSteps = instance.steps.filter(
      (step: any) => step.status === 'completed'
    ).length;
    return (completedSteps / instance.steps.length) * 100;
  };

  return (
    <div className='space-y-4'>
      {instances.map(instance => (
        <div
          key={instance.id}
          className='border rounded-lg p-4 hover:shadow-md transition-shadow'
        >
          <div className='flex items-start justify-between mb-3'>
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-2'>
                <h4 className='font-medium'>
                  {instance.name || instance.workflow?.name}
                </h4>
                <Badge className={getStatusColor(instance.status)}>
                  {instance.status}
                </Badge>
                <Badge variant='outline'>{instance.priority}</Badge>
              </div>

              <div className='flex items-center gap-6 text-sm text-gray-500 mb-3'>
                <div className='flex items-center gap-1'>
                  <Calendar className='h-4 w-4' />
                  <span>Started {formatDate(instance.createdAt)}</span>
                </div>
                {instance.dueDate && (
                  <div className='flex items-center gap-1'>
                    <Clock className='h-4 w-4' />
                    <span>Due {formatDate(instance.dueDate)}</span>
                  </div>
                )}
                <div className='flex items-center gap-1'>
                  <User className='h-4 w-4' />
                  <span>By {instance.initiatedBy}</span>
                </div>
              </div>

              {instance.steps && instance.steps.length > 0 && (
                <div className='space-y-2'>
                  <div className='flex items-center justify-between text-sm'>
                    <span>Progress</span>
                    <span>{Math.round(calculateProgress(instance))}%</span>
                  </div>
                  <Progress value={calculateProgress(instance)} />
                  <div className='text-xs text-gray-500'>
                    {
                      instance.steps.filter(
                        (s: any) => s.status === 'completed'
                      ).length
                    }{' '}
                    of {instance.steps.length} steps completed
                  </div>
                </div>
              )}
            </div>

            <div className='flex items-center gap-2'>
              {instance.status === 'running' && (
                <Button variant='outline' size='sm'>
                  <Square className='h-4 w-4 mr-1' />
                  Pause
                </Button>
              )}
              {instance.status === 'pending' && (
                <Button variant='outline' size='sm'>
                  <Play className='h-4 w-4 mr-1' />
                  Start
                </Button>
              )}
              <Button variant='outline' size='sm'>
                View Details
              </Button>
            </div>
          </div>

          {instance.slaBreached && (
            <div className='bg-red-50 border border-red-200 rounded p-2 text-sm text-red-800'>
              ⚠️ SLA breached on {formatDate(instance.slaBreachedAt)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
