'use client';

import React, { useState, useRef } from 'react';
import { 
  PaperclipIcon, 
  UploadIcon, 
  FileIcon, 
  ImageIcon,
  DownloadIcon,
  EyeIcon,
  TrashIcon,
  XIcon,
  Loader2Icon,
  FolderIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Attachment } from '@/types';

interface AttachmentManagerProps {
  attachments: Attachment[];
  onUpload: (files: File[]) => void;
  onDelete: (attachmentId: string) => void;
  onPreview?: (attachment: Attachment) => void;
  readOnly?: boolean;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
}

export function AttachmentManager({
  attachments,
  onUpload,
  onDelete,
  onPreview,
  readOnly = false,
  maxFileSize = 10,
  allowedTypes = [],
}: AttachmentManagerProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0 || readOnly) return;
    
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        errors.push(`${file.name}: File size exceeds ${maxFileSize}MB limit`);
        return;
      }

      // Check file type
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: File type not allowed`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      onUpload(validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string, fileType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (fileType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return ImageIcon;
    }
    
    return FileIcon;
  };

  const isImageFile = (attachment: Attachment): boolean => {
    return attachment.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i) !== null;
  };

  const handlePreview = (attachment: Attachment) => {
    if (onPreview) {
      onPreview(attachment);
    } else {
      setPreviewAttachment(attachment);
    }
  };

  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = attachment.file_url;
    link.download = attachment.file_name;
    link.click();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Attachments ({attachments.length})
          </h3>
          {!readOnly && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
            >
              <PaperclipIcon className="h-4 w-4 mr-1" />
              Add Files
            </button>
          )}
        </div>
      </div>

      {/* Upload Area */}
      {!readOnly && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'mx-6 mt-4 border-2 border-dashed rounded-lg p-6 text-center transition-colors',
            isDragOver && 'border-blue-400 bg-blue-50',
            !isDragOver && 'border-gray-300 hover:border-gray-400'
          )}
        >
          <UploadIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            Drop files here or click to browse
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Choose Files
          </button>
          <p className="text-xs text-gray-500 mt-1">
            Maximum file size: {maxFileSize}MB
            {allowedTypes.length > 0 && (
              <span className="block">
                Allowed types: {allowedTypes.join(', ')}
              </span>
            )}
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            accept={allowedTypes.join(',')}
          />
        </div>
      )}

      {/* Attachments List */}
      <div className="p-6">
        {attachments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FolderIcon className="mx-auto h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm">No attachments yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {attachments.map((attachment) => {
              const IconComponent = getFileIcon(attachment.file_name);
              
              return (
                <div
                  key={attachment.name}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-3">
                    {/* File icon or thumbnail */}
                    <div className="flex-shrink-0">
                      {isImageFile(attachment) ? (
                        <img
                          src={attachment.file_url}
                          alt={attachment.file_name}
                          className="h-12 w-12 object-cover rounded cursor-pointer"
                          onClick={() => handlePreview(attachment)}
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                          <IconComponent className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                    </div>
                    
                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {attachment.file_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(attachment.file_size)}
                      </p>
                      {attachment.is_private && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                          Private
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-1 mt-3">
                    <button
                      onClick={() => handlePreview(attachment)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                      title="Preview"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(attachment)}
                      className="p-1 text-gray-400 hover:text-green-600 rounded"
                      title="Download"
                    >
                      <DownloadIcon className="h-4 w-4" />
                    </button>
                    {!readOnly && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this attachment?')) {
                            onDelete(attachment.name);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {previewAttachment.file_name}
              </h3>
              <button
                onClick={() => setPreviewAttachment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4">
              {isImageFile(previewAttachment) ? (
                <img
                  src={previewAttachment.file_url}
                  alt={previewAttachment.file_name}
                  className="max-w-full max-h-96 object-contain mx-auto"
                />
              ) : (
                <div className="text-center py-8">
                  <FileIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-sm text-gray-600 mb-4">
                    Preview not available for this file type
                  </p>
                  <button
                    onClick={() => handleDownload(previewAttachment)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}