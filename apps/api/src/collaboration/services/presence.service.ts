import { Injectable, Logger } from '@nestjs/common';

interface UserPresence {
  userId: string;
  username: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  socketIds: string[];
  currentDocument?: string;
  currentActivity?: string;
}

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);
  private userPresence = new Map<string, UserPresence>();
  private socketToUser = new Map<string, string>();

  async setUserOnline(
    userId: string,
    socketId: string,
    userInfo?: Partial<UserPresence>
  ): Promise<void> {
    let presence = this.userPresence.get(userId);

    if (!presence) {
      presence = {
        userId,
        username: userInfo?.username || `User ${userId}`,
        avatar: userInfo?.avatar,
        status: 'online',
        lastSeen: new Date(),
        socketIds: [],
      };
    }

    presence.status = 'online';
    presence.lastSeen = new Date();

    if (!presence.socketIds.includes(socketId)) {
      presence.socketIds.push(socketId);
    }

    this.userPresence.set(userId, presence);
    this.socketToUser.set(socketId, userId);

    this.logger.log(`User ${userId} is now online with socket ${socketId}`);
  }

  async setUserOffline(userId: string, socketId: string): Promise<void> {
    const presence = this.userPresence.get(userId);
    if (!presence) return;

    // Remove the socket ID
    presence.socketIds = presence.socketIds.filter(id => id !== socketId);
    this.socketToUser.delete(socketId);

    // If no more sockets, set user offline
    if (presence.socketIds.length === 0) {
      presence.status = 'offline';
      presence.lastSeen = new Date();
      presence.currentDocument = undefined;
      presence.currentActivity = undefined;
    }

    this.userPresence.set(userId, presence);
    this.logger.log(`User ${userId} socket ${socketId} disconnected`);
  }

  async updateUserStatus(
    userId: string,
    status: UserPresence['status']
  ): Promise<void> {
    const presence = this.userPresence.get(userId);
    if (!presence) return;

    presence.status = status;
    presence.lastSeen = new Date();
    this.userPresence.set(userId, presence);

    this.logger.log(`User ${userId} status updated to ${status}`);
  }

  async setUserActivity(
    userId: string,
    activity: string,
    documentId?: string
  ): Promise<void> {
    const presence = this.userPresence.get(userId);
    if (!presence) return;

    presence.currentActivity = activity;
    presence.currentDocument = documentId;
    presence.lastSeen = new Date();
    this.userPresence.set(userId, presence);
  }

  async getUserPresence(userId: string): Promise<UserPresence | null> {
    return this.userPresence.get(userId) || null;
  }

  async getOnlineUsers(): Promise<UserPresence[]> {
    return Array.from(this.userPresence.values()).filter(
      presence => presence.status === 'online' && presence.socketIds.length > 0
    );
  }

  async getUsersInDocument(documentId: string): Promise<UserPresence[]> {
    return Array.from(this.userPresence.values()).filter(
      presence =>
        presence.currentDocument === documentId && presence.status === 'online'
    );
  }

  async getUserSockets(userId: string): Promise<string[]> {
    const presence = this.userPresence.get(userId);
    return presence?.socketIds || [];
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const presence = this.userPresence.get(userId);
    return presence?.status === 'online' && presence.socketIds.length > 0;
  }

  async getPresenceStats(): Promise<{
    totalUsers: number;
    onlineUsers: number;
    awayUsers: number;
    busyUsers: number;
    offlineUsers: number;
  }> {
    const allUsers = Array.from(this.userPresence.values());

    return {
      totalUsers: allUsers.length,
      onlineUsers: allUsers.filter(u => u.status === 'online').length,
      awayUsers: allUsers.filter(u => u.status === 'away').length,
      busyUsers: allUsers.filter(u => u.status === 'busy').length,
      offlineUsers: allUsers.filter(u => u.status === 'offline').length,
    };
  }

  async cleanupStalePresence(): Promise<void> {
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [userId, presence] of this.userPresence.entries()) {
      if (now.getTime() - presence.lastSeen.getTime() > staleThreshold) {
        if (presence.status !== 'offline') {
          presence.status = 'offline';
          presence.socketIds = [];
          presence.currentDocument = undefined;
          presence.currentActivity = undefined;
          this.userPresence.set(userId, presence);

          this.logger.log(`Cleaned up stale presence for user ${userId}`);
        }
      }
    }
  }

  // Run cleanup every 5 minutes
  constructor() {
    setInterval(
      () => {
        this.cleanupStalePresence();
      },
      5 * 60 * 1000
    );
  }
}
