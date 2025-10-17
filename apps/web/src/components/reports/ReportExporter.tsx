'use client';

import React, { useState } from 'react';
import { ReportResult, ExportOptions, ReportDefinition } from '@/types/reports';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  DocumentArrowDownIcon,
  ShareIcon,
  EnvelopeIcon,
  LinkIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface ReportExporterProps {
  reportData: ReportResult;
  reportDefinition?: ReportDefinition;
  onClose?: () => void;
}

export function ReportExporter({ reportData, reportDefinition, onClose }: ReportExporterProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'PDF',
    filename: reportDefinition?.name || 'report',
    include_filters: true,
    page_size: 'A4',
    orientation: 'portrait'
  });
  const [isExporting, setIsExporting] = useState(false);
  const [shareOptions, setShareOptions] = useState({
    emails: '',
    message: '',
    includeLink: false
  });
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  const { showError, showSuccess } = useNotifications();

  const handleExport = async (format: 'PDF' | 'Excel' | 'CSV') => {
    setIsExporting(true);
    
    try {
      const options = { ...exportOptions, format };
      
      // Prepare export data
      const exportData = {
        report_name: reportDefinition?.name,
        data: reportData,
        options
      };

      // Create export request
      const response = await fetch('/api/method/frappe.desk.query_report.export_query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData)
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const extension = format.toLowerCase() === 'excel' ? 'xlsx' : format.toLowerCase();
      link.download = `${options.filename}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess('Export Complete', `Report exported as ${format} successfully`);
    } catch (error) {
      console.error('Export failed:', error);
      showError('Export Failed', `Failed to export report as ${format}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!shareOptions.emails.trim()) {
      showError('Missing Recipients', 'Please enter at least one email address');
      return;
    }

    try {
      const emails = shareOptions.emails.split(',').map(email => email.trim()).filter(Boolean);
      
      const shareData = {
        report_name: reportDefinition?.name,
        report_data: reportData,
        recipients: emails,
        message: shareOptions.message,
        include_link: shareOptions.includeLink,
        export_format: exportOptions.format
      };

      const response = await fetch('/api/method/frappe.desk.query_report.share_report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shareData)
      });

      if (!response.ok) {
        throw new Error(`Share failed: ${response.statusText}`);
      }

      showSuccess('Report Shared', `Report shared with ${emails.length} recipients`);
      setShowShareDialog(false);
      setShareOptions({ emails: '', message: '', includeLink: false });
    } catch (error) {
      console.error('Share failed:', error);
      showError('Share Failed', 'Failed to share report');
    }
  };

  const generateShareableLink = async () => {
    try {
      const response = await fetch('/api/method/frappe.desk.query_report.generate_share_link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_name: reportDefinition?.name,
          filters: reportDefinition?.query.filters || []
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate link: ${response.statusText}`);
      }

      const result = await response.json();
      const shareUrl = `${window.location.origin}/reports/shared/${result.message.share_key}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      showSuccess('Link Copied', 'Shareable link copied to clipboard');
    } catch (error) {
      console.error('Failed to generate share link:', error);
      showError('Link Generation Failed', 'Failed to generate shareable link');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Export & Share Report</h1>
          {reportDefinition && (
            <p className="text-gray-600 mt-1">
              {reportDefinition.title} - {reportData.data.length} records
            </p>
          )}
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Options */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <DocumentArrowDownIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-medium text-gray-900">Export Options</h2>
          </div>

          <div className="space-y-4">
            {/* Filename */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filename
              </label>
              <input
                type="text"
                value={exportOptions.filename}
                onChange={(e) => setExportOptions(prev => ({ ...prev, filename: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter filename..."
              />
            </div>

            {/* Page Size (for PDF) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Page Size
              </label>
              <select
                value={exportOptions.page_size}
                onChange={(e) => setExportOptions(prev => ({ ...prev, page_size: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="A4">A4</option>
                <option value="A3">A3</option>
                <option value="Letter">Letter</option>
              </select>
            </div>

            {/* Orientation (for PDF) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Orientation
              </label>
              <select
                value={exportOptions.orientation}
                onChange={(e) => setExportOptions(prev => ({ ...prev, orientation: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            {/* Include Filters */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportOptions.include_filters}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, include_filters: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Include filter information</span>
              </label>
            </div>

            {/* Export Buttons */}
            <div className="space-y-2 pt-4">
              <Button
                onClick={() => handleExport('PDF')}
                disabled={isExporting}
                className="w-full flex items-center justify-center space-x-2"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>Export as PDF</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleExport('Excel')}
                disabled={isExporting}
                className="w-full flex items-center justify-center space-x-2"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>Export as Excel</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleExport('CSV')}
                disabled={isExporting}
                className="w-full flex items-center justify-center space-x-2"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>Export as CSV</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Share Options */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <ShareIcon className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-medium text-gray-900">Share Options</h2>
          </div>

          <div className="space-y-4">
            {/* Generate Link */}
            <div>
              <Button
                variant="outline"
                onClick={generateShareableLink}
                className="w-full flex items-center justify-center space-x-2"
              >
                <LinkIcon className="h-4 w-4" />
                <span>Generate Shareable Link</span>
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                Creates a public link that others can use to view this report
              </p>
            </div>

            {/* Email Share */}
            <div>
              <Button
                onClick={() => setShowShareDialog(true)}
                className="w-full flex items-center justify-center space-x-2"
              >
                <EnvelopeIcon className="h-4 w-4" />
                <span>Share via Email</span>
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                Send report directly to email recipients
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Share Report</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareDialog(false)}
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              {/* Email Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Recipients
                </label>
                <textarea
                  value={shareOptions.emails}
                  onChange={(e) => setShareOptions(prev => ({ ...prev, emails: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter email addresses separated by commas..."
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={shareOptions.message}
                  onChange={(e) => setShareOptions(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Add a personal message..."
                />
              </div>

              {/* Include Link */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={shareOptions.includeLink}
                    onChange={(e) => setShareOptions(prev => ({ ...prev, includeLink: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Include shareable link in email</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowShareDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleShare}
                  disabled={!shareOptions.emails.trim()}
                >
                  Send Report
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}