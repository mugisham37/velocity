'use client';

import React, { useState, useEffect } from 'react';
import { ReportSchedule, ReportDefinition } from '@/types/reports';
import { useDocuments } from '@/hooks/useDocuments';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ClockIcon,
  PlusIcon,
  XMarkIcon,
  PlayIcon,
  PauseIcon,
} from '@heroicons/react/24/outline';

interface ReportSchedulerProps {
  reportDefinition?: ReportDefinition;
  onClose?: () => void;
}

export function ReportScheduler({
  reportDefinition,
  onClose,
}: ReportSchedulerProps) {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingSchedule, setEditingSchedule] =
    useState<Partial<ReportSchedule> | null>(null);

  const { getList } = useDocuments();
  const { showError, showSuccess } = useNotifications();

  // Load existing schedules
  useEffect(() => {
    const loadSchedules = async () => {
      if (!reportDefinition?.name) return;

      setIsLoading(true);
      try {
        const response = await getList('Report Schedule', {
          filters: [['report_name', '=', reportDefinition.name]],
          fields: ['*'],
        });
        setSchedules(response.data || []);
      } catch (error) {
        console.error('Failed to load schedules:', error);
        showError('Error', 'Failed to load report schedules');
      } finally {
        setIsLoading(false);
      }
    };

    loadSchedules();
  }, [reportDefinition?.name, getList, showError]);

  const handleCreateSchedule = () => {
    setEditingSchedule({
      name: '',
      report_name: reportDefinition?.name || '',
      frequency: 'Daily',
      time: '09:00',
      recipients: [],
      format: 'PDF',
      enabled: true,
    });
  };

  const handleSaveSchedule = async () => {
    if (!editingSchedule || !editingSchedule.report_name) return;

    try {
      const scheduleData = {
        ...editingSchedule,
        doctype: 'Report Schedule',
        name: editingSchedule.name || undefined,
      };

      // Use fetch API directly for now
      const response = await fetch(
        '/api/method/frappe.desk.form.save.savedocs',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            doc: JSON.stringify(scheduleData),
            action: 'Save',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save schedule');
      }

      const result = await response.json();
      const savedSchedule = result.docs[0];

      if (editingSchedule.name) {
        // Update existing
        setSchedules((prev) =>
          prev.map((s) => (s.name === editingSchedule.name ? savedSchedule : s))
        );
      } else {
        // Add new
        setSchedules((prev) => [...prev, savedSchedule]);
      }

      setEditingSchedule(null);
      showSuccess(
        'Schedule Saved',
        'Report schedule has been saved successfully'
      );
    } catch (error) {
      console.error('Failed to save schedule:', error);
      showError('Save Failed', 'Failed to save report schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleName: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const response = await fetch(`/api/method/frappe.client.delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctype: 'Report Schedule',
          name: scheduleName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete schedule');
      }

      setSchedules((prev) => prev.filter((s) => s.name !== scheduleName));
      showSuccess('Schedule Deleted', 'Report schedule has been deleted');
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      showError('Delete Failed', 'Failed to delete report schedule');
    }
  };

  const handleToggleSchedule = async (schedule: ReportSchedule) => {
    try {
      const updatedData = {
        ...schedule,
        enabled: !schedule.enabled,
      };

      const response = await fetch(
        '/api/method/frappe.desk.form.save.savedocs',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            doc: JSON.stringify(updatedData),
            action: 'Save',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update schedule');
      }

      const result = await response.json();
      const updatedSchedule = result.docs[0];

      setSchedules((prev) =>
        prev.map((s) => (s.name === schedule.name ? updatedSchedule : s))
      );
      showSuccess(
        schedule.enabled ? 'Schedule Disabled' : 'Schedule Enabled',
        `Report schedule has been ${schedule.enabled ? 'disabled' : 'enabled'}`
      );
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
      showError('Update Failed', 'Failed to update schedule status');
    }
  };

  const renderScheduleForm = () => {
    if (!editingSchedule) return null;

    return (
      <Card className='mb-6 p-6'>
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='text-lg font-medium text-gray-900'>
            {editingSchedule.name ? 'Edit Schedule' : 'New Schedule'}
          </h3>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setEditingSchedule(null)}
          >
            <XMarkIcon className='h-4 w-4' />
          </Button>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          {/* Schedule Name */}
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>
              Schedule Name
            </label>
            <input
              type='text'
              value={editingSchedule.name || ''}
              onChange={(e) =>
                setEditingSchedule((prev) => ({
                  ...prev!,
                  name: e.target.value,
                }))
              }
              className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none'
              placeholder='Enter schedule name...'
            />
          </div>

          {/* Frequency */}
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>
              Frequency
            </label>
            <select
              value={editingSchedule.frequency}
              onChange={(e) =>
                setEditingSchedule((prev) => ({
                  ...prev!,
                  frequency: e.target.value as ReportSchedule['frequency'],
                }))
              }
              className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none'
            >
              <option value='Daily'>Daily</option>
              <option value='Weekly'>Weekly</option>
              <option value='Monthly'>Monthly</option>
              <option value='Quarterly'>Quarterly</option>
              <option value='Yearly'>Yearly</option>
            </select>
          </div>

          {/* Time */}
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>
              Time
            </label>
            <input
              type='time'
              value={editingSchedule.time}
              onChange={(e) =>
                setEditingSchedule((prev) => ({
                  ...prev!,
                  time: e.target.value,
                }))
              }
              className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none'
            />
          </div>

          {/* Format */}
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>
              Export Format
            </label>
            <select
              value={editingSchedule.format}
              onChange={(e) =>
                setEditingSchedule((prev) => ({
                  ...prev!,
                  format: e.target.value as ReportSchedule['format'],
                }))
              }
              className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none'
            >
              <option value='PDF'>PDF</option>
              <option value='Excel'>Excel</option>
              <option value='CSV'>CSV</option>
            </select>
          </div>

          {/* Day of Week (for Weekly) */}
          {editingSchedule.frequency === 'Weekly' && (
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>
                Day of Week
              </label>
              <select
                value={editingSchedule.day_of_week || 1}
                onChange={(e) =>
                  setEditingSchedule((prev) => ({
                    ...prev!,
                    day_of_week: parseInt(e.target.value),
                  }))
                }
                className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none'
              >
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
                <option value={0}>Sunday</option>
              </select>
            </div>
          )}

          {/* Day of Month (for Monthly) */}
          {editingSchedule.frequency === 'Monthly' && (
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>
                Day of Month
              </label>
              <input
                type='number'
                min='1'
                max='31'
                value={editingSchedule.day_of_month || 1}
                onChange={(e) =>
                  setEditingSchedule((prev) => ({
                    ...prev!,
                    day_of_month: parseInt(e.target.value),
                  }))
                }
                className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none'
              />
            </div>
          )}
        </div>

        {/* Recipients */}
        <div className='mt-4'>
          <label className='mb-1 block text-sm font-medium text-gray-700'>
            Email Recipients
          </label>
          <textarea
            value={editingSchedule.recipients?.join(', ') || ''}
            onChange={(e) =>
              setEditingSchedule((prev) => ({
                ...prev!,
                recipients: e.target.value
                  .split(',')
                  .map((email) => email.trim())
                  .filter(Boolean),
              }))
            }
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none'
            rows={3}
            placeholder='Enter email addresses separated by commas...'
          />
        </div>

        {/* Enabled */}
        <div className='mt-4'>
          <label className='flex items-center space-x-2'>
            <input
              type='checkbox'
              checked={editingSchedule.enabled}
              onChange={(e) =>
                setEditingSchedule((prev) => ({
                  ...prev!,
                  enabled: e.target.checked,
                }))
              }
              className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
            />
            <span className='text-sm text-gray-700'>Enable this schedule</span>
          </label>
        </div>

        {/* Actions */}
        <div className='mt-6 flex justify-end space-x-3'>
          <Button variant='outline' onClick={() => setEditingSchedule(null)}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveSchedule}
            disabled={
              !editingSchedule.name || !editingSchedule.recipients?.length
            }
          >
            Save Schedule
          </Button>
        </div>
      </Card>
    );
  };

  const formatNextRun = (schedule: ReportSchedule) => {
    if (!schedule.next_run) return 'Not scheduled';

    try {
      return new Date(schedule.next_run).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const formatLastRun = (schedule: ReportSchedule) => {
    if (!schedule.last_run) return 'Never';

    try {
      return new Date(schedule.last_run).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className='mx-auto max-w-6xl p-6'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Report Scheduler</h1>
          {reportDefinition && (
            <p className='mt-1 text-gray-600'>
              Manage schedules for: {reportDefinition.title}
            </p>
          )}
        </div>
        <div className='flex items-center space-x-3'>
          <Button
            onClick={handleCreateSchedule}
            className='flex items-center space-x-2'
          >
            <PlusIcon className='h-4 w-4' />
            <span>New Schedule</span>
          </Button>
          {onClose && (
            <Button variant='outline' onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Schedule Form */}
      {renderScheduleForm()}

      {/* Schedules List */}
      <div className='space-y-4'>
        {isLoading ? (
          <Card className='p-6'>
            <div className='text-center text-gray-500'>
              Loading schedules...
            </div>
          </Card>
        ) : schedules.length === 0 ? (
          <Card className='p-6'>
            <div className='text-center'>
              <ClockIcon className='mx-auto mb-4 h-12 w-12 text-gray-400' />
              <h3 className='mb-2 text-lg font-medium text-gray-900'>
                No Schedules
              </h3>
              <p className='mb-4 text-gray-600'>
                Create your first report schedule to automate report delivery.
              </p>
              <Button onClick={handleCreateSchedule}>
                <PlusIcon className='mr-2 h-4 w-4' />
                Create Schedule
              </Button>
            </div>
          </Card>
        ) : (
          schedules.map((schedule) => (
            <Card key={schedule.name} className='p-6'>
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center space-x-3'>
                    <h3 className='text-lg font-medium text-gray-900'>
                      {schedule.name}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        schedule.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {schedule.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  <div className='mt-2 grid grid-cols-1 gap-4 text-sm text-gray-600 md:grid-cols-4'>
                    <div>
                      <span className='font-medium'>Frequency:</span>{' '}
                      {schedule.frequency}
                    </div>
                    <div>
                      <span className='font-medium'>Time:</span> {schedule.time}
                    </div>
                    <div>
                      <span className='font-medium'>Format:</span>{' '}
                      {schedule.format}
                    </div>
                    <div>
                      <span className='font-medium'>Recipients:</span>{' '}
                      {schedule.recipients.length}
                    </div>
                  </div>

                  <div className='mt-2 grid grid-cols-1 gap-4 text-sm text-gray-600 md:grid-cols-2'>
                    <div>
                      <span className='font-medium'>Next Run:</span>{' '}
                      {formatNextRun(schedule)}
                    </div>
                    <div>
                      <span className='font-medium'>Last Run:</span>{' '}
                      {formatLastRun(schedule)}
                    </div>
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleToggleSchedule(schedule)}
                    className='flex items-center space-x-1'
                  >
                    {schedule.enabled ? (
                      <>
                        <PauseIcon className='h-4 w-4' />
                        <span>Disable</span>
                      </>
                    ) : (
                      <>
                        <PlayIcon className='h-4 w-4' />
                        <span>Enable</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setEditingSchedule(schedule)}
                  >
                    Edit
                  </Button>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleDeleteSchedule(schedule.name)}
                    className='text-red-600 hover:text-red-700'
                  >
                    <XMarkIcon className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
