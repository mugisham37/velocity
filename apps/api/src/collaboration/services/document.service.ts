import { Injectable, Logger } from '@nestjs/common';

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

interface OperationResult {
  success: boolean;
  transformedOperation?: any;
  newRevision?: number;
  error?: string;
}

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  private documents = new Map<string, DocumentState>();
  private pendingOperations = new Map<string, Operation[]>();

  async getDocumentState(documentId: string): Promise<DocumentState | null> {
    return this.documents.get(documentId) || null;
  }

  async createDocument(
    documentId: string,
    initialContent: string = '',
    type: string = 'text'
  ): Promise<DocumentState> {
    const document: DocumentState = {
      id: documentId,
      content: initialContent,
      revision: 0,
      activeUsers: [],
      lastModified: new Date(),
      type,
    };

    this.documents.set(documentId, document);
    this.pendingOperations.set(documentId, []);

    this.logger.log(`Created document ${documentId} with type ${type}`);
    return document;
  }

  async addUserToDocument(documentId: string, userId: string): Promise<void> {
    const document = this.documents.get(documentId);
    if (!document) {
      // Create document if it doesn't exist
      await this.createDocument(documentId);
      return this.addUserToDocument(documentId, userId);
    }

    if (!document.activeUsers.includes(userId)) {
      document.activeUsers.push(userId);
      this.logger.log(`User ${userId} joined document ${documentId}`);
    }
  }

  async removeUserFromDocument(
    documentId: string,
    userId: string
  ): Promise<void> {
    const document = this.documents.get(documentId);
    if (!document) return;

    document.activeUsers = document.activeUsers.filter(id => id !== userId);
    this.logger.log(`User ${userId} left document ${documentId}`);
  }

  async applyOperation(
    documentId: string,
    operation: Operation,
    clientRevision: number,
    userId: string
  ): Promise<OperationResult> {
    const document = this.documents.get(documentId);
    if (!document) {
      return {
        success: false,
        error: 'Document not found',
      };
    }

    try {
      // Get pending operations that need to be transformed against
      const pendingOps = this.pendingOperations.get(documentId) || [];
      const serverRevision = document.revision;

      // If client is behind, we need to transform the operation
      let transformedOp = operation;

      if (clientRevision < serverRevision) {
        // Transform against all operations since client revision
        const opsToTransformAgainst = pendingOps.slice(clientRevision);

        for (const pendingOp of opsToTransformAgainst) {
          transformedOp = this.transformOperation(transformedOp, pendingOp);
        }
      }

      // Apply the transformed operation to the document
      const newContent = this.applyOperationToContent(
        document.content,
        transformedOp
      );

      // Update document state
      document.content = newContent;
      document.revision += 1;
      document.lastModified = new Date();

      // Store the operation for future transformations
      pendingOps.push({
        ...transformedOp,
        userId,
        timestamp: new Date(),
      });

      // Keep only recent operations (last 100 for performance)
      if (pendingOps.length > 100) {
        pendingOps.splice(0, pendingOps.length - 100);
      }

      this.logger.log(
        `Applied operation to document ${documentId}, new revision: ${document.revision}`
      );

      return {
        success: true,
        transformedOperation: transformedOp,
        newRevision: document.revision,
      };
    } catch (error) {
      this.logger.error(
        `Error applying operation to document ${documentId}:`,
        error
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private transformOperation(op1: Operation, op2: Operation): Operation {
    // Simplified operational transform implementation
    // In a production system, you'd use a more robust OT library

    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position <= op2.position) {
        return op1;
      } else {
        return {
          ...op1,
          position: op1.position + (op2.content?.length || 0),
        };
      }
    }

    if (op1.type === 'insert' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        return op1;
      } else if (op1.position > op2.position + (op2.length || 0)) {
        return {
          ...op1,
          position: op1.position - (op2.length || 0),
        };
      } else {
        return {
          ...op1,
          position: op2.position,
        };
      }
    }

    if (op1.type === 'delete' && op2.type === 'insert') {
      if (op1.position < op2.position) {
        return op1;
      } else {
        return {
          ...op1,
          position: op1.position + (op2.content?.length || 0),
        };
      }
    }

    if (op1.type === 'delete' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        return op1;
      } else if (op1.position >= op2.position + (op2.length || 0)) {
        return {
          ...op1,
          position: op1.position - (op2.length || 0),
        };
      } else {
        // Overlapping deletes - adjust length
        const overlap =
          Math.min(
            op1.position + (op1.length || 0),
            op2.position + (op2.length || 0)
          ) - Math.max(op1.position, op2.position);

        return {
          ...op1,
          position: Math.min(op1.position, op2.position),
          length: (op1.length || 0) - overlap,
        };
      }
    }

    return op1;
  }

  private applyOperationToContent(
    content: string,
    operation: Operation
  ): string {
    switch (operation.type) {
      case 'insert':
        const insertPos = operation.position || 0;
        return (
          content.slice(0, insertPos) +
          (operation.content || '') +
          content.slice(insertPos)
        );

      case 'delete':
        const deletePos = operation.position || 0;
        const deleteLength = operation.length || 0;
        return (
          content.slice(0, deletePos) + content.slice(deletePos + deleteLength)
        );

      case 'retain':
        return content;

      default:
        return content;
    }
  }

  async getDocumentHistory(
    documentId: string,
    limit: number = 50
  ): Promise<Operation[]> {
    const operations = this.pendingOperations.get(documentId) || [];
    return operations.slice(-limit);
  }

  async saveDocument(documentId: string): Promise<void> {
    const document = this.documents.get(documentId);
    if (!document) return;

    // In a real implementation, you would save to database
    this.logger.log(
      `Saved document ${documentId} with revision ${document.revision}`
    );
  }

  async getActiveUsers(documentId: string): Promise<string[]> {
    const document = this.documents.get(documentId);
    return document?.activeUsers || [];
  }
}
