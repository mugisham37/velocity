import { UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { PubSub } from './utils/pubsub';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { ActivityFeedService } from './services/activity-feed.service';
import { ChatService } from './services/chat.service';
import { DocumentService } from './services/document.service';
import { NotificationService } from './services/notification.service';
import { PresenceService } from './services/presence.service';

const pubSub = new PubSub();

@Resolver()
@UseGuards(JwtAuthGuard)
export class CollaborationResolver {
  constructor(
    private readonly documentService: DocumentService,
    private readonly presenceService: PresenceService,
    private readonly notificationService: NotificationService,
    private readonly chatService: ChatService,
    private readonly activityFeedService: ActivityFeedService
  ) {}

  // Document Collaboration Queries
  @Query(() => String)
  async getDocumentState(
    @Args('documentId') documentId: string,
    @Context() _context: any
  ) {
    const document = await this.documentService.getDocumentState(documentId);
    return JSON.stringify(document);
  }

  @Query(() => [String])
  async getDocumentHistory(
    @Args('documentId') documentId: string,
    @Args('limit', { defaultValue: 50 }) limit: number
  ) {
    const history = await this.documentService.getDocumentHistory(
      documentId,
      limit
    );
    return history.map(op => JSON.stringify(op));
  }

  @Query(() => [String])
  async getActiveUsers(@Args('documentId') documentId: string) {
    return this.documentService.getActiveUsers(documentId);
  }

  // Presence Queries
  @Query(() => String)
  async getOnlineUsers() {
    const users = await this.presenceService.getOnlineUsers();
    return JSON.stringify(users);
  }

  @Query(() => String)
  async getUserPresence(@Args('userId') userId: string) {
    const presence = await this.presenceService.getUserPresence(userId);
    return JSON.stringify(presence);
  }

  @Query(() => String)
  async getPresenceStats() {
    const stats = await this.presenceService.getPresenceStats();
    return JSON.stringify(stats);
  }

  // Chat Queries
  @Query(() => String)
  async getUserChannels(@Context() context: any) {
    const userId = context.req.user.sub;
    const channels = await this.chatService.getUserChannels(userId);
    return JSON.stringify(channels);
  }

  @Query(() => String)
  async getChannel(@Args('channelId') channelId: string) {
    const channel = await this.chatService.getChannel(channelId);
    return JSON.stringify(channel);
  }

  @Query(() => String)
  async getMessages(
    @Args('channelId') channelId: string,
    @Args('limit', { defaultValue: 50 }) limit: number,
    @Args('before', { nullable: true }) before?: string
  ) {
    const messages = await this.chatService.getMessages(
      channelId,
      limit,
      before
    );
    return JSON.stringify(messages);
  }

  @Query(() => String)
  async searchMessages(
    @Args('query') query: string,
    @Args('channelId', { nullable: true }) channelId?: string,
    @Context() context?: any
  ) {
    const userId = context?.req?.user?.sub;
    const messages = await this.chatService.searchMessages(
      query,
      channelId,
      userId
    );
    return JSON.stringify(messages);
  }

  // Activity Feed Queries
  @Query(() => String)
  async getActivityFeed(
    @Args('limit', { defaultValue: 50 }) limit: number,
    @Args('offset', { defaultValue: 0 }) offset: number,
    @Args('entityType', { nullable: true }) entityType?: string,
    @Args('entityId', { nullable: true }) entityId?: string,
    @Context() context?: any
  ) {
    const userId = context.req.user.sub;
    const filter: any = {
      limit,
      offset,
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
    };
    const feed = await this.activityFeedService.getActivityFeed(userId, filter);
    return JSON.stringify(feed);
  }

  @Query(() => String)
  async getEntityActivities(
    @Args('entityType') entityType: string,
    @Args('entityId') entityId: string,
    @Args('limit', { defaultValue: 20 }) limit: number
  ) {
    const activities = await this.activityFeedService.getEntityActivities(
      entityType,
      entityId,
      limit
    );
    return JSON.stringify(activities);
  }

  @Query(() => String)
  async getUserActivities(
    @Args('userId') userId: string,
    @Args('limit', { defaultValue: 20 }) limit: number
  ) {
    const activities = await this.activityFeedService.getUserActivities(
      userId,
      limit
    );
    return JSON.stringify(activities);
  }

  // Notification Queries
  @Query(() => String)
  async getNotificationHistory(
    @Args('limit', { defaultValue: 50 }) limit: number,
    @Context() context: any
  ) {
    const userId = context.req.user.sub;
    const notifications = await this.notificationService.getNotificationHistory(
      userId,
      limit
    );
    return JSON.stringify(notifications);
  }

  @Query(() => String)
  async getUserNotificationPreferences(@Context() context: any) {
    const userId = context.req.user.sub;
    const preferences =
      await this.notificationService.getUserPreferences(userId);
    return JSON.stringify(preferences);
  }

  @Query(() => String)
  async getNotificationStats(@Context() context: any) {
    const userId = context.req.user.sub;
    const stats = await this.notificationService.getNotificationStats(userId);
    return JSON.stringify(stats);
  }

  // Mutations
  @Mutation(() => String)
  async createChannel(
    @Args('name') name: string,
    @Args('type') type: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('members', { type: () => [String], nullable: true })
    members?: string[],
    @Context() context?: any
  ) {
    const userId = context.req.user.sub;
    const channel = await this.chatService.createChannel({
      name,
      type: type as any,
      ...(description && { description }),
      ...(members && { members }),
      createdBy: userId,
    });
    return JSON.stringify(channel);
  }

  @Mutation(() => Boolean)
  async addMemberToChannel(
    @Args('channelId') channelId: string,
    @Args('userId') userId: string,
    @Context() context: any
  ) {
    const addedBy = context.req.user.sub;
    return this.chatService.addMemberToChannel(channelId, userId, addedBy);
  }

  @Mutation(() => Boolean)
  async removeMemberFromChannel(
    @Args('channelId') channelId: string,
    @Args('userId') userId: string,
    @Context() context: any
  ) {
    const removedBy = context.req.user.sub;
    return this.chatService.removeMemberFromChannel(
      channelId,
      userId,
      removedBy
    );
  }

  @Mutation(() => String)
  async updateMessage(
    @Args('messageId') messageId: string,
    @Args('content') content: string,
    @Context() context: any
  ) {
    const userId = context.req.user.sub;
    const message = await this.chatService.updateMessage(
      messageId,
      userId,
      content
    );
    return JSON.stringify(message);
  }

  @Mutation(() => Boolean)
  async deleteMessage(
    @Args('messageId') messageId: string,
    @Context() context: any
  ) {
    const userId = context.req.user.sub;
    return this.chatService.deleteMessage(messageId, userId);
  }

  @Mutation(() => Boolean)
  async addReaction(
    @Args('messageId') messageId: string,
    @Args('emoji') emoji: string,
    @Context() context: any
  ) {
    const userId = context.req.user.sub;
    return this.chatService.addReaction(messageId, userId, emoji);
  }

  @Mutation(() => Boolean)
  async removeReaction(
    @Args('messageId') messageId: string,
    @Args('emoji') emoji: string,
    @Context() context: any
  ) {
    const userId = context.req.user.sub;
    return this.chatService.removeReaction(messageId, userId, emoji);
  }

  @Mutation(() => String)
  async createDirectChannel(
    @Args('userId') userId: string,
    @Context() context: any
  ) {
    const currentUserId = context.req.user.sub;
    const channel = await this.chatService.createDirectChannel(
      currentUserId,
      userId
    );
    return JSON.stringify(channel);
  }

  @Mutation(() => Boolean)
  async updateUserStatus(
    @Args('status') status: string,
    @Context() context: any
  ) {
    const userId = context.req.user.sub;
    await this.presenceService.updateUserStatus(userId, status as any);
    return true;
  }

  @Mutation(() => Boolean)
  async markActivityAsRead(
    @Args('activityId') activityId: string,
    @Context() context: any
  ) {
    const userId = context.req.user.sub;
    return this.activityFeedService.markAsRead(activityId, userId);
  }

  @Mutation(() => Number)
  async markAllActivitiesAsRead(@Context() context: any) {
    const userId = context.req.user.sub;
    return this.activityFeedService.markAllAsRead(userId);
  }

  @Mutation(() => Boolean)
  async subscribeToEntity(
    @Args('entityId') entityId: string,
    @Context() context: any
  ) {
    const userId = context.req.user.sub;
    await this.activityFeedService.subscribeToEntity(userId, entityId);
    return true;
  }

  @Mutation(() => Boolean)
  async unsubscribeFromEntity(
    @Args('entityId') entityId: string,
    @Context() context: any
  ) {
    const userId = context.req.user.sub;
    await this.activityFeedService.unsubscribeFromEntity(userId, entityId);
    return true;
  }

  @Mutation(() => String)
  async sendNotification(
    @Args('userId') userId: string,
    @Args('title') title: string,
    @Args('message') message: string,
    @Args('category') category: string,
    @Args('channels', { type: () => [String] }) channels: string[],
    @Args('priority', { defaultValue: 'medium' }) priority: string
  ) {
    const notificationId = await this.notificationService.sendNotification({
      userId,
      title,
      message,
      category,
      channels,
      priority: priority as any,
    });
    return notificationId;
  }

  @Mutation(() => Boolean)
  async updateNotificationPreferences(
    @Args('preferences') preferences: string,
    @Context() context: any
  ) {
    const userId = context.req.user.sub;
    const parsedPreferences = JSON.parse(preferences);
    await this.notificationService.updateUserPreferences(
      userId,
      parsedPreferences
    );
    return true;
  }

  // Subscriptions (for real-time updates)
  @Subscription(() => String, {
    filter: (payload, variables) => {
      return payload.channelId === variables.channelId;
    },
  })
  messageAdded(@Args('channelId') channelId: string) {
    return pubSub.asyncIterator(`messageAdded.${channelId}`);
  }

  @Subscription(() => String)
  userPresenceChanged(@Args('userId') userId: string) {
    return pubSub.asyncIterator(`presenceChanged.${userId}`);
  }

  @Subscription(() => String)
  activityAdded(@Args('userId') userId: string) {
    return pubSub.asyncIterator(`activityAdded.${userId}`);
  }

  @Subscription(() => String)
  notificationReceived(@Args('userId') userId: string) {
    return pubSub.asyncIterator(`notificationReceived.${userId}`);
  }
}

