'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    Calendar,
    Clock,
    Edit,
    MapPin,
    Pause,
    Play,
    Plus,
    Square,
    Trash2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import type { TimeEntry } from '@kiro/shared/types/timetracking';

interface Timer {
  id: string;
  projectId?: string;
  taskId?: string;
  activityType: string;
  description?: string;
  startTime: string;
  isRunning: boolean;
  elapsedTime: number;
}



interface MobileTimeTrackerProps {
  className?: string;
}

export function MobileTimeTracker({ className }: MobileTimeTrackerProps) {
  const [activeTimer, setActiveTimer] = useState<Timer | null>(null);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  // Quick log form
  const [quickLogForm, setQuickLogForm] = useState({
    projectId: '',
    taskId: '',
    activityType: 'Development',
    description: '',
    duration: '',
    isBillable: true,
  });

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you'd reverse geocode this to get address
          setCurrentLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        },
        (error) => {
          console.warn('Location access denied:', error);
        }
      );
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (activeTimer?.isRunning) {
      const interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      return undefined;
    }
  }, [activeTimer?.isRunning, timerInterval]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const startTimer = () => {
    const timer: Timer = {
      id: crypto.randomUUID(),
      activityType: 'Development',
      startTime: new Date().toISOString(),
      isRunning: true,
      elapsedTime: 0,
    };
    setActiveTimer(timer);
    setElapsedSeconds(0);
    toast.success('Timer started');
  };

  const pauseTimer = () => {
    if (activeTimer) {
      setActiveTimer({ ...activeTimer, isRunning: false });
      toast.info('Timer paused');
    }
  };

  const resumeTimer = () => {
    if (activeTimer) {
      setActiveTimer({ ...activeTimer, isRunning: true });
      toast.success('Timer resumed');
    }
  };

  const stopTimer = () => {
    if (activeTimer) {
      const duration = elapsedSeconds / 3600; // Convert to hours
      const entry: TimeEntry = {
        id: crypto.randomUUID(),
        timesheetId: 'default-timesheet',
        projectId: activeTimer.projectId || undefined,
        taskId: activeTimer.taskId || undefined,
        activityType: activeTimer.activityType,
        description: activeTimer.description,
        startTime: activeTimer.startTime,
        endTime: new Date().toISOString(),
        duration,
        isBillable: true,
        location: currentLocation,
        isManualEntry: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTodayEntries(prev => [entry, ...prev]);
      setActiveTimer(null);
      setElapsedSeconds(0);
      toast.success(`Time logged: ${formatDuration(duration)}`);
    }
  };

  const logQuickTime = () => {
    if (!quickLogForm.duration) {
      toast.error('Please enter duration');
      return;
    }

    const duration = parseFloat(quickLogForm.duration);
    const entry: TimeEntry = {
      id: crypto.randomUUID(),
      timesheetId: 'default-timesheet',
      projectId: quickLogForm.projectId || undefined,
      taskId: quickLogForm.taskId || undefined,
      activityType: quickLogForm.activityType,
      description: quickLogForm.description,
      startTime: new Date().toISOString(),
      duration,
      isBillable: quickLogForm.isBillable,
      location: currentLocation,
      isManualEntry: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTodayEntries(prev => [entry, ...prev]);
    setQuickLogForm({
      projectId: '',
      taskId: '',
      activityType: 'Development',
      description: '',
      duration: '',
      isBillable: true,
    });
    setShowQuickLog(false);
    toast.success(`Time logged: ${formatDuration(duration)}`);
  };

  const deleteEntry = (entryId: string) => {
    setTodayEntries(prev => prev.filter(entry => entry.id !== entryId));
    toast.success('Time entry deleted');
  };

  const getTotalHours = (): number => {
    return todayEntries.reduce((sum, entry) => sum + entry.duration, 0);
  };

  const getBillableHours = (): number => {
    return todayEntries.filter(entry => entry.isBillable).reduce((sum, entry) => sum + entry.duration, 0);
  };

  return (
    <div className={`max-w-md mx-auto space-y-4 ${className}`}>
      {/* Timer Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Tracker
            </span>
            {currentLocation && (
              <Badge variant="outline" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                GPS
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Timer Display */}
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-blue-600 mb-2">
              {formatTime(elapsedSeconds)}
            </div>
            {activeTimer && (
              <div className="text-sm text-gray-600">
                {activeTimer.activityType}
                {activeTimer.description && ` - ${activeTimer.description}`}
              </div>
            )}
          </div>

          {/* Timer Controls */}
          <div className="flex justify-center gap-2">
            {!activeTimer ? (
              <Button onClick={startTimer} className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Start Timer
              </Button>
            ) : (
              <>
                {activeTimer.isRunning ? (
                  <Button onClick={pauseTimer} variant="outline" className="flex items-center gap-2">
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                ) : (
                  <Button onClick={resumeTimer} className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Resume
                  </Button>
                )}
                <Button onClick={stopTimer} variant="destructive" className="flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuickLog(!showQuickLog)}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Quick Log
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Log Form */}
      {showQuickLog && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Time Log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={quickLogForm.activityType}
                onValueChange={(value) => setQuickLogForm(prev => ({ ...prev, activityType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Development">Development</SelectItem>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                  <SelectItem value="Testing">Testing</SelectItem>
                  <SelectItem value="Documentation">Documentation</SelectItem>
                  <SelectItem value="Research">Research</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                step="0.25"
                placeholder="Hours"
                value={quickLogForm.duration}
                onChange={(e) => setQuickLogForm(prev => ({ ...prev, duration: e.target.value }))}
              />
            </div>

            <Textarea
              placeholder="Description (optional)"
              value={quickLogForm.description}
              onChange={(e) => setQuickLogForm(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="billable"
                checked={quickLogForm.isBillable}
                onChange={(e) => setQuickLogForm(prev => ({ ...prev, isBillable: e.target.checked }))}
              />
              <label htmlFor="billable" className="text-sm">Billable</label>
            </div>

            <div className="flex gap-2">
              <Button onClick={logQuickTime} className="flex-1">
                Log Time
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowQuickLog(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatDuration(getTotalHours())}
              </div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatDuration(getBillableHours())}
              </div>
              <div className="text-sm text-gray-600">Billable</div>
            </div>
          </div>

          {/* Today's Entries */}
          <div className="space-y-2">
            {todayEntries.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No time entries today
              </div>
            ) : (
              todayEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{entry.activityType}</div>
                    {entry.description && (
                      <div className="text-xs text-gray-600">{entry.description}</div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium">
                        {formatDuration(entry.duration)}
                      </span>
                      {entry.isBillable && (
                        <Badge variant="secondary" className="text-xs">
                          Billable
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => {}}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEntry(entry.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
