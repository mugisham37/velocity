'use client';

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { DocField } from '@/types';
import { cn } from '@/lib/utils';
import { 
  BoldIcon, 
  ItalicIcon, 
  UnderlineIcon, 
  ListIcon, 
  LinkIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon
} from 'lucide-react';

interface TextEditorFieldProps {
  field: DocField;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
}

export function TextEditorField({ field, error, required, readOnly }: TextEditorFieldProps) {
  const { register, setValue, watch } = useFormContext();
  const [isEditorMode, setIsEditorMode] = useState(true);
  const value = watch(field.fieldname) || '';

  const handleCommand = (command: string, value?: string) => {
    if (readOnly) return;
    
    try {
      document.execCommand(command, false, value);
    } catch (error) {
      console.warn('Editor command failed:', command, error);
    }
  };

  const handleContentChange = (event: React.FormEvent<HTMLDivElement>) => {
    const content = event.currentTarget.innerHTML;
    setValue(field.fieldname, content, { shouldDirty: true });
  };

  return (
    <div className="space-y-1">
      <label
        htmlFor={field.fieldname}
        className={cn(
          'block text-sm font-medium text-gray-700',
          required && 'after:content-["*"] after:text-red-500 after:ml-1'
        )}
      >
        {field.label}
      </label>
      
      <div className={cn(
        'border border-gray-300 rounded-md overflow-hidden',
        error && 'border-red-300',
        readOnly && 'bg-gray-50'
      )}>
        {/* Toolbar */}
        {!readOnly && (
          <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleCommand('bold')}
                className="p-1 rounded hover:bg-gray-200 text-gray-600"
                title="Bold"
              >
                <BoldIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleCommand('italic')}
                className="p-1 rounded hover:bg-gray-200 text-gray-600"
                title="Italic"
              >
                <ItalicIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleCommand('underline')}
                className="p-1 rounded hover:bg-gray-200 text-gray-600"
                title="Underline"
              >
                <UnderlineIcon className="h-4 w-4" />
              </button>
            </div>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleCommand('justifyLeft')}
                className="p-1 rounded hover:bg-gray-200 text-gray-600"
                title="Align Left"
              >
                <AlignLeftIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleCommand('justifyCenter')}
                className="p-1 rounded hover:bg-gray-200 text-gray-600"
                title="Align Center"
              >
                <AlignCenterIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleCommand('justifyRight')}
                className="p-1 rounded hover:bg-gray-200 text-gray-600"
                title="Align Right"
              >
                <AlignRightIcon className="h-4 w-4" />
              </button>
            </div>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleCommand('insertUnorderedList')}
                className="p-1 rounded hover:bg-gray-200 text-gray-600"
                title="Bullet List"
              >
                <ListIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = prompt('Enter URL:');
                  if (url) handleCommand('createLink', url);
                }}
                className="p-1 rounded hover:bg-gray-200 text-gray-600"
                title="Insert Link"
              >
                <LinkIcon className="h-4 w-4" />
              </button>
            </div>
            
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditorMode(!isEditorMode)}
                className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                {isEditorMode ? 'HTML' : 'Editor'}
              </button>
            </div>
          </div>
        )}
        
        {/* Editor Content */}
        {isEditorMode ? (
          <div
            contentEditable={!readOnly}
            onInput={handleContentChange}
            dangerouslySetInnerHTML={{ __html: value }}
            className={cn(
              'min-h-[120px] p-3 focus:outline-none',
              readOnly && 'bg-gray-50 text-gray-500 cursor-not-allowed'
            )}
            style={{ minHeight: '120px' }}
          />
        ) : (
          <textarea
            {...register(field.fieldname)}
            readOnly={readOnly}
            rows={6}
            className={cn(
              'w-full p-3 border-0 focus:outline-none resize-none font-mono text-sm',
              readOnly && 'bg-gray-50 text-gray-500 cursor-not-allowed'
            )}
          />
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {field.options && (
        <p className="text-xs text-gray-500">{field.options}</p>
      )}
    </div>
  );
}