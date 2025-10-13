'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import type { Project } from '@/shared/types/projects';
import {
  Calendar,
  Clock,
  Edit,
  Eye,
  MoreHorizontal,
  Trash2,
  Users,
} from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

export function ProjectList({
  projects,
  onProjectClick,
  getStatusColor,
  getPriorityColor,
}: ProjectListProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className='space-y-4'>
      {projects.map(project => {
        const daysRemaining = getDaysRemaining(
          project.endDate || project.expectedEndDate
        );
        const isOverdue = daysRemaining !== null && daysRemaining < 0;
        const isDueSoon =
          daysRemaining !== null && daysRemaining <= 7 && daysRemaining >= 0;

        return (
          <div
            key={project.id}
            className='border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer'
            onClick={() => onProjectClick(project)}
          >
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='flex items-center gap-3 mb-2'>
                  <h3 className='font-semibold text-lg text-gray-900'>
                    {project.projectName}
                  </h3>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                  <Badge className={getPriorityColor(project.priority)}>
                    {project.priority}
                  </Badge>
                </div>

                <p className='text-gray-600 mb-3 line-clamp-2'>
                  {project.description || 'No description provided'}
                </p>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-3'>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Calendar className='h-4 w-4' />
                    <span>
                      {formatDate(
                        project.startDate || project.expectedStartDate
                      )}{' '}
                      - {formatDate(project.endDate || project.expectedEndDate)}
                    </span>
                  </div>

                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Users className='h-4 w-4' />
                    <span>Project Code: {project.projectCode}</span>
                  </div>

                  {daysRemaining !== null && (
                    <div className='flex items-center gap-2 text-sm'>
                      <Clock className='h-4 w-4' />
                      <span
                        className={
                          isOverdue
                            ? 'text-red-600 font-medium'
                            : isDueSoon
                              ? 'text-orange-600 font-medium'
                              : 'text-gray-600'
                        }
                      >
                        {isOverdue
                          ? `${Math.abs(daysRemaining)} days overdue`
                          : `${daysRemaining} days remaining`}
                      </span>
                    </div>
                  )}
                </div>

                <div className='flex items-center gap-4'>
                  <div className='flex-1'>
                    <div className='flex justify-between text-sm mb-1'>
                      <span className='text-gray-600'>Progress</span>
                      <span className='font-medium'>
                        {Math.round(project.percentComplete)}%
                      </span>
                    </div>
                    <Progress value={project.percentComplete} className='h-2' />
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={e => e.stopPropagation()}
                  >
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      onProjectClick(project);
                    }}
                  >
                    <Eye className='h-4 w-4 mr-2' />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      // TODO: Implement edit functionality
                    }}
                  >
                    <Edit className='h-4 w-4 mr-2' />
                    Edit Project
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className='text-red-600'
                    onClick={e => {
                      e.stopPropagation();
                      // TODO: Implement delete functionality
                    }}
                  >
                    <Trash2 className='h-4 w-4 mr-2' />
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
    </div>
  );
}
