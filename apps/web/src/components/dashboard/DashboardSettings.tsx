'use client';

import React, { useState } from 'react';
import { useDashboardStore } from '@/stores/dashboard';
import type { DashboardConfig, DashboardType } from '@/types/dashboard';

interface DashboardSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  dashboard: DashboardConfig;
}

export function DashboardSettings({ isOpen, onClose, dashboard }: DashboardSettingsProps) {
  const { saveDashboard, duplicateDashboard, deleteDashboard } = useDashboardStore();
  const [formData, setFormData] = useState({
    title: dashboard.title,
    type: dashboard.type,
    module: dashboard.module || '',
    columns: dashboard.layout.columns,
    gridGap: dashboard.layout.gridGap,
  });
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updatedDashboard: DashboardConfig = {
        ...dashboard,
        title: formData.title,
        type: formData.type,
        module: formData.type === 'module' ? formData.module : undefined,
        layout: {
          ...dashboard.layout,
          columns: formData.columns,
          gridGap: formData.gridGap,
        },
      };

      await saveDashboard(updatedDashboard);
      onClose();
    } catch (error) {
      console.error('Failed to save dashboard settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async () => {
    const newName = prompt('Enter a name for the duplicated dashboard:');
    if (newName) {
      try {
        await duplicateDashboard(dashboard.name, newName);
        onClose();
      } catch (error) {
        console.error('Failed to duplicate dashboard:', error);
        alert('Failed to duplicate dashboard');
      }
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this dashboard? This action cannot be undone.')) {
      try {
        await deleteDashboard(dashboard.name);
        onClose();
      } catch (error) {
        console.error('Failed to delete dashboard:', error);
        alert('Failed to delete dashboard');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Dashboard Settings
              </h3>
              <button
                onClick={onClose}
                className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4 space-y-6">
            {/* Basic Settings */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Settings</h4>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Dashboard Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Dashboard Type
                  </label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as DashboardType })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="workspace">Workspace</option>
                    <option value="module">Module</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {formData.type === 'module' && (
                  <div>
                    <label htmlFor="module" className="block text-sm font-medium text-gray-700">
                      Module Name
                    </label>
                    <input
                      type="text"
                      id="module"
                      value={formData.module}
                      onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g., Accounts, Stock, Sales"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Layout Settings */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Layout Settings</h4>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="columns" className="block text-sm font-medium text-gray-700">
                    Grid Columns
                  </label>
                  <input
                    type="number"
                    id="columns"
                    min="6"
                    max="24"
                    value={formData.columns}
                    onChange={(e) => setFormData({ ...formData, columns: parseInt(e.target.value) })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Number of columns in the grid (6-24)</p>
                </div>

                <div>
                  <label htmlFor="gridGap" className="block text-sm font-medium text-gray-700">
                    Grid Gap (px)
                  </label>
                  <input
                    type="number"
                    id="gridGap"
                    min="8"
                    max="32"
                    step="4"
                    value={formData.gridGap}
                    onChange={(e) => setFormData({ ...formData, gridGap: parseInt(e.target.value) })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Space between widgets (8-32px)</p>
                </div>
              </div>
            </div>

            {/* Dashboard Info */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Dashboard Info</h4>
              <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Widgets:</span>
                  <span>{dashboard.widgets.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span>System Default</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Modified:</span>
                  <span>Just now</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4">
            {/* Action buttons */}
            <div className="flex justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={handleDuplicate}
                  className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Duplicate
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-white py-2 px-3 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardSettings;