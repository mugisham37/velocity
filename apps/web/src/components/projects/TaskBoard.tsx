'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { GET_PROJECT_TASKS, UPDATE_PROJECT_TASK } from '@/graphql/projects';
import { useMutation, useQuery } from '@apollo/client';
// TODO: Install @hello-pangea/dnd for drag and drop functionality
// import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';

// Mock components for now
interface MockDragDropContextProps {
  children: React.ReactNode;
  onDragEnd?: (result: any) => void;
}

interface MockDroppableProps {
  children: (provided: any, snapshot: any) => React.ReactNode;
  droppableId: string;
}

interface MockDraggableProps {
  children: (provided: any, snapshot: any) => React.ReactNode;
  draggableId: string;
  index: number;
}

const DragDropContext = ({ children }: MockDragDropContextProps) => <div>{children}</div>;
const Droppable = ({ children }: MockDroppableProps) => {
  const provided = { droppableProps: {}, innerRef: () => {}, placeholder: null };
  const snapshot = { isDraggingOver: false };
  return <div>{children(provided, snapshot)}</div>;
};
const Draggable = ({ children }: MockDraggableProps) => {
  const provided = { draggableProps: {}, dragHandleProps: {}, innerRef: () => {} };
  const snapshot = { isDragging: false };
  return <div>{children(provided, snapshot)}</div>;
};
import type { ProjectTask, TaskStatusType } from '@kiro/shared/types/projects';
import {
  Calendar,
  Clock,
  Filter,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CreateTaskModal } from './CreateTaskModal';
import { TaskDetailModal } from './TaskDetailModal';

interface TaskBoardProps {
  projectId: string;
  className?: string;
}

const taskStatuses: { status: TaskStatusType; label: string; color: string }[] =
  [
    { status: 'Open', label: 'To Do', color: 'bg-gray-100' },
    { status: 'Working', label: 'In Progress', color: 'bg-blue-100' },
    { status: 'Pending Review', label: 'Review', color: 'bg-yellow-100' },
    { status: 'Completed', label: 'Done', color: 'bg-green-100' },
  ];

