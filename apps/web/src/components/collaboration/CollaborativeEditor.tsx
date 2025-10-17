'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDocumentUpdates } from '@/lib/websocket/hooks';
import { getWebSocketManager } from '@/lib/websocket/manager';
import { Users, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Collaborative Editor Component
 * 
 * Provides real-time collaborative editing capabilities for documents
 * including conflict resolution, user presence, and document locking.
 */

export interface RemoteUpdate {
  type: 'participant_joined' | 'participant_left' | 'participant_status_changed' | 'document_locked' | 'document_unlocked' | 'edit_operation';
  data: {
    participant?: SessionParticipant;
    userId?: string;
    changes?: Partial<SessionParticipant>;
    operation?: EditOperation;
  };
}

export interface CollaborativeSession {
  sessionId: string;
  doctype: string;
  docname: string;
  participants: SessionParticipant[];
  isLocked: boolean;
  lockedBy?: string;
  lastActivity: Date;
}

export interface SessionParticipant {
  userId: string;
  userName: string;
  userImage?: string;
  status: 'viewing' | 'editing';
  cursor?: {
    field: string;
    position: number;
  };
  lastSeen: Date;
}

export interface EditOperation {
  id: string;
  type: 'insert' | 'delete' | 'update';
  field: string;
  value: any;
  oldValue?: any;
  position?: number;
  timestamp: Date;
  userId: string;
}

export type ResolutionType = 'accept_local' | 'accept_remote' | 'merge' | 'manual';

export interface ConflictResolution {
  conflictId: string;
  resolution: ResolutionType;
  operations: EditOperation[];
  resolvedValue?: unknown;
}

export interface Conflict {
  id: string;
  field: string;
  localOperations: EditOperation[];
  remoteOperations: EditOperation[];
  operations?: EditOperation[];
  timestamp: Date;
  resolved: boolean;
  resolution: ResolutionType;
  resolvedValue?: unknown;
}

interface CollaborativeEditorProps {
  doctype: string;
  docname: string;
  children: React.ReactNode;
  onConflict?: (conflict: any) => void;
  onParticipantChange?: (participants: SessionParticipant[]) => void;
}

export function CollaborativeEditor({
  doctype,
  docname,
  children,
  onConflict,
  onParticipantChange,
}: CollaborativeEditorProps) {
  const [session, setSession] = useState<CollaborativeSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingOperations, setPendingOperations] = useState<EditOperation[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [currentConflict, setCurrentConflict] = useState<any>(null);
  
  const wsManager = getWebSocketManager();
  const sessionIdRef = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const {
    isSubscribed,
    lastUpdate,
    conflictData,
    notifyDocumentChange,
    lockDocument,
    unlockDocument,
    resolveConflict,
    hasConflict
  } = useDocumentUpdates(doctype, docname);

  // Initialize collaborative session
  useEffect(() => {
    if (isSubscribed && doctype && docname) {
      const sessionId = sessionIdRef.current;
      
      // Join collaborative session
      wsManager.joinCollaborativeSession(sessionId, doctype, docname);
      
      setSession({
        sessionId,
        doctype,
        docname,
        participants: [],
        isLocked: false,
        lastActivity: new Date(),
      });

      setIsConnected(true);

      // Cleanup on unmount
      return () => {
        wsManager.leaveCollaborativeSession(sessionId);
        setIsConnected(false);
      };
    }
  }, [isSubscribed, doctype, docname, wsManager]);

  // Handle document updates
  useEffect(() => {
    if (lastUpdate) {
      handleRemoteUpdate(lastUpdate);
    }
  }, [lastUpdate]);

  // Handle conflicts
  useEffect(() => {
    if (hasConflict && conflictData) {
      setCurrentConflict(conflictData);
      setShowConflictDialog(true);
      onConflict?.(conflictData);
    }
  }, [hasConflict, conflictData, onConflict]);

  // Handle remote document updates
  const handleRemoteUpdate = useCallback((update: RemoteUpdate) => {
    const { type, data } = update;

    switch (type) {
      case 'participant_joined':
        setSession(prev => {
          if (!prev || !data.participant) return prev;
          return {
            ...prev,
            participants: [...prev.participants, data.participant],
          };
        });
        break;

      case 'participant_left':
        setSession(prev => prev ? {
          ...prev,
          participants: prev.participants.filter(p => p.userId !== data.userId),
        } : null);
        break;

      case 'participant_status_changed':
        setSession(prev => prev ? {
          ...prev,
          participants: prev.participants.map(p =>
            p.userId === data.userId ? { ...p, ...data.changes } : p
          ),
        } : null);
        break;

      case 'document_locked':
        setSession(prev => prev ? {
          ...prev,
          isLocked: true,
          lockedBy: data.userId,
        } : null);
        break;

      case 'document_unlocked':
        setSession(prev => prev ? {
          ...prev,
          isLocked: false,
          lockedBy: undefined,
        } : null);
        break;

      case 'edit_operation':
        if (data.operation) {
          handleRemoteEditOperation(data.operation);
        }
        break;
    }
  }, []);

  // Handle remote edit operations
  const handleRemoteEditOperation = useCallback((operation: EditOperation) => {
    // Apply remote operation to local state
    // This would integrate with your form/document state management
    console.log('Applying remote operation:', operation);
    
    // Check for conflicts with pending local operations
    const conflicts = pendingOperations.filter(localOp => 
      localOp.field === operation.field &&
      Math.abs(localOp.timestamp.getTime() - operation.timestamp.getTime()) < 1000
    );

    if (conflicts.length > 0) {
      // Handle conflict
      handleOperationConflict(operation, conflicts);
    } else {
      // Apply operation directly
      applyOperation(operation);
    }
  }, [pendingOperations]);

  // Handle operation conflicts
  const handleOperationConflict = useCallback((
    remoteOp: EditOperation,
    localOps: EditOperation[]
  ) => {
    const conflict: Conflict = {
      id: `conflict_${Date.now()}`,
      remoteOperations: [remoteOp],
      localOperations: localOps,
      field: remoteOp.field,
      timestamp: new Date(),
      resolved: false,
      resolution: 'accept_remote',
      operations: [],
      resolvedValue: undefined
    };

    setCurrentConflict(conflict);
    setShowConflictDialog(true);
  }, []);

  // Apply edit operation
  const applyOperation = useCallback((operation: EditOperation) => {
    // This would integrate with your form state management
    // For example, updating form values, triggering re-renders, etc.
    console.log('Applying operation:', operation);
  }, []);

  // Send edit operation to other participants
  const sendEditOperation = useCallback((operation: Omit<EditOperation, 'id' | 'timestamp' | 'userId'>) => {
    if (!session) return;

    const fullOperation: EditOperation = {
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId: 'current_user', // Replace with actual user ID
    };

    // Add to pending operations
    setPendingOperations(prev => [...prev, fullOperation]);

    // Send to other participants
    wsManager.sendEditOperation(session.sessionId, {
      type: fullOperation.type,
      field: fullOperation.field,
      value: fullOperation.value,
      position: fullOperation.position,
      metadata: {
        operationId: fullOperation.id,
        timestamp: fullOperation.timestamp,
      },
    });

    // Remove from pending after a delay (assuming it was processed)
    setTimeout(() => {
      setPendingOperations(prev => prev.filter(op => op.id !== fullOperation.id));
    }, 5000);
  }, [session, wsManager]);

  // Update participant status
  const updateParticipantStatus = useCallback((status: 'viewing' | 'editing') => {
    if (!session) return;

    wsManager.updateDocumentStatus(doctype, docname, status, {
      sessionId: session.sessionId,
      timestamp: new Date(),
    });
  }, [session, doctype, docname, wsManager]);

  // Handle conflict resolution
  const handleConflictResolution = useCallback((resolution: ConflictResolution) => {
    if (!currentConflict) return;

    resolveConflict(resolution.resolution === 'accept_local' ? 'accept' : 'reject');
    
    setShowConflictDialog(false);
    setCurrentConflict(null);

    // Apply resolved value if provided
    if (resolution.resolvedValue !== undefined) {
      applyOperation({
        id: `resolved_${Date.now()}`,
        type: 'update',
        field: currentConflict.field,
        value: resolution.resolvedValue,
        timestamp: new Date(),
        userId: 'current_user',
      });
    }
  }, [currentConflict, resolveConflict, applyOperation]);

  // Notify participants when component updates
  useEffect(() => {
    if (session?.participants) {
      onParticipantChange?.(session.participants);
    }
  }, [session?.participants, onParticipantChange]);

  return (
    <div className="relative">
      {/* Collaboration Status Bar */}
      {isConnected && session && (
        <CollaborationStatusBar
          session={session}
          onLockToggle={() => session.isLocked ? unlockDocument() : lockDocument()}
          onStatusChange={updateParticipantStatus}
        />
      )}

      {/* Main Content */}
      <div className={session?.isLocked ? 'pointer-events-none opacity-75' : ''}>
        {children}
      </div>

      {/* Conflict Resolution Dialog */}
      <ConflictResolutionDialog
        isOpen={showConflictDialog}
        conflict={currentConflict}
        onResolve={handleConflictResolution}
        onClose={() => setShowConflictDialog(false)}
      />

      {/* Document Lock Overlay */}
      {session?.isLocked && session.lockedBy !== 'current_user' && (
        <DocumentLockOverlay
          lockedBy={session.lockedBy}
          onRequestUnlock={() => {
            // Send unlock request
            wsManager.sendEditOperation(session.sessionId, {
              type: 'update',
              field: '_unlock_request',
              value: true,
            });
          }}
        />
      )}
    </div>
  );
}

/**
 * Collaboration Status Bar Component
 */
interface CollaborationStatusBarProps {
  session: CollaborativeSession;
  onLockToggle: () => void;
  onStatusChange: (status: 'viewing' | 'editing') => void;
}

function CollaborationStatusBar({
  session,
  onLockToggle,
  onStatusChange,
}: CollaborationStatusBarProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-blue-50 border-b border-blue-200 text-sm">
      <div className="flex items-center space-x-4">
        {/* Participants */}
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-blue-600" />
          <span className="text-blue-700">
            {session.participants.length} participant{session.participants.length !== 1 ? 's' : ''}
          </span>
          
          {/* Participant Avatars */}
          <div className="flex -space-x-1">
            {session.participants.slice(0, 3).map((participant) => (
              <div
                key={participant.userId}
                className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs border-2 border-white"
                title={participant.userName}
              >
                {participant.userName.charAt(0).toUpperCase()}
              </div>
            ))}
            {session.participants.length > 3 && (
              <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs border-2 border-white">
                +{session.participants.length - 3}
              </div>
            )}
          </div>
        </div>

        {/* Status Selector */}
        <select
          onChange={(e) => onStatusChange(e.target.value as any)}
          className="text-xs border border-blue-300 rounded px-2 py-1 bg-white"
        >
          <option value="viewing">Viewing</option>
          <option value="editing">Editing</option>
        </select>
      </div>

      {/* Lock Toggle */}
      <button
        onClick={onLockToggle}
        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
          session.isLocked
            ? 'bg-red-100 text-red-700 hover:bg-red-200'
            : 'bg-green-100 text-green-700 hover:bg-green-200'
        }`}
      >
        {session.isLocked ? (
          <>
            <Lock className="h-3 w-3" />
            <span>Locked</span>
          </>
        ) : (
          <>
            <Unlock className="h-3 w-3" />
            <span>Unlocked</span>
          </>
        )}
      </button>
    </div>
  );
}

/**
 * Conflict Resolution Dialog Component
 */
interface ConflictResolutionDialogProps {
  isOpen: boolean;
  conflict: unknown;
  onResolve: (resolution: ConflictResolution) => void;
  onClose: () => void;
}

function ConflictResolutionDialog({
  isOpen,
  conflict,
  onResolve,
  onClose,
}: ConflictResolutionDialogProps) {
  if (!isOpen || !conflict) return null;

  const currentConflict = conflict as Conflict;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
      >
        <div className="flex items-center space-x-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold">Editing Conflict</h3>
        </div>

        <p className="text-gray-600 mb-4">
          Another user has modified the same field. Choose how to resolve this conflict:
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              onResolve({
                conflictId: currentConflict.id,
                operations: currentConflict.localOperations,
                resolution: 'accept_local',
              });
            }}
            className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="font-medium">Keep my changes</div>
            <div className="text-sm text-gray-500">Discard the other user&apos;s changes</div>
          </button>

          <button
            type="button"
            onClick={() => {
              onResolve({
                conflictId: currentConflict.id,
                operations: currentConflict.remoteOperations,
                resolution: 'accept_remote',
              });
            }}
            className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="font-medium">Accept their changes</div>
            <div className="text-sm text-gray-500">Discard my changes</div>
          </button>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Document Lock Overlay Component
 */
interface DocumentLockOverlayProps {
  lockedBy?: string;
  onRequestUnlock: () => void;
}

function DocumentLockOverlay({ lockedBy, onRequestUnlock }: DocumentLockOverlayProps) {
  return (
    <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
        <Lock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-2">Document Locked</h3>
        <p className="text-gray-600 mb-4">
          This document is currently being edited by {lockedBy || 'another user'}.
        </p>
        <button
          onClick={onRequestUnlock}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Request Access
        </button>
      </div>
    </div>
  );
}