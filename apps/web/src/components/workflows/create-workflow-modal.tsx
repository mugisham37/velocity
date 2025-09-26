'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { CREATE_WORKFLOW, GET_WORKFLOW_CATEGORIES } from '@/graphql/workflows';
import { useMutation, useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface CreateWorkflowModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateWorkflowModal({
  open,
  onClose,
  onSuccess,
}: CreateWorkflowModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    tags: '',
  });

  const { data: categoriesData } = useQuery(GET_WORKFLOW_CATEGORIES);
  const [createWorkflow, { loading }] = useMutation(CREATE_WORKFLOW);

  const categories = categoriesData?.workflowCategories || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category) {
      return;
    }

    try {
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const result = await createWorkflow({
        variables: {
          input: {
            name: formData.name,
            description: formData.description || undefined,
            category: formData.category,
            tags: tags.length > 0 ? tags : undefined,
            definition: {
              nodes: [
                {
                  id: 'start',
                  type: 'start',
                  label: 'Start',
                  data: {},
                  position: { x: 250, y: 50 },
                },
                {
                  id: 'end',
                  type: 'end',
                  label: 'End',
                  data: {},
                  position: { x: 250, y: 200 },
                },
              ],
              edges: [],
              settings: {},
            },
          },
        },
      });

      if (result.data?.createWorkflow) {
        onSuccess?.();
        // Navigate to the workflow designer with the new workflow
        router.push(`/workflows/designer?id=${result.data.createWorkflow.id}`);
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      tags: '',
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Create New Workflow</DialogTitle>
          <DialogDescription>
            Create a new workflow to automate your business processes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Workflow Name *</Label>
            <Input
              id='name'
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder='Enter workflow name'
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder='Describe what this workflow does'
              rows={3}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='category'>Category *</Label>
            <Select
              value={formData.category}
              onValueChange={value =>
                setFormData({ ...formData, category: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder='Select a category' />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category: string) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
                <SelectItem value='approval'>Approval</SelectItem>
                <SelectItem value='automation'>Automation</SelectItem>
                <SelectItem value='notification'>Notification</SelectItem>
                <SelectItem value='integration'>Integration</SelectItem>
                <SelectItem value='hr'>Human Resources</SelectItem>
                <SelectItem value='finance'>Finance</SelectItem>
                <SelectItem value='sales'>Sales</SelectItem>
                <SelectItem value='support'>Support</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='tags'>Tags</Label>
            <Input
              id='tags'
              value={formData.tags}
              onChange={e => setFormData({ ...formData, tags: e.target.value })}
              placeholder='Enter tags separated by commas'
            />
            <p className='text-xs text-gray-500'>
              Separate multiple tags with commas
            </p>
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={handleClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Creating...' : 'Create & Design'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
