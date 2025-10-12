'use client';

import { type ReactNode, createContext, useContext } from 'react';
import { useCollaboration } from '../../hooks/useCollaboration';

interface CollaborationContextType {
  isConnected: boolean;
  onlineUsers: any[];
  documentState: any;
  messages: any[];
  typingUsers: Set<string>;
  sendOperation: (operation: any) => void;
  sendMessage: (
    content: string,
    type?: 'text' | 'file',
    metadata?: any
  ) => void;
  startTyping: () => void;
  stopTyping: () => void;
  getOnlineUsers: () => void;
}

const CollaborationContext = createContext<CollaborationContextType | null>(
  null
);

interface CollaborationProviderProps {
  children: ReactNode;
  documentId: string;
  channelId: string;
}

export function CollaborationProvider({
  children,
  documentId,
  channelId,
}: CollaborationProviderProps) {
  const collaboration = useCollaboration({ documentId, channelId });

  return (
    <CollaborationContext.Provider value={collaboration}>
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaborationContext() {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error(
      'useCollaborationContext must be used within a CollaborationProvider'
    );
  }
  return context;
}
