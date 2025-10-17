'use client';

import React, { useState } from 'react';
import { 
  MessageCircleIcon, 
  FileIcon, 
  MailIcon, 
  PhoneIcon,
  UserIcon,
  ClockIcon,
  PlusIcon,
  SendIcon,
  PaperclipIcon,
  EditIcon,
  TrashIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimelineEntry, Attachment } from '@/types';
import { formatDate } from '@/lib/utils';

interface TimelineProps {
  entries: TimelineEntry[];
  attachments: Attachment[];
  onAddComment: (comment: string, attachments?: File[]) => void;
  onAddEmail: (email: { to: string; subject: string; message: string }) => void;
  onDeleteEntry?: (entryId: string) => void;
  readOnly?: boolean;
}

export function Timeline({
  entries,
  attachments,
  onAddComment,
  onAddEmail,
  onDeleteEntry,
  readOnly = false,
}: TimelineProps) {
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [comment, setComment] = useState('');
  const [emailData, setEmailData] = useState({ to: '', subject: '', message: '' });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Combine timeline entries and attachments into a single sorted list
  const timelineItems = React.useMemo(() => {
    const items: Array<{
      type: 'entry' | 'attachment';
      data: TimelineEntry | Attachment;
      timestamp: string;
    }> = [];

    entries.forEach(entry => {
      items.push({
        type: 'entry',
        data: entry,
        timestamp: entry.creation,
      });
    });

    attachments.forEach(attachment => {
      items.push({
        type: 'attachment',
        data: attachment,
        timestamp: attachment.name, // Assuming name contains timestamp info
      });
    });

    return items.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [entries, attachments]);

  const handleAddComment = () => {
    if (!comment.trim()) return;
    
    onAddComment(comment, selectedFiles);
    setComment('');
    setSelectedFiles([]);
    setShowCommentForm(false);
  };

  const handleAddEmail = () => {
    if (!emailData.to || !emailData.subject || !emailData.message) return;
    
    onAddEmail(emailData);
    setEmailData({ to: '', subject: '', message: '' });
    setShowEmailForm(false);
  };

  const getEntryIcon = (communicationType: string) => {
    switch (communicationType) {
      case 'Comment':
        return MessageCircleIcon;
      case 'Email':
        return MailIcon;
      case 'Phone':
        return PhoneIcon;
      case 'File':
        return FileIcon;
      default:
        return MessageCircleIcon;
    }
  };

  const getEntryColor = (communicationType: string) => {
    switch (communicationType) {
      case 'Comment':
        return 'text-blue-600 bg-blue-100';
      case 'Email':
        return 'text-green-600 bg-green-100';
      case 'Phone':
        return 'text-purple-600 bg-purple-100';
      case 'File':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Timeline</h3>
          {!readOnly && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCommentForm(!showCommentForm)}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
              >
                <MessageCircleIcon className="h-4 w-4 mr-1" />
                Comment
              </button>
              <button
                onClick={() => setShowEmailForm(!showEmailForm)}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
              >
                <MailIcon className="h-4 w-4 mr-1" />
                Email
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comment Form */}
      {showCommentForm && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="space-y-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            {/* File attachment */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  multiple
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                  className="hidden"
                  id="comment-files"
                />
                <label
                  htmlFor="comment-files"
                  className="inline-flex items-center px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <PaperclipIcon className="h-4 w-4 mr-1" />
                  Attach Files
                </label>
                {selectedFiles.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {selectedFiles.length} file(s) selected
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowCommentForm(false);
                    setComment('');
                    setSelectedFiles([]);
                  }}
                  className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={!comment.trim()}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SendIcon className="h-4 w-4 mr-1" />
                  Add Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Form */}
      {showEmailForm && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="space-y-3">
            <input
              type="email"
              value={emailData.to}
              onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
              placeholder="To: email@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <input
              type="text"
              value={emailData.subject}
              onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              placeholder="Subject"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <textarea
              value={emailData.message}
              onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
              placeholder="Email message..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  setShowEmailForm(false);
                  setEmailData({ to: '', subject: '', message: '' });
                }}
                className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEmail}
                disabled={!emailData.to || !emailData.subject || !emailData.message}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SendIcon className="h-4 w-4 mr-1" />
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Items */}
      <div className="px-6 py-4">
        {timelineItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircleIcon className="mx-auto h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm">No timeline entries yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {timelineItems.map((item, index) => {
              if (item.type === 'entry') {
                const entry = item.data as TimelineEntry;
                const IconComponent = getEntryIcon(entry.communication_type);
                
                return (
                  <div key={index} className="flex space-x-3">
                    <div className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                      getEntryColor(entry.communication_type)
                    )}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            {entry.owner}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(entry.creation, 'long')}
                          </p>
                        </div>
                        
                        {onDeleteEntry && (
                          <button
                            onClick={() => onDeleteEntry(entry.creation)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="mt-1">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {entry.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              } else {
                const attachment = item.data as Attachment;
                
                return (
                  <div key={index} className="flex space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <FileIcon className="h-4 w-4 text-orange-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            File attached
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(attachment.name, 'long')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-1">
                        <a
                          href={attachment.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          {attachment.file_name}
                        </a>
                        <span className="text-xs text-gray-500 ml-2">
                          ({(attachment.file_size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
}