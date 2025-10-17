'use client';

import React, { useState, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { DocField } from '@/types';
import { cn } from '@/lib/utils';
import { 
  UploadIcon, 
  FileIcon, 
  ImageIcon, 
  XIcon, 
  DownloadIcon,
  EyeIcon,
  Loader2Icon
} from 'lucide-react';

interface AttachFieldProps {
  field: DocField;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadProgress?: number;
}

export function AttachField({ field, error, required, readOnly }: AttachFieldProps) {
  const { setValue, watch } = useFormContext();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const value = watch(field.fieldname);
  const fileInfo: FileInfo | null = value ? JSON.parse(value) : null;

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0 || readOnly) return;
    
    const file = files[0];
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }
    
    // Create file info object
    const newFileInfo: FileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      uploadProgress: 0,
    };
    
    setValue(field.fieldname, JSON.stringify(newFileInfo), { shouldDirty: true });
    
    // Simulate file upload
    simulateUpload(file, newFileInfo);
  };

  const simulateUpload = async (file: File, fileInfo: FileInfo) => {
    setUploadProgress(0);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    
    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadProgress(progress);
      
      const updatedFileInfo = { ...fileInfo, uploadProgress: progress };
      if (progress === 100) {
        updatedFileInfo.url = `/api/files/${file.name}`;
        delete updatedFileInfo.uploadProgress;
      }
      setValue(field.fieldname, JSON.stringify(updatedFileInfo), { shouldDirty: true });
    }
    
    setUploadProgress(null);
  };

  const handleRemoveFile = () => {
    if (readOnly) return;
    
    setValue(field.fieldname, '', { shouldDirty: true });
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    return FileIcon;
  };

  return (
    <div className="space-y-1">
      <label
        className={cn(
          'block text-sm font-medium text-gray-700',
          required && 'after:content-["*"] after:text-red-500 after:ml-1'
        )}
      >
        {field.label}
      </label>
      
      {!fileInfo ? (
        // Upload area
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
            isDragOver && 'border-blue-400 bg-blue-50',
            !isDragOver && 'border-gray-300 hover:border-gray-400',
            readOnly && 'bg-gray-50 cursor-not-allowed',
            error && 'border-red-300'
          )}
        >
          <UploadIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            {readOnly ? 'No file attached' : 'Drop files here or click to browse'}
          </p>
          {!readOnly && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Choose File
              </button>
              <p className="text-xs text-gray-500 mt-1">
                Maximum file size: 10MB
              </p>
            </>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={readOnly}
          />
        </div>
      ) : (
        // File preview
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            {/* File icon or image preview */}
            <div className="flex-shrink-0">
              {previewUrl && fileInfo.type.startsWith('image/') ? (
                <img
                  src={previewUrl}
                  alt={fileInfo.name}
                  className="h-12 w-12 object-cover rounded"
                />
              ) : (
                <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                  {React.createElement(getFileIcon(fileInfo.type), {
                    className: "h-6 w-6 text-gray-500"
                  })}
                </div>
              )}
            </div>
            
            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {fileInfo.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(fileInfo.size)}
              </p>
              
              {/* Upload progress */}
              {uploadProgress !== null && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{uploadProgress}%</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-1">
              {fileInfo.url && (
                <>
                  <button
                    type="button"
                    onClick={() => window.open(fileInfo.url, '_blank')}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded"
                    title="Preview"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = fileInfo.url!;
                      link.download = fileInfo.name;
                      link.click();
                    }}
                    className="p-1 text-gray-400 hover:text-green-600 rounded"
                    title="Download"
                  >
                    <DownloadIcon className="h-4 w-4" />
                  </button>
                </>
              )}
              {uploadProgress !== null && (
                <Loader2Icon className="h-4 w-4 text-blue-600 animate-spin" />
              )}
              {!readOnly && (
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                  title="Remove file"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {field.options && (
        <p className="text-xs text-gray-500">{field.options}</p>
      )}
    </div>
  );
}