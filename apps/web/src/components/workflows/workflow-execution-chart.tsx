'use client';

interface WorkflowExecutionChartProps {
  workflowId?: string;
}

export function WorkflowExecutionChart({
  workflowId,
}: WorkflowExecutionChartProps) {
  // Placeholder for chart implementation
  // In a real implementation, this would use a charting library like Chart.js or Recharts

  return (
    <div className='h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg'>
      <div className='text-center'>
        <div className='text-gray-400 mb-2'>📊</div>
        <p className='text-gray-600 text-sm'>Execution trends chart</p>
        <p className='text-gray-500 text-xs'>Chart implementation pending</p>
      </div>
    </div>
  );
}
