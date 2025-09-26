'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, User, X } from 'lucide-react';

interface WorkflowApprovalListProps {
  approvals: any[];
}

export function WorkflowApprovalList({ approvals }: WorkflowApprovalListProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      delegated: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue = (dueDate: string) => {
    return dueDate && new Date(dueDate) < new Date();
  };

  return (
    <div className='space-y-4'>
      {approvals.map(approval => (
        <div
          key={approval.id}
          className='border rounded-lg p-4 hover:shadow-md transition-shadow'
        >
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-2'>
                <h4 className='font-medium'>Approval Request</h4>
                <Badge className={getStatusColor(approval.status)}>
                  {approval.status}
                </Badge>
                {approval.dueDate && isOverdue(approval.dueDate) && (
                  <Badge className='bg-red-100 text-red-800'>Overdue</Badge>
                )}
              </div>

              <div className='flex items-center gap-6 text-sm text-gray-500 mb-3'>
                <div className='flex items-center gap-1'>
                  <Clock className='h-4 w-4' />
                  <span>Requested {formatDate(approval.requestedAt)}</span>
                </div>
                {approval.dueDate && (
                  <div className='flex items-center gap-1'>
                    <Clock className='h-4 w-4' />
                    <span>Due {formatDate(approval.dueDate)}</span>
                  </div>
                )}
                <div className='flex items-center gap-1'>
                  <User className='h-4 w-4' />
                  <span>Approver: {approval.approverId}</span>
                </div>
              </div>

              {approval.comments && (
                <div className='bg-gray-50 rounded p-2 text-sm mb-3'>
                  <strong>Comments:</strong> {approval.comments}
                </div>
              )}

              {approval.reason && (
                <div className='bg-gray-50 rounded p-2 text-sm'>
                  <strong>Reason:</strong> {approval.reason}
                </div>
              )}
            </div>

            {approval.status === 'pending' && (
              <div className='flex items-center gap-2'>
                <Button size='sm' className='bg-green-600 hover:bg-green-700'>
                  <CheckCircle className='h-4 w-4 mr-1' />
                  Approve
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='text-red-600 hover:text-red-700'
                >
                  <X className='h-4 w-4 mr-1' />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
