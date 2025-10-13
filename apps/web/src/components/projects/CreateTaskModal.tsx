'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CREATE_PROJECT_TASK, GET_PROJECT_TASKS } from '@/graphql/projects';
import { useMutation, useQuery } from '@apollo/client';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateProjectTaskSchema,
  type ProjectTask,
} from '@/shared/types/projects';
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  parentTaskId?: string;
}

const formSchema = CreateProjectTaskSchema;
type FormData = z.infer<typeof formSchema>;

export function CreateTaskModal({
  open,
  onClose,
  onSuccess,
  projectId,
  parentTaskId,
}: CreateTaskModalProps) {
  const { data: tasksData } = useQuery(GET_PROJECT_TASKS, {
    variables: { projectId },
    skip: !open,
  });

  const [createTask, { loading }] = useMutation(CREATE_PROJECT_TASK, {
    onCompleted: () => {
      toast.success('Task created successfully');
      onSuccess();
      reset();
    },
    onError: error => {
      toast.error(`Failed to create task: ${error.message}`);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId,
      parentTaskId,
      priority: 'Medium',
      taskType: 'Task',
      isMilestone: false,
    },
  });

  const watchedTaskType = watch('taskType');
  const watchedIsMilestone = watch('isMilestone');

  const onSubmit = async (data: FormData) => {
    await createTask({
      variables: {
        input: data,
      },
    });
  };

  // Generate task code based on existing tasks
  const generateTaskCode = () => {
    const tasks = tasksData?.projectTasks || [];
    const taskCount = tasks.length;
    const newCode = `TASK-${String(taskCount + 1).padStart(4, '0')}`;
    setValue('taskCode', newCode);
  };

  React.useEffect(() => {
    if (open && tasksData) {
      generateTaskCode();
    }
  }, [open, tasksData]);

  // Available parent tasks (exclude milestones and summary tasks)
  const availableParentTasks =
    tasksData?.projectTasks?.filter(
      (task: ProjectTask) =>
        task.taskType !== 'Milestone' && task.id !== parentTaskId
    ) || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {parentTaskId ? 'Create Subtask' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          {/* Basic Information */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='taskCode'>Task Code *</Label>
              <div className='flex gap-2'>
                <Input
                  id='taskCode'
                  {...register('taskCode')}
                  placeholder='e.g., TASK-0001'
                />
                <Button
                  type='button'
                  variant='outline'
                  onClick={generateTaskCode}
                  size='sm'
                >
                  Generate
                </Button>
              </div>
              {errors.taskCode && (
                <p className='text-sm text-red-600'>
                  {errors.taskCode.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='taskName'>Task Name *</Label>
              <Input
                id='taskName'
                {...register('taskName')}
                placeholder='Enter task name'
              />
              {errors.taskName && (
                <p className='text-sm text-red-600'>
                  {errors.taskName.message}
                </p>
              )}
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              {...register('description')}
              placeholder='Describe the task requirements and acceptance criteria'
              rows={3}
            />
          </div>

          {/* Task Configuration */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='taskType'>Task Type</Label>
              <Select
                defaultValue='Task'
                onValueChange={value => setValue('taskType', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Task'>Task</SelectItem>
                  <SelectItem value='Summary'>Summary Task</SelectItem>
                  <SelectItem value='Milestone'>Milestone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='priority'>Priority</Label>
              <Select
                defaultValue='Medium'
                onValueChange={value => setValue('priority', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Low'>Low</SelectItem>
                  <SelectItem value='Medium'>Medium</SelectItem>
                  <SelectItem value='High'>High</SelectItem>
                  <SelectItem value='Urgent'>Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='assignedToId'>Assignee</Label>
              <Select onValueChange={value => setValue('assignedToId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder='Select assignee' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='user-1'>John Doe</SelectItem>
                  <SelectItem value='user-2'>Jane Smith</SelectItem>
                  <SelectItem value='user-3'>Bob Johnson</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Parent Task Selection */}
          {!parentTaskId && availableParentTasks.length > 0 && (
            <div className='space-y-2'>
              <Label htmlFor='parentTaskId'>Parent Task (Optional)</Label>
              <Select onValueChange={value => setValue('parentTaskId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder='Select parent task' />
                </SelectTrigger>
                <SelectContent>
                  {availableParentTasks.map((task: ProjectTask) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.taskCode} - {task.taskName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Dates and Duration */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='expectedStartDate'>Expected Start Date</Label>
              <Input
                id='expectedStartDate'
                type='date'
                {...register('expectedStartDate')}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='expectedEndDate'>Expected End Date</Label>
              <Input
                id='expectedEndDate'
                type='date'
                {...register('expectedEndDate')}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='duration'>Duration (Days)</Label>
              <Input
                id='duration'
                type='number'
                min='1'
                {...register('duration', { valueAsNumber: true })}
                placeholder='e.g., 5'
              />
            </div>
          </div>

          {/* Effort Estimation */}
          {watchedTaskType !== 'Milestone' && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='estimatedHours'>Estimated Hours</Label>
                <Input
                  id='estimatedHours'
                  type='number'
                  min='0'
                  step='0.5'
                  {...register('estimatedHours', { valueAsNumber: true })}
                  placeholder='e.g., 8'
                />
              </div>
            </div>
          )}

          {/* Task Options */}
          <div className='space-y-4'>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='isMilestone'
                checked={watchedIsMilestone}
                onCheckedChange={checked => {
                  setValue('isMilestone', !!checked);
                  if (checked) {
                    setValue('taskType', 'Milestone');
                    setValue('estimatedHours', undefined);
                  }
                }}
              />
              <Label htmlFor='isMilestone'>Mark as milestone</Label>
            </div>
          </div>

          {/* Custom Fields */}
          <div className='space-y-2'>
            <Label>Custom Fields</Label>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='customField1'>Department</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder='Select department' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='development'>Development</SelectItem>
                    <SelectItem value='design'>Design</SelectItem>
                    <SelectItem value='qa'>Quality Assurance</SelectItem>
                    <SelectItem value='marketing'>Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='customField2'>Complexity</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder='Select complexity' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='simple'>Simple</SelectItem>
                    <SelectItem value='medium'>Medium</SelectItem>
                    <SelectItem value='complex'>Complex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className='flex justify-end space-x-3 pt-4 border-t'>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
