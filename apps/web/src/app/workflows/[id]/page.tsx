'use client';

import { WorkflowDetailView } from '@/components/workflows/workflow-detail-view';
import { useParams } from 'next/navigation';

export default function WorkflowDetailPage() {
  const params = useParams();
  const workflowId = params['id'] as string;

  return (
    <div className='container mx-auto py-6'>
      <WorkflowDetailView workflowId={workflowId} />
    </div>
  );
}
