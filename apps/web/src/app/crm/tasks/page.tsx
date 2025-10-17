'use client';

import React from 'react';
import { TaskManagement } from '@/components/modules/crm';

const TasksPage: React.FC = () => {
  const handleCreateTask = () => {
    console.log('Create new task');
    // TODO: Implement task creation
  };

  const handleEditTask = (task: any) => {
    console.log('Edit task:', task);
    // TODO: Implement task editing
  };

  const handleViewTask = (task: any) => {
    console.log('View task:', task);
    // TODO: Implement task view
  };

  return (
    <TaskManagement
      onCreateTask={handleCreateTask}
      onEditTask={handleEditTask}
      onViewTask={handleViewTask}
    />
  );
};

export default TasksPage;