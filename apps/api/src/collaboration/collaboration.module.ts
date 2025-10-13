import { Module } from '@nestjs/common';
import { CollaborationGateway } from './collaboration.gateway';
import { CollaborationService } from './collaboration.service';
import { CollaborationResolver } from './collaboration.resolver';
import { DocumentService } from './services/document.service';
import { PresenceService } from './services/presence.service';
import { NotificationService } from './services/notification.service';
import { ChatService } from './services/chat.service';
import { ActivityFeedService } from './services/activity-feed.service';

@Module({
  providers: [
    CollaborationGateway,
    CollaborationService,
    CollaborationResolver,
    DocumentService,
    PresenceService,
    NotificationService,
    ChatService,
    ActivityFeedService,
  ],
  exports: [
    CollaborationService,
    DocumentService,
    PresenceService,
    NotificationService,
    ChatService,
    ActivityFeedService,
  ],
})
export class CollaborationModule {}
