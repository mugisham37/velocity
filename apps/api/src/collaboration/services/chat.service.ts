import { Injectable, Logger } from '@nestjs/common';

interface ChatChannel {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'direct' | 'project' | 'department';
  members: string[];
  admins: string[];
  createdBy: string;
  createdAt: Date;
  lastActivity: Date;
  metadata?: {
    projectId?: string;
    departmentId?: string;
    relatedEntity?: {
      type: string;
      id: string;
    };
  };
}

interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  type: 'text' | 'file' | 'system' | 'reaction';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    fileUrl?: string;
    replyTo?: string;
    reactions?: { [emoji: string]: string[] };
    mentions?: string[];
    edited?: boolean;
    editedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface CreateMessageDto {
  channelId: string;
  userId: string;
  content: string;
  type: 'text' | 'file' | 'system';
  metadata?: any;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private channels = new Map<string, ChatChannel>();
  private messages = new Map<string, ChatMessage[]>();

  async createChannel(data: {
    name: string;
    description?: string;
    type: ChatChannel['type'];
    createdBy: string;
    members?: string[];
    metadata?: ChatChannel['metadata'];
  }): Promise<ChatChannel> {
    const id = this.generateId();
    const channel: ChatChannel = {
      id,
      name: data.name,
      description: data.description || '',
      type: data.type,
      members: data.members || [data.createdBy],
      admins: [data.createdBy],
      createdBy: data.createdBy,
      createdAt: new Date(),
      lastActivity: new Date(),
      metadata: data.metadata || {},
    };

    this.channels.set(id, channel);
    this.messages.set(id, []);

    this.logger.log(`Created ${data.type} channel: ${data.name} (${id})`);
    return channel;
  }

  async getChannel(channelId: string): Promise<ChatChannel | null> {
    return this.channels.get(channelId) || null;
  }

  async getUserChannels(userId: string): Promise<ChatChannel[]> {
    return Array.from(this.channels.values()).filter(channel =>
      channel.members.includes(userId)
    );
  }

  async addMemberToChannel(channelId: string, userId: string, addedBy: string): Promise<boolean> {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    // Check if user has permission to add members
    if (!channel.admins.includes(addedBy) && channel.type === 'private') {
      return false;
    }
    if (!channel.members.includes(userId)) {
      channel.members.push(userId);
      channel.lastActivity = new Date();

      // Add system message
      await this.createMessage({
        channelId,
        userId: 'system',
        content: `User ${userId} was added to the channel`,
        type: 'system',
      });

      this.logger.log(`Added user ${userId} to channel ${channelId}`);
    }

    return true;
  }

  async removeMemberFromChannel(channelId: string, userId: string, removedBy: string): Promise<boolean> {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    // Check permissions
    if (!channel.admins.includes(removedBy) && removedBy !== userId) {
      return false;
    }

    channel.members = channel.members.filter(id => id !== userId);
    channel.lastActivity = new Date();

    // Add system message
    await this.createMessage({
      channelId,
      userId: 'system',
      content: `User ${userId} left the channel`,
      type: 'system',
    });

    this.logger.log(`Removed user ${userId} from channel ${channelId}`);
    return true;
  }

  async createMessage(data: CreateMessageDto): Promise<ChatMessage> {
    const channel = this.channels.get(data.channelId);
    if (!channel) {
      throw new Error('Channel not found');
    }

    // Check if user is member of the channel
    if (data.userId !== 'system' && !channel.members.includes(data.userId)) {
      throw new Error('User is not a member of this channel');
    }

    const id = this.generateId();
    const message: ChatMessage = {
      id,
      channelId: data.channelId,
      userId: data.userId,
      username: data.userId === 'system' ? 'System' : `User ${data.userId}`, // In real app, get from user service
      content: data.content,
      type: data.type,
      metadata: data.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const channelMessages = this.messages.get(data.channelId) || [];
    channelMessages.push(message);
    this.messages.set(data.channelId, channelMessages);

    // Update channel last activity
    channel.lastActivity = new Date();

    this.logger.log(`Message created in channel ${data.channelId} by user ${data.userId}`);
    return message;
  }

  async getMessages(channelId: string, limit: number = 50, before?: string): Promise<ChatMessage[]> {
    const messages = this.messages.get(channelId) || [];

    let filteredMessages = messages;
    if (before) {
      const beforeIndex = messages.findIndex(m => m.id === before);
      if (beforeIndex > 0) {
        filteredMessages = messages.slice(0, beforeIndex);
      }
    }

    return filteredMessages
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .reverse();
  }

  async updateMessage(messageId: string, userId: string, content: string): Promise<ChatMessage | null> {
    for (const [_channelId, messages] of this.messages.entries()) {
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        const message = messages[messageIndex];
        if (!message) return null;

        // Check if user can edit this message
        if (message.userId !== userId) {
          return null;
        }

        message.content = content;
        message.updatedAt = new Date();
        message.metadata = {
          ...message.metadata,
          edited: true,
          editedAt: new Date(),
        };

        this.logger.log(`Message ${messageId} updated by user ${userId}`);
        return message;
      }
    }

    return null;
  }

  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    for (const [channelId, messages] of this.messages.entries()) {
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        const message = messages[messageIndex];
        if (!message) return false;

        // Check if user can delete this message
        const channel = this.channels.get(channelId);
        if (message.userId !== userId && !channel?.admins.includes(userId)) {
          return false;
        }

        messages.splice(messageIndex, 1);
        this.logger.log(`Message ${messageId} deleted by user ${userId}`);
        return true;
      }
    }

    return false;
  }

  async addReaction(messageId: string, userId: string, emoji: string): Promise<boolean> {
    for (const [_channelId, messages] of this.messages.entries()) {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        if (!message.metadata) {
          message.metadata = {};
        }
        if (!message.metadata.reactions) {
          message.metadata.reactions = {};
        }
        if (!message.metadata.reactions[emoji]) {
          message.metadata.reactions[emoji] = [];
        }

        if (!message.metadata.reactions[emoji]!.includes(userId)) {
          message.metadata.reactions[emoji]!.push(userId);
          this.logger.log(`User ${userId} added reaction ${emoji} to message ${messageId}`);
        }

        return true;
      }
    }

    return false;
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<boolean> {
    for (const [_channelId, messages] of this.messages.entries()) {
      const message = messages.find(m => m.id === messageId);
      if (message?.metadata?.reactions?.[emoji]) {
        message.metadata.reactions[emoji] = message.metadata.reactions[emoji]!.filter(
          id => id !== userId
        );

        if (message.metadata.reactions[emoji]!.length === 0) {
          delete message.metadata.reactions[emoji];
        }

        this.logger.log(`User ${userId} removed reaction ${emoji} from message ${messageId}`);
        return true;
      }
    }

    return false;
  }

  async searchMessages(query: string, channelId?: string, userId?: string): Promise<ChatMessage[]> {
    const allMessages: ChatMessage[] = [];

    for (const [cId, messages] of this.messages.entries()) {
      if (channelId && cId !== channelId) continue;

      const filteredMessages = messages.filter(message => {
        if (userId && message.userId !== userId) return false;
        return message.content.toLowerCase().includes(query.toLowerCase());
      });

      allMessages.push(...filteredMessages);
    }

    return allMessages
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 100);
  }

  async getChannelStats(channelId: string): Promise<{
    totalMessages: number;
    activeMembers: number;
    lastActivity: Date;
    messagesByType: { [type: string]: number };
  } | null> {
    const channel = this.channels.get(channelId);
    const messages = this.messages.get(channelId);

    if (!channel || !messages) return null;

    const messagesByType = messages.reduce((acc, message) => {
      acc[message.type] = (acc[message.type] || 0) + 1;
      return acc;
    }, {} as { [type: string]: number });

    // Get active members (members who sent messages in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeMembers = new Set(
      messages
        .filter(m => m.createdAt > thirtyDaysAgo)
        .map(m => m.userId)
    ).size;

    return {
      totalMessages: messages.length,
      activeMembers,
      lastActivity: channel.lastActivity,
      messagesByType,
    };
  }

  async createDirectChannel(user1Id: string, user2Id: string): Promise<ChatChannel> {
    // Check if direct channel already exists
    const existingChannel = Array.from(this.channels.values()).find(
      channel =>
        channel.type === 'direct' &&
        channel.members.length === 2 &&
        channel.members.includes(user1Id) &&
        channel.members.includes(user2Id)
    );

    if (existingChannel) {
      return existingChannel;
    }

    return this.createChannel({
      name: `Direct: ${user1Id} & ${user2Id}`,
      type: 'direct',
      createdBy: user1Id,
      members: [user1Id, user2Id],
    });
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
