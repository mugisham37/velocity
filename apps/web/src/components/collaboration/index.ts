/**
 * Collaborative Features Module
 * 
 * This module provides real-time collaborative editing capabilities
 * including document synchronization, conflict resolution, and user presence.
 */

export { CollaborativeEditor } from './CollaborativeEditor';

export type {
  CollaborativeSession,
  SessionParticipant,
  EditOperation,
  ConflictResolution,
} from './CollaborativeEditor';