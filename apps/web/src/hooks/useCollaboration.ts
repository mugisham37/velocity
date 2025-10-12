'use client';

import { useEffect, useRef, useState } from 'react';
import { Socket, io } from 'socket.io-client';
import { useAuthStore } from '../store/auth-store';

interface CollaborationUser {
  id: string;
  username: string;
  avatar?: string;
}

interface DocumentState {
  id: string;
  content: string;
  revision: number;
  activeUsers: string[];
  lastModified: Date;
  type: string;
}

interface Operation {
  id: string;
  type: 'insert' | 'delete' | 'retain';
  position?: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: Date;
}

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

interface UseCollaborationOptions {
  documentId: string;
  channelId: string;
  autoConnect?: boolean;
}

export function useCollaboration(options: UseCollaborationOptions = { documentId: '', channelId: '' }) {
  const { documentId, channelId, autoConnect = true } = options;
  const { accessToken: token } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<CollaborationUser[]>([]);
  const [documentState, setDocumentState] = useState<DocumentState | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Connection management
  useEffect(() => {
    if (!autoConnect || !token) return;

    const socket = io(`${process.env['NEXT_PUBLIC_API_URL']}/collaboration`, {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to collaboration server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from collaboration server');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    // User presence events
    socket.on('user-online', (user: CollaborationUser) => {
      setOnlineUsers(prev => {
        const exists = prev.find(u => u.id === user.id);
        if (exists) return prev;
        return [...prev, user];
      });
    });

    socket.on('user-offline', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== userId));
    });

    socket.on('online-users', (users: CollaborationUser[]) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, autoConnect]);

  // Document collaboration
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !documentId) return;

    // Join document
    socket.emit('join-document', { documentId, documentType: 'text' });

    // Document events
    socket.on('document-state', (state: DocumentState) => {
      setDocumentState(state);
    });

    socket.on('document-operation', ({ operation, revision, userId: _userId }: {
      operation: Operation;
      revision: number;
      userId: string;
    }) => {
      // Apply operation to local document state
      setDocumentState(prev => {
        if (!prev) return null;

        const newContent = applyOperation(prev.content, operation);
        return {
          ...prev,
          content: newContent,
          revision,
          lastModified: new Date(),
        };
      });
    });

    socket.on('operation-ack', ({ operationId, revision }: {
      operationId: string;
      revision: number;
    }) => {
      // Handle operation acknowledgment
      console.log(`Operation ${operationId} acknowledged with revision ${revision}`);
    });

    socket.on('operation-error', ({ operationId, error }: {
      operationId: string;
      error: string;
    }) => {
      console.error(`Operation ${operationId} failed:`, error);
    });

    socket.on('user-joined-document', ({ userId, username: _username, avatar: _avatar }: {
      userId: string;
      username: string;
      avatar?: string;
    }) => {
      setDocumentState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          activeUsers: [...prev.activeUsers, userId],
        };
      });
    });

    socket.on('user-left-document', ({ userId }: { userId: string }) => {
      setDocumentState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          activeUsers: prev.activeUsers.filter(id => id !== userId),
        };
      });
    });

    return () => {
      socket.emit('leave-document', { documentId });
      socket.off('document-state');
      socket.off('document-operation');
      socket.off('operation-ack');
      socket.off('operation-error');
      socket.off('user-joined-document');
      socket.off('user-left-document');
    };
  }, [documentId]);

  // Chat functionality
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !channelId) return;

    // Join chat channel
    socket.emit('join-chat', { channelId });

    // Chat events
    socket.on('new-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('user-typing', ({ userId: _userId, username }: {
      userId: string;
      username: string;
    }) => {
      setTypingUsers(prev => new Set([...prev, username]));
    });

    socket.on('user-stopped-typing', ({ userId: _userId }: { userId: string }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        // Remove by userId (would need username mapping in real implementation)
        return newSet;
      });
    });

    return () => {
      socket.emit('leave-chat', { channelId });
      socket.off('new-message');
      socket.off('user-typing');
      socket.off('user-stopped-typing');
    };
  }, [channelId]);

  // Helper functions
  const applyOperation = (content: string, operation: Operation): string => {
    switch (operation.type) {
      case 'insert':
        const insertPos = operation.position || 0;
        return content.slice(0, insertPos) + (operation.content || '') + content.slice(insertPos);

      case 'delete':
        const deletePos = operation.position || 0;
        const deleteLength = operation.length || 0;
        return content.slice(0, deletePos) + content.slice(deletePos + deleteLength);

      case 'retain':
        return content;

      default:
        return content;
    }
  };

  const sendOperation = (operation: Omit<Operation, 'id' | 'userId' | 'timestamp'>) => {
    const socket = socketRef.current;
    if (!socket || !documentState) return;

    const fullOperation: Operation = {
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      userId: 'current-user', // Would get from auth store
      timestamp: new Date(),
    };

    socket.emit('document-operation', {
      documentId,
      operation: fullOperation,
      revision: documentState.revision,
    });
  };

  const sendMessage = (content: string, type: 'text' | 'file' = 'text', metadata?: any) => {
    const socket = socketRef.current;
    if (!socket || !channelId) return;

    socket.emit('send-message', {
      channelId,
      content,
      type,
      metadata,
    });
  };

  const startTyping = () => {
    const socket = socketRef.current;
    if (!socket || !channelId) return;

    socket.emit('typing-start', { channelId });
  };

  const stopTyping = () => {
    const socket = socketRef.current;
    if (!socket || !channelId) return;

    socket.emit('typing-stop', { channelId });
  };

  const getOnlineUsers = () => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('get-online-users');
  };

  return {
    // Connection state
    isConnected,

    // Users and presence
    onlineUsers,

    // Document collaboration
    documentState,
    sendOperation,

    // Chat
    messages,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,

    // Utility
    getOnlineUsers,
    socket: socketRef.current,
  };
}
