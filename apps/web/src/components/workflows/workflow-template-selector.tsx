'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GET_POPULAR_WORKFLOW_TEMPLATES,
  GET_WORKFLOW_TEMPLATES,
} from '@/graphql/workflows';
import { useQuery } from '@apollo/client';
import { Search, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';

interface WorkflowTemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (template: any) => void;
}

export function WorkflowTemplateSelector({
  open,
  onClose,
  onSelectTemplate,
}: WorkflowTemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: templatesData, loading } = useQuery(GET_WORKFLOW_TEMPLATES, {
    variables: {
      search: searchQuery || undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      isPublic: true,
      limit: 50,
    },
  });

  const { data: popularData } = useQuery(GET_POPULAR_WORKFLOW_TEMPLATES, {
    variables: { limit: 10 },
  });

  const templates = templatesData?.workflowTemplates || [];
  const popularTemplates = popularData?.popularWorkflowTemplates || [];

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'approval', label: 'Approval' },
    { id: 'automation', label: 'Automation' },
    { id: 'hr', label: 'Human Resources' },
    { id: 'finance', label: 'Finance' },
    { id: 'sales', label: 'Sales' },
    { id: 'support', label: 'Support' },
    { id: 'integration', label: 'Integration' },
  ];

  const handleSelectTemplate = (template: any) => {
    onSelectTemplate(template);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[80vh] overflow-hidden'>
        <DialogHeader>
          <DialogTitle>Choose Workflow Template</DialogTitle>
          <DialogDescription>
            Start with a pre-built template to speed up your workflow creation
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col h-[60vh]'>
          {/* Search */}
          <div className='relative mb-4'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
            <Input
              placeholder='Search templates...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-10'
            />
          </div>

          <Tabs
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            className='flex-1'
          >
            <TabsList className='grid grid-cols-4 lg:grid-cols-8 mb-4'>
              {categories.map(category => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className='text-xs'
                >
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className='flex-1 overflow-y-auto'>
              {/* Popular Templates */}
              {selectedCategory === 'all' && !searchQuery && (
                <div className='mb-6'>
                  <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
                    <TrendingUp className='h-5 w-5' />
                    Popular Templates
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {popularTemplates.slice(0, 4).map((template: any) => (
                      <div
                        key={template.id}
                        className='border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer'
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <div className='flex items-start justify-between mb-2'>
                          <h4 className='font-medium'>{template.name}</h4>
                          <div className='flex items-center gap-1 text-xs text-gray-500'>
                            <Users className='h-3 w-3' />
                            {template.usageCount}
                          </div>
                        </div>
                        <p className='text-sm text-gray-600 mb-3 line-clamp-2'>
                          {template.description}
                        </p>
                        <div className='flex items-center justify-between'>
                          <Badge variant='outline'>{template.category}</Badge>
                          {template.industry && (
                            <Badge variant='secondary'>
                              {template.industry}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Templates */}
              <div>
                <h3 className='text-lg font-semibold mb-3'>
                  {searchQuery ? 'Search Results' : 'All Templates'}
                </h3>
                {loading ? (
                  <div className='flex items-center justify-center py-8'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                  </div>
                ) : templates.length === 0 ? (
                  <div className='text-center py-8'>
                    <Search className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>
                      No templates found
                    </h3>
                    <p className='text-gray-600'>
                      Try adjusting your search or category filter
                    </p>
                  </div>
                ) : (
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {templates.map((template: any) => (
                      <div
                        key={template.id}
                        className='border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer'
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <div className='flex items-start justify-between mb-2'>
                          <h4 className='font-medium text-sm'>
                            {template.name}
                          </h4>
                          <div className='flex items-center gap-1 text-xs text-gray-500'>
                            <Users className='h-3 w-3' />
                            {template.usageCount}
                          </div>
                        </div>
                        <p className='text-xs text-gray-600 mb-3 line-clamp-2'>
                          {template.description}
                        </p>
                        <div className='flex flex-wrap gap-1 mb-3'>
                          <Badge variant='outline' className='text-xs'>
                            {template.category}
                          </Badge>
                          {template.industry && (
                            <Badge variant='secondary' className='text-xs'>
                              {template.industry}
                            </Badge>
                          )}
                        </div>
                        {template.tags && template.tags.length > 0 && (
                          <div className='flex flex-wrap gap-1'>
                            {template.tags.slice(0, 3).map((tag: string) => (
                              <Badge
                                key={tag}
                                variant='outline'
                                className='text-xs'
                              >
                                {tag}
                              </Badge>
                            ))}
                            {template.tags.length > 3 && (
                              <Badge variant='outline' className='text-xs'>
                                +{template.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Tabs>
        </div>

        <div className='flex justify-end gap-2 pt-4 border-t'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button variant='outline'>Create Blank Workflow</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
6
