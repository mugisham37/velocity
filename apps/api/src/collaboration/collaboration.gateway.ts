import { Logger, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CollaborationService } from './collaboration.service';
import { ChatService } from './services/chat.service';
import { DocumentService } from './services/document.service';
import { PresenceService } from './services/presence.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/collaboration',
})
@UseGuards(JwtAuthGuard)
export class CollaborationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CollaborationGateway.name);

  constructor(
    private readonly collaborationService: CollaborationService,
    private readonly presenceService: PresenceService,
    private readonly documentService: DocumentService,
    private readonly chatService: ChatService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const user = await this.collaborationService.authenticateSocket(client);
      if (!user) {
        client.disconnect();
        return;
      }

      client.data.user = user;
      await this.presenceService.setUserOnline(user.id, client.id);

      this.logger.log(`User ${user.id} connected with socket ${client.id}`);

      // Notify others about user coming online
      client.broadcast.emit('user-online', {
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
      });
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  asdleDisconnect(client: Socket) {
    if (client.data.user) {
      await this.presenceService.setUserOffline(client.data.user.id, client.id);

      // Notify others about user going offline
      client.broadcast.emit('user-offline', {
        userId: client.data.user.id,
      });

      this.logger.log(`User ${client.data.user.id} disconnected`);
    }
  }

  // Document collaboration events
  @SubscribeMessage('join-document')
  async handleJoinDocument(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { documentId: string; documentType: string }
  ) {
    const { documentId, documentType } = data;
    const user = client.data.user;

    await client.join(`document:${documentId}`);
    await this.documentService.addUserToDocument(documentId, user.id);

    // Notify others in the document
    client.to(`document:${documentId}`).emit('user-joined-document', {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      documentId,
    });

    // Send current document state to the joining user
    const documentState =
      await this.documentService.getDocumentState(documentId);
    client.emit('document-state', documentState);
  }

  @SubscribeMessage('leave-document')
  async handleLeaveDocument(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { documentId: string }
  ) {
    const { documentId } = data;
    const user = client.data.user;

    await client.leave(`document:${documentId}`);
    await this.documentService.removeUserFromDocument(documentId, user.id);

    // Notify others in the document
    client.to(`document:${documentId}`).emit('user-left-document', {
      userId: user.id,
      documentId,
    });
  }

  @SubscribeMessage('document-operation')
  async handleDocumentOperation(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      documentId: string;
      operation: any;
      revision: number;
    }
  ) {
    const { documentId, operation, revision } = data;
    const user = client.data.user;

    try {
      const result = await this.documentService.applyOperation(
        documentId,
        operation,
        revision,
        user.id
      );

      if (result.success) {
        // Broadcast the transformed operation to other users
        client.to(`document:${documentId}`).emit('document-operation', {
          operation: result.transformedOperation,
          revision: result.newRevision,
          userId: user.id,
        });

        // Send acknowledgment to the sender
        client.emit('operation-ack', {
          operationId: operation.id,
          revision: result.newRevision,
        });
      } else {
        // Send error to the sender
        client.emit('operation-error', {
          operationId: operation.id,
          error: result.error,
        });
      }
    } catch (error) {
      this.logger.error('Document operation error:', error);
      client.emit('operation-error', {
        operationId: operation.id,
        error: 'Internal server error',
      });
    }
  }

  // Chat events
  @SubscribeMessage('join-chat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string }
  ) {
    const { channelId } = data;
    await client.join(`chat:${channelId}`);
  }

  @SubscribeMessage('leave-chat')
  async handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string }
  ) {
    const { channelId } = data;
    await client.leave(`chat:${channelId}`);
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      channelId: string;
      content: string;
      type: 'text' | 'file' | 'system';
      metadata?: any;
    }
  ) {
    const user = client.data.user;
    const message = await this.chatService.createMessage({
      channelId: data.channelId,
      userId: user.id,
      content: data.content,
      type: data.type,
      metadata: data.metadata,
    });

    // Broadcast message to all users in the channel
    this.server.to(`chat:${data.channelId}`).emit('new-message', message);
  }

  @SubscribeMessage('typing-start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string }
  ) {
    const user = client.data.user;
    client.to(`chat:${data.channelId}`).emit('user-typing', {
      userId: user.id,
      username: user.username,
      channelId: data.channelId,
    });
  }

  @SubscribeMessage('typing-stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string }
  ) {
    const user = client.data.user;
    client.to(`chat:${data.channelId}`).emit('user-stopped-typing', {
      userId: user.id,
      channelId: data.channelId,
    });
  }

  // Presence events
  @SubscribeMessage('get-online-users')
  async handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    const onlineUsers = await this.presenceService.getOnlineUsers();
    client.emit('online-users', onlineUsers);
  }

  // Utility methods for other services to emit events
  async emitToUser(userId: string, event: string, data: any) {
    const socketIds = await this.presenceService.getUserSockets(userId);
    socketIds.forEach(socketId => {
      this.server.to(socketId).emit(event, data);
    });
  }

  async emitToDocument(documentId: string, event: string, data: any) {
    this.server.to(`document:${documentId}`).emit(event, data);
  }

  async emitToChannel(channelId: string, event: string, data: any) {
    this.server.to(`chat:${channelId}`).emit(event, data);
  }
}
