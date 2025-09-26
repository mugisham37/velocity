'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useCollaborationContext } from './CollaborationProvider';

interface CollaborativeEditorProps {
  documentId: string;
  initialContent?: string;
  placeholder?: string;
  className?: string;
}

export function CollaborativeEditor({
  documentId,
  initialContent = '',
  placeholder = 'Start typing...',
  className = '',
}: CollaborativeEditorProps) {
  const { documentState, sendOperation } = useCollaborationContext();
  const [content, setContent] = useState(initialContent);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastRevisionRef = useRef(0);

  // Update content when document state changes
  useEffect(() => {
    if (documentState && documentState.revision > lastRevisionRef.current) {
      setContent(documentState.content);
      lastRevisionRef.current = documentState.revision;
    }
  }, [documentState]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const oldContent = content;

    // Calculate the operation
    const operation = calculateOperation(
      oldContent,
      newContent,
      cursorPosition
    );

    if (operation) {
      // Update local state immediately for responsiveness
      setContent(newContent);

      // Send operation to server
      sendOperation(operation);
    }
  };

  const handleSelectionChange = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  };

  const calculateOperation = (
    oldText: string,
    newText: string,
    position: number
  ) => {
    // Simple diff algorithm - in production, you'd use a more sophisticated one
    if (newText.length > oldText.length) {
      // Insertion
      const insertedText = newText.slice(
        position,
        position + (newText.length - oldText.length)
      );
      return {
        type: 'insert' as const,
        position,
        content: insertedText,
      };
    } else if (newText.length < oldText.length) {
      // Deletion
      const deletedLength = oldText.length - newText.length;
      return {
        type: 'delete' as const,
        position,
        length: deletedLength,
      };
    }

    return null;
  };

  return (
    <div className={`relative ${className}`}>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleTextChange}
        onSelect={handleSelectionChange}
        placeholder={placeholder}
        className='w-full h-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm'
        style={{ minHeight: '400px' }}
      />

      {/* Document info */}
      {documentState && (
        <div className='absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded border'>
          Rev: {documentState.revision} | Users:{' '}
          {documentState.activeUsers?.length || 0} | Last modified:{' '}
          {new Date(documentState.lastModified).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
