'use client';

import { EnhancedWorkflowDesigner } from '@/components/workflows/enhanced-workflow-designer';
import { Suspense } from 'react';

function WorkflowDesignerContent() {
  return (
    <div className='h-screen'>
      <EnhancedWorkflowDesigner />
    </div>
  );
}

export default function WorkflowDesignerPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkflowDesignerContent />
    </Suspense>
  );
}
