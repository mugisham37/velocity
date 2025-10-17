'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectList, ProjectForm } from '@/components/modules/crm';
import { Project, ProjectFormData } from '@/types/crm';

const ProjectsPage: React.FC = () => {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateNew = () => {
    setSelectedProject(null);
    setShowForm(true);
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setShowForm(true);
  };

  const handleView = (project: Project) => {
    router.push(`/crm/projects/${project.name}`);
  };

  const handleSubmit = async (data: ProjectFormData) => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to save project
      console.log('Saving project:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowForm(false);
      setSelectedProject(null);
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedProject(null);
  };

  if (showForm) {
    return (
      <ProjectForm
        project={selectedProject || undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    );
  }

  return (
    <ProjectList
      onCreateNew={handleCreateNew}
      onView={handleView}
      onEdit={handleEdit}
    />
  );
};

export default ProjectsPage;