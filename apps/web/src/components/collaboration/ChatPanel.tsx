'use client';

import { FaceSmileIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useRef, useState } from 'react';
import { useCollaborationContext } from './CollaborationProvider';

interface Message {
  id: string;
  channelId: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  type: 'text' | 'file' | 'system';
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export function ChatPanel() {
  const { messages, typingUsers, sendMessage, startTyping, stopTyping } =
    useCollaborationContext();

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIiew({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      startTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping();
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (inputValue.trim()) {
      sendMessage(inputValue.trim());
      setInputValue('');

      // Stop typing
      if (isTyping) {
        setIsTyping(false);
        stopTyping();
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className='flex flex-col h-full bg-white border-l border-gray-200'>
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b border-gray-200'>
        <h3 className='text-lg font-semibold text-gray-900'>Team Chat</h3>
        <div className='flex items-center space-x-2'>
          <div className='w-2 h-2 bg-green-500 rounded-full'></div>
          <span className='text-sm text-gray-500'>Live</span>
        </div>
      </div>

      {/* Messages */}
      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        {messages.map((message: Message) => (
          <div key={message.id} className='flex space-x-3'>
            <div className='flex-shrink-0'>
              <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium'>
                {message.avatar ? (
                  <img
                    src={message.avatar}
                    alt={message.username}
                    className='w-full h-full rounded-full object-cover'
                  />
                ) : (
                  message.username.charAt(0).toUpperCase()
                )}
              </div>
            </div>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center space-x-2'>
                <span className='text-sm font-medium text-gray-900'>
                  {message.username}
                </span>
                <span className='text-xs text-gray-500'>
                  {formatTime(message.createdAt)}
                </span>
              </div>
              <div className='mt-1'>
                {message.type === 'system' ? (
                  <span className='text-sm text-gray-500 italic'>
                    {message.content}
                  </span>
                ) : (
                  <p className='text-sm text-gray-700'>{message.content}</p>
                )}
              </div>
              {message.metadata?.edited && (
                <span className='text-xs text-gray-400'>(edited)</span>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className='flex items-center space-x-2 text-sm text-gray-500'>
            <div className='flex space-x-1'>
              <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
              <div
                className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                style={{ animationDelay: '0.1s' }}
              ></div>
              <div
                className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                style={{ animationDelay: '0.2s' }}
              ></div>
            </div>
            <span>
              {Array.from(typingUsers).join(', ')}{' '}
              {typingUsers.size === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className='p-4 border-t border-gray-200'>
        <form onSubmit={handleSubmit} className='flex space-x-2'>
          <div className='flex-1 relative'>
            <input
              type='text'
              value={inputValue}
              onChange={handleInputChange}
              placeholder='Type a message...'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
            <button
              type='button'
              className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
            >
              <FaceSmileIcon className='w-5 h-5' />
            </button>
          </div>
          <button
            type='submit'
            disabled={!inputValue.trim()}
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <PaperAirplaneIcon className='w-5 h-5' />
          </button>
        </form>
      </div>
    </div>
  );
}
