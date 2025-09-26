'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GET_WORKFLOW_TEMPLATES,
  USE_WORKFLOW_TEMPLATE,
} from '@/graphql/workflows';
import { useMutation, useQuery } from '@apollo/client';
import { ArrowLeft, Download, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function WorkflowTemplateGallery() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data, loading } = useQuery(GET_WORKFLOW_TEMPLATES, {
    variables: {
      search: searchQuery || undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      isPublic: true,
      limit: 50,
    },
  });

  const [useTemplate] = useMutation(USE_WORKFLOW_TEMPLATE);

  const templates = data?.workflowTemplates || [];

  const categories = [
    { id: 'all', label: 'All Templates' },
    { id: 'approval', label: 'Approval' },
    { id: 'automation', label: 'Automation' },
    { id: 'hr', label: 'Human Resources' },
    { id: 'finance', label: 'Finance' },
    { id: 'sales', label: 'Sales' },
    { id: 'support', label: 'Support' },
  ];

  const handleUseTemplate = async (template: any) => {
    try {
      const result = await useTemplate({
        variables: {
          templateId: template.id,
          name: `${template.name} - Copy`,
        },
      });

      if (result.data?.useWorkflowTemplate) {
        router.push(
          `/workflows/designer?id=${result.data.useWorkflowTemplate.id}`
        );
      }
    } catch (error) {
      console.error('Error using template:', error);
      alert('Failed to use template');
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-4'>
          <Link href='/workflows'>
            <Button variant='ghost' size='sm'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back to Workflows
            </Button>
          </Link>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>
              Workflow Templates
            </h1>
            <p className='text-gray-600'>
              Browse and use pre-built workflow templates
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className='relative mb-6'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
        <Input
          placeholder='Search templates...'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className='pl-10'
        />
      </div>

      {/* Category Tabs */}
      <Tabs
        value={selectedCategory}
        onValueChange={setSelectedCategory}
        className='mb-6'
      >
        <TabsList className='grid grid-cols-4 lg:grid-cols-7'>
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
      </Tabs>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className='text-center py-12'>
          <Search className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No templates found
          </h3>
          <p className='text-gray-600'>
            Try adjusting your search or category filter
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {templates.map((template: any) => (
            <Card
              key={template.id}
              className='hover:shadow-lg transition-shadow'
            >
              <CardHeader>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <CardTitle className='text-lg'>{template.name}</CardTitle>
                    <div className='flex items-center gap-2 mt-2'>
                      <Badge variant='outline'>{template.category}</Badge>
                      {template.industry && (
                        <Badge variant='secondary'>{template.industry}</Badge>
                      )}
                    </div>
                  </div>
                  <div className='flex items-center gap-1 text-sm text-gray-500'>
                    <Users className='h-4 w-4' />
                    {template.usageCount}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className='text-gray-600 text-sm mb-4 line-clamp-3'>
                  {template.description}
                </p>

                {template.tags && template.tags.length > 0 && (
                  <div className='flex flex-wrap gap-1 mb-4'>
                    {template.tags.slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant='outline' className='text-xs'>
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

                <div className='flex items-center justify-between text-xs text-gray-500 mb-4'>
                  <span>
                    Created {new Date(template.createdAt).toLocaleDateString()}
                  </span>
                  <span>{template.definition?.nodes?.length || 0} steps</span>
                </div>

                <div className='flex gap-2'>
                  <Button
                    onClick={() => handleUseTemplate(template)}
                    className='flex-1'
                    size='sm'
                  >
                    <Download className='h-4 w-4 mr-2' />
                    Use Template
                  </Button>
                  <Button variant='outline' size='sm'>
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
