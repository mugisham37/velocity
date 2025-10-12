'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  GET_PROJECT_CRITICAL_PATH,
  GET_PROJECT_GANTT_DATA,
} from '@/graphql/projects';
import { useQuery } from '@apollo/client';
import {
  AlertTriangle,
  Calendar,
  Download,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import React, { useRef, useState } from 'react';

interface GanttChartProps {
  projectId: string;
  className?: string;
}

export function GanttChart({ projectId, className }: GanttChartProps) {
  const ganttRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [showCriticalPath, setShowCriticalPath] = useState(false);

  const {
    data: ganttData,
    loading: ganttLoading,
  } = useQuery(GET_PROJECT_GANTT_DATA, {
    variables: { projectId },
  });

  useQuery(GET_PROJECT_CRITICAL_PATH, {
    variables: { projectId },
    skip: !showCriticalPath,
  });

  const handleZoomIn = () => {
    if (viewMode === 'month') setViewMode('week');
    else if (viewMode === 'week') setViewMode('day');
  };

  const handleZoomOut = () => {
    if (viewMode === 'day') setViewMode('week');
    else if (viewMode === 'week') setViewMode('month');
  };

  const handleReset = () => {
    console.log('Reset gantt chart');
  };

  const handleExport = () => {
    console.log('Export gantt chart to PDF');
  };

  if (ganttLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Project Gantt Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading Gantt chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Project Gantt Chart
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCriticalPath(!showCriticalPath)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Critical Path
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">View: {viewMode}</Badge>
          {showCriticalPath && (
            <Badge variant="destructive">Critical Path Enabled</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={ganttRef}
          className="w-full h-96 border rounded-lg bg-gray-50 flex items-center justify-center"
        >
          <div className="text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Gantt Chart</p>
            <p className="text-sm">
              Install dhtmlx-gantt to enable interactive Gantt chart functionality
            </p>
            {ganttData?.projectGanttData && (
              <p className="text-xs mt-2 text-gray-400">
                {ganttData.projectGanttData.tasks?.length || 0} tasks loaded
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}