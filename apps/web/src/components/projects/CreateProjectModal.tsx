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
import { CREATE_PROJECT, GET_PROJECT_TEMPLATES } from '@/graphql/projects';
import { useMutation, useQuery } from '@apollo/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateProjectSchema } from '@packages/shared/types/projects';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const formSchema = CreateProjectSchema.extend({
  useTemplate: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function CreateProjectModal({
  open,
  onClose,
  onSuccess,
}: CreateProjectModalProps) {
  const [useTemplate, setUseTemplate] = useState(false);

  const { data: templatesData } = useQuery(GET_PROJECT_TEMPLATES, {
    skip: !useTemplate,
  });

  const [createProject, { loading }] = useMutation(CREATE_PROJECT, {
    onCompleted: () => {
      toast.success('Project created successfully');
      onSuccess();
      reset();
    },
    onError: error => {
      toast.error(`Failed to create project: ${error.message}`);
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
      priority: 'Medium',
      useTemplate: false,
    },
  });

  const watchedTemplateId = watch('templateId');

  const onSubmit = async (data: FormData) => {
    const { useTemplate: _, ...projectData } = data;

    await createProject({
      variables: {
        input: projectData,
      },
    });
  };

  const handleTemplateChange = (templateId: string) => {
    setValue('templateId', templateId);

    // Find the selected template and populate form fields
    const template = templatesData?.projectTemplates?.find(
      t => t.id === templateId
    );
    if (template) {
      setValue('projectName', template.templateName);
      setValue('description', template.description || '');
      setValue('projectType', template.category || 'General');
    }
  };

  const projectTypes = [
    'Software Development',
    'Marketing Campaign',
    'Product Launch',
    'Research & Development',
    'Construction',
    'Event Planning',
    'Training Program',
    'General',
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          {/* Template Selection */}
          <div className='space-y-4'>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='useTemplate'
                checked={useTemplate}
                onCheckedChange={setUseTemplate}
              />
              <Label htmlFor='useTemplate'>Create from template</Label>
            </div>

            {useTemplate && (
              <div className='space-y-2'>
                <Label htmlFor='templateId'>Project Template</Label>
                <Select onValueChange={handleTemplateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a template' />
                  </SelectTrigger>
                  <SelectContent>
                    {templatesData?.projectTemplates?.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div>
                          <div className='font-medium'>
                            {template.templateName}
                          </div>
                          {template.description && (
                            <div className='text-sm text-gray-500'>
                              {template.description}
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='projectCode'>Project Code *</Label>
              <Input
                id='projectCode'
                {...register('projectCode')}
                placeholder='e.g., PROJ-2024-001'
              />
              {errors.projectCode && (
                <p className='text-sm text-red-600'>
                  {errors.projectCode.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='projectName'>Project Name *</Label>
              <Input
                id='projectName'
                {...register('projectName')}
                placeholder='Enter project name'
              />
              {errors.projectName && (
                <p className='text-sm text-red-600'>
                  {errors.projectName.message}
                </p>
              )}
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              {...register('description')}
              placeholder='Describe the project objectives and scope'
              rows={3}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='projectType'>Project Type *</Label>
              <Select onValueChange={value => setValue('projectType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder='Select project type' />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectType && (
                <p className='text-sm text-red-600'>
                  {errors.projectType.message}
                </p>
              )}
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
          </div>

          {/* Dates */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
          </div>

          {/* Actions */}
          <div className='flex justify-end space-x-3 pt-4 border-t'>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
