'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  GET_PROJECT_CRITICAL_PATH,
  GET_PROJECT_GANTT_DATA,
} from '@/graphql/projects';
import { useQuery } from '@ap';
import {
  AlertTriangle,
  Calendar,
  Download,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface GanttChartProps {
  projectId: string;
  className?: string;
}

export function GanttChart({ projectId, className }: GanttChartProps) {
  const ganttRef = useRef<HTMLDivElement>(null);
  const [ganttInstance, setGanttInstance] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [showCriticalPath, setShowCriticalPath] = useState(false);

  const {
    data: ganttData,
    loading: ganttLoading,
    refetch: refetchGantt,
  } = useQuery(GET_PROJECT_GANTT_DATA, {
    variables: { projectId },
  });

  const { data: criticalPathData, loading: criticalPathLoading } = useQuery(
    GET_PROJECT_CRITICAL_PATH,
    {
      variables: { projectId },
      skip: !showCriticalPath,
    }
  );

  // Initialize Gantt chart
  useEffect(() => {
    if (!ganttData?.projectGanttData || !ganttRef.current) return;

    // Dynamic import of dhtmlx-gantt to avoid SSR issues
    import('dhtmlx-gantt').then(gantt => {
      const ganttInstance = gantt.gantt;

      // Configure Gantt
      ganttInstance.config.date_format = '%Y-%m-%d';
      ganttInstance.config.scale_unit =
        viewMode === 'day' ? 'day' : viewMode === 'week' ? 'week' : 'month';
      ganttInstance.config.step = 1;
      ganttInstance.config.date_scale =
        viewMode === 'day'
          ? '%d %M'
          : viewMode === 'week'
            ? 'Week %W'
            : '%F %Y';
      ganttInstance.config.subscales =
        viewMode === 'day' ? [{ unit: 'hour', step: 6, date: '%H:%i' }] : [];

      // Enable features
      ganttInstance.config.drag_links = true;
      ganttInstance.config.drag_progress = true;
      ganttInstance.config.drag_resize = true;
      ganttInstance.config.details_on_dblclick = true;
      ganttInstance.config.show_progress = true;
      ganttInstance.config.show_links = true;

      // Customize appearance
      ganttInstance.config.grid_width = 350;
      ganttInstance.config.row_height = 30;
      ganttInstance.config.task_height = 20;

      // Configure columns
      ganttInstance.config.columns = [
        { name: 'text', label: 'Task Name', width: 200, tree: true },
        { name: 'start_date', label: 'Start Date', width: 80, align: 'center' },
        { name: 'duration', label: 'Duration', width: 70, align: 'center' },
      ];

      // Event handlers
      ganttInstance.attachEvent(
        'onAfterTaskDrag',
        (id: string, mode: string, task: any) => {
          // Handle task updates
          console.log('Task updated:', { id, mode, task });
          // TODO: Implement task update mutation
        }
      );

      ganttInstance.attachEvent('onAfterLinkAdd', (id: string, link: any) => {
        // Handle dependency creation
        console.log('Link added:', { id, link });
        // TODO: Implement dependency creation mutation
      });

      ganttInstance.attachEvent(
        'onAfterLinkDelete',
        (id: string, link: any) => {
          // Handle dependency deletion
          console.log('Link deleted:', { id, link });
          // TODO: Implement dependency deletion mutation
        }
      );

      // Initialize Gantt
      ganttInstance.init(ganttRef.current);

      // Load data
      ganttInstance.parse({
        data: ganttData.projectGanttData.tasks,
        links: ganttData.projectGanttData.links,
      });

      setGanttInstance(ganttInstance);

      // Cleanup
      return () => {
        if (ganttInstance) {
          ganttInstance.destructor();
        }
      };
    });
  }, [ganttData, viewMode]);

  // Update critical path highlighting
  useEffect(() => {
    if (!ganttInstance || !criticalPathData?.projectCriticalPath) return;

    const criticalTaskIds =
      criticalPathData.projectCriticalPath.criticalPath.map(t => t.taskId);

    // Add custom CSS class for critical path tasks
    ganttInstance.templates.task_class = (
      start: Date,
      end: Date,
      task: any
    ) => {
      if (criticalTaskIds.includes(task.id)) {
        return 'critical-path-task';
      }
      return '';
    };

    ganttInstance.render();
  }, [ganttInstance, criticalPathData, showCriticalPath]);

  const handleZoomIn = () => {
    if (viewMode === 'month') setViewMode('week');
    else if (viewMode === 'week') setViewMode('day');
  };

  const handleZoomOut = () => {
    if (viewMode === 'day') setViewMode('week');
    else if (viewMode === 'week') setViewMode('month');
  };

  const handleReset = () => {
    if (ganttInstance) {
      ganttInstance.render();
    }
  };

  const handleExport = () => {
    if (ganttInstance) {
      ganttInstance.exportToPDF({
        name: `project-${projectId}-gantt.pdf`,
        header: '<h1>Project Gantt Chart</h1>',
        footer:
          '<div style="text-align: center;">Generated on ' +
          new Date().toLocaleDateString() +
          '</div>',
      });
    }
  };

  if (ganttLoading) {
    return (
      <Card className={className}>
        <CardContent className='flex items-center justify-center h-96'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className='flex justify-between items-center'>
            <CardTitle className='flex items-center gap-2'>
              <Calendar className='h-5 w-5' />
              Project Gantt Chart
            </CardTitle>
            <div className='flex items-center gap-2'>
              {/* View Mode Selector */}
              <div className='flex rounded-md border'>
                {(['day', 'week', 'month'] as const).map(mode => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? 'default' : 'ghost'}
                    size='sm'
                    onClick={() => setViewMode(mode)}
                    className='rounded-none first:rounded-l-md last:rounded-r-md'
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Zoom Controls */}
              <div className='flex items-center gap-1'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleZoomIn}
                  disabled={viewMode === 'day'}
                >
                  <ZoomIn className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleZoomOut}
                  disabled={viewMode === 'month'}
                >
                  <ZoomOut className='h-4 w-4' />
                </Button>
                <Button variant='outline' size='sm' onClick={handleReset}>
                  <RotateCcw className='h-4 w-4' />
                </Button>
              </div>

              {/* Critical Path Toggle */}
              <Button
                variant={showCriticalPath ? 'default' : 'outline'}
                size='sm'
                onClick={() => setShowCriticalPath(!showCriticalPath)}
                className='flex items-center gap-2'
              >
                <AlertTriangle className='h-4 w-4' />
                Critical Path
              </Button>

              {/* Export */}
              <Button variant='outline' size='sm' onClick={handleExport}>
                <Download className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Critical Path Info */}
          {showCriticalPath && criticalPathData?.projectCriticalPath && (
            <div className='mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg'>
              <div className='flex items-center gap-2 mb-2'>
                <AlertTriangle className='h-5 w-5 text-orange-600' />
                <h3 className='font-semibold text-orange-800'>
                  Critical Path Analysis
                </h3>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                <div>
                  <span className='font-medium'>Project Duration:</span>{' '}
                  {criticalPathData.projectCriticalPath.projectDuration} days
                </div>
                <div>
                  <span className='font-medium'>Critical Tasks:</span>{' '}
                  {criticalPathData.projectCriticalPath.criticalPath.length}
                </div>
                <div>
                  <span className='font-medium'>Analysis Date:</span>{' '}
                  {new Date(
                    criticalPathData.projectCriticalPath.analysisDate
                  ).toLocaleDateString()}
                </div>
              </div>
              {criticalPathData.projectCriticalPath.criticalPath.length > 0 && (
                <div className='mt-3'>
                  <span className='font-medium'>Critical Tasks:</span>
                  <div className='flex flex-wrap gap-1 mt-1'>
                    {criticalPathData.projectCriticalPath.criticalPath.map(
                      task => (
                        <Badge
                          key={task.taskId}
                          variant='destructive'
                          className='text-xs'
                        >
                          {task.taskName}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gantt Chart Container */}
          <div
            ref={ganttRef}
            className='gantt-container'
            style={{ height: '500px', width: '100%' }}
          />

          {/* Legend */}
          <div className='mt-4 flex flex-wrap gap-4 text-sm text-gray-600'>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-3 bg-blue-500 rounded'></div>
              <span>Regular Task</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-3 bg-green-500 rounded'></div>
              <span>Completed Task</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-3 bg-red-500 rounded'></div>
              <span>Critical Path</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-3 bg-purple-500 rounded'></div>
              <span>Milestone</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom CSS for Gantt styling */}
      <style jsx global>{`
        .gantt-container .gantt_task_line.critical-path-task {
          background-color: #ef4444 !important;
          border-color: #dc2626 !important;
        }

        .gantt-container
          .gantt_task_line.critical-path-task
          .gantt_task_progress {
          background-color: #b91c1c !important;
        }

        .gantt-container .gantt_grid_scale .gantt_grid_head_cell,
        .gantt-container .gantt_task_scale .gantt_scale_cell {
          background-color: #f8fafc;
          border-color: #e2e8f0;
        }

        .gantt-container .gantt_task_line {
          border-radius: 4px;
        }

        .gantt-container .gantt_link_arrow {
          border-color: #64748b;
        }

        .gantt-container .gantt_link_line {
          background-color: #64748b;
        }
      `}</style>
    </div>
  );
}
