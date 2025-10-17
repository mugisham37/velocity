'use client';

import React, { useState } from 'react';
import { 
  SaveIcon, 
  SendIcon, 
  XIcon, 
  PrinterIcon, 
  MailIcon, 
  ShareIcon,
  MoreHorizontalIcon,
  CheckIcon,
  ClockIcon,
  AlertCircleIcon,
  CopyIcon,
  TrashIcon,
  RefreshCwIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DocumentState } from '@/types';

interface FormToolbarProps {
  document?: DocumentState;
  onSave: () => void;
  onSubmit: () => void;
  onCancel?: () => void;
  onPrint: () => void;
  onEmail: () => void;
  onShare: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onReload?: () => void;
  customActions?: CustomAction[];
  isLoading?: boolean;
  isDirty?: boolean;
  readOnly?: boolean;
}

interface CustomAction {
  label: string;
  action: string;
  icon?: React.ComponentType<{ className?: string }>;
  condition?: string;
  style?: 'primary' | 'secondary' | 'danger' | 'success';
}

export function FormToolbar({
  document,
  onSave,
  onSubmit,
  onCancel,
  onPrint,
  onEmail,
  onShare,
  onDuplicate,
  onDelete,
  onReload,
  customActions = [],
  isLoading = false,
  isDirty = false,
  readOnly = false,
}: FormToolbarProps) {
  const [showMoreActions, setShowMoreActions] = useState(false);

  const canSave = !readOnly && isDirty && !isLoading;
  const canSubmit = !readOnly && document && !document.isSubmitted && document.permissions.submit;
  const canCancel = document && document.isSubmitted && document.permissions.cancel;
  const canAmend = document && document.permissions.amend;

  const getStatusIcon = () => {
    if (!document) return null;
    
    if (document.isSubmitted) {
      return <CheckIcon className="h-4 w-4 text-green-600" />;
    }
    
    return <ClockIcon className="h-4 w-4 text-yellow-600" />;
  };

  const getStatusText = () => {
    if (!document) return 'Draft';
    
    if (document.isSubmitted) {
      return 'Submitted';
    }
    
    return 'Draft';
  };

  const getStatusColor = () => {
    if (!document) return 'bg-gray-100 text-gray-800';
    
    if (document.isSubmitted) {
      return 'bg-green-100 text-green-800';
    }
    
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Status and primary actions */}
        <div className="flex items-center space-x-4">
          {/* Document status */}
          {document && (
            <div className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              getStatusColor()
            )}>
              {getStatusIcon()}
              <span className="ml-1">{getStatusText()}</span>
            </div>
          )}
          
          {/* Dirty indicator */}
          {isDirty && (
            <div className="flex items-center text-xs text-orange-600">
              <AlertCircleIcon className="h-3 w-3 mr-1" />
              Unsaved changes
            </div>
          )}
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center space-x-2">
          {/* Primary actions */}
          <div className="flex items-center space-x-2">
            {/* Save button */}
            <button
              onClick={onSave}
              disabled={!canSave}
              className={cn(
                'inline-flex items-center px-4 py-2 text-sm font-medium rounded-md',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                canSave
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              )}
            >
              <SaveIcon className="h-4 w-4 mr-2" />
              Save
            </button>

            {/* Submit button */}
            {canSubmit && (
              <button
                onClick={onSubmit}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <SendIcon className="h-4 w-4 mr-2" />
                Submit
              </button>
            )}

            {/* Cancel button */}
            {canCancel && onCancel && (
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <XIcon className="h-4 w-4 mr-2" />
                Cancel
              </button>
            )}
          </div>

          {/* Secondary actions */}
          <div className="flex items-center space-x-1 border-l border-gray-200 pl-2">
            {/* Print */}
            <button
              onClick={onPrint}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              title="Print"
            >
              <PrinterIcon className="h-4 w-4" />
            </button>

            {/* Email */}
            <button
              onClick={onEmail}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              title="Email"
            >
              <MailIcon className="h-4 w-4" />
            </button>

            {/* Share */}
            <button
              onClick={onShare}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              title="Share"
            >
              <ShareIcon className="h-4 w-4" />
            </button>

            {/* More actions dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMoreActions(!showMoreActions)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                title="More actions"
              >
                <MoreHorizontalIcon className="h-4 w-4" />
              </button>

              {showMoreActions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    {/* Reload */}
                    {onReload && (
                      <button
                        onClick={() => {
                          onReload();
                          setShowMoreActions(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <RefreshCwIcon className="h-4 w-4 mr-3" />
                        Reload
                      </button>
                    )}

                    {/* Duplicate */}
                    {onDuplicate && document && (
                      <button
                        onClick={() => {
                          onDuplicate();
                          setShowMoreActions(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <CopyIcon className="h-4 w-4 mr-3" />
                        Duplicate
                      </button>
                    )}

                    {/* Custom actions */}
                    {customActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          // Handle custom action
                          console.log('Custom action:', action.action);
                          setShowMoreActions(false);
                        }}
                        className={cn(
                          'flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100',
                          action.style === 'danger' && 'text-red-700 hover:bg-red-50',
                          action.style === 'success' && 'text-green-700 hover:bg-green-50',
                          action.style === 'primary' && 'text-blue-700 hover:bg-blue-50',
                          !action.style && 'text-gray-700'
                        )}
                      >
                        {action.icon && (
                          <action.icon className="h-4 w-4 mr-3" />
                        )}
                        {action.label}
                      </button>
                    ))}

                    {/* Delete */}
                    {onDelete && document && document.permissions.delete && (
                      <>
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this document?')) {
                              onDelete();
                            }
                            setShowMoreActions(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                        >
                          <TrashIcon className="h-4 w-4 mr-3" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Workflow actions */}
      {document && document.meta.actions && document.meta.actions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Workflow:</span>
            {document.meta.actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  // Handle workflow action
                  console.log('Workflow action:', action.action);
                }}
                className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <RefreshCwIcon className="h-4 w-4 animate-spin" />
            <span>Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
}