export function TaskBoard({ projectId, className }: TaskBoardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_PROJECT_TASKS, {
    variables: { projectId },
  });

  const [updateTask] = useMutation(UPDATE_PROJECT_TASK, {
    onCompleted: () => {
      toast.success('Task updated successfully');
      refetch();
    },
    onError: error => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });

  const tasks: ProjectTask[] = data?.projectTasks || [];

  // Filter tasks based on search and assignee
  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAssignee =
      !selectedAssignee || task.assignedToId === selectedAssignee;
    return matchesSearch && matchesAssignee;
  });

  // Group tasks by status
  const tasksByStatus = taskStatuses.reduce(
    (acc, statusConfig) => {
      acc[statusConfig.status] = filteredTasks.filter(
        task => task.status === statusConfig.status
      );
      return acc;
    },
    {} as Record<TaskStatusType, ProjectTask[]>
  );

  // Get unique assignees for filter
  const assignees = Array.from(
    new Set(tasks.map(task => task.assignedToId).filter(Boolean))
  );

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { destination, draggableId } = result;

    if (result.source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId as TaskStatusType;

    try {
      await updateTask({
        variables: {
          id: draggableId,
          input: {
            status: newStatus,
            // Auto-update progress based on status
            percentComplete:
              newStatus === 'Completed'
                ? 100
                : newStatus === 'Working'
                  ? 50
                  : newStatus === 'Pending Review'
                    ? 90
                    : 0,
          },
        },
      });
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      Low: 'bg-green-100 text-green-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      High: 'bg-orange-100 text-orange-800',
      Urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysUntilDue = (dueDate?: string) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-8'>
        <p className='text-red-600'>Error loading tasks: {error.message}</p>
        <Button onClick={() => refetch()} className='mt-4'>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h2 className='text-xl font-semibold text-gray-900'>Task Board</h2>
          <p className='text-gray-600'>Manage and track project tasks</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className='flex items-center gap-2'
        >
          <Plus className='h-4 w-4' />
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className='flex flex-wrap gap-4 mb-6'>
        <div className='flex items-center gap-2'>
          <Search className='h-4 w-4 text-gray-500' />
          <Input
            placeholder='Search tasks...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='w-64'
          />
        </div>

        <div className='flex items-center gap-2'>
          <Filter className='h-4 w-4 text-gray-500' />
          <select
            value={selectedAssignee}
            onChange={e => setSelectedAssignee(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-md text-sm'
          >
            <option value=''>All Assignees</option>
            {assignees.map(assigneeId => (
              <option key={assigneeId} value={assigneeId}>
                User {assigneeId?.slice(-4)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Task Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {taskStatuses.map(statusConfig => (
            <div key={statusConfig.status} className='flex flex-col'>
              <div className={`p-3 rounded-t-lg ${statusConfig.color}`}>
                <h3 className='font-medium text-gray-900 flex items-center justify-between'>
                  {statusConfig.label}
                  <Badge variant='secondary'>
                    {tasksByStatus[statusConfig.status]?.length || 0}
                  </Badge>
                </h3>
              </div>

              <Droppable droppableId={statusConfig.status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-2 border-l border-r border-b rounded-b-lg min-h-[400px] ${
                      snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className='space-y-3'>
                      {tasksByStatus[statusConfig.status]?.map(
                        (task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white rounded-lg border p-3 cursor-pointer hover:shadow-md transition-shadow ${
                                  snapshot.isDragging ? 'shadow-lg' : ''
                                }`}
                                onClick={() => setSelectedTask(task)}
                              >
                                <div className='flex justify-between items-start mb-2'>
                                  <h4 className='font-medium text-sm text-gray-900 line-clamp-2'>
                                    {task.taskName}
                                  </h4>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant='ghost'
                                        size='sm'
                                        onClick={e => e.stopPropagation()}
                                      >
                                        <MoreHorizontal className='h-3 w-3' />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align='end'>
                                      <DropdownMenuItem
                                        onClick={e => {
                                          e.stopPropagation();
                                          setSelectedTask(task);
                                        }}
                                      >
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={e => {
                                          e.stopPropagation();
                                          // TODO: Edit task
                                        }}
                                      >
                                        Edit Task
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                {task.description && (
                                  <p className='text-xs text-gray-600 mb-2 line-clamp-2'>
                                    {task.description}
                                  </p>
                                )}

                                <div className='flex items-center gap-2 mb-2'>
                                  <Badge
                                    className={getPriorityColor(task.priority)}
                                  >
                                    {task.priority}
                                  </Badge>
                                  {task.isMilestone && (
                                    <Badge variant='outline'>
                                      Milestone
                                    </Badge>
                                  )}
                                </div>

                                {/* Progress */}
                                {task.percentComplete > 0 && (
                                  <div className='mb-2'>
                                    <div className='flex justify-between text-xs mb-1'>
                                      <span className='text-gray-600'>
                                        Progress
                                      </span>
                                      <span className='font-medium'>
                                        {Math.round(task.percentComplete)}%
                                      </span>
                                    </div>
                                    <Progress
                                      value={task.percentComplete}
                                      className='h-1'
                                    />
                                  </div>
                                )}

                                {/* Due Date */}
                                {(task.endDate || task.expectedEndDate) && (
                                  <div className='flex items-center gap-1 text-xs text-gray-600 mb-2'>
                                    <Calendar className='h-3 w-3' />
                                    <span>
                                      Due:{' '}
                                      {formatDate(
                                        task.endDate || task.expectedEndDate
                                      )}
                                    </span>
                                    {(() => {
                                      const daysUntilDue = getDaysUntilDue(
                                        task.endDate || task.expectedEndDate
                                      );
                                      if (daysUntilDue !== null) {
                                        if (daysUntilDue < 0) {
                                          return (
                                            <span className='text-red-600 font-medium'>
                                              ({Math.abs(daysUntilDue)}d
                                              overdue)
                                            </span>
                                          );
                                        } else if (daysUntilDue <= 2) {
                                          return (
                                            <span className='text-orange-600 font-medium'>
                                              ({daysUntilDue}d left)
                                            </span>
                                          );
                                        }
                                      }
                                      return null;
                                    })()}
                                  </div>
                                )}

                                {/* Estimated Hours */}
                                {task.estimatedHours && (
                                  <div className='flex items-center gap-1 text-xs text-gray-600 mb-2'>
                                    <Clock className='h-3 w-3' />
                                    <span>
                                      {task.estimatedHours}h estimated
                                    </span>
                                    {task.actualHours > 0 && (
                                      <span className='text-gray-500'>
                                        / {task.actualHours}h actual
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Assignee */}
                                {task.assignedToId && (
                                  <div className='flex items-center gap-2 text-xs'>
                                    <Avatar className='h-5 w-5'>
                                      <AvatarFallback className='text-xs'>
                                        {task.assignedToId
                                          .slice(-2)
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className='text-gray-600'>
                                      Assigned
                                    </span>
                                  </div>
                                )}

                                {/* Task Metadata */}
                                <div className='flex items-center justify-between mt-2 pt-2 border-t'>
                                  <div className='flex items-center gap-2 text-xs text-gray-500'>
                                    <MessageSquare className='h-3 w-3' />
                                    <span>0</span>
                                    <Paperclip className='h-3 w-3' />
                                    <span>0</span>
                                  </div>
                                  <span className='text-xs text-gray-500'>
                                    {task.taskCode}
                                  </span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        )
                      )}
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Create Task Modal */}
      <CreateTaskModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          refetch();
        }}
        projectId={projectId}
      />

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {
            setSelectedTask(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